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
    .t=4000
    .b=1
    .c=50

loop:
add b
sav $0x30
add b
sav $0x31
add t
sav $50

