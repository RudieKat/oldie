---


---

<h2 id="shall-i-compare-thee">Shall I compare thee</h2>
<p>A is A, said Ayn Rand and the less said about her the better (suffice to say, she was full of crap, about as competent a political thinker as a bag of rocks) but we do need a way to compare things to each other. Typically we can boil these down to three different comparisons.</p>
<ul>
<li>Equals</li>
<li>Greater than</li>
<li>Less than</li>
</ul>
<p>We have actually already touched on the very specific mechanism we can use to achieve these types of comparisons and if you guessed that it as the carry bit you guessed correctly. Well done Harry, use the force and all that.<br>
Let’s say that we want to compare 4 to 4 and see if they are equal, how do we do this? I will argue here that the BEST way of doing this is to use the carry bit in a very specific way.</p>
<pre><code>.data
	.a 0x04
	.b 0x04
;equality
main:
	add a ; R=4
	nand a ; R=0xfffb
	add one	; R=0xfffc
	add b	; R=0x0 carry bit set
	jcz non_equal ; if numbers are non equal jump
	;add logic for handling equality
non_equal:
	;add logic for handling non equality
</code></pre>
<p>But wait. This isn’t quite true, is it? It would also hold true if b was larger than a. Hmmm. But how about this then.</p>
<pre><code>.data
    	.a 0x04
    	.b 0x04
    ;equality
    main:
    	add a ; R=4
    	nand a ; R=0xfffb
    	add b	; R=0xffff
    	;if the carry bit is set then b &gt; a
    	add one
    	;if the carry but is set then b == a
    	;if the carry bit is not set then b &lt; a
</code></pre>
<p>Now you need to sit down on your own and think about how to use this particular bit of magic because we’re about to to start doing a lot of trickery and you might want to feel comfortable with the use of the jcz and carry bit before we head into deep dark arts of self modifying code and stacks. I suggest heading over to the <a href="/oldie/emu.html">emulator</a></p>

