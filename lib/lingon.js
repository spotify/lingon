var chalk                 = require('chalk');
var es                    = require('event-stream');
var vfs                   = require('vinyl-fs');
var path                  = require('path');
var EventEmitter          = require('event-emitter');

var defaultConfig         = require('./defaults/config');
var log                   = require('./utils/log');
var Environment           = require('./environment');
var ExtensionRewriter     = require('./utils/extensionRewriter');
var streamHelper          = require('./utils/stream');
var ProcessorStore        = require('./models/processorStore');
var defaultProcessors     = require('./defaults/defaultProcessors');
var defaultExtensionMap   = require('./defaults/defaultExtensionMap');
var directiveStream       = require('./streams/directiveStream');
var help                  = require('./utils/help');
var buildTask             = require('./tasks/build');
var cleanTask             = require('./tasks/clean');
var serverTask            = require('./tasks/server');

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

  // Start a directiveStream for each sourceFile
  sourceFiles.forEach(function(sourceFile) {
    var vinylStream = vfs.src(sourceFile.path);

    sourceFile.stream = vinylStream.pipe(
      directiveStream({
        rootPath: _this.rootPath,
        sourcePath: _this.config.sourcePath,
        directiveFileTypes: _this.config.validDirectiveFileTypes,
        preProcessors: _this.preProcessors,
        global: _this.global,
        extensionRewriter: _this.extensionRewriter,
        directiveStream: directiveStream
      })
    );
  });

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

  // If we have source files, let's create streams to process them.
  var outputStreams = sourceFiles.map(function(sourceFile) {
    return _this.postProcess(sourceFile);
  });

  var allStreams = es.concat.apply(_this, outputStreams);

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


Lingon.prototype.postProcess = function(sourceFile) {
  var _this = this;

  var sourcePath = sourceFile.path;
  var sourceFilename = path.basename(sourcePath);
  var destFilename = _this.extensionRewriter.transform(sourceFilename, [_this.preProcessors, _this.postProcessors]);

  var destFilePath = path.dirname(sourceFile.path.replace(_this.config.sourcePath, _this.config.buildPath));

  var stream = sourceFile.stream;
  var pipes = [];
  var postConcatPipes = [];

  postConcatPipes = postConcatPipes.concat(
    streamHelper.pipesForFileExtensions(
      sourceFile.name,
      _this.postProcessors,
      _this.global));

  // Queue the postConcatPipes (less, compression, etc)
  pipes = pipes.concat(postConcatPipes);

  // Queue the inspect pipe, rewrite the output filename
  var inspect = function(file, cb) {
    var filename = path.basename(file.path);
    file.path = file.path.replace(filename, destFilename);

    cb(null, file);
  };

  pipes.push(es.map(inspect));

  // Queue the output pipe
  pipes.push(vfs.dest(destFilePath));

  log(chalk.green(sourceFile.path, "->", path.join(destFilePath, destFilename)));

  // Apply all pipes to stream
  stream = streamHelper.applyPipes(stream, pipes);

  return stream;
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
