/*jshint esversion:6*/
import {IO_DTE, IO_READ, IO_WRITE, IOBus} from "../bus/io.mjs";
import { IO_RW } from "../bus/io.mjs";


export const PARITY_NONE=0;
export const PARITY_ODD=1;
export const PARITY_EVEN=3;
export const PARITY_MARK=5;
export const PARITY_SPACE=7;
export const STOP_BIT_ONE=0;
export const STOP_BIT_TWO=1;
export const XON = 0x11;
export const XOFF = 0x13;

export class RS232 {
    constructor(rate, transmit_control) {
        this._rate = rate; //the amounts of bits per second read, sending more will overflow the buffer
        this._char = 5 + (transmit_control&0x3);
        this._stop_bits = 1 + ((transmit_control>>2)&0x1);
        this._parity = ((transmit_control>>3)&0x7);
        if (this._parity > 0 && this._parity%2 == 0) {
            this._parity = 0;
        }
        this._transmit = []; //transmit buffer
        this._receive = [];
        this._bitsread = 0;
        this._frames_available = 0;
        this._framebuf = 0;
        this._parity_counter = 0;
        this._frame = 1 + this._char + this._stop_bits + (this._parity%2);
    }
    read() {
        if (this._frames_available>0) {
            this._frames_available--;
            return this._receive.shift();
        }
        return 0;
    }
    get read_available() {return this._frames_available > 0;}
    get available() {return this._frames_available;}
    read_char() {
        return String.fromCharCode(this.read());
    }
    write(b) {
        this._transmit.push(b);
    }
    write_char(c) {
        this.write(c.charCodeAt(0));
    }
    get write_available(){
        return this._transmit.length > 0;
    }
    get transmittable() {
        return this._transmit.length ;
    }
    transmit() {
        if (this._transmit.length >0) {
            return this._transmit.shift();
        }
        return -1;
    }
    rcv_bits(obts) {
        let bts = obts.filter(b => b != null);
        while (bts.length >0) {
            this.receive(bts.shift());
        }
    }
    receive(v) {
        //clamp the value
        v = Math.min(1,Math.max(v,0));
        if (this._bitsread === 0) {
            if (v === 1) {
                throw new Error("Start bit not 0");
            }
            this._bitsread++;
        } else {  
            if (this._bitsread <= this._char) {
                this._framebuf = this._framebuf + (v<<(this._bitsread-1));
                this._bitsread++;
                this._parity_counter += Math.abs(v-1);
            } else if (this._bitsread> (this._char + this._parity%2)) {
                if (v === 0) {
                    throw new Error("Stop bit not 1");
                }
                this._bitsread++;
            } else {
                if (this.check_parity(v)) {
                    this._bitsread++;
                } else {
                    throw new Error("Parity error");
                }
            }
            if (this._bitsread === this._frame) {
                this._frames_available++;
                this._receive.push(this._framebuf);
                this._framebuf = 0;   
                this._bitsread = 0;
                this._parity_counter = 0;
            }
        }
        return this;
    }
    get has_parity(){return this._parity>0;}
    check_parity(value) {
        switch(this._parity) {
            case PARITY_ODD:
                return this._framebuf%2 === value;
            case PARITY_EVEN:
                return (this._framebuf%2)+1 === value;
            case PARITY_MARK:
                return value === 1;
            case PARITY_SPACE:
                return value === 0;
        }
    }
    char_to_bits(ch) {
        return this.byte_to_bits(ch.codePointAt(0));
    }
    byte_to_bits(bt) {
        let bits = bt.toString(2).split("").reverse().join("");
        if (bits.length < this._char) {
            bits = bits + "0".repeat(this._char-bits.length);
        } else if (bits.length > this._char) {
            bits = bits.substring(0,this._char);
        }
        let p = "";
        switch (this._parity) {
            case PARITY_SPACE:
                p = "0";
                break;
            case PARITY_MARK:
                p = "1";
                break;
            case PARITY_ODD:
                p = "" + (bits.split("").filter(ch => ch === "0").length%2);
                break;
            case PARITY_EVEN:
                p = "" + ((bits.split("").filter(ch => ch === "0").length+1)%2);
                break;
        }
        bits = "0" + bits + p + "1" + (this._stop_bits>1?"1":"");
        return bits.split("").map(ch => parseInt(ch));
    }
    bytes_to_bits(bytes) {
        return bytes.map(b => this.byte_to_bits(b)).reduce((a,b) => [...a,...b]);
    }
    chars_to_bits(ch) {
        return ch.split("").map(ch => this.char_to_bits(ch)).reduce((a,b) => [...a,...b]);
    }
    get readBus() {
        return new RS232Bus(IO_READ,this);
    }
    get writeBus() {
        return new RS232Bus(IO_WRITE,this);
    }x
}


export class RS232Bus extends IOBus {
    constructor(io_mode,device) {
        super(io_mode);
        this._rs232 = device;
    }
    get input() {
        return super.input;
    }
    set input(v) {
        super.input = v;
    }
    set output(v) {
        super.output = v;
    }
    get output() {
        return super.output;
    }
    connect_input(instream) {
        this.input = instream;
    }
    connect_output(outstream) {
        this.output = outstream;
    }
    write_to_stream(w) {
        if ((w&0xFF00) === 0x1B00) {
            super.write_to_stream(0x1B);
        }
        super.write_to_stream(w);
        if (this._inbuf.length >= 1) {
            
            this._rs232.rcv_bits(this._rs232.byte_to_bits(this._inbuf.shift()));
            //this._rs232.rcv_bits(this._rs232.byte_to_bits(this._inbuf.shift()));
        }
    }
    read_from_stream() {
        let b = this._rs232.transmit();
        if (b > -1) {
            return b;
        }
        return 0;
    }
}

/*let s = new RS232(9600,0x2); //no parity, 1 stop bit, 7 bits
//A in binary including stop bit 0 1 0 0 0 0 0 1 1
s.rcv_bits([0,1,0,0,0,0,0,1,1]);
console.log(s.read_char());
s.char_to_bits("A");
s.rcv_bits(s.chars_to_bits("SECRET MESSAGE"));

while (s.read_available) {
    console.log(s.read_char());
}*/