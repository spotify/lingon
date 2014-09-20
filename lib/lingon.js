var chalk                 = require('chalk');
var es                    = require('event-stream');
var vfs                   = require('vinyl-fs');
var path                  = require('path');
var EventEmitter          = require('event-emitter');

var defaultConfig         = require('./defaults/config');
var log                   = require('./utils/log');
var Environment           = require('./environment');
var ProcessorStore        = require('./models/processorStore');
var defaultProcessors     = require('./defaults/defaultProcessors');
var defaultExtensionMap   = require('./defaults/defaultExtensionMap');
var help                  = require('./utils/help');
var buildTask             = require('./tasks/build');
var cleanTask             = require('./tasks/clean');
var serverTask            = require('./tasks/server');
var Builder               = require('./builder');

var Lingon = function(rootPath, argv) {
  this.eventEmitter = new EventEmitter();

  this.rootPath = rootPath;
  // Configuration defaults
  this.config = defaultConfig;

  //Expose features for plugins
  this.argv = argv;
  this.log = log;

  this.server = null;

  this.global = {};

  this.preProcessors = new ProcessorStore(defaultProcessors.pre);
  this.postProcessors = new ProcessorStore(defaultProcessors.post);

  this.extensionRewrites = defaultExtensionMap;

  // Tasks
  this.defaultTask = null;
  this.task = null;
  this.taskCallbacks = {};
  this.taskQueue = [];

  // Set up default tasks
  buildTask(this);
  serverTask(this);
  cleanTask(this);

  // Set up default help
  help.describe('help', {
    message: 'Shows this list'
  });

  help.describe('version', {
    message: 'Display Lingon version'
  });
};


Lingon.prototype.getEnvironment = function() {
  if(!this.__environment) {
    this.__environment = new Environment({
      rootPath: this.rootPath,
      sourcePath: this.config.sourcePath,
      ignorePrefixPattern: this.config.ignorePrefixPattern
    });
  }

  return this.__environment;
};

Lingon.prototype.registerTask = function(task, callback, description) {
  help.describe(task, description);

  this.taskCallbacks[task] = function() {
    callback.call(this, function() {
      this.task = null;
      this.run();
    }.bind(this));
  }.bind(this);
};

Lingon.prototype.run = function(tasks) {
  if(tasks) {
    this.taskQueue = this.taskQueue.concat(tasks);
  }
  if(this.task) { return; }

  var task = this.taskQueue.shift();
  if(task) {
    var taskCallback = this.taskCallbacks[task];

    if(!taskCallback) {
      log(chalk.red('Error: Unknown task "' + task + '"'));
      return;
    }

    this.task = task;
    taskCallback.call(this);
  }
};

Lingon.prototype.build = function(params) {
  var _this = this;
  var callback = params['callback'] || null;

  // Build only requested path if defined (used to optimize server mode).
  var requestPath = params['requestPath'];

  // Pipeline functions that will be executed last.
  var pipelineTerminators = params['pipelineTerminators'] || [];

  if(!pipelineTerminators instanceof Array) {
    pipelineTerminators = [pipelineTerminators];
  }

  this.trigger('beforeBuild');

  var sourceFiles = this.getEnvironment().getSourceFiles(
    requestPath ? [requestPath] : []
  );

  // If no files are found, let's callback to allow the server
  // to process the next middleware (if the server is running).
  if(sourceFiles.length === 0) {
    if(!!callback) {
      callback( [null] );
    }

    return;
  }

  // Create a build pipeline for each source file
  sourceFiles = sourceFiles.map(function(sourceFile) {
    sourceFile.targetPath = params.targetPath || path.dirname(sourceFile.path.replace(
      _this.config.sourcePath, 
      _this.config.buildPath
    ));

    return Builder.createPipeline.apply(this, [
      // The input source file instance
      sourceFile,

      // First, create the source stream by reading the file from disk.
      Builder.source(vfs.src(sourceFile.path)),

      // Parse directives and apply pre-concatenation processors on all files found.
      Builder.preProcess({
        'rootPath': _this.rootPath,
        'processorStore': _this.preProcessors, 
        'extensionMap': _this.extensionRewrites,
        'config': _this.config, 
        'global': _this.global
      }),

      // Apply post-concatenation processors
      Builder.postProcess({
        'processorStore': _this.postProcessors,
        'global': _this.global
      }),

      // Rewrite the extension of the file based on it's input filename
      Builder.rewriteExtension({
        'extensionMap': _this.extensionRewrites,
        'processorStores': [_this.preProcessors, _this.postProcessors]
      }),

      // Normalize the file path relative to the target path
      Builder.normalizeFilePath,

      // Print the processed file to stdout
      Builder.print

      // Apply terminator functions (write to disk, etc).
    ].concat(pipelineTerminators));

  });
  
  // Aggregate produced streams and wait for all to finish
  var allStreams = Builder.aggregateStreams(sourceFiles);

  if(!!callback) {
    var fileBuffer = [];

    allStreams.on('data', function(file) {
      fileBuffer.push(file);
    });
    allStreams.on('end', function() {
      callback( fileBuffer );
    });
  }

  this.trigger('afterBuild');

};

Lingon.prototype.bind = Lingon.prototype.on = function() {
  this.eventEmitter.on.apply(this.eventEmitter, [].slice.call(arguments));
};

Lingon.prototype.unbind = Lingon.prototype.off = function() {
  this.eventEmitter.off.apply(this.eventEmitter, [].slice.call(arguments));
};

Lingon.prototype.one = function() {
  this.eventEmitter.once.apply(this.eventEmitter, [].slice.call(arguments));
};

Lingon.prototype.trigger = function() {
  this.eventEmitter.emit.apply(this.eventEmitter, [].slice.call(arguments));
};

module.exports = Lingon;
