var chalk = require('chalk');
var log = require('./utils/log');

var es      = require('event-stream');
var concat  = require('gulp-concat');
var File   = require('vinyl');
var vfs     = require('vinyl-fs');
var path    = require('path');

var Environment = require('./environment');
var utils = require('./utils');
var ProcessorStore = require('./processorStore');
var defaultProcessors = require('./defaultProcessors');
var processorStream = require('./processorStream');
var orderedMergeStream = require('./orderedMergeStream');
var EventDispatcher = require('eventdispatcher');
var help = require('./utils/help');

var Lingon = function(task, rootPath) {
  this.eventDispatcher = new EventDispatcher();

  this.rootPath = rootPath;
  this.defaultTask = null;

  this.sourcePath = 'source';
  this.buildPath = 'build';

  this.server = null;

  this.task = task;
  
  // Backwards compatibility with old 
  // lingon.js file formats.
  this.mode = this.task;

  this.taskCallbacks = {};

  this.configurations = {
    server: {},
    build: {}
  };

  // Keep a map of source => output files for the 
  // server to use when requesting a certain URL.
  this.outputMap = [];

  this.validDirectiveFileTypes = ['.js', '.less', '.css'];

  this.preProcessors = new ProcessorStore(defaultProcessors.pre);
  this.postProcessors = new ProcessorStore(defaultProcessors.post);

  // expose logger to plugins
  this.log = log;

  // Set up default task
  this.registerTask('build', function() {
    this.build();
  }, {
    message: "Build once and exit",
    arguments: {}
  });

};

Lingon.IGNORE_PREFIX_PATTERN = new RegExp('\/_');

Lingon.prototype.registerTask = function(task, callback, description) {
  help.describe(task, description);
  this.taskCallbacks[task] = callback;
};

Lingon.prototype.run = function() {
  if(!this.task) {
    this.task = this.defaultTask;
  }

  var taskCallback = this.taskCallbacks[this.task];

  if(!taskCallback) {
    log(chalk.red('Error: Unknown task "' + this.task + '"'));
    return;
  }

  taskCallback.call(this);
};

Lingon.prototype.build = function(requestPaths, callback) {
  this.trigger('beforeBuild');

  var _this = this;
  requestPaths = requestPaths || [];

  var environment = new Environment({
    rootPath: this.rootPath,
    sourcePath: this.sourcePath,
    ignorePrefixPattern: this.IGNORE_PREFIX_PATTERN,
    validDirectiveFileTypes: this.validDirectiveFileTypes
  });

  var sourceMappings = requestPaths.map(function(requestPath){
    return _this.outputMap[requestPath] || requestPath;
  });

  var sourceFiles = environment.getSourceFiles(sourceMappings);

  // If no files are found, let's callback to allow the server 
  // to process the next middleware (if the server is running).
  if(sourceFiles.length == 0) {
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
  var streamList = sourceFiles.map(function(file) {
    return _this.createFileStream(file);
  });

  var allStreams = es.concat.apply(_this, streamList);

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

Lingon.prototype.createFileStream = function(sourceFile) {
  var _this = this; 

  var destFilePath = path.dirname(sourceFile.path.replace(_this.sourcePath, _this.buildPath));
  var currentConfig = _this.currentConfig();

  var stream = null;
  var pipes = [];
  var postConcatPipes = [];

  // * If the source file specified directives, 
  // use glob the patterns as source. Then append the
  // body of the file as a footer with a postConcatPipe.
  // * Otherwise use the file body itself.
  var patterns = sourceFile.patterns;

  if(patterns.length > 0) {

    var sourceStreams = patterns.map(function(pattern) {
      if(Array.isArray(pattern)) {

        return vfs.src(pattern);

      }else if(typeof pattern === 'string' && pattern == 'self') {
        var fileStream = utils.createFromStream(new File({
          base: path.dirname(sourceFile.path),
          path: sourceFile.path,
          contents: new Buffer(sourceFile.body)
        }));

        // It was necessary to pause _this_ stream for 
        // the data to be emitted later.. why?
        fileStream.pause();
        return fileStream;

      }
    });

    stream = orderedMergeStream(sourceStreams);

    // Concat the glob streams to a single file.
    pipes.push(concat(sourceFile.name));

  }else{
    stream = utils.createFromStream(new File({
      base: path.dirname(sourceFile.path),
      path: sourceFile.path,
      contents: new Buffer(sourceFile.body)
    }));
  }

  stream = stream.pipe(
    processorStream(
      _this.preProcessors, 
      currentConfig,
      _this.rootPath));

  postConcatPipes = postConcatPipes.concat(
    utils.pipesForFileExtensions(
      sourceFile.name, 
      _this.postProcessors,
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
      // pipes.map(function(pipe){ return pipe.name; }).join(' -> '));

  // Apply all pipes to stream
  stream = utils.applyPipes(stream, pipes);

  return stream;
};

Lingon.prototype.configure = function(task, configGetterFunc){
  this.configurations[task] = configGetterFunc(this.configurations[task] || {});
};

Lingon.prototype.currentConfig = function() {
  return this.configurations[this.task];
};

Lingon.prototype.bind = function() {
  this.eventDispatcher.bind.apply(this.eventDispatcher, [].slice.call(arguments));
};

Lingon.prototype.one = function() {
  this.eventDispatcher.one.apply(this.eventDispatcher, [].slice.call(arguments));
};

Lingon.prototype.preProcessor = function(extension, factory) {
  return this.preProcessors.add(extension, null, factory);
};

Lingon.prototype.postProcessor = function(extension, factory) {
  return this.preProcessors.add(extension, null, factory);
};

Lingon.prototype.trigger = function() {
  this.eventDispatcher.trigger.apply(this.eventDispatcher, [].slice.call(arguments));
};

module.exports = Lingon;
