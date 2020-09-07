/*jshint esversion:6*/
import * as fs from 'fs';

export const TTYCHUNK_NONE=0; //RETURN EVERY CHAR
export const TTYCHUNK_WORD=1; //Return every word (eg separated by whitespace)
export const TTYCHUNK_LINE=2; //Return every line
export const TTYCHUNK_SCREEN=3; //Return every screen

export const TTYFILTER_ACTIVE = 0;
export const TTYFILTER_PAUSED = 1;
export const TTYFILTER_BYPASS = 2;
export const TTYNEWLINE = [String.fromCharCode(10),String.fromCharCode(13)];
export class TTYFilter {
    constructor(name,config) {
        this._name = name;
        this._config = config || {
            chunk:TTYCHUNK_NONE,
            trap:false,

        };
        this._chunk = TTYCHUNK_NONE;
        this._buffer = [];
        this._action_trigger = null;
        this._triggered = false;
        this._actions = {default:(c) => {
            
        }};
        this._discard_on_unmatched = false;
        this._in = null;
        this._out = null;
        this._separators = " \t\n\r";
        this._block = [];
        this._state = TTYFILTER_ACTIVE;
        this._pbuf = [];
        this._next = null;
        this._position = 0;
    }
    do_default() {
        if (this.buffer_length>0) {
            this._actions["default"](this.clear());
        }
    }
    block(b){
        if (b && this._block.indexOf(b)<0) {
            this._block.push(b);
        }
        return this;
    }
    unblock(b) {
        if (b && this._block.indexOf(b)>=0) {
            this._block.splice(this._block.indexOf(b),1);
        } else if (b == null) {
            this._block.length = 0;
        }
        return this;
    }
    blocked(b){
        return b && this._block.indexOf(b)>=0;
    }
    set triggered(v) {this._triggered = v;}
    get triggered() {return this._triggered;}
    set next(v) {this._next = v;}
    get next() {return this._next;}
    pause() {
        this._state = TTYFILTER_PAUSED;
        console.log("Paused and : " + this._buffer.length + " in buffer");
    }
    unpause() {
        
        while(this._pbuf.length > 0) {
            this.do_filter(this._pbuf.shift());
        }
        this._state = TTYFILTER_ACTIVE;
    }
    bypass(on) {
        if (on && this.next) {
            this._state = TTYFILTER_BYPASS;
        } else {
            this._state = TTYFILTER_ACTIVE;
        }
    }
    set default(v) {
        this._actions["default"] = v;
    }
    get default() {
        return this._actions["default"];
    }
    set newline(v) {
        this._actions["newline"] = v;
    }
    get newline(){return this._actions["newline"];}

