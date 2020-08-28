---


---

<h2 id="the-not-really-origins-of-computing">The not really origins of computing</h2>
<p>Listen. We’re not going to talk about Babbage and Ada Lovelace here. They were smart and had some insights but you can read about them in your own time. Or about Lord Byron. He was more fun. Nor am I going to talk about Von Neumann or Alan Turing. Wikipedia is there for a reason. Instead we will talk about what a CPU is in the most rudimentary form and eventually show that even a rudimentary CPU can do some very impressive things.</p>
<p>But let us start from the beginning. There was nothing. And then I said let there be some sort of storage where we can keep stuff. How about 2^15 addresses? This means that there are 32 768 memory addresses in our storage, which if truth be told is just a pointless list of numbers right now. So let’s talk about the amount of data stored at each of these addresses. Typically people tend to think about bytes when the smallest unit is concerned but that wasn’t a practical solution as we shall soon see. Instead we will be using 16 bit words. Don’t worry, it isn’t a dictionary, that just means that every memory adress points to a word, it might be 16, 32, 64 or even 128 bit but we are back to basic so this is 16 bits.</p>
<p>That means that our available storage is the number of addresses * 2 bytes since 16 bits is two bytes. 64 kB was fairly common in around 1970 or so and considering what some very talented individuals did with one of those machines I think we can feel reasonably comfortable.</p>
<p>So a word is basically two bytes and since one byte ranges from 0 to 255 (or 0x0 to 0xFF in hexadecimal, where instead of 0-9 we use 0-F to represent numbers, don’t worry, we’ll get to that too), a word ranges from 0 to 0xFFFF, or 0 to 65535 in decimal. So first of all, how about we deal with this number issue. Back in the day it was not uncommon to see octal which is base 8, used but this is not really something that is in practice anymore and it would be pointless to plague you with the intricacies of dealing with it. So. As you know the base 10 or decimal system uses 0,1,2,3,4,5,6,7,8 and 9 to represent parts of values. A value that starts with a 0 can have no following symbols, we are only dealing with whole numbers here. When we count and reach 9 the next number is the first digit which is nonzero (1) followed by a 0. 10. Easy. You learned this in school.<br>
Hexadecimal works the same way. Numbers are written using the symbols 0,1,2,3,4,5,6,7,8,9,A,B,C,D,E and F. As you can see 9 no longer is the last symbol of the series so instead we count to F (or 15 in decimal) before moving to… you guessed it: 10. But 10 in hexadecimal means 16. So in order for us to be able to differentiate between one and the other we use a special notation. I will use 0x10 to represent a hexadecimal number while 10 notes the decimal value.</p>
<p>But computers don’t really deal with this systems, instead they use binary. The reason for this is that they can be represented by an on/off state. So they only use 0 and 1 as symbols. And this is something that tends to be a bit complicated for people to grasp. You, however, are sure to get it immediately. Let me illustrate using a small table</p>

