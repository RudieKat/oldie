/*jshint esversion:6*/
import {ShApplication} from './osi.mjs';
import {Pwd,CD,LS} from './path.mjs';
import {MkDir,Create} from './fileorg.mjs';
import { Roff } from './roff.mjs';
import { Wc } from './piped.mjs';
import { More } from './piped.mjs';
import { Man } from './piped.mjs';
import { Echo } from './echo.mjs';
import { ShDate } from './echo.mjs';
import { ShExit } from './echo.mjs';

export {ShApplication,Pwd,CD,LS,Create,MkDir};
export const InitBin = () => {
    Pwd.app();
    CD.app();
    LS.app();
    MkDir.app();
    Create.app();
    Roff.app();
    Wc.app();
    More.app();
    Man.app();
    Echo.app();
    ShDate.app();
    ShExit.app();
}