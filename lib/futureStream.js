var FutureStream = function(filename, patterns) {
  this.filename = filename;
  this.patterns = patterns;

  this.lastStream = null;
  this.lastPostStream = null;
}

FutureStream.prototype.pipe = function(stream) {
  if(!this.lastStream) { 
    this.lastStream = stream;
  }else{
    this.lastStream = this.lastStream.pipe(stream);
  }
};

FutureStream.prototype.postPipe = function(stream) {
  if(!this.lastPostStream) { 
    this.lastPostStream = stream;
  }else{
    this.lastPostStream = this.lastPostStream.pipe(stream);
  }
};

module.exports = FutureStream;