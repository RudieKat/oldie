.const
    .one 1
    .zero 0
    .max 0xFFFF
    .neg_one 0xfffe
    .opmask 0xC000
    .addmask 0x3FFF
    .op_nand 0
    .op_add 0x4000
    .op_sav 0x8000
    .op_jcz 0xC000
    .dec_op_add 0x3FFE
.data
    .tmpa 0
    .tmpb 0x1024
    .tmpc 0x0abc
    .stackp 0x1e
    .sp0 0
    .sp1 0
    .sp2 0
    .sp3 0
    .sp4 0
    .sp5 0
    .sp6 0
    .sp7 0
    .sp8 0
    .sp9 0
    .spa 0
    .spb 0
    .spc 0
    .spd 0
    .spe 0
    .spf 0
;increment (which means decrement) the stack pointer
push: ;store the value in R as the return
add op_jcz
sav tmpa
nand zero
nand max
add stackp
add max
sav stackp
add op_sav
sav 0x26
nand zero
nand max
add tmpb
sav tmpb
jcz tmpa
pop:
add op_jcz
sav end
nand zero
nand max
add stackp
add one
sav stackp
add dec_op_add
sav pop_read
nand zero
nand max
popread:
add 0
popend:
jcz 0