/*jshint esversion:6*/
export const IO_NONE = 0;
export const IO_READ = 1;
export const IO_WRITE = 2;
export const IO_RW = 3;
export const IO_XOFF = 0x13;
export const IO_XON = 0x11;
export const XFLOW = 1;
export const RTSCTS_FLOW=2;

export const IO_DTE = "DTE"; //Terminal
export const IO_DCE = "DCE"; //"Modem"

export class IOStream {
    constructor(mode) {
        if (mode !== IO_READ && mode !== IO_WRITE) {
            throw new Error("Unsupported mode: " + mode);
        }
        this._mode = mode;
        this._stream = null;
        this._blocking = false;
    }
    get mode() {return this._mode;}
    connect(bus) {

        if (this._stream) {
            this._stream.disconnect();
            
        }
        if (this.mode === IO_READ) {
            bus.output = this;
        } else {
            bus.input = this;
        }
    }
    disconnect() {
        this._stream = null;
    }
    connected() {return this.stream != null;}
    get stream() {
        return this._stream;
    }
    set stream(v) {
        if (v == null && this.stream!= null) {
            console.log("ABRUPT DISCONNECT FROM : " + this._stream);
        }
        if (this.stream!=null) {
            this.stream.disconnect();
            this._stream = null;
        }
        this._stream = v;
    }
    get is_read() {return this._mode === IO_READ;}
    get is_write() {return this._mode === IO_WRITE;}
    read() {
        if (this._mode === IO_WRITE) {
            throw new Error("Trying to read from a WRITE stream");
        } else if (!this.connected) {
            throw new Error("Trying to read from a disconnected stream");
        }else if (this._blocking) {
            throw new Error("Blocking reads");
        }
        return this._stream.read();
    }
    write(b) {
        if (this._mode === IO_READ) {
            throw new Error("Trying to write to a READ stream");
        } else if (!this.connected) {
            throw new Error("Trying to write to a disconnected stream");
        } else if (this._blocking) {
            throw new Error("Blocking writes");
        }
        this._stream.write(b);
    }
    update(pin,value) {
        if (pin === "RTS" && this.is_read) {
            this._blocking = value
        } else if (pin === "CTS" && this.is_write) {
            this._blocking = value;
        }
    }
}

