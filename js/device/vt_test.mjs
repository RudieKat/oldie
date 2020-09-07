/*jshint esversion:6*/

import {VT52} from './vt52.mjs';
import * as fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let src = fs.readFileSync(__dirname + "/../../data/txt/globe_mod.txt").toString();
console.log(src);
src = src.split("\n");
let term = new VT52(9600,0x2);
term.update_at_interval(1);
for (let i = 0; i < src.length;i++) {
    term.rcv_bits(term.chars_to_bits(src[i] + "\n"));
}
let ih = setInterval(() => {
    if (!term.read_available) {
        clearInterval(ih);
        term.end();
        term.ppa();
        
    } else {
        term.pp();
    }
},100);
