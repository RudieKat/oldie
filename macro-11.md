---


---

<h1 id="macro-11-pal-11">MACRO-11 /PAL-11</h1>
<h3 id="do-not-bother-reading-unless-you-have-serious-issues">DO NOT BOTHER READING UNLESS YOU HAVE SERIOUS ISSUES</h3>
<p>There’s limited (or also plenty depending on how insane you are) documentation of macro-11 available and I figured it might make sense to make my attempts at boiling it down to something more useful for my/our purposes here.  I’ve taken the liberty of including some additional resources that may be interesting as well.<br>
<a href="/oldie/doc/DEC-11-ASDB-D_PAL-11R_Assembler_Programmers_Manual_May71.pdf">PAL-11</a><br>
<a href="/oldie/doc/DEC-11-OIMRA-A-D_MACRO_75.pdf">Macro-11</a><br>
<a href="/oldie/doc/UNIX_ProgrammersManual_Nov71.pdf">Unix Programmer’s Manual Nov 1971</a></p>

<table>
<thead>
<tr>
<th>Type</th>
<th>Instruction Mnemonic</th>
<th>Octal</th>
<th>Operation</th>
</tr>
</thead>
<tbody>
<tr>
<td>ALU</td>
<td>ADC</td>
<td>5500</td>
<td>Add Carry</td>
</tr>
<tr>
<td>ALU</td>
<td>ADCB</td>
<td>105500</td>
<td>Add Carry (Byte)</td>
</tr>
<tr>
<td>ALU</td>
<td>ADD</td>
<td>60000</td>
<td>Add Source To Destination</td>
</tr>
<tr>
<td>ALU</td>
<td>ASH</td>
<td>72000</td>
<td>Shift Arithmetically</td>
</tr>
<tr>
<td>ALU</td>
<td>ASHC</td>
<td>73000</td>
<td>Arithmetic Shift Combined</td>
</tr>
<tr>
<td>ALU</td>
<td>ASL</td>
<td>6300</td>
<td>Arithmetic Shift Left</td>
</tr>
<tr>
<td>ALU</td>
<td>ASLB</td>
<td>106300</td>
<td>Arithmetic Shift Left (Byte)</td>
</tr>
<tr>
<td>ALU</td>
<td>ASR</td>
<td>6200</td>
<td>Arithmetic Shift Right</td>
</tr>
<tr>
<td>ALU</td>
<td>ASRB</td>
<td>106200</td>
<td>Arithmetic Shift Right (Byte)</td>
</tr>
<tr>
<td>BRANCH</td>
<td>BCC</td>
<td>103000</td>
<td>Branch If Carry Is Clear</td>
</tr>
<tr>
<td>BRANCH</td>
<td>BCS</td>
<td>103400</td>
<td>Branch If Carry Is Set</td>
</tr>
<tr>
<td>BRANCH</td>
<td>BEQ</td>
<td>1400</td>
<td>Branch If Equal</td>
</tr>
<tr>
<td>BRANCH</td>
<td>BGE</td>
<td>2000</td>
<td>Branch If Greater Than Or Equal</td>
</tr>
<tr>
<td>BRANCH</td>
<td>BGT</td>
<td>3000</td>
<td>Branch If Greater Than</td>
</tr>
<tr>
<td>BRANCH</td>
<td>BHI</td>
<td>101000</td>
<td>Branch If Higher</td>
</tr>
<tr>
<td>BRANCH</td>
<td>BHIS</td>
<td>103000</td>
<td>Branch If Higher Or Same</td>
</tr>
<tr>
<td>ALU</td>
<td>BIC</td>
<td>40000</td>
<td>Bit Clear</td>
</tr>
<tr>
<td>ALU</td>
<td>BICB</td>
<td>140000</td>
<td>Bit Clear (Byte)</td>
</tr>
<tr>
<td>ALU</td>
<td>BIS</td>
<td>50000</td>
<td>Bit Set</td>
</tr>
<tr>
<td>ALU</td>
<td>BISB</td>
<td>150000</td>
<td>Bi t Set (Byte)</td>
</tr>
<tr>
<td>ALU</td>
<td>BIT</td>
<td>30000</td>
<td>Bit Test</td>
</tr>
<tr>
<td>ALU</td>
<td>BITB</td>
<td>130000</td>
<td>Bit Test (Byte)</td>
</tr>
<tr>
<td>BRANCH</td>
<td>BLE</td>
<td>3400</td>
<td>Branch If Less Than Or Equal</td>
</tr>
<tr>
<td>BRANCH</td>
<td>BLO</td>
<td>103400</td>
<td>Branch If Lower</td>
</tr>
<tr>
<td>BRANCH</td>
<td>BLOS</td>
<td>101400</td>
<td>Branch If Lower Or Same</td>
</tr>
<tr>
<td>BRANCH</td>
<td>BLT</td>
<td>2400</td>
<td>Branch If Less Than</td>
</tr>
<tr>
<td>BRANCH</td>
<td>BMI</td>
<td>100400</td>
<td>Branch If Minus</td>
</tr>
<tr>
<td>BRANCH</td>
<td>BNE</td>
<td>1000</td>
<td>Branch If Not Equal</td>
</tr>
<tr>
<td>BRANCH</td>
<td>BPL</td>
<td>100000</td>
<td>Branch If Plus</td>
</tr>
<tr>
<td>DEBUG</td>
<td>BPT</td>
<td>3</td>
<td>Breakpoint Trap</td>
</tr>
<tr>
<td>BRANCH</td>
<td>BR</td>
<td>400</td>
<td>Branch Unconditional</td>
</tr>
<tr>
<td>BRANCH</td>
<td>BVC</td>
<td>102000</td>
<td>Branch If Overflow Is Clear</td>
</tr>
<tr>
<td>BRANCH</td>
<td>BVS</td>
<td>102400</td>
<td>Branch If Overflow Is Set</td>
</tr>
<tr>
<td>BRANCH</td>
<td>CALL</td>
<td>4700</td>
<td>Jump To Subroutine (JSR PC,xxx)</td>
</tr>
<tr>
<td>BRANCH</td>
<td>CALLR</td>
<td>100</td>
<td>Jump (JMP addr)</td>
</tr>
<tr>
<td>MEM</td>
<td>CCC</td>
<td>257</td>
<td>Clear All Condition Codes</td>
</tr>
<tr>
<td>MEM</td>
<td>CLC</td>
<td>241</td>
<td>Clear C Condition Code Bit</td>
</tr>
<tr>
<td>MEM</td>
<td>CLN</td>
<td>250</td>
<td>Clear N Condition Code Bit</td>
</tr>
<tr>
<td>MEM</td>
<td>CLR</td>
<td>5000</td>
<td>Clear Destination</td>
</tr>
<tr>
<td>MEM</td>
<td>CLRB</td>
<td>105000</td>
<td>Clear Destination (Byte)</td>
</tr>
<tr>
<td>MEM</td>
<td>CLV</td>
<td>242</td>
<td>Clear V Condition Code Bit</td>
</tr>
<tr>
<td>MEM</td>
<td>CLZ</td>
<td>244</td>
<td>Clear Z Condition Code Bit</td>
</tr>
<tr>
<td>ALU</td>
<td>CMP</td>
<td>20000</td>
<td>Compare Source To Destination</td>
</tr>
<tr>
<td>ALU</td>
<td>CMPB</td>
<td>120000</td>
<td>Compare Source To Destination (Byte)</td>
</tr>
<tr>
<td>ALU</td>
<td>COM</td>
<td>5100</td>
<td>Complement Destination</td>
</tr>
<tr>
<td>ALU</td>
<td>COMB</td>
<td>105100</td>
<td>Complement Destination (Byte)</td>
</tr>
<tr>
<td>ALU</td>
<td>DEC</td>
<td>5300</td>
<td>Decrement Destination</td>
</tr>
<tr>
<td>ALU</td>
<td>DECB</td>
<td>105300</td>
<td>Decrement Destination (Byte)</td>
</tr>
<tr>
<td>ALU</td>
<td>DIV</td>
<td>71000</td>
<td>Divide</td>
</tr>
<tr>
<td>DEBUG</td>
<td>EMT</td>
<td>104000</td>
<td>Emulator Trap</td>
</tr>
<tr>
<td>ALU</td>
<td>FADD</td>
<td>75000</td>
<td>Floating Add</td>
</tr>
<tr>
<td>ALU</td>
<td>FDIV</td>
<td>75030</td>
<td>Floating Divide</td>
</tr>
<tr>
<td>ALU</td>
<td>FMUL</td>
<td>75020</td>
<td>Floating Multiply</td>
</tr>
<tr>
<td>ALU</td>
<td>FSUB</td>
<td>75010</td>
<td>Floating Subtract</td>
</tr>
<tr>
<td>EXEC</td>
<td>HALT</td>
<td>0</td>
<td>Halt</td>
</tr>
<tr>
<td>ALU</td>
<td>INC</td>
<td>5200</td>
<td>Increment Destination</td>
</tr>
<tr>
<td>ALU</td>
<td>INCB</td>
<td>105200</td>
<td>Increment Destination</td>
</tr>
<tr>
<td>EXEC</td>
<td>lOT</td>
<td>4</td>
<td>Input/Output Trap</td>
</tr>
<tr>
<td>BRANCH</td>
<td>JMP</td>
<td>100</td>
<td>Jump</td>
</tr>
<tr>
<td>BRANCH</td>
<td>JSR</td>
<td>4000</td>
<td>Jump To Subroutine</td>
</tr>
<tr>
<td>EXEC</td>
<td>MARK</td>
<td>6400</td>
<td>Mark</td>
</tr>
<tr>
<td>???</td>
<td>MED6X</td>
<td>76600</td>
<td>PDP-ll/60 Maintenance</td>
</tr>
<tr>
<td>???</td>
<td>MED74C</td>
<td>76601</td>
<td>PDP-ll/74 CIS Maintenance</td>
</tr>
<tr>
<td>MEM</td>
<td>MFPI</td>
<td>6500</td>
<td>Move From Previous Instruction Space</td>
</tr>
<tr>
<td>MEM</td>
<td>MFPS</td>
<td>106700</td>
<td>Move from PS (LSI-II, LSI-ll/23, LSI-ll/2)</td>
</tr>
<tr>
<td>MEM</td>
<td>MFPT</td>
<td>7</td>
<td>Move From Processor Type</td>
</tr>
<tr>
<td>MEM</td>
<td>MOV</td>
<td>10000</td>
<td>Move Source To Destination</td>
</tr>
<tr>
<td>MEM</td>
<td>MOVB</td>
<td>110000</td>
<td>Move Source To Destination (Byte)</td>
</tr>
<tr>
<td>MEM</td>
<td>MTPI</td>
<td>6600</td>
<td>Move To Previous Instruction Space</td>
</tr>
<tr>
<td>MEM</td>
<td>MTPS</td>
<td>106400</td>
<td>Move to PS (LSI-II, LSI-ll/23, LSI-ll/2)</td>
</tr>
<tr>
<td>ALU</td>
<td>MUL</td>
<td>70000</td>
<td>Multiply</td>
</tr>
<tr>
<td>ALU</td>
<td>NEG</td>
<td>5400</td>
<td>Negate Destination</td>
</tr>
<tr>
<td>ALU</td>
<td>NEGB</td>
<td>105400</td>
<td>Negate Destination (Byte)</td>
</tr>
<tr>
<td>EXEC</td>
<td>NOP</td>
<td>240</td>
<td>No Operation</td>
</tr>
<tr>
<td>IO</td>
<td>RESET</td>
<td>5</td>
<td>Reset External Bus</td>
</tr>
<tr>
<td>BRANCH</td>
<td>RETURN</td>
<td>207</td>
<td>Return From Subroutine (RTS PC)</td>
</tr>
<tr>
<td>ALU</td>
<td>ROL</td>
<td>6100</td>
<td>Rotate Left</td>
</tr>
<tr>
<td>ALU</td>
<td>ROLB</td>
<td>106100</td>
<td>Rotate Left (Byte)</td>
</tr>
<tr>
<td>ALU</td>
<td>ROR</td>
<td>6000</td>
<td>Rotate Right</td>
</tr>
<tr>
<td>ALU</td>
<td>RORB</td>
<td>106000</td>
<td>Rotate Right (Byte)</td>
</tr>
<tr>
<td>BRANCH</td>
<td>RTI</td>
<td>2</td>
<td>Return From Interrupt (Permits a trace trap)</td>
</tr>
<tr>
<td>BRANCH</td>
<td>RTS</td>
<td>200</td>
<td>Return From Subroutine</td>
</tr>
<tr>
<td>BRANCH</td>
<td>RTT</td>
<td>6</td>
<td>Return From Interrupt (inhibits trace trap)</td>
</tr>
<tr>
<td>ALU</td>
<td>SBC</td>
<td>5600</td>
<td>Subtract Carry</td>
</tr>
<tr>
<td>ALU</td>
<td>SBCB</td>
<td>105600</td>
<td>Subtract Carry (Byte)</td>
</tr>
<tr>
<td>MEM</td>
<td>SCC</td>
<td>277</td>
<td>Set All Condition Code Bits</td>
</tr>
<tr>
<td>MEM</td>
<td>SEC</td>
<td>261</td>
<td>Set C Condition Code Bit</td>
</tr>
<tr>
<td>MEM</td>
<td>SEN</td>
<td>270</td>
<td>Set N Condition Code Bit</td>
</tr>
<tr>
<td>MEM</td>
<td>SEV</td>
<td>262</td>
<td>Set V Condition Code Bit</td>
</tr>
<tr>
<td>MEM</td>
<td>SEZ</td>
<td>264</td>
<td>Set Z Condition Code Bit</td>
</tr>
<tr>
<td>ALU</td>
<td>SOB</td>
<td>77000</td>
<td>Subtract One And Branch</td>
</tr>
<tr>
<td>ALU</td>
<td>SUB</td>
<td>160000</td>
<td>Subtract Source From Destination</td>
</tr>
<tr>
<td>ALU</td>
<td>SWAB</td>
<td>300</td>
<td>Swap Bytes</td>
</tr>
<tr>
<td>ALU</td>
<td>SXT</td>
<td>6700</td>
<td>Sign Extend</td>
</tr>
<tr>
<td>EXEC</td>
<td>TRAP</td>
<td>104400</td>
<td>Trap</td>
</tr>
<tr>
<td>ALU</td>
<td>TST</td>
<td>5700</td>
<td>Test Destination</td>
</tr>
<tr>
<td>ALU</td>
<td>TSTB</td>
<td>105700</td>
<td>Test Destination (Byte)</td>
</tr>
<tr>
<td>ALU</td>
<td>TSTSET</td>
<td>7200</td>
<td>Test Destination And Set Low Bit</td>
</tr>
<tr>
<td>EXEC</td>
<td>WAIT</td>
<td>1</td>
<td>Wait For Interrupt</td>
</tr>
<tr>
<td>MEM</td>
<td>WRTLCK</td>
<td>7300</td>
<td>Read/Lock Destination. Write/Unlock R0 Into Destination</td>
</tr>
<tr>
<td>?</td>
<td>XFC</td>
<td>76700</td>
<td>Extended Function Code</td>
</tr>
<tr>
<td>ALU</td>
<td>XOR</td>
<td>74000</td>
<td>Exclusive OR</td>
</tr>
</tbody>
</table><h3 id="addressing-modes">Addressing modes</h3>
<h4 id="overview">Overview</h4>
<hr>

