/*jshint esversion: 6*/

export class LineAware {
    constructor() {
        this._line = LineAware.line;
        LineAware.lines.push(this);
    }
    get declaration() {return true;}
    get line(){return this._line;}
}
export const Hexer16 = (v) => {
    let s =  Hexer8(v >> 8) + Hexer8(v&0xFF);
    return s;
};
export const Binary16 = (v) => {
    let s = Binary4(v>>12) + " " + Binary4((v&0xF00)>>8) + " " +
             Binary4((v&0xF0)>>4) + " " + Binary4(v&0xF);
    return s;
};
export const Binary4 = (v) => {
    let s= v.toString(2);
    return "0".repeat(4-s.length) + s;
};
export const Hexer8 = (v) => {
    let s = v.toString(16);
    return (s.length ==1?"0":"") + s;
};
LineAware.lines = [];
LineAware.reset = () => {
    LineAware.lines.length = 0;
    LineAware.line = 0;
};
LineAware.memoryAddress = (i) => {
    let l = LineAware.lines.filter(line => line.line == i);
    if (l && l.length >0) {
        return l[0].declaration?l[0].address:l[0].translated_opno;
    }
    return -1;
};

LineAware.line = 0;
