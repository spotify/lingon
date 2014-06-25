var ExtensionRewriter = function(map) {
  this.map = map || {};
}

ExtensionRewriter.prototype.set = function(extension, rewriteRule) {
  this.map[extension] = rewriteRule;
}

ExtensionRewriter.prototype.remove = function(extension) {
  delete this.map[extension];
};

ExtensionRewriter.prototype.transform = function(filename, processorStores) {

  var extensions = filename.split('.');
  var basename = extensions.splice(0, 1)[0];

  var out = [];

  for(var i=0;i<extensions.length;i++) {
    var ext = extensions[i];
    var processorRegistered = false;

    for(var j=0;j<processorStores.length;j++) {

      // TODO: The interface  to ProcessorStore is super weird.. 
      var processorStore = processorStores[j]();

      if(!!processorStore.list(ext) && !!processorStore.list(ext)[ext]) {
        processorRegistered = true;
      }
    }

    if(!!this.map[ext] && !!processorRegistered) {
      out.push(this.map[ext]);
    }else{
      out.push(ext);
    }
  }

  var outFilename = basename + "." + out.join('.');
  return outFilename;
};

module.exports = ExtensionRewriter; 