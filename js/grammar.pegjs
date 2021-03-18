

Systen = LineComment* ConstantsBlock? DiskIOBlock? BufferBlock? DataBlock? Expression {return cpu.process();}
LineComment
 = head: _ Comment? _ [\n\r] { LineAware.line++;}
DiskIOBlock
 = head:_".diskio" _ EOL* (FileEntry EOL LineComment*)_
BufferBlock
 = head:_".buffer" _ EOL* (BufferEntry EOL LineComment*)*_
DataBlock
 = head:_".data" _ EOL LineComment* (DataEntry EOL LineComment*)*_ 
ConstantsBlock
 = head:_".const" _ EOL* (ConstantsEntry EOL LineComment*)*_


FileEntry
 = _ symbol:".file" _ "'" file: ([^\']*) _ "'"  _ EOL
        size: DataEntry EOL open: DataEntry EOL  read: InputSymbol EOL write: DataEntry EOL {
          return new DiskIO(new IOFile(file.join("")),size,open, read,write);
        }
ConstantsEntry
 = _ symbol:Symbol _ int:Integer {return new Constant(symbol,int);}
InputSymbol
 = _ symbol:".read" _ int:Integer {return new InputSymbol("read",int);}
DataEntry
 = _ symbol:Symbol _ int:Integer {return new Symbol(symbol,int);}
BufferEntry
 = _ symbol:Symbol _ values: (IntegerBuffer / StringBuffer ) {return new SymbolBuffer(symbol,values);}
Symbol "symbol"
 = "."  ss:SymbolString {return ss}
Expression "expression"
 = (head: _ (Label / Add / Sav / JCZ / Nand / Comment) tail: _ LineComment* EOL*)* {return cpu;}
Add
 = head: _ "add" _ tail: (DirectNumber / IndirectNumber / SymbolNumber)_ {return Operation.ADD(tail);}
Sav
 = head: _ "sav" _ tail: (DirectNumber / IndirectNumber /SymbolNumber)_ {return Operation.SAV(tail);}
Nand
 = head: _ "nand"_ tail: (DirectNumber / IndirectNumber / SymbolNumber)_ {return Operation.NAND(tail);}
JCZ
 = head: _ "jcz" _ tail: (DirectNumber / IndirectNumber / SymbolNumber)_  {return Operation.JCZ(tail);}


Label
  = head: _([a-z_][a-z0-9_]*)":" tail: _  {return new Label(text().trim().split("").reverse().slice(1).reverse().join(""));}
DirectNumber "direct"
 = _ [$]? int: Integer { return Value.create(Value.DIRECT,int); }
IndirectNumber "indirect"
 = _ "%" int: Integer { return Value.create(Value.INDIRECT,int);}
 SymbolNumber "symbolic"
 = _ ss: SymbolString {return Value.create(Value.SYMBOL,ss);}
Register "register"
 = _"%" _([R|A|I]) {return Value.create(Value.INDIRECT,text().trim().substring(1));}
SymbolString "symbol_string"
 = ([a-zA-Z_]) ([a-zA-Z_0-9]*) {return text().trim();}
 StringBuffer 'strbuf'
  = _ '\'' values: ([^\'])* '\'' {
    values = values.join("").replace(/\\([nte0])/gi,function (a,t) {
        switch(t) {
          case 'n':
            return '\n';
          case 'e':
            return '\x1b';
          case 't':
            return '\t';
          case '0':
            return '\0';
          /*case 'x':
          case 'X':
            return '\x';
          case 'u':
          case 'U':
            return '\u';*/
        }
        return t;
      });
    console.log(values);
    
     

    return values.split("").map(c => c.charCodeAt(0));}
IntegerBuffer "intbuf"
  = _? head: '\[' values: (_? ','? _? Integer)* _? tail: '\]' {
    console.log(head);
    console.log(values);
    console.log(tail);
    return values;
    }

Integer "integer"
  = _  int:(Base10Integer / Base16Integer /Zero) {return int;}
Zero "zero"
 = "0" {return 0;}
Base10Integer "b10" 
  =([1-9] [0-9]*) { return parseInt(text(), 10); }
Base16Integer "b16"
 = "0x"([0-9a-fA-F]*) { return parseInt(text(),16);}
_ "whitespace"
  = TabSpace 

TabSpace "tabspace"
 = [ \t]*
 Comment "comment"
 = [\;] _ [^\n]*
EOL "eol"
 = _  comment: Comment? end: [\n\r] {
   let l = end.split("").filter(t => t == '\n').length;
   LineAware.line+=l;
 }

 