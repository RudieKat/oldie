/*jshint esversion:6*/
//import rl from 'readline-sync';
import { ShApplication } from './bin/osi.mjs';
import  {OsDir} from './fs/dir.mjs';
import {OsFile, FsBackedFile, OSF_READABLE, OSF_WRITEABLE, OSF_HIDDEN, OSF_SYSTEM, OSF_EXECUTABLE, OSF_USER} from './fs/file.mjs';

import {TTYTrap} from './util/autocomp.mjs';
import {InitBin} from './bin/index.mjs';



OsDir.root();
let man = new OsDir("man");
let man1 = new OsDir("man1",man);
man1.addFile(new FsBackedFile("wc.1", "/Users/niklas/dev/projects/private/ultra/data/man/wc.1",OSF_READABLE + OSF_SYSTEM));
man1.addFile(new FsBackedFile("cat.1", "/Users/niklas/dev/projects/private/ultra/data/man/cat.1",OSF_READABLE + OSF_SYSTEM));
man1.addFile(new FsBackedFile("echo.1", "/Users/niklas/dev/projects/private/ultra/data/man/echo.1",OSF_READABLE + OSF_SYSTEM));
man1.addFile(new FsBackedFile("man.1", "/Users/niklas/dev/projects/private/ultra/data/man/man.1",OSF_READABLE + OSF_SYSTEM));
man1.addFile(new FsBackedFile("roff.1", "/Users/niklas/dev/projects/private/ultra/data/man/roff.1",OSF_READABLE + OSF_SYSTEM));
man1.addFile(new FsBackedFile("crypt.1", "/Users/niklas/dev/projects/private/ultra/data/man/crypt.1",OSF_READABLE + OSF_SYSTEM));
man1.addFile(new FsBackedFile("chdir.1", "/Users/niklas/dev/projects/private/ultra/data/man/chdir.1",OSF_READABLE + OSF_SYSTEM));
man1.addFile(new FsBackedFile("date.1", "/Users/niklas/dev/projects/private/ultra/data/man/date.1",OSF_READABLE + OSF_SYSTEM));
man1.addFile(new FsBackedFile("exit.1", "/Users/niklas/dev/projects/private/ultra/data/man/exit.1",OSF_READABLE + OSF_SYSTEM));


let tmp = new OsDir("tmp");
tmp.addFile(new OsFile("sys.log",OSF_READABLE + OSF_SYSTEM));
tmp.addFile(new OsFile("sec.log",OSF_HIDDEN + OSF_SYSTEM));
tmp.addFile(new OsFile("accss.log",OSF_READABLE + OSF_SYSTEM));
new OsDir("mk",tmp);
new OsDir("etc");
new OsDir("var");
new OsDir("bin");



class Completer {
    constructor(sh) {
        this._commands = [];
        this._sh = sh;
        this._results = null;
        this._multi = false;
    }
    get sh() {return this._sh;}
    update() {
        let k = null;
        for (k in Shell.applications) {
            this._commands.push(k);
        }
    }
    get multi() {return this._results!=null && this._results.length >1;}
    get next() {
        if (this.multi) {
            this._results.push(this._results.shift());
            return this._results[this._results.length-1];
        }
        return null;
    }
    complete_cmd(b) {
        //onsole.log("Completing " +  b);
        let f = this._commands.filter(c => c.indexOf(b) == 0);
        if (f.length == 1) {
            return f[0];
        } else if (f.length == 0) {
            console.log("No match in " + this._commands.join(","));
            return null;
        }
        this._multi = true;
        f.sort((a,b) => a.length-b.length);
        this._results = f;
        return this.next;
    }
    complete_path(path,allowFile) {
        this._results = null;
        if (!path.startsWith("/")) {
            path = this.sh.path + "/" + path;
        }
        if (path.endsWith("/")) {
            return null;
        }
        let m = path.substring(path.lastIndexOf("/")+1);
        path = path.substring(0,path.lastIndexOf("/"));
        let t = OsDir.find(path);
        if (t instanceof OsDir) {
            let m = t.list().filter(f => f.name.startsWith(m)).map(f => path + "/" + f.name);
            if (m.length == 1 && allowFile) {
                return m[0];
            } else if (m.length == 1) {
                if (OsDir.find(path + "/" + m[0]) instanceof OsDir)  {
                    return path + "/" + m[0];
                }
                return null;
            } else if (m.length > 1) {
                this._results = m;
                return this.next;
            }
        } else {
            return null;
        }
    }
}



export class Shell {
    static sh() {
        if (Shell._sh==null) {
            Shell._sh = new Shell();
            //InitBin();
        }   
        return Shell._sh;
    }
    static register(name,app) {
        Shell.applications[name] = app;
    }
    static locate(name) {
        return Shell.applications[name];
    }
    static all_commands() {
        let k = null;
        let keys = [];
        for(k in Shell.applications) {
            keys.push(k);
        }
        return keys;
    }
    constructor() {
        //super();
        this._history = [];
        this._history_max = 100;
        this._applications = {};
        this._datetime = new Date();
        this._datetime.setFullYear(1977,2,21);
        this._running = false;
        this._path = "/";
        this._ac = new TTYTrap(this,"ULTRA~> ");
    }
    get datetime() {return this._datetime;}
    set datetime(v) {this._datetime = v;}
    get running() {return this._running;}
    get path() {return this._path;}
    out(s) {
        if (typeof(s) == 'object') {
            if (s instanceof Array) {
                s.forEach(st => this._ac.out.write_line(st));
                //s = s.join("\n");
            }
        } else if (typeof(s) === 'string') {
            this._ac.out.write_line(s);
        }
    }
    start() {
        if (!this.running) {
            this._running = true;
            //rl.setDefaultOptions({prompt:'$ULTRA>>'})
            this.out("-".repeat(80));
            this.out(" ".repeat(25) + "ULTRA-16 E.E.E. (C) 1973");
            this.out("=".repeat(80));
            this.out(" ".repeat(18) +   "UNAUTHORIZED ACCESS STRICTLY PROHIBITED");
            this.out("-".repeat(80));
            this._ac.on();
            let th = setInterval(() => {
                if (!this.running) {
                    clearInterval(th);
                    process.exit();
                }
            },30);
            //process.stdin.resume();
            //this.exec();
        }
    }
    end() {
        this._running = false;
        
        this._ac.out.write("\n[SESSION ENDED]\n");
    }
    execute_ttycmd(c) {
        this._ac.off();
        if (c.name && Shell.locate(c.name)) {
            let p = c.params;
            this.out(Shell.locate(c.name).execute(p));
            
        } else if (c.name && c.name.length > 0) {
            this.out("not found");
            
        } else {
            this.out("No name on path: " + c.name);
        }
        this._ac.on();
    }
    execute(s) {
        this._history.unshift(s);
        if (this._history.length >= this._history_max) {
            while (this._history_max.length >= this._history_max) {
                this._history.pop();
            }
        }
        s = s.split(" ");
        if (s[0].length > 0 && Shell.locate(s[0])) {
            let app = s.shift();
            this.out(Shell.locate(app).execute(s));
            this.prompt();
        } else if (s[0].length > 0) {
            this.out("not found");
        }
    }

}
export class OSApplication {
    constructor() {

    }
}
Shell.applications = {};
Shell.sh();
InitBin();
Shell.sh().start();


//const sh = Shell.sh();
//sh.start();

