/*jshint esversion:6*/
import {Hexer16,LineAware} from './common.mjs';
import {Memory} from './ram.mjs';
import {Label} from './label.mjs';
import {Flag,Register} from './cpu.mjs';
let _count = 0;
export class Operation extends LineAware {
    static PEEKNO() {return _count;}
    static OPNO() {return _count++;}
    constructor(code,param) {
        super();
        this._opcode = code;

        this._opno = Operation.OPNO();
        this._label = null;
        this._value = param;
        Label.current(this);
        Operation.addOp(this);
    }
    get opcode() {return this._opcode;}
    get opno() {return this._opno;}
    set opno(v) {this._opno = v;}
    get label() {return this._label;}
    set label(v) {this._label = v;}
    get value() { return this._value.value;}
    get address() {return this._value.address;}
    set value(v) {this._value = v;}
    get declaration() {return false;}
    get translated_opno() {return this._opno;}
    toString() { return "";}
    exec() {
        this._exec();
        this.inc();
    }
    inc() {
        Register.I.value +=1;
    }
    _exec() {
        throw new Error("NOT IMPLEMENTED");
    }
    pp() {
        return Operation.OPCODE[this.opcode] + " " + Hexer16(this.address) + "\t[" + Hexer16((this.opcode<<14)+this.address) + "]";
    }
    get w() {
        console.log(this._value.address);
        let w =(this.opcode <<14) + this.address; 
        console.log(this.pp() + ": " + w  +" " + ((this.opcode<<14)));
        return w;
    }
}

export class Nand extends Operation {
    constructor(p) {
        super(Operation._NAND,p);
    }
    _exec() {
        Register.R.value = Register.R.value & ~this.value;
        Flag.C.unsetf();
    }
}
export class Add extends Operation {
    constructor(p) {
        super(Operation._ADD,p);
    }
    _exec() {
        Flag.C.unsetf();
        let v = Register.R.value + this.value;
        if (v > 0xFFFF) {
            Flag.C.setf();
            v &=0xFFFF;
        }
        Register.R.value = v;
    }
}
export class Sav extends Operation {
    constructor(p) {
        super(Operation._SAV,p);
    }
    _exec() {
        Memory.write(this.value,Register.R.value);
        console.log("Wrote " + Register.R.value + " to " + this.value);
    }
}
export class Jcz extends Operation {
    constructor(p) {
        super(Operation._JCZ,p);
    }
    _exec() {
        if (!Flag.C.f) {
            Register.I.value = this.value-1;
        }
    }
}
Operation._NAND = 0;
Operation._ADD = 1;
Operation._SAV = 2;
Operation._JCZ = 3;
Operation._HXNAND=0;
Operation._HXADD=0x4000;
Operation._HXSAV=0x8000;
Operation._HXJCZ=0xC000;
Operation.OPCODE = ["NAND","ADD","SAV","JCZ"];
Operation.ops = [];
Operation.currentLabel = null;
Operation.reset = () => {
    Operation.ops.length = 0;
    _count = 0;
}
Operation.NAND = (param) => {
    return new Nand(param);
};
Operation.ADD = (param) => {
    return new Add(param);
};
Operation.SAV = (param) => {
    return new Sav(param);
};
Operation.JCZ = (param) => {
    return new Jcz(param);
};
Operation.instructions = () => {
    return Operation.ops;
};
Operation.addOp = (op) => {
    Operation.ops[op.opno] = op;
};
