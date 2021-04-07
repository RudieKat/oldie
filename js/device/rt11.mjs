/*jshint esversion:6*/

import {RS232} from './rs232.mjs';
import {io_ex, primaryBlock, RS323ModemDevice, RS323TerminalDevice} from "../io/io2.mjs";

//import * as fs from 'fs;

const __dirname ="/Users/niklas/dev/projects/private/ultra/js/device";
const RT_RADIX_50 = " ABCDEFGHIJKLMNOPQRSTUVWXYZ$.%0123456789";


export const RT11_CREATE = 0x1B45; // ESC E
export const RT11_DIRECTORY = 0x30; // ASCII 0
export const RT11_FILE = 0x31; //  ASCII 1
export const RT11_COPY = 0x1B46; //ESC F
export const RT11_MOVE = 0x1B47; //ESC G
export const RT11_DELETE = 0x1B48; //ESC H
export const RT11_OPEN = 0x1B49; //ESC I
export const RT11_READ = 0x1B4A; //ESC J
export const RT11_WRITE = 0x1B4B; //ESC K
export const RT11_POSITION = 0x1B4C; //ESC L

const RT11_BLOCK=128;
/**
 * File system that uses contiguous blocks (dumb but reasonable for the period)
 * to store files. Block size is 128 bytes and there are 2048 blocks in
 * total minus the 16 blocks assigned to the device table (ergo 2032)
 * 
 */
export class RT11 extends RS232 {
    constructor(rate,transmit_flag) {
        super(rate,transmit_flag);
        this._data = null;
        this._fs_in = new RS323ModemDevice(9600,10);
        this._fs_in.getInputType = ()=>{return primaryBlock};
        this._fs_out = new RS323TerminalDevice(9600,10);
        this._fs_out.getOutputType = ()=>{return primaryBlock};


        io_ex.register(this._fs_in);
        io_ex.register(this._fs_out);
        
        if (fs.existsSync(__dirname + "/../../data/device/___rt11")) {
            this._data = fs.readFileSync(__dirname + "/../../data/device/___rt11");

        } else {
            this._data = new Uint8Array(1024*512);
            fs.writeFileSync(__dirname + "/../../data/device/___rt11",this._data);
            this._data = fs.readFileSync(__dirname + "/../../data/device/___rt11");
        }
        this._data.writeUInt8 = (i,v) => {
            this[i] = v;
        }
        this._ft = new RT11FileTable(this);
        
        
    }
    get readio() {return this._fs_out;}
    get writeio() {return this._fs_in;}
    list() {
        return this._ft.files;
    }
    read_file(name) {
        let f = this.list().filter(l => l.name === name);
        if (f.length == 0) {
            return [];
        }
        return this.read_bytes(f[0]*RT11_BLOCK, f[0].length);
    }
    initialized() {
        return this._data[0] === 0xFE;
    }
    read_byte(addr) {
        return this._data[addr];
    }
    read_word(addr) {
        return (this.read_byte(addr)<<8) + this.read_byte(addr+1);
    }
    read_bytes(offset,length) {
        return this._data.slice(offset,length);
    }
    read_words(offset,length) {
        let w = [];
        while (w.length < length) {
            w.push(this.read_word(offset));
            offset+=2;
        }
        return w;
    }
    write_bytes(offset,data) {
        console.log("Writing starting at " + offset + " and " + data.length + " bytes");
        for (let i = 0; i < data.length;i++) {
            this._data.writeUInt8(data[i], offset + i);
        }
    }
    persist() {
        console.log("PERSISTING");
        fs.writeFileSync(__dirname + "/../../data/device/___rt11",this._data);
    }
    str_encode(str) {
        let pad = (3 - str%3)&3;
        str+=" ".repeat(pad);
        let words = [];
        let idx = 0;
        let bytes = str.split("").map(c => RT_RADIX_50.indexOf(c));
        for (let i = 0; i < str.length;i+=3) {
            words.push(1600*bytes[i] + 40*bytes[i+1] + bytes[i+2]);
        }
        return words;
    }
    str_decodew(words) {
        let ch = [];
        for(let i = 0; i <words.length;i++) {
            let t = (words[i]/1600)>>0;
            let l = words[i]%40;
            let m = ((words[i]/40)>>0)%40;
            ch.push(RT_RADIX_50[t]);
            ch.push(RT_RADIX_50[m]);
            ch.push(RT_RADIX_50[l]);
        }
        return ch;
    }
    str_decode(bts) {
        let words = [];//bytes.length/2;
        for (let i = 0; i<bts.length;i+=2) {
            words.push((bts[i]<<8) + bts[i+1]);
        }
        console.log(words.length + " words");
        return this.str_decodew(words);
    }
}
const RT11_TABLE_START = 16;
class RT11FileTable {
    constructor(disk) {
        this._disk = disk;
        this._ft = this.disk.read_bytes(0,16*RT11_BLOCK);
        this._ft = new Uint8ClampedArray(this._ft);
        this._ft.writeUInt8 = (i,v)=> {
            this[i] = v;
        }
        console.log(this.ft[0].toString(16) + ", " + (this.ft[1]<<8).toString(16) + " " + this.ft[2]);
        console.log(this.disk.read_byte(2));
        if (this.ft[0] !== 0xFE || this.disk.read_word(1)===0) {
            console.log("Initializing disk");
            //disk is uninitialized
            let ft = this._ft;
            ft[0] = 0xFE;
            ft[2] = 1;
            ft[RT11_TABLE_START] = 0;
            let txt = fs.readFileSync(__dirname + "/../../data/txt/SYSINF.TXT").toString();
            txt = txt.split("").map(c => c.codePointAt(0));
            let f_length = txt.length;
            this.disk.write_bytes(16*RT11_BLOCK,txt);
            let name = this.disk.str_encode("SYSREFTXT").map(w => [w>>8,w&0xFF]).reduce((a,b) => [...a,...b]);
            for(let i = 0; i < name.length;i++) {
                ft.writeUInt8(name[i], RT11_TABLE_START + i);
            }
            ft.writeUInt8(0, RT11_TABLE_START+6);
            ft.writeUInt8(16, RT11_TABLE_START+7);
            ft.writeUInt8(f_length>>8, RT11_TABLE_START+8);
            ft.writeUInt8(f_length&0xff, RT11_TABLE_START+9);
            this.disk.write_bytes(0,ft);
            this.disk.persist();
        }
    }
    get ft() {
        return this._ft;
    }
    get files() {
        let fcount = this.disk.read_word(1);
        let addr = RT11_TABLE_START;
        let files = [];
        for (let i = 0; i < fcount;i++) {
            files.push({
                name:this.disk.str_decodew(this.disk.read_words(addr,3)).join(""),
                block:this.disk.read_word(addr+6),
                length: this.disk.read_word(addr+8)
            });
        }
        return files;
    }

    get disk() {return this._disk;}
}