<table>
<thead>
<tr>
<th>binary</th>
<th>decimal</th>
</tr>
</thead>
<tbody>
<tr>
<td>0</td>
<td>0</td>
</tr>
<tr>
<td>1</td>
<td>1</td>
</tr>
<tr>
<td>10</td>
<td>2</td>
</tr>
<tr>
<td>11</td>
<td>3</td>
</tr>
<tr>
<td>100</td>
<td>4</td>
</tr>
<tr>
<td>101</td>
<td>5</td>
</tr>
<tr>
<td>110</td>
<td>6</td>
</tr>
<tr>
<td>111</td>
<td>7</td>
</tr>
<tr>
<td>1000</td>
<td>8</td>
</tr>
<tr>
<td>1001</td>
<td>9</td>
</tr>
<tr>
<td>1010</td>
<td>10</td>
</tr>
<tr>
<td>1011</td>
<td>11</td>
</tr>
<tr>
<td>1100</td>
<td>12</td>
</tr>
<tr>
<td>1101</td>
<td>13</td>
</tr>
<tr>
<td>1110</td>
<td>14</td>
</tr>
<tr>
<td>1111</td>
<td>15</td>
</tr>
</tbody>
</table><p>It’s obvious to you that all values that start with a 1 followed by all zeros are powers of 2. (Kids: a power of 2 means a multiple of two. We can write this as 2<em>2</em>2 or 2<sup>3</sup>) In fact the number of trailing zeros is the actual power in question. 1000 gives 2<sup>3</sup> which is 2<em>2</em>2 or 8. So it’s easy to tell that there is a strong connection to the hexadecimal system since that is also based on the power of 2 as 16 is in fact 2<sup>4</sup>.</p>
<p>This may all seem like a long day in math class and it’s not clear why we are talking about all these numbers but now we can start talking about stuff we need for our CPU.</p>
<h2 id="registers">REGISTERS</h2>
<p>First of all we need a register. A register holds a value for us and basically acts as a storage that is local to the CPU and not connected to the data in the storage we talked about above. It’s like a temporary value. Something you remember just for now. For simplicity we will say we need one register for values that we read and write and we will call this one R because we are creative people. We also need something which is referred to as a program counter and that is the address of the next instruction we are supposed to process. Let’s call this I for instruction. And just for completeness let us add a register called A for address. This is used when reading or writing so that we don’t just read or write willy nilly. So in summary</p>

<table>
<thead>
<tr>
<th>NAME</th>
<th>ALIAS</th>
<th>DESCRIPTION</th>
</tr>
</thead>
<tbody>
<tr>
<td>A</td>
<td>ADDR</td>
<td>ADRESS REGISTER</td>
</tr>
<tr>
<td>I</td>
<td>INSTR</td>
<td>INSTRUCTION/PROGRAM COUNTER</td>
</tr>
<tr>
<td>R</td>
<td>NONE</td>
<td>PRIMARY REGISTER, ACCUMULATOR</td>
</tr>
</tbody>
</table><p>Now what does accumulator mean? Simply put it means that it is used to for any arithmetic operation. And that means that we need to talk about instructions.</p>
<h2 id="instructionsoperations">INSTRUCTIONS/OPERATIONS</h2>
<p>In order for the CPU to to anything it has to know what it should do. So we need to define som instructions. Let’s think about this. We want to read data, store data, perform some sort of arithmetic operation (otherwise it wouldn’t be much use right, a calculator that can’t add is basically just a … well, nothing) and we need to be able to do two other very important things.<br>
1: perform logical operations<br>
2: transfer control</p>
<p>To read data we will use an instruction we call ADD. The reason is that when we read we simply set the R register to 0 and read the value into it which will add the value to zero and R holds the right value. Or if we want to add a value to R we don’t reset it and a normal addition is performed.<br>
To save the value in R to storage we use SAV. SAV will look at the A register and save the value in R at that position. There are some intricacies here which we will get into soon but don’t worry. Now for that logic.</p>
<p>Logical operations are things like checking if a specific condition is true or false. Is 2 equal to 2? Yes. Is an apple a tiger? Probably not. There are a number of logical operations like AND, OR, NOT, XOR and so on.  We only want to have 4 instructions so we need to chose one and out of all the logical operations there are two which are what is referred to as complete. From them you can construct all the other ones. NAND happens to be the one that was historically used in hardware, using what was called NAND-gates, to build logical circuits so we will use NAND. It stands for NOT AND and let’s compare the two.<br>
Logical operations work with values of 0 (false) and 1 (true) and are defined using what is called a truth table. The truth table for AND looks like this</p>

