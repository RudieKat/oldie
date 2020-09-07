/*jshint esversion:6*/

import { IOBus } from "../bus/io.mjs";
import { IO_WRITE } from "../bus/io.mjs";
import { IO_RW } from "../bus/io.mjs";
import { IOStream } from "../bus/io.mjs";
import { Register } from "../cpu/cpu.mjs";

export class TTYKeyboard extends IOBus {
    constructor() {
        super(IO_RW);
        this._capture = new IOStream(IO_WRITE);
        this._capture.connect(this);
        Register.IN.connect(this);
    }
    get capture(){return this._capture;}
    write_to_stream(b) {
        let upper = b>>8;
        b = b&0xff;
        if (upper>0) {
            super.write_to_stream(upper);
        }
        super.write_to_stream(b);
        this._outbuf.push(this._inbuf.shift());
    }
}