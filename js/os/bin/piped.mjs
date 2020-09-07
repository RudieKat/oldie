/*jshint esversion:6*/
import { Shell,ShApplication} from './osi.mjs';
import { TTYCHUNK_LINE } from '../util/pipe.mjs';
import { TTYCHUNK_WORD } from '../util/pipe.mjs';
import { OsDir } from '../fs/dir.mjs';
import { Roff } from './roff.mjs';
export class More extends ShApplication {
    static app() {
        if (this._app == null) {
            this._app = new this();
            Shell.register(this._app.name,this._app);
        }
        return this._app;
    }
    constructor() {
        super();
        this.preprocessor.chunk = TTYCHUNK_LINE;
        this._maxlines = 20;
        this._current = 0;
        this.preprocessor.default = (c) => {
            this._current++;
            if (this._current>=this._maxlines) {
                this.preprocessor.pause();
            }
            this.next.filter(c);
        };
    }
    get name() {return "more";}
    get help() {return "more";}
    get quittable() {return true;}
    
    execute(param) {
        if (param[0] == '-h') {
            return this.help;
        }
    }
}

export class Wc extends ShApplication {
    static app() {
        if (this._app == null) {
            this._app = new this();
            Shell.register(this._app.name,this._app);
        }
        return this._app;
    }
    constructor() {
        super();
        this.preprocessor.chunk = TTYCHUNK_WORD;
        this._maxlines = 20;
        this._current = 0;
        this._words = [];
        this._lines = 1;
        this._ws = 0;
        this._pop = false;
        this.preprocessor.newline = (c) => {
            this._lines++;
            
            this._pop = true;
        };
        this.separators = " \t";
        this.preprocessor.default = (c) => {
            let trlen = c.join("").trim().length;
            if (trlen > 0) {
                this._words.push(c.join(""));
            } else {
                this._ws += c.length;
            }
        };
    }
    get name() {return "wc";}
    get help() {return "wc -clmw";}
    get lines() {return this._lines;}
    get line_break_chars() {return this._lines -1;}
    get whitespace() {return this._ws;}
    get words() {return this._words.length;}
    get chars() {return this.line_break_chars + this.whitespace + this._words.reduce((a,b) => [...a,...b]).length;}
    get mem() {return this.preprocessor.position;}
    end() {
        this.preprocessor.end();
        this.next.filter(this.words + " \t" + this.lines + "\t" +this.chars + "\t" + this.mem + "\n");
        super.end();
    }
    
    execute(param) {
        if (param[0] == '-h') {
            return this.help;
        } else {
            this.start();
        }
    }
}

export class Man extends ShApplication {
    static app() {
        if (this._app == null) {
            this._app = new this();
            Shell.register(this._app.name,this._app);
        }
        return this._app;
    }
    constructor() {
        super();
        this.preprocessor.chunk = TTYCHUNK_LINE;
        this.preprocessor.default = (c) => {
            Shell.sh().out(c.join(""));
        };
    }
    get name() {return "man";}
    get help() {return "Usage: man <topic>\nExample: man wc\n";}
    end() {
        this.preprocessor.end();
        super.end();
    }
    
    execute(param) {
        if (param.length == 0 || param[0] == '-h') {
            return this.help;
        }
        let mp = OsDir.all_file_paths().filter(p => p.indexOf("/man/")>=0 && p.indexOf(param[0])==(p.trim().length-(param[0].length +2)));
        if (mp.length == 0) {
            Shell.sh().out("No man page found for topic: " + param[0]);
        } else {
            let roff = new Roff();
            roff.line_lengh = 65;
            roff.next = this.preprocessor;
            let f = OsDir.find(mp[0]).open_read_only(roff.preprocessor);
            roff.end();
            this.end();
        }
        
    }
}



