; This is a comment. Anything that starts with
; a semicolon is a comment, even on a line
; where there already is a keyword or
; instruction
.const ; Like this, .const signifies the start
       ; of a block of unmutable values, trying
       ; to do a sav to an address in this
       ; section causes the execution to stop
	.zero 0 ; Here we declare that the value
    	    ; 0 can be substituted with zero
            ; in code
            ; In the two columns on the right
            ; you have the memory address of
            ; the value and the value itself
            ; In this case both are zero
    .max 0xFFFF ; Here they are not. 0xffff is
    			; the largest value we can
                ; handle within the 16-bit
                ; word length we use.
    .op_nand 0 ; This is an opcode. We have four
    		   ; instructions which are placed
               ; in the Most Significant Bits
               ; Those are the bits that make
               ; up the largest values
               ; NAND is the classic logic
               ; gate that was used to build
               ; physical hardware since all
               ; other boolean logic can be
               ; built using only NAND gates
    .op_add 0x4000 ; ADD will take the value
    			   ; found at the provided
                   ; adress and ADD it to the
                   ; value currently held in
                   ; R. If the value overflows
                   ; meaning that the result is
                   ; larger than 0xFFFF, for
                   ; example of added 0xFFF and
                   ; 0xFFFF then the CARRY BIT
                   ; is set. In our example the
                   ; result would be 0x10FFE but
                   ; R would only contain 0xFFE
    .op_sav 0x8000 ; SAV stores the value held
                   ; in R at the provided adress
                   ; and clears the CARRY BIT
    .op_jcz 0xC000 ; JCZ means JUMP if CARRY BIT
                   ; is Zero. That means that
                   ; as long as the preceding
                   ; arithmetic operation didn't
                   ; result in the carry bit
                   ; being set we can JUMP to
                   ; a provided adress and read
                   ; the instruction there.
    .reserve_io_buffers 4 ; Ignore this for now
.data ; This signifies that any values declared
      ; here are muteable. That means that they
      ; can be read AND written to, providing
      ; additional storage space
	.tmp 0x0 ; Like this. Here we declare that
    		 ; tmp is currently zero.

; There's more to what goes on in the
; declaration part than I show here, we can
; for example declare that we need additional
; space for muteable data placed before the
; code itself but this is the basics so let
; us stick to that.

; Below is a LABEL. It functions as a way to
; provide handles that we can use when JUMPing
; as we shall see.
main:
	add tmp ; Here is our first instruction
    	    ; It resides at memory address
            ; 0x327 and since we know that
            ; ADD is 0x4000 we can deduce that
            ; 0x326 is the memory location
            ; from which the value will be
            ; loaded and added to R. And if
            ; you look above you can see that
            ; yes, the tmp value is stored at
            ; 0x326
    add 10  ; We can use numerical values
            ; directly or indirectly
    sav tmp ; The value in R is saved to tmp
            ; and if you are stepping through
            ; the code you can click on the
            ; line where tmp is declared and
            ; see the current value
    jcz main ; As long as we don't overflow we
    		 ; we will jump back up to main,
             ; or rather to the instruction
             ; immediately following it
end:
	sav zero ; this will cause the execution to
             ; stop