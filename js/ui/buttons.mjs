/*jshint esversion:6*/
import {Hexer16,Binary16} from '../cpu/common.mjs';
export class ControlButton {
    constructor(name, action,visible,toggle) {
        this._show = visible;
        this._toggle = toggle;
        this._state = false;
        this._name = name;
        this._active = false;
        this._label = this._name;
        this._action = action;
        this._el = document.createElement("button");
        this._el.onclick = () => {this._action();}
        this._el.innerHTML = "<strong>" + this._name + "</strong>";
        this._el.style.display=this.visibility;
    }
    get name() {return this._name;}
    get visibility() {return this._show?"inline-block":"hidden"}
    set visibility(v) {
        this._show = v;
        this._el.style.display=this.visibility;
    }
    get element() {return this._el;}

    set toggle(t) {this._toggle = true;}
    get toggle() {return this._toggle;}
    toggle_state() {this._state = !this._state;}
    get state() {return this._state;}
    push() {
        if (this.inactive) {
            return;
        }
        if (this.toggle) {
            this.toggle_state();
        } else {
            if (this._action) {
                this._action();
            }
        }
    }
    
}

export class ValueDisplay {
    constructor(name,count) {
        this._count = count||1;
        this._name = name;
        this._visible = false;
        this._values = [];
        this._decimal = true;
    }
    add(v) {
        if (!this._decimal) {
            v = Hexer16(v);
        }
        this._values.unshift(v);
        if (this._values.length> this._count) {
            this._values.pop();
        }
    }
    get display() {
        return this._name + ": "  + this._values.join(",");
    }

}