
export class MMapFile {
    constructor(memOffset,length, filename) {
        let xhr = new XMLHttpRequest();
        this._data = [];
        this._memOffset = memOffset;
        this._length = length;
        xhr.open("GET", filename);
        xhr.onload = (ev) => {
            if (ev.response.statusCode === 200) {
                this._data = ev.response.text.split("").map(c => c.codePointAt(0));
                this._length = this._data.length;
            }
        }
    }

}