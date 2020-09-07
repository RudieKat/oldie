/*jshint esversion:6*/

import { Shell } from "../sh.mjs";
import { OsDir } from "../fs/dir.mjs";
import { TTY,TTYCHUNK_NONE, TTYFilter } from "./pipe.mjs";
import { TTYBoundProcess } from "../bin/osi.mjs";

const TTYT_CMD = 1;
const TTYT_FLAG = 2;
const TTYT_VALUE = 4;
const TTYT_PATH = 8;
const allowed = "ABCDEFGHIJKLMNOPQRSTUVWXYZ01234567889+-=*#\'\"&~^|_.,:;abcdefghijklmnopqrstuvwxyz[]{}()/\\";




/**
 * Wrapper around process.stdin
 */
class TTYIn {
    constructor() {
        this._buffer = [];
        this._in = process.stdin;
    }
    handle(c) {

    }
}

class TTYOUt extends TTYFilter {
    constructor(prompt) {
        super("sh_tty")
        this._prompt = prompt || "ULTRA~> ";
        this._chars = [];
        this._tokens = [];
        this._marks = [];
        this._active = false;
        this._next = TTY.out;
    }
    get out() {return this.next;}
    get active() {return this._active;}
    set active(v) {this._active = v;}
    clear() {
        this._chars.length = 0;
        this._tokens.length = 0;
        this._marks.length = 0;
    }
    get tokenized() {
        if (this._tokens.length == 0) {
            return 0;
        }
        return this._tokens.length + this._tokens.map(t => t.length).reduce((a,b) => 0 + (a||0) + (b||0));
    }
    get chars_as_string() {
        return this._chars.join("");
    }
    rewind_all() {
        this.out.filter("\b".repeat(this._chars.length));
        this._chars.length = 0;
        this._tokens.length = 0;
        this._marks.length = 0;
        return this;
    }
    rewind() {
        let diff = this._chars.length - this.tokenized;
        if (this.tokenized == 0) {
            diff = this._chars.length;
            this._marks.length = 0;
        }
        if (diff>0) {
            this.out.filter("\b".repeat(diff));
            this._chars.length = this.tokenized;
        }
        this._marks = this._marks.filter( m => m < this._chars.length);
        return this;
    }
    mark(i) {
        i = i||this._chars.length;
        if (this._marks.indexOf(i)<0) {
            this._marks.push(i);
        }
    }
    write_line(c) {
        this.write(c + "\n")
    }
    do_filter(c) {
        this.write(c);
    }
    write(ch) {
        if (!this.active) {
            ch= "\n" + ch.trim() + "\n";
            this.out.filter(ch);
        } else if (ch == this._prompt) {
            this.out.filter(ch);
            this.clear();
        } else {
            ch.split("").forEach(c => {
                switch(c.charCodeAt(0)) {
                    case 10:
                    case 13:
                        this.out.filter(c);
                        this.clear();
                        return;
                    case 32:
                        
                        if (this._tokens.length == 0) {
                            this._tokens.push(this._chars.join(""));
                        } else {
                            let off = this._tokens.length + this._tokens.map(t => t.length).reduce((a,b) => 0 + a + b);
                            this._tokens.push(this._chars.slice(off).join(""));
                        }
                        if (this._chars.length > 0 && this._chars[this._chars.length-1] != ' ') {
                            this._chars.push(c);
                            this.out.filter(c);
                            return;
                        } 
                        return;
                    case 127:
                        if (this._chars.length > 0) {
                            

                            this.out.filter("\x08 \x08");
                            if (this._chars.pop() == ' ') {
                                this._tokens.pop();
                            }
                            this._marks = this._marks.filter(m => m<this._chars.length);
                        }
                        return;
                        
                    default:
                        this._chars.push(c);
                        this.out.filter(c);
                        break;
                }
            });
        }
        
    }
}

