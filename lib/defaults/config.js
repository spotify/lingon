'use strict';

var defaultExtensionMap = require('./defaultExtensionMap');

module.exports = {
  defaultTask: 'server',
  sourcePath: 'source',
  buildPath: 'build',
  ignorePrefixPattern: new RegExp('\/_'),
  directiveFileTypes: ['js', 'less', 'css', 'ejs', 'html', 'md'],
  server: {
    directoryIndex: 'index.html',
    catchAll: undefined,
    namespace: '/',
  },
  extensionRewrites: defaultExtensionMap,
};