<table>
<thead>
<tr>
<th>Input A`</th>
<th>Input B</th>
<th>Result</th>
</tr>
</thead>
<tbody>
<tr>
<td>0</td>
<td>0</td>
<td>0 (false)</td>
</tr>
<tr>
<td>1</td>
<td>0</td>
<td>0 (false)</td>
</tr>
<tr>
<td>0</td>
<td>1</td>
<td>0 (false)</td>
</tr>
<tr>
<td>1</td>
<td>1</td>
<td>1 (true)</td>
</tr>
</tbody>
</table><p>The truth table for NAND however looks like this</p>

<table>
<thead>
<tr>
<th>Input A`</th>
<th>Input B</th>
<th>Result</th>
</tr>
</thead>
<tbody>
<tr>
<td>0</td>
<td>0</td>
<td>1 (true)</td>
</tr>
<tr>
<td>1</td>
<td>0</td>
<td>1 (true)</td>
</tr>
<tr>
<td>0</td>
<td>1</td>
<td>1 (true)</td>
</tr>
<tr>
<td>1</td>
<td>1</td>
<td>0 (false)</td>
</tr>
</tbody>
</table><p>Once we start looking at logical operations in detail it will become obvious why NAND is so useful.  But for now let´s say we do an <code>AND</code>-operation like this.</p>
<pre><code>	01011111 ; 95
&amp;   00111101 ; 61
------------------
    00011101 ; 29, although the numerical representation of the
		     ; result isn't all that important
</code></pre>
<p>a <code>NAND</code>-operation would flip all the bits. Every 0 would become 1 and vice versa. So instead of  <code>00011101</code> we would get <code>11100010</code>.  So why <code>NAND</code>? It may have a lot to do with <a href="https://en.wikipedia.org/wiki/Functional_completeness">Functional completeness</a></p>
<p>The last operation is transfer of control. This instruction is responsible for changing the value of the address of the next instruction. We will call it JCZ and to understand why we need to talk about flags.<br>
A flag is something like a semaphore and is used during arithmetic operations. If the values added are larger than the maximum a flag (or bit since a flag is either on or off, 0 or 1 just like a bit) is set. So if we add 2 and 1 the flag is set to 0. If we add two values that together become larger than our maximum 0xFFFF (remember our hexadecimal talk?) then the flag is set to 1. The flag is also reset whenever a NAND instruction is performed or when a JCZ instruction has been called.</p>
<p>It is generally referred to as the carry bit and it will become useful for other things to later. But for now, just think of it like this. Imagine if we write some code that add 100 to our R register every since cycle until we went over the maximum. It might look (in fake code) like this</p>
<p>ADD 100<br>
JCZ 0</p>
<p>Here we assume that 0 is the address of the add instruction so as long as the carry bit is not set we just jump to that instruction. Once the add instruction is performed the adress in the instruction register is automatically incremented. When the overflow happens the instruction increments to 2 and there’s nothing there and everything crashes.</p>
<p>So here’s what it would look like for our CPU</p>

