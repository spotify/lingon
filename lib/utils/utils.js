module.exports = {
  // This function selects only extension rewrites whose source files extensions
  // have a registered preProcessor.
  getRegisteredExtensions: function(extensions, extensionMap, processorStores) {
    var registeredExtensionMap = {};

    for(var i=0; i<extensions.length; i++) {
      var ext = extensions[i];
      var processorRegistered = false;

      for(var j=0; j<processorStores.length; j++) {

        var processorStore = processorStores[j];

        if(!!processorStore.get(ext)) {
          processorRegistered = true;
        }
      }

      if(!!extensionMap[ext] && !!processorRegistered) {
        registeredExtensionMap[ext] = extensionMap[ext];
      }
    }

    return registeredExtensionMap;
  }
}