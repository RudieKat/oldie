/*jshint esversion:6*/
import {TTYBoundProcess} from '../util/pipe.mjs';
import {Shell,OSApplication} from '../sh.mjs';

export {Shell,TTYBoundProcess};
export class ShApplication extends TTYBoundProcess {
    static app() {
        if (this._app == null) {
            this._app = new this();
            Shell.register(this._app.name,this._app);
        }
        return this._app;
    }
    constructor() {
        super("");
    }
     
    get _sh() {return Shell.sh();}
    
    get name() {throw new Exception("Implement name");}
    execute() {
        return "NOT IMPLEMENTED";
    }
}
