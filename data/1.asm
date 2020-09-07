.const
    .one=1
    .zero=0
    .max=0xFFFF
    .opmask=0xC000
    .addmask=0x3FFF
    .op_nand=0
    .op_add=0x4000
    .op_sav=0x8000
    .op_jcz=0xC000
.data
    .a=0
add one
sav $0x20
nand zero
sav $0x21
nand max
sav $0x22
nand zero
sav $0x23