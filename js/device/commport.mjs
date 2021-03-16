import {RS232,PARITY_NONE,PARITY_MARK,PARITY_EVEN} from './rs232.mjs';


/**
 * We can have
 */

export class CommPort extends RS232 {
    static Register(name, port) {
        let no = Object.keys(CommPort.Registry).length+1;
        name +=(no<10?"0":"")+no;
        CommPort.Registry[name] = port;
        return name;
    }
    constructor(rate, transmit_control) {
        super(rate,transmit_control);
        this._name = CommPort.Register("COM",this);
        this._bus = null;
        this._errorHandler = null;
        this._pthread = null;
        /**
         * Now in a 9600 v 9600 scenario we should be able to send
         * 600 words which means one every
         */
    }
    set bus(b) {
        this._bus = b;
        this.update_at_interval(5);
    }
    get bus(){return this._bus;}

    update_at_interval(ms) {
        const errors = this._errorHandler;
        this._pthread = setInterval(() => {
            try {
                let av = Math.min(10,this.transmittable);
                for (;av>0;av--) {
                    this.update();
                }
            } catch (e) {
                if (errors) {
                    errors(e);
                }
            }
        }, ms);
    }
    update() {
        if (this.write_available && this.bus.CTS) {
            let v = this.transmit();
            if (v!==-1) {
                this.bus.stream.write_to_stream(v);
            }
        }
    }
    on(e,h) {
        if (e === 'ERROR') {
            this._errorHandler = h;
        }
    }
    end() {
        clearInterval(this._pthread);
        this._pthread =null;
    }
    get active() {return this._pthread != null;}
}
CommPort.Registry = {};