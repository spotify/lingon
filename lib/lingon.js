var chalk              = require('chalk');
var log                = require('./utils/log');

var es                 = require('event-stream');
var vfs                = require('vinyl-fs');
var path               = require('path');
var EventEmitter       = require('event-emitter');

var Environment        = require('./environment');
var streamHelper       = require('./utils/stream');
var ProcessorStore     = require('./processorStore');
var defaultProcessors  = require('./defaultProcessors');

var directiveStream    = require('./directiveStream');
var processorStream    = require('./processorStream');
var orderedMergeStream = require('./orderedMergeStream');

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

  this.configurations = {
    server: {},
    build: {}
  };

  // Keep a map of source => output files for the
  // server to use when requesting a certain URL.
  this.outputMap = [];

  this.validDirectiveFileTypes = ['.js', '.less', '.css'];

  this.preProcessor = new ProcessorStore(defaultProcessors.pre);
  this.postProcessor = new ProcessorStore(defaultProcessors.post);

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

Lingon.prototype.registerTask = function(task, callback, description) {
  help.describe(task, description);

  this.taskCallbacks[task] = function() {
    callback.call(this, this.run.bind(this));
    this.task = null;
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

Lingon.prototype.build = function(callback, requestPaths) {
  var _this = this;
  requestPaths = requestPaths || [];

  this.trigger('beforeBuild');

  var env = new Environment({
    rootPath: this.rootPath,
    sourcePath: this.sourcePath,
    ignorePrefixPattern: this.IGNORE_PREFIX_PATTERN
  });

  var sourceMappings = requestPaths.map(function(requestPath){
    return _this.outputMap[requestPath] || requestPath;
  });

  var sourceFiles = env.getSourceFiles(sourceMappings);

  var resourceContext = {};

  // Start a directiveStream for each sourceFile
  sourceFiles.forEach(function(sourceFile) {
    var vinylStream = vfs.src(sourceFile.path);

    sourceFile.stream = vinylStream.pipe(
      directiveStream({
        rootPath: _this.rootPath,
        directiveFileTypes: _this.validDirectiveFileTypes,
        preProcessor: _this.preProcessor,
        config: _this.currentConfig(),
        context: resourceContext
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

  var destFilePath = path.dirname(sourceFile.path.replace(_this.sourcePath, _this.buildPath));
  var currentConfig = _this.currentConfig();

  var stream = sourceFile.stream;
  var pipes = [];
  var postConcatPipes = [];

  postConcatPipes = postConcatPipes.concat(
    streamHelper.pipesForFileExtensions(
      sourceFile.name,
      _this.postProcessor,
      currentConfig));

  // Queue the postConcatPipes (less, compression, etc)
  pipes = pipes.concat(postConcatPipes);

  // Queue the inspect pipe, used to create the source => dest map
  var inspect = function(file, cb) {
    var sf = path.relative(_this.sourcePath, sourceFile.path);

    var baseDestPath = sf.substring(0, (sf.length-1) - ((path.basename(sf)).length-1));
    var destFile = path.basename(file.path);
    var destPath = path.join(baseDestPath, destFile);

    _this.outputMap[destPath] = sf;
    cb(null, file);
  };

  pipes.push(es.map(inspect));

  // Queue the output pipe
  pipes.push(vfs.dest(destFilePath));

  log(chalk.green(sourceFile.path));
      // '=>',
      // pipes.map(function(pipe){ return pipe.toString(); }).join(' -> '));

  // Apply all pipes to stream
  stream = streamHelper.applyPipes(stream, pipes);

  return stream;
};

Lingon.prototype.configure = function(task, configGetterFunc){
  this.configurations[task] = configGetterFunc(this.configurations[task] || {});
};

Lingon.prototype.currentConfig = function() {
  return this.configurations[this.task];
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
