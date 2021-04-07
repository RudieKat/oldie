/*jshint esversion:6*/

export class FileManager {
    constructor(rootPath) {
        this._root = rootPath || "__fm";
        this._files = localStorage.getItem(this._root);
        this._files = this._files;
        if (this._files && typeof(this._files) === 'string') {
            this._files = JSON.parse(this._files);
        } else {
            this._files = {
                path:"",
                filename:this._root,
                dirty:true,
                created:new Date().toUTCString(),
                files:{}
            };
        }
        this.save();
    }
    get dirty() {return this._files.dirty;}
    create(dir,name) {
        if (dir) {
            return new Directory();
        }
    }
    save() {
        if (this._files.dirty) {
            localStorage.setItem(this._root,JSON.stringify(this._files));
        }
    }
    get list() {
        let k = null;
        let v = [];
        for (k in this._files.files) {
            if (this._files.files[k]) {
                v.push(this._files.files[k]);
            } else {
                delete this._files.files[k];
                this._files.dirty = true;
            }
        }
        this.save();
        return v;
    }
    
    addFile(name,data) {
        let id = uuid();
        localStorage.setItem(id,data);
        let d = new Date();
        this._files.files[id] = {id:id,created:d.toLocaleDateString() + " " + d.toLocaleTimeString() ,name:name};
        this._files.files[id].updated = this._files.files[id].created;
        this._files.dirty = true;
        this.save();
        return this._files.files[id];
    }
    update(id,data) {
        localStorage.setItem(id,data);
        let d = new Date();
        this._files.files[id].updated = d.toLocaleDateString() + " " + d.toLocaleTimeString();
        this._files.dirty = true;
        this.save();
        return this._files.files[id];
    }
    remove(id) {
        localStorage.setItem(id,null);
        delete this._files.files[id];
        this._files.dirty = true;
        this.save();
    }
}
export const fm = new FileManager();
class FSReplacement {
    constructor() {

    }
    convertName(name) {
        return name.substring(name.lastIndexOf("/")+1,name.length);
    }
    existsSync(name) {
        return localStorage.getItem(this.convertName(name)) != null;
    }
    writeFileSync(name,data) {
        localStorage.setItem(this.convertName(name), btoa(data.map(b => String.fromCharCode(b)).join("")));
    }
    readFileSync(name) {
        if (!this.existsSync(name)) {
            return [];//throw new Error("NO SUCH FILE");
        }
        return atob(localStorage.getItem(this.convertName(name))).split("").map(b => b.codePointAt(0));
    }
}
export const fs = new FSReplacement();
class File {
    constructor(path,filename) {
        this._name = filename || path;
        this._path = (path && filename)?path:'';
        
    }
    get name() {return this._name;}
    get path() {return this._path;}
    get dir() {return false;}

}
class Directory extends File {
    constructor(path,filename,data) {
        super(path,filename);
        this._data = data || {path:this.path || '',dirty:true};
        if (this._data && typeof(this._data) === 'string') {
            this._data = JSON.stringify(this._data);
        } else {
            this._data = {
                path:this.path,
                dirty:true,
                name:this.name,
                created:new Date().getTime(),
                files:{}
            };
        }

    }
    get dirty() {return true;}
    add(f) {
        
    }
    
}

function rnd(rnds) {
    rnds = rnds  || 16;
    if (typeof(rnds) === 'number') {
        rnds = new Uint8Array(rnds);
    }
    for (let i = 0, r; i < rnds.length; i++) {
        if ((i & 0x03) === 0) {
            r = Math.random() * 0x100000000;
        }
        rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
    }
    return rnds;
}
function uuid() {
    let rb = rnd();
    let ch = [];
    for (let i = 0; i < rb.length;i++) {
        ch.push(rb[i].toString(16));
    }
    //XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
    return ch.slice(0,4).join("") + "-" + ch.slice(4,6).join("") + "-" + 
        ch.slice(6,8).join("") + "-" + ch.slice(8,10).join("") + "-" + 
        ch.slice(10,16).join("");
}