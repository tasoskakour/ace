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
  var countSymbols = require('./count_symbols')

  function GherkinLine(lineText, lineNumber) {
    this.lineText = lineText;
    this.lineNumber = lineNumber;
    this.trimmedLineText = lineText.replace(/^\s+/g, ''); // ltrim
    this.isEmpty = this.trimmedLineText.length == 0;
    this.indent = countSymbols(lineText) - countSymbols(this.trimmedLineText);
  };

  GherkinLine.prototype.startsWith = function startsWith(prefix) {
    return this.trimmedLineText.indexOf(prefix) == 0;
  };

  GherkinLine.prototype.startsWithTitleKeyword = function startsWithTitleKeyword(keyword) {
    return this.startsWith(keyword+':'); // The C# impl is more complicated. Find out why.
  };

  GherkinLine.prototype.getLineText = function getLineText(indentToRemove) {
    if (indentToRemove < 0 || indentToRemove > this.indent) {
      return this.trimmedLineText;
    } else {
      return this.lineText.substring(indentToRemove);
    }
  };

  GherkinLine.prototype.getRestTrimmed = function getRestTrimmed(length) {
    return this.trimmedLineText.substring(length).trim();
  };

  GherkinLine.prototype.getTableCells = function getTableCells() {
    var cells = [];
    var col = 0;
    var startCol = col + 1;
    var cell = '';
    var firstCell = true;
    while (col < this.trimmedLineText.length) {
      var chr = this.trimmedLineText[col];
      col++;

      if (chr == '|') {
        if (firstCell) {
          // First cell (content before the first |) is skipped
          firstCell = false;
        } else {
          var cellIndent = cell.length - cell.replace(/^\s+/g, '').length;
          var span = {column: this.indent + startCol + cellIndent, text: cell.trim()};
          cells.push(span);
        }
        cell = '';
        startCol = col + 1;
      } else if (chr == '\\') {
        chr = this.trimmedLineText[col];
        col += 1;
        if (chr == 'n') {
          cell += '\n';
        } else {
          if (chr != '|' && chr != '\\') {
            cell += '\\';
          }
          cell += chr;
        }
      } else {
        cell += chr;
      }
    }

    return cells;
  };

  GherkinLine.prototype.getTags = function getTags() {
    var column = this.indent + 1;
    var items = this.trimmedLineText.trim().split('@');
    items.shift();
    return items.map(function (item) {
      var length = item.length;
      var span = {column: column, text: '@' + item.trim()};
      column += length + 1;
      return span;
    });
  };

  return GherkinLine;

})