<table>
<thead>
<tr>
<th>instruction</th>
<th>value</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>add</strong></td>
<td><em>[memory address]</em></td>
</tr>
<tr>
<td><strong>nand</strong></td>
<td><em>[memory address]</em></td>
</tr>
<tr>
<td><strong>sav</strong></td>
<td><em>[memory address]</em></td>
</tr>
<tr>
<td><strong>jcz</strong></td>
<td><em>[memory address]</em></td>
</tr>
</tbody>
</table><p>Important to remember. <code>add</code> will add the value at the supplied <code>memory address</code> to the current value of the accumulator register. <code>nand</code> acts the same. <code>sav</code></p>
<p>The subcomponents of the CPU are then Registers, Storage read and write and what is called the ALU or Arithmetic Logic Unit which has two inputs and one output along with the carry bit flag.</p>
<h3 id="add-in-short">Add in short</h3>
<p><em><strong>add &lt;address&gt;</strong></em></p>
<ol>
<li>request value at address</li>
<li>receive value at address</li>
<li>request value in R</li>
<li>receive value in R</li>
<li>add value at address with R value</li>
<li>set/unset carry bit as appropriate</li>
<li>store value in R</li>
</ol>
<p>Wow. We now have all we need. Almost. Because we need a couple of more things. We don’t want to write his in machine code (or actual numbers.</p>
<p>You see the instructions are represented as operation codes or OPCODES and they look like this</p>
<h2 id="opcodes">OPCODES</h2>

<table>
<thead>
<tr>
<th align="left">OPCODE</th>
<th align="left">LABEL</th>
<th align="left">PARAMETERS</th>
<th align="left">DESCRIPTION</th>
</tr>
</thead>
<tbody>
<tr>
<td align="left">0</td>
<td align="left">NAND</td>
<td align="left">&lt;ADDRESS|VALUE&gt;</td>
<td align="left">NANDS THE VALUE AT ADRESS TO R (C)</td>
</tr>
<tr>
<td align="left">1</td>
<td align="left">ADD</td>
<td align="left">&lt;ADDRESS|VALUE&gt;</td>
<td align="left">ADDS THE VALUE AT ADRESS TO R (C)</td>
</tr>
<tr>
<td align="left">2</td>
<td align="left">SAV</td>
<td align="left">&lt;ADDRESS|VALUE&gt;</td>
<td align="left">STORE R IN ADDRESS</td>
</tr>
<tr>
<td align="left">3</td>
<td align="left">JCZ</td>
<td align="left">&lt;ADDRESS|VALUE&gt;</td>
<td align="left">JUMPS TO &lt;ADDRESS&gt; IF CARRY FLAG IS ZERO</td>
</tr>
</tbody>
</table><p>Those codes are placed in the first two bits (remember that 0 to 3 can be represented as 0, 1, 10 and 11 out of 16. But we also need variables for temporary storage and what is referred to as constants, values that do not ever change.</p>
<h2 id="constructing-language">CONSTRUCTING LANGUAGE</h2>
<p>So to make this easy for us we have to construct a little language.<br>
Let’s be lazy. We want to make use of names that we can read, these are typically called a label but let’s call them variable names and labels since they are somewhat different.</p>
<p>When defining constants we write</p>
<pre><code>.const				;    const signifies that these are CONSTANT
	.one=1			;0   that means that the block of memory that can't					
    .zero=0			;1   be accessed.
    .max=0xFFFF		;2   While these will only rarely be used in this little
    .opmask=0xC000	;3   program but you may find it useful 
    .addmask=0x3FFF	;4   The op and addmask are good examples of this
    .op_nand=0		;5   They can be used to separate out the op code which is the
    .op_add=0x4000	;6   top 4 bytes and the data payload
    .op_sav=0x8000	;7   the op_-constants are direct representations of the
    .op_jcz=0xC000  ;8   opcodes which means that the intrepid developer can
				    ;    write code that does some really interesting things
</code></pre>
<p>All of these values are impossible to change, Our hypothetical CPU will catch fire if you try to write to those addresses during execution.<br>
But we also need temporary storage. Let’s make that too.</p>
<pre><code>.data
	 .var1=0x4001	;9   The data block is mutable. This means that we  know
					;    where the boundary between immutable constants and mutable
					;    variables are, and can use this for all sorts of storage
</code></pre>
<p>You probably wonder about the semicolons. The refer to a comment. Anything after a semicolon is ignored by what is called the assembler which is a little piece of code that helps us convert labels and names to addresses to make it easy for people to write code without going crazy.</p>
<p>So not that we have that, let’s write our first program.</p>
<pre><code>;START OF PROGRAM
add one				;A  R = 1
sav 0x29			;B  For no particular reason I decided to run the sequence from 
loop:				;   0x28 (would be zero) and onwards. From here on we loop
	nand zero		;C
	nand max		;D  reset R to 0
	add 0x28		;E  R=R+0
	add 0x29		;F  R=R+1
	sav 0x2A		;10 0x2A is now 1
	nand zero		;11 reset 
	nand max		;12
	add 0xF			;13	this loads the command at 0xF (add 0x29) into R
	sav 0xE			;14 The command at 0xE is now add 0x29
	add one			;15 The command is now add 0x2A
	sav 0xF			;16 And 0xF is now add 0x2A
	add var1		;17 If you look at the opcodes you can see that add is 0x4000
	sav 0x10		;18 and sav 0x4000. So by adding 0x4001 we move a slot forward 
	jcz loop		;19
;END PROGRAM
; Note, it will run until it terminates
; And in case you are curious, a compacted version of this would clock in at 13 
; words (or 26 bytes)
</code></pre>
<p>When you are reading this you are thinking “WHAT THE HELL IS UP WITH THIS NAND ZERO AND NAND MAX THINGS?”. They are used to reset R to zero. But we will get into this in more detail next time.</p>

