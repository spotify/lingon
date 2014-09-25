var test            = require('tape');
var Lingon          = require('../../lib/lingon');

test("Lingon: can emit events", function(t) {

  var lingon = new Lingon();

  lingon.on('testEvent', function(event) {
    t.end();  
  })

  lingon.emit('testEvent');
})