/*jshint esversion: 6*/
import {LineAware} from './common.mjs';
import {Operation} from './op.mjs';
import {Register} from './cpu.mjs';
export class Label extends LineAware {
    constructor(l) {
        super();
        this._label = l;
        this._opno = Operation.PEEKNO();
        Label.register(this);
        LineAware.lines.splice(LineAware.lines.indexOf(this),1);
    }
    get name() {return this._label;}
    get opno() {return this._opno;}
    /*get op() {return this._op;}
    set op(v) {this._op = v;}*/
    get value() {return Register.I.value + this.opno;}
    get address() {return Register.I.value + this.opno;}
}
Label.currentLabel = null;
Label.current = (op) => {
    if (Label.currentLabel) {
        op.label = Label.currentLabel;
        op.label.op = op;
        Label.currentLabel = null;
    }
};

Label.reg = new Map();
Label.register = (r) => {
    if (Label.reg.get(r.name) != null) {
        throw new Error("Label already exists");
    }
    Label.reg.set(r.name,r);
    //Label.currentLabel = r;
};
Label.reset = () => {
    Label.reg.clear();
};
Label.resolve = (n) => {
    let lbl = Label.reg.get(n);
    //console.log(lbl);
    return lbl;
};
