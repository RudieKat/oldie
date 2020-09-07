.const
    .one=1
    .zero=0
    .op_nand=0
    .op_add=0x4000
    .op_sav=0x8000
    .op_jcz=0xC000
.data
    .hex_f=0xf
    .hex_ff=0xff
    .max=0xffff
    .adress=0xcfff
init:
add hex_ff
sav $20
jcz init