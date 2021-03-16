/**
 * It's 1970 and we are thinking about I/O. A little over a year ago
 * RS-232 reached the point in the standard where it has stayed, largely
 * unchanged since except the addition the RTR signal which basically
 * makes the previously one way (although that was ... arguable)
 * into a well defined "Ok i'm done now you"
 *
 *   1    Input      DCD  Data Carrier Detect
 *  2    Input      RXD  Received Data
 *  3    Output     TXD  Transmitted Data
 *  4    Output     DTR  Data Terminal Ready
 *  5    Signal Ground
 *  6    Input      DSR  Data Set Ready
 *  7    Output     RTS  Request To Send
 *  8    Input      CTS  Clear To Send
 *  9    Input      RI   Ring Indicator
 **/

'use string';
export const IO_NONE = 0;
export const IO_READ = 1;
export const IO_WRITE = 2;
export const IO_EX = 4; //DEFAULTS TO EXCHANGE AT ioex:
export const IO_MMAP = 8;

export const IO_FLOWCONTROL_SW = 16;
export const IO_FLOWCONTROL_HW = 32; //DEFAULT

export const IO_PV_MARK=-1;
export const IO_PV_FALSE=0;
export const IO_PV_TRUE=1;


export const IO_ERROR = 0xff00;
export const IO_ERROR_BUFFER_EMPTY = 0x01;
export const IO_ERROR_NOT_CLEAR_TO_SEND = 0x02;
export const IO_ERROR_NO_READY_TO_SEND = 0x03;
export const IO_ERROR_CARRIER_LOST=0x05;

export const IO_PIN_DCD = 0; //DCE -> DTE
export const IO_PIN_RXD = 1; //DCE -> DTE
export const IO_PIN_TXD = 2; //DTE -> DCE
export const IO_PIN_DTR = 3; //DTE -> DCE
export const IO_PIN_GND = 4; //none
export const IO_PIN_DSR = 5; //DCE -> DTE
export const IO_PIN_RTS = 6; //DTE -> DCE
export const IO_PIN_CTS = 7; //DCE -> DTE
export const IO_PIN_RI = 8;  //DCE -> DTE

export const PIN_LABEL = ["DCD","RXD","TXD","DTR","GND","DSR","RTS","CTS","RI "];

export const IO_DTE = IO_WRITE;
export const IO_DCE = IO_READ;

export const PARITY_NONE=0;
export const PARITY_ODD=1;
export const PARITY_EVEN=3;
export const PARITY_MARK=5;
export const PARITY_SPACE=7;
export const STOP_BIT_ONE=0;
export const STOP_BIT_TWO=1;
export const XON = 0x11;
export const XOFF = 0x13;

/**
 * TRANSMIT CONTROL? Sure.
 * a char is at least 5 bits long + value indicated but the lower two bits in
 * the tranmissioncontrol value.
 * So let's say we get
 *  7 6 5 4  3 2 1 0
 *  ----------------
 *  0 0 0 0  0 0 1 0
 *
 *  Here we see that the lower two bits 0b10 is 2 so the char would be
 *  7 bits long (typical US ASCII)
 *  The next operation is the right shift by two to get the value of th
 *  the stop bit which tells us whether we have 1 or 2 stop bits.
 *  That would give us one stop bit. Now the parity
 *  we right shift 3 bits
 *
 *  7 6 5 4  3 2 1 0
 *  ----------------
 *        0  0 0 0 0          (shifted out)    0 1 0
 *
 *
 *  Here the value is 0 which would mean no parity
 *  7 6 5 4  3 2 1 0
 *  ----------------
 *        0  0 0 0 1
 *
 *  1 means ODD
 *
 *        0  0 0 1 1
 *  3 means even
 *
 *        0  0 1 0 1
 *  5 means MARK
 *
 *        0  0 1 1 1
 *  7 means SPACE
 *
 */

const START_BIT = 0;
const DATA_BIT = 1;
const PARITY_BIT = 2;
const STOP_BIT = 3;
const DOUBLE_STOP_BIT = 4;