export class TTYTrap extends TTYBoundProcess {
    constructor(sh,prompt) {
        super("ttysh");
        this._prompt = prompt || 'ULTRA~> ';
        this._sh = sh || Shell.sh();
        //this._in = process.stdin;
        this._written = 0;
        this._marks = [];
        this._out = new TTYOUt(this._prompt);

        this._buffer = "";
        this._results = [];
        this._state = TTYT_CMD;
        //this.in.on("data", (c) => this.data(c));
        this.preprocessor.chunk = TTYCHUNK_NONE;
        this.preprocessor.default = (c) => {
            this.filter(c);
        };
        this.preprocessor.newline = () => {
            this.newline();
        };
        this._search_index = -1;
        this._history = [];
        this._dirs = [];
        this._files = [];
        this._commands = [];
        
        
    }
    index() {
        this._dirs = OsDir.all_dir_paths();
        this._files = OsDir.all_file_paths();
        this._commands = Shell.all_commands();
    }
    get sh() {return this._sh;}
    set sh(v) {this._sh = sh;}
    get in() {return this._in;}
    get out() {return this._out;}
    get active() {return this.out.active;}
    on() {
        this.index();
        this.attach();
        this.out.active = true;
        this.out.next = this.next;
        
        this.out.filter( this._prompt);
        
    }
    off() {
        this.out.active = false;
    }
    token() {
        if (this._buffer.trim().lastIndexOf(' ') > 0) {
            return this._buffer.trim().substring(this._buffer.trim().lastIndexOf(' '));
        }
        return "";
    }
    newline() {
        this.out.filter("\n");
        if (this._buffer.trim().length > 0) {
            if (this._cmd == null) {
                this._cmd = new TTYCommand(this._buffer.split(" ")[0]);
            } else if (this._cmd.name == null) {
                this._cmd.name = this._buffer.split(" ")[0];
            } else {

                let last_token = this.token();
                if (this._results.length > 0) {
                    last_token = this._results.pop();
                }
                if (last_token != null) {
                    this._cmd.add(last_token);
                }
            }
            this.sh.execute_ttycmd(this._cmd);
            this._history.unshift(this._cmd);
            this._buffer = "";
            this._cmd = null;
            this._results.length = 0;
            this._search_index = -1;
        } else {
            this.out.filter(this._prompt);
        }
    }
    filter(c) {
        if (this._buffer.length < 4 && (c == 'q' || c == 'Q' )) {
            this.sh.end();
            return;
        }
        if (!this.active) {
            return;
        }
        if (c === '\t') {
            if (this._results.length > 1) {
                /*let len = Math.max(0,this._buffer.length-this._search_index);
                let backsp = "\b".repeat(this._buffer.length-this._search_index);
                this.out.write(backsp);*/
                this.out.rewind(true);
                this._results.push(this._results.shift());
                this.out.filter(this._results[this._results.length-1]);
                //this._buffer = this._buffer.substring(0,this._search_index) + this._results[this._results.length-1];
                
            } else {
                if (this._results.length > 0) {
                    this.out.rewind(true);
                    let p = this._results.pop();
                    this.out.filter(p);
                    
                    if (this._cmd == null) {
                        this._cmd = new TTYCommand(p);
                    }else {
                        this._cmd.add(p);
                    }
                }
                this._search_index = this._buffer.length;
                this._results = [];
                if (this._cmd == null) {
                    this._results = this._commands.filter(n => this._buffer.length == 0 || n.indexOf(this._buffer)==0);
                    if (this._results.length > 0) {
                        this._buffer = this._results[0];
                        this.out.rewind_all().filter(this._buffer);
                    }
                } else {
                    let tk = this.token();//this._buffer.trim().substring(this._buffer.trim().lastIndexOf(' ')).trim();
                    if (tk.length > 0 && tk.startsWith('-')) {
                        //no support for flags yet.
                    } else if (tk!=null) {
                        tk = tk.trim();
                        let fp = this.sh.path;
                        if (tk.startsWith('.')) {
                            let fp_split = fp.split("/");
                            while(tk.indexOf('..') == 0) {
                                fp.split.pop();
                                if (tk.indexOf('/')==2) {
                                    tk.substring(3);
                                } else {
                                    tk.substring(2);
                                }
                            }
                            fp = "/" + fp_split.join("/") + (tk.indexOf("/")==0?tk:"/" + tk);
                        } else if (!tk.startsWith("/")) {
                            if (fp === '/') {
                                fp +=tk;
                            } else {
                                fp+="/" + tk;
                            }
                        }
                        this._results = [...this._dirs.filter(f => f.indexOf(fp)==0), ...this._files.filter(f => f.indexOf(fp) ==0)];
                        
                    }
                    let cnt = this._results.length;
                    if (cnt > 0) {
                        this.out.mark();
                        this._results.sort((a,b) => a.length-b.length);
                        this._results.push(this._results.shift());
                        let len = this._buffer.trim().lastIndexOf(" ");
                        if (len >=0) {
                            len = this._buffer.length - len;
                            this.out.write("\b".repeat(len));
                            this._buffer = this._buffer.substring(this._buffer.lastIndexOf(" ")) + " ";
                            this.out.filter(" ");
                            
                        }
                        this.out.filter(this._results[this._results.length-1]);
                    }
                    
                    
                    
                }
                //do the search
            }
        } else if (c === ' ') {
            if (this._results.length > 0) {
                this._buffer +=this._results.pop();
                this._results = [];
                this._search_index = -1;
            }
            if (this._buffer.length == 0) {
                return;
            } else if (this._buffer.indexOf(' ')<0) {
                //cmd
                this._cmd = new TTYCommand(this._buffer);
                this._state = TTYT_FLAG + TTYT_PATH;
            } else {
                let tk = this._buffer.substring(this._buffer.lastIndexOf(' ')).trim();
                this._cmd.add(tk);
                
            }
            this._buffer+=c;
            
            this.out.filter(c);
            this.out.mark();
            
        } else if (c === '\n' || c === '\r') {
            

        } else if (c.charCodeAt(0) === 127) {
            if (this._results.length > 0) {
                this.out.filter(c);
                this._buffer = this.out.chars_as_string;
                this._results = [];
                this._search_index = -1;
            } else {
                
                let tk = this.out.tokenized;
                this.out.filter(c);
                this._buffer = this.out.chars_as_string;
                if (this.out.tokenized==0) {
                    this._cmd = null;
                } else if (this.out.tokenized < tk) {
                    this._cmd.pop();
                }
                
                

            }
        } else if (allowed.indexOf(c) >=0) {
            
            if (this._cmd && this._results.length> 0) {
                this.out.rewind();
                let p = this._results.pop();
                this._cmd.add(p);
                c = p+c;
                if (this._buffer.indexOf(' ') > 0) {
                    this._buffer = this._buffer.substring(0,this._buffer.lastIndexOf(' ')) + " ";
                } else {
                    this._buffer +=' ';
                }
            } else if (this._results.length > 0) {
                this._cmd = new TTYCommand(this._results.pop());
                this._buffer = this._cmd.name;
            }
            this._search_index = -1;
            this._results = [];
            this._buffer+=c;
            this.out.filter(c);
        } else {
            console.log(c.charCodeAt(0));
        }
        
    }

}

