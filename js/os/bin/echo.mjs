/*jshint esversion:6*/

import {Shell, ShApplication} from './osi.mjs';

export class Echo extends ShApplication {
    constructor() {
        super();

    }
    get name() {return "echo";}
    get help() {return "Usage: echo <param1> <param2>....."}
    execute(param) {
        if (param.length >0 && param[0] == '-h') {
            return this.help;
        } else {
            return param.join(" ");
        }
    }
}

export class ShDate extends ShApplication {
    constructor() {
        super();
    }
    get name() {return "date";}
    get help() {return "Usage: date is used to display or set the date and time on the system\n" + 
                    "Example: date <NO PARAMETERS> - displays the current date\nExample: date mmddhhmm[yy] sets the date to Month Day In month Hour Minutes [Year optional]";}
    execute(param) {
        if (param.length == 0) {
            
            return Shell.sh().datetime.toLocaleDateString("en-US")  + " " + Shell.sh().datetime.toLocaleTimeString("en-US");
        } else if (param.length == 1 && param[0] === '-h') {
            return this.help;
        } else if (param.length == 1 && (param[0].length == 8 || param[0].length == 10) && /[0-9]{8,10}/g.test(param[0])) {
            param[0] = param[0].split("");
            let month = parseInt(param.shift(2).join(""));
            let day = parseInt(param.shift(2).join(""));
            let hour = parseInt(param.shift(2).join(""));
            let minute = parseInt(param.shift(2).join(""));
            let d = Shell.sh().datetime;
            month = Math.min(11, Math.max(month-1,0));
            day = Math.min(30, Math.max(0,day-1));
            hour = Math.min(23, Math.max(0,hour));
            minute  = Math.min(59, Math.max(0,minute));
            year = 1970 + (param.length == 2?parseInt(param.shift(2).join("")):7);
            
            d.setFullYear(1977,month, day);
            Shell.sh().datetime = d;
            return this.execute([]);
        }
    }
}

export class ShExit extends ShApplication {
    constructor() {
        super();
    }
    get name() {return "exit";}
    get help() {return "Terminates the current command file or login session";}

    execute() {
        Shell.sh().end();
    }
}