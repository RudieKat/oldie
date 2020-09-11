---


---

<h2 id="how-much-for-that-xor">How much for that XOR?</h2>
<p>Before we start jumping around too much there’s one more thing that can be vexing and complex and that is XOR. It’s one of those functions that is used very often in things like basic cryptography for example and not understanding what it does and works is kind of problematic. I very often run into people who have serious issues understanding code that uses XOR in various ways.</p>
<p>X in XOR stands for Exclusive and what it means it’s ONE but not both inputs can be true for the output of the XOR function to be true.<br>
A truth table is probably instructive here so</p>

<table>
<thead>
<tr>
<th>INPUT A</th>
<th>INPUT B</th>
<th>OUTPUT</th>
</tr>
</thead>
<tbody>
<tr>
<td>FALSE (0)</td>
<td>FALSE (0)</td>
<td>FALSE(0)</td>
</tr>
<tr>
<td>FALSE (0)</td>
<td>TRUE (1)</td>
<td>TRUE(1)</td>
</tr>
<tr>
<td>TRUE (1)</td>
<td>FALSE (0)</td>
<td>TRUE(1)</td>
</tr>
<tr>
<td>TRUE (1)</td>
<td>TRUE (1)</td>
<td>FALSE(0)</td>
</tr>
</tbody>
</table><p>What often confuses people it seems is the X part. The idea that one and only one input can be true seems somehow to run counter to the intuitive understanding of what they expect from the function.<br>
But now that you hopefully understand it let’s see if we can build it.</p>
<p>So far we haven’t really talked much about why we are using NAND rather than NOR which would be a more common choice. The reason is that while both are functionally complete, NAND gates were originally the components that were used to build to build these functions in hardware. I admit to being a tad bit nostalgic but I also argue that there is a value in conquering the counterintuitive nature of adding logical functions to build more complex ones.</p>
<p>In this case I will actually do it without writing code and instead try to see if I can explain it another way. Consider, if you will a box with two inputs: A and B.<br>
In this box you now construct two extra values<br>
A NAND A<br>
and<br>
B NAND B<br>
We can call then A’ and B’ (which is inherently incorrect but I’m lazy and it makes things easier.<br>
Now. We construct two more values by doing<br>
A NAND B’<br>
B NAND A’<br>
And we can call those UP and DOWN respectively.<br>
UP NAND DOWN<br>
is the equivalent of A XOR B.</p>
<p>I plan to, at some point, add illustrations here showing this using the classic gate icons but the most interesting part is really that what we do is reuse other functions (go back and look at our previous venture into logical functions) again to achieve our goal. And with XOR in place, especially when we consider how we could do XOR more efficiently, it’s time to talk about stacks.</p>