    has_action(c) {
        c = c || this._buffer.join("");
        c = this.is_newline(c)?"newline":c;
        return this._actions[c];
    }
    resolve_action(c) {
        return this.has_action(c) || this.default;
    }
    get separators() {return this._separators;}
    set separators(v) {this._separators = v;}
    is_separator(c) {
        return this._separators.indexOf(c) >=0;
    }
    is_newline(c) {
        return TTYNEWLINE.indexOf(c)>=0;
    }
    is_trigger(c) {
        return this._action_trigger == c;
    }
    get buffer_length() {
        return this._buffer.length;
    }
    ignore(combo) {
        this.add_action(combo, (devnull) => {

        });
    }
    clear() {
        this.reset_trigger();
        return this._buffer.splice(0,this._buffer.length);
    }
    act() {
        let a = this.has_action();
        if (a) {
            a(this.clear());
            return true;
        } else if (this.triggered && this.buffer_length>this.longest_trigger) {
            this.reset_trigger();
        }
        return false;
    }
    get longest_trigger() {
        let k = null;
        let longest = 0;
        for (k in this._actions) {
            if (k != "default" && k != "newline") {
                longest = Math.max(k.length,longest);
            }
        }
        return longest;
    }
    end() {
        
        if (!this.act()) {
            this.do_default();
        }
    }
    get position() {return this._position;}
    reset_position() {this._position = 0;}
    reset_trigger() {this._triggered = false;}
    get chunk() {return this._chunk;}
    set chunk(v){this._chunk = v;}
    filter(c) {
        if (c instanceof Array) {
            
            
            while (c.length >0) {
                this.filter(c.shift());
            }
        }
        switch(this._state) {
            case TTYFILTER_PAUSED:
                this._pbuf.push(c);
                break;
            case TTYFILTER_BYPASS:
                this._next.filter(c);
                break;
            default:
                this.do_filter(c);
        }
        
    }
    do_filter(c) {
        
        this._position++;
        switch(this.chunk){
            case TTYCHUNK_NONE:
                let a = this.resolve_action(c);
                a(c);
                break;
            case TTYCHUNK_WORD:
                if (this.triggered) {
                    this.buffer(c);
                    if (this.act()) {
                        return;
                    }
                    this._buffer.pop();
                } 
                if (this.is_trigger(c)) {
                    this.do_default();
                    this._triggered = true;
                    this.buffer(c);
                } else if (this.has_action(c)) {
                    this.do_default();
                    this.has_action(c)(c);
                } else if (this.is_separator(c)) {
                    this.buffer(c);
                    this.do_default();
                } else if (this.is_newline(c)) {
                    this.buffer(c);
                    this.do_default();
                } else {
                    this.buffer(c);
                }
                
                break;
            case TTYCHUNK_LINE:
                if (this.triggered) {
                    this.buffer(c);
                    if(this.act()) {
                        return;
                    }
                    this._buffer.pop();
                }
                if (this.is_trigger(c)) {
                    this.do_default();
                    this._triggered = true;
                    this.buffer(c);
                } else if (this.has_action(c)) {
                    this.do_default();
                    this.has_action(c)(c);
                } else if (this.is_newline(c)) {
                    this.buffer(c);
                    this.do_default();
                } else {
                    this.buffer(c);
                    if (this.buffer_length == this.line_trigger) {
                        this.do_default();
                    }
                }
                
                break;
        } 
    }
    buffer(c) {
        if (!this.blocked(c)) {
            this._buffer.push(c);
        }
    }
    trigger(v) {
        this._action_trigger = v;
        return this;
    }
    add_action(combo,handler) {
        if (handler == null) {
            return this.remove_action(combo);
        } else if (this.is_newline(combo)) {
            combo = "newline";
        }
        this._actions[combo] = handler;
        return this;
    }
    remove_action(combo) {
        delete this._actions[combo];
        return this;
    }
    
    get action_trigger() {return this._action_trigger;}
    set action_trigger(v) {
        this._action_trigger = v;
    }
    on(action, handler) {
        this._actions[action] = handler;
        if (handler == null) {
            delete this._actions[action];
        }
    }

}

class TTYIn {
    static in() {
        if (!this._in) {
            this._in = new TTYIn();
        }
        return this._in.start();
    }
    constructor() {
        if (TTYIn._in) {
            return TTYIn.in();
        }
        this._ioin = process.stdin;
        this._ttyin = null;
        this._next = TTYOut.out();
        this._sink = this._next;
        this._ioin.setEncoding('utf8');
        
        this._process = null;
    }
    attach(p) {
        this._process = p;
        if (p.preprocessor) {
            this._next = p.preprocessor;
            p.next = TTYOut.out();
        }
    }
    has_attached(){return this.attached != null;}
    attached() {return this._process;}
    detach() {
        
        if (this._next != TTYOut.out()) {
            this._next.end();
            this._next = TTYOut.out();
        }
        this._process.end();
        this._process = null;
    }
    get stream(){
        if (this._ttyin) {
            return this._ttyin;
        }
        return this._ioin;
    }
    get next(){return this._next;}
    set next(f){
        if (f == null) {
            throw new Error("NULL I/O SINK ATTACHED");
        }
        this._next = f;
        
    }
    start(){
        if (!this._started) {
            let tty = Boolean(this.stream.isTTY);
            this._started = true;
            if (this.stream.setRawMode) {
                this.stream.setRawMode(true);
                this.stream.on("data", (c) => this.read(c));
            } else {
                this._ttyin = fs.openSync('/dev/tty', fs.constants.O_RDONLY);
                if (this.stream.isTTY) {
                    this._started = false;
                } else {
                    try {
                        this._ttyin.close();
                    } catch (e) {}
                    this._ttyin = null;
                }
                this._ioin.on("readable", () => {
                    let c = null;
                    while ((c = this._ioin.read())!=null) {
                        c = c.split("");
                        for(let i = 0; i < c.length;i++) {
                            this.read(c[i]);
                        }
                        
                        //c.split("").forEach( ch => this.read(ch));

                    }
                });
                this._ioin.on("end", () => {
                    if (this.stream == this._ioin) {
                        if (this._process) {
                            this._process.end();
                            this._process=null;
                        }
                        process.exit(0);
                    }
                });
                return this.start();
            }
            
        }
        return this;
    }
    read(c) {
        if (c && c.charCodeAt(0)==3) {
            //global kill signal
            if (this._process) {
                this._process.kill(3);
                this._process = null;
            } else {
                process.exit(0);
            }
            
        } else if (c) {
            //console.log(c + " [" + c.charCodeAt(0) + "]");
            this.next.filter(c);
        } else {
            console.log(typeof(c));
        }
    }
}

