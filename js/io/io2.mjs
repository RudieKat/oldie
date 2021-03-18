
export const DTE = 1;
export const DCE = 2;
export const PARITY_NONE=0;
export const PARITY_ODD=1;
export const PARITY_EVEN=3;
export const PARITY_MARK=5;
export const PARITY_SPACE=7;

export class RS323Connection {
    constructor() {
        this._terminal = new RS323Terminal(this);
        this._modem = new RS323Modem(this);
        this._terminal._opposite =this._modem;
        this._modem._opposite =this._terminal;
    }
    get terminal() {return this._terminal;}
    get modem () {return this._modem;}
    getEndpoint(type) {
        if (type === DCE) {
            return this.terminal;
        } else {
            return this.modem;
        }
    }

}

export class RS323Port {
    constructor(type,connection) {
        this._type = type;
        this._connection = connection;
        this._opposite = null;
        this._device = null;
        this._buffer = [];
    }
    get opposite() {
        return this._opposite;
    }
    rcv(b) {
        this._buffer.push(b);
    }
    rcvWord(word) {
        this._buffer.push(word>>8);
        this._buffer.push(word&0xFF);
    }
    read() {
        if (this._buffer.length> 0) {
            return this._buffer.shift();
        }
        return -1;
    }
    readWord() {
        if (this._buffer.length > 1) {
            return (this._buffer.shift()<<8)  + this._buffer.shift();
        }
        return -1;
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
    }
    connect(connection) {
        this._connection = connection;
        this._modem = connection.modem;
    }
    set connection(m) {this._modem = m;}
    get connected() {return this._modem != null;}
    get connection() {return this._connection;}
    get modem() {return this._modem;}
    get available() {return this.read_available}
    get read_available() {return this._modem._buffer.length;}
    read() {
        if (this.modem) {
            return this.modem.read();
        }
    }
    readWord() {
        if (this.modem) {
            return this.modem.readWord();
        }
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
    connect(connection) {
        this._connection = connection;
        this._terminal = connection.terminal;
    }
    set stream(s) {this._stream = s;}
    get stream(){return this._stream;}
    set connection(terminal) {this._terminal = terminal;}
    get connection() {return this._terminal != null;}
    get terminal() {return this._terminal;}
    get next() { if (this.stream!==null) {
        this.stream.read();
    }}
    write(v) {
        if (this._terminal) {
            this.terminal.write(v);
        }
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

