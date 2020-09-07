/*jshint esversion:6*/
import { Shell,ShApplication} from './osi.mjs';
import { TTYCHUNK_LINE } from '../util/pipe.mjs';
import { TTYCHUNK_WORD } from '../util/pipe.mjs';
import { TTY } from '../util/pipe.mjs';
import * as fs from 'fs';
import { TTYFilter } from '../util/pipe.mjs';

const ROFF_SWALLOW = 0;
const ROFF_AWAIT_INT = 1;
const ROFF_AWAIT_INTS = 2;
const ROFF_AWAIT_CHAR = 4;
const ROFF_AWAIT_CHARS = 8;
const ROFF_AWAIT_MACRO = 16;
const ROFF_AWAIT_STRING = 32;
const ROFF_CONSUME = 64;
const ROFF_IGNORE_UNTIL = 128;

const ROFF_CHAR = 1;
const ROFF_TITLE = 2;
const ROFF_PADDING=4;
const ROFF_PAGE = 8;
const ROFF_INDENT = 16;
const ROFF_TAB = 32;
const ROFF_LINE = 64;


const ROFF_LINENO = 1;
const ROFF_NO_NUMBERS = 2;
const ROFF_FOOT_TITLE = 4;
const ROFF_HEAD_TITLE = 8;
const ROFF_PAGE_NO = 16;
const ROFF_PAGE_OFFSET = 32;
const ROFF_PAPER_LENGTH = 64;
const ROFF_TABREPLACE = 128;
const ROFF_ADJUSTED_LINES = 256;
const ROFF_PAGE_COUNT = 512;
const ROFF_CONTROL = 512;