<table>
<thead>
<tr>
<th>Mode</th>
<th>Syntax</th>
<th>See</th>
</tr>
</thead>
<tbody>
<tr>
<td>Register mode</td>
<td>R</td>
<td></td>
</tr>
<tr>
<td>Register deferred mode</td>
<td>@R or (ER)</td>
<td><a href="#register-mode">Register mode</a></td>
</tr>
<tr>
<td>Autoincrement mode</td>
<td>(ER)+</td>
<td><a href="#autoincrement-mode">Autoincrement</a></td>
</tr>
<tr>
<td>Autoincrement deferred mode</td>
<td>@(ER)+</td>
<td><a href="#autoincrement-deferred-mode">Autoincrement deferred</a></td>
</tr>
<tr>
<td>Autodecrement mode</td>
<td>-(ER)</td>
<td><a href="#autodecrement-mode">Autodecrement</a></td>
</tr>
<tr>
<td>Autodecrement deferred mode</td>
<td>@-(ER)</td>
<td><a href="#autodecrement-deferred-mode">Autodecrement deferred</a></td>
</tr>
<tr>
<td>Index mode</td>
<td>E(ER)</td>
<td><a href="#index-mode">Index mode</a></td>
</tr>
<tr>
<td>Index deferred mode</td>
<td>@E(ER)</td>
<td><a href="#index-deferred-mode">Index deferred</a></td>
</tr>
<tr>
<td>Immediate mode</td>
<td>#E</td>
<td><a href="#immediate-mode">Immediate mode</a></td>
</tr>
<tr>
<td>Absolute mode</td>
<td>@#E</td>
<td><a href="#absolute-mode">Absolute mode</a></td>
</tr>
<tr>
<td>Relative mode</td>
<td>E</td>
<td><a href="#relative-mode">Relative mode</a></td>
</tr>
<tr>
<td>Relative deferred mode</td>
<td>@E</td>
<td><a href="#relative-deferred-mode">Relative deferred</a></td>
</tr>
<tr>
<td>Branch Adressing</td>
<td>Address</td>
<td><a href="#branch-adressing-mode">Branch adressing</a></td>
</tr>
</tbody>
</table><p><strong>Symbols</strong></p>

