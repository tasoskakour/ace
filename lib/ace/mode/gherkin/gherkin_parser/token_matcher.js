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
  var DIALECTS = require('./dialects');
  var Errors = require('./errors');
  var LANGUAGE_PATTERN = /^\s*#\s*language\s*:\s*([a-zA-Z\-_]+)\s*$/;

  return function (defaultDialectName) {
    defaultDialectName = defaultDialectName || 'en';

    var dialect;
    var dialectName;
    var activeDocStringSeparator;
    var indentToRemove;

    function changeDialect(newDialectName, location) {
      var newDialect = DIALECTS[newDialectName];
      if(!newDialect) {
        throw Errors.NoSuchLanguageException.create(newDialectName, location);
      }

      dialectName = newDialectName;
      dialect = newDialect;
    }

    this.reset = function () {
      if(dialectName != defaultDialectName) changeDialect(defaultDialectName);
      activeDocStringSeparator = null;
      indentToRemove = 0;
    };

    this.reset();

    this.match_TagLine = function match_TagLine(token) {
      if(token.line.startsWith('@')) {
        setTokenMatched(token, 'TagLine', null, null, null, token.line.getTags());
        return true;
      }
      return false;
    };

    this.match_FeatureLine = function match_FeatureLine(token) {
      return matchTitleLine(token, 'FeatureLine', dialect.feature);
    };

    this.match_ScenarioLine = function match_ScenarioLine(token) {
      return matchTitleLine(token, 'ScenarioLine', dialect.scenario);
    };

    this.match_ScenarioOutlineLine = function match_ScenarioOutlineLine(token) {
      return matchTitleLine(token, 'ScenarioOutlineLine', dialect.scenarioOutline);
    };

    this.match_BackgroundLine = function match_BackgroundLine(token) {
      return matchTitleLine(token, 'BackgroundLine', dialect.background);
    };

    this.match_ExamplesLine = function match_ExamplesLine(token) {
      return matchTitleLine(token, 'ExamplesLine', dialect.examples);
    };

    this.match_TableRow = function match_TableRow(token) {
      if (token.line.startsWith('|')) {
        // TODO: indent
        setTokenMatched(token, 'TableRow', null, null, null, token.line.getTableCells());
        return true;
      }
      return false;
    };

    this.match_Empty = function match_Empty(token) {
      if (token.line.isEmpty) {
        setTokenMatched(token, 'Empty', null, null, 0);
        return true;
      }
      return false;
    };

    this.match_Comment = function match_Comment(token) {
      if(token.line.startsWith('#')) {
        var text = token.line.getLineText(0); //take the entire line, including leading space
        setTokenMatched(token, 'Comment', text, null, 0);
        return true;
      }
      return false;
    };

    this.match_Language = function match_Language(token) {
      var match;
      if(match = token.line.trimmedLineText.match(LANGUAGE_PATTERN)) {
        var newDialectName = match[1];
        setTokenMatched(token, 'Language', newDialectName);

        changeDialect(newDialectName, token.location);
        return true;
      }
      return false;
    };

    this.match_DocStringSeparator = function match_DocStringSeparator(token) {
      return activeDocStringSeparator == null
        ?
        // open
        _match_DocStringSeparator(token, '"""', true) ||
        _match_DocStringSeparator(token, '```', true)
        :
        // close
        _match_DocStringSeparator(token, activeDocStringSeparator, false);
    };

    function _match_DocStringSeparator(token, separator, isOpen) {
      if (token.line.startsWith(separator)) {
        var contentType = null;
        if (isOpen) {
          contentType = token.line.getRestTrimmed(separator.length);
          activeDocStringSeparator = separator;
          indentToRemove = token.line.indent;
        } else {
          activeDocStringSeparator = null;
          indentToRemove = 0;
        }

        // TODO: Use the separator as keyword. That's needed for pretty printing.
        setTokenMatched(token, 'DocStringSeparator', contentType);
        return true;
      }
      return false;
    }

    this.match_EOF = function match_EOF(token) {
      if(token.isEof) {
        setTokenMatched(token, 'EOF');
        return true;
      }
      return false;
    };

    this.match_StepLine = function match_StepLine(token) {
      var keywords = []
        .concat(dialect.given)
        .concat(dialect.when)
        .concat(dialect.then)
        .concat(dialect.and)
        .concat(dialect.but);
      var length = keywords.length;
      for(var i = 0, keyword; i < length; i++) {
        var keyword = keywords[i];

        if (token.line.startsWith(keyword)) {
          var title = token.line.getRestTrimmed(keyword.length);
          setTokenMatched(token, 'StepLine', title, keyword);
          return true;
        }
      }
      return false;
    };

    this.match_Other = function match_Other(token) {
      var text = token.line.getLineText(indentToRemove); //take the entire line, except removing DocString indents
      setTokenMatched(token, 'Other', unescapeDocString(text), null, 0);
      return true;
    };

    function matchTitleLine(token, tokenType, keywords) {
      var length = keywords.length;
      for(var i = 0, keyword; i < length; i++) {
        var keyword = keywords[i];

        if (token.line.startsWithTitleKeyword(keyword)) {
          var title = token.line.getRestTrimmed(keyword.length + ':'.length);
          setTokenMatched(token, tokenType, title, keyword);
          return true;
        }
      }
      return false;
    }

    function setTokenMatched(token, matchedType, text, keyword, indent, items) {
      token.matchedType = matchedType;
      token.matchedText = text;
      token.matchedKeyword = keyword;
      token.matchedIndent = (typeof indent === 'number') ? indent : (token.line == null ? 0 : token.line.indent);
      token.matchedItems = items || [];

      token.location.column = token.matchedIndent + 1;
      token.matchedGherkinDialect = dialectName;
    }

    function unescapeDocString(text) {
      return activeDocStringSeparator != null ? text.replace("\\\"\\\"\\\"", "\"\"\"") : text;
    }
  };

})