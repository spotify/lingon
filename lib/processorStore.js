'use strict';

// The actual processor store
var ProcessorStore = function(processors) {
  this.processors = processors || {};

  return this;
};

// Gets all processor pipes. Can be filtered by extension and matching path
ProcessorStore.prototype.get = function(extension, path) {
  if(!extension) {
    return this.processors;
  }
  if(!path) {
    return this.processors[extension];
  }

  var filteredProcessors = this.processors[extension] || [];
  filteredProcessors = filteredProcessors.filter(function(item) {
    return item.pathMatches === null || !!path.match(item.pathMatches);
  });

  return filteredProcessors;
};

// Overwrites all processor pipes for a given file extension
ProcessorStore.prototype.set = function(extension, pathMatches, factory) {
  this.processors[extension] = [];

  this.push(extension, pathMatches, factory);

  return this;
};

// Helper function to add new processor pipes
var addProcessor = function(arrayModifierFn, extension, pathMatches, factory) {
  pathMatches = pathMatches || null;
  if(typeof pathMatches === 'function') {
    factory = pathMatches;
    pathMatches = null;
  }

  this.processors[extension] = this.processors[extension] || [];
  this.processors[extension][arrayModifierFn]({ pathMatches: pathMatches, pipe: factory });

  return this;
};

// Appends a processor pipe for the given file extension
ProcessorStore.prototype.push = function(extension, pathMatches, factory) {
  return addProcessor.call(this, 'push', extension, pathMatches, factory);
};

// Prepends a processor pipe for the given file extension
ProcessorStore.prototype.unshift = function(extension, pathMatches, factory) {
  return addProcessor.call(this, 'unshift', extension, pathMatches, factory);
};

// Removes a processor pipe for the given file extension
ProcessorStore.prototype.remove = function(extension, pathMatches, factory) {
  if(extension && this.processors[extension]) {
    if(!pathMatches) {
      delete this.processors[extension];
    } else {
      var indexToBeDeleted = [];
      if(typeof pathMatches === 'function') {
        factory = pathMatches;
        pathMatches = null;
      }

      for(var i=this.processors[extension].length; i--;) {
        var isPathValid = !pathMatches || (this.processors[extension][i].pathMatches && this.processors[extension][i].pathMatches.toString() == pathMatches.toString());
        var isFactoryValid = !factory || (this.processors[extension][i].pipe === factory);

        if(factory && isFactoryValid && pathMatches && isPathValid) {
          indexToBeDeleted.push(i);
        } else if(factory && isFactoryValid && !pathMatches) {
          indexToBeDeleted.push(i);
        } else if(pathMatches && isPathValid && !factory) {
          indexToBeDeleted.push(i);
        }
      }

      for(var i=indexToBeDeleted.length; i--;) {
        this.processors[extension].splice(indexToBeDeleted[i], 1);
      }
    }
  }

  return this;
};



// The ProcessorStoreManager allows to access the ProcessorStore with multiple extensions at the same time
var ProcessorStoreManager = function(processors) {
  this.store = new ProcessorStore(processors);

  return this;
};

ProcessorStoreManager.prototype.get = function(extensions, path) {
  if(!Array.isArray(extensions)) {
    extensions = [extensions];
  }

  var results = [];
  for(var i = extensions.length; i--;) {
    var result = this.store.get(extensions[i], path);
    if(result) {
      results = result.concat(results);
    }
  }

  return results;
};

var setter = function(setterType, extensions, path, factory) {
  if(!Array.isArray(extensions)) {
    extensions = [extensions];
  }

  for(var i = extensions.length; i--;) {
    this.store[setterType](extensions[i], path, factory);
  }

  return this;
}

ProcessorStoreManager.prototype.set = function(extensions, path, factory) {
  return setter.call(this, 'set', extensions, path, factory);
};

ProcessorStoreManager.prototype.push = function(extensions, path, factory) {
  return setter.call(this, 'push', extensions, path, factory);
};

ProcessorStoreManager.prototype.unshift = function(extensions, path, factory) {
  return setter.call(this, 'unshift', extensions, path, factory);
};

ProcessorStoreManager.prototype.remove = function(extensions, path, factory) {
  return setter.call(this, 'remove', extensions, path, factory);
};

module.exports = ProcessorStoreManager;
