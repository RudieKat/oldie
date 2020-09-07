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
    .tmpa 0x0
    .tmpb 0x1024
    .tmpc 0x0
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

push: 
add op_jcz
sav pushret
nand zero
nand max
add stackp
add max
sav stackp
add op_sav
sav 0x2b
nand zero
nand max
add 0xc
sav 0xc
pushret:
jcz push