/**
 * Note ths wiring is DB9 not DB25 where DB9 was implemented in a
 * different may differ. Pins are either INPUT or OUTPUT depending
 * whether the device they belong to is a Data Terminal Equipment (DTE) or
 * a Data Communication Equipment (DCE).
 *
 * Each pin is either an input or an output - carrying
 * information into or out from the computer. Note that a
 * signal that is an output from a computer is an input to
 * a serial instrument, and vice versa. For DCE (modem-type
 * instruments), therefore, the signals are on the same
 * pins but the directions are reversed. Pin 3, for
 * example, is Transmitted Data (TXD) but is an input.
 * This means that you can never tell from the signal
 * name alone whether it is an input to or an output
 * from a particular piece of equipment. Be careful when
 * looking at signal names: we have encountered instrument
 * manufacturers who change the names - after all it
 * must be confusing to tell a user that Received Data
 * is an output.
 *
 * To complicate things further, although the modems of the
 * standard always have DCE connections, a data acquisition
 * instrument might instead be configured as DTE (computer-
 * type). In this case, instead of connecting wires pin1-
 * pin1, pin2-pin2, etc, some will have to cross over. Pin
 * 3 of the computer, Transmitted Data, will need to be
 * linked to pin 2 of the instrument, Received Data.
 * Similarly wires between pins 7 and 8, RTS and CTS, need
 * to cross and those between pins 1 and 4, DCD and DTR.
 * This is achieved either with a Null Modem Adaptor or
 * a non-standard RS232 cable.
 *
 *
 * SIGNAL FUNCTIONS AND NAMES
 * ==========================
 * As we've seen, each signal has a name reflecting its
 * function.
 *
 * TXD Transmitted Data
 * This carries the serial encoded data from the computer
 * to the serial instrument. It is an output from DTE
 * (computer-type) and an input to DCE (modem-type).
 *
 * RXD Received Data
 * This carries the serial data from the instrument to the
 * computer. It is an input to DTE and an output from DCE.
 *
 * DSR Data Set Ready
 * This may be set true by an instrument whenever it is
 * powered on. It can be read by the computer to determine
 * that it is on line. It is an input to DTE and an output
 * from DCE.
 *
 * DTR Data Terminal Ready
 * This may be set true by a computer whenever it is
 * powered on. It can be read by the data acquisition
 * instrument to determine that the computer is on line. It
 * is an output from DTE and an input to DCE.
 *
 * RTS Request to Send
 * This may be set true by a computer when it wishes to
 * transmit data. It is an output from DTE and an input to
 * DCE.
 *
 * CTS Clear To Send
 * This may be set true by an instrument to allow the
 * computer to transmit data. The standard envisaged that
 * when a computer wished to transmit data it would set its
 * RTS. The local modem would then arbitrate with the
 * distant modem for use of the telephone line. If it
 * succeeded it would set CTS and the computer would
 * transmit data. The distant modem would use its CTS to
 * prevent any transmission by the distant computer. It is
 * an input to DTE and an output from DCE.
 *
 * DCD Data Carrier Detect
 * In the standard, this is set true by a modem when it
 * detects the data carrier signal on the telephone line.
 * It is an input to DTE and an output from DCE.
 *
 * For data acquisition applications, only 3 signal lines
 * are absolutely necessary: TXD, RXD and Signal Ground.
 *
 *
 * Pin  DTE        Signal
 *      Direction
 *  1    Input      DCD  Data Carrier Detect
 *  2    Input      RXD  Received Data
 *  3    Output     TXD  Transmitted Data
 *  4    Output     DTR  Data Terminal Ready
 *  5    Signal Ground
 *  6    Input      DSR  Data Set Ready
 *  7    Output     RTS  Request To Send
 *  8    Input      CTS  Clear To Send
 *  9    Input      RI   Ring Indicator
 **/

class Pin {

    constructor(connector,pin) {
        this._connector = connector;
        this._equipmentType = this._connector.type;
        this._pin = pin;
        this._name = Pin.Names[pin];
        this._mode = Pin.IOMapping[this._equipmentType][pin];
        this._wired = null;
        this._on = (pin-Pin.GRND)/Math.abs(pin-Pin.GRND);
        this._off = this._on*-1;
        this._voltage = 0;
        //pins "north" of ground are "on" in the negative -3-15V range and off in the
        //positive 3-15V range, the inverse is true for pins south of ground
    }
    set wired(p) {
        this._wired = p;
        p._wired = this;
    }
    get pin() {return this._pin;}

    get on() {
        switch(this.pin) {
            case Pin.DCD:
            case Pin.RXD:
            case Pin.TXD:
            case Pin.DTR:
                return (this._wired !== null && this._wired.v < -3) ? 1 : 0;
            case Pin.GRND:
                return 0xf;
            default:
                return (this._wired !== null && this._wired.v > 3) ? 1 : 0;
        }
    }
    get name() {return this._name;}
    get voltage() {
        if (this.mode === IO_READ) {
            return this._wired.voltage;
        }
        return this._voltage;
    }
    get mode() {
        return this._mode;
    }
    update() {
        this._connector.update(this,this.on);
    }
    set on(tf) {
        if (this.mode === IO_READ) {
            throw new Error("Don't write to an input pin!")
        } else if (this._wired === null) {
            throw new Error("Port is unconnected");
        }
        if (tf) {
            this._voltage = (3 + 12*Math.random())*this._high;
        } else {
            this._voltage = (3 + 12*Math.random())*this._low;
        }
        if (this._wired === null) {
            alert(this.name + " is not wired");
        }
        this._wired.update();
    }
    get v(){return this._voltage;}

}
Pin.Names = ["NOT_APPLICABLE_BEFORE 1986","DCD","RXD","TXD","DTR","GND", "DSR","RTS","CTS","RI"];
Pin.Monitors  = {};
Pin.Names.forEach(pn => Pin.Monitors[pn] = []);
Pin.DCD = 1;
Pin.RXD = 2;
Pin.TXD = 3;
Pin.DTR = 4;
Pin.GRND = 5;
Pin.DSR = 6;
Pin.RTS = 7;
Pin.CTS = 8;
Pin.RI = 9;



