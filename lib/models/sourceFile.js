var SourceFile = function(params) {
  this.name = params.name;
  this.path = params.path;
  this.targetFilename = null;
  this.targetPath = null;
  this.stream = null;
}

module.exports = SourceFile;