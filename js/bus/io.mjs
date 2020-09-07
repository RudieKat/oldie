/*jshint esversion:6*/

export const IO_READ = 1;
export const IO_WRITE = 2;
export const IO_RW = 3;
export const IO_XOFF = 0x20; //TODO FIX

export class IOStream {
    constructor(mode) {
        if (mode != IO_READ && mode != IO_WRITE) {
            throw new Error("Unsupported mode: " + mode);
        }
        this._mode = mode;
        this._stream = null;
    }
    get mode() {return this._mode;}
    connect(bus) {
        if (this._stream) {
            this._stream.disconnect();
            
        }
        if (this.mode == IO_READ) {
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
    is_read() {return this._mode == IO_READ;}
    is_write() {return this._mode == IO_WRITE;}
    read() {
        if (this._mode == IO_WRITE) {
            throw new Error("Trying to read from a WRITE stream");
        } else if (!this.connected) {
            throw new Error("Trying to read from a disconnected stream");
        }
        return this._stream.read();
    }
    write(b) {
        if (this._mode == IO_READ) {
            throw new Error("Trying to write to a READ stream");
        } else if (!this.connected) {
            throw new Error("Trying to write to a disconnected stream");
        }
        this._stream.write(b);
    }
}
export class IOBus {
    constructor(mode) {
        this._mode = mode || IO_READ;
        this._in = null;
        this._out = null;
        this._inbuf = [];
        this._outbuf = [];
        this._outbuf_max = 128;
        this._inbuf_max = 128;
        
    }
    get connected() {
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
        if (mode == IO_WRITE) {
            this._in = null;
        } else if (mode == IO_READ) {
            this._out = null;
        }
    }
    set input(v) {
        if (this._in) {
            this._in.stream.disconnect();
        }
        this._in = v;
        this._in.stream = {disconnect:(m) => this.disconnect,write:(b) => {return this.write_to_stream(b);}};
        
    }
    
    read_from_stream() {
        if (this._outbuf.length > 0) {
            return this._outbuf.shift();
        }
        return 0;
    }
    write_to_stream(w) {
        if (this._inbuf.length <= this._inbuf_max) {
            //this._inbuf.push(w>>8);
            this._inbuf.push(w&0xFF);
        }
        return IO_XOFF;
    }
    

    
    get input() {return this._in;}
    set output(v) {
        if (this._out) {
            this._out.stream = null;
        }
        this._out = v;
        this._out.stream = {disconnect:(m) => this.disconnect,read:() => {return this.read_from_stream();}};
    }
    get output() {return this._out;}
    get output_buffer_size() {return this._outbuf.length;}
    get output_buffer_max() {return this._outbuf_max;}
    get input_buffer_size() {return this._inbuf.length;}
    get input_buffer_max() {return this._inbuf_max;}
    
}

export class DevNullBus extends IOBus {
    constructor() {
        super(IO_RW);
    }
    read_from_stream() {return 0;}
    write_to_stream(w) {return 1;}
}
export const devnull = new DevNullBus();