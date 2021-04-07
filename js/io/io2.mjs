import {Memory, Register, Symbols} from "../cpu/index.mjs";

export const DTE = 1;
export const DCE = 2;
export const PARITY_NONE=0;
export const PARITY_ODD=1;
export const PARITY_EVEN=3;
export const PARITY_MARK=5;
export const PARITY_SPACE=7;

export const primaryInput = 256;
export const primaryOutput = 512;
export const primaryBlock = 1024;
export const primaryTTY = 1536;
export const primaryDisplay = 2048;
export const primaryComm = 4096;
export const primaryHardcopy = 9192;

class IOExchange {
    constructor() {
        this._register_in = null;
        this._register_out = null;
        this._fs_in = null;
        this._fs_out = null;
        this._screen_in = null;
        this._screen_out = null;
        this._inputMap = {};
        this._outputMap = {};

    }
    set registerIn(r) {this._register_in = r;}
    set registerOut(r) {this._register_out=r;}
    set fsRead(fsr) {this._fs_in = fsr;}
    set fsWrite(fsw) {this._fs_out=fsw;}


    register(device) {
        if (device.type === DCE) {
            this.registerInput(device.getInputType(),device);
        } else if (device.type === DTE ) {
            this.registerOutput(device.getOutputType(),device);
        }
    }
    registerInput(type, connection) {
        this._inputMap[type] = connection;
        switch(type) {
            case primaryInput:
                this.registerIn = connection;
                break;
            case primaryOutput:
                this.registerOut   = connection;
                break;
            case primaryBlock:
                this.fsRead = connection;

                break;
            case primaryDisplay:
                this._screen_out = connection;
                break;
        }
    }
    registerOutput(type, connection)    {
        this._outputMap[type] = connection;
        switch(type) {
            case primaryInput:
                this.registerIn = connection;
                break;
            case primaryOutput:
                this.registerOut   = connection;
                break;
            case primaryBlock:
                this.fsWrite = connection;
                break;
            case primaryDisplay:
                this._screen_out = connection;
                break;
        }
    }


}

export const io_ex = new IOExchange();

export class RS232Connection {
    constructor(id) {
        if (id === undefined) {
            throw new Error("UNDEFINED CONNECTION ID");
        }
        this._id = id;
        this._buffer = new RAMBuffer(id);
        this._terminal = new RS323Terminal(this);
        this._modem = new RS323Modem(this);
        this._terminal._opposite =this._modem;
        this._modem._opposite =this._terminal;
    }
    reset() {
        this._buffer.reset();
    }
    get terminal() {return this._terminal;}
    get id() {return this._id;}
    get modem () {return this._modem;}
    disconnect() {
        this._terminal.disconnect();
        this._modem.disconnect();
    }
    getEndpoint(type) {
        if (type === DCE) {
            return this.terminal;
        } else {
            return this.modem;
        }
    }
    get writeable() {return this._buffer.writeable;}
    get available() {return this._buffer.available;}
    get stream() {return this._buffer;}

}
const _buffers = [];
export class RAMBuffer {
    static Reset() {
        _buffers.forEach( b => b.reset());
    }
    static Register(b) {
        let repl = _buffers.filter(v => v.id === b.id);
        if (repl && repl.length === 1) {
            _buffers[_buffers.indexOf(repl[0])] = b;
        } else {
            _buffers.push(b);
        }
    }
    constructor(id) {
        this._id = id;
        this._readPosition = 0;
        this._writePosition = 0;
        this._available = 0;
        this._start = 0;
        this._data = null;
        RAMBuffer.Register(this);
    }
    get id() {return this._id;}
    get readPosition() {return this._readPosition;}
    get writePosition() {return this._writePosition;}
    set writePosition (w) { this._writePosition = (w<199?w:0);}
    set readPosition (r) { this._readPosition = (r<199?w:0);}


    reset() {
        this._readPosition = 0;
        this._writePosition = 0;
        this._available = Symbols.resolve("IO_" + this.id + "_available").address;
        this._start = Symbols.resolve("IO_" + this.id).raw;
        this._data = Memory.mem().iobuffer(this._start);
    }
    get data() {return this._data;}
    get available() {
        return Memory.mem().r(this._available);
    }
    set available(a) {
        Memory.mem().w(this._available, a);
    }
    get writeable() {
        return 200-this.available;
    }
    get canWrite() {return this.available < 200;}
    get canRead() {return this.available > 0;}
    push(w) {
        if (this.canWrite) {
            this.writeWords([w]);
            //this.data[this.writePosition++] = w;
        }
    }

