.data
    .zero 0
    .max 0xFFFF
    .one 1
    .savstep 0x4001
add one
loop:
add 0x17
add 0x18
sav 0x19
nand zero
nand max
add 0x6
sav 0x5
add one
sav 0x6
add savstep
sav 0x7
nand zero
nand max
jcz loop