class TTYFlag {
    constructor(name) {
        this._name = name;
        this._value = null;
    }
    set value (v) {this._value = v;}
    get value() {return this._value;}
    get has_value() {return this.value != null;}
    get name() {return this._name;}
    get as_param() {return this.has_value?this.name + ":" + this.value: this.name;}

}
class TTYBareword {
    constructor(value) {
        this._value = value;
    }
    get value() {return this._value;}
    get as_param() {return this.value;}
}
class TTYEnvVar {
    constructor(name) {
        if (name[0]!=='@') {
            throw new Error("Not an environment var");
        }
        this._name = name;
    }
    get name() {return this._name;}
    get as_param() {return this.name;}
    get resolved() {return null;}
}
class TTYCommand {
    constructor(name) {
        this._name = name;
        this._flags = [];
        this._paths = [];
    }
    get name() {return this._name;}
    set name(v) {this._name = v;}
    get params() {return [...this._flags.map(f => f.as_param),...this._paths.map(df => df.fpath.length>0?df.fpath:'/')];}
    get last_flag() {
        if (this._flags.length > 0) {
            return this._flags[this._flags.length-1];
        }
        return null;
    }
    pop() {this.pop_last();}
    pop_last() {
        if (this._paths.length > 0) {
            this._paths.pop();
        } else if (this._flags.length > 0) {
            this._flags.pop();
        } else {
            this._name = null;
        }
    }
    add(v) {
        if (v == null || v.length == 0) {
            return false;
        }
        v = v.trim();
        if (v.startsWith('-')) {
            this._flags.push(new TTYFlag(v));
        } else if (v.startsWith("@")){
            this._flags.push(new TTYEnvVar(v));
        }  else if (!this.add_as_path(v)) {
            this._flags.push(new TTYBareword(v));
        }
    }

    add_as_path(v) {
        if (v.indexOf("/")!=0) {
            v = Shell.sh().path + "/" + v;
        }
        let hypoPath = OsDir.find(v);
        if (hypoPath) {
            this._paths.push(hypoPath);
        } else if (this.last_flag && this.last_flag instanceof TTYFlag) {
            this.last_flag.value = v;
        } else {
            return false;
        }
        return true;
    }
}

class ACNode {

}