class TTYOut extends TTYFilter {
    static out() {
        if (this._out == null) {
            this._out = new TTYOut();
        }
        return this._out;
    }
    static send(str) {
        this._out.stream.write("\n" + str + "\n");
    }
    constructor() {
        super("_ioout");
        if (TTYOut._out !=null) {
            return TTYOut._out;
        }
        this._out = process.stdout;
        this._out.setEncoding("utf8");
        this.default = (c) => {
            if (c instanceof Array) {
                c = c.join("");
            }
            this.stream.write(c);
        };
        this.state = TTYFILTER_ACTIVE;
        this.add_action("\n",()=> {
            this._out.write("\n");
        });
        this.add_action("\r",()=> {
            this._out.write("\n");
        });

    }
    get stream() {return this._out;}
    get next() {return this;}
    set next(v) {}
    set state(v) {}
    get state() {return TTYFILTER_ACTIVE;}
    get chunk() {return TTYCHUNK_NONE;}
}
export const TTY = {};

TTY.out = TTYOut.out();
TTY.in = TTYIn.in().start();
export class TTYBoundProcess {
    static pid() {
        return this._next_pid++;
    }
    constructor(name) {
        this._name = name || "RANDO";
        this._live = false;
        this._pid = TTYBoundProcess.pid();
        this._signal = 0;
        this._pth = null;
        this.preprocessor = new TTYFilter("__pre-" + this._pid);
        /*this._preprocessor.default = (c) => {
            if (typeof(c) == 'string' && c.length == 1) {
                if (c === 'A') {
                    TTY.out.filter("\x1b[0;4m" + c + "\x1b[0m");
                } else if (c == 'b' || c == 'c') {
                    TTY.out.filter(c.toUpperCase().repeat(2));
                } else {
                    TTY.out.filter(c);
                }

            } else {
                TTY.out.filter(c);
            }
        };*/
    }
    attach() {
        
        if (!this._live) {
            this._live = true;
            TTY.in.attach(this);
            TTY.in.start();
        }
    }
    get preprocessor() {return this.__prep;}
    set preprocessor(v) {
        if (this.__prep) {
            throw new Exception("DOUBLE INSTANTIATION");
        }
        this.__prep = v;
    }
    get pid() {return this._pid;}
    get signal() {return this._signal;}
    get name() {return this._name;}
    get alive() {return this._live;}
    get killed() {return !this.alive;}
    get quittable() {return false;}
    start() {
        this.attach();
        if (this.quittable) {
            this._pth = setInterval(() => {

            },5);
        }
    }
    kill(signal) {
        this._signal = signal||0;
        this._live = false;
        this.end();
    }
    
    end() {
        if (this.quittable) {
            clearInterval(this._pth);
        }
        if (this._signal>0) {
            TTYOut.send(`[Terminating ${this.name} (${this.pid})]`);
        }
    }
}
TTYBoundProcess._next_pid = ((Math.random()*10000)>>0);
//TTY.in.attach(new TTYBoundProcess("TESTING"));