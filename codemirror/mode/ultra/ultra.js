// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE
/*jshint esversion:6*/
const ULTRA_CONSTANTS = 1;
const ULTRA_DISKIO=2;
const ULTRA_BUFFER = 4;
const ULTRA_DATA = 8;
const ULTRA_SYMBOL=16;
const ULTRA_PROGRAM=32;
const ULTRA_FUNCTION=64;


const ROW_PROPERTY = 1;
const ROW_VALUE = 2;
const ROW_FILE = 4;
const PROGRAM_LINE = 8;
const NUMERIC = 1;
const STRING = 2;
const NUMERIC_BUFFER = 4;
const STRING_BUFFER = 8;
const KEYWORD = 16;
const LABEL = 32;
const ADDRESS = 64;
const stored_state = {
  "context": 0,
  "row_state":0,
  "row_expected":0,
  stream:null,
  copy:(s) => {
    this.context = s.context;
    this.row_expected = s.row_expected;
    this.row_state = s.row_state;
  }
};

const numeric = /(0|0x[a-f0-9]{1,4}|[1-9][0-9]{0,4})/i;
const numeric_buffer = /\[([\da-fA-F,xX]*)\]/;
const stringBuffer = /\'([^\']*)\'/;
const variable = /(0|0[xX][a-fA-F0-9]{1,4}|[1-9][0-9]{0,4}|[_a-z][a-z0-9_]*)/;
const keywords = /(add|nand|sav)/;
const control_transfer = /jcz/;
const comment = /;.*$/;
const label = /[a-z_][a-z0-9_]*\:/;
const symbol = /\.([a-z][a-z0-9_]*)/;
const equality = /\w*=\w/;
const constants = /^\.const\w*/;
const buffer = /^\.buffer\w*/;
const data = /^\.data\w*/;
const diskio = /^\.diskio\w*/;
const iofile = /^\.(file)/;
const filename = /\'([^\.]*\.[^\'])\'.*/;
const file = new RegExp(/\.file\s*\'([^\.]*\.[^\'])\'.*/);

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineMode('ultra', function (_config, parserConfig) {



    CodeMirror.defineMIME("text/x-ultra", "ultra");
    return {
      "startState": function () {
        //console.log("Getting state: " + stored_state);
        return {
          "context": 0,
          "row_state": 0,
          "row_expected": 0
        };
      },
      "token": (stream, state) => {
        return getToken(stream, state);
      }
    }
  });
});



    let stream = null;
    let state = null;

    function getToken(str, sta) {
      stream = str;
      state = sta;
      if (stream.eatSpace()) {
        return null;
      }

      if (stream.eat(/;/)) {
        stream.skipToEnd();
        return "comment";
      }
      stream.eatWhile(/\.?[a-z0-9_]*[:]?/);
      let w = stream.current();

      if (state.context >= 0 && state.context <= 8 && w.indexOf(".") < 0) {
        state.context = ULTRA_PROGRAM;
        state.row_state = 0;
        state.row_expected = 0;
        stored_state.copy(state)
      }

      let v = checkStateChange(w);
      if (v) {
        return v;
      }
      switch (state.context) {
        case ULTRA_CONSTANTS:
          if (state.row_state === ROW_PROPERTY && state.row_expected === 0) {
            return readSymbol();
          } else if (state.row_expected === NUMERIC) {
            return readNumeric();
          }
          return null;
        break;
        case ULTRA_DISKIO:
            if (state.row_state === ROW_PROPERTY && state.row_expected === 0) {
              return readSymbol(w);
            } else if (state.row_expected === ROW_FILE) {
              if (file.test(w)) {
                state.row_expected = STRING;
                state.row_state = ROW_VALUE;
                stream.skipTo(" ");
                return "file";
              }
            } else if (state.row_expected === STRING) {
              if (filename.test(w)) {
                resetRow();
                return "filename";
              }
            } else if (state.row_expected === NUMERIC) {
              return readNumeric(w)

            }
            return null;

          break;
        case ULTRA_BUFFER:
          if (state.row_expected === ROW_PROPERTY) {
            readSymbol();
            state.row_state = ROW_VALUE;
            state.row_expected = STRING_BUFFER + NUMERIC_BUFFER;
          } else if (state.row_expected === (STRING_BUFFER + NUMERIC_BUFFER)) {
            if (stringBuffer.test(w.trim())) {
              backupAndSkip(w.length);
              state.row_state = ROW_PROPERTY;
              state.row_expected = 0;
              return "stringbuffer"
            } else if (numeric_buffer.test(w.trim())) {
              backupAndSkip(w.length);
              state.row_state = ROW_PROPERTY;
              state.row_expected = 0;
              return "numericbuffer"
            }
          }
          break;
        case ULTRA_PROGRAM:
          if (state.row_expected === LABEL + KEYWORD) {
            if (label.test(w.trim())) {
              stream.skipToEnd();
              return "label"
            } else if (keywords.test(w.trim())) {
              state.row_expected = ADDRESS;
              stored_state.copy(state)
              return "keyword";
            } else if (control_transfer.test(w.trim())) {
              state.row_expected = LABEL;
              stored_state.copy(state)
              return "jump";
            }
          } else if (state.row_expected === ADDRESS && variable.test(w.trim())) {
            resetRow(LABEL + KEYWORD);
            backupAndSkip(w.length)
            return "variable";
          } else if (state.row_expected === LABEL && label.test(w.trim())) {
            resetRow(LABEL + KEYWORD);
            backupAndSkip(w.length)
            return "attribute"
          } else {
            stream.next();
          }
          return null;
      }


    }

    function checkStateChange(w) {
      let start = state.context;
      if (constants.test(w)) {
        if (state.context > 0) {
          return "ERROR .const can only be defined FIRST"
        }
        state.context = ULTRA_CONSTANTS;
        state.row_state = ROW_PROPERTY;
      } else if (diskio.test(w)) {
        if (state.context > ULTRA_CONSTANTS) {
          return "ERROR: .diskio can only be defined after .const and before .buffer and .data";
        }
        state.context = ULTRA_DISKIO;
        state.row_state = ROW_PROPERTY;
        state.row_expected = ROW_FILE;
      } else if (buffer.test(w)) {
        if (state.context > ULTRA_DISKIO) {
          return "ERROR: .buffer can only be defined after .const/diskio and before .data";
        }
        state.context = ULTRA_BUFFER;
        state.row_state = ROW_PROPERTY;
      } else if (data.test(w)) {
        if (state.context > ULTRA_BUFFER) {
          return "ERROR: either data is already defined or it is misplaced, "
        }
        state.context = ULTRA_DATA;
        state.row_state = ROW_PROPERTY;

      }
      if (start !== state.context) {
        skipDef();
        stored_state.copy(state)
        return "def";
      } else {
        state.context = ULTRA_PROGRAM;
        state.row_state = KEYWORD + LABEL;
        stored_state.copy(state)
      }
    }

    function resetRow(r, s) {
      r = r || ROW_PROPERTY;
      s = s || 0;
      state.row_expected = ROW_PROPERTY;
      state.row_state = 0;
      stored_state.copy(state);
    }

    function readSymbol(w) {
      if (/\.([_a-z][_a-z0-9]*)?/.test(w)) {
        state.row_state = ROW_VALUE;
        switch (state.context) {
          case ULTRA_CONSTANTS:
          case ULTRA_DATA:
            state.row_expected = NUMERIC;
            break;
          case ULTRA_DISKIO:
            state.row_expected = STRING + NUMERIC;
            break;
          case ULTRA_BUFFER:
            state.row_expected = NUMERIC_BUFFER + STRING_BUFFER;
            break;
        }
        stored_state.copy(state)
        return "def";
      }
    }

    function skipDef() {
      if (!stream.skipTo(";")) {
        stream.skipToEnd();
      }
    }

    function backupAndSkip(l) {
      stream.backUp(l);
      if (!stream.skipTo(";")) {
        stream.skipToEnd();
      }
    }

    function readNumeric(w) {
      if (numeric.test(w.trim())) {
        backupAndSkip(w.length);
        return "numeric";
      }
    }


