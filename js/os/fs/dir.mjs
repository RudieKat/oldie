/*jshint esversion:6*/
import {Shell} from '../sh.mjs';
export class OsDir {
    static root() {
        if (OsDir._root == null) {
            OsDir._root = new OsDir("/",null);
            OsDir.dirs.push(OsDir._root);
        }
        return OsDir._root;
    }
    static find(p) {
        if (p==="/") {
            
            return OsDir.root();
        } else if (p[0] != "/") {
            p = Shell.sh().path+ "/" + p;
        }
        
        return OsDir.root().locate(p.substring(1).split("/"));
    }
    static all_dir_paths() {
        return this.dirs.map(d => d.fpath + "/");
    }
    static all_file_paths(){
        return this.dirs.map(d => d.files.map(f => d.fpath + "/" + f.name )).reduce((a,b) => [...a, ...b]);
    } 
    
    constructor(name,parent) {
        this._name = name;
        this._parent = parent || OsDir._root;
        this._dir = [];
        this._files = [];
        this._file_rights = [];
        this._secure = false;
        this._hide = false;
        if (this._parent) {
            this._parent.addDirectory(this);
        }
    }
    locate(path) {
        if (path.length == 0) {
            return this;
        }else if (path[0].trim().length ==0) {
            return this.locate(path.slice(1));
        }
        if (path.length > 0 && path[0].trim().length > 0) {
            if (this._dir.filter(d => d.name == path[0]).length > 0) {
                return this._dir.filter(d => d.name==path[0])[0].locate(path.slice(1));
            } else if (this._files.filter(f => f.name == path[0]).length > 0 && path.length == 1) {
                return this._files.filter(f => f.name==path[0])[0];
            } else if (path[0] == '..') {
                return this.parent.locate(path.slice(1));
            } else if (path[0] == '.') {
                return this.locate(path.slice(1));
            }
            return null;
        }
        return this;
    }
    set secure(v) {this._secure = true;}
    get secure() {return this._secure;}
    set hide(v) {this._hide = true;}
    get hide() {return this._hide;}
    get parent() {return this._parent?this._parent:OsDir.root();}
    get is_root() {return this.parent === this;}
    get name() {return this._name;}
    get path() {return this.name;}
    get fpath() {return this.is_root?"":this.parent.fpath + "/" + this.name;}
    get files() {return this._files;}
    addDirectory(d) {
        this._dir.push(d);
        OsDir.dirs.push(d);
    }
    addFile(f) {
        this._files.push(f);
        this._file_rights.push(f.dir(this));
        if (this.hide) {
            f.hide();
        }
        if (this.secure) {
            f.secure();
        }
        
    }
    ls() {
        return ['.','..',...this._dir.map(d => d.name),...this._files.map(f => f.name).filter(f => f != null)];
    }
}
OsDir.dirs = [];
OsDir.files = [];