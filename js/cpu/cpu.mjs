/*jshint esversion:6*/
import {Memory} from './ram.mjs';
import {Operation} from './op.mjs';
import {Label} from './label.mjs';
import {Symbols} from './symbol.mjs';
import {Hexer16,Binary16} from './common.mjs';
import { LineAware } from './common.mjs';
//import { IO_READ, IO_WRITE, IOStream } from '../bus/io.mjs';
import { DCE,DTE,RS323TerminalDevice,RS323ModemDevice } from '../io/io2.mjs';
//import { devnull } from '../bus/io.mjs';
export class Reporter {
    constructor(type) {
        this._listener = null;
        this._debug = true;
        this._type = type;
        this.report = () => {};
        Reporter.register(this);
    }
    get type() {return this._type;}
    set debug(v) {this._debug = v;}
    get debug() {return this._debug;}
    set onchange(l) {
        this._listener = l;
        this.report = () => {
            if (this.debug) {
                this._listener(this.type,this.latest);
            }
        };
    }
    block() {
        this.debug = false;
        this.report = () => {}
    }
    unblock() {
        this.debug = true;
        if (this._listener) {
            this.report = () => {
                if (this.debug) {
                    this._listener(this.type,this.latest);
                }
            };
        }
    }
}
Reporter.reporters = [];
Reporter.report = () => {
    for (let i = 0; i < Reporter.reporters.length;i++) {
        Reporter.reporters[i].report();
    }
};
Reporter.block = () => {
    for (let i = 0; i < Reporter.reporters.length;i++) {
        Reporter.reporters[i].block();
    }
};
Reporter.unblock = () => {
    for (let i = 0; i < Reporter.reporters.length;i++) {
        Reporter.reporters[i].unblock();
    }
};
Reporter.register = (r) => {
    Reporter.reporters.push(r);
};

export class Flag extends Reporter{
    constructor(type,initial) {
        super(type);
        
        this._fval = initial;
        if (initial) {
            this.setf();
        } else {
            this.unsetf();
        }
    }
    
    unsetf() { 
        if (!this._fval) {
            return;
        }
        let v = Memory.readp(0);
        v &= ~this.type;
        Memory.writep(0,v);
        this._fval = !this._fval;
    }
    setf() {
        if (this._fval) {
            return;
        } 
        let v = Memory.readp(0);
        v |= this.type;
        Memory.writep(0,v);
        this._fval = true;
    }
    set f(v) {
        
        if (v !== this._fval){
            if (v) {
                this.setf();
            } else {
                this.unsetf();
            }
        }
    }
    //10 922 690
    get f() {
        return this._fval;
        //return ((Memory.readp(0)&this.type))>>(this.type-1) == 1;
    }
    get latest() {return this._fval;}
}
Flag.Z_T = 1;
Flag.C_T = 2;
Flag.S_T = 4;
Flag.O_T = 8;
Flag.toType = (v) => {
    switch (v) {
        case 'Z':
            return Flag.Z_T;
        case 'C':
            return Flag.C_T;
        case 'S':
            return Flag.S_T;
        case 'O':
            return Flag.O_T;
        default:
            return -1;
        
    }
};
Flag.create = () => {
    Flag.Z = new Flag(Flag.Z_T,0);
    Flag.C = new Flag(Flag.C_T,0);
    Flag.S = new Flag(Flag.S_T,0);
    Flag.O = new Flag(Flag.O_T,0);
};
Flag.block = () => {
    Flag.C.block();
    Flag.Z.block();
    Flag.S.block();
    Flag.O.block();
};
Flag.unblock = () => {
    Flag.C.unblock();
    Flag.Z.unblock();
    Flag.S.unblock();
    Flag.O.unblock();
}
export class Register extends Reporter{
    constructor(type) {
        super(type);
        this._mem = Memory.mem();
        this._last = 0;
        
        setTimeout(()=> {
            this.value = 0;
        },5);
    }
    get fv() {return this._last;}
    set fv(v) {
        this._last = v||0;
        this._mem.wp(this._type,v||0);
        this.updated();
    }
    get value() {return this._last;}
    set value(v) {
        this._mem.wp(this._type,v||0);
        this._last = v||0;
        this.updated();
    }
    get latest() {return this._last;}
    increment() { this._mem = this.value + 1;}
    updated() {}
}
class AccumulatorRegister extends Register {
    constructor() {
        super(Register.R_T);
    }
    get fv() {
        return super.fv;
    }
    set fv(v) {
        super.fv = v;
        Flag.Z.f =v===0?1:0;
    }
    get value() {return super.value;}
    set value(v) {
        super.value = v;
        Flag.Z.f =v===0?1:0;
    }
}
class AddressRegister extends Register {
    constructor(type) {
        super(type);
        this._data = 0;
    }
    get data() {return this._data;}
    fv(v) {
        this._data = this._mem.wrp(2,v);
        this._last = v;
        return this._data;
    }
    set value(v) {
        this._data = this._mem.wrp(this._type,v);
        this._last = v;
        if (this._debug && this._listener) {
            this._listener(this._type,v);
        }
    }
}
class IORegister extends Register {
    constructor(type) {
        super(type);
        this._device = 0;
        this._stream = null;
        if (type === Register.IN_T) {
            this._stream = new RS323ModemDevice(9600,10);
        } else {
            this._stream = new RS323TerminalDevice(9600,10);
        }
        //new (type === Register.IN_T?IO_READ:IO_WRITE);
        //this.connect(devnull);
    }
    connect(bus) {
        this.stream.connect(bus);
    }
    get stream() {return this._stream;}
    get device() {return this._device;}
    set device(v) {
        this._device = v;
    }
    
}
class IOOutRegister extends IORegister {
    constructor() {
        super(Register.OUT_T);
        
    }
    get value() { return this._last;}
    get fv() {return this._last;}
    set value(v) {
        this.fv = v;
    }
    set fv(v) {
        this._last = v;
        this.stream.write(v);
    }
}
class IOInRegister extends IORegister {
    constructor() {
        super(Register.IN_T);
        
    }
    get value() {
        return this.fv;
    }
    set value(v) {}
    set fv(v) {}
    get fv() {
        this._last =  this.stream.read();
        return this._last;
    }
}
    