class PacketStream {
    constructor(txCtrl) {
        this._size = 5 + (txCtrl&3);
        this._bitmask = Math.pow(2,this.size)-1;
        this._masks = [1];
        while (this._masks.length < this.size) {
            this._masks.unshift(this._masks[0]*2);
        }
        this._stopBits = (txCtrl&4)?2:1;
        this._parity = ((txCtrl>>3)&0x7);
        this._parity = this._parity%2===0?0:this._parity;
        this._frameSize = 1 + this.stopBits + this.size  + (this.parity%2);
        this._readState = START_BIT;
        this._frames = [];
        this._bits = [];
        this._port = null;
    }
    get masks() {return this._masks;}
    get bitmask(){return this._bitmask;}
    get size() {return this._size;}
    get stopBits() {return this._stopBits;}
    get parity() {return this._parity;}
    get frameSize() {return this._frameSize;}
    get available() {return this._frames.length;}
    get frame() {return this._frames.shift();}
    get bit() {return this._bits.shift();}
    get readState() {return this._readState;}
    set readState(rs) {this._readState = rs;}
    get bits() {return this._bits;}
    set port(p) {this._port = p;}
    get port() {return this._port;}
    get connected() {return this.port !== null && this.port.connected;}

    process(data){}
    work(){

    }
}

class PacketWriter extends PacketStream {
    constructor(txCtrl) {
        super(txCtrl);

    }
    work() {
        if (this.port.connected) {
            let available = this.port._bufferLength-this.port._buffer.length;
            let frameCount = (available/this.frameSize)>>0;
            available = Math.min(available, frameCount*this.frameSize);
            if (available > 0) {
                this.port._buffer.push(...this.bits.splice(0, available));
            }
        } else {
            console.log("Unconnected: " + this.port  + " is connected: " + this.port.connected);
        }
    }
    process(chunk) {
        const self  = this;
        if (typeof chunk === "string") {
            chunk = chunk.split("").map(a => (a.codePointAt(0))&this.bitmask).flatMap(a => this.toPacket(a));
        } else if(Array.isArray(chunk)) {
            chunk = chunk.flatMap(a => this.toPacket(a))
        } else {
            chunk = this.toPacket(chunk);
        }
        this.bits.push(...chunk)
    }
    toPacket(a) {

        let b = [];
        while(b.length<this.masks.length) {
            b.push((a&this.masks[b.length])?1:0);
        }
        b.unshift(0);
        switch (this.parity) {
            case PARITY_ODD:
                b.push(b[b.length-1]);
                break;
            case PARITY_EVEN:
                b.push(Math.abs(b[b.length-1]-1))
                break;
            case PARITY_MARK:
                b.push(1);
                break;
            case PARITY_SPACE:
                b.push(0);
                break;
        }
        b.push(1);
        if (this.stopBits>1) {
            b.push(1);
        }
        return b;

    }
}

class PacketReader extends PacketStream {
    constructor(txCtrl) {
        super(txCtrl);

    }

    process(chunk) {
        //console.log("Processing read chunk: " + JSON.stringify(chunk));

        chunk.forEach( c => {
            this.receive(c);
        });
    }
    work() {
        if (this.connected) {
            let open = (176/this.frameSize)>>0;
            open-=this.available;
            if (open > 0) {
                this.process(this.port.read(open*this.frameSize));
            }
        }
    }
    receive(bit) {
        console.log("Receiving bit: " + bit + " state is " + this.readState);
        let result = 0;
        switch(this.readState) {
            case START_BIT:
                if (bit) {
                    throw new Error("Bad STARTBIT: expecting 0");
                }
                this.readState = DATA_BIT;
                break;
            case DATA_BIT:
                this.bits.push(bit);
                if (this.bits.length === this.size) {
                    this.readState = this.parity!== PARITY_NONE?PARITY_BIT:STOP_BIT;
                }
                break;
            case PARITY_BIT:

                switch(this.parity) {
                    case PARITY_EVEN:
                        result+=this.bits[this.size-1];
                        break;
                    case PARITY_ODD:
                        result-=1;
                        result+=this.bits[this.size-1];
                        break;
                    case PARITY_MARK:
                        result = bit -1;
                        break;
                    case PARITY_SPACE:
                        result+=bit;
                        break;
                }
                if (result !== 0) {
                    throw new Error("ParityError: " + JSON.stringify(this.bits) + "\nand parity bit was " + bit + " for parity type " + this.parity + "\n and " + this._frames.length + " are done");
                }
                this.readState = STOP_BIT;
                break;
            case STOP_BIT:
            case DOUBLE_STOP_BIT:
                if (!result) {
                    throw new Error("BAD STOP BIT: " +  + JSON.stringify(this.bits) + " and stop bit was " + result);
                } else if (this.readState-this.stopBits=== 1) {
                    this.readState = DOUBLE_STOP_BIT;
                } else {
                    this._frames.push(this.bits.reduce((a,b) => (a*2)+b));
                    this.readState = START_BIT;
                    this.bits.length = 0;
                }
                break;
        }

    }


}

