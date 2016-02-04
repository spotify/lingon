'use strict';

module.exports = {
  // This function selects only extension rewrites whose source files extensions
  // have a registered preProcessor.
  registeredWithProcessor: function (processorStores, extension) {
    for (var i = 0; i < processorStores.length; i++) {

      var processorStore = processorStores[i];

      if (!!processorStore.get(extension)) {
        return true;
      }
    }

    return false;
  },

  getRegisteredExtensions: function (
    sourceFilename, extensionMap, processorStores
  ) {
    var registeredExtensionMap = {};

    for (var extension in extensionMap) {
      var extensionMapping = extensionMap[extension];
      var opts = extensionMapping.opts;

      // Skip this extension if it does not exist in filename
      if (sourceFilename.indexOf(extension) === -1) {
        continue;
      }

      // Add this extension if it's either:
      // A: Registered with a processor
      // B: Manually enforced with the "always" flag
      if (this.registeredWithProcessor(processorStores, extension) ||
          opts && opts.always) {
        registeredExtensionMap[extension] = extensionMapping;
      }

    }

    return registeredExtensionMap;
  },
};