Register.R_T = 1;
Register.A_T = 2;
Register.I_T = 3;
Register.IN_T = 4;
Register.OUT_T = 5;
Register.block = () =>{
    Register.R.block();
    Register.I.block();
    Register.IN.block();
    Register.OUT.block();
    Register.A.block();
};
Register.unblock = () =>{
    Register.R.unblock();
    Register.I.unblock();
    Register.IN.unblock();
    Register.OUT.unblock();
    Register.A.unblock();
};
Register.find = (v) => {
    switch (v) {
        case 'R':
            return Register.R;
        case 'I':
            return Register.I;
        case 'A':
            return Register.A;
        default:
            return -1;
    }
};
Register.create = () => {
    Register.R = new AccumulatorRegister(Register.R_T);
    Register.A = new AddressRegister(Register.A_T);
    Register.I = new Register(Register.I_T);
    Register.IN = new IOInRegister(Register.IN_T);
    Register.OUT = new IOOutRegister(Register.OUT_T);
};
    

export class CPU extends Reporter{
    constructor() {
        super("CPU");
        this._mem = Memory._mem;
        this._mem.cpu = this;
        Flag.create();
        Register.create();
        this._ops = Operation.ops;
        //this._labels = Label.reg;
        this._breakpoints = [];
        this._running = true;
        this._cycles = 0;
    }
    halt() {
        this._running = false;
    }
    reset() {
        this.mem.reset();
        this._ops.length = 0;
        this.cycles = 0;
        this.halt();
        Register.R.fv = 0;
        Register.I.value = this.mem.opStart;
        //Register.A.value = 0;
        Reporter.report();
    }
    set cycles(v) {this._cycles = v;}
    get cycles() {return this._cycles;}
    get latest() {return this.cycles;}
    
