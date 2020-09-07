/*jshint esversion:6*/

import * as fss from 'fs';
//export const fs = fss;
global.fs = fss;
import {RT11} from './rt11.mjs';

let disk = new RT11(9600,2);
let txt = "ALOT OF LONGERTEXTTHAT023242345GOESHERE"
let words = disk.str_encode(txt);
console.log(words.map(w => w.toString(16)).join(" "));
let bytes = words.map(w => [w>>8, w&0xFF]).reduce((a,b) => [...a,...b]);
let decoded = disk.str_decode(bytes).join("");
console.log(txt + ":" + decoded);
console.log("ENCDEC: " + (txt === decoded));
console.log(disk.list());
console.log(disk.read_file('SYSREFTXT').toString());