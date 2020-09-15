---


---

<h1 id="some-things-you-should-know">Some things you should know</h1>
<p>When I started this project a while back I looked back at the hardware architectures that came into being around the time of my birth (e.g 50 years or so ago) and that has led to some <em>interesting</em> effects. For some value of interesting.</p>
<p>As you may have noticed there are no specific I/O instructions per se,  instead I/O is mapped to specific memory adressess (or as a value interchange at a specific instruction (generally instruction 0 and I haven’t really bothered doing much else with that). Instead the use of a generic system bus (a la the classic <a href="https://en.wikipedia.org/wiki/Unibus">Unibus</a>) seemed more appropriate even though I will be using some shortcuts to begin with because trying to drag people kicking and screaming into something that fell out of the head of Gordon Bell back in 1969 is probably not a good idea.</p>
<p>But if you’re interested (and who knows, you might be) then have a look.</p>
<p>Interrupts are similarly specific and will be covered fairly soon, basically they consist of a two words (32 consecutive bits) part of the lower memory range that holds</p>
<ul>
<li>the memory address for the interrupt handler</li>
<li>the (optional value) to be sent as a parameter to the handler</li>
</ul>
<p>A proper system would have the possibility to deal with dropping out of Application mode and into Kernel mode (so to speak) to deal with issues like these but who do you take me for?</p>