    writeWords(words) {
        let overflow = [];
        let w = words.length;
        if (w > (200-this.available)) {
            w = 200-this.available;
            overflow = words.splice(w,words.length);
        }
        if (this.writePosition + w >= 200) {
            for (let i = 0; i < words.length;i++) {
                if (this.writePosition===200) {
                    this.writePosition = 0;
                }
                this.data[this._writePosition++] = words[i];
            }
        } else {
            for (let i = 0; i < words.length;i++) {
                this.data[this._writePosition++] =words[i];
            }
        }
        //console.log("Available bytes: " + this.available  + " + " + w + " - " + overflow.length);
        this.available = this.available + (w-overflow.length);
        return overflow;
    }
    write(bytes) {
        let w = (bytes>>1) + bytes%1;
        for(let i = 0; i < w;i++) {
            bytes.push((bytes.shift()<<8) + bytes.shift());
        }
        return this.writeWords(words).map(a => [a>>8, a&0xff]).flatMap(a =>a);
    }
    read(n) {
        if (n%2 && n > 1) {
            n--; // stick to word boundaries
        }
        n = Math.min(n,this.available*2);

        n  = Math.max(1,n>>1);

        let words = this.readWords(n);
        return words.flatMap(a => [a>>8,a&0xff]);


    }
    readWords(n) {
        let result = [];
        if  (n) {

            if (n + this.readPosition>= 200) {
                result = result.concat(this.data.subarray(this.readPosition,200).map(a => a));
                result = result.concat(this.data.subarray(0,n-result.length).map((a)=> a));
                this._readPosition =n-result.length;
            } else {
                result = result.concat(this.data.subarray(this.readPosition,this.readPosition+n).map((a) => a));
                this._readPosition+=result.length;
            }

            this.available-=result.length;

        }
        return result;
    }



}

export class RS323Port {
    constructor(type,connection) {
        this._type = type;
        this._connection = connection;
        this._opposite = null;
        this._device = null;
        this._buffer = connection._buffer;
    }
    connect() {
        this._buffer.reset();

    }
    disconnect() {
        this._opposite = null;
        this._device = null;
        this._buffer.reset();
    }
    get opposite() {
        return this._opposite;
    }
    rcv(b) {
        this._buffer.push(b);
    }
    rcvWord(word) {
        this._buffer.push(word);
    }
    get canRead() {return this._buffer.available>0;}
    get canWrite() {return this._buffer.available<200;}
    read() {
       if (this.canRead) {
           return this._buffer.read();
       }
    }
    readWord() {
        if (this.canRead){
            return this._buffer.readWord();
        }
    }
    write(b) {
        this.opposite.rcv(b);
    }
    writeWord(w) {
        this.opposite.rcvWord(w);
    }

}
export class RS323ModemDevice {
    constructor(rate, limit) {
        this._rate = rate;
        this._limit = limit;
        this._modem = null;
        this._connection = null;
        this.read = this.u_read;
    }
    connect(connection) {
        this._connection = connection;
        this._modem = connection.modem;
        //this._connection.reset();
        this.read=this.c_read;
    }
    getInputType() {
        throw new Error("Not Implemented");
    }
    set connection(m) {this._modem = m;}
    get connected() {return this._modem != null;}
    get connection() {return this._connection;}
    get modem() {return this._modem;}
    get available() {return this.read_available}
    get read_available() {return this.modem.canRead;}
    c_read(n) {
        n = n || 1;
        return this.modem.read(n);

    }
    u_read(n) {
        n=n ||1;
        return [].fill(0,n);
    }

    readWord() {
        this.modem.readWord(1);
    }
    readWords(n) {
        this.modem.readWords(n);
    }
}
export class RS323TerminalDevice {
    constructor(rate, limit) {
        this._rate = rate;
        this._limit = limit;
        this._terminal = null;
        this._connection = null;
        this._stream = null;
    }

    getOutputType() {
        throw new Error("Not Implemented");
    }
    connect(connection) {
        this._connection = connection;
        this._terminal = connection.terminal;
    }
    disconnect() {
        this.connection.disconnect();
    }
    set stream(s) {this._stream = s;}
    get stream(){return this._stream;}
    set connection(terminal) {this._terminal = terminal;}
    get connected() {return this._terminal != null;}
    get connection() {return this._connection;}

    get terminal() {return this._terminal;}
    get next() {
        if (this.terminal!==null) {
            this.terminal.read();
        }
    }
    getNext(n) {
        if (this.terminal!== null) {
            this.terminal.read(n);
        }
    }
    write(v) {
        return this.terminal.write(v);
    }
    writeWords(v) {
        return this.terminal.writeWords(v);
    }
}
export class RS323Modem extends RS323Port{
    constructor(connection) {
        super(DCE,connection);

    }

}
export class RS323Terminal extends RS323Port{
    constructor(connection) {
        super(DCE,connection);
    }
}

