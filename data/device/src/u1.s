0001: / u1 -- unix
0002: 
0003: unkni: / used for all system calls
0004: sysent:
0005: 	incb	sysflg / indicate a system routine is
0006: 	beq	1f / in progress
0007: 	jmp	panic / called if trap inside system
0008: 1:
0009: 	mov	$s.syst+2,clockp
0010: 	mov	r0,-(sp) / save user registers
0011: 	mov	sp,u.r0 / pointer to bottom of users stack in u.r0
0012: 	mov	r1,-(sp)
0013: 	mov	r2,-(sp)
0014: 	mov	r3,-(sp)
0015: 	mov	r4,-(sp)
0016: 	mov	r5,-(sp)
0017: 	mov	ac,-(sp) / "accumulator" register for extended
0018: 		         / arithmetic unit
0019: 	mov	mq,-(sp) / "multiplier quotient" register for the
0020: 		         / extended arithmetic unit
0021: 	mov	sc,-(sp) / "step count" register for the extended
0022: 		         / arithmetic unit
0023: 	mov	sp,u.sp / u.sp points to top of users stack
0024: 	mov	18.(sp),r0 / store pc in r0
0025: 	mov	-(r0),r0 / sys inst in r0      10400xxx
0026: 	sub	$sys,r0 / get xxx code
0027: 	asl	r0 / multiply by 2 to jump indirect in bytes
0028: 	cmp	r0,$2f-1f / limit of table (35) exceeded
0029: 	bhis	badsys / yes, bad system call
0030: 	bic	$341,20.(sp) / set users processor priority to 0 and clear
0031: 		             / carry bit
0032: 	jmp	*1f(r0) / jump indirect thru table of addresses
0033: 		        / to proper system routine.
0034: 1:
0035: 	sysrele / 0
0036: 	sysexit / 1
0037: 	sysfork / 2
0038: 	sysread / 3
0039: 	syswrite / 4
0040: 	sysopen / 5
0041: 	sysclose / 6
0042: 	syswait / 7
0043: 	syscreat / 8
0044: 	syslink / 9
0045: 	sysunlink / 10
0046: 	sysexec / 11
0047: 	syschdir / 12
0048: 	systime / 13
0049: 	sysmkdir / 14
0050: 	syschmod / 15
0051: 	syschown / 16
0052: 	sysbreak / 17
0053: 	sysstat / 18
0054: 	sysseek / 19
0055: 	systell / 20
0056: 	sysmount / 21
0057: 	sysumount / 22
0058: 	syssetuid / 23
0059: 	sysgetuid / 24
0060: 	sysstime / 25
0061: 	sysquit / 26
0062: 	sysintr / 27
0063: 	sysfstat / 28
0064: 	sysemt / 29
0065: 	sysmdate / 30
0066: 	sysstty / 31
0067: 	sysgtty / 32
0068: 	sysilgins / 33
0069: 2:
0070: 
0071: error:
0072: 	mov	u.sp,r1
0073: 	bis	$1,20.(r1) / set c bit in processor status word below
0074: 		           / users stack
0075: 
0076: sysret:
0077: 	tstb	u.bsys / is a process about to be terminated because
0078: 	bne	sysexit / of an error? yes, go to sysexit
0079: 	mov	u.sp,sp / no point stack to users stack
0080: 	clr	r1 / zero r1 to check last mentioned i-node
0081: 	jsr	r0,iget / if last mentioned i-node has been modified
0082: 		        / it is written out
0083: 	tstb	smod / has the super block been modified
0084: 	beq	1f / no, 1f
0085: 	clrb	smod / yes, clear smod
0086: 	bis	$1000,sb0 / set write bit in I/O queue for super block
0087: 		          / output
0088: 	jsr	r0,ppoke / write out modified super block to disk
0089: 1:
0090: 	tstb	mmod / has the super block for the dismountable file
0091: 		     / system
0092: 	beq	1f / been modified?  no, 1f
0093: 	clrb	mmod / yes, clear mmod
0094: 	movb	mntd,sb1 / set the I/O queue
0095: 	bis	$1000,sb1 / set write bit in I/O queue for detached sb
0096: 	jsr	r0,ppoke / write it out to its device
0097: 1:
0098: 	tstb	uquant / is the time quantum 0?
0099: 	bne	1f / no, don't swap it out
0100: 
0101: sysrele:
0102: 	jsr	r0,tswap / yes, swap it out
0103: 1:
0104: 	mov	(sp)+,sc / restore user registers
0105: 	mov	(sp)+,mq
0106: 	mov	(sp)+,ac
0107: 	mov	(sp)+,r5
0108: 	mov	(sp)+,r4
0109: 	mov	(sp)+,r3
0110: 	mov	(sp)+,r2
0111: 	mov	(sp)+,r1
0112: 	mov	(sp)+,r0
0113: 	mov	$s.chrgt+2,clockp
0114: 	decb	sysflg / turn system flag off
0115: 	jsr	r0,isintr / is there an interrupt from the user
0116: 		br intract / yes, output gets flushed, take interrupt
0117: 		           / action
0118: 	rti	/ no return from interrupt
0119: 
0120: badsys:
0121: 	incb	u.bsys / turn on the user's bad-system flag
0122: 	mov	$3f,u.namep / point u.namep to "core\0\0"
0123: 	jsr	r0,namei / get the i-number for the core image file
0124: 		br 1f / error
0125: 	neg	r1 / negate the i-number to open the core image file
0126: 		   / for writing
0127: 	jsr	r0,iopen / open the core image file
0128: 	jsr	r0,itrunc / free all associated blocks
0129: 	br	2f
0130: 1:
0131: 	mov	$17,r1 / put i-node mode (17) in r1
0132: 	jsr	r0,maknod / make an i-node
0133: 	mov	u.dirbuf,r1 / put i-nodes number in r1
0134: 2:
0135: 	mov	$core,u.base / move address core to u.base
0136: 	mov	$ecore-core,u.count / put the byte count in u.count
0137: 	mov	$u.off,u.fofp / more user offset to u.fofp
0138: 	clr	u.off / clear user offset
0139: 	jsr	r0,writei / write out the core image to the user
0140: 	mov	$user,u.base / pt. u.base to user
0141: 	mov	$64.,u.count / u.count = 64
0142: 	jsr	r0,writei / write out all the user parameters
0143: 	neg	r1 / make i-number positive
0144: 	jsr	r0,iclose / close the core image file
0145: 	br	sysexit /
0146: 3:
0147: 	<core\0\0>
0148: 
0149: sysexit: / terminate process
0150: 	clr	u.intr / clear interrupt control word
0151: 	clr	r1 / clear r1
0152: 1: / r1 has file descriptor (index to u.fp list)  Search the whole list
0153: 	jsr	r0,fclose / close all files the process opened
0154: 		br .+2 / ignore error return
0155: 	inc	r1 / increment file descriptor
0156: 	cmp	r1,$10. / end of u.fp list?
0157: 	blt	1b / no, go back
0158: 	movb	u.uno,r1 / yes, move dying process's number to r1
0159: 	clrb	 p.stat-1(r1) / free the process
0160: 	asl	r1 / use r1 for index into the below tables
0161: 	mov	p.pid-2(r1),r3 / move dying process's name to r3
0162: 	mov	p.ppid-2(r1),r4 / move its parents name to r4
0163: 	clr	r2
0164: 	clr	r5 / initialize reg
0165: 1: / find children of this dying process, if they are zombies, free them
0166: 	add	$2,r2 / search parent process table for dying process's name
0167: 	cmp	p.ppid-2(r2),r3 / found it?
0168: 	bne	3f / no
0169: 	asr	r2 / yes, it is a parent
0170: 	cmpb	p.stat-1(r2),$3 / is the child of this dying process a
0171: 		                / zombie
0172: 	bne	2f / no
0173: 	clrb	p.stat-1(r2) / yes, free the child process
0174: 2:
0175: 	asl	r2
0176: 3: / search the process name table for the dying process's parent
0177: 	cmp	p.pid-2(r2),r4 / found it?
0178: 	bne	3f / no
0179: 	mov	r2,r5 / yes, put index to p.pid table (parents
0180: 		      / process # x2) in r5
0181: 3:
0182: 	cmp	r2,$nproc+nproc / has whole table been searched?
0183: 	blt	1b / no, go back
0184: 	mov	r5,r1 / yes, r1 now has parents process # x2
0185: 	beq	2f / no parent has been found. The process just dies
0186: 	asr	r1 / set up index to p.stat
0187: 	movb	p.stat-1(r1),r2 / move status of parent to r2
0188: 	beq	2f / if its been freed, 2f
0189: 	cmp	r2,$3 / is parent a zombie?
0190: 	beq	2f / yes, 2f
0191: 	movb	u.uno,r3 / move dying process's number to r3
0192: 	movb	$3,p.stat-1(r3) / make the process a zombie
0193: 	cmp	r2,$2 / is the parent waiting for this child to die
0194: 	bne	2f / yes, notify parent not to wait any more
0195: 	decb	p.stat-1(r1) / awaken it by putting it (parent)
0196: 	mov	$runq+4,r2 / on the runq
0197: 	jsr	r0, putlu
0198: 2: / the process dies
0199: 	clrb	u.uno / put zero as the process number, so "swap" will
0200: 	jsr	r0,swap / overwrite process with another process
0201: 	0	/ and thereby kill it; halt?
0202: 
0203: intract: / interrupt action
0204: 	cmp	*(sp),$rti / are you in a clock interrupt?
0205: 	bne	1f / no, 1f
0206: 	cmp	(sp)+,(sp)+ / pop clock pointer
0207: 1: / now in user area
0208: 	mov	r1,-(sp) / save r1
0209: 	mov	u.ttyp,r1 / pointer to tty buffer in control-to r1
0210: 	cmpb	6(r1),$177 / is the interrupt char equal to "del"
0211: 	beq	1f / yes, 1f
0212: 	clrb	6(r1) / no, clear the byte (must be a quit character)
0213: 	mov	(sp)+,r1 / restore r1
0214: 	clr	u.quit / clear quit flag
0215: 	bis	$20,2(sp) / set trace for quit (sets t bit of ps-trace trap)
0216: 	rti	          / return from interrupt
0217: 1: / interrupt char = del
0218: 	clrb	6(r1) / clear the interrupt byte in the buffer
0219: 	mov	(sp)+,r1 / restore r1
0220: 	cmp	u.intr,$core / should control be transferred to loc core?
0221: 	blo	1f
0222: 	jmp	*u.intr / user to do rti yes, transfer to loc core
0223: 1:
0224: 	sys	1 / exit
0225: 
0226: syswait: / wait for a process to die
0227: 	movb	u.uno,r1 / put parents process number in r1
0228: 	asl	r1 / x2 to get index into p.pid table
0229: 	mov	p.pid-2(r1),r1 / get the name of this process
0230: 	clr	r2
0231: 	clr	r3 / initialize reg 3
0232: 1:
0233: 	add	$2,r2 / use r2 for index into p.ppid table / search table
0234: 		      / of parent processes for this process name
0235: 	cmp	p.ppid-2(r2),r1 / r2 will contain the childs process number
0236: 	bne	3f / branch if no match of parent process name
0237: 	inc	r3 / yes, a match, r3 indicates number of children
0238: 	asr	r2 / r2/2 to get index to p.stat table
0239: 	cmpb	p.stat-1(r2),$3 / is the child process a zombie?
0240: 	bne	2f / no, skip it
0241: 	clrb	p.stat-1(r2) / yes, free it
0242: 	asl	r2 / r2x2 to get index into p.pid table
0243: 	mov	p.pid-2(r2),*u.r0 / put childs process name in (u.r0)
0244: 	br	sysret1 / return cause child is dead
0245: 2:
0246: 	asl	r2 / r2x2 to get index into p.ppid table
0247: 3:
0248: 	cmp	r2,$nproc+nproc / have all processes been checked?
0249: 	blt	1b / no, continue search
0250: 	tst	r3 / one gets here if there are no children or children
0251: 		   / that are still active
0252: 	beq	error1 / there are no children, error
0253: 	movb	u.uno,r1 / there are children so put parent process number
0254: 		         / in r1
0255: 	incb	p.stat-1(r1) / it is waiting for other children to die
0256: 	jsr	r0,swap / swap it out, because it's waiting
0257: 	br	syswait / wait on next process
0258: 
0259: error1:
0260: 	jmp	error / see 'error' routine
0261: sysret1:
0262: 	jmp	sysret / see 'sysret' routine
0263: 
0264: sysfork: / create a new process
0265: 	clr	r1
0266: 1: / search p.stat table for unused process number
0267: 	inc	r1
0268: 	tstb	p.stat-1(r1) / is process active, unused, dead
0269: 	beq	1f / it's unused so branch
0270: 	cmp	r1,$nproc / all processes checked
0271: 	blt	1b / no, branch back
0272: 	add	$2,18.(sp) / add 2 to pc when trap occured, points
0273: 		           / to old process return
0274: 	br	error1 / no room for a new process
0275: 1:
0276: 	movb	u.uno,-(sp) / save parent process number
0277: 	movb	r1,u.uno / set child process number to r1
0278: 	incb	p.stat-1(r1) / set p.stat entry for child process to
0279: 		             / active status
0280: 	mov	u.ttyp,r2 / put pointer to parent process' control tty
0281: 		          / buffer in r2
0282: 	beq	2f / branch, if no such tty assigned
0283: 	clrb	6(r2) / clear interrupt character in tty buffer
0284: 2:
0285: 	mov	$runq+4,r2
0286: 	jsr	r0,putlu / put child process on lowest priority run queue
0287: 	asl	r1 / multiply r1 by 2 to get index into p.pid table
0288: 	inc	mpid / increment m.pid; get a new process name
0289: 	mov	mpid,p.pid-2(r1) / put new process name in child process'
0290: 		                 / name slot
0291: 	movb	(sp),r2 / put parent process number in r2
0292: 	asl	r2 / multiply by 2 to get index into below tables
0293: 	mov	p.pid-2(r2),r2 / get process name of parent process
0294: 	mov	r2,p.ppid-2(r1) / put parent process name in parent
0295: 		                / process slot for child
0296: 	mov	r2,*u.r0 / put parent process name on stack at location
0297: 		         / where r0 was saved
0298: 	mov	$sysret1,-(sp) /
0299: 	mov	sp,u.usp / contents of sp at the time when user is
0300: 		         / swapped out
0301: 	mov	$sstack,sp / point sp to swapping stack space
0302: 	jsr	r0,wswap / put child process out on drum
0303: 	jsr	r0,unpack / unpack user stack
0304: 	mov	u.usp,sp / restore user stack pointer
0305: 	tst	(sp)+ / bump stack pointer
0306: 	movb	(sp)+,u.uno / put parent process number in u.uno
0307: 	mov	mpid,*u.r0 / put child process name on stack where r0
0308: 		           / was saved
0309: 	add	$2,18.(sp) / add 2 to pc on stack; gives parent
0310: 		           / process return
0311: 	clr	r1
0312: 1: / search u.fp list to find the files opened by the parent process
0313: 	movb	u.fp(r1),r2 / get an open file for this process
0314: 	beq	2f / file has not been opened by parent, so branch
0315: 	asl	r2 / multiply by 8
0316: 	asl	r2 / to get index into fsp table
0317: 	asl	r2
0318: 	incb	fsp-2(r2) / increment number of processes using file,
0319: 		          / because child will now be using this file
0320: 2:
0321: 	inc	r1 / get next open file
0322: 	cmp	r1,$10. / 10. files is the maximum number which can be
0323: 		        / opened
0324: 	blt	1b / check next entry
0325: 	br	sysret1
0326: 
0327: sysread:
0328: 	jsr	r0,rw1 / get i-number of file to be read into r1
0329: 	tst	r1 / negative i-number?
0330: 	ble	error1 / yes, error 1 to read it should be positive
0331: 	jsr	r0,readi / read data into core
0332: 	br	1f
0333: 
0334: syswrite:
0335: 	jsr	r0,rw1 / get i-number in r1 of file to write
0336:         tst    r1 / positive i-number ?
0337:         bge    error1 / yes, error 1 negative i-number means write
0338:         neg    r1 / make it positive
0339:         jsr    r0,writei / write data
0340: 1:
0341:         mov    u.nread,*u.r0 / put no. of bytes transferred into (u.r0)
0342:         br     sysret1
0343: 
0344: rw1:
0345:         jsr    r0,arg; u.base / get buffer pointer
0346:         jsr    r0,arg; u.count / get no. of characters
0347:         mov    *u.r0,r1 / put file descriptor (index to u.fp table) in r1
0348:         jsr    r0,getf / get i-number of the file in r1
0349:         rts    r0
0350: 
0351: sysopen:
0352:         jsr    r0,arg2 / get sys args into u.namep and on stack
0353:         jsr    r0,namei / i-number of file in r1
0354:         br     error2 / file not found
0355:         tst    (sp) / is mode = 0 (2nd arg of call; 0 means, open for read)
0356:         beq    1f / yes, leave i-number positive
0357:         neg    r1 / open for writing so make i-number negative
0358: 1:
0359:         jsr    r0,iopen / open file whose i-number is in r1
0360:         tst    (sp)+ / pop the stack and test the mode
0361:         beq    op1 / is open for read op1
0362: 
0363: op0:
0364:         neg    r1 / make i-number positive if open for writing
0365: op1:
0366:         clr    r2 / clear registers
0367:         clr    r3
0368: 1: / scan the list of entries in fsp table
0369:         tstb   u.fp(r2) / test the entry in the u.fp list
0370:         beq    1f / if byte in list is 0 branch
0371:         inc    r2 / bump r2 so next byte can be checked
0372:         cmp    r2,$10. / reached end of list?
0373:         blt    1b / no, go back
0374:         br     error2 / yes, error (no files open)
0375: 1:
0376:         tst    fsp(r3) / scan fsp entries
0377:         beq    1f / if 0 branch
0378:         add    $8.,r3 / add 8 to r3 to bump it to next entry mfsp table
0379:         cmp    r3,$[nfiles*8.] / done scanning
0380:         blt    1b / no, back
0381:         br     error2 / yes, error
0382: 1: / r2 has index to u.fp list; r3, has index to fsp table
0383:         mov    r1,fsp(r3) / put i-number of open file into next available
0384:         mov    cdev,fsp+2(r3) / entry in fsp table, put # of device in
0385:                               / next word
0386:         clr    fsp+4(r3)
0387:         clr    fsp+6(r3) / clear the next two words
0388:         asr    r3
0389:         asr    r3 / divide by 8 to get number of the fsp entry-1
0390:         asr    r3
0391:         inc    r3 / add 1 to get fsp entry number
0392:         movb   r3,u.fp(r2) / move entry number into next available slot
0393:                            / in u.fp list
0394:         mov    r2,*u.r0 / move index to u.fp list into r0 loc on stack
0395:         br     sysret2
0396: 
0397: error2:
0398:         jmp    error / see 'error' routine
0399: sysret2:
0400:         jmp    sysret / see 'sysret' routine
0401: 
0402: syscreat: / name; mode
0403:         jsr    r0,arg2 / put file name in u.namep put mode on stack
0404:         jsr    r0,namei / get the i-number
0405:                br  2f / if file doesn't exist 2f
0406:         neg    r1 / if file already exists make i-number negative
0407:                   / (open for writing)
0408:         jsr    r0,iopen /
0409:         jsr    r0,itrunc / truncate to 0 length
0410:         br     op0
0411: 2: / file doesn't exist
0412:         mov    (sp)+,r1 / put the mode in r1
0413:         bic    $!377,r1 / clear upper byte
0414:         jsr    r0,maknod / make an i-node for this file
0415:         mov    u.dirbuf,r1 / put i-number for this new file in r1
0416:         br     op0 / open the file
0417: 
0418: sysmkdir: / make a directory
0419:         jsr    r0,arg2 / point u.namep to the file name
0420:         jsr    r0,namei / get the i-number
0421:                br .+4 / if file not found branch around error
0422:         br     error2 / directory already exists (error)
0423:         tstb   u.uid / is user the super user
0424:         bne    error2 / no, not allowed
0425:         mov    (sp)+,r1 / put the mode in r1
0426:         bic    $!317,r1 / all but su and ex
0427:         bis    $40000,r1 / directory flag
0428:         jsr    r0,maknod / make the i-node for the directory
0429:         br     sysret2 /
0430: 
0431: sysclose: / close the file
0432:         mov    *u.r0,r1 / move index to u.fp list into r1
0433:         jsr    r0,fclose / close the file
0434:                br error2 / unknown file descriptor
0435:         br     sysret2
0436: 
0437: sysemt:
0438:         jsr    r0,arg; 30 / put the argument of the sysemt call in loc 30
0439:         cmp    30,$core / was the argument a lower address than core
0440:         blo    1f / yes, rtssym
0441:         cmp    30,$ecore / no, was it higher than "core" and less than
0442:                          / "ecore"
0443:         blo    2f / yes, sysret2
0444: 1:
0445:         mov    $rtssym,30
0446: 2:
0447:         br     sysret2
0448: sysilgins: / calculate proper illegal instruction trap address
0449:         jsr    r0,arg; 10 / take address from sysilgins call     , put
0450:                           / it in loc 8.,
0451:         cmp    10,$core / making it the illegal instruction trap address
0452:         blo    1f / is the address a user core address?  yes, go to 2f
0453:         cmp    10,$ecore
0454:         blo    2f
0455: 1:
0456:         mov    $fpsym,10 / no, make 'fpsum' the illegal instruction trap
0457:                          / address for the system
0458: 2:
0459:         br     sysret2 / return to the caller via 'sysret'
0460: 
0461: sysmdate: / change the modification time of a file
0462:         jsr    r0,arg; u.namep / point u.namep to the file name
0463:         jsr    r0,namei / get its i-number
0464:                br error2 / no, such file
0465:         jsr    r0,iget / get i-node into core
0466:         cmpb   u.uid,i.uid / is user same as owner
0467:         beq    1f / yes
0468:         tstb   u.uid / no, is user the super user
0469:         bne    error2 / no, error
0470: 1:
0471:         jsr    r0,setimod / fill in modification data, time etc.
0472:         mov    4(sp),i.mtim / move present time to
0473:         mov    2(sp),i.mtim+2 / modification time
0474:         br     sysret2
0475: 
0476: sysstty: / set mode of typewriter; 3 consequtive word arguments
0477:         jsr    r0,gtty / r1 will have offset to tty block, r2 has source
0478:         mov    r2,-(sp)
0479:         mov    r1,-(sp) / put r1 and r2 on the stack
0480: 1: / flush the clist wait till typewriter is quiescent
0481:         mov    (sp),r1 / restore r1 to tty block offset
0482:         movb   tty+3(r1),0f / put cc offset into getc argument
0483:         mov    $240,*$ps / set processor priority to 5
0484:         jsr    r0,getc; 0:../ put character from clist in r1
0485:                br .+4 / list empty, skip branch
0486:         br     1b / get another character until list is empty
0487:         mov    0b,r1 / move cc offset to r1
0488:         inc    r1 / bump it for output clist
0489:         tstb   cc(r1) / is it 0
0490:         beq    1f / yes, no characters to output
0491:         mov    r1,0f / no, put offset in sleep arg
0492:         jsr    r0,sleep; 0:.. / put tty output process to sleep
0493:         br     1b / try to calm it down again
0494: 1:
0495:         mov    (sp)+,r1
0496:         mov    (sp)+,r2 / restore registers
0497:         mov    (r2)+,r3 / put reader control status in r3
0498:         beq    1f / if 0, 1f
0499:         mov    r3,rcsr(r1) / move r.c. status to reader control status
0500:                            / register
0501: 1:
0502:         mov    (r2)+,r3 / move pointer control status to r3
0503:         beq    1f / if 0 1f
0504:         mov    r3,tcsr(r1) / move p.c. status to printer control status reg
0505: 1:
0506:         mov    (r2)+,tty+4(r1) / move to flag byte of tty block
0507:         jmp     sysret2 / return to user
0508: 
0509: sysgtty: / get status of typewriter; 3 consequtive word arguments
0510:         jsr    r0,gtty / r1 will have offset to tty block, r2 has
0511:                        / destination
0512:         mov    rcsr(r1),(r2)+ / put reader control status in 1st word
0513:                               / of dest
0514:         mov    tcsr(r1),(r2)+ / put printer control status in 2nd word
0515:                               / of dest
0516:         mov    tty+4(r1),(r2)+ / put mode in 3rd word
0517:         jmp    sysret2 / return to user
0518: 
0519: gtty:
0520:         jsr    r0,arg; u.off / put first arg in u.off
0521:         mov    *u.r0,r1 / put file descriptor in r1
0522:         jsr    r0,getf / get the i-number of the file
0523:         tst    r1 / is it open for reading
0524:         bgt    1f / yes
0525:         neg    r1 / no, i-number is negative, so make it positive
0526: 1:
0527:         sub    $14.,r1 / get i-number of tty0
0528:         cmp    r1,$ntty-1 / is there such a typewriter
0529:         bhis   error9 / no, error
0530:         asl    r1 / 0%2
0531:         asl    r1 / 0%4 / yes
0532:         asl    r1 / 0%8 / multiply by 8 so r1 points to tty block
0533:         mov    u.off,r2 / put argument in r2
0534:         rts    r0 / return

Ultrix-3.1/sys/sas/M.s
0001: / SCCSID: @(#)M.s	3.0	5/12/86
0002: /
0003: //////////////////////////////////////////////////////////////////////
0004: /   Copyright (c) Digital Equipment Corporation 1984, 1985, 1986.    /
0005: /   All Rights Reserved. 					     /
0006: /   Reference "/usr/src/COPYRIGHT" for applicable restrictions.      /
0007: //////////////////////////////////////////////////////////////////////
0008: /
0009: / ULTRIX-11 V2.1
0010: / Startup code for two-stage bootstrap (boot)
0011: / and system disk load program (sdload).
0012: 
0013: / Modified for use with I space only CPUs
0014: / (11/23,11/24, 11/34, 11/40, & 1160)
0015: / as well as I & D space CPUs
0016: / (11/44,11/45, & 11/70).
0017: /
0018: / Modified to allow unibus disks to be
0019: / the "root" device (rl01/2,rk06/7, & rm02/3).
0020: /
0021: / Modified for use with overlay kernel.
0022: /
0023: / Modified for determining CPU hardware features present
0024: / and passing them to unix in locore.
0025: /
0026: / Fred Canter 12/24/83
0027: 
0028: 
0029: / non-UNIX instructions
0030: mfpi	= 6500^tst
0031: stst	= 170300^tst
0032: mfps	= 106700^tst
0033: mtpi	= 6600^tst
0034: mfpd	= 106500^tst
0035: mtpd	= 106600^tst
0036: spl	= 230
0037: ldfps	= 170100^tst
0038: stfps	= 170200^tst
0039: wait	= 1
0040: rti	= 2
0041: rtt	= 6
0042: halt	= 0
0043: reset	= 5
0044: mfpt	= 7
0045: trap	= 104400
0046: 
0047: tks	= 177564
0048: tkb	= 177566
0049: 
0050: .globl	_end
0051: .globl	_main
0052: .globl	_sepid,_ubmaps, _cputype, _nmser, _cdreg
0053: .globl	_maxmem,_maxseg, _el_prcw, _rn_ssr3, _mmr3, _cpereg
0054: .globl	_bdcode,_bdunit, _bdmtil, _bdmtih, _bdcsr
0055: .globl	_sdl_bdn,_sdl_bdu, _sdl_ldn, _sdl_ldu
0056: .globl	_devsw
0057: 	jmp	start
0058: 
0059: / trap vectors
0060: 
0061: 	sbtrap;340	/Bus error
0062: 	sbtrap;341	/Illegal instruction
0063: 	sbtrap;342	/BPT
0064: 	sbtrap;343	/IOT
0065: 	sbtrap;344	/Power fail
0066: 	sbtrap;345	/EMT
0067: 	tstart;346	/Trap instruction (started by Boot:)
0068: 
0069: .=100^.
0070: 	_devsw		/ address of devsw[] table for passing device
0071: 			/ CSR addresses from the Boot: program.
0072: 			/ replaced by stray vector catcher.
0073: 
0074: .=114^.
0075: 	sbtrap;352	/Memory parity
0076: .=240^.
0077: 	sbtrap;347	/Programmed interrupt request
0078: 	sbtrap;350	/Floating point
0079: 	sbtrap;351	/Memory management
0080: 
0081: .=1000^.
0082: 
0083: nxaddr: 0	/ 1 = nonexistent address,after trap
0084: trapok:	0	/ 0 = halt on bus error trap
0085: 		/ 1 = rtt on bus error trap & set nxaddr
0086: _sepid: 0	/ 1 = separate I & D space CPU
0087: _ubmaps: 0	/ 1 = unibus map present
0088: _cputype: 45.	/ Assume 11/45 CPU initially
0089: _cdreg: 1	/ Assume CPU has display register
0090: _nmser: 0	/ Number of memory system error registers
0091: _maxmem: 0	/ Total # of 64 byte memory segments
0092: _maxseg: 61440.	/ Memory limit (4MB - I/O page),changed to 65408 for Q22 CPUs
0093: _el_prcw: 0	/ Parity CSR configuration word
0094: _rn_ssr3: 0	/ bits 0->5,saved M/M SSR3
0095: 		/ bits 6->15,OS version number (see machdep.c)
0096: _mmr3: 0	/ address of M/M status reg 3 (0 if no SSR3)
0097: _cpereg: -1	/ -1 = no cpu error reg,0 = cpu error reg present
0098: _bdcode: 0	/ Boot device type code
0099: _bdunit: 0	/ Boot device unit number
0100: _bdmtil: 0	/ lo - Boot device media type ID (mscp devices only)
0101: _bdmtih: 0	/ hi	"
0102: _bdcsr:	0	/ Boot device CSR address
0103: 
0104: / The following globel symbols are used to pass boot/load device
0105: / information from the boot program to the sdload program and,
0106: / in some cases,from sdload back to boot.
0107: / This works because both programs use the M.s startup code,
0108: / which ensures the address of the four locations is the
0109: / same in both programs.
0110: /
0111: / The boot program uses the following two locations to pass the
0112: / boot device ID to sdload. This tells sdload where to find the
0113: / boot and stand-alone programs. The sdload program uses these
0114: / locations to tell boot where to find the kernel to boot.
0115: _sdl_bdn: 0	/ 2 char boot device name (ht,ts, tm, rx, md)
0116: _sdl_bdu: 0	/ boot device unit number
0117: 
0118: / The boot program uses the following two locations to pass the
0119: / load device ID to sdload. This tells sdload where to find the
0120: / root and /usr file systems.
0121: _sdl_ldn: 0	/ 2 char load device name (ht,ts, tm, rx)
0122: _sdl_ldu: 0	/ load device unit number
0123: 
0124: saveps:	0	/ Save the PS on a trap
0125: saveua: 0
0126: saveud: 0
0127: 
0128: stackov: -1		/Stack overflow indicator
0129: .=.+128.
0130: tstart:			/Started by Boot: instead of block zero boot
0131: 	clr	r1	/insure no auto-boot (bad boot device code)
0132: start:
0133: 	reset
0134: 	mov	$sbtrap,*$34
0135: 	mov	$340,PS
0136: 	mov	$tstart,sp
0137: 
0138: / Save boot device code & unit number for possible auto-boot.
0139: 
0140: 	mov	r0,_bdunit
0141: 	mov	r1,_bdcode
0142: 	mov	r2,_bdmtil
0143: 	mov	r3,_bdmtih
0144: 	mov	r4,_bdcsr
0145: 
0146: / Load stray vector catchers in unused vector locations
0147: 
0148: 	clr	r0
0149: 4:
0150: 	mov	$sbtrap,(r0)+
0151: 	mov	$357,(r0)+
0152: 	br	2f
0153: 1:
0154: 	tst	(r0)+
0155: 	tst	(r0)+
0156: 2:
0157: 	cmp	r0,$1000
0158: 	bge	3f
0159: 	tst	2(r0)
0160: 	bne	1b
0161: 	br	4b
0162: 3:
0163: / Check for CPU error present
0164: 
0165: 	clr	nxaddr
0166: 	inc	trapok
0167: 	tst	*$CPER
0168: 	tst	nxaddr
0169: 	bne	1f
0170: 	clr	_cpereg
0171: 1:
0172: 
0173: / Check for separate I & D space CPU,
0174: / by attempting to set bits 0-2 of 
0175: / memory management status register 3.
0176: / If SSR3 is not present or if bits 0-2
0177: / can't be set,then the CPU does not have 
0178: / separate I & D space.
0179: 
0180: 	mov	$1,_sepid	/ Assume separate I & D space CPU
0181: 	clr	nxaddr
0182: 	inc	trapok		/ Allow bus error trap
0183: 	mov	$7,*$SSR3	/ Will trap if no SSR3
0184: 	tst	nxaddr		/ did a trap occur ?
0185: 	bne	1f		/ yes,no SSR3, skip following
0186: 	mov	$SSR3,_mmr3	/ save SSR3 address
0187: 	tst	*$SSR3		/ no,SSR3 exists, did sep. I&D bits set ?
0188: 	bne	2f		/ yes,separate I & D space CPU
0189: 	mov	$23.,_cputype
0190: 	br	3f
0191: 1:
0192: 	mov	$40.,_cputype
0193: 3:
0194: 	clr	_sepid		/ no,non separate I & D space CPU
0195: 2:
0196: 	clr	trapok
0197: 
0198: / If seperate I & D space CPU,
0199: / set kernel I+D to physical 0 and IO page.
0200: / If I space only CPU,
0201: / set kernel I to physical 0 and IO page.
0202: 
0203: 	clr	r1
0204: 	mov	$77406,r2
0205: 	mov	$KISA0,r3
0206: 	mov	$KISD0,r4
0207: 	jsr	pc,setseg
0208: 	mov	$IO,-(r3)
0209: 	tst	_sepid	/ If I space only CPU
0210: 	beq	1f	/ Don't set up all MM reg's
0211: 	clr	r1
0212: 	mov	$KDSA0,r3
0213: 	mov	$KDSD0,r4
0214: 	jsr	pc,setseg
0215: 	mov	$IO,-(r3)
0216: 
0217: / Set user I+D to physical 64K (words) and IO page.
0218: 
0219: 1:
0220: /	mov	$4000,r1	/ BIGKERNEL
0221: 	mov	$6000,r1	/ BIGKERNEL
0222: 	mov	$UISA0,r3
0223: 	mov	$UISD0,r4
0224: 	jsr	pc,setseg
0225: 	mov	$IO,-(r3)
0226: 	tst	_sepid	/ If I space only CPU
0227: 	bne	1f
0228: 	jmp	ubmtst	/ Don't set up all MM reg's
0229: 1:
0230: /	mov	$4000,r1	/ BIGKERNEL
0231: 	mov	$6000,r1	/ BIGKERNEL
0232: 	mov	$UDSA0,r3
0233: 	mov	$UDSD0,r4
0234: 	jsr	pc,setseg
0235: 	mov	$IO,-(r3)
0236: 
0237: / Enable 22 bit mapping and seperate I & D
0238: / space for kernel and user modes.
0239: / This is not done if CPU is I space only.
0240: 
0241: 	mov	$25,*$SSR3	/ 22-bit mapping
0242: 	bit	$20,*$SSR3
0243: 	bne	1f
0244: 	jmp	ubmtst
0245: 1:
0246: 	clr	nxaddr
0247: 	inc	trapok
0248: 	mfpt			/ ask for processor type
0249: 	tst	nxaddr		/ does CPU have mpft instruction ?
0250: 	beq	1f		/ yes
0251: 	mov	$70.,_cputype	/ no,must be 11/70
0252: 	mov	$4,_nmser
0253: 	mov	$3,*$MSCR
0254: 	jmp	ubmtst
0255: 1:
0256: 	clr	trapok
0257: 	clr	nxaddr
0258: 	cmp	r0,$1		/ 11/44 ?
0259: 	bne	2f		/ no
0260: 	mov	$44.,_cputype	/ yes
0261: 	mov	$1,*$MSCR
0262: 	clr	_cdreg
0263: 	mov	$2,_nmser
0264: 	jmp	ubmtst
0265: 2:
0266: 	cmp	r0,$5		/ J11 ?
0267: 	bne	4f		/ no
0268: 	mov	$73.,_cputype	/ yes,assume 11/73 for now
0269: 	mov	$65408.,_maxseg	/ Raise memory size limit for Q22 bus
0270: 	clr	_nmser
0271: 	clr	nxaddr
0272: 	inc	trapok		/ allow bus error trap
0273: 	mov	$1,*$MSCR	/ set force miss on error
0274: 	clr	trapok
0275: 	tst	nxaddr		/ does CPU have cache?
0276: 	bne	1f		/ no
0277: 	mov	$2,_nmser	/ yes,save number of registers
0278: 1:
0279: 	clr	_cdreg		/ J11s do not have console display register
0280: 	mov	*$MREG,r1	/ get real CPU type from maint. reg.
0281: 	ash	$-4,r1
0282: 	bic	$!17,r1
0283: 	cmp	r1,$1		/ 11/73 ?
0284: 	beq	ubmtst		/ yes
0285: 	cmp	r1,$2		/ no,ORION ? (11/83 or 11/84)
0286: 	bne	3f		/ no
0287: 	mov	$83.,_cputype	/ yes,assume 11/83 for now
0288: 	br	ubmtst		/ if unibus map present will change to 11/84
0289: 3:
0290: 	cmp	r1,$3		/ KXJ11 ?
0291: 	beq	ubmtst		/ yes (don't know what to do,call it 73)
0292: 	cmp	r1,$4		/ 11/53 ? (KDJ11-D)
0293: 	bne	4f		/ no
0294: 	mov	$53.,_cputype	/ yes
0295: 	br	ubmtst
0296: 4:
0297: / SHOULD NEVER GET HERE
0298: / If we do something is wrong!
0299: / CPU has mfpt but is not J11 or 11/44 ?
0300: / If it's a 23 or 24 keep going.
0301: 	cmp	r0,$3		/ 11/23 or 11/24 ?
0302: 	bne	5f		/ no
0303: 	clr	_cdreg
0304: 	clr	_nmser
0305: 	mov	$23.,_cputype
0306: 	br	ubmtst
0307: 5:
0308: .if MSMSG
0309: / SHOULD ABSOLUTELY NEVER GET HERE
0310: / If we to it's PANIC time!
0311: / Print UNKNOWN CPU error message, then halt.
0312: / User can deposit CPU type in R0 and continue,
0313: / BUT... (who knows what will happen)!
0314: / ONLY for boot, not sdload (boot loads sdload)
0315: 	mov	$3f,r0		/ print UNKNOWN CPU error message
0316: 1:
0317: 	movb	(r0)+,*$tkb
0318: 2:
0319: 	tstb	*$tks
0320: 	bpl	2b
0321: 	tstb	(r0)
0322: 	bne	1b
0323: 	br	1f
0324: 3:
0325: 	<\n\rUNKNOWN CPU: load CPU type in R0, continue at your own risk!\n\r\0>
0326: 	.even
0327: .endif
0328: 1:
0329: 	halt
0330: .if READMEM
0331: 	br	1b
0332: .endif
0333: 	mov	r0,_cputype
0334: ubmtst:
0335: / Test for unibus map and
0336: / initialize it if present.
0337: 	mov	$UBMR0,r0	/ address of first map reg
0338: 	clr	nxaddr
0339: 	inc	trapok		/ allow trap
0340: 	tst	(r0)		/ touch map reg 0
0341: 	tst	nxaddr		/ does it exist ?
0342: 	bne	2f		/ no,no unibus map
0343: 	cmp	_cputype,$83.	/ Is CPU an ORION ? (11/83 or 11/84)
0344: 	bne	3f		/ no
0345: 	inc	_cputype	/ yes,has unibus map must be 11/84
0346: 	mov	$61440.,_maxseg	/ Lower memory size limit for unibus
0347: 3:
0348: 	inc	_ubmaps		/ yes,set map present indicator
0349: 	mov	$31.,r1		/ initialize unibus map registers
0350: 	clr	r2		/ to first 256 kb of memory.
0351: 	clr	r3		/ ** - they all get changed later on
0352: 1:				/ ** - but what the heck!
0353: 	mov	r2,(r0)+
0354: 	mov	r3,(r0)+
0355: 	add	$20000,r2
0356: 	adc	r3
0357: 	sob	r1,1b
0358: 	bis	$40,*$SSR3	/ enable unibus map
0359: 2:
0360: 	clr	trapok
0361: 	mov	$30340,PS
0362: 	inc	*$SSR0
0363: 
0364: / Complete CPU type determination.
0365: 	tst	_sepid
0366: 	bne	4f		/ already know what CPU type
0367: 	clr	_cdreg
0368: 	clr	_nmser
0369: 	cmp	$23.,_cputype
0370: 	bne	1f
0371: 	inc	trapok
0372: 	clr	nxaddr
0373: 	tst	*$CPER
0374: 	tst	nxaddr
0375: 	bne	4f		/ 11/23
0376: 	inc	_cputype	/ 11/24
0377: 	bis	$20,*$SSR3	/ set 22 bit mapping
0378: 	mov	$-1,_cpereg	/ ignore the CPU error register on the
0379: 				/ 11/24,it has no meaningfull bits
0380: 	br	4f
0381: 1:
0382: 	inc	trapok
0383: 	clr	nxaddr
0384: 	clr	r0
0385: 	mfps	r0
0386: 	tst	nxaddr
0387: 	bne	2f		/ reserved inst trap
0388: 	bit	$340,r0
0389: 	beq	2f
0390: 	mov	$34.,_cputype	/ 11/34
0391: 	inc	trapok
0392: 	clr	nxaddr
0393: 	tst	*$MSCR
0394: 	tst	nxaddr		/ KK11-A cache option present?
0395: 	bne	4f		/ no
0396: 	mov	$1,*$MSCR	/ yes,disable cache parity traps
0397: 	mov	$2,_nmser
0398: 	br	4f
0399: 2:
0400: 	inc	trapok
0401: 	clr	nxaddr
0402: 	tst	*$CPER
0403: 	tst	nxaddr
0404: 	bne	4f
0405: 	mov	$60.,_cputype	/ 11/60
0406: 	mov	$1,*$MSCR
0407: 	mov	$2,_nmser
0408: 4:
0409: 	clr	trapok
0410: 
0411: / Clear all memory after `boot' and set maxmem
0412: / equal to the total number of 64 byte memory
0413: / segments available on the system.
0414: 
0415: .if MSMSG
0416: 	mov	$3f,r0		/ print "Sizing Memory..."
0417: 1:
0418: 	movb	(r0)+,*$tkb
0419: 2:
0420: 	tstb	*$tks
0421: 	bpl	2b
0422: 	tstb	(r0)
0423: 	bne	1b
0424: 	br	1f
0425: 3:
0426: 	<\n\rSizing Memory...  \0>
0427: 	.even
0428: 1:
0429: .endif
0430: 	mov	*$UISA0,saveua
0431: 	mov	*$UISD0,saveud
0432: 	mov	$406,*$UISD0
0433: 	mov	$_end+63.,r0
0434: 	ash	$-6,r0
0435: 	bic	$!1777,r0
0436: 	mov	r0,*$UISA0
0437: 	jsr	pc,sizmem
0438: 	mov	*$UISA0,_maxmem
0439: 
0440: / At this point,if the memory size is exactly 253952 bytes
0441: / then the CPU could be:
0442: /	11/23		Without Q22 bus
0443: /	11/23+		With Q22 bus
0444: /	11/24		Without KT24
0445: / the trick is which one !
0446: 
0447: 	cmp	$23.,_cputype	/ do we think this is an 11/23 CPU
0448: 	bne	7f		/ no,forget about extended addressing
0449: 	cmp	$7600,_maxmem	/ yes,does memory size equal 253952 bytes ?
0450: 	bne	7f		/ no,again no extended addressing
0451: 	bis	$20,*$SSR3	/ yes,enable 22 bit mapping
0452: 	mov	$10000,*$UISA0	/ look for > 256kb of memory
0453: 	clr	nxaddr		/ attempt to clear address 1000000
0454: 	inc	trapok
0455: 	clr	-(sp)
0456: 	mtpi	*$0
0457: 	tst	nxaddr		/ trap ?
0458: 	beq	2f		/ no,CPU is 11/23
0459: 	clr	nxaddr		/ yes
0460: 	inc	trapok
0461: 	tst	*$177524	/ does CPU have config reg at 777524 ?
0462: 	tst	nxaddr
0463: 	beq	6f		/ yes,CPU is 11/23+ with exactly 256kb
0464: 	inc	_cputype	/ no,CPU is 11/24 without KT24
0465: 	br	5f
0466: 2:
0467: 	cmp	*$0,$sbtrap	/ no,did the address wrap around to 0 ?
0468: 	beq	6f		/ no,CPU is 11/23+ with Q22 bus
0469: 				/ yes,CPU is 11/23 without Q22 bus
0470: 	mov	$sbtrap,*$0	/ restore location 0 contents
0471: 5:
0472: 	clr	*$SSR3		/ disable 22 bit mapping
0473: 	br	7f
0474: 6:
0475: 	mov	$7600,*$UISA0	/ 11/23+,continue memory sizing
0476: 	mov	$65408.,_maxseg	/ Raise memory limit for Q22 bus
0477: 	jsr	pc,sizmem
0478: 	mov	*$UISA0,_maxmem
0479: 7:
0480: 	clr	trapok
0481: 	mov	saveua,*$UISA0
0482: 	mov	saveud,*$UISD0
0483: 
0484: / Auto configure code,only used with boot53 (ULCM-16 boot).
0485: /
0486: / The ULTRIX-11 run time only system supports the ULCM-16 (11/53)
0487: / and a very limited set of peripherals. The auto configure code
0488: / determines how the ULCM-16 is configured and saves this information
0489: / so the kernel can be dynamically reconfigured,later on in boot.
0490: / Auto-conf operates on the assumption that the system's hardware
0491: / configuration obays a the following rules:
0492: /
0493: / Number/type of devices allowed:
0494: /
0495: /	1 console,second SLU (both on CPU module)
0496: /	1 DHV11,2 DZQ11, 2 DLV11-A/B/E/F, 2 DLV11-J
0497: /	1 RQDX (4 drives max)
0498: /	1 TK50
0499: /	1 DEQNA
0500: /
0501: / CSR address assignments:
0502: /
0503: /	777560	console DL
0504: /	776500	Second SLU (on CPU module)
0505: /	776510	First  DLV11-A/B/E/F
0506: /	    20  Second "
0507: /	    30	Third  "
0508: /	776540	First  DLV11-J
0509: /	   600	Second "
0510: /	760440	Only   DHV11
0511: /	760100	First  DZQ11
0512: /	   110	Second "
0513: /	772150	RQDX
0514: /	774500	TK50
0515: /	774440	DEQNA
0516: /
0517: / Interrupt vector assignments:
0518: /
0519: /	RQDX = 154,TK50 = 260, DEQNA = 120, comm devices = 300
0520: /	(start at 300,DLV, then DZQ, DHV)
0521: /
0522: / The auto-conf code builds a series of config records and
0523: / saves them in _copybuf (in boot.c). The format of each
0524: / config record is shown below. A zero device type code
0525: / ends the series of config records.
0526: /
0527: / config record format
0528: /
0529: /	byte 0 - Device type code
0530: /	byte 1 - Number of controllers present
0531: /	byte 2 - Device CSR address
0532: /	byte 3 -
0533: /	byte 4 - Number of registers
0534: /	byte 5 -
0535: /	byte 6 - Device interrupt vector address
0536: /	byte 7 -
0537: /
0538: / The config record (also called address map) are built
0539: / using the following three phases:
0540: /
0541: /  1.	Scan the I/O page and build an address map describing
0542: /	each group of registers that respond (CSR & # of regs).
0543: /
0544: /  2.	Scan the address map to determine,based on the CSR sddress,
0545: /	the type of each device and the number of controllers.
0546: /
0547: /  3.	Determine the interrupt vector for each device. RQDX,TK50, and
0548: /	DEQNA all have software loadable vectors. Comm. device
0549: /	vectors are found by causing the device to interrupt.
0550: /
0551: / Device type codes (0 ends address map)
0552: / CAUTION,also defined in boot.c and setup53.c.
0553: 
0554: NO_DEV	= 1	/ not a device (group of CPU registers)
0555: UN_DEV	= 2	/ unknown device
0556: RA_DEV	= 3	/ RQDX3
0557: DE_DEV	= 4	/ DEQNA
0558: TK_DEV	= 5	/ TK50
0559: UH_DEV	= 6	/ DHV11
0560: DZ_DEV	= 7	/ DZV11 or DZQ11
0561: KL_DEV	= 8.	/ DLV11 (second SLU + any DLV11-A/B/E/F)
0562: DL_DEV	= 9.	/ DLV11-J (ok for KLs to overlap DLs)
0563: 
0564: .globl	_copybuf
0565: 
0566: / Generate an I/O page address map containing the
0567: / first address and number of addresses for each
0568: / group of addresses that respond.
0569: / Flag any group of responding addresses with a length
0570: / less that 2 words or greater than 8 words as not a
0571: / device,most likely a group of processor or memory
0572: / management registers.
0573: /
0574: /   r0	points to current I/O page address
0575: /   r1	save first address in group
0576: /   r2	counts number of addresses in group
0577: /   r3	I/O page length counter (4096 words)
0578: /   r4	not used
0579: /   r5	pointer to address map (_copybuf in boot.c)
0580: 
0581: .if AUTOCONF
0582: 	mov	$160000,r0	/ first address of I/O page
0583: 	mov	$4096.,r3	/ I/O page length in words
0584: 	clr	r2		/ clear # of registers responding
0585: 	mov	$_copybuf,r5	/ address of buffer in boot.c
0586: 1:
0587: 	clr	nxaddr		/ clear no response indicator
0588: 	inc	trapok		/ allow bus timeout trap
0589: 	tst	(r0)		/ touch I/O page address
0590: 	clr	trapok		/ disallow bus timeout trap
0591: 	tst	nxaddr		/ did address respond?
0592: 	beq	3f		/ yes
0593: 	tst	r2		/ no,is # of regs responding = zero?
0594: 	beq	2f		/ yes,go bump counters & loop back
0595: 				/ no,end of sequence of responding registers
0596: 				/     enter a record into the address map
0597: 	mov	$NO_DEV,(r5)	/ Assume no device,i.e., a group of CPU regs
0598: 				/ (could be DLV11s,we handle that case later)
0599: 	cmp	r1,$164000	/ is CSR in floating address range?
0600: 	blo	7f		/ yes,is a device
0601: 	cmp	r1,$176500	/ KL_DEV CSR? (will always be at least one)
0602: 	beq	7f		/ yes,assume it is a device
0603: 	cmp	r1,$176540	/ no,DL_DEV CSR (DLV11-J)
0604: 	beq	7f		/ yes,assume it is a device
0605: 	cmp	r2,$8.		/ no,# of responding registers greater than 8?
0606: 	bgt	5f		/ yes,not a device
0607: 	cmp	r2,$2		/ # of responding register less than 2?
0608: 	blt	5f		/ yes,not a device
0609: 7:
0610: 	mov	$UN_DEV,(r5)	/ is a device,don't know what type yet
0611: 				/ (also clears # of controllers byte)
0612: 5:
0613: 	tst	(r5)+		/ move pointer to next map entry
0614: 	mov	r1,(r5)+	/ address of first responding register
0615: 	mov	r2,(r5)+	/ number of registers responding
0616: 	clr	(r5)+		/ clear vector address
0617: 	clr	r2		/ # regs = 0 (end group of responding regs)
0618: 2:
0619: 	add	$2,r0		/ next I/O page address
0620: 	sob	r3,1b		/ loop until all I/O page address checked
0621: 	clr	(r5)+		/ end the address map by setting the
0622: 				/ device type and cntrl count to zero
0623: 	br	6f
0624: 3:				/ I/O page address responded
0625: 	tst	r2		/ is it first address in a group?
0626: 	bne	4f		/ no
0627: 	mov	r0,r1		/ yes,save first address in group
0628: 4:
0629: 	inc	r2		/ bump number of addresses in group
0630: 	br	2b		/ go check next address
0631: 6:
0632: / Scan thru the address map and see what devices
0633: / are present. Set device type code and number of
0634: / controllers. If the device has a fixed vector
0635: / (RA TK DE) also load the vector.
0636: /
0637: /   r0	scratch
0638: /   r5	pointer to address map (_copybuf in boot.c)
0639: /
0640: 	mov	$_copybuf,r5	/ set pointer to address map
0641: 1:
0642: 	tst	(r5)		/ end of address map?
0643: 	beq	7f		/ yes
0644: 	cmpb	(r5),$UN_DEV	/ do we think this is a device?
0645: 	beq	3f		/ yes,go see what type
0646: 				/ no,must be NO_DEV (CPU registers)
0647: 2:
0648: 	add	$8.,r5		/ move pointer to next map entry
0649: 	br	1b		/ loop back
0650: 3:				/ attempt to determine device type
0651: 	cmp	2(r5),$172150	/ RA CSR?
0652: 	bne	4f		/ no,not RA
0653: 	cmp	4(r5),$2	/ yes,# reg = 2
0654: 	bne	4f		/ no,not RA
0655: 	movb	$RA_DEV,(r5)	/ yes,is RA (better be!)
0656: 	movb	$1,1(r5)	/ one controller
0657: 	mov	$154,6(r5)	/ vector is 154
0658: 	br	2b
0659: 4:
0660: 	cmp	2(r5),$174500	/ TK CSR?
0661: 	bne	4f
0662: 	cmp	4(r5),$2
0663: 	bne	4f
0664: 	movb	$TK_DEV,(r5)
0665: 	movb	$1,1(r5)
0666: 	mov	$260,6(r5)	/ vector is 260
0667: 	br	2b
0668: 4:
0669: 	cmp	2(r5),$174440	/ DE CSR?
0670: 	bne	4f
0671: 	movb	$DE_DEV,(r5)
0672: 	mov	$120,6(r5)	/ vector is 120
0673: 6:
0674: 	mov	4(r5),r0	/ get # of regs
0675: 	asr	r0		/ convert to # controllers
0676: 5:
0677: 	asr	r0
0678: 	asr	r0
0679: 	movb	r0,1(r5)	/ save # of controllers
0680: 	br	2b
0681: 4:
0682: 	cmp	2(r5),$160100	/ DZ CSR?
0683: 	bne	4f
0684: 	movb	$DZ_DEV,(r5)
0685: 	mov	4(r5),r0	/ get # regs
0686: 	br	5b		/ convert to # cntlr and save
0687: 4:
0688: 	cmp	2(r5),$160440	/ UH CSR?
0689: 	bne	4f
0690: 	movb	$UH_DEV,(r5)
0691: 	br	6b
0692: 4:
0693: 	cmp	2(r5),$176500	/ KL CSR (DLV11-A/B/E/F)?
0694: 	bne	4f		/ no
0695: 	movb	$KL_DEV,(r5)	/ yes,say so
0696: 	mov	4(r5),r0	/ convert # regs to # cntlr
0697: 	br	5b
0698: 4:
0699: 	cmp	2(r5),$176540	/ DL CSR (DLV11-J)?
0700: 	bne	2b		/ no,must be unknown or unsupported device
0701: 	movb	$DL_DEV,(r5)	/ yes,say so
0702: 	mov	4(r5),r0
0703: 	br	5b
0704: 7:
0705: .endif
0706: 	jmp	ivect
0707: 
0708: / Determine the interrupt vector of each device and
0709: / save it in the address map.
0710: 
0711: / The following are interrupt vector catchers.
0712: / They catch the interrupt,leave its vector
0713: / address in r4,then return from interrupt.
0714: 
0715: iv0:				/ Vectors from 0 -> 74
0716: 	mov	*$PS,r4		/ must save PSW first thing
0717: 	bic	$!17,r4		/ offset from base in cond. code bits
0718: 	asl	r4		/ convert to address offset
0719: 	asl	r4
0720: /	add	$0,r4		/ add in base vector address
0721: 	rti
0722: iv100:				/ Vectors from 100 -> 174
0723: 	mov	*$PS,r4
0724: 	bic	$!17,r4
0725: 	asl	r4
0726: 	asl	r4
0727: 	add	$100,r4
0728: 	rti
0729: iv200:				/ Vectors from 200 -> 274
0730: 	mov	*$PS,r4
0731: 	bic	$!17,r4
0732: 	asl	r4
0733: 	asl	r4
0734: 	add	$200,r4
0735: 	rti
0736: iv300:				/ Vectors from 300 -> 374
0737: 	mov	*$PS,r4
0738: 	bic	$!17,r4
0739: 	asl	r4
0740: 	asl	r4
0741: 	add	$300,r4
0742: 	rti
0743: iv400:				/ Vectors from 400 -> 474
0744: 	mov	*$PS,r4
0745: 	bic	$!17,r4
0746: 	asl	r4
0747: 	asl	r4
0748: 	add	$400,r4
0749: 	rti
0750: iv500:				/ Vectors from 500 -> 574
0751: 	mov	*$PS,r4
0752: 	bic	$!17,r4
0753: 	asl	r4
0754: 	asl	r4
0755: 	add	$500,r4
0756: 	rti
0757: iv600:				/ Vectors from 600 -> 674
0758: 	mov	*$PS,r4
0759: 	bic	$!17,r4
0760: 	asl	r4
0761: 	asl	r4
0762: 	add	$600,r4
0763: 	rti
0764: iv700:				/ Vectors from 700 -> 774
0765: 	mov	*$PS,r4
0766: 	bic	$!17,r4
0767: 	asl	r4
0768: 	asl	r4
0769: 	add	$700,r4
0770: 	rti
0771: 
0772: / Table of vector catcher addresses,used to
0773: / load catchers into locore vector area.
0774: 
0775: vcaddr:
0776: 	iv0; iv100; iv200; iv300; iv400; iv500; iv600; iv700
0777: 
0778: / Subroutine to wait for an interrupt.
0779: / On exit,r4 will contain the vector address if
0780: / the device interrupted or -1 if the it timed out.
0781: 
0782: ivwait:				/ DO NOT USE R3!
0783: .if AUTOCONF
0784: 	mov	$-1,r4		/ set r4 to indicate timeout
0785: 	mov	$1,r0		/ # of times thru delay loop
0786: 	bic	$340,*$PS	/ lower priority so device can interrupt
0787: 1:
0788: 	mov	$177777,r1	/ delay loop count TODO(cache,inst timing)
0789: 2:
0790: 	tst	r4		/ catcher sets vector in r4 on interrupt
0791: 	bge	3f		/ interrupt occurred
0792: 	dec	r1		/ no interrupt yet,continue looping
0793: 	bne	2b
0794: 	sob	r0,1b
0795: 3:
0796: 	bis	$340,*$PS	/ raise priority back to 7
0797: .endif
0798: 	rts	pc
0799: 
0800: ivect:				/ load vector catchers in locore
0801: .if AUTOCONF
0802: 	clr	r0		/ pointer to vector area
0803: 1:
0804: 	cmp	2(r0),$357	/ stray vector catcher there now?
0805: 	bne	2f		/ no,machine trap vector - don't change
0806: 	mov	r0,r1		/ yes,replace with interrupt catcher
0807: 	bic	$77,r1		/ set pointer to table of catcher addresses
0808: 	ash	$-5,r1
0809: 	add	$vcaddr,r1
0810: 	mov	(r1),(r0)	/ load catcher addr from table to vector
0811: 	mov	r0,r1		/ load offset from base catcher address into
0812: 	ash	$-2,r1		/ condition code bits of new PSW (vect+2)
0813: 	bic	$!17,r1
0814: 	bis	$340,r1
0815: 	mov	r1,2(r0)
0816: 2:
0817: 	tst	(r0)+		/ move pointer to next vector
0818: 	tst	(r0)+
0819: 	cmp	r0,$1000	/ end of locore vector area?
0820: 	blt	1b		/ no,continue
0821: 
0822: / Make each communications device reveal its vector by
0823: / forcing it to interrupt.
0824: 
0825: 	mov	$_copybuf,r5	/ pointer to address map
0826: 1:
0827: 	cmpb	(r5),$KL_DEV	/ is device DLV11-J
0828: 	beq	2f		/ yes
0829: 	cmpb	(r5),$DL_DEV	/ is device DLV11?
0830: 	beq	2f		/ yes
0831: 	cmpb	(r5),$DZ_DEV	/ no,is device DZV11/DZQ11?
0832: 	beq	3f		/ yes
0833: 	cmpb	(r5),$UH_DEV	/ no,is device DHV11?
0834: 	beq	4f		/ yes
0835: 5:
0836: 	add	$8.,r5		/ no,move pointer to next map entry
0837: 	tst	(r5)		/ end of map?
0838: 	beq	1f		/ yes,TODO.......
0839: 	br	1b		/ no,continue
0840: / TODO: for just check first device, LATER check each device
0841: / in a group to make sure vectors are sequential.
0842: 2:				/ DLV11,make it interrupt
0843: 	mov	2(r5),r3	/ get base CSR address
0844: 	bis	$100,4(r3)	/ set xmit interrupt enable
0845: 	jsr	pc,ivwait	/ wait for interrupt, vector returned in r4
0846: 	bic	$100,4(r3)	/ clear xmit interrupt enable
0847: 7:
0848: 	tst	r4		/ did device interrupt?
0849: 	blt	6f		/ no,r4 = -1
0850: 	sub	$4,r4		/ yes,receive vector is first
0851: 6:
0852: 	mov	r4,6(r5)	/ save vector addr in map
0853: 	br	5b		/ go to next device
0854: 3:				/ DZV11/DZQ11,make it interrupt
0855: 	mov	2(r5),r3	/ get base CSR address
0856: 	bis	$1,4(r3)	/ set TCR bit for line 0
0857: 	bis	$40040,(r3)	/ set xmit interrupt enable
0858: 	jsr	pc,ivwait	/ wait for intr,vector returned in r4
0859: 	bic	$40000,(r3)	/ clear xmit intr enable
0860: 	br	7b		/ go save vector if device interrupted
0861: 4:				/ DHV11,make it interrupt
0862: 	mov	2(r5),r3	/ get base CSR address
0863: 	mov	$40000,(r3)	/ select line 0 for xmit & set TIE
0864: 	mov	$100040,2(r3)	/ xmit a space on line 0
0865: 	jsr	pc,ivwait	/ wait for interrupt,vector returned in r4
0866: 	bic	$40000,(r3)	/ clear xmit interrupt enable
0867: 	br	7b		/ go save vector if device interrupted
0868: 1:
0869: / Replace all of the interrupt vector catchers with
0870: / stray vector catchers,i.e., address of sbtrap.
0871: / Any vector not containing the address of sbtrap
0872: / is assumed to be an interrupt vector catcher.
0873: 
0874: 	clr	r0		/ pointer to locore vector area
0875: 1:
0876: 	cmp	(r0),$sbtrap	/ is vector an interrupt catcher?
0877: 	beq	2f		/ no,don't change it
0878: 	mov	$sbtrap,(r0)	/ yes,replace it with stray vector catcher
0879: 	mov	$357,2(r0)
0880: 2:
0881: 	tst	(r0)+		/ move pointer to next vector
0882: 	tst	(r0)+
0883: 	cmp	r0,$1000	/ end of vector area?
0884: 	blt	1b		/ no,continue checking vectors
0885: .endif
0886: 
0887: / Enable all parity CSRs
0888: 
0889: 	mov	$PCSR,r0
0890: 1:
0891: 	clr	nxaddr
0892: 	inc	trapok
0893: 	mov	$1,(r0)+
0894: 	tst	nxaddr
0895: 	bne	2f
0896: 	mov	$1,r2
0897: 	ash	r1,r2
0898: 	bis	r2,_el_prcw
0899: 2:
0900: 	inc	r1
0901: 	cmp	r1,$16.
0902: 	blt	1b
0903: 	clr	trapok
0904: 
0905: / Save the release number and
0906: / SSR3 if it exists
0907: 
0908: 	clr	nxaddr
0909: 	inc	trapok
0910: 	clr	r0
0911: 	mov	*$SSR3,r0
0912: 	bic	$!77,r0
0913: 	mov	r0,_rn_ssr3
0914: 	clr	trapok
0915: 
0916: / copy program to user I space
0917: 	mov	$_end,r0
0918: 	asr	r0
0919: 	bic	$100000,r0
0920: 	clr	r1
0921: 1:
0922: 	mov	(r1),-(sp)
0923: 	mtpi	(r1)+
0924: 	sob	r0,1b
0925: 
0926: / continue execution in user space copy
0927: 
0928: 	mov	$160000,sp	/ so loading 407 program doesn't overwrite stack
0929: 	mov	$140340,-(sp)
0930: 	mov	$user,-(sp)
0931: 	rtt
0932: user:
0933: 	mov	$_end+512.,sp
0934: 	mov	sp,r5
0935: 
0936: 	jsr	pc,_main
0937: 
0938: 	trap
0939: 
0940: 	br	user
0941: 
0942: setseg:
0943: 	mov	$8,r0
0944: 1:
0945: 	mov	r1,(r3)+
0946: 	add	$200,r1
0947: 	mov	r2,(r4)+
0948: 	sob	r0,1b
0949: 	rts	pc
0950: 
0951: .globl	_setseg
0952: _setseg:
0953: 	mov	2(sp),r1
0954: 	mov	r2,-(sp)
0955: 	mov	r3,-(sp)
0956: 	mov	r4,-(sp)
0957: 	mov	$77406,r2
0958: 	mov	$KISA0,r3
0959: 	mov	$KISD0,r4
0960: 	jsr	pc,setseg
0961: 	tst	_sepid	/If CPU is I space only,
0962: 	bne	1f	/ use alternate mapping
0963: 	mov	$IO,-(r3)
0964: 1:
0965: 	mov	(sp)+,r4
0966: 	mov	(sp)+,r3
0967: 	mov	(sp)+,r2
0968: 	rts	pc
0969: 
0970: / Disable separate I & D space,so that
0971: / non-separate I & D space unix monitors
0972: / and overlay test monitors can be booted
0973: / on separate I & D space CPU's.
0974: /
0975: / _ssid and _snsid must not be called
0976: / on CPU's without SSR3,such as 11/34,
0977: / 11/40,& 11/60.
0978: 
0979: .globl _snsid
0980: _snsid:
0981: 	bic	$7,*$SSR3
0982: 	bicb	$7,_rn_ssr3
0983: 	mov	$IO,*$KISA7	/ map to I/O space
0984: 	rts	pc
0985: 
0986: / Enable separate I & D space,in case it
0987: / got turned off somehow.
0988: 
0989: .globl _ssid
0990: _ssid:
0991: 	bis	$5,*$SSR3
0992: 	bisb	$5,_rn_ssr3
0993: 	rts	pc
0994: 
0995: / clrseg(addr,count)
0996: .globl	_clrseg
0997: _clrseg:
0998: 	mov	4(sp),r0
0999: 	beq	2f
1000: 	asr	r0
1001: 	bic	$!77777,r0
1002: 	mov	2(sp),r1
1003: 1:
1004: 	clr	-(sp)
1005: 	mtpi	(r1)+
1006: 	sob	r0,1b
1007: 2:
1008: 	rts	pc
1009: 
1010: 
1011: / mtpi(word,addr)
1012: .globl	_mtpi
1013: _mtpi:
1014: 	mov	4(sp),r0
1015: 	mov	2(sp),-(sp)
1016: 	mtpi	(r0)+
1017: 	rts	pc
1018: 
1019: / mfpi(addr),word returned in r0
1020: .globl _mfpi
1021: _mfpi:
1022: 	mov	2(sp),r1
1023: 	mfpi	(r1)
1024: 	mov	(sp)+,r0
1025: 	rts	pc
1026: 
1027: .globl	__rtt
1028: __rtt:
1029: 	halt
1030: 
1031: / Standalone bootstrap trap handler.
1032: / Any trap will call the trap handler (no return)
1033: / if trapok is zero.
1034: / If trapok is nonzero then bus error and
1035: / reserved instruction traps will set nxaddr and return.
1036: 
1037: .globl _trap
1038: 
1039: sbtrap:
1040: 	mov	*$PS,saveps
1041: 	mov	r0,-(sp)
1042: 	mov	r1,-(sp)
1043: 	mov	r2,-(sp)
1044: 	mov	r3,-(sp)
1045: 	mov	r4,-(sp)
1046: 	mov	r5,-(sp)
1047: 	mov	sp,-(sp)
1048: 	sub	$4,(sp)
1049: 	cmpb	saveps,$340
1050: 	beq	3f
1051: 	cmpb	saveps,$341
1052: 	bne	1f
1053: 3:
1054: 	tst	trapok
1055: 	bne	2f
1056: 1:
1057: 	mov	saveps,-(sp)
1058: 	jsr	pc,_trap
1059: 	halt		/ _trap never returns
1060: 	br	.
1061: 2:
1062: 	inc	nxaddr
1063: 	clr	trapok
1064: 	tst	(sp)+
1065: 	mov	(sp)+,r5
1066: 	mov	(sp)+,r4
1067: 	mov	(sp)+,r3
1068: 	mov	(sp)+,r2
1069: 	mov	(sp)+,r1
1070: 	mov	(sp)+,r0
1071: 	rtt
1072: 
1073: / Size memory by clearing or reading each word.
1074: / READMEM says size by reading (sdload - memory disk).
1075: / READMEM also says only need 512 KB of good memory for sdload,
1076: / allows installation on systems (like ours) with bad memory above 512KB.
1077: / UISA0 and UISD0 set by caller.
1078: 
1079: sizmem:
1080: .if READMEM
1081: 	br	1f
1082: .endif
1083: 	br	7f		/ Boot: - size memory by clearing
1084: 1:				/ sdload: - size memory by reading, so
1085: 	clr	nxaddr		/	    memory disk will not be erased.
1086: 	mov	$1,trapok
1087: 	mfpi	*$0
1088: 	tst	nxaddr
1089: 	bne	3f
1090: 	tst	(sp)+
1091: 	clr	r2
1092: 	mov	$32.,r1
1093: 2:
1094: 	mfpi	(r2)+
1095: 	tst	(sp)+
1096: 	sob	r1,2b
1097: 	inc	*$UISA0
1098: 	cmp	$8192.,*$UISA0	/ sdload only needs 512KB of good memory
1099: 	bhi	1b
1100: 	br	3f
1101: 7:
1102: 	clr	nxaddr
1103: 	mov	$1,trapok
1104: 	clr	-(sp)
1105: 	mtpi	*$0
1106: 	tst	nxaddr
1107: 	bne	3f
1108: 	clr	r2
1109: 	mov	$32.,r1
1110: 2:
1111: 	clr	-(sp)
1112: 	mtpi	(r2)+
1113: 	sob	r1,2b
1114: 	inc	*$UISA0
1115: 	cmp	_maxseg,*$UISA0	/ maxseg limits memory size (4MB - I/O page)
1116: 	bhi	7b		/ 11/44 - no NXM on 4MB CPU ???
1117: 3:
1118: 	rts	pc
1119: 
1120: PS	= 177776
1121: SSR0	= 177572
1122: SSR1	= 177574
1123: SSR2	= 177576
1124: SSR3	= 172516
1125: KISA0	= 172340
1126: KISA1	= 172342
1127: KISA6	= 172354
1128: KISA7	= 172356
1129: KISD0	= 172300
1130: KISD7	= 172316
1131: KDSA0	= 172360
1132: KDSA6	= 172374
1133: KDSA7	= 172376
1134: KDSD0	= 172320
1135: KDSD5	= 172332
1136: SISA0	= 172240
1137: SISA1	= 172242
1138: SISD0	= 172200
1139: SISD1	= 172202
1140: UISA0	= 177640
1141: UISD0	= 177600
1142: UDSA0	= 177660
1143: UDSD0	= 177620
1144: MSCR	= 177746	/ 11/70 memory control register
1145: UBMR0	= 170200	/ unibus map register base address
1146: CPER	= 177766	/ CPU error register address
1147: PCSR	= 172100	/ Memory parity base CSR address
1148: MREG	= 177750	/ Maintenacne register
1149: IO	= 177600
1150: SWR	= 177570
1151: 
1152: .data
1153: 
