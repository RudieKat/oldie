---


---

<h2 id="coodling-in-math-class">Coodling in math class</h2>
<p><em>If you haven’t watched the youtube series Doodling in math class then go do that now. Trust me.</em></p>
<p>Settle down kids. Let’s talk math, I’m your teacher Mrs Badcrumble. As you may have already figured out we know all about addition. Or do we?</p>
<h3 id="addition">Addition</h3>
<p>Yes yes, 1+1 = 2 and so on. But what does 65200 + 561 equal? Don’t be a smartypant, this is a 16 bit lesson and you know it. Anyone?<br>
225, that’s right. Well done, well done. If you don’t get this then you can leave. No, stay. Here’s the thing. We have a total of 16 bits. We can use them to represent a number between 0 and 65535 which is represented as 0b1111 1111 1111 1111. All the ones are taken. So if the result of an addition is larger than our maximum, any bits set above the maximum are lost. So we don’t end up with the maximum value but rather something else.<br>
65200 is<br>
0b1111 1110 1011 0000<br>
561 is<br>
0b0000 0010 0011 0001</p>
<p>A normal addition would result in 65761 which is<br>
0b1 0000 0000 1110 0001<br>
That 0b1 looks suspicious! Yes, it happens to be 65 356 which is out of bounds and so we wave goodbye to it and the result is<br>
0b0000 0000 1110 0001</p>
<p>Now we can take a minute and work a little on this whole binary thing. Since we got so lucky with our example, the example fits neatly into just 8 bits which means we have to do less work and if there is one thing Mrs Badcrumble likes it is less work and flan.</p>
<p>If we take the lowest 8 bits it might be useful for us to see what they represent in decimal (remember the powers of 2).</p>

<table>
<thead>
<tr>
<th>1</th>
<th>1</th>
<th>1</th>
<th>1</th>
<th>1</th>
<th>1</th>
<th>1</th>
<th>1</th>
</tr>
</thead>
<tbody>
<tr>
<td>128</td>
<td>64</td>
<td>32</td>
<td>16</td>
<td>8</td>
<td>4</td>
<td>2</td>
<td>1</td>
</tr>
</tbody>
</table><p>So given the bits we got we can compute the result</p>

<table>
<thead>
<tr>
<th>1</th>
<th>1</th>
<th>1</th>
<th>0</th>
<th>0</th>
<th>0</th>
<th>0</th>
<th>1</th>
</tr>
</thead>
<tbody>
<tr>
<td>128</td>
<td>64</td>
<td>32</td>
<td>0</td>
<td>0</td>
<td>0</td>
<td>0</td>
<td>1</td>
</tr>
</tbody>
</table><p>Add up 128+64+32+1 for a surprising 225.</p>
<p>However, something else also occurs, the Arithmetic Logic Unit which handles the addition registers the overflow (that the result was larger than 16 bits) by setting the Carry Bit. And as you recall (or don’t) the Carry Bit is used in the JCZ (Jump if Carry Bit is Zero) instruction. In this case that would evaluate to false so there would be no jump to another instruction, instead the instruction counter is incremented as per usual.</p>
<h3 id="subtraction">Subtraction</h3>
<p>I hear you groan. How would you be able to subtract if you can only add. But you forget our good friend NAND. For you see we can do a bit of trickery here.</p>
<p>Let’s say we have a variable a set to 100 and a variable b set to 80. We want to compute the age old question of what 100-80 is. And now you actually may have to use your brains for a bit because this is a little trickier than it sounds.<br>
First we</p>
<pre><code>add a
</code></pre>
<p>This means that our register R is now 100 (or 0x64 if you want to be hexadecimal which is probably wise from this point on).<br>
Next we</p>
<pre><code>nand a
</code></pre>
<p>The instruction will set all bits that are 0 in 0x64 to 1 resulting in 0xFF9B. And since that is actually 0xFFFF - 0x64 we have made some magic. If we now do</p>
<pre><code>add b
</code></pre>
<p>We get 0xFFEB which is actually 0xFFFF-0x64 + 0x50. Oh, 80 is 0x50 in hexadecimal. So the only thing we need to do now is to inverse the bits again. And we do this by using</p>
<pre><code>nand max
</code></pre>
<p>for a result of 0x14 (or 20) and we have finally solved the question of 100-80. And substraction.</p>
<pre><code>    add a
    nand a
    add b
    nand max
</code></pre>
<p>Now, good code hygiene tells us to always clear R before running operations so remember to do</p>
<pre><code>nand zero
nand max
</code></pre>
<p>for setting R to 0.</p>
<p>And there it is. Subtraction. But what if it’s the other way around? 80-100?</p>
<p>What happens is that in the</p>
<pre><code>add b
</code></pre>
<p>step the carry bit is set because the total will go from 0xFFAF to 0x13 and create an overflow. This can be used to great effect but it also means that we can have a JCZ instruction that is basically a continue if a &gt; b. But wait. Doesn’t that also mean??? We’ll get to that kids.</p>
<h3 id="multiplication">Multiplication</h3>
<p>Multiplication is repeated addition. I am fairly certain that this comes a no surprise. So here we have to start thinking about (because I’m not going to overcomplicate things) loops.<br>
A loop is very common structure when programming. You might loop WHILE some condition holds true like</p>
<pre><code>while (raining==true) {
	use_umbrella();
}
</code></pre>
<p>Or you might loop with a counter. For example if you want to play hide and seek.</p>
<pre><code>for(start=0; start &lt; 100; start+=1) {
	avoid_peeking();
}
</code></pre>
<p>Note that neither example is code that any sane person would ever write, nor is it from any particular language. But perhaps you understand what happened.</p>
<p>So now we want to multiple 5 by 4. Hmmmm. We will need some way of knowing how many times we have added 5 to itself. And if you recall, there is a trick we can use that we saw when subtracting.</p>
<p>So how about we</p>
<pre><code>data
	.value 5
	.multiplier 4
	.total 0x200 ;a memory address
	.counter 0x201 ; another memory address    	.
	multiply: ;A label
	nand zero
	nand max 	;reset R to 0
	add multiplier ; R=4
	nand multiplier ; R=0xfffb
	sav counter ;save the value to the counter
	;loop timme
	multi_loop:
	nand zero
	nand max
	add value	; R= 5
	add total	; R = 5
	sav total
	nand zero
	nand max
	add counter ; R=0xfffb
	add one		; R=0xFFFC
	sav counter
	jcz multi_loop ;
</code></pre>
<p>And now it’s time for you to think. What happens here and will it provide the correct answer.</p>
<p>I will tell you when we start twiddling our <a href="/oldie/bitops.html">bits</a></p>

