var Builder               = require('../builder');

module.exports = function(lingon) {
  lingon.registerTask('build', function(callback) {

    // Build once and write files to disk
    lingon.build({
      'callback': callback, 
      // Terminate the pipeline by writing files to disk
      'pipelineTerminators': Builder.writeFile
    });

  }, {
    message: 'Build once and exit',
    arguments: {}
  });
};