    get mem() {return this._mem;}
    addBreakpoint(p) {
        this._breakpoints.push(p);
    }
    process(){
        this.mem.process(this._ops);
        return this;
    }
    get instruction() {
        return Register.I.value;
    }
    get running() {return this._running;}
    step() {
        let pos = Register.I.value;
        if (pos === 0) {
            this.process();
            this.step();
            return;
        }
        let op = Memory.read(pos);
        this.fexec_op(op);
        this._cycles++;
        Reporter.report();
        
        return pos;
    }
    execSlow(opsPerSec) {
        this._cycles = 0;
        opsPerSec = opsPerSec || 10;
        let msPerCycle = (10000/opsPerSec)>>0;
        let op = null;
        let pos = Register.I.fv;
        if (msPerCycle< 5) {
            console.log("Not enough yield time");
            return false;
        }
        this._mem.debug = true;
        this._running = true;
        Reporter.unblock();
        let th = setInterval(() => {
            if (this._running && (op = Memory.read(pos))!=null) {
                this.fexec_op(op);
                pos = Register.I.fv;
                this._cycles++;
                Reporter.report();
            } else {
                clearInterval(th);
            }
        },msPerCycle);
    }
    exec() {
        this._cycles++;
        let op = null;
        let pos = Register.I.value;
        this._mem.debug = false;
        this._running = true;
        Reporter.block();
        let t = 0;
        let ts = new Date().getTime();
        while (this.running && (op=Memory.read(pos))!=null) {
            
            /*if (this.debug && this._breakpoints.indexOf[pos] >=0) {
                break;
            }*/
            t++;
            this.fexec_op(op);
            pos = Register.I.fv;
        }
        this.halt();
        ts = new Date().getTime()-ts;
        console.log(t + " operations in " + ts + "ms (" + (t/ts) + " ops/ms or " + (((t/ts)*1000)>>0) + " ops/sec");
    }
    
    fexec_op(op) {
        let opc = op&0xC000;
        op-=opc;
        let c = Flag.C.f;
        if ( this._cycles  && Register.I.fv === this.mem.opStart) {
            Register.OUT.fv = Register.R.fv;
            Register.R.fv = Register.IN.fv;
        }
        Register.I.fv +=1;
        switch(opc) {
            case Operation._HXNAND:
                Register.R.fv = (~(Register.R.fv & Register.A.fv(op)))&0xFFFF;
                c = false;
                break;
            case Operation._HXADD:
                op = Register.R.fv + Register.A.fv(op);
                c = op>0xffff;
                Register.R.fv = op&0xffff;
                break;
            case Operation._HXSAV:
                this._mem.fw(op,Register.R.fv);
                break;
            case Operation._HXJCZ:
                if (!c) {
                    Register.I.fv = op;
                }
                c = false;
                break;
        }
        Flag.C.f = c;
        
    }
    /*exec_op(op) {
        
        let opCode = op>>14;
        op &=0x3FFF;
        Register.A.value = op;
        switch (opCode) {
            case Operation._NAND:
                op = Memory.read(op);
                Register.R.value = (~(Register.R.value & op))&0xFFFF;
                Flag.C.unsetf();
                break;
            case Operation._ADD:
                let v = Register.R.value + Memory.read(op);
                Flag.C.f = ((v&0x10000)===0x10000)?1:0 ;
                Register.R.value = v&0xFFFF;
                break;
            case Operation._SAV:
                if (op > Memory.size()) {
                    Register.I.value = 0xFFFF;
                    return;
                }
                Memory.write(op,Register.R.value);
                break;
            case Operation._JCZ:
                
                if (!Flag.C.f) {
                    Register.I.value = op;
                    //_loopstop--;
                    //if (_loopstop<=0) {
                    //    Register.I.value = -1;
                        
                    //}
                    return;
                }
                Flag.C.unsetf();
                break;
            default:
                throw new Error("ERROR IN EXEC_OP");
        }
        Register.I.value+=1;
    }*/
    ppOps() {
        let s = "    OPERATIONS\n=================\n";
        for (let i = 0; i < this._ops.length;i++) {
            s+=Hexer16(this._ops[i].opno) + "\t" + this._ops[i].pp() + "\n";
        }
        return s + "=================\n";
    }
    ppSymbols() {
        return Symbols.pp();
    }
}
CPU.cpu = () => {
    CPU.cpu = new CPU();
    CPU.reset();
    return CPU.cpu;
};
CPU.reset = () => {
    CPU.cpu.reset();
    Symbols.reset();
    Label.reset();
    LineAware.reset();
    Operation.reset();
    Reporter.report();
};

