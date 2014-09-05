module.exports = {
  defaultTask: 'server',
  sourcePath: 'source',
  buildPath: 'build',
  ignorePrefixPattern: new RegExp('\/_'),
  validDirectiveFileTypes: ['.js', '.less', '.css', '.ejs', '.html', '.md'],
  server: {
    directoryIndex: 'index.html',
    catchAll: undefined
  }
}
