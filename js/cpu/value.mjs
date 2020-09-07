/*jshint esversion:6*/
import {Symbol,Symbols} from './symbol.mjs';
import {Memory} from './ram.mjs';
import {Label} from './label.mjs';

export class Value {
    constructor(v) {
        this._value = v;
    }
    get value() {return this._value;}
}
Value.DIRECT = 0;
Value.INDIRECT = 1;
Value.LABEL = 2;
Value.SYMBOL=3;
Value.create = (type,v) => {
    
    switch(type) {
        case Value.DIRECT:
            return new DirectValue(v);
        case Value.INDIRECT:
            return new IndirectValue(v);
        case Value.LABEL:
            console.log("LABEL VALUE: " + v);
            return new LabelValue(v);
        case Value.SYMBOL:
            return new SymbolValue(v);
    }
};
class ResolvedValue extends Value {
    constructor(v) {
        super(v);
        this._res = null;
    }
    get is_resolved() {return this._res != null;}
    get resolved() {return this._res;}
    set resolved(v) {this._res = v;}
}

export class SymbolValue extends ResolvedValue {
    constructor(v) {
        super(v);
    }
    get symbol() {
        return this.resolved;
    }
    get address() {
        if (!this.is_resolved) {
            this.resolved = Symbols.find(super.value);
            if (!this.is_resolved) {
                this.resolved = Label.resolve(super.value);
                if (!this.is_resolved) {
                    console.log("Non resolved: " + super.value);
                }
            }
        }
        return this.symbol.address;
    }
    get value() {
        if (!this.is_resolved) {
            this.resolved = Symbols.find(super.value) || Label.resolve(super.value);
            if (!this.is_resolved) {
                console.log("Non resolved: " + super.value);
            }
        }
        
        return this.symbol.value;
    }
}
export class LabelValue extends Value {
    constructor(v) {
        super(v);
        this._res = null;
    }
    get is_resolved() {return this._res != null;}
    get resolved() {return this._res;}
    set resolved(v) {this._res = v;}
    get address() {
        if (!this.is_resolved) {
            this.resolved = Label.resolve(super.value);
            if (!this.is_resolved) {
                console.log("ERROR ERROR for " + super.value);
                return 0;
            }
        }
        return this.resolved.op.opno;
    }
    get value() {
        if (!this.is_resolved) {
            this.resolved = Label.resolve(super.value);
        }
        console.log(JSON.stringify(this.resolved.op));
        return this.resolved.op.opno;
    }
}
export class DirectValue extends Value {
    constructor(v) {
        super(v);
        //this._s = new Symbol(Symbol.generateName(),v);
    }
    get address() {
        return this.value;
    }
    get value() {return this._value;}
}
export class IndirectValue extends Value {
    constructor(v) {
        super(-1);
        this._address = v;
    }
    get address() {return this._address;}
    get value() { 
        console.log("Reading: " + this._address + " " + typeof(this._address));
        return Memory.read(this._address);
    }
}