export class DeviceAdapter {
    constructor(txRate,txCtrl) {
        this._txRate = txRate;
        this._transmissionControl = txCtrl;
        this._p_thread = null;
    }
    get transmissionRate() {return this._txRate;}
    get transmissionControl() {return this._transmissionControl;}
    get port() {return this._port;}
    set port(p) {this._port = p;}


    start() {
        const bitsPerSlice = this.transmissionRate/100;
        this._p_thread = setInterval(() => {
            this.process(176);
            this.yield();
        },10)
    }
    yield() {
        clearInterval(this._p_thread);
        setTimeout(() => {
            this.start();

        }, 10);
    }
    process(bits) {}



}
export class ModemAdapter extends DeviceAdapter {
    constructor(txRate,txCtrl, bufSize) {
        super(txRate,txCtrl);
        this._bufSize = bufSize;
        this._input = new PacketReader(this.transmissionControl);
        this.port = new Port(this, this.type, this._input.frameSize*10);
        this._terminal = null;
        this._recipient = null;
        this._awaitMark = false;
    }
    get awaitMark() {return this._awaitMark;}
    set awaitMark(m) {this._awaitMark = m;}
    set recipient(r) {
        this._recipient = r;
    }
    get recipient() {return this._recipient;}

    get type() {return IO_DCE;}
    get connected() {
        return this._terminal !== null;
    }
    connect(t) {
        t.connect(this);
    }
    readWord() {
        if (this.buffer.length >=2) {
            return [this.buffer.splice(0,2).reduce((a,b) => a<<8|b)];
        }
        return [];
    }
    readByte() {
        if (this._input.available> 0) {
            throw new Error("FUCK THIS");

            let bits =  this._input.frame.splice(1,1+this._input.size);
            let out = 0;
            while (bits.length > 0) {
                out=(out*2) + bits.shift();
            }
            throw new Error(out);
            return out;
        }
    }

    readBits(bits,cb) {

        this.doRead(this.port.pin(IO_PIN_TXD), this.port.pin(IO_PIN_RXD),bits,cb);
    }
    doRead(txd,rcv,bits,cb) {
        bits = Math.min(this.port.available, bits);
        if (bits > 0 && this.port.clearToSend) {
            const self = this;
            this.readBit(txd,rcv,(b) => {
                if (b < 0) {
                    return;
                }
                bits--;
                this.port._buffer.push(b);
                self.doRead(txd,rcv,bits,cb);
            })
        } else {
            cb();
        }

    }

