'use strict';

var ProcessorStore = function(processors) {
  this.processors = processors || {};
  var that = this;

  return function(extension, pathMatches, factory) {
    if(!pathMatches) {
      return {
        list: function(path) {
          return that.list(extension, path);
        },
        set: function(pathMatchesScoped, factoryScoped) {
          return that.set(extension, pathMatchesScoped, factoryScoped);
        },
        add: function(pathMatchesScoped, factoryScoped) {
          return that.add(extension, pathMatchesScoped, factoryScoped);
        },
        push: function(pathMatchesScoped, factoryScoped) {
          return that.push(extension, pathMatchesScoped, factoryScoped);
        },
        unshift: function(pathMatchesScoped, factoryScoped) {
          return that.unshift(extension, pathMatchesScoped, factoryScoped);
        }
      };
    }

    return that.set(extension, pathMatches, factory);
  };
};

// Lists all processors. Can be filtered by extension and matching path
ProcessorStore.prototype.list = function(extension, path) {
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

// Overwrites all processors for a given file extension
ProcessorStore.prototype.set = function(extension, pathMatches, factory) {
  this.processors[extension] = [];

  this.add(extension, pathMatches, factory);

  return this;
};

// Adds a processor for the given file extension
var addProcessor = function(type, extension, pathMatches, factory) {
  pathMatches = pathMatches || null;
  if(typeof pathMatches === 'function') {
    factory = pathMatches;
    pathMatches = null;
  }

  this.processors[extension] = this.processors[extension] || [];
  this.processors[extension][type]({pathMatches: pathMatches, pipe: factory});

  return this;
};

ProcessorStore.prototype.add = ProcessorStore.prototype.push = function(extension, pathMatches, factory) {
  return addProcessor.call(this, 'push', extension, pathMatches, factory);
};

ProcessorStore.prototype.unshift = function(extension, pathMatches, factory) {
  return addProcessor.call(this, 'unshift', extension, pathMatches, factory);
};

module.exports = ProcessorStore;
