
define(function(require, exports, module) {
    "use strict";

    var Parser = require('./gherkin_parser/parser');
    var parse = new Parser().parse;
    
    return parse;
});
    