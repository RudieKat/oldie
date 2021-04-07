    ; Unmutable
    .const
        .zero 0
        .one 1
        .two 2
        .three 3
        .four 4
        .five 5
        .six 6
        .seven 7
        .sixteen 16
        .not_sixteen 0xFFEF
        .max 0xFFFF
        .neg_one 0xFFFE
        .opmask 0xC000
        .addmask 0x3FFF
        .op_nand 0
        .op_add 0x4000
        .op_sav 0x8000
        .op_jcz 0xC000
        .stack_push 0x4000
        .stack_pop 0x3fff
        .thousand 0x4000
        .stack_top 0x740
        .stack_size 0x200
        .reserve_io_buffers 4
        .reserve_mutable 0x400
    ; Mutable variables
    .data
    	.truejmp 0
        .falsejmp 0
    	.tmp1 0x629
        .tmp2 0x2
        .stack_scratch 0
        .stack_tmp1 0
        .stack_tmp2 0
    	.stackp 0x740
    ioex:
    	jcz main
    call_ioex:
    	jcz ioex
    ; MAIN
    main:
        add call_mn1
        sav call_return
    	jcz push
    
    
    call_mn1:
    	jcz mn1
    call_mn2:
    	jcz mn2
    call_mn3:
    	jcz mn3
    call_mn4:
    	jcz mn4
    mn1:
    	nand zero
        nand max
        add tmp2
        sav tmp1
        nand zero
        nand max
        add call_mn2
        sav call_return
        jcz push
    mn2:
    	nand zero
        nand max
        add call_end
        sav call_return
        jcz uvmsub
    mn3:
    	nand zero
        nand max
        add tmp2
        sav tmp1
        nand zero
        nand max
        add call_mn4
        sav call_return
        jcz push
    mn4:
    	nand zero
        nand max
        add call_end
        sav call_return
        jcz uvmsub
    call_end:
    	jcz end
    end:
    sav zero
    
    call_poll:
    	jcz poll
    call_poll_check:
    	jcz poll_check
    call_poll_push:
    	jcz poll_push
    poll:
    	add op_jcz
        sav truejmp
        
    	nand zero
        nand max
        add call_return
        sav stack_scratch
        nand zero
        nand max
        add call_poll_check
        sav ioex
        jcz ioex
    poll_check:
    	sav tmp2
        add max
        jcz uvm_falsejump
        nand zero
        nand max
        add tmp2
        sav tmp1
        nand zero
        nand max
        add truejmp
        sav call_return
        jcz poll
        
    uvmalloc:
    	sav tmp1
        nand tmp1
        add stackp
        sav tmp1
        nand zero
        nand max
        add stackp
        sav tmp2
        nand zero
        nand max
        add tmp1
        sav stackp
        nand zero
        nand max
        add tmp2
        sav tmp1
        jcz call_return
    uvmfree:
    	add stackp
        sav stackp
        jcz call_return
    uvmload:
    	nand zero
        nand max
        add call_uvmload_1
        sav alu_pop_return
        jcz alu_pop
    call_uvmload_1:
    	jcz uvmload_1
    uvmload_1:
    	add stack_tmp1
        sav stack_tmp2
        nand zero
        nand max
        add stack_tmp1
        nand max
        sav stack_tmp1
    	nand zero
        nand max
        add call_uvmload_loop
        sav call_return
    uvmload_loop:
    	nand zero
        nand max
        add stack_tmp1
        add one
        jcz uvmload_cont
        	nand zero
            nand max
            add stack_scratch
            sav call_return
            jcz call_return
    uvmload_cont:
    	nand zero
        nand max
        add stack_tmp2
        add max
        sav stack_tmp2
        add op_add
        sav uvmload_fetch
        nand zero
        nand max
    uvmload_fetch:
    	add zero
        sav tmp1
        jcz push
    call_uvmload_loop:
    	jcz uvmload_loop
    
    ; sav stack(0) words starting at 
    ; memory address stack(1) 
    uvmsav:
    	nand zero
        nand max
        add call_uvmsav_1
        sav alu_return
        jcz alu_pop
    call_uvmsav_1:
    	jcz uvmsav_1
    uvmsav_1:
    	add op_add
        sav stack_tmp2
        sav uvmsav_load_2
        nand zero
        nand max
        add stack_tmp1
        nand max
        sav stack_tmp1
        nand zero
        nand max
        add call_uvmsav_loop
       	sav call_return
     uvmsav_loop:
     	nand zero
        nand max
        add stack_tmp1
        add one
        jcz uvmsav_load
        	nand zero
            nand max
            add stack_scratch
            sav call_return
            jcz call_return
     uvmsav_load:
     	nand zero
        nand max
    uvmsav_load_2:
     	add zero
        sav tmp1
        jcz push
    call_uvmsav_loop:
    	jcz uvmsav_loop
    uvmhalt:
    	sav zero  
    
    uvmjmp: 
    	add op_jcz
        sav call_return
        jcz call_return
    
    uvmjnz:
    	add op_jcz
        sav truejmp
    	nand zero
        nand max
        add call_return
        sav falsejmp
        nand zero
        nand max
        add call_uvmjnz_1
        sav call_return
        jcz pop
    call_uvmjnz_1:
    	jcz uvmjnz_1
    uvmjnz_1:
    	nand zero
        nand max
        add tmp1
        add max
        jcz uvm_falsejmp
        jcz uvm_truejmp
    
    uvmjez: ; 
    	add op_jcz
        sav truejmp
    	nand zero
        nand max
        add call_return
        sav falsejmp
        nand zero
        nand max
        add call_uvmjez_1
        sav call_return
        jcz pop
    call_uvmjez_1:
    	jcz uvmjez_1
    uvmjez_1:
    	nand zero
        nand max
        add tmp1
        add max
        jcz uvm_truejmp
        jcz uvm_falsejmp
    uvm_falsejmp:    
        nand zero
        nand max
        add falsejmp
        sav call_return
        jcz call_return
    
    uvm_truejmp:
    	nand zero
        nand max
        add op_jcz
        add truejmp
        sav uvm_trjmp_do
        add zero
    uvm_truejmp_do:
    	jcz zero
        
    
    alu_peek:
    	nand zero
        nand max
        add call_return
        sav stack_scratch
        nand zero
        nand max
        add op_add
        add stackp
        sav alu_peek_1
        add one
        sav alu_peek_2
        nand zero
        nand max
    alu_peek_1:
    	add zero
        sav stack_tmp1
        nand zero
        nand max
    alu_peek_2:
    	add zero
        sav stack_tmp2
        sav tmp1
    alu_peek_return:
    	jcz zero
    
    call_alu_pop_1:
    	jcz alu_pop_1
    call_alu_pop_2:
    	jcz alu_pop_2
    alu_pop:
    	nand zero
        nand max
        add call_return
        sav stack_scratch
        nand zero
        nand max
        add call_alu_pop_1
        sav call_return
        jcz pop
    alu_pop_1:
    	sav stack_tmp1
        nand zero
        nand max
        add call_alu_pop_2
        sav call_return
        jcz pop
    alu_pop_2:
    	sav stack_tmp2
        sav tmp1
    alu_pop_return:
    	jcz zero
    alu_return:
    	nand zero
        nand max
        add stack_scratch
        sav call_return
        jcz push
    ; if NOT(a)+b overflows 
    ; then a < b
    ; if NOT(a) + b + 1 inte ger overflow
    ; a > b
    uvmlt:
    	nand zero
        nand max
        add call_uvmlt_1
        sav alu_peek_return
        jcz alu_peek
    call_uvmlt_1:
    	jcz uvmlt_1
    uvmlt_1:
    	nand tmp1
        add stack_tmp1
        jcz uvmlt_2
        jcz uvmtest_false
    uvmlt_2:
    	add one
        jcz uvmtest_true
        jcz uvmtest_false
    
    uvmgt:
    	nand zero
        nand max
        add call_uvmgt_1
        sav alu_peek_return
        jcz alu_peek
    call_uvmgt_1:
    	jcz uvmgt_1
    uvmgt_1:
    	nand tmp1
        add stack_tmp1
        jcz uvmtest_false
        jcz uvmtest_true
    
    uvmeq: ;equals
    	nand zero
        nand max
        add call_uvmeq_1
        sav alu_peek_return
        jcz alu_peek
    call_uvmeq_1:
    	jcz uvmeq_1
    uvmeq_1:
    	nand tmp1x
        add stack_tmp1
        
        add one
        jcz uvmtest_false
        jcz uvmtest_true
        
    uvmtest_true:
    	nand zero
        nand max
        add one
        sav tmp1
        jcz alu_return
    
    uvmtest_false:
    	nand zero
        nand max
        sav tmp1
        jcz alu_return
        
    uvmrsb: ; right shift
    	nand zero
        nand max
        add not_sixteen
        sav tmp2
        nand zero
        nand max
        add op_add
        sav uvmsb_return
        jcz uvmsb
    
    uvmlsb: ; left shift
    	nand zero
        nand max
        add neg_one
        sav tmp2
        nand zero
        nand max
        add op_jcz
        add call_push
        sav uvmsb_return
        jcz uvmsb
    
    uvmsb: ; shift
    	nand zero
        nand max
        add call_uvmsb_1
        sav alu_pop_return
        jcz alu_pop
    call_uvmsb_1:
    	jcz uvmsb_1
    uvmsb_1:
    	nand zero
        nand max
        sav stack_tmp2
        add stack_tmp1
        add tmp2
        sav stack_tmp1
    uvmsb_loop:
        nand zero
        nand max
        add stack_tmp1
        add one
        jcz uvmsb_cont
    		uvmsb_return:
            	jcz alu_return
                nand zero
                nand max
                add stack_tmp2
                sav tmp1
                jcz alu_return
    uvmsb_cont:
    	sav stack_tmp1
        nand zero
        nand max
        add stack_tmp2
        add stack_tmp2
        sav stack_tmp2
        nand zero
        nand max
        add tmp1
        add tmp1
        sav tmp1
        jcz uvmsb_loop
        nand zero
        nand max
        add stack_tmp2
        add one
        sav stack_tmp2
        nand zero
    jcz uvmsb_loop
    
        
    uvmxor:
    	nand zero
        nand max
        add call_uvmxor_1
        sav alu_pop_return
        jcz alu_pop
    call_uvmxor_1:
    	jcz uvmxor_1
    uvmxor_1:
    	nand stack_tmp1
        sav tmp1
        nand stack_tmp2
        sav stack_tmp2
        nand zero
        nand max
        add tmp1
        nand stack_tmp1
        nand stack_tmp2
        sav tmp1
        nand zero
        nand max
        add stack_scratch
        sav call_return
        jcz push
    uvmnot:
    	nand zero
        nand max
        add call_return
        sav stack_scratch
        nand zero
        nand max
    call_uvmnot_1:
    	jcz uvmnot_1
    uvmnot_1:
    	sav tmp1
        nand tmp1
        sav tmp1
        jcz alu_return
        
    uvmnand:
    	nand zero
        nand max
        add call_uvmnand_1
        sav alu_pop_return
        jcz alu_pop
    call_uvmnand_1:
    	jcz uvmnand_1
    uvmnand_1:
    	nand stack_tmp1
        sav tmp1
        jcz alu_return
    
    uvmnor:
    	nand zero
        nand max
        add call_uvmnor_1
        sav alu_pop_return
        jcz alu_pop
    call_uvmnor_1:
    	jcz uvmnor_1
    uvmnor_1:
    	nand tmp1
        sav stack_tmp2
        nand zero
        nand max
        add stack_tmp1
        nand stack_tmp1
        nand stack_tmp2
        sav tmp1
        nand tmp1
        sav tmp1
        jcz alu_return
        
    
    uvmor:
    	nand zero
        nand max
        add call_uvmor_1
        sav alu_pop_return
        jcz alu_pop
    call_uvmor_1:
    	jcz uvmor_1
    uvmor_1:
    	nand tmp1
        sav stack_tmp2
        nand zero
        nand max
        add stack_tmp1
        nand stack_tmp1
        nand stack_tmp2
        sav tmp1
        jcz alu_return
    
    uvmand:
        nand zero
        nand max
        add call_uvmand_1
        sav alu_pop_return
        jcz alu_pop
    call_uvmand_1:
    	jcz uvmand_1
    uvmand_1:
    	nand zero
        nand max
        add stack_tmp1
        nand stack_tmp2
        sav tmp1
        nand tmp1
        sav tmp1
        jcz alu_return
        
    
    call_uvmmul_1:
    	jcz uvmmul_1
    uvmmul:
    	nand zero
        nand max
        add call_uvmmul_1
        sav alu_pop_return
        jcz alu_pop
    uvmmul_1:
    	nand zero
        nand max
        add stack_tmp1
        nand neg_one
        sav stack_tmp1
    uvmmul_loop:
    	nand zero
        nand max
        add stack_tmp1
        add one
        jcz uvmmul_cont
        	jcz alu_return ; PUSH tmp1 and return
    uvmmul_cont:
    	sav stack_tmp1
        nand zero
        nand max
        add tmp1
        add stack_tmp2
        sav tmp1
        add zero
        jcz uvmmul_loop
        
    uvmsub:
    	nand zero
        nand max
        add call_uvmsub_1
        sav alu_pop_return
        jcz alu_pop
    call_uvmsub_1:
    	jcz uvmsub_1
    uvmsub_1:
    	nand zero
        nand max
        add stack_tmp1
        nand stack_tmp1
        add one
        add stack_tmp2
        sav tmp1
        add zero
        jcz alu_return
        
        
    call_uvmadd_1:
    	jcz uvmadd_1
    uvmadd:
    	nand zero
        nand max
        add call_uvmadd_1
        sav alu_pop_return
        jcz alu_pop
    uvmadd_1:
    	add stack_tmp1
        sav tmp1
        add zero
        jcz alu_return
    
        
    ; end
    
    ; UVM add
    ; add (sp0 + sp1) => s
    
    
    ; call a method
    ; uses rcall to store the return value
    ; which needs to be persisted
    call:
    	add op_jcz
        sav do_call
        nand zero
        nand max
    do_call:
    	jcz zero
    end_call:
    	add zero
    call_return:
    	jcz zero
        
    call_pop:
    	nand pop
    call_push:
    	nand push
    call_peek:
    	nand peek
    call_dup:
    	nand dup
    
    skip:
    	nand zero
        nand max
    	add op_add
        add stackp
        add one
        sav dupload
        nand zero
        nand max
        jcz dupload
    dup:
    	nand zero
        nand max
        add op_add
        add stackp
        sav dupload
        nand zero
        nand max
    dupload:
    	add zero
        sav tmp1
        jcz push
    
    drop:
    	nand zero
        nand max
        add stackp
        add one
        sav stackp
        jcz end_call
    
    peek:
    	nand zero
        nand max
        add op_add
        add stackp
        sav end_call
        nand zero
        nand max
        jcz end_call
    pop:
    	nand zero
        nand max
    	add op_add
        add stackp
        sav end_call
        nand zero
        nand max
        add stackp
        add one
        sav stackp
    	nand zero
        nand max
        jcz end_call
        
    push:
    	nand zero
        nand max
        add stackp
        add max
        sav stackp
        add op_sav
        sav end_call
        nand zero
        nand max
        add tmp1
        jcz end_call
