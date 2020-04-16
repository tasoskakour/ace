/*
The MIT License (MIT)

Copyright (c) Cucumber Ltd, Gaspar Nagy, Björn Rasmusson, Peter Sergeant

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/
define(function(require, exports, module) {
  var Token = require('./token');
  var GherkinLine = require('./gherkin_line');

  /**
   * The scanner reads a gherkin doc (typically read from a .feature file) and creates a token for each line. 
   * The tokens are passed to the parser, which outputs an AST (Abstract Syntax Tree).
   * 
   * If the scanner sees a `#` language header, it will reconfigure itself dynamically to look for 
   * Gherkin keywords for the associated language. The keywords are defined in gherkin-languages.json.
   */
  return function (source) {
    var lines = source.split(/\r?\n/);
    if(lines.length > 0 && lines[lines.length-1].trim() == '') {
      lines.pop();
    }
    var lineNumber = 0;

    this.read = function () {
      var line = lines[lineNumber++];
      var location = {line: lineNumber, column: 0};
      return line == null ? new Token(null, location) : new Token(new GherkinLine(line, lineNumber), location);
    }
  };

})