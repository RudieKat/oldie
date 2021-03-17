/*jshint esversion:6*/
import {Symbols} from './symbol.mjs';
import {Hexer16} from './common.mjs';
import {Operation} from './op.mjs';
import { Register,Reporter,Flag,CPU } from './cpu.mjs';
export class Memory extends Reporter{
    constructor(size) {
        super("RAM");
        this._size = size || 0xFFFF;
        this._data = new Array((this._size-4)).fill(0);
        this._protected = [0,0,0,0];
        this._volatile = 0;
        this._opStart =0;
        this._reserved = 0;
        this._lock = false;
        this._cpu = null;
        this._latest = {
            addr:0,
            datum:0
        };
    }
    set cpu(v) {this._cpu = v;}
    reset() {
        this._protected = [0,0,0,0];
        this._data.fill(0);
        this._volatile = 0;
        this._opStart = 0;
        this._lock = false;
    }
    

    get size() {return this._size;}
    get opStart() {return this._opStart;}
    get reserved() {return this._reserved;}
    process(ops) {
        this._lock = false;
        this._volatile = Symbols.map_constants(0);
        this._lock = true;
        this._volatile = Symbols.map_buffers(this._volatile);
        this._opStart=Symbols.map_dynamic(this._volatile);
        let reserve = Symbols.resolve("reserve_mutable");
        if (reserve && reserve.constant) {
            this._reserved = reserve.raw;
            this._opStart+=this.reserved;
        }
        Register.I.value = this._opStart;
        for (let i = 0; i < ops.length;i++) {
            //console.log("Writing op: " + ops[i].pp());
            ops[i].opno = this._opStart+i;
            try {
                this.w(i+this._opStart,ops[i].w);
            } catch(e) {
                this.w(i+this,0xF000);
            }
        }
        let op = (Operation._SAV<<14) + 0x3FFF;
        this.w(this._opStart + ops.length,op);
        Register.I.value = this._opStart;
    }
    rp(addr) {return this._protected[addr];}
    wp(addr,v) {this._protected[addr] = v;}
    wrp(addr,v){this._protected[addr] = v;return this._data[v];}
    /*
    * Protected memory
    */
    
    r(addr) {return this._data[addr];}
    w(addr,v) {
        this._latest.addr = addr;
        this._latest.datum = v;
        if (addr < this._volatile && this._lock) {
            this._cpu.halt();
            alert("HALTING AND CATCHING FIRE");

            if (addr !== 0) {
                console.log("ACCESS VIOLATION - attempting to write to [0x" + addr.toString(16) + "] in non volatile segment");
            }
            return null;
        }
        this._data[addr] = v;
    }
    fw(addr,v) {
        this._latest.addr = addr;
        this._latest.datum = v;
        if (addr >= this._volatile && addr <this._data.length) {
            this._data[addr] = v;
        } else {
            this._cpu.halt();
            if (addr !== 0) {
                console.log("ACCESS VIOLATION - attempting to write to [0x" + addr.toString(16) + "] in non volatile segment");

            }
            return null;
        }
    }
    get latest() {
        return this._latest;
    }
    ppProtected() {
        let s = "\PROTECTED\n=============================================\n";
        for (let i = 0; i < this._protected.length;i+=4) {
            s +=Hexer16(i) + " |\t" + this._protected.slice(i,i+4).map(v => Hexer16(v)).join("   ") + "\n";
        }
        return s+"=============================================\n";
    }
    ppData(mx) {
        let s = "\t\tDATA\n=============================================\n";
        let dd = [...this._data];
        mx = mx ||dd.length;
        for (let i = 0; i < mx;i+=4) {
            s +=Hexer16(i) + " |\t" + dd.slice(i,i+4).map(v => Hexer16(v)).join("   ") + "\n";
        }
        return s+"=============================================\n";
    }
}
Memory._mem = new Memory();
Memory.reset = () => {
    Memory._mem.reset();
};
Memory.block = () => {
    Memory._mem.debug = false;
}
Memory.unblock = () => {
    Memory._mem.debug = true;
}
Memory.mem = () => {
    return Memory._mem;
}
Memory.opStart = () => {return Memory._mem.opStart;};
Memory.size = () => {return Memory._mem.size;};
Memory.reserved = () => {return Memory._mem.reserved;};
Memory.reserve_start = () => {return Memory.opStart() - Memory.reserved();};
Memory.read = (a) => {return Memory._mem.r(a);};
Memory.write = (a,v) => { Memory._mem.w(a,v);};
Memory.readp = (a) => {return Memory._mem.rp(a);};
Memory.writep = (a,v) => {Memory._mem.wp(a,v);};
Memory.wrp = (a,v) => {return Memory._mem.wrp(a,v);};


