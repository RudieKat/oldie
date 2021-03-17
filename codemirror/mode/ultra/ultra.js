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

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineMode('ultra', function(_config, parserConfig) {
    const numeric = /(0|0x[a-f0-9]{1,4}|[1-9][0-9]{0,4})/i;
    const variable = /(0|0[xX][a-fA-F0-9]{1,4}|[1-9][0-9]{0,4}|[_a-z][a-z0-9_]*)/;
    const keywords = /(add|nand|sav)/;
    const control_transfer =/jcz/;
    const comment = /;.*$/;
    const label = /[a-z_][a-z0-9_]*\:/;
    const symbol = /\.([a-z][a-z0-9_]*)/;
    const equality = /\w*=\w/;
    const constants = /^\.const\w*/;
    const data = /^\.data\w*/;
    const diskio = /^\.diskio\w*/;
    const iofile = /^\.file\w/;
    const filename = /\'([^\.]*\.[^\'])\'.*/;
    const file = new RegExp(/\.file\s*\'([^\.]*\.[^\'])\'.*/);

    let stored_state = 0;

    return {
      startState: function() {
        //console.log("Getting state: " + stored_state);
        return {
          context: 0
        };
      },
      token: function(stream, state) {

        if (stream.eatSpace())
          return null;

        let w;
        if (stream.eat(/;/)) {
          stream.skipToEnd();
          return "comment";
        }
        stream.eatWhile(/\.?[a-z0-9_]*[:]?/);
        w = stream.current();

        if (state.context >= 0 && state.context <=8 && w.indexOf(".") < 0) {
          state.context = ULTRA_PROGRAM;
          stored_state = state.context;
        }


        if (state.context < ULTRA_PROGRAM) {
          console.log(w + " state: " + state.context);
          if (/\.const/.test(w)) {
            if (!stream.skipTo(";")) {
              stream.skipToEnd();
            }
            if (state.context != 0) {
              return "error: const needs to go first and exactly once";
            }
            state.context = ULTRA_CONSTANTS;
            stored_state = state.context;

            return "def";
          } else if (/\.diskio.*/.test(w)) {

            stream.skipToEnd();
            if (state.context >ULTRA_DISKIO) {
              return "error: data needs to come first or after the constants block and exactly once";
            }
            state.context = ULTRA_DISKIO;
            stored_state = state.context;
            return "def";
          } else if (/\.data/.test(w)) {
            if (!stream.skipTo(";")) {
              stream.skipToEnd();
            }
            if (state.context >ULTRA_BUFFER) {
              return "error: data needs to come first or after the constants block and exactly once";
            }
            state.context = ULTRA_DATA;
            stored_state = state.context;
            return "def";
          } else if (/\.buffer/.test(w)) {
            if (!stream.skipTo(";")) {
              stream.skipToEnd();
            }
            if (state.context >1) {
              return "error: buffer needs to come first or after the constants block and exactly once";
            }
            state.context = ULTRA_BUFFER;
            stored_state = state.context;
            return "def";
          }else if (state.context === ULTRA_DISKIO && (state.context&ULTRA_SYMBOL)===0 && file.test(w)) {
            stream.backUp(w.length);
            stream.skipTo(" ");
            state.context|=ULTRA_SYMBOL;
            stored_state = state.context;
            return "iofile"
          }
          else if (state.context > 0 && (state.context&ULTRA_SYMBOL)==0 && /\.([_a-z][_a-z0-9]*)?/.test(w)) {

            stream.backUp(w.length);
            if (!stream.skipTo(" ")) {
              stream.skipToEnd();
            }

            state.context|=ULTRA_SYMBOL;
            stored_state = state.context;
            return "property";
          } else if (state.context&ULTRA_DISKIO && state.context&ULTRA_SYMBOL && filename.test(w.trim())) {

            stream.skipToEnd();
            state.context-=ULTRA_SYMBOL;
            stored_state = state.context;
            return "filename";
          }else if ((state.context&ULTRA_BUFFER)==0 && numeric.test(w.trim())) {
            stream.backUp(w.length);
            if (!stream.skipTo(";")) {
              stream.skipToEnd();
            }
            state.context-=ULTRA_SYMBOL;
            stored_state = state.context;
            return "number";
          } else if (state.context&ULTRA_BUFFER && state.context&ULTRA_SYMBOL && /'/.test(w.trim())) {
            stream.eatWhile(/[^']*/);
            stream.eat("'");
            w = stream.current();
            stream.backUp(w.length);
            if (!stream.skipTo(";")) {
              stream.skipToEnd();
            }
            state.context-=ULTRA_SYMBOL;
            stored_state = state.context;
            return "string";
          }
        }  else if (state.context=== ULTRA_PROGRAM && keywords.test(w)){
          state.context|=ULTRA_FUNCTION;
          stored_state = state.context;
          stream.backUp(w.length);
          stream.skipTo(" ");
          return "keyword";
        }else if (state.context == ULTRA_PROGRAM && control_transfer.test(w)) {
          state.context+=ULTRA_FUNCTION;
          stored_state = state.context;
          stream.backUp(w.length);
          stream.skipTo(" ");
          return "jump";
        }
        else if ((state.context&ULTRA_FUNCTION) == ULTRA_FUNCTION && variable.test(w)) {
          state.context-=ULTRA_FUNCTION;
          stored_state = state.context;
          stream.backUp(w.length);
          if (!stream.skipTo(";")) {
            stream.skipToEnd();
          }
          return "number";
        } else if ((state.context&ULTRA_PROGRAM) == ULTRA_PROGRAM && label.test(w)) {

          stream.backUp(w.length);
          if (!stream.skipTo(";")) {
            stream.skipToEnd();
          }
          return "attribute";
        } else if (state.context<3) {
          state.context = ULTRA_PROGRAM;
          stored_state = state.context;
        } else {
          stream.next();
        }
        return null;
      }
    };
  });

  CodeMirror.defineMIME("text/x-ultra", "ultra");

});


/*CodeMirror.defineSimpleMode("ultra", {
    // The start state contains the rules that are intially used
    start: [
        //{regex:/[\._a-z0-9;\s],token:"string"},
        {regex:/(0|0x[a-f0-9]{1,4}|[1-9][0-9]{0,4}|[_a-z][a-z0-9_]*)/,token:"variable"},
        {regex:/.const/,token:"constants",sol:true},
        {regex:/add|sav|nand/,token:"keyword",sol:true},
        {regex: /\.(const)?/,token:"constantsblock",indent:true},
        {regex: /(\.data)?/,token:"datablock",dedent:true,indent:true},
        {regex: /((\.[a-z][_0-9a-z])*)?/,token:"symbol"},
        {regex:/([_a-z][a-z0-9_]*):/,token:"label",indent:true},
        {regex:/(0|0x[a-f0-9]{1,4}|[1-9][0-9]{0,4}|[_a-z][a-z0-9_]*)/,token:"variable"},
        {regex:/add|sav|nand/,token:"keyword"},
        {regex:/jcz/,token:"conditional",dedent:true}
        
    ],
    // The meta property contains global information about the mode. It
    // can contain properties like lineComment, which are supported by
    // all modes, and also directives like dontIndentStates, which are
    // specific to simple modes.
    meta: {
    lineComment: ";"
    }
});*/