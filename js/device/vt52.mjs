/*jshint esversion:6*/
import {PARITY_NONE, PARITY_MARK, PARITY_EVEN, RS323ModemDevice, primaryDisplay, io_ex} from '../io/io2.mjs';
export const VT_CURSOR_UP=0x1B41; // A
export const VT_CURSOR_DOWN=0x1B42; // B
export const VT_CURSOR_RIGHT=0x1B43; // C
export const VT_CURSOR_LEFT=0x1B44; // D
export const VT_GRAPHICS_ON=0x1B46; // F
export const VT_GRAPHICS_OFF=0x1B47; // G
export const VT_CURSOR_HOME=0x1B48; // H
export const VT_CURSOR_REVERSE_LF=0x1B49; // I
export const VT_CLEAR_SCREEN=0x1B4A; // J
export const VT_CLEAR_LINE=0x1B4B; // K
export const VT_CURSOR_LF=0x1B4C; //L
export const VT_CURSOR_LINE_DELETE=0x1B4D; // M
export const VT_CURSOR_POSITION=0x1B59; // Y followed by row and column
export const VT_IDENT=0x1B5A; // Z 
export const VT_IDENT_RESPONSE=[0x1B,0x2F,0x49]; // ESC / N
export const VT_CMD_PREAMBLE = 0x1B;

export const VT_ROWS = 24;
export const VT_COLS = 80;
export const VT_CHAR_WIDTH=7;
export const VT_CHAR_HEIGHT=7;

export const VT_GRAPHICS_MODE_OFFSET = 0x5E;
export const VT_GRAPHICS_CHARS = [
                                0xA0,0xA0,0xFFFD,0x2588,0x215F,
                                [0xB3,0x2044],[0x2075,0x2044],[0x2077,0x2044],
                                0xB0,0xB1,0x2192,0x2026,0xF7,0x2193,0x23BA,
                                0x23BA,0x23BB,0x23BB,0x2500,0x23BC,0x23BD,
                                0x2080,0x2081,0x2082,0x2083,0x2084,0x2085,
                                0x2086,0x2087,0x2088,0x2089,0xB6];
const _graphics_chars = VT_GRAPHICS_CHARS.map(c => typeof(c) == 'number'?String.fromCharCode(c):String.fromCharCode(c[0]) + String.fromCharCode(c[1]));
const _empty_row = " ".repeat(80);
const _empty_row_chars = _empty_row.split(" ");

