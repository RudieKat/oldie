/*jshint esversion:6*/
import { Memory } from "./ram.mjs";
import { Hexer16,LineAware } from './common.mjs';
const reserved = [
    "add","sav","nand", "jcz","R","Z","C","S","0","A","I"
];

export class Symbol extends LineAware {
    constructor(name,value) {
        super();
        this._name = name;
        this._value = value;
        this._address = -1;
        Symbols.add(this);
    }
    get name() {return this._name;}
    get address() {return this._address;}
    set address(v) {
        this._address = v;
        Memory.write(v,this._value);
    }
    get value() {
        if (this._address === -1 ) {
            return this._value;
        }
        return Memory.read(this.address);
    }
    get raw() {return this._value;}
    get w() {return this.value;}
    pp() {
        return Hexer16(this._address) + "\t" + this.name + "\t[" + Hexer16(this._value) + "]";
    }
}
Symbol.dynamicCount = 0;
Symbol.generateName = () => {
    return "__dyn" + Symbol.dynamicCount++;
};
export class Constant extends Symbol {
    constructor(name,value) {
        super(name,value);
    }
    get constant() {return true;}
    get address() { 
        return this._address;
    }
    set address(v) {
        this._address = v;
        Memory.write(v,this._value);
    }
}
export class SymbolBuffer extends Symbol {
    constructor(name,values) {
        super(name,0);
        this._values = values;
        this._len = new Symbol(name + "_len",values.length);
    }
    get value() {
        if (this._address === -1 ) {
            return this._value;
        }
        return Memory.read(this.address);
    }
    get address() {return this._address;}
    get constant() {return false;}
    buf_address(v) {
        this._address = v;
        for (let i = 0; i < this.length;i++) {
            Memory.write(v++,this._values[i]);
        }
        return v;
    }
    get length() {return this._values.length;}
}
export class IOFile extends Symbol {
    constructor(name) {
        super('file',name);
        this._name = name;
        this._data = [];
        this._eventListener = null;
        this._position = 0;
    }
    load() {
        let x = new XMLHttpRequest();
        x.open("GET",name)
        x.onload = () => {
            if (x.status===200) {

                this._data = x.responseText.split("").map(c=> c.codePointAt(0));
                this._eventListener.loaded(this._data.length);
                console.log(x.responseText);
            } else {
                alert("Failed to load file");
                this._eventListener.error(x.status);
            }
        }
        x.send();
    }
    get next() {
        if (this._position === this._data.length) {
            this._eventListener.close();
            return -1;
        }
        return this._data[this._position++];
    }
    set listener(e) {this._eventListener = e;}
    get value() {
        return 0;
    }
    get raw() {
        return 0;
    }


}
export class InputSymbol extends Symbol {
    constructor(name,value) {
        super(name,value);
        this._src = null;
    }
    set src(c) {this._src = c;}
    get src() {return this._src;}
    get value() {
        if (this.src !== null) {
            return this.src.next;
        }
    }
}
export class DiskIO {
    constructor(file,size, open, read, write) {
        this._file = file;
        this._file.listener(this);
        this._size = size;
        this._open = open;
        this._read = read;
        this._write = write;
        this._file.load();
    }
    get file() {return this._file;}
    get size() {return this._size;}
    get open() {return this._open;}
    get read() {return this._read;}
    get write() {return this._write;}
    close() {
        this.open.value = 0;
    }
    loaded(sizeInBytes) {
        this.size.value = sizeInBytes;
        this.open.value = 1;

    }
}
class SymbolTable {
    constructor() {
        this._symbols = [];
        this._smap = new Map();
    }
    add(symbol) {
        if (reserved.indexOf(symbol.name)>=0) {
            throw new Error("Symbols can't use reserved keywords: " + symbol.name);
        } else if (this._smap.get(symbol.name)!=null) {
           
            throw new Error("Symbol with the name " + symbol.name + " already exists");
        } 
        this._smap.set(symbol.name,symbol);
        this._symbols.push(symbol);
    }
    addBuffer(buffer) {
        if (reserved.indexOf(buffer.name)>=0) {
            throw new Error("Symbols can't use reserved keywords: " + buffer.name);
        } else if (this._smap.get(buffer.name)!=null) {
            throw new Error("Symbol with the name " + buffer.name + " already exists");
        }
        this._smap.set(buffer.name,buffer);
        this._symbols.push(buffer);
    }
    find(v) {
        return this._smap.get(v);
    }
    resolve(v) {
        return this.find(v);
    }
    reset() {
        this._symbols.length = 0;
        this._smap.clear();
    }
    get count() {return this._symbols.length;}
    get constant_count() {return this._symbols.filter(s => s.constant).length;}
    
    get dynamic() {return this._symbols.filter(s => !s.constant && !(s instanceof SymbolBuffer));}
    get buffers() {return this._symbols.filter(s => s instanceof SymbolBuffer);}
    get constants() {return this._symbols.filter(s => s.constant);}
    map_constants(memAdd) {
        this.constants.forEach(s => s.address = memAdd++);
        return memAdd;
    }
    map_buffers(memAdd) {
        this.buffers.forEach( b => memAdd = b.buf_address(memAdd));
        return memAdd;
    }
    map_dynamic(memAdd) {
        this.dynamic.forEach(s => s.address = memAdd++);
        //next free adress
        return memAdd;
    }
    pp() {
        let s = "\tSYMBOLS\n===================\n";
        for(let i = 0; i < this.count;i++) {
            s +=this._symbols[i].pp() + "\n";
        }
        return s + "===================\n";
    }
}
export const Symbols = new SymbolTable();