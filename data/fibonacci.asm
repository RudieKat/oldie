.const
    .one 1
    .zero 0
    .max 0xFFFF
    .opmask 0xC000
    .addmask 0x3FFF
    .op_nand 0
    .op_add 0x4000
    .op_sav 0x8000
    .op_jcz 0xC000
.data
    .k 1009x0
    .a 0x30
    .b 0x31
    .tmp1 0
    .tmp2 1
add one
sav $0x29  
loop:
nand zero
nand max
add $0x28
add $0x29
sav $0x2A
nand zero
nand max
add $0x13
sav $0x12
add one
sav $0x13
nand zero
nand max
add $0x14
add one
sav $0x14
jcz loop

