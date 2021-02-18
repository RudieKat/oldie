---


---

<h1 id="explaining-stacks">Explaining stacks</h1>
<p>One of the jobs I had as a teenager was as a dishwasher. I worked extra on days off to make money. Maybe you didn’t have to. Well, you missed out in understanding stacks then. You see, when you’re washing dishes in a restaurant, especially one that operates during lunch hours, you work with these piles of plates that are placed in metal tubes so that you can take one off the top and the pile moves up and makes the next plate available.</p>
<p>See. And I also made money. So that’s what you get for being a lazy kid. This is what is referred to as a LIFO stack or Last In First Out. You can compare it to a stack of books on your nightstand. You put books on it and the last one you put there is the first one you pick up from the top. The other kind, which we won’t be talking about, not yet, is the FIFO. The First In First Out. For those of you with a programming background, this is like an array or a list of things. For the rest of you, it’s like writing a shopping list, you write it and the first item remains on top (unless you are a very confused and messy list writer). So the first thing you go looking for is the first thing on your list.</p>
<p>So now that we have a basic idea of what a stack is (a list of things really) we can consider how one is constructed. First of all a stack has to have a space to exist in. So perhaps we say that we have a stack that holds 10 plates. And since we need space for other things we decide that these plates are placed at memory addresses from 0x40 to 0x49. Great. So now we want to add a plate. Where to we put it? We have no plates in our stack at the start and we are expecting to use a LIFO style plate stack, which means whatever we put in last will be the first thing we pull out.</p>

<table>
<thead>
<tr>
<th>Adresss</th>
<th>Value</th>
</tr>
</thead>
<tbody>
<tr>
<td>0x40</td>
<td>0</td>
</tr>
<tr>
<td>0x41</td>
<td>0</td>
</tr>
<tr>
<td>0x42</td>
<td>0</td>
</tr>
<tr>
<td>0x43</td>
<td>0</td>
</tr>
<tr>
<td>0x44</td>
<td>0</td>
</tr>
<tr>
<td>0x45</td>
<td>0</td>
</tr>
<tr>
<td>0x46</td>
<td>0</td>
</tr>
<tr>
<td>0x47</td>
<td>0</td>
</tr>
<tr>
<td>0x48</td>
<td>0</td>
</tr>
<tr>
<td>0x49</td>
<td>0</td>
</tr>
</tbody>
</table><p>In order to interact with this stack we can assume we need to have some functions that help. One to put things onto the stack, commonly called push, one to take things off the stack, commonly called pop. It might also be useful to have one called peek which looks but doesn’t modify the stack. Perhaps we just want to make sure our plate isn’t dirty.</p>
<p>If we decide to start from the top we can say that we need a counter that tells us how many items are already in the stack. It would be set to 0 and we could then add 1 when pushing a plate and subtracting 1 when popping a plate. When the counter was 0 the stack would be empty and when the stack was 0xA it would be full.</p>
<p>This means that we can ask if the stack is empty or if it is in fact full. Perhaps you have heard of the concept “stack overflow”? Yes, there’s a reason for that.</p>
<p>And so far everything sounds quite straight forward. But there are dragons lurking here. Let’s test this out.</p>
<pre><code>.data
	.value 0x123
    .tmp 0x0
    .stack_top 0x40
    .stackp 0x0
    
; MAIN
main:
    add value ; just put this value on the stack
    jcz push

end:

push:
	sav tmp ; we have to save this to temp
    nand zero ;reset
    nand max
    add stackp ; add our pointer
    add stack_top ; add our stacktop
    ;and now what?????
    
; end
</code></pre>
<p>We’re missing something? We have the address but how do we store the value in tmp at the address in R? Oh the humanity. We need to modify some code here. What we need is a storage for the pointer to the stack to store this in and an instruction to load the value in R and store it there, right? Ok, let’s try that.</p>
<pre><code>.data
	.value 0x123
    .tmp 0x0
    .stack_top 0x40
    .stackp 0x0
    .storep 0x0
    
; MAIN
main:
    add value ; just put this value on the stack
    jcz push

end:

push:
	sav tmp ; we have to save this to temp
    nand zero ;reset
    nand max
    add stackp ; add our pointer
    add stack_top ; add our stacktop
    sav storep
    nand zero
    nand max
    add tmp
    sav storep
    nand zero
    nand max
    add stackp
    add one
    sav stackp
    jcz main
    
; end
</code></pre>
<p>Looks great.<br>
But… ummm… it doesn’t seem to work. Try it and you will see. Why? Well, the problem is that storep certainly holds the right adress but using the label … well… you will see for yourself. Instead we need to actually create a new instruction.</p>
<pre><code>.data
	.value 0x123
    .tmp 0x0
    .stack_top 0x40
    .stackp 0x0
    .storep 0x0
    
; MAIN
main:
    add value ; just put this value on the stack
    jcz push

end:

push:
	sav tmp ; we have to save this to temp
    nand zero ;reset
    nand max
    add stackp ; add our pointer
    add stack_top ; add our stacktop
    sav storep ; save the pointer
    add op_sav ; add the op for sav
    sav store_do ; save it to the operation after label
    nand zero ; reset
    nand max
    jcz store
store:
	add tmp
store_do:
	sav 0x0
    nand zero
    nand max
    add stackp
    add one
    sav stackp
    jcz main
    
; end
</code></pre>
<p>I do apologize because this is throwing you right in the deep end. See that label <code>store_do</code>? We can use the following instruction and modify it to write data where we want to. So that’s what we do. And then we increment our pointer and go on.<br>
Go ahead and test it.</p>
<p>If you have a headache now I suggest you take an ibuprofen because the pop isn’t any nicer. It does the same thing, only in reverse.</p>
<pre><code>; Unmutable
.const
    .zero 0
    .one 1
    .max 0xFFFF
    .neg_one 0xFFFE
    .opmask 0xC000
    .addmask 0x3FFF
    .op_nand 0
    .op_add 0x4000
    .op_sav 0x8000
    .op_jcz 0xC000
    .reserve_mutable 0x50
; Mutable variables
.data
    	.value 0x123
        .tmp 0x0
        .stack_top 0x40
        .stackp 0x0
        .storep 0x0
        
    ; MAIN
    main:
        add value ; just put this value on the stack
        jcz push
    main2:
    	jcz pop
    end:
    	sav 0
    
    push:
    	sav tmp ; we have to save this to temp
        nand zero ;reset
        nand max
        add stackp ; add our pointer
        add stack_top ; add our stacktop
        sav storep ; save the pointer
        add op_sav ; add the op for sav
        sav store_do ; save it to the operation after label
        nand zero ; reset
        nand max
        jcz store
    pop:
    	nand zero ;reset
        nand max
        add stackp ; add our pointer
        add stack_top ; add our stacktop
        add max
        add op_add
        sav unstore_do
        nand zero
        nand max
        jcz unstore
    unstore:
       nand zero
       nand max
    unstore_do:
       add 0x0
       sav tmp
       add stackp
       add max
       sav stackp
       nand zero
       nand max
       add tmp
       jcz end
    store:
    	add tmp
    store_do:
    	sav 0x0
        nand zero
        nand max
        add stackp
        add one
        sav stackp
        jcz main2
        
    ; end
</code></pre>
<p>Here it is, complete. But sort of useless as is because we are missing a lot things we need in order to make this actually work for us. You see, a stack is a start but we need to be able to have functions return to predefined positions and take more than one parameter as a value and we are stuck with one register so we are about to take this to a whole new level. But I encourage you to play around with this knowledge and see what you can make of it.</p>