Pin.IOMapping = {
    DTE:[IO_NONE,IO_READ,IO_READ,IO_WRITE,IO_WRITE,IO_NONE,IO_READ,IO_WRITE,IO_READ,IO_READ],
    DCE:[IO_NONE,IO_WRITE,IO_WRITE,IO_READ,IO_READ,IO_NONE,IO_WRITE,IO_READ,IO_WRITE,IO_WRITE ]
}

export class Connector {
    constructor(equipment) {
        if (equipment === null || (equipment !== IO_DCE && equipment!== IO_DTE)) {
            throw new Error("The right connector Andy!");
        }
        this._equipment = equipment;
        this._pins = [];
        this._monitors = {};
        this._cp();
        this._pins.forEach(p => this._monitors[p.name] = []);

    }

    pin(id) {
        if (typeof id === 'string') {
            id = Pin.Names.indexOf(id);
        }
        return this._pins[id-1];
    }
    _cp() {
        while(this._pins.length < 9) {
            this._pins.push(new Pin(this,this._pins.length+1))
        }
    }
    get type() {return this._equipment;}
    get isTerminal() {return this._equipment === IO_DTE;}
    get isModem() {return this._equipment === IO_DCE;}
    connect(remote) {
        if (remote.type !== this.type) {
            this.pin(Pin.DCD).wired = remote.pin(Pin.DCD);//.wired = remote.pin(Pin.DCD);
            this.pin(Pin.RXD).wired = remote.pin(Pin.RXD);
            this.pin(Pin.TXD).wired = remote.pin(Pin.TXD);
            this.pin(Pin.DTR).wired = remote.pin(Pin.DTR);
            this.pin(Pin.DSR).wired = remote.pin(Pin.DSR);
            this.pin(Pin.CTS).wired = remote.pin(Pin.CTS);
            this.pin(Pin.RTS).wired = remote.pin(Pin.RTS);
            this.pin(Pin.RI).wired = remote.pin(Pin.RI);
            if (!this.isTerminal) {
                this.pin(Pin.RI).on = true;
            } else{
                remote.pin(Pin.RI).on = true;
            }
        }
    }
    clearToSend(){
        if (this.isModem) {
            this.pin(Pin.CTS).on = true;
        }
    }
    bufferFull() {
        if(this.isModem) {
            this.pin(Pin.CTS).on = false;
        } else {
            this.pin(Pin.RTS).on = true;
        }
    }
    bufferEmpty() {
        if (this.isTerminal) {
            this.pin(Pin.RTS).on = false;
        } else {
            this.pin(Pin.CTS).on = true;
        }
    }
    requestToSend() {
        if (this.isTerminal) {
            this.pin(Pin.RTS).on = true;
        }
    }
    valueChanged(pin,value) {
        switch(pin) {

        }
    }
    monitor(mon,pins) {
        if (pins !== null) {
            pins = pins.filter(p => Pin.Names.indexOf(p) >= 0);
            pins.forEach(pn => {
                if (this._monitors[pn].indexOf(mon)<0) {
                    this._monitors[pn].push(mon);
                }
            })
        }
    }
    update(pin,value) {
        if (this._monitors[pin.name].length > 0) {
            this._monitors[pin.name].forEach(m => m.update(pin.name,value));
        }
        //this._monitors[pin].forEach(m => m(pin,value));
    }
}


/**
 * Flowcontrol sounds boring, like plumbing. And it is. Like plumbing
 */
