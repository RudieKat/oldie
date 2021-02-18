---


---

<h2 id="plus-ça-change">Plus ça change?</h2>
<p>So what are we talking about? Let’s say we have two jars into which we put candy. You choose your favourite kind. Now you put 20 of pieces of candy (NO CHEATING) into each of them. Then you painstakingly write two labels. One saying CONSTANTCANDY and one saying  GETYOURCANDYHERE. Now superglue a lid to one jar and label it CONSTANTCANDY and leave the other one open. We can now be certain that the CONSTANTCANDY jar contains 20 pieces of candy while it’s more than likely that the other one is empty. Oh come on, you know you’d eat them after doing all that work. So constants are values that are WRITE ONCE. We will talk about the muteable variables later.</p>
<h3 id="good-stuffs">GOOD STUFFS</h3>
<p>0 and 1 are good things to have access to since we don’t allow the use of actual values other than when declaring variables. Everything else is an address.</p>
<p>So in order for us to, for example get the value 17 we actually need to either have 17 declared as a variable or to calculate it somehow. Yes. this makes certain things complicated, but think about it. If you are writing software, how often do you need a number which you don’t know at the point of writing? Generally only when you are in need of some random number or a value which is the input of the user or some other process.</p>
<p>Anyway.  You maybe noticed that we used 0 and 0xFFFF to reset the R register to 0. This is a bit of a nifty mathematical trick. Let’s say you have a value in R which is 4011. If you NAND 4011 with 0 the result will be 0xFFFF and if you NAND 0xFFFF with 0xFFFF the result is 0. Hence R is reset to 0.<br>
This seems like an awfully complicated way to do something that intuitively you might think could be done by simply saying R - R but remember, we can only add, not subtract.</p>
<p>So useful constants are<br>
0, 1 and 0xFFFF. But there are others and in order to save us time I will go over them quickly</p>
<pre><code>const
  .zero 0
  .one 1
  .two 2
  .three 3
  .four 4
  .five 5
  .six 6
  .seven 7
  .sixteen 0x10
  .not_sixteen 0xFFEF
  .max 0xFFFF
  .neg_one 0xFFFE
  .opmask 0xC000
  .addmask 0x3FFF
  .op_nand 0
  .op_add 0x4000
  .op_sav 0x8000
  .op_jcz 0xC000
</code></pre>
<p>Many of these will make little sense until later but a few are important early on. The ones that are called <code>op_nand</code> etc are the opcodes. We can use them to write something very important which is self modifying code. The .<code>opmask</code> and .<code>addmask</code> are involved in similar operations. And soon enough you will become familiar with the importance of neg_one. So there are our constants to begin with. Now. let’s move on to our next little chapter where we go back to <a href="/oldie/arithmetic.html">math class.</a></p>

