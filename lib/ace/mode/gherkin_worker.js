 define(function(require, exports, module) {
    "use strict";
    
    var oop = require("../lib/oop");
    var Mirror = require("../worker/mirror").Mirror;
    var parse = require('./gherkin/gherkin_parser');
     
    var Worker = exports.Worker = function(sender) {
        Mirror.call(this, sender);
        this.setTimeout(400);
        this.context = null;
    };
    
    oop.inherits(Worker, Mirror);
    
    (function() {
    
        this.setOptions = function(options) {
            this.context = options.context;
        };
    
        this.onUpdate = function() {
            var value = this.doc.getValue();
            var retErrors = [];
            if (!value)
                return;
            try {
                parse(value)
            } catch (error) {
                error.errors.forEach(function(err){
                    retErrors.push({
                        row: err.location.line - 1,
                        column: err.location.column - 1,
                        text: err.message,
                        type: "error"
                    })
                })
            }
            this.sender.emit("error", retErrors);
        };
    
    }).call(Worker.prototype);
    
    });
    