    readBit(txd,rcv,cb) {
        let v = -1;
        if (this.awaitMark && Math.abs(txd.v)>3 ) {
            rcv.mark();
            this.awaitMark=false;
            setTimeout(() => {
                this.readBit(txd,rcv,cb);
            },10);
            return;
        }
        if (txd.v < -3) {
            rcv.one();
            v=1;
            //console.log("Received: " + 1+ " because txd.v " + txd.v);
            this.awaitMark = true;
        } else if (txd.v>3) {
            rcv.one();
            //console.log("Received: " + 0 + " because txd.v " + txd.v);
            v = 0;
            this.awaitMark = true;
        } else if (Math.abs(txd.v) < 3){
            rcv.mark();
            this.awaitMark = false;
            setTimeout(() => {
                this.readBit(txd,rcv,cb);
            },10);
            return;
        }
        if (v>=0) {
            //console.log("Received bit: " + v);
            this.port._bitsRcvd++;
            cb(v);
        }

    }
    process(bits) {
        if (this.port.readyToSend) {
            this.port.clearToSend = true;
        }
        //console.log("READING: " + bits);
        this.readBits(bits, () => {
            /*bits -= (bits%this._input.frameSize);
            if (bits < 0) {
                throw new Error("Too few bits dude")
            } else {
                if ( bits > this.port._buffer.length) {
                    bits = ((this.port._buffer.length/this._input.frameSize)>>0)*this._input.frameSize;
                }
            }
            if (bits > 0) {
                this._input.process(this.port._buffer.splice(0,bits));
            }*/

            this._input.work();

        });

    }


}
export class TerminalAdapter extends DeviceAdapter {
    constructor(txRate,txCtrl, bufSize) {
        super(txRate,txCtrl);
        this._bufSize = bufSize;
        this._output = new PacketWriter(this.transmissionControl);
        this.port = new Port(this,this.type,this._output.frameSize*10);

        this._modem = null;
    }
    get type() {return IO_DTE;}
    get connected() {return this._modem !== null;}
    connect(m) {
        if (this.connected || m.connected) {
            return false;
        }
        if (m && m.type === IO_DCE) {
            this.port.connect(m.port);
            m.port.connect(this.port)
            this._output.port = this.port;
            m._input.port = m.port;
            this._modem = m;
            m._terminal = this;

            m.start();
            this.start();

        }
    }
    sendWord(w) {
        if (this._output.bits.length/this._output.frameSize < this._bufSize - 2) {
            this._output.process([(w&0xff00)>>8,(w&0xff)]);
        }
    }
    sendByte(b) {
        if (this._output.bits.length/this._output.frameSize < this._bufSize) {
            this._output.process(b);
        } else {
            throw new Error("Failed to send byte");
        }
    }
    process(bits) {
        this._output.process(bits);
        this._output.work();
        this.port.readyToSend = true;
        //console.log("Process: " + bits);
        let res = this._port.send(bits);
        //console.log("RES: "  + res);
        if (res === -1) {
        } else if (Array.isArray(bits) && bits.length > 0) {
            console.log("DOING WORK");
            this._output.work();
        }
    }
}

export class Port {
    constructor(controller,mode,bitBuffer) {
        this._mode = mode;
        this._remote = null;
        this._pins = Pin.Generate(this);
        this._bufferLength = bitBuffer;
        this._buffer = []
        this._position = 0;
        this._controller = controller;
        this._bitsSent = 0;
        this._bitsRcvd = 0;
        this._awaitMark= false;
        this._awaitAck = false;

    }
    get awaitMark() {return this._awaitMark;}
    set awaitMark(m) {this._awaitMark = m;}
    get awaitAck() {return this._awaitAck;}
    set awaitAck(m) {this._awaitAck = m;}
    get bitsSent() {return this._bitsSent;}
    set bitsSent(s) {this._bitsSent = s;}
    get bitsReceived() {return this._bitsRcvd;}
    set bitsReceived(s) {this._bitsRcvd = s;}
    read(bits) {
        if (bits > this._buffer.length) {
            if (this._bufferLength === 0) {
                return -1;
            }

            let rev =  this._buffer.reverse();
            this._buffer.length = 0;
            return rev;
        }
        return this._buffer.splice(0,bits);

    }

     send(bits) {
        /*if (this._bufferLength > 0) {
            this.pin(IO_PIN_RTS).one();
        }*/
        if (this._buffer.length === 0 || !this.clearToSend) {
            //console.log("Buffer: " + this._buffer.length + " and CTS: " + this.clearToSend);

            return -1;
        }
        this.doSend(this.pin(IO_PIN_TXD), this.pin(IO_PIN_RXD),bits);

    }
    doSend(txd,rcv,bits) {

        if (bits > 0 && this.clearToSend) {
            const self = this;


            bits = Math.min(bits, this._buffer.length);
            this.sendBit(txd,rcv,this._buffer.shift(),() => {
                bits--;
                self.doSend(txd,rcv,bits);
            })
        }

    }


