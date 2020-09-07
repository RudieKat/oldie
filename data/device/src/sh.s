0001: / sh -- command interpreter
0002: 	mov	sp,r5
0003: 	mov	r5,shellarg / save orig sp in shellarg
0004: 	cmpb	*2(r5),$'- / was this sh calleZd by init or loginx~
0005: 	bne	2f / no
0006: 	sys	intr; 0 / yes, turn off interrupts
0007: 	sys	quit; 0
0008: 2:
0009: 	sys	getuid / who is user
0010: 	tst	r0 / is it superuser
0011: 	bne	2f / no
0012: 	movb	$'#,at / yes, set new prompt symbol
0013: 2:
0014: 	cmp	(r5),$1 / tty input?
0015: 	ble	newline / yes, call with '-(or with no command
0016: 		        / file name)
0017: 	clr	r0 / no, set ttv
0018: 	sys	close / close it
0019: 	mov	4(r5),0f / get new file name
0020: 	sys	open; 0:..; 0 / open it
0021: 	bec	1f / branch if no error
0022: 	jsr	r5,error / error in file name
0023: 		<Input not found\n\0>; .even
0024: 	sys	exit
0025: 1:
0026: 	clr	at / clear prompt character, if reading non-tty
0027: 		   / input file
0028: newline:
0029: 	tst	at / is there a prompt symbol
0030: 	beq	newcom / no
0031: 	mov	$1,r0 / yes
0032: 	sys	write; at; 2. / print prompt
0033: newcom:
0034: 	mov	shellarg,sp /
0035: 	mov	$parbuf,r3 / initialize command list area
0036: 	mov	$parp,r4 / initialize command list pointers
0037: 	clr	infile / initialize alternate input
0038: 	clr	outfile / initialize alternate output
0039: 	clr	glflag / initialize global flag
0040: newarg:
0041: 	jsr	pc,blank / squeeze out leading blanks
0042: 	jsr	r5,delim / is new character a ; \n or &
0043: 		br 2f / yes
0044: 	mov	r3,-(sp) / no, push arg pointer onto stack
0045: 	cmp	r0,$'< / new input file?
0046: 	bne	1f / no
0047: 	mov	(sp),infile / yes, save arg pointer
0048: 	clr	(sp) / clear pointer
0049: 	br	3f
0050: 1:
0051: 	cmp	r0,$'> / new output file?
0052: 	bne	newchar / no
0053: 	mov	(sp),outfile / yes, save arg pointer
0054: 	clr	(sp) / clear pointer
0055: 	br	3f
0056: newchar:
0057: 	cmp	$' ,r0 / is character a blank
0058: 	beq	1f / branch if it is (blank as arg separator)
0059: 	cmp	$'\n+200,r0 / treat \n preceded by \
0060: 	beq	1f / as blank
0061: 	jsr	pc,putc / put this character in parbuf list
0062: 3:
0063: 	jsr	pc,getc / get next character
0064: 	jsr	r5,delim / is char a ; \n or &,
0065: 		br 1f / yes
0066: 	br	newchar / no, start new character tests
0067: 1:
0068: 	clrb	(r3)+ / end name with \0 when read blank, or
0069: 		      / delim
0070: 	mov	(sp)+,(r4)+ / move arg ptr to parp location
0071: 	bne	1f / if (sp)=0, in file or out file points to arg
0072: 	tst	-(r4) / so ignore dummy (0), in pointer list
0073: 1:
0074: 	jsr	r5,delim / is char a ; \n or &.
0075: 		br 2f / yes
0076: 	br	newarg / no, start newarg processing
0077: 2:
0078: 	clr	(r4) / \n, &, or ; takes to here (end of arg list)
0079: 		     / after 'delim' call
0080: 	mov	r0,-(sp) / save delimter in stack
0081: 	jsr	pc,docom / go to exec command in parbuf
0082: 	cmpb	(sp),$'& / get a new command without wait?
0083: 	beq	newcom / yes
0084: 	tst	r1 / was chdir just executed or line ended with
0085: 		   / ampersand?
0086: 	beq	2f / yes
0087: 1:
0088: 	sys	wait / no, wait for new process to terminate
0089: 		     / command executed)
0090: 	bcs	2f / no, children not previously waited for
0091: 	cmp	r0,r1 / is this my child
0092: 	bne	1b
0093: 2:
0094: 	cmp	(sp),$'\n / was delimiter a new line
0095: 	beq	newline / yes
0096: 	br	newcom / no, pick up next command
0097: docom:
0098: 	sub	$parp,r4 / out arg count in r4
0099: 	bne	1f / any arguments?
0100: 	clr	r1 / no, line ended with ampersand
0101: 	rts	pc / return from call
0102: 1:
0103: 	jsr	r5,chcom; qchdir / is command chdir?
0104: 		br 2f / command not chdir
0105: 	cmp	r4,$4 / prepare to exec chdir, 4=arg count x 2
0106: 	beq	3f
0107: 	jsr	r5,error / go to print error
0108: 		<Arg count\n\0>; .even
0109: 	br	4f
0110: 3:
0111: 	mov	parp+2,0f / more directory name to sys coll
0112: 	sys	chdir; 0:0 / exec chdir
0113: 	bec	4f / no error exit
0114: 	jsr	r5,error / go to print error
0115: 		<Bad directory\n\0>; .even / this diagnostic
0116: 4:
0117: 	clr	r1 / set r1 to zero to dkip wait
0118: 	rts	pc / and return
0119: 2:
0120: 	jsr	r5,chcom; glogin / is command login?
0121: 		br 2f / not loqin, go to fork
0122: 	sys	exec; parbuf; parp / exec login
0123: 	sys	exec; binpb; parp / or /bin/login
0124: 2: / no error return??
0125: 	sys	fork / generate sh child process for command
0126: 		br newproc / exec command with new process
0127: 	bec	1f / no error exit, old orocess
0128: 	jsr	r5,error / go to print error
0129: 		<Try again\n\0>; .even / this diaonostic
0130: 	jmp	newline / and return for next try
0131: 1:
0132: 	mov	r0,r1 / save id of child sh
0133: 	rts	pc / return to "jsr pc, docom" call in parent sh
0134: 
0135: error:
0136: 	movb	(r5)+,och / pick up diagnostic character
0137: 	beq	1f / 0 is end of line
0138: 	mov	$1,r0 / set for tty output
0139: 	sys	write; och; 1 / print it
0140: 	br	error / continue to get characters
0141: 1:
0142: 	inc	r5 / inc r5 to point to return
0143: 	bic	$1,r5 / make it even
0144: 	clr	r0 / set for input
0145: 	sys	seek; 0; 2 / exit from runcom. skip to end of
0146: 		           / input file
0147: chcom: / has no effect if tty input
0148: 	mov	(r5)+,r1 / glogin gchdir r1, bump r5
0149: 	mov	$parbuf,r2 / command address  r2 'login'
0150: 1:
0151: 	movb	 (r1)+,r0 / is this command 'chdir'
0152: 	cmpb	(r2)+,r0 / compare command name byte with 'login'
0153: 		         / or 'chdir'
0154: 	bne	1f / doesn't compare
0155: 	tst	r0 / is this
0156: 	bne	1b / end of names
0157: 	tst	(r5)+ / yes, bump r5 again to execute login
0158: 		      / chdir
0159: 1:
0160: 	rts	r5 / no, return to exec command
0161: 
0162: putc:
0163: 	cmp	r0,$'' / single quote?
0164: 	beq	1f / yes
0165: 	cmp	r0,$'" / double quote
0166: 	beq	1f / yes
0167: 	bic	$!177,r0 / no, remove 200, if present
0168: 	movb	r0,(r3)+ / store character in parbuf
0169: 	rts	pc
0170: 1:
0171: 	mov	r0,-(sp) / push quote mark onto stack
0172: 1:
0173: 	jsr	pc,getc / get a quoted character
0174: 	cmp	r0,$'\n / is it end or line
0175: 	bne	2f / no
0176: 	jsr	r5,error / yes, indicate missing quote mark
0177: 		<"' imbalance\n\0>; .even
0178: 	jmp	newline / ask for new line
0179: 2:
0180: 	cmp	r0,(sp) / is this closing quote mark
0181: 	beq	1f / yes
0182: 	bic	$!177,r0 / no, strip off 200 if present
0183: 	movb	r0,(r3)+ / store quoted character in parbuf
0184: 	br	1b / continue
0185: 1:
0186: 	tst	(sp)+ / pop quote mark off stack
0187: 	rts	pc / return
0188: 
0189: / thp`e new process
0190: 
0191: newproc:
0192: 	mov	infile,0f / move pointer to new file name
0193: 	beq	1f / branch if no alternate read file given
0194: 	tstb	*0f
0195: 	beq	3f / branch if no file name miven
0196: 	clr	r0 / set tty input file name
0197: 	sys	close / close it
0198: 	sys	open; 0:..; 0 / open new input file for reading
0199: 	bcc	1f / branch if input file ok
0200: 3:
0201: 	jsr	r5,error / file not ok, print error
0202: 		<Input file\n\0>; .even / this diagnostic
0203: 	sys	exit / terminate this process and make parent sh
0204: 1:
0205: 	mov	outfile,r2 / more pointer to new file name
0206: 	beq	1f / branch if no alternate write file
0207: 	cmpb	(r2),$'> / is > at beqinninrg of file name?
0208: 	bne	4f / branch if it isn't
0209: 	inc	r2 / yes, increment pointer
0210: 	mov	r2,0f
0211: 	sys	open; 0:..; 1 / open file for writing
0212: 	bec	3f / if no error
0213: 4:
0214: 	mov	r2,0f
0215: 	sys	creat; 0:..; 17 / create new file with this name
0216: 	bec	3f / branch if no error
0217: 2:
0218: 	jsr	r5,error
0219: 		<Output file\n\0>; .even
0220: 	sys	exit
0221: 3:
0222: 	sys	close / close the new write file
0223: 	mov	r2,0f / move new name to open
0224: 	mov	$1,r0 / set ttv file name
0225: 	sys	close / close it
0226: 	sys	open; 0:..; 1 / open new output file, it now has
0227: 		              / file descriptor 1
0228: 	sys	seek; 0; 2 / set pointer to current end of file
0229: 1:
0230: 	tst	glflag / was *, ? or [ encountered?
0231: 	bne	1f / yes
0232: 	sys	exec; parbuf; parp / no, execute this commend
0233: 	sys	exec; binpb; parp / or /bin/this command
0234: 2:
0235: 	sys	stat; binpb; inbuf / if can't execute does it
0236: 		                   / exist?
0237: 	bes	2f / branch if it doesn't
0238: 	mov	$shell,parp-2 / does exist, not executable
0239: 	mov	$binpb,parp / so it must be
0240: 	sys	exec; shell; parp-2 / a command file, get it with
0241: 		                    / sh /bin/x (if x name of file)
0242: 2:
0243: 	jsr	r5,error / a return for exec is the diagnostic
0244: 		<No command\n\0>; .even
0245: 	sys	exit
0246: 1:
0247: 	mov	$glob,parp-2 / prepare to process *,?
0248: 	sys	exec; glob; parp-2 / execute modified command
0249: 	br	2b
0250: 
0251: delim:
0252: 	cmp	r0,$'\n / is character a newline
0253: 	beq	1f
0254: 	cmp	r0,$'& / is it &
0255: 	beq	1f / yes
0256: 	cmp	r0,$'; / is it ;
0257: 	beq	1f / yes
0258: 	cmp	r0,$'? / is it ?
0259: 	beq	3f
0260: 	cmp	r0,$'[ / is it beginning of character string
0261: 		       / (for glob)
0262: 	bne	2f
0263: 3:
0264: 	inc	glflag / ? or * or [ set flag
0265: 2:
0266: 	tst	(r5)+ / bump to process all except \n,;,&
0267: 1:
0268: 	rts	r5
0269: 
0270: blank:
0271: 	jsr	pc,getc / get next character
0272: 	cmp	$' ,r0 / leading blanks
0273: 	beq	blank / yes, 'squeeze out'
0274: 	cmp	r0,$200+'\n / new-line preceded by \ is translated
0275: 	beq	blank / into blank
0276: 	rts	pc
0277: getc:
0278: 	tst	param / are we substituting for $n
0279: 	bne	2f/ yes
0280: 	mov	inbufp,r1 / no, move normal input pointer to r1
0281: 	cmp	r1,einbuf / end of input line?
0282: 	bne	1f / no
0283: 	jsr	pc,getbuf / yes, put next console line in buffer
0284: 	br	getc
0285: 1:
0286: 	movb	(r1)+,r0 / move byte from input buffer to r0
0287: 	mov	r1,inbufp / increment routine
0288: 	bis	escap,r0 / if last character was \ this adds
0289: 		         / 200 to current character
0290: 	clr	escap / clear, so escap normally zero
0291: 	cmp	r0,$'\\ / note that \\ is equal \ in as
0292: 	beq	1f
0293: 	cmp	r0,$'$ / is it $
0294: 	beq	3f / yes
0295: 	rts	pc / no
0296: 1:
0297: 	mov	$200,escap / mark presence of \ in command line
0298: 	br	getc / get next character
0299: 2:
0300: 	movb	*param,r0 / pick up substitution character put in
0301: 		          / r0
0302: 	beq	1f / if end of substitution arg, branch
0303: 	inc	param / if not end, set for next character
0304: 	rts	pc / return as though character in ro is normal
0305: 		   / input
0306: 1:
0307: 	clr	param / unset substitution pointer
0308: 	br	getc / get next char in normal input
0309: 3:
0310: 	jsr	pc,getc / get digit after $
0311: 	sub	$'0,r0 / strip off zone bits
0312: 	cmp	r0,$9. / compare with digit 9 
0313: 	blos	1f / less than or equal 9
0314: 	mov	$9.,r0 / if larger than 9, force 9
0315: 1:
0316: 	mov	shellarg,r1 / get pointer to stack for
0317: 		            / this call of shell
0318: 	inc	r0 / digit +1
0319: 	cmp	r0,(r1) / is it less than # of args in this call
0320: 	bge	getc / no, ignore it. so this $n is not replaced
0321: 	asl	r0 / yes, multiply by 2 (to skip words)
0322: 	add	r1,r0 / form pointer to arg pointer (-2)
0323: 	mov	2(r0),param / move arg pointer to param
0324: 	br	getc / go to get substitution arg for $n
0325: getbuf:
0326: 	mov	$inbuf,r0 / move input buffer address
0327: 	mov	r0,inbufp / to input buffer pointer
0328: 	mov	r0,einbuf / and initialize pointer to end of
0329: 		          / character string
0330: 	dec	r0 / decrement pointer so can utilize normal
0331: 		   / 100p starting at 1f
0332: 	mov	r0,0f / initialize address for reading 1st char
0333: 1:
0334: 	inc	0f / this routine filles inbuf with line from
0335: 		   / console - if there is cnc
0336: 	clr	r0 / set for tty input
0337: 	sys	read; 0:0; 1 / read next char into inbuf
0338: 	bcs	xit1 / error exit
0339: 	tst	r0 / a zero input is end of file
0340: 	beq	xit1 / exit
0341: 	inc	einbuf / eventually einbuf points to \n
0342: 		       / (+1) of this line
0343: 	cmp	0b,$inbuf+256. / have we exceeded input buffer size
0344: 	bhis	xit1 / if so, exit assume some sort of binary
0345: 	cmpb	*0b,$'\n / end of line?
0346: 	bne	1b / no, go to get next char
0347: 	rts	pc / yes, return
0348: 
0349: xit1:
0350: 	sys	exit
0351: 
0352: quest:
0353: 	<?\n>
0354: 
0355: at:
0356: 	<@ >
0357: 
0358: qchdir:
0359: 	<chdir\0>
0360: glogin:
0361: 	<login\0>
0362: shell:
0363: 	</bin/sh\0>
0364: glob:
0365: 	</etc/glob\0>
0366: binpb:
0367: 	</bin/>
0368: parbuf: .=.+1000.
0369: 	.even
0370: param:	.=.+2
0371: glflag:	.=.+2
0372: infile: .=.+2 
0373: outfile:.=.+2
0374: 	.=.+2 / room for glob
0375: parp:	.=.+200.
0376: inbuf:	.=.+256.
0377: escap:	.=.+2
0378: inbufp: .=.+2
0379: einbuf:	.=.+2
0380: och:	.=.+2
0381: shellarg:.=.+2
0382: 
