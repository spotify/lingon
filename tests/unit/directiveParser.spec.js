var test            = require('tape');
var DirectiveParser = require('../../lib/directives/directiveParser');


test("DirectiveParser: says maybe", function(t) {
  
  var parser = new DirectiveParser({});

  var result = parser.parse();

  t.equals(result, "maybe");
  t.end();
})