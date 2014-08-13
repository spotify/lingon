var chalk              = require('chalk');
var log                = require('./utils/log');

var es                 = require('event-stream');
var vfs                = require('vinyl-fs');
var path               = require('path');
var EventEmitter       = require('event-emitter');

var Environment        = require('./environment');
var ExtensionRewriter    = require('./extensionRewriter');
var streamHelper       = require('./utils/stream');
var ProcessorStore     = require('./processorStore');

var defaultProcessors  = require('./defaultProcessors');
var defaultExtensionMap = require('./defaultExtensionMap');

var directiveStream    = require('./directiveStream');

var help               = require('./utils/help');

var buildTask          = require('./tasks/build');
var cleanTask          = require('./tasks/clean');
var serverTask         = require('./tasks/server');

var Lingon = function(rootPath, argv) {
  this.eventEmitter = new EventEmitter();

  this.rootPath = rootPath;
  this.defaultTask = null;

  this.sourcePath = 'source';
  this.buildPath = 'build';

  //Expose the cli arguments to plugins
  this.argv = argv;

  this.server = null;

  // Backwards compatibility with old
  // lingon.js file formats.
  this.mode = this.task = null;

  this.taskCallbacks = {};
  this.taskQueue = [];

  this.global = {};

  // Keep a map of source => output files for the
  // server to use when requesting a certain URL.
  this.outputMap = [];

  this.validDirectiveFileTypes = ['.js', '.less', '.css', '.ejs', '.html', '.md'];

  this.preProcessor = new ProcessorStore(defaultProcessors.pre);
  this.postProcessor = new ProcessorStore(defaultProcessors.post);
  this.extensionRewriter = new ExtensionRewriter(defaultExtensionMap);

  // expose logger to plugins
  this.log = log;

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

Lingon.IGNORE_PREFIX_PATTERN = new RegExp('\/_');

Lingon.prototype.getEnvironment = function() {
  if(!this.__environment) {
    this.__environment = new Environment({
      rootPath: this.rootPath,
      sourcePath: this.sourcePath,
      ignorePrefixPattern: this.IGNORE_PREFIX_PATTERN
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
    var sourceFilename = sourceFile.path.replace(_this.sourcePath + "/", "");
    var destFilename = _this.extensionRewriter.transform(sourceFilename, [_this.preProcessor, _this.postProcessor]);

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

  var cache = {};

  // Start a directiveStream for each sourceFile
  sourceFiles.forEach(function(sourceFile) {
    var vinylStream = vfs.src(sourceFile.path);

    sourceFile.stream = vinylStream.pipe(
      directiveStream({
        rootPath: _this.rootPath,
        sourcePath: _this.sourcePath,
        directiveFileTypes: _this.validDirectiveFileTypes,
        preProcessor: _this.preProcessor,
        global: _this.global,
        cache: cache,
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
      var buildPath = path.join(_this.rootPath, _this.buildPath);
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
  var destFilename = _this.extensionRewriter.transform(sourceFilename, [_this.preProcessor, _this.postProcessor]);

  var destFilePath = path.dirname(sourceFile.path.replace(_this.sourcePath, _this.buildPath));

  var stream = sourceFile.stream;
  var pipes = [];
  var postConcatPipes = [];

  postConcatPipes = postConcatPipes.concat(
    streamHelper.pipesForFileExtensions(
      sourceFile.name,
      _this.postProcessor,
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
