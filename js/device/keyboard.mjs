/*jshint esversion:6*/

import { IOBus } from "../bus/io.mjs";
import { IO_WRITE } from "../bus/io.mjs";
import { IO_RW } from "../bus/io.mjs";
import { IOStream } from "../bus/io.mjs";
import { Register } from "../cpu/cpu.mjs";
import {io_ex, primaryTTY,RS323TerminalDevice} from "../io/io2.mjs";

export class TTYKeyboard extends RS323TerminalDevice {
    constructor() {
        super(9600,10);
        io_ex.register(this);
    }

    getOutputtype(){return primaryTTY;};
    write_to_stream(b) {

        if (b>0xff) {
            this.terminal.writeWord(b);
        } else {
            this.terminal.write(b);
        }

    }
}