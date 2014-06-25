var ExtensionRewriter = function(map) {
  this.map = map || {};
}

ExtensionRewriter.prototype.set = function(extension, rewriteRule) {
  this.map[extension] = rewriteRule;
}

ExtensionRewriter.prototype.remove = function(extension) {
  delete this.map[extension];
};

ExtensionRewriter.prototype.transform = function(filename) {

  var extensions = filename.split('.');
  var basename = extensions.splice(0, 1)[0];

  var out = [];

  for(var i=0;i<extensions.length;i++) {
    var ext = extensions[i];

    if(!!this.map[ext]) {
      out.push(this.map[ext]);
    }else{
      out.push(ext);
    }
  }

  var outFilename = basename + "." + out.join('.');
  return outFilename;
};

module.exports = ExtensionRewriter; 