    sendBit(txd,rcv,v,cb) {
        if (v) {
            txd.one();
            this.awaitAck = true;
        } else {
            txd.zero();
            this.awaitAck = true;
        }
        if (this.awaitAck) {
            let ack = setInterval(() => {
                if (rcv.v < -3 && this.awaitAck) {

                    this.awaitAck = false;
                    txd.mark();
                    this.awaitMark = true;

                } else if (Math.abs(rcv.v)<=3) {
                    this.awaitMark = false;
                    this._bitsSent++;
                    clearInterval(ack);
                    cb();
                }
            },5);
        }


    }
    get hasData() {
        if (this.dce) {
            return this._position > 0;
        }
        throw new Error("Cannot read from an outboutnd port");
    }
    get canBuffer() {
        if (this.dte) {
            return this.clearToSend && this._position< this._bufferLength;
        }
    }
    get isFull() {return this._position === this._bufferLength;}
    get available() { return this._bufferLength-this._buffer.length;}

    set buffer(b) {
        if (b.length > this.available) {
            this._buffer.push(...b.splice(0, this.available));
            return b;
        }
        this._buffer.push(...b);
        return [];
    }
    set readyToSend(v) {
        if (this._buffer.length > 0) {
            this.pin(IO_PIN_RTS).one();
        } else {
            this.pin(IO_PIN_RTS).zero();
        }
    }
    get readyToSend() {
        //console.log("RTS: " + this.pin(IO_PIN_RTS).isSet);
        return this.pin(IO_PIN_RTS).isSet;
    }
    get clearToSend() {
        //console.log("CTS: " + this.pin(IO_PIN_RTS).isSet);
        return this.pin(IO_PIN_CTS).isSet;}
    set clearToSend(v) {
        if (this.available > 0) {
            this.pin(IO_PIN_CTS).one();
        } else {
            this.pin(IO_PIN_CTS).zero();
        }
    }
    get mode() {return this._mode;}
    get dte() {return this.mode === IO_DTE;}
    get dce() {return this.mode === IO_DCE;}
    set remote(p) {this._remote = p;}
    get pins() {return this._pins;}
    pin(id) {return this.pins[id];}
    get connected() {return this._remote !== null;}
    connect(port) {
        if (this.dte && port.dce){
            this.remote = port;
            port.remote = this;
            this.pin(IO_PIN_DCD).receive(port.pin(IO_PIN_DCD));
            this.pin(IO_PIN_RXD).receive(port.pin(IO_PIN_RXD));
            this.pin(IO_PIN_TXD).transmit(port.pin(IO_PIN_TXD));
            this.pin(IO_PIN_DTR).transmit(port.pin(IO_PIN_DTR));
            this.pin(IO_PIN_DSR).receive(port.pin(IO_PIN_DSR));
            this.pin(IO_PIN_RTS).transmit(port.pin(IO_PIN_RTS));
            this.pin(IO_PIN_CTS).receive(port.pin(IO_PIN_CTS));
            this.pin(IO_PIN_RI).receive(port.pin(IO_PIN_RI));



        } else if (this.dce && port.dte) {
            port.connect(this);

        }
    }


}

