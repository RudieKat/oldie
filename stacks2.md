---


---

<h1 id="the-why-of-stacks">The why of stacks</h1>
<p>Now that you know a little something about stacks perhaps we should talk about why they are important. You see, stacks are a concept that have a very long history. Even though I promised we’d avoid the history of computer science, you should know that Alan Turing wrote about stacks in 1946 (although he used the terms bury and unbury/disinter) and while we, in our previous example, only used them to store a single value, this is not the primary purpose the first stack is for.</p>
<p>Generally referred to as the call stack, execution stack or machine stack (along with many other names) it has the specific purpose of keeping track of the current frame for reference. It can be used to store local variables temporarily during the execution of a specific subroutine (or function if you will) but it can also deal with return state, parameter passing and many other things that become very important the more complex things we want to achieve.</p>
<p>Let’s assume that we have a subroutine that has two numbers that it needs multiplied before it can go on and finish what it is supposed to do. In some higher level language it might look like this</p>
<pre><code>func magic(int a, int b) {
	return multiply(a,b)+7;
}
func multiply(int a, int b) {
	return a*b;
}
</code></pre>
<p>Now if someone would call magic, magic would in turn call multiply which would return the result of the multiplication which would then have the ever magical number 7 added to it. Obviously this is as contrived as can be but the point is quite simple, not only does the function magic need to know where to return its value but so does multiply and both of them need to keep track of their parameters.</p>
<p>If we have a stack where we place our parameters and our return address we can easily support a complex flow. For example we could define a stack frame (e.g more than a single line or address) as the number of parameters and the return address. Multiply would then require two spaces for parameters and one for the return address and Magic the same. So if we pretend that our stack contains actual numeric values and that the caller of the magic function is a function called main then perhaps the stack would evolve like this</p>

<table>
<thead>
<tr>
<th></th>
<th></th>
<th></th>
</tr>
</thead>
<tbody>
<tr>
<td>frame 1</td>
<td>return</td>
<td>main</td>
</tr>
<tr>
<td>frame 1</td>
<td>param1</td>
<td>10</td>
</tr>
<tr>
<td>frame 1</td>
<td>param2</td>
<td>6</td>
</tr>
</tbody>
</table><p>Now magic calls multiply</p>

<table>
<thead>
<tr>
<th></th>
<th></th>
<th></th>
</tr>
</thead>
<tbody>
<tr>
<td>frame 1</td>
<td>return</td>
<td>main</td>
</tr>
<tr>
<td>frame 1</td>
<td>param1</td>
<td>10</td>
</tr>
<tr>
<td>frame 1</td>
<td>param2</td>
<td>6</td>
</tr>
<tr>
<td>frame 2</td>
<td>return</td>
<td>multiply</td>
</tr>
<tr>
<td>frame 2</td>
<td>param1</td>
<td>10</td>
</tr>
<tr>
<td>frame 2</td>
<td>param2</td>
<td>6</td>
</tr>
</tbody>
</table><p>Multiply executes</p>

<table>
<thead>
<tr>
<th></th>
<th></th>
<th></th>
</tr>
</thead>
<tbody>
<tr>
<td>frame 1</td>
<td>return</td>
<td>main</td>
</tr>
<tr>
<td>frame 1</td>
<td>param1</td>
<td>10</td>
</tr>
<tr>
<td>frame 1</td>
<td>param2</td>
<td>6</td>
</tr>
<tr>
<td>frame 2</td>
<td>result</td>
<td>60</td>
</tr>
</tbody>
</table><p>And finally Magic executes</p>

<table>
<thead>
<tr>
<th></th>
<th></th>
<th></th>
</tr>
</thead>
<tbody>
<tr>
<td>frame 1</td>
<td>result</td>
<td>67</td>
</tr>
</tbody>
</table><p>There are of course any number of ways to deal with this kind of issue, I am trying to use one here which makes some sort of sense at least. In this case the “lowest” (the highest numbered) frame is the active frame. For more on call stacks I suggest you read the excellent article on the subject on <a href="https://en.wikipedia.org/wiki/Call_stack">wikipedia</a>  which delves into the subject in far more detail than I can and will. That won’t stop us from moving forward and building exactly this: a call stack. Because once we have that then we can have more fun. But perhaps we should take a bit of a sanity break and do something else in between. How about we instead talk about serial interfaces. No that sounds boring. Let’s just say it’s text. Let’s next talk about text.</p>

