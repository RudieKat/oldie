; Unmutable
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
    .k 100
    .reserve_mutable 0x20
; Mutable variables
.data
    .tmp 0x0
    .tmpb 0x0
; MAIN
add max
sav end
main:
	nand zero
    nand max
    add one
    add tmp
    sav tmp
    jcz main
    nand zero
    nand max
    sav tmp
    add tmpb
    add k
    sav tmpb
    jcz main
end:
; END

        