var chalk                 = require('chalk');
var es                    = require('event-stream');
var vfs                   = require('vinyl-fs');
var path                  = require('path');
var EventEmitter          = require('event-emitter');

var defaultConfig         = require('./defaults/config');
var log                   = require('./utils/log');
var Environment           = require('./environment');
var ExtensionRewriter     = require('./utils/extensionRewriter');
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

  // Keep a map of source => output files for the
  // server to use when requesting a certain URL.
  this.outputMap = [];

  this.preProcessors = new ProcessorStore(defaultProcessors.pre);
  this.postProcessors = new ProcessorStore(defaultProcessors.post);
  this.extensionRewriter = new ExtensionRewriter(defaultExtensionMap);

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

Lingon.prototype.prepareOutputMap = function() {
  var _this = this;
  var sourceFiles = this.getEnvironment().getSourceFiles();

  sourceFiles.forEach(function(sourceFile){
    var sourceFilename = sourceFile.path.replace(_this.config.sourcePath + "/", "");
    var destFilename = _this.extensionRewriter.transform(sourceFilename, [_this.preProcessors, _this.postProcessors]);

    _this.outputMap[destFilename] = sourceFilename;
  });
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

Lingon.prototype.build = function(callback, requestPaths) {
  var _this = this;
  requestPaths = requestPaths || [];

  this.trigger('beforeBuild');

  var sourceMappings = requestPaths.map(function(requestPath){
    return _this.outputMap[requestPath] || requestPath;
  });

  var sourceFiles = this.getEnvironment().getSourceFiles(sourceMappings);

  // If no files are found, let's callback to allow the server
  // to process the next middleware (if the server is running).
  if(sourceFiles.length === 0) {
    if(!!callback) {
      var emptyFileBuffer = [];
      for(var i = requestPaths.length; i--;) {
        emptyFileBuffer.push(null);
      }
      callback( emptyFileBuffer );
    }

    return;
  }

  sourceFiles = sourceFiles.map(function(sourceFile) {
    sourceFile.targetPath = path.dirname(sourceFile.path.replace(_this.config.sourcePath, _this.config.buildPath));

    return Builder.createPipeline.apply(this, [
      // The input source file instance
      sourceFile,

      // First, create the source stream by reading the file from disk.
      Builder.source(vfs.src(sourceFile.path)),

      // Parse directives and apply pre-concatenation processors on all files found.
      Builder.preProcess({
        'rootPath': _this.rootPath,
        'processorStore': _this.preProcessors, 
        'extensionRewriter': _this.extensionRewriter,
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
        'extensionRewriter': _this.extensionRewriter,
        'processorStores': [_this.preProcessors, _this.postProcessors]
      }),

      // Write the file to disk
      Builder.writeFile
    ]);

  });

  var allStreams = Builder.aggregateStreams(sourceFiles);

  if(!!callback) {
    var fileBuffer = {};

    allStreams.on('data', function(file) {
      var buildPath = path.join(_this.rootPath, _this.config.buildPath);
      var relativePath = path.relative(buildPath, file.path);

      fileBuffer[relativePath] = file ;
    });
    allStreams.on('end', function() {
      var fileBufferSorted = [];
      for(var i = requestPaths.length; i--;) {
        fileBufferSorted[i] = fileBuffer[ requestPaths[i] ] || null;
      }

      callback( fileBufferSorted );
    });
  }

  this.trigger('afterBuild', { requestPaths: requestPaths });

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
