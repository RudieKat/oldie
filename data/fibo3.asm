.const
    .zero 0
    .one 1
    .max 0xffff
.data
    .volV 0
    .volA 0x8020
add max
sav 0x10
loop:
nand zero
nand max
add 0x4
add one
sav 0x4
sav 0x19
add 0x5
sav 0xc
jcz loop