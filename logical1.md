---


---

<h2 id="youre-back">You’re back?</h2>
<p>Ok. Now let’s talk about what we need to make this really limited thing useful. You may note that I never talked about assembly or linking in the previous post and I will refrain from that now too. But in case you are interested here is the BNF for the little toy language we invented</p>
<pre><code>&lt;program&gt; ::= &lt;expr&gt;* | &lt;variable-declaration&gt; &lt;expr&gt;*
&lt;variable-declaration&gt; ::= &lt;data-block&gt; | &lt;constants-block&gt; | &lt;constants-block&gt; &lt;data-block&gt;
&lt;data-block&gt; ::= ".data" &lt;end-line&gt; &lt;symbol&gt;*
&lt;symbol&gt; ::= &lt;
&lt;end-line&gt; ::= &lt;EOL&gt; | &lt;comment&gt;
&lt;comment&gt; ::= ";" &lt;any-nonfeed-char&gt;* &lt;EOL&gt;
&lt;expr&gt; :: &lt;keyword&gt; &lt;parameter&gt;
&lt;expr&gt; ::= &lt;term&gt;|&lt;expr&gt;&lt;addop&gt;&lt;term&gt;
</code></pre>
<p>Now that we have that out of the we way we need to actually start talking about logical operations because these are the most important.</p>
<h3 id="and">AND</h3>
<p>As you might remember AND is the inverse of NAND. So assuming that a NAND result as 011001 the AND result would be 100110.</p>
<p>Think about this for a second</p>
<p>In the most minimalistic form it would look like this</p>
<p>.</p>
<pre><code>.const 			;We will eventually ignore these
    .zero 0		;as if they were shared constants
    .one 1
    .max 0xFFFF
.data
    .scratch 0x0	;temporary storage
    .a 0x755
    .b 0x418
;FUNCTION START
and_func:  ;this is a label that holds the memory position
    	   ;of the following instruction.... useful?????
add a 	;R is 0 and we add 0x755
nand b	;and we NAND R with 0x418 which gives the inverse AND
sav scratch		;this is cheating for now
nand scractch	; R is NAND with itself and hence the AND is done
</code></pre>
<h2 id="or">OR</h2>
<p>Or is very much what it sounds like, if a bit is set in either value then the result for that position is 1, else it is 0. So<br>
0100110<br>
0011010<br>
would result in<br>
0111110</p>
<pre><code>.const
    .zero 0
	 .one 1 
  .max 0xFFFF
    .a 0x755
    .b 0x802
.data
	.scratch 0
;FUNCTION START
or_func:
add a 		;load a into R
nand a		;nand a (negate)
sav scratch ;sav
nand zero	; reset1
nand max	; reset2, R is now 0
add b		; load b into R
nand b		; negate R
nand scratch	; nand
sav scratch
</code></pre>
<p>At this point it might be worth considering what our standard constants should look like.</p>