export class Pin {
    static Generate(port) {
        return [new LowPin(0,port),new LowPin(1,port),new LowPin(2,port),
                new LowPin(3,port),new Pin(4,port),new HighPin(5,port),
                new HighPin(5,port),new HighPin(7,port),new HighPin(8,port)];
    }
    constructor(pinNo,port) {
        this._pinNo = pinNo;
        this._mode = port.mode;
        this._port = port;
        this._input = null;
        this._output = null;
        this._voltage = 0;
        this._handlers = {
            "onchange":[],
            "onrcv":[],
            "onack":[],
            "onrts":[]
        }
    }
    receive(input) {
        this._input = input;
        this._input._output = this;
    }
    transmit(output) {
        this._output = output;
        this._output._input = this;
    }
    get handlers() {return this._handlers;}
    get isDTE() {return this._mode === IO_DTE;}
    get isDCE() {return this._mode === IO_DCE;}
    get DCD() {return this._pinNo === IO_PIN_DCD;}
    get RXD() {return this._pinNo === IO_PIN_RXD;}
    get TXD() {return this._pinNo === IO_PIN_TXD;}
    get DTR() {return this._pinNo === IO_PIN_DTR;}
    get GND() {return this._pinNo === IO_PIN_GND;}
    get DSR() {return this._pinNo === IO_PIN_DSR;}
    get RTS() {return this._pinNo === IO_PIN_RTS;}
    get CTS() {return this._pinNo === IO_PIN_CTS;}
    get RI() {return this._pinNo === IO_PIN_RI;}
    get low() {return this._pinNo < IO_PIN_GND;}
    get isLow() {return this._voltage < 0;}
    get isLowSet() {return this.isLow && this.low;}
    get high() {return this._pinNo > IO_PIN_GND;}
    get isHigh() {return this._voltage > 0;}
    get isHighSet() {return this.isHigh && this.high;}
    get isSet() {return (this.isHighSet || this.isLowSet)?1:0;}
    get isMark() {return Math.abs(this._voltage)<3;}
    get isUnset() {return this.isSet ===0 && !this.isMark;}
    get isNotSet() {return !this.isSet;}
    get state() {
        if (this.isMark) {
            return IO_PV_MARK;
        } else if (this.isSet) {
            return IO_PV_TRUE;
        }
        return IO_PV_FALSE
    }
    get v(){
        if (this._input) {
            this._voltage = this._input._voltage;
        }
        if (this._voltage === undefined) {
            throw new Error("UNDEFINED");
        }
        return this._voltage;}
    set v(v){
        if (isNaN(v)) {
            throw new Error("voltage is NOT A NUMBER");
        }
        this._voltage = v;
        if (this._output) {
            this._output._voltage = v;
        }
    }



    read(shift) {
        if (this.isMark) {
            return -1;
        }
        return this.isSet << shift;
    }
    one() {
        if (this._pinNo<IO_PIN_GND) {
            this.v = this.rndV*-1;
        } else {
            this.v = this.rndV;
        }
        this.change();
    }
    zero() {
        if (this._pinNo>IO_PIN_GND) {
            this._voltage = this.rndV*-1;
        } else {
            this._voltage = this.rndV;
        }
        this.change();
    }
    mark(){
        this._voltage = 0;
        this.change();
    }
    get rndV() {
        return ( 3 + Math.random()*10);
    }
    change() {
        this.handlers.onchange.forEach(h => h.update(this._pinNo,this._voltage));
    }
    get stringState() {
        if (this.isSet) {
            return "1";
        } else if (this.isMark) {
            return "M";
        }  else if (this.isUnset) {
            return "0";
        }
    }


    on(str,handler) {
        if (this.handlers[str]!== null) {
            this.handlers[str].push(handler);
        }
    }

}

class LowPin extends Pin {
    constructor(pinNo,port) {
        super(pinNo,port);
    }
    get isSet() {
        return this.v < -3;
    }
    get isUnset() {
        return this.v > 3;
    }
    get isMark() {
        return Math.abs(this.v)<=3;
    }
}
class HighPin extends Pin {
    constructor(pinNo,port) {
        super(pinNo,port);
    }
    get isSet() {
        return this.v > 3
    }
    get isUnset()  {
        return this.v < -1;
    }
    get isMark() {
        return Math.abs(this.v)<=3;
    }
}

class NullPin  extends Pin {
    constructor(pinNo,port,mode) {
        super(pinNo,port,mode);
    }
    read(shift) {
        return 0;
    }


}

let dte = new TerminalAdapter(9600,0x2B,176);
let dce = new ModemAdapter(9600,0x2B, 176);
dte.connect(dce);

let hw = "HW".split("").map(a => a.codePointAt(0));
let uw = "";
let th = setInterval(() => {
    if (hw.length > 0) {
        let b = hw.shift();
        console.log("WRITE BYTE: " + b);
        dte.sendByte(b);
    } else {
        console.log("READ BYTE: " + dce.readByte());

    }
},10);