export class VT52 extends RS323ModemDevice {
    constructor(rate,transmit) {
        super(rate,transmit);
        this._col = 0;
        this._row = 0;
        this._row_buffers = [];
        for (let i = 0; i<24;i++) {
            this._row_buffers.push(new Array(80).fill(0));
        }
        
        this._graphics_mode = false;
        this._command_mode = false;
        this._command_length = 0;
        this._pthread =null;
        this._scroll = 0;
        this._errorHandler = null;
        this._bus = this.readBus;
        io_ex.register(this);
        
    }
    getInputType() {
        return primaryDisplay;
    }
    updateFrame(self) {
        try {
            let av = Math.max(16,self.available);
            for (;av>0;av--) {
                try {
                    self.update();
                } catch(err) {}
            }
        } catch (e) {
            if (self._errorHandler) {
                self._errorHandler(e);
            }
        }
        if (self._pthread !== null) {
            window.requestAnimationFrame(() => {
                self.updateFrame(self);
            });
        }
    }
    update_at_interval(ms) {

        this._pthread = "";
        this._pthread = window.requestAnimationFrame(()=> {
            this.updateFrame(this);
        });
        /*this._pthread = setInterval(() => {
            try {
                let av = Math.min(10,this.available);
                for (;av>0;av--) {
                    this.update();
                }
            } catch (e) {
                if (errors) {
                    errors(e);
                }
            }
        }, ms);*/
    }
    get bus(){return this._bus;}
    on(e,h) {
        if (e === 'ERROR') {
            this._errorHandler = h;
        }
    }
    end() {
        if (this._pthread !== null) {
            window.cancelAnimationFrame(this._pthread);
            this._pthread = null;
        }
    }
    get active() {return this._pthread != null;}
    set active(a) {
        if (this._pthread !== null && !a) {
            this._pthread = null;
        }
    }
    graphics_char(b) {
        b = b>=0x1b00?b&0xff:b;
        return _graphics_chars[b];
    }
    get cursor_row() {return this._row;}
    get cursor_col() {return this._col;}
    get cursor_pos() {return ((this._row -this._scroll)*81) + this._col;}
    get visible_rows() {
        
        return this._row_buffers.slice(this._scroll, this._scroll+24).map(a => [...a,0xA])
            .reduce((a,b) => [...a,...b]).map(c => c==0?" ":(c >=0x1b00?_graphics_chars[c&0xff]:String.fromCharCode(c))).join("");
    }
    get_row_chars(r) {
        if (r >= this._row_buffers.length) {
            return _empty_row_chars;
        }
        return this._row_buffers[r].filter(c => c != 0).map(c => typeof(c)==='number'?String.fromCharCode(c):c.map(c2 => String.fromCharCode(c2).join("")));//.join("");
    }
    get row_count() {return this._row_buffers.length;}
    get command_mode() {return this._command_mode;}
    get command_length() {return this._command_length;}
    get graphics() {return this._graphics_mode;}
    char_count_on(row) {
        if (this._row_buffers.length > row) {
            return this._row_buffers[row].filter(ch => ch !== 0x2044 && ch !== 0xA).length;
        }
        return 0;
    }
    update() {
        if (this.read_available) {
            let ch = this.read()[1];
            if (this.command_mode) {
                //console.log("CMD: " + ch.toString(16));
                if (this.command_length===2) {
                    this._row = ch;//Math.max(ch,this._row_buffers.length-1);
                    this._command_length=1;
                    return;
                } else if (this.command_length===1) {
                    this._col = ch;//Math.max(ch,79);
                    this._command_length = 0;
                    this._command_mode = false;
                    return;
                }
                let cmd = (VT_CMD_PREAMBLE <<8 )+ ch;
                //console.log(cmd.toString(16));
                switch(cmd) {
                    case VT_CURSOR_UP:
                        this._row = Math.max(this._row-1,0);
                        break;
                    case VT_CURSOR_DOWN:
                        this._row = Math.min(this._row+1,this._row_buffers.length-1);
                        break;
                    case VT_CURSOR_LEFT:
                        this._col = Math.max(0,this._col-1);
                        break;
                    case VT_CURSOR_RIGHT:
                        this._col = Math.min(this._col+1,79);
                        break;
                    case VT_CURSOR_POSITION:
                        this._command_length = 2;
                        return;
                        break;
                    case VT_CURSOR_LINE_DELETE:
                        this._row_buffers.splice(this._row,1);
                        if (this._row === this._row_buffers.length) {
                            this._row--;
                        }
                        break;
                    case VT_CURSOR_HOME:
                        this._row = 0;
                        this._col = 0;
                        break;
                    case VT_CURSOR_LF:
                        this.insert_linefeed();
                        break;
                    case VT_CURSOR_REVERSE_LF:
                        this._row_buffers.splice(this._row,0,[]);
                        this._col = 0;
                        break;
                    case VT_CLEAR_LINE:
                        this._row_buffers[this._row].length = this._col+1;
                        break;
                    case VT_CLEAR_SCREEN:
                        this._row_buffers = this._row_buffers.map(b => b.fill(0,0,b.length));
                        this._col = 0;
                        this._row = 0;
                        break;
                    case VT_GRAPHICS_ON:
                        this._graphics_mode = true;
                        break;
                    case VT_GRAPHICS_OFF:
                        this._graphics_mode = false;
                        break;
                    default:
                        this._command_mode = false;
                        throw new CommandError(cmd);
                }
                this._command_mode = false;
                return;
            }
            if (ch === VT_CMD_PREAMBLE) {
                this._command_mode=true;
                return;
            }
            if (this.graphics) {
                let gch = ch-VT_GRAPHICS_MODE_OFFSET;
                //console.log("GRAPHICS: " + ch.toString(16) + " and " + gch);
                if (gch >= 0 && gch < VT_GRAPHICS_CHARS.length) {
                    ch = 0x1b00 + gch;//VT_GRAPHICS_CHARS[gch];
                }
            }
            
            switch(ch) {
                case 0x0:
                    return;
                case 0x7F:
                    this._row_buffers[this._row][this._col] = 0;
                    return;
                case 0x8:
                    this._row_buffers[this._row][this._col] = 0;
                    this._col = Math.max(0,this._col-1);
                    break;
                case 0xA:
                case 0xD:
                    if (this._row == this._row_buffers.length -1){
                        this.insert_linefeed();
                    } else {
                        this._col = 0;
                        this._row++;
                    }
                    break;
                default:
                    this.add_and_move(ch);
                    break;

            }
            

        }
    }
    add_and_move(ch) {
        this._row_buffers[this._row][this._col] = ch;
        this._col = Math.min(this._col+1,79);
    }
    insert_line(idx) {
        this.insert_linefeed(idx,[]);
    }
    insert_content(idx, data) {
        let l = new Array(80-data.length).fill(0);
        l = [...data,...l];
        this._row_buffers.splice(idx,0,l);
    }
    insert_linefeed() {
        let rb = this._row_buffers[this._row].splice(this._col,this.char_count_on(this._row)-this._col);
        this.insert_content(this._row+1,rb);
        let filler = new Array(this._row_buffers[this._row].length).fill(0);
        this._row_buffers[this._row] = [...this._row_buffers[this._row],...filler];
        this._row++;
        this._col =0;
    }
    get max_rate() {return 9600;}
    get rate_supported() {return [9600,4800,2400,1200,600,300,150,110,75];}
    get parity_supported() {return [PARITY_NONE,PARITY_EVEN];}
    get char_supported() {return [7];}
    pp() {
        let st = Math.max(this._row-24,0);
        console.log("Pretty printing: " + st + " row buffer " + this._row_buffers.length);
        for(let i = 0;i < 25 && st < this._row_buffers.length;st++,i++) {
            let out = this._row_buffers[st].filter(c => c > 0).map(c => String.fromCharCode(c)).join("");
            console.log(out);
        }
    }
    ppa() {
        for(let i = 0;i < this._row_buffers.length;i++) {
            let out = this._row_buffers[i].filter(c => c > 0).map(c => String.fromCharCode(c)).join("");
            console.log(out);
        }
    }

}
export const VT52_ERROR_UNKNOWN=0;
export const VT52_ERROR_CMD=1;

