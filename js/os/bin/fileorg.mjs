/*jshint esversion:6*/
import { Shell,ShApplication } from "./osi.mjs";
import {OsDir} from '../fs/dir.mjs';
import { OsFile } from "../fs/file.mjs";

export class MkDir extends ShApplication {
    static app() {
        if (MkDir._app == null) {
            MkDir._app = new MkDir();
            Shell.register("mkdir",MkDir._app);
        }
        return MkDir._app;
    }
    constructor() {
        super();
    }
    execute(param) {
        if (param.length != 1 || param[0] == undefined || param[0].trim().length < 2) {
            return "Error";
        } else {
            param = param[0];
            if (param && param.indexOf("/") > 0) {
                let dirname = param.substring(param.lastIndexOf("/")+1);
                let pp = param.substring(0,param.lastIndexOf("/"));
                let par = OsDir.find(pp);
                if (par instanceof OsDir) {
                    new OsDir(dirname,par);
                    return "Created";
                }
            } else {
                let dirname = param;
                let par = OsDir.find(Shell.sh()._path);
                new OsDir(dirname,par);
                return "Created";
            }
            
        }
    }
}

export class Create extends ShApplication {
    static app() {
        if (this._app == null) {
            this._app = new this();
            Shell.register(this._app.name,this._app);
        }
        return this._app;
    }
    constructor() {
        super();
    }
    get name() {return "create";}
    get help() {return "> Create directory or file.\n=======\n> To create a directory: create <path spec>\n" + 
                    "Example: create ./tmp/comsat\n To create a file: create -alloc <blocks> <filespec>\n" + 
                    "Example: create -alloc 4 ./tmp/comsat/inf.txt\nBlock size is 64 words.";}
    
    execute(param) {
        if (param[0] == '-h') {
            return this.help;
        }
        if (param[0] === "-alloc" && param.length == 3) {
            //create file
            try {
                let blockSize = parseInt(param[1]);
                let file = param[2];
                let dir = file.indexOf('/')>=0?file.substring(0,file.lastIndexOf('/')):this._sh.path;
                file = file.indexOf("/")>0?file.substring(file.lastIndexOf("/")):file;
                if (dir.length==1 && dir == '/') {
                    dir = OsDir.root();
                    new OsFile(file,dir);
                } else {
                    dir = OsDir.root().find(dir);
                    if (dir && dir instanceof OsDir) {
                        new OsFile(file,dir);
                    } else if (dir == null) {
                        return "dir not found";
                    } else if (!(dir instanceof OsDir)) {
                        return "target not a directory";
                    }
                }
            } catch (e) {
                return "error: " + e;
            }
        } else {
            param = param[0];
            if (param == null  || param.trim().length <2  || param.trim.length > 6 ) {
                return "invalid name: " + (param == null? "NULL":param);
            }
            if (param && param.indexOf("/") > 0) {
                let dirname = param.substring(param.lastIndexOf("/")+1);
                let pp = param.substring(0,param.lastIndexOf("/"));
                let par = OsDir.find(pp);
                if (par instanceof OsDir) {
                    new OsDir(dirname,par);
                    return "created " + par.fpath + "/" + dirname;
                }
            } else {
                let dirname = param;
                let par = OsDir.find(Shell.sh()._path);
                new OsDir(dirname,par);
                return "created " + par.fpath + "/" + dirname;
            }
            
        }
    }
}