<table>
<thead>
<tr>
<th>Symbol</th>
<th>Description</th>
</tr>
</thead>
<tbody>
<tr>
<td>E</td>
<td>Any valid expression, see <strong>TODO</strong></td>
</tr>
<tr>
<td>R</td>
<td>A register expression. This means either a percent sign (<strong>%</strong>) followed by a digit between 0 and 7 or an expression declared to refer to such an expression such as <code>R0=%0</code>. The latter can be reused to later declaration such that R1=R0+1. Term order is not strict so <code>1+%1</code>is equivalent to <code>%1+1</code>.</td>
</tr>
<tr>
<td>ER</td>
<td>A register expression (see <strong>R</strong> above) or a digit in the range of 0 through 7. Isn’t octal wonderful…</td>
</tr>
</tbody>
</table><h3 id="register-mode">Register mode</h3>
<p>The value operated on is contained in the register. Hence the operation</p>
<pre><code>CLR R0
</code></pre>
<p>will clear register 0.</p>
<h3 id="register-deferred-mode">Register deferred mode</h3>
<p>The register contains the adress operated on. The following three expressions all clear the word located in register 0 through 2 respectively</p>
<pre><code>CLR @R0 ; Register deferred mode with @-syntax
CLR (R1) ; Register deferred mode using parenthesis
CLR (%1)  ; And register adressing 
</code></pre>
<h3 id="autoincrement-mode">Autoincrement mode</h3>
<p>The register contains the adress operated on but the increment operation is applied post execution of the operation to the value in the register itself. The following three expressions all clear the word located in register 0 through 2 respectively and then increments by 2</p>
<pre><code>CLR (R0)+ ; Register deferred mode with @-syntax
CLR (R1)+ ; Register deferred mode using parenthesis
CLR (%2)+  ; And register adressing 
</code></pre>
<h3 id="autoincrement-deferred-mode">Autoincrement deferred mode</h3>
<p>The register contains a pointer to the adress operated on. Hence</p>
<pre><code>CLR @(R3)+
</code></pre>
<p>Effectively will clear the value held at the adress contained at the adress in R3 and after that is done the R3 value will be incremented by 2.</p>
<h3 id="autodecrement-mode">Autodecrement mode</h3>
<p>See <a href="#autoincrement-mode">autoincrement mode</a>. The only difference is that the operation on the register value happens <strong>PRIOR</strong> to execution of the operation. Hence if R0 contains 100</p>
<pre><code>CLR -(R0)
</code></pre>
<p>R0 will be decremented by 2, leaving R0 as 98 and then the CLR operation will clear the value at adress 98.</p>
<h3 id="autodecrement-deferred-mode">Autodecrement deferred mode</h3>
<p>See <a href="#autoincrement-deferred-mode">Autoincrement deferred</a> for syntax and effect and <a href="#autodecrement-mode">Autodecrement</a> for order of operation differences</p>
<h3 id="index-mode">Index mode</h3>
<p>The value of the register is added to the value of the preceding expression. Hence</p>
<pre><code>CLR 2(R0) ; adress cleared is located at the value of R0 + 2
CLR -1(R0) ; adress cleared is located at the value of R0 + (-1)
CLR X+2(R0) ; adress cleared is located at the value of R0 + (X+2)
</code></pre>
<p>Note that the preceding expression (e.g the E in <code>E(ER)</code>) is evaluated first. This mode can be regarded as <a href="#register-mode">Register mode</a> with an offset.<br>
<strong>IMPORTANT</strong>: The offset is transient, the value of the register remains unchanged</p>
<h3 id="index-deferred-mode">Index deferred mode</h3>
<p>See <a href="#index-mode">Index mode</a> for a brief discussion of the index mode and <a href="#register-deferred-mode">Register deferred mode</a> for a description of the syntax.</p>
<pre><code>CLR @2(R0)  ; The memory adress held at R0 + 2 will be cleared. 
			; That means that if R0 holds 100, the value at memory
			; address 102 will be used as the adress for the CLR
			; operation
