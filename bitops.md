---


---

<h1 id="bits-and-their-twiddling">Bits and their twiddling</h1>
<p>First of all, did you spot the issue? No. Then I’ll give you a clue: how many iterations does it take for the carry bit to get set?</p>
<h3 id="now-then">Now then</h3>
<p>So, let’s talk about something real fun. Bit operations. Many of you never had to work in an environment where a division by a power of 2 was actually slower than a bit shift and you are probably staring at this sentence wondering what I am talking about.</p>
<p>Take a simple example. We have the number 12 or 0b1100 in binary. If we shift those bits to the left that means we add an extra 0 turning<br>
0b1100 into 0b11000. And 12 becomes 24. But the same goes for the other direction. If we bit shift to the right we remove the lowest bit turning 0b1100 into 0b110. And 12 becomes 6. And once upon a time before compilers become much better at optimisation it wasn’t uncommon to use bit shifting for multiplication and division for a certain type (powers of two, remember?).</p>
<p>And yet again I will bait and switch and say… listen. We have to talk about memory. You remember constants and the variable values. But what does that mean really?<br>
I find it easy to think of memory as a long row of boxes that are numbered from 0 to whatever number of boxes you have. When you want to know what is in a specific box you need to know its number (or adress) but the value inside can change over time (unless it’s a constant because then you will end up with an ACCESS VIOLATION.<br>
Since we only have a single register (we can’t count the Adress register and the Program Counter (I) because they are just there to accommodate I/O and program execution) we have to store values in order to make more complex calculations. One way to do this is just do declare that we have two temporary storage addresses and those are A and B. There are others but we will get to those later. For now, let’s just work with a fixed number. So now when we want to bit shift to the left, let’s see what we can do.</p>
<h2 id="left-shift">LEFT SHIFT</h2>
<pre><code>.data
	.a 0x122
	.shifts 0x4
	;END OF DECLARATIONS
bitshift_left_func_init:
	nand zero			;check number of shifts
    nand max
    add shifts
    nand shifts
    sav shifts
    nand zero		;reset prior to first iteration
    nand max		;later ones will nbe reset at the end
bitshift_left_func: ; the main shifting function
    add shifts 
    add one	;see if we cause overflow
    jcz do_bitshift ; if we are still not in overflow jump
    jcz shift_done  ; if we haven't jumped tjhen we are done
do_bitshift:
    sav shifts
    nand zero
    nand max
    add a	
    add a
    sav a  ;double the value and save
    nand zero ;zero here to reset any carry bit
    nand max
jcz bitshift_left_func ; Back to start of main shift

shift_done: ;end of shifting, the value is held in a
	jcz 0x0 ;jump to a constant location just for the hell of it
;END
</code></pre>
<p>As you can tell we don’t need temporary storage for this particular method but that also destroys the initial values<br>
Another variant would be to use two temporarily declared addresses and init those early. That might look like this</p>
<pre><code>.data
		.a 0x122
		.shifts 0x4
		.counter 0x0
		.total 0x0
		;END OF DECLARATIONS
    bitshift_left_func_init:
		nand zero			;check number of shifts
	    nand max
	    add shifts
	    nand shifts
	    sav counter
	    nand zero
	    nand max
	    add a
	    sav total
	    nand zero		;reset prior to first iteration
	    nand max		;later ones will nbe reset at the end
    bitshift_left_func: ; the main shifting function
	    add counter 
	    add one	;see if we cause overflow
	    jcz do_bitshift ; if we are still not in overflow jump
	    jcz shift_done  ; if we haven't jumped tjhen we are done
    do_bitshift:
	    sav counter
	    nand zero
	    nand max
	    add total	
	    add total
	    sav total  ;double the value and save
	    nand zero ;zero here to reset any carry bit
	    nand max
	jcz bitshift_left_func ; Back to start of main shift
	
	shift_done: ;end of shifting, the value is held in a
		jcz 0x0 ;jump to a constant location just for the hell of it
	;END
</code></pre>
<p>This would be nondestructive and that has other benefits too.</p>
<p>How about going the other way?</p>
<h3 id="right-bit-shift-and-byte-swap">RIGHT BIT SHIFT (AND BYTE SWAP)</h3>
<p>TBD documentation and explanation because here we explore some new concepts</p>
<pre><code>; Unmutable
.const
	.zero 0
    .one 1
    .max 0xFFFF
    .neg_one 0xfffe
    .hi 0xff00
    .lo 0xff
    .llo 0xf
    .hlo 0xf0
    .opmask 0xC000
    .addmask 0x3FFF
    .op_nand 0
    .op_add 0x4000
    .op_sav 0x8000
    .op_jcz 0xC000
    .k 0xFFFF
    .orgshift 0x8
    .orgval 0xA2b1
    .reserve_mutable 0x20
; Mutable variables
.data
    .tmpA 0x1
    .tmpB 0x0
    .tmpC 0x0
    .testV 0x22b9
    .shifts 0x1; 
    .stackp 0x2c
; MAIN
premain: ;before everything else
	nand zero
    nand max
    sav tmpC ; 0
	add orgshift ; R = 8
    sav shifts ; shifts is 8
	add orgval ; R = 0xA2b9
    sav testV ; Sav to testvalue and reset
    nand zero
    nand max
main:
    add shifts ; R is 8
    add max ; Here we add the max value which means R = 7!
    add hi ; R = 0xFF07
    add hlo ; R = 0xFFF7
    sav shifts ; save to shifts
    jcz shift ; if no carry bit shift away
end:
	nand zero
    nand max
    add tmpC
    add testV
    sav tmpC ; optional byte flipping
    sav zero 
shift:
	nand zero
    nand max
    add shifts
    add one
    sav shifts
    jcz shifter
    jcz end
shifter:
    nand zero
    nand max
	add testV
    add testV
    sav testV
    jcz noplus
    nand testV
    add testV
    nand max
    add one
    add tmpC
    add tmpC
    sav tmpC
    jcz shift
noplus:
	nand zero
    nand max
	add tmpC
    add tmpC
    sav tmpC
    jcz shift
; END
</code></pre>

