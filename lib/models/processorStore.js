'use strict';

var path = require('path');

// The actual processor store
var ProcessorStore = function (processors) {
  this.processors = processors || {};
  this.matchFullPath = false; // @TODO: refactor this option away with the next major release

  return this;
};

// Gets all processor pipes. Can be filtered by extension and matching file name
ProcessorStore.prototype.get = function (extension, file) {
  if (!extension) {
    return this.processors;
  }

  if (!file) {
    return this.processors[extension];
  }

  if (!this.matchFullPath) {
    file = path.basename(file);
  }

  var filteredProcessors = this.processors[extension] || [];
  filteredProcessors = filteredProcessors.filter(function (item) {
    return item.fileMatches === null || !!file.match(item.fileMatches);
  });

  return filteredProcessors;
};

// Helper function to add new processor pipes
var addProcessor = function (arrayModifierFn, extension, fileMatches, factory) {
  fileMatches = fileMatches || null;
  if (typeof fileMatches === 'function') {
    factory = fileMatches;
    fileMatches = null;
  }

  this.processors[extension] = this.processors[extension] || [];
  this.processors[extension][arrayModifierFn]({
    fileMatches: fileMatches,
    pipe: factory,
  });

  return this;
};

// Overwrites all processor pipes for a given file extension
ProcessorStore.prototype.set = function (extension, fileMatches, factory) {
  this.processors[extension] = [];

  return this.push(extension, fileMatches, factory);
};

// Appends a processor pipe for the given file extension
ProcessorStore.prototype.push = function (extension, fileMatches, factory) {
  return addProcessor.call(this, 'push', extension, fileMatches, factory);
};

// Prepends a processor pipe for the given file extension
ProcessorStore.prototype.unshift = function (extension, fileMatches, factory) {
  return addProcessor.call(this, 'unshift', extension, fileMatches, factory);
};

// Removes a processor pipe for the given file extension
ProcessorStore.prototype.remove = function (extension, fileMatches, factory) {
  if (extension && this.processors[extension]) {
    if (!fileMatches) {
      delete this.processors[extension];
    } else {
      var indexToBeDeleted = [];
      if (typeof fileMatches === 'function') {
        factory = fileMatches;
        fileMatches = null;
      }

      for (var i = this.processors[extension].length; i--;) {
        var isFileValid = !fileMatches ||
            (this.processors[extension][i].fileMatches &&
              this.processors[extension][i].fileMatches
                .toString() == fileMatches.toString());
        var isFactoryValid = !factory ||
            (this.processors[extension][i].pipe === factory);

        if (factory && isFactoryValid && fileMatches && isFileValid) {
          indexToBeDeleted.push(i);
        } else if (factory && isFactoryValid && !fileMatches) {
          indexToBeDeleted.push(i);
        } else if (fileMatches && isFileValid && !factory) {
          indexToBeDeleted.push(i);
        }
      }

      for (var j = indexToBeDeleted.length; j--;) {
        this.processors[extension].splice(indexToBeDeleted[j], 1);
      }
    }
  }

  return this;
};

// The ProcessorStoreManager allows to access the ProcessorStore
// with multiple extensions at the same time
var ProcessorStoreManager = function (processors) {
  this.store = new ProcessorStore(processors);

  return this;
};

ProcessorStoreManager.prototype.get = function (extensions, file) {
  if (!Array.isArray(extensions)) {
    extensions = [extensions];
  }

  var results = [];
  for (var i = extensions.length; i--;) {
    var result = this.store.get(extensions[i], file);
    if (result) {
      results = result.concat(results);
    }
  }

  return results;
};

var setter = function (setterType, extensions, file, factory) {
  if (!Array.isArray(extensions)) {
    extensions = [extensions];
  }

  for (var i = extensions.length; i--;) {
    this.store[setterType](extensions[i], file, factory);
  }

  return this;
};

ProcessorStoreManager.prototype.set = function (extensions, file, factory) {
  return setter.call(this, 'set', extensions, file, factory);
};

ProcessorStoreManager.prototype.push = function (extensions, file, factory) {
  return setter.call(this, 'push', extensions, file, factory);
};

ProcessorStoreManager.prototype.unshift = function (extensions, file, factory) {
  return setter.call(this, 'unshift', extensions, file, factory);
};

ProcessorStoreManager.prototype.remove = function (extensions, file, factory) {
  return setter.call(this, 'remove', extensions, file, factory);
};

// @TODO: refactor this function away with the next major release
ProcessorStoreManager.prototype.setMatchFullPath = function (value) {
  this.store.matchFullPath = !!value;
  return this;
};

module.exports = ProcessorStoreManager;
