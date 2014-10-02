module.exports = function(lingon) {
  lingon.registerTask('build', function(callback) {

    // Build once and write files to disk
    lingon.build({
      'callback': callback
    });

  }, {
    message: 'Build once and exit',
    arguments: {}
  });
};