const ROFF_COPY = 128;
const ROFF_ADJUST_LEFT = 2;
const ROFF_ADJUST_RIGHT = 3;
const ROFF_ADJUST_CENTER = 4;
const ROFF_FILL = 1;
const ROFF_NEW_PAGE = 0;
const ROFF_SINGLE_SPACED=1;
const ROFF_DOUBLE_SPACED=2;
const ROFF_CASE_UPPER = 1;
const ROFF_UNDERLINE = 1;
const ROFF_ESC_UNDERLINE="\x1b[0;4m";
const ROFF_ESC_RESET="\x1b[0m";
export class Roff extends ShApplication {
    static app() {
        if (this._app == null) {
            this._app = new this();
            Shell.register(this._app.name,this._app);
        }
        return this._app;
    }
    constructor() {
        super();
        this._state = ROFF_CONSUME;
        this._spacing = 1;
        this._line_length = 65;
        this._indent = 20;
        this._temp_indent = false;
        this._temp_indent_spaces = 0;
        this._lines_per_screen = 24;
        this._consumed_lines = 0;
        this._copy = false;
        this._arabic = true;
        this._page = 0;
        this._page_offset = 0;
        this._top_padding = 2;
        this._title_padding = 2;
        this._text_padding = 1;
        this._foot_padding = 3;
        this._action = null;
        this._show_title = true;
        this._titles = {head:'',foot:'',even_foot:'',even_head:'',odd_foot:'',odd_head:''};
        this._line_buf = [];
        this._translate = {};
        this._adjust = ROFF_ADJUST_LEFT;
        this._fill = true;
        this.pp.add_action(".ad", () => {
            //adjust right and fill
            this._adjust = ROFF_ADJUST_RIGHT;
            this._state = ROFF_SWALLOW;
            this.flush();
        });
        this.pp.add_action(".ar", () => {
            //adjust right and fill
            this._arabic = true;
            this._state = ROFF_SWALLOW;
        });
        this.pp.add_action(".bl", () => {
            //adjust right and fill
            this.flush();
            this._state = ROFF_AWAIT_INT;
            this.action = (c) => {
                for(; c>0;c--) {
                    this.flush();
                }
                this._state = ROFF_SWALLOW;
                this.action = this.nop;
            };
        });
        this.pp.add_action(".bp", () => {
            //adjust right and fill
            this._state = ROFF_AWAIT_CHARS;
            this.action = (m) => {
                this.flush();
                if (m != null) {
                    try {
                        let t = parseInt(m);
                        this._page = t;
                    } catch (e){}
                }
                if (this._has_page()) {
                    this.new_page();
                }
            };
        });
        this.pp.add_action(".cc", () => {
            //Map control character to
            this._state = ROFF_AWAIT_CHAR;
            this.action = (c) => {
                this._control_char = c;
            };
        });
        this.pp.add_action(".ce", () => {
            //adjust center, no fill
            this._state = ROFF_AWAIT_INT;
            this.action = (c) => {
                this.flush();
                this._adjust = ROFF_ADJUST_CENTER;
                this._fmt_lines = c;
            };
        });
        this.pp.add_action(".de", () => {
            //adjust center, no fill
            this._state = ROFF_AWAIT_MACRO;
            let mac = null;
            let mac_cmds = [];
            this.action = (m) => {
                if (m instanceof Array) {
                    m = m.join("").trim();
                }
                if (mac == null) {
                    mac = "." + m;
                    if (this.pp.has_action(mac) || !(/\.[a-z]{2,2}/g.test(mac))) {
                        console.log("BAD PARSE: " + mac)
                        this.state = ROFF_CONSUME;
                        return;
                    }
                    console.log("CREATING MACRO " + mac);
                } else if (m === "..") {
                    console.log("END OF MACRO and mac is " + mac);
                    //throw new Error("");
                    this.pp.add_action(mac, () => {
                        this._state = ROFF_SWALLOW;
                    });
                    this._state = ROFF_SWALLOW;
                } else {
                    console.log("ADDING MACRO CMD: " + m);
                    mac_cmds.push(m);
                }
            };
        });
        this.pp.add_action(".ds", () => {
            this.flush();
            this._spacing = 2;
            this._state = ROFF_SWALLOW;
            
        });
        this.pp.add_action(".ef", () => {
            this._state = ROFF_AWAIT_STRING;
            this.action = (s) => {
                this._titles.even_foot = s;
            };
        });
        this.pp.add_action(".eh", () => {
            this._state = ROFF_AWAIT_STRING;
            this.action = (s) => {
                this._titles.even_head = s;
            };
        });
        this.pp.add_action(".fi", () => {
            this.flush();
            this._fill = true;
            this._state = ROFF_SWALLOW;
        });
        this.pp.add_action(".fo", () => {
            this._state = ROFF_AWAIT_STRING;
            this.action = (s) => {
                this._titles.foot = s;
            };

        });
        this.pp.add_action(".hc", () => {
            this._state = ROFF_AWAIT_CHAR;
            this.action = (c) => {
                this._hyphen_char = c;
            };
        });
        this.pp.add_action(".he", () => {
            this._state = ROFF_AWAIT_STRING;
            this.action = (s) => {
                console.log("Setting head: "  + s);
                s = s.split("\'").filter(p => p.length > 1);
                this._titles.head = s;
            };
        });
        this.pp.add_action(".hx", () => {
            this._show_title = false;
            this._state = ROFF_SWALLOW;
        });
        this.pp.add_action(".hy", () => {
            this._state = ROFF_AWAIT_INT; //0 false, non-zero true
            this.action = (i) => {
                this._hyphenate = i != 0;
            }
        });
        this.pp.add_action(".ig", () => {
            this._state = ROFF_IGNORE_UNTIL ; //until line after line starting with ..
            this.action = (l) => {
                if (l.indexOf("..")) {
                    this._state = ROFF_SWALLOW;
                }
            };
        });
        this.pp.add_action(".in", () => {
            this.flush();
            this._state = ROFF_AWAIT_INT;
            this.action = (i) => {
                this._indent = i;
            };
        });
        this.pp.add_action(".ix", () => {
            this._state = ROFF_AWAIT_INT;
            this.action = (i) => {
                this._indent = i;
            };
        });
        this.pp.add_action(".li", () => {
            this._state = ROFF_AWAIT_INT; //treat next (n) lines as text
            this.action = (i) => {
                this.copy = i;
            };
        });
        this.pp.add_action(".ll", () => {
            this._state = ROFF_AWAIT_INT;
            this.action = (i) => {
                this._line_length = i;
            }
        });
        this.pp.add_action(".ls", () => {
            this.flush();
            this._state = ROFF_AWAIT_INT;
            this.action = (i) => {
                this._spacing = i;
            };
        });
        this.pp.add_action(".m1", () => {
            this._state = ROFF_AWAIT_INT;
            this.action = (i) => {
                this._top_padding = i;
            };
        });
        this.pp.add_action(".m2", () => {
            this._state = ROFF_AWAIT_INT;
            this.action = (i) => {
                this._title_padding = i;
            };
        });
        this.pp.add_action(".m3", () => {
            this._state = ROFF_AWAIT_INT;
            this.action = (i) => {
                this._text_padding = i;
            };
        });
        this.pp.add_action(".m4", () => {
            this._state = ROFF_AWAIT_INT;
            this.action = (i) => {
                this._foot_padding = i;
            };
        });
        this.pp.add_action(".na", () => {
            this.flush();
            this._adjust = ROFF_ADJUST_LEFT;
        });
        this.pp.add_action(".ne", () => {
            this._adjust = ROFF_AWAIT_INT;
            this.action = (i) => {
                if (i > this.available_lines) {
                    this.new_page();
                }
            };
        });
        this.pp.add_action(".nn", () => {
            this._state = ROFF_AWAIT_INT;
            this.action = (i) => {
                this._numbering_off_until =true;
                this._numbering_lines = i;
            };
        });
        this.pp.add_action(".n1", () => {
            this._line_numbers = true;
            this._number_per_page = true;
            this._state = ROFF_SWALLOW;
        });
        this.pp.add_action(".n2", () => {
            this._line_numbers = true;
            this._number_per_page = false;
            this._state = ROFF_SWALLOW;
        });
        this.pp.add_action(".ni", () => {
            this._state = ROFF_AWAIT_INT;
            this.action = (i) => {
                this._number_indent = i;
            }
        });
        this.pp.add_action(".nf", () => {
            this.flush();
            this._fill = false;
            this._state = ROFF_SWALLOW;
        });
        this.pp.add_action(".nx", () => {
            this._state = ROFF_AWAIT_STRING;
            this.action = (s) => {
                console.log("ROFF WANTS TO LOAD FILE");
            }
        });
        this.pp.add_action(".of", () => {

            this._state = ROFF_AWAIT_STRING;
            this.action = (s) => {
                this._titles.odd_foot = s;
            };
        });
        this.pp.add_action(".oh", () => {
            this._state = ROFF_AWAIT_STRING;
            this.action = (s) => {
                this._titles.odd_head = s;
            };
        });
        this.pp.add_action('.pa', () => {
            if (this._has_page) {
                this.flush();
            }
            this._state = ROFF_AWAIT_CHARS;
            this.action = (m) => {
                if (m) {
                    try {
                        let i = parseInt(m);
                        this._page = i;
                    } catch (e) {}
                }
                if (this._has_page) {
                    this.new_page();
                }
            };
        });
        this.pp.add_action('.pl', () => {
            this._state = ROFF_AWAIT_INT; //RETRO
            this.action = (i)=> {
                this._paper_length = i;
            }
        });

        this.pp.add_action('.po', () => {
            this._state = ROFF_AWAIT_INT; //GLOBAL INDENT, All lines preceed by (n) spaces
            this.action = (i) => {
                this._page_offset = i; 
            }
        });
        this.pp.add_action(".ro", () => {
            this._arabic = false; //ROMAN NUMERALS IN PAGE NUMBERS
            this._state = ROFF_SWALLOW;
        });
        this.pp.add_action(".sk", () => {
            this._state = ROFF_AWAIT_INT;
            this.action = (i) => {
                this._blank_pages = i;
            }
        });
        
        this.pp.add_action(".sp", () => {
            this.flush();
            this._state = ROFF_AWAIT_INT;
            this.action = (i) => {
                //console.log("FLUSHING " + i);
                for (;i> 0;i--) {
                    this.line_break();
                    if (this.available_lines ==0) {
                        i = 0;
                    }
                }
            };
        });
        this.pp.add_action(".ss", () => {
            this.flush();
            this._spacing = 1;
            this._state = ROFF_SWALLOW;
        });
        this.pp.add_action(".ta", () => {
            this._state = ROFF_AWAIT_INTS;
            this.action = (ts) => {
                this._tabs = ts;
            };
        });

        
        this.pp.add_action(".tc", () => {
            this._state = ROFF_AWAIT_CHAR;
            this.action = (c) => {
                this._tab_char = c;
                
            };
        });
        this.pp.add_action(".ti", () => {
            this.flush();
            this._state = ROFF_AWAIT_INT;
            this.action = (i) => {
                this._temp_indent = true;
                this._temp_indent_spaces =i;
            };
        });
        this.pp.add_action(".tr", () => {
            this.flush();
            this._state = ROFF_AWAIT_CHARS; //abcdef means a = b, c = d, e = f, so count/2 translations
            this.action = (cs) => {
                if (typeof(cs) === 'string') {
                    cs = cs.split("");
                }
                while (cs.length > 1) {
                    this._translate[cs.shift()] = cs.shift();
                }
            };
        });
        this.pp.add_action(".ul", () => {
            this._underline = true;
            this._state = ROFF_AWAIT_INT;
            this.action = (i) => {
                this._fmt_lines = i; //input lines
            };
        });
        this._lastNL = 0;
        this.pp.add_action("\n", () => {
            switch (this._state) {
                case ROFF_SWALLOW:
                    this._state = ROFF_CONSUME;
                    break;
                case ROFF_AWAIT_MACRO:
                    //AWAIT END
                    break;
            }
            this.pp.reset_position();
            //TTY.out.filter("NL: " + this._lastNL);
        });
        this.pp.add_action("\r", () => {
            switch (this._state) {
                case ROFF_SWALLOW:
                    this._state = ROFF_CONSUME;
                    break;
                case ROFF_AWAIT_MACRO:
                    //AWAIT END
                    break;
            }
            this.pp.reset_position();
            //TTY.out.filter("NL: " + this._lastNL);
        });
        
        this.pp.default = (c) => {
            switch(this.state) {
                case ROFF_AWAIT_INT:
                    c = c.join("");
                    this.action(parseInt(c.trim()));
                    break;
                case ROFF_AWAIT_CHAR:
                    c = c.join("").trim("").split("");;
                    this.action(c[0]);
                    break;
                case ROFF_AWAIT_CHARS:
                    this.action(c.join("").trim());
                    break;
                case ROFF_AWAIT_MACRO:
                    this.action(c.join("").trim());
                    return;
                case ROFF_AWAIT_INTS:
                    this.action(c.join("").trim().split(",").map(ch => parseInt(ch.trim())));
                    break;
                case ROFF_AWAIT_STRING:
                    this.action(c.join("").trim());
                    break;
                case ROFF_CONSUME:
                    if (this.copy) {
                        this.flush_direct(c);
                    } else if (this._ignored) {
                        this._ignored--;
                    } else {
                        this.add_text(c);
                    }
                    break;
                
            }
            this.action = null;
            this._state = this._ignored?ROFF_IGNORE:ROFF_CONSUME;
            if (this._state == ROFF_CONSUME && !this.copy) {
                this.pp.chunk = TTYCHUNK_WORD;
            } else if (this.copy) {
                this.pp.chunk = TTYCHUNK_LINE;
            }
            //TTY.out.filter("ROFFED: " + c.join(""));

        };
        this.pp.chunk = TTYCHUNK_WORD;
        this.pp.is_trigger = (c) => {
            if (this.pp.position == 1 && c == '.' && this._state != ROFF_AWAIT_MACRO) {
                return true;
            }
            if (this.pp.is_newline(c)) {
                this.pp.reset_position();
                this.pp.reset_trigger();
                
                return true;
            }
            return false;
        };
        //this.pp.action_trigger = '.';
        this._has_page = false;
        this.pp.separators = " \t";
    }
    get pp() {return this.preprocessor;}
    get name() {return "roff";}
    get help() {return "roff";}
    get copy() {return this._copy> 0;}
    set copy(v) {this._copy = v;}
    get ignore() {return this._ignored>0;}
    get state() {return this._state;}
    set state(v) {this._state = v;}
    get line_length() {return this._line_length;}
    set line_length(v) {this._line_length = v;}
    get indent() {
        if (this._temp_indent) {
            this._temp_indent = false;
            let t = this._temp_indent_spaces;
            this._temp_indent_spaces = 0;
            return t; 
        }
        return this._indent;
    }
    get chars_required() {
        if(this.copy || this.ignore) {
            return 0;
        }
        let cr = this._line_length - (this.buffered_length + this.indent + this._page_offset);
        //console.log("required: " + cr + "(" + this._line_length + "," + this._line_buf.length + "," + this._indent + "," + this._page_offset + ")");
        return cr;
    }
    get buffered_length() {
        let ctrl_chars = this._line_buf.filter(ch => ch == "\x1b").length*5;
        return this._line_buf.join("").length-ctrl_chars;
    }
    get header() {
        if (this._show_title) {
            let t = (this.page%2)==0?this._titles.even_head:this._titles.odd_head;
            t = t?t:this._titles.head;
            
            if (t ) {
                let pad = ((this._line_length - (t[0].length + t[2].length))/2)>>0;
                return t[0] + " ".repeat(pad) + t[1] + " ".repeat(pad) + t[2];
            }
        }
        return null;
    }
    get footer() {
        if (this._show_title) {
            let t = (this.page%2)==0?this._titles.even_foot:this._titles.odd_foot;
            t = t?t:this._titles.foot;
            if (t!=null) {
                if (t.trim()[0] == '\'') {
                    let left = t.trim().substring(1,t.trim().indexOf('\''));
                    let right = t.substring(left.length+2).indexOf('\''+1);
                    right.pop();
                    let mid = t.substring(t.indexOf('\'',2), t.indexOf('\'', left.length+4));
                    let pad = ((this.line_length - (left.length + right.length + mid.length))/2)>>0;
                    return left + " ".repeat(pad) + mid + " ".repeat(pad) + right;
                }
            }
        }
    }
    add_text(c) {
        this._line_buf = this._line_buf.filter(f => f!="\n").filter(f=> f!="\r");
        let cj = c.join("").trim();
        let tl = cj.length;
        if (tl == 0) {
            return;
        }
        if (cj.lastIndexOf("_")==cj.length-1) {
            let ct = c.filter(ch => ch = "_").length;
            let bsc = c.filter(ch => ch = "\b").length;

            let wc = c.length - (ct+bsc);
            if (wc + ct == 0) {
                let tr = c.slice(c.lastIndexOf("_")).filter(ch => ch == ' ' || ch == '\t');
                c = c.filter(ch => ch.charCodeAt(0) != 8).filter(ch => ch != '_');
                c = (ROFF_ESC_UNDERLINE + c.join("") + ROFF_ESC_RESET + tr.join("")).split();
            } else {
                //console.log("WHAT? [" + c.join("") + "]");
            }
            
        }
        if (c.join("").length > this.chars_required) {
            if (this._adjust == ROFF_ADJUST_RIGHT) {
                if (this.chars_required<0) {
                    this._line_buf = this._line_buf.toString().trim().split("");
                }
                if (this.chars_required>0) {
                    this._line_buf.unshift(..." ".repeat(this.chars_required));
                }
            } else if (this._adjust == ROFF_ADJUST_CENTER) {
                let p = ((this._line_length - this.buffered_length)/2)>>0;
                this._line_buf = [..." ".repeat(p), ...this._line_buf];
            } else {
                this._line_buf = [..." ".repeat(this.indent), ...this._line_buf];
            }
            
            this.flush();
        }
        this._line_buf.push(...c);
        this._line_buf = this._line_buf.filter(f => f!="\n").filter(f=> f!="\r");

    }
    flush_direct(c) {
        this._copy--;
        if (this.available_lines==0) {
            this.new_page();
        }
        if (c.length > 0) {
            if (typeof(c) === 'string') {
                if (c.length == 1) {
                    this.next.filter(c);
                } else {
                    c = c.split("");
                }
            }
            if (c instanceof Array) {
                while (c.length > 0) {
                    this.next.filter(c.shift());
                }
            }
            
        }
        this.line_break();
        
    }
    line_break() {
        this.next.filter("\n");
        this._consumed_lines++;
    }
    blank(i=1) {
        while (i-- > 0) {
            this.new_page();
        }
    }
    new_page() {
        if (this._has_page) {
            this.end_page();
        }
        for (let i = 0; i< this._top_padding;i++) {
            this.line_break();
        }
        let head = this.header;
        
        this.flush_direct(head?head:"\n");
        for (let i = 0; i< this._title_padding;i++) {
            this.line_break();
        }
        this._consumed_lines = 0;
        this._has_page = true;
    }
    end_page() {
        
        for (let i = 0; i< this._text_padding;i++) {
            this.line_break();
        }
        let foot = this.footer;
        this.flush_direct(foot?foot:"\n");
        
        for (let i = 0; i< this._foot_padding;i++) {
            this.line_break();
        }
        this._page++;
    }
    flush() {
        if (this.available_lines == 0 || !this._has_page) {
            this.new_page();
        }
        if (this.chars_required > 0) {
            let pad = " ".repeat(this.chars_required);
            
            if (this._adjust == ROFF_ADJUST_RIGHT) {
                this._line_buf = [...pad, ...this._line_buf];
            } else if (this._adjust == ROFF_ADJUST_CENTER) {
                pad = pad.substring(0,(pad.length/2)>>0);
                this._line_buf = [...pad, ...this._line_buf];
            }
        }
        while (this._line_buf.length > 0) {
            this.next.filter(this._line_buf.shift());
        }
        this.line_break();
    }
    get available_lines() {
        return this._paper_length - (this._consumed_lines + this.total_padding);
    }
    get total_padding() {
        return this._top_padding + this._title_padding + this._text_padding + this._foot_padding + (this._show_title?2:0);
    }
    get action() {return this._action;}
    set action(v) {
        if (v) {
            this.pp.chunk = TTYCHUNK_LINE;
            this._action = v;
        } else {
            this._action = null;
            this.pp.chunk = TTYCHUNK_WORD;
        }
    }
    
    execute(param) {
        if (param[0] == '-h') {
            return this.help;
        }
    }
}

//let app = new Roff();
//app.next = TTY.out;
//app.next = new TTYFilter();
//let r = fs.readFileSync("/Users/niklas/dev/projects/private/ultra/data/man/roff_.2").toString();
//r.split("").forEach(rc => app.pp.filter(rc));
//app.start();
//app.start();