class FlowControl {
    constructor(bus) {
        this._bus = bus;
        this._remote = null;
        this._connector = new Connector(bus.mode===IO_WRITE?IO_DTE:IO_DCE);
        if (bus.mode === IO_WRITE) {
            this._connector.monitor(bus, ["CTS","RXD"]);
            this._connector.monitor(this, ["DSR","DCD"]);
        } else {
            this._connector.monitor(bus, ["RTS","TXD"]);
            this._connector.monitor(this, ["RI","DTR"]);
        }
    }

    update(pin,value) {
        if (pin === "RI" && value && !this._bus.connected) {
            this.pin("DCD").on = true;
        } else if (pin === "DCD" && value && !this._bus.connected) {
            this.pin("DTR").on = true;
            this.pin("RI").on = false;
        } else if (pin === "DTR" && value && !this._bus.connected) {
            this.pin("DSR").on = true;
            this.pin("DCD").on = false;

        }
    }
    pin(v) {
        return this._connector.pin(v);
    }
    connect(port) {
        this._remote = port;
        this._connector.connect(port._connector);
    }


}

export class IOBus {
    constructor(mode) {
        this._mode = mode || IO_READ;
        this._flowControl  = new FlowControl(this);
        this._in = null;
        this._out = null;
        this._inbuf = [];
        this._outbuf = [];
        this._outbuf_max = 128;
        this._inbuf_max = 128;
        this._connected = false;
        this._clear_to_send = false;
        this._ready_to_send = false;
    }
    get port() {
        return this._flowControl;
    }
    get connected() {
        //handshake baudrate, flow control
        switch(this.mode) {
            case IO_READ:
                return this._in != null;
            case IO_WRITE:
                return this._out != null;
            case IO_RW:
                return this._in != null && this._out != null;
        }
        throw new Error("UNRECOGNIZED MODE: " + this._mode);
    }
    get mode() {return this._mode;}
    set mode(v) {this._mode = v;}
    disconnect(mode) {
        if (mode === IO_WRITE) {
            this._in = null;
        } else if (mode === IO_READ) {
            this._out = null;
        }
    }

    get can_read() {
        return this.output_buffer_size>0;
    }
    get can_write() {
        return this.input_buffer_size<this.input_buffer_max;
    }
    read_from_stream() {

        if (this._outbuf.length > 0) {
            this._flowControl.pin("CTS").on = this._outbuf.length < this._outbuf.max;
            return  this._outbuf.shift();
        }
        //throw new Error("No data available")

    }
    write_to_stream(w) {

        if (this._inbuf.length <= this._inbuf_max) {
            //this._inbuf.push(w>>8);
            this._inbuf.push(w&0xFF);
            this._flowControl.pin("RTS").on = true;

        } else {
            console.log("Silently dropping input: " + w);
        }
    }


    set input(v) {
        if (this._in) {
            this._in.stream.disconnect();
        }
        this._in = v;
        this._in.stream = {disconnect:(m) => this.disconnect,write:(b) => {return this.write_to_stream(b);}};

    }
    get input() {return this._in;}
    set output(v) {
        if (this._out) {
            this._out.stream = null;
        }
        this._out = v;
        this._out.stream = {disconnect:(m) => this.disconnect,read:() => {return this.read_from_stream();}};
    }
    get CTS() {return this._clear_to_send;}
    set CTS(v) {this._clear_to_send = v;}
    get RTS() {return this._ready_to_send;}
    set RTS(v) {return this._ready_to_send=v;}
    get output() {return this._out;}
    get output_buffer_size() {return this._outbuf.length;}
    get output_buffer_max() {return this._outbuf_max;}
    get input_buffer_size() {return this._inbuf.length;}
    get input_buffer_max() {return this._inbuf_max;}
    update(pin, value) {
        if (pin === "CTS") {
            this.CTS = value;
        } else if (pin === "RTS") {
            this.RTS = value;
        }
    }
}

export class DevNullBus extends IOBus {
    constructor() {
        super(IO_WRITE);
    }
    read() {return this.read_from_stream();}
    write(w) {return this.write_to_stream(w);}
    read_from_stream() {return 0;}
    write_to_stream(w) {return 1;}
}
export const devnull = new DevNullBus();