/*Position the Cursor: \033[<L>;<C>H or \033[<L>;<C>f (puts the cursor at line L and column C)

Move the cursor up N lines: \033[<N>A
Move the cursor down N lines: \033[<N>B
Move the cursor forward N columns: \033[<N>C
Move the cursor backward N columns: \033[<N>D
Clear the screen, move to (0,0): \033[2J
Erase to end of line: \033[K
Save cursor position: \033[s
Restore cursor position: \033[u
 */

process.stdout.write("     DTE  |   DCE\n")

for (let i = 0; i < PIN_LABEL.length;i++) {
    if (i!=IO_PIN_GND) {
        writeLine(PIN_LABEL[i], "M","M", "0.0","0.0");
    }
}




function writeLine(name, dte, dce, v1,v2,b) {
    process.stdout.write(name + "   ");
    write(dte);
    process.stdout.write("    |    ");
    write(dce);
    process.stdout.write("    |    ");
    writeVoltage(v1)
    process.stdout.write("    |    ");
    writeVoltage(v2)
    if (b) {
        process.stdout.write("    |    ");
        writeBuffer(b);
    }
    process.stdout.write(" \n");
}

function write(v) {
    if (v==='1') {
        process.stdout.write("\x1B[1;2;32m1\x1B[0m");
    } else if (v ==='0') {
        process.stdout.write("\x1B[1;3;31m0\x1B[0m");
    } else if (v ==='M') {
        process.stdout.write("\x1B[1;2;32mM\x1B[0m");
    }
}
function writeVoltage(v) {
    process.stdout.write("\x1B[1;2;32m" + v + "V\x1B[0m");
}

function writeBuffer(b) {
    process.stdout.write("\x1B[1;2;32m" + b + "\x1B[0m");
}

//console.log = (t)=> {}
setInterval(()=> {
    if (!dce.connected) {
        return;
    }
    //process.stdout.write('\x1b[2J');
    process.stdout.write('\x1B[5;0H');

    for (let i = 0; i < PIN_LABEL.length;i++) {
        if (i!=IO_PIN_GND && i!=IO_PIN_RTS && i!=IO_PIN_CTS) {
            writeLine(PIN_LABEL[i], dte.port.pin(i).stringState,dce.port.pin(i).stringState,dte.port.pin(i).v.toFixed(1),dce.port.pin(i).v.toFixed(1));
        } else if (i!=IO_PIN_GND) {
            let b = 0;
            if (i === IO_PIN_RTS) {
                b = JSON.stringify(dte.port._buffer.length);
            } else {
                b = JSON.stringify(dce.port._buffer.length);
            }
            writeLine(PIN_LABEL[i], dte.port.pin(i).stringState,dce.port.pin(i).stringState,dte.port.pin(i).v.toFixed(1),dce.port.pin(i).v.toFixed(1), b);
        }
    }
    process.stdout.write("Bits sent: " + dte.port.bitsSent);
    process.stdout.write("Bits received: " + dce.port.bitsReceived);
    process.stdout.write(uw);
    /*process.stdout.write("\x1B[10D");
    process.stdout.write(dte.port.pin(IO_PIN_RTS).isSet?"\x1B[1;3;32m1":"\x1B[1;2;32m0");
    process.stdout.write("\x1B[8D");
    process.stdout.write(dce.port.pin(IO_PIN_RTS).isSet?"1":"0");
    process.stdout.write("\x1B[1B")
    process.stdout.write("\x1B[10D");
    process.stdout.write(dte.port.pin(IO_PIN_CTS).isSet?"1":"0");
    process.stdout.write("\x1B[8D");
    process.stdout.write(dce.port.pin(IO_PIN_RTS).isSet?"1":"0");
    process.stdout.write("\x1B[1B")
    process.stdout.write("\x1B[10D");
    process.stdout.write(dte.port.pin(IO_PIN_TXD).isSet?"1":"0");
    process.stdout.write("\x1B[8D");
    process.stdout.write(dce.port.pin(IO_PIN_TXD).isSet?"1":"0");
    process.stdout.write("\x1B[1B")
    process.stdout.write("\x1B[10D");
    process.stdout.write(dte.port.pin(IO_PIN_RXD).isSet?"1":"0");
    process.stdout.write('\x1B[8D');
    process.stdout.write(dce.port.pin(IO_PIN_RXD).isSet?"1":"0");*/

},100);