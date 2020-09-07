/*jshint esversion:6*/
import {Shell,ShApplication} from './osi.mjs';
import {OsDir} from '../fs/dir.mjs';
export class Pwd extends ShApplication {
    constructor() {
        super();
    }
    get name(){return "pwd";}
    execute() {
        return this._sh.path;
    }
}

export class CD extends ShApplication {
    constructor() {
        super();
    }
    get help() {return "Usage: cd path-spec, use ../ to traverse backwards"};
    get name(){return "cd";}
    execute(dirname) {
        if (dirname.length == 0 || dirname[0].length == 0) {
            return "required argument missing\n" + this.help;
        } else if (dirname[0] == '-h') {
            return this.help;
        }
        let d =  OsDir.find(dirname[0]);
        if (d instanceof OsDir) {
            this._sh._path = d.fpath.length > 0? d.fpath:d.path;

            return this._sh.path;
        } else {
            return "not found";
        }

    }
}

export class LS extends ShApplication {
    
    constructor() {
        super();
    }
    get name(){return "ls";}
    execute(s) {
        if (s.length > 0) {
            if (s[0].startsWith("-")) {

            }
        }
        let d = OsDir.find(this._sh.path);
        if (d == null) {
            return "not found";
        } if (d instanceof OsDir) {
            //console.log(d._files.map(f => f.name + ":" + f.flagchars + "[" + f._flags + "]"));
            return d.ls();
        } else if (d instanceof OsFile) {
            return d.flagchars + "  " + d.name + "  " + d.size;
        }
        //return [".","..","etc","dev","tmp","bin"].join("\n");
    }
}