</code></pre>
<h3 id="immediate-mode">Immediate mode</h3>
<p>The <strong>#</strong> sign means that the value itself will be used. Hence</p>
<pre><code>MOV #100,R0 
</code></pre>
<p>means that R0 will be set to 100. This is also applied to symbols like</p>
<pre><code>MOV #XYZ,R0
</code></pre>
<p>In which case R0 will be set to the value of XYZ.</p>
<p><strong>NOTE</strong> The <code>MOV</code>instruction is two words in MACRO-11 which means that the width of the instruction is in fact 4 bytes.</p>
<h3 id="absolute-mode">Absolute mode</h3>
<p>See <a href="#immediate-mode">Immediate mode</a>. This can be regarded as the deferred version of immediate mode and as such</p>
<pre><code>CLR @#X ; Will clear the value at the memory adress in X
MOV @#100, R0 ;Set register 0 to the value at the adress 100
</code></pre>
<h3 id="relative-mode">Relative mode</h3>
<p><em><strong>TODO</strong></em></p>
<h3 id="relative-deferred-mode">Relative deferred mode</h3>
<p><em><strong>TODO</strong></em></p>
<h3 id="branch-adressing-mode">Branch adressing mode</h3>
<p>Offset contained (7 bits + sign) in the low order byte in the instruction has the value of the program count +2 (for the execution increment) subtracted from it and the result is divided by two and then added to the program counter.</p>