export class VT52Error extends Error {
    constructor(msg) {
        super("VT52: " + msg);

    }
    get type() {return 0;}

}
export class CommandError extends VT52Error {
    constructor(cmd) {
        super("VT52 CMD ERROR");
        this._cmd = cmd.toString(16);
    }
    get cmd() {return this._cmd;}
    get type() {return VT52_ERROR_CMD;}
    toString() {
        return this.message + "\n" + this.cmd;
    }

}

/*let term = new VT52(9600,0x2);
term.update_at_interval(1);
term.rcv_bits(term.chars_to_bits("###\nEYES ONLY\n\nTO WHOM IT MAY CONCERN\n"));
let gfx = [...term.byte_to_bits(VT_GRAPHICS_ON>>8),...term.byte_to_bits(VT_GRAPHICS_ON&0xFF)];
let goff = [...term.byte_to_bits(VT_GRAPHICS_OFF>>8),...term.byte_to_bits(VT_GRAPHICS_OFF&0xFF)];
let block = term.byte_to_bits(0x61);
let nbsp = term.byte_to_bits(0x5E);
term.rcv_bits(gfx);
for (let i = 0; i < 40;i++) {
    term.rcv_bits(block);
    term.rcv_bits(nbsp);
}
term.rcv_bits(goff);
term.rcv_bits(term.chars_to_bits("\nUNDERSTAND?"));
setTimeout(() => {
    term.end();
    term.pp();
},2000);*/

