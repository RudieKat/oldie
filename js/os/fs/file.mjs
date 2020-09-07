/*jshint esversion:6*/
import * as fs from 'fs';

export const OSF_EXECUTABLE = 1;
export const OSF_READABLE = 2;
export const OSF_WRITABLE = 4;
export const OSF_WRITEABLE = 4;
export const OSF_HIDDEN=8;
export const OSF_USER=32;
export const OSF_SYSTEM=64;
export class OsFile {
    constructor(name,flags) {
        this._flags = flags || 0;
        if (flags == undefined) {
            this.readable = true;
            this._flags+=OSF_SYSTEM;
        }
        this._name = name;
        this._size = 128;
        this._fpath = null;
    }
    get fpath() {return this._fpath;}
    set size(v) {this._size = size;}
    get size() {return this.accessible && this.visible ? this._size:0;}
    get name() {return this.accessible && this.visible ? this._name:null;}
    set name(n) { if (this.accessible && this.writable && this.visible) {this._name = n;}}
    dir(d) {
        this._fpath = d.fpath + "/" + this._name;
        return {set_flag:(f) => {
            if ((this._flags&f)==0) {
                this._flags+=f;
            }
        },name:this.name,hide:this.hide,secure:this.secure};
        
    }
    hide() {
        if (!this.hidden) {
            this._flags+=OSF_HIDDEN;
        }
    }
    secure() {
        if (this.accessible) {
            this.chown();
        }
    }
    get visible() {
        return !this.check(OSF_HIDDEN);
    }
    get accessible() {
        return this.check(OSF_USER) || (this.visible && (this.readable||this.execute));
    }
    chown() {
        if (this._flags&OSF_SYSTEM) {
            this._flag-=OSF_SYSTEM;
            this._flag+=OSF_USER;
        } else if (this._flag&OSF_USER) {
            this._flag+=OSF_SYSTEM;
            this._flag-=OSF_USER;
        } else {
            let mul = 1 + Math.round(Math.random());
            this._flag+=OSF_USER*mul;
        }
    }
    check(f) {return (this._flags&f) > 0;}
    get executable() {return this.check(OSF_EXECUTABLE);}
    get readable() {return this.check(OSF_READABLE);}
    get writable() {return this.check(OSF_WRITABLE);}
    set executable(v) {
        if (this.accessible) {
            this._flags|=OSF_EXECUTABLE;
        }
    }
    set readable(v) {
        if (this.accessible) {
            this._flags|=OSF_READABLE;
        }
    }
    set writable(v) {
        if (this.accessible) {
            this._flags|=OSF_WRITABLE;
        }
    }
    get flagchars() {
        return (this.visible?"A":"H") + (this.executable?"X":"-") + (this.readable?"R":"-")+(this.writable?"W":"-");
    }
}

export class FsBackedFile extends OsFile {
    constructor(name,fspath,flags) {
        super(name,flags);
        this._fspath = fspath;
        this._fd = null;
    }
    open_read_only(pipe) {
        if (this._fd == null) {
            this._fd = fs.readFileSync(this._fspath).toString().split("");
        }
        while (this._fd.length > 0) {
            pipe.filter(this._fd.shift());
        }
    }
}