module.exports = function(lingon) {
  lingon.registerTask('build', function(callback) {
    lingon.build(callback, null);
  }, {
    message: 'Build once and exit',
    arguments: {}
  });
};