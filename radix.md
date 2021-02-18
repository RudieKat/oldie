---


---

<h2 id="radix-50">Radix-50</h2>
<p>Radix-50 is a tricky beast since it encodes in a slightly bizarre fashion. They push three characters inside a 16-bit word by using the following model. Take a three character string, for example FOO. It will get encoded as<br>
<code>F* (40*40) + O*40 + O</code><br>
Or perhaps clearer<br>
<code>6*1600 + 15*40 + 15</code><br>
Decoding it is reminiscent of dealing with a right bitshift in a way.<br>
Assuming we have 0x27E7 (or 10215) for three characters we can simply subtract 1600 until the Carry Bit is set. Let’s try that</p>
<pre><code>10215 - 1600 = 8615 (add 1 to our top value)
8615 - 1600 = 7015 (add 1 - total 2)
7015 - 1600 = 5415 ( add 1 - total 3)
5415 - 1600 = 3815 (add 1 - total 4)
3815 - 1600 = 2215 (add 1 - total 5)
2215 - 1600 = 615 ( add 1 - total 6)
Next iteration triggers the Carry Bit so our first char is 6
Do the same with 40 for the mid char and the remainder when done is the third one. Fortunately this was mainly used in the RT-11 file system 
</code></pre>

<table>
<thead>
<tr>
<th align="left">Character</th>
<th align="center">Dec</th>
<th align="center">Binary</th>
<th align="center">Hex</th>
</tr>
</thead>
<tbody>
<tr>
<td align="left">SPACE</td>
<td align="center">0</td>
<td align="center">000000</td>
<td align="center">0x0</td>
</tr>
<tr>
<td align="left">A</td>
<td align="center">1</td>
<td align="center">000001</td>
<td align="center">0x1</td>
</tr>
<tr>
<td align="left">B</td>
<td align="center">2</td>
<td align="center">000010</td>
<td align="center">0x2</td>
</tr>
<tr>
<td align="left">C</td>
<td align="center">3</td>
<td align="center">000011</td>
<td align="center">0x3</td>
</tr>
<tr>
<td align="left">D</td>
<td align="center">4</td>
<td align="center">000100</td>
<td align="center">0x4</td>
</tr>
<tr>
<td align="left">E</td>
<td align="center">5</td>
<td align="center">000101</td>
<td align="center">0x5</td>
</tr>
<tr>
<td align="left">F</td>
<td align="center">6</td>
<td align="center">000110</td>
<td align="center">0x6</td>
</tr>
<tr>
<td align="left">G</td>
<td align="center">7</td>
<td align="center">000111</td>
<td align="center">0x7</td>
</tr>
<tr>
<td align="left">H</td>
<td align="center">8</td>
<td align="center">001000</td>
<td align="center">0x8</td>
</tr>
<tr>
<td align="left">I</td>
<td align="center">9</td>
<td align="center">001001</td>
<td align="center">0x9</td>
</tr>
<tr>
<td align="left">J</td>
<td align="center">10</td>
<td align="center">001010</td>
<td align="center">0xA</td>
</tr>
<tr>
<td align="left">K</td>
<td align="center">11</td>
<td align="center">001011</td>
<td align="center">0xB</td>
</tr>
<tr>
<td align="left">L</td>
<td align="center">12</td>
<td align="center">001100</td>
<td align="center">0xC</td>
</tr>
<tr>
<td align="left">M</td>
<td align="center">13</td>
<td align="center">001101</td>
<td align="center">0xD</td>
</tr>
<tr>
<td align="left">N</td>
<td align="center">14</td>
<td align="center">001110</td>
<td align="center">0xE</td>
</tr>
<tr>
<td align="left">O</td>
<td align="center">15</td>
<td align="center">001111</td>
<td align="center">0xF</td>
</tr>
<tr>
<td align="left">P</td>
<td align="center">16</td>
<td align="center">010000</td>
<td align="center">0x10</td>
</tr>
<tr>
<td align="left">Q</td>
<td align="center">17</td>
<td align="center">010001</td>
<td align="center">0x11</td>
</tr>
<tr>
<td align="left">R</td>
<td align="center">18</td>
<td align="center">010010</td>
<td align="center">0x12</td>
</tr>
<tr>
<td align="left">S</td>
<td align="center">19</td>
<td align="center">010011</td>
<td align="center">0x13</td>
</tr>
<tr>
<td align="left">T</td>
<td align="center">20</td>
<td align="center">010100</td>
<td align="center">0x14</td>
</tr>
<tr>
<td align="left">U</td>
<td align="center">21</td>
<td align="center">010101</td>
<td align="center">0x15</td>
</tr>
<tr>
<td align="left">V</td>
<td align="center">22</td>
<td align="center">010110</td>
<td align="center">0x16</td>
</tr>
<tr>
<td align="left">W</td>
<td align="center">23</td>
<td align="center">010111</td>
<td align="center">0x17</td>
</tr>
<tr>
<td align="left">X</td>
<td align="center">24</td>
<td align="center">011000</td>
<td align="center">0x18</td>
</tr>
<tr>
<td align="left">Y</td>
<td align="center">25</td>
<td align="center">011001</td>
<td align="center">0x19</td>
</tr>
<tr>
<td align="left">Z</td>
<td align="center">26</td>
<td align="center">011010</td>
<td align="center">0x1A</td>
</tr>
<tr>
<td align="left">$</td>
<td align="center">27</td>
<td align="center">011011</td>
<td align="center">0x1B</td>
</tr>
<tr>
<td align="left">.</td>
<td align="center">28</td>
<td align="center">011100</td>
<td align="center">0x1C</td>
</tr>
<tr>
<td align="left">%</td>
<td align="center">29</td>
<td align="center">011101</td>
<td align="center">0x1D</td>
</tr>
<tr>
<td align="left">0</td>
<td align="center">30</td>
<td align="center">011110</td>
<td align="center">0x1E</td>
</tr>
<tr>
<td align="left">1</td>
<td align="center">31</td>
<td align="center">011111</td>
<td align="center">0x1F</td>
</tr>
<tr>
<td align="left">2</td>
<td align="center">32</td>
<td align="center">100000</td>
<td align="center">0x20</td>
</tr>
<tr>
<td align="left">3</td>
<td align="center">33</td>
<td align="center">100001</td>
<td align="center">0x21</td>
</tr>
<tr>
<td align="left">4</td>
<td align="center">34</td>
<td align="center">100010</td>
<td align="center">0x22</td>
</tr>
<tr>
<td align="left">5</td>
<td align="center">35</td>
<td align="center">100011</td>
<td align="center">0x23</td>
</tr>
<tr>
<td align="left">6</td>
<td align="center">36</td>
<td align="center">100100</td>
<td align="center">0x24</td>
</tr>
<tr>
<td align="left">7</td>
<td align="center">37</td>
<td align="center">100101</td>
<td align="center">0x25</td>
</tr>
<tr>
<td align="left">8</td>
<td align="center">38</td>
<td align="center">100110</td>
<td align="center">0x26</td>
</tr>
<tr>
<td align="left">9</td>
<td align="center">39</td>
<td align="center">100111</td>
<td align="center">0x27</td>
</tr>
</tbody>
</table>
