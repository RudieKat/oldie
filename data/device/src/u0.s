0001: / u0 -- unix
0002: 
0003: cold = 0 
0004: orig = 0 . / orig = 0. relocatable
0005: 
0006: rkda = 177412 / disk address reg            rk03/rk11
0007: rkds = 177400 / driv status reg             rk03/rk11
0008: rkcs = 177404 / control status reg          rk03/rk11
0009: rcsr = 174000 / receiver status reg         dc-11
0010: rcbr = 174002 / receiver buffer reg         dc-11
0011: tcsr = 174004 / xmtr status reg             dc-11
0012: tcbr = 174006 / xmtr buffer reg             dc-11
0013: tcst = 177340 / dec tape control status     tc11/tu56
0014: tccm = 177342 / dec tape command reg        tc11/tu56
0015: tcwc = 177344 /          word count         tc11/tu56
0016: tcba = 177346 /          bus addr           tc11/tu56
0017: tcdt = 177350 /          data reg           tc11/tu56
0018: dcs  = 177460 / drum control status         rf11/rs11
0019: dae  = 177470 / drum address extension      rf11/rs11
0020: lks  = 177546 / clock status reg            kw11-l
0021: prs  = 177550 / papertape reader status     pc11
0022: prb  = 177552 /                  buffer     pc11
0023: pps  = 177554 /            punch status     pc11
0024: ppb  = 177556 /            punch buffer     pc11
0025: /lps = 177514   line printer status         (future)
0026: /lpb = 177516   line printer buffer         (future)
0027: tks  = 177560 / console read status         asr-33
0028: tkb  = 177562 /         read buffer         asr-33
0029: tps  = 177564 /         punch status        asr-33
0030: tpb  = 177566 /         punch buffer        asr-33
0031: ps   = 177776 / processor status
0032: 
0033: halt = 0
0034: wait = 1
0035: rti  = 2
0036: 
0037: nproc = 16. / number of processes
0038: nfiles = 50.
0039: ntty = 8+1
0040: nbuf = 6
0041:  .if cold / ignored if cold = 0
0042: nbuf = 2
0043: .endif
0044: 
0045: core = orig+40000  / specifies beginning of user's core
0046: ecore = core+20000 / specifies end of user's core (4096 words)
0047: 
0048: /      4;4     init by copy
0049: /      unkni;0 " error
0050: /      fpsym;0 " illg in tr
0051:        unkni;0 / trace and trap (see Sec. B.1 page  )
0052:        unkni;0 / trap
0053:        panic;0 / pwr
0054:        rtssym;0 / emt
0055:        sysent;0 / sys
0056:  . = orig+60
0057:        ttyi;240 / interrupt vector tty in       ; processor level 5
0058:        ttyo;240 / interrupt vector tty out
0059:        ppti;240 /                  punch papertape in
0060:        ppto;240 /                  punch papertape out
0061:        clock;340 / clock interrupt vector       ; processor level 7
0062:  . = orig+200
0063: /     lpto; 240  line printer interrupt     ; processor level 5 (future)
0064:  . = orig+204
0065:        drum;300 / drum interrupt         ; processor level 6
0066:  . = orig+214
0067:        tape;300 / dec tape interrupt
0068:        disk;300 / rk03 interrupt
0069:  . = orig+300
0070:        0*4+trcv; 240; 0*4+txmt; 240 / dc11 input,output interrupt vectors
0071:        1*4+trcv; 240; 1*4+txmt; 240
0072:        2*4+trcv; 240; 2*4+txmt; 240
0073:        3*4+trcv; 240; 3*4+txmt; 240
0074:        4*4+trcv; 240; 4*4+txmt; 240
0075:        5*4+trcv; 240; 5*4+txmt; 240
0076:        6*4+trcv; 240; 6*4+txmt; 240
0077:        7*4+trcv; 240; 7*4+txmt; 240
0078: 
0079:  . = orig+400
0080: / copy in transfer vectors
0081: 
0082: 	mov    $ecore,sp / put pointer to ecore in the stack pointer
0083: 	jsr    r0,copyz; 0; 14 / clear locations 0 to 14 in core
0084: 	mov    $4,r0
0085: 	clr    r1
0086: 	mov    r0,(r1)+ / put value of 4 into location 0
0087: 	mov    r0,(r1)+ / put value of 4 into location 2
0088: 	mov    $unkni,(r1)+ / put value of unkni into location 4;
0089:                             / time out, bus error
0090: 	clr    (r1)+ / put value of 0 into location 6
0091: 	mov    $fpsym,(r1)+ / put value of fpsym into location 10
0092: 	clr    (r1)+ / put value of 0 into location 12
0093: / clear core
0094: 	.if cold / ignored if cold = 0
0095: 	halt / halt before initializing rf file system; user has
0096:              / last chance to reconsider
0097: 	.endif
0098: 
0099: 	jsr    r0,copyz; systm; ecore / clear locations systm to ecore
0100: 	mov    $s.chrgt+2,clockp / intialize clockp
0101: / allocate tty buffers; see H.0 for description
0102: 	mov    $buffer,r0
0103: 	mov    $tty+6,r1
0104: 1:
0105: 	mov    r0,(r1)
0106: 	add    $140.,r0 / tty buffers are 140. bytes long
0107: 	add    $8,r1
0108: 	cmp    r1,$tty+[ntty*8] / has a buffer been assigned for each tty
0109: 	blo    1b
0110: 
0111: / allocate disk buffers; see H.0 for description
0112: 
0113: 	mov    $bufp,r1
0114: 1:
0115: 	mov    r0,(r1)+
0116: 	add    $8,r0
0117: 	mov    r0,-2(r0)             / bus address
0118: 	mov    $-256.,-4(r0)         / word count
0119: 	add    $512.,r0              / buffer space
0120: 	cmp    r1,$bufp+nbuf+nbuf
0121: 	blo    1b
0122: 	mov    $sb0,(r1)+            / I/O queue entry drum
0123: 	mov    $sb1,(r1)+ / I/O queue entry disk (mounted device)
0124: 	mov    $swp,(r1)+ / I/O queue entry core image being swapped
0125: 	mov    $[systm-inode]\/2,sb0+4 / sets up initial buffers per
0126:                                        / format given in
0127: 	mov    $systm,sb0+6 / memory map
0128: 	mov    $-512.,sb1+4
0129: 	mov    $mount,sb1+6
0130: 	mov    $user,swp+6
0131: 
0132: / set devices to interrupt
0133: 
0134: 	mov    $100,*$lks / put 100 into clock status register;
0135:                            / enables clock interrupt
0136: 
0137: / set up time out subroutines
0138: 
0139: 	mov    $touts,r0
0140: 	mov    $startty,(r0)+ / if toutt = 0 call startty
0141: 	mov    $pptito,(r0)+ / if toutt+1 = 0 call pptito
0142: 	tst    (r0)+ / add 2 to r0
0143: 	mov    $ntty-1,r1
0144: 1 :
0145: 	mov    $xmtto,(r0)+ / if toutt+2 thru toutt+2+ntty=0 call xmtto
0146: 	dec    r1
0147: 	bne    1b
0148: 
0149: / free all character blocks; see H.0 for description
0150: 
0151: 	mov    $510.,r2
0152: 	mov    $-1,r1
0153: 1:
0154: 	jsr    r0,put
0155: 	sub    $2,r2
0156: 	bgt    1b
0157: 
0158: / set up drum swap addresses; see H.0 for description
0159: 
0160: 	mov    $1024.-64.,r1 / highest drum address; high 64 blks allocated
0161:                               / to UNIX
0162: 	mov    $p.dska,r2 / p.dska contains dis addresses for processes
0163: 1 :
0164: 	sub    $17.,r1 / 17 blocks per process
0165: 	mov    r1,(r2)+
0166: 	cmp    r2,$p.dska+nproc+nproc
0167: 	bne    1b
0168: 
0169: / free rest of drum
0170: 
0171: 	.if cold
0172: 	mov    $128.,systm / initialize word 1 of drum superblock image;
0173:                            / number of bytes in free storage map=128.
0174: 	mov    $64.,systm+2+128. / init. wd 66. of superblock image; # of
0175:                                  / bytes in i-node map=64.
0176: 1:
0177: 	dec    r1 / r1=687.,...,34.
0178: 	jsr    r0,free / free block 'r1', i.e., set bit 'r1' in free
0179:                        / storage map in core
0180: 	cmp    r1,$34. / first drum address not in i list
0181: 	bgt    1b / if block 34 has been freed, zero i list
0182: 
0183: / zero i list
0184: 
0185: 1:
0186: 	dec    r1 / r1=33.,...,1
0187: 	jsr    r0,clear / zero block 'r1' on fixed head disk
0188: 	tst    r1
0189: 	bgt    1b / if blocks 33,...,1 have all been zeroed, done.
0190: 	.endif
0191: 
0192: / make current program a user
0193: 
0194: 	mov    $41.,r0 / rootdir set to 41 and never changed
0195: 	mov    r0,rootdir / rootdir is i-number of root directory
0196: 	mov    r0,u.cdir / u.cdir is i-number of process current directory
0197: 	mov    $1,r0
0198: 	movb   r0,u.uno / set process table index for this process to 1
0199: 	mov    r0,mpid / initialize mpid to 1
0200: 	mov    r0,p.pid / p.pid identifies process
0201: 	movb   r0,p.stat / process status = 1 i.e., active
0202:                          /                = 0 free
0203: 	.if cold         /                = 2 waiting for a child to die
0204:                          /                = 3 terminated but not yet waited
0205:                          /                  for
0206: 
0207: / initialize inodes for special files (inodes 1 to 40.)
0208: 
0209: 	mov    $40.,r1 / set r1=i-node-number 40.
0210: 1:
0211: 	jsr    r0,iget / read i-node 'r1' from disk into inode area of
0212:                        / core and write modified inode out (if any)
0213: 	mov    $100017,i.flgs / set flags in core image of inode to indi-
0214:                               / cate allocated, read (owner, non-owner),
0215:                               / write (owner, non-owner)
0216: 	movb   $1,i.nlks / set no. of links = 1
0217: 	movb   $1,i.uid / set user id of owner = 1
0218: 	jsr    r0,setimod / set imod=1 to indicate i-node modified, also
0219:                           / stuff time of modification into i-node
0220: 	dec    r1 / next i-node no. = present i-node no.-1
0221: 	bgt    1b / has i-node 1 been initialized; no, branch
0222: 
0223: / initialize i-nodes r1.,...,47. and write the root device, binary, etc.,
0224: / directories onto fixed head disk. user temporary, initialization prog.
0225: 
0226: 	mov    $idata,r0 / r0=base addr. of assembled directories.
0227: 	mov    $u.off,u.fofp / pointer to u.off in u.fofp (holds file
0228:                              / offset)
0229: 1:
0230: 	mov    (r0)+,r1/r1=41.,...,47; "0" in the assembled directory
0231:                        / header signals last
0232: 	beq    1f      / assembled directory has been written onto drum
0233: 	jsr    r0,imap / locate the inode map bit for i-node 'r1'
0234: 	bisb   mq,(r2) / set the bit to indicate the i-node is not
0235:                        / available
0236: 	jsr    r0,iget / read inode 'r1' from disk into inode area of
0237:                        / core and write modified i-node on drum (if any)
0238: 	mov    (r0)+,i.flgs / set flags in core image of inode from
0239:                             / assembled directories header
0240: 	movb   (r0)+,i.nlks / set no. of links from header
0241: 	movb   (r0)+,i.uid / set user id of owner from header
0242: 	jsr    r0,setimod / set imod=1 to indicate inode modified; also,
0243:                           / stuff time of modification into i-node
0244: 	mov    (r0)+,u.count / set byte count for write call equal to
0245:                              / size of directory
0246: 	mov    r0,u.base / set buffer address for write to top of directory
0247: 	clr    u.off / clear file offset used in 'seek' and 'tell'
0248: 	add    u.count,r0 / r0 points to the header of the next directory
0249: 	jsr    r0,writei / write the directory and i-node onto drum
0250: 	br     1b / do next directory
0251: 	.endif
0252: 
0253: / next 2 instructions not executed during cold boot.
0254: 	bis    $2000,sb0 / sb0 I/O queue entry for superblock on drum;
0255:                          / set bit 10 to 1
0256: 	jsr    r0,ppoke / read drum superblock
0257: 1:
0258: 	tstb   sb0+1 / has I/O request been honored (for drum)?
0259: 	bne    1b / no, continue to idle.
0260: 1:
0261: 	decb   sysflg / mormally sysflag=0, indicates executing in system
0262: 	sys    exec; 2f; 1f / generates trap interrupt; trap vector =
0263:                             / sysent; 0
0264: 	br     panic / execute file/etc/init
0265: 
0266: 1:
0267: 	2f;0
0268: 2:
0269: 	</etc/init\0> / UNIX looks for strings term, noted by nul\0
0270: 
0271: panic:
0272: 	clr    ps
0273: 1:
0274: 	dec    $0
0275: 	bne    1b
0276: 	dec    $5
0277: 	bne    1b
0278: 	jmp    *$173700 / rom loader address
0279: rtssym:
0280: 	mov    r0,-(sp)
0281: 	mov    r1,-(sp)
0282: 	mov    4(sp),r0
0283: 	mov    -(r0),r0
0284: 	bic    $!7,r0
0285: 	asl    r0
0286: 	jmp    *1f(r0)
0287: 1:
0288: 	0f;1f;2f;3f;4f;5f;badrts;7f
0289: 0:
0290: 	mov    2(sp),r0
0291: 	br     1f
0292: 2:
0293: 	mov    r2,r1
0294: 	br     1f
0295: 3:
0296: 	mov    r3,r1
0297: 	br     1f
0298: 4:
0299: 	mov    r4,r1
0300: 	br     1f
0301: 5:
0302: 	mov     r5,r1
0303: 	br     1f
0304: 7:
0305: 	mov    8.(sp),r1
0306: 1:
0307: 	cmp    r1,$core
0308: 	blo    badrts
0309: 	cmp    r1,$ecore
0310: 	bhis   badrts
0311: 	bit    $1,r1
0312: 	bne    badrts
0313: 	tst    (r1)
0314: 	beq    badrts
0315: 	add    $1f,r0
0316: 	mov    r0,4(sp)
0317: 	mov    (sp)+,r1
0318: 	mov    (sp)+,r0
0319: 	rti
0320: 1:
0321: 	rts    r0
0322: 	rts    r1
0323: 	rts    r2
0324: 	rts    r3
0325: 	rts    r4
0326: 	rts    r5
0327: 	rts    sp
0328: 	rts    pc
0329: 
0330: badrts:
0331: 	mov    (sp)+,r1
0332: 	mov    (sp)+,r0
0333: rpsym:
0334: 	jmp    unkni
0335: 
0336: 	.if cold
0337: 
0338: idata:
0339: 
0340: / root
0341: 
0342: 	41.
0343: 	140016
0344: 	.byte 7,1
0345: 	9f-.-2
0346: 	41.
0347: 	<..\0\0\0\0\0\0>
0348: 	41.
0349: 	<.\0\0\0\0\0\0\0>
0350: 	42.
0351: 	<dev\0\0\0\0\0>
0352: 	43.
0353: 	<bin\0\0\0\0\0>
0354: 	44.
0355: 	<etc\0\0\0\0\0>
0356: 	45.
0357: 	<usr\0\0\0\0\0>
0358: 	46.
0359: 	<tmp\0\0\0\0\0>
0360: 9:
0361: 
0362: / device directory
0363: 
0364: 	42.
0365: 	140016
0366: 	.byte 2,1
0367: 	9f-.-2
0368: 	41.
0369: 	<..\0\0\0\0\0\0>
0370: 	42.
0371: 	<.\0\0\0\0\0\0\0>
0372: 	01.
0373: 	<tty\0\0\0\0\0>
0374: 	02.
0375: 	<ppt\0\0\0\0\0>
0376: 	03.
0377: 	<mem\0\0\0\0\0>
0378: 	04.
0379: 	<rf0\0\0\0\0\0>
0380: 	05.
0381: 	<rk0\0\0\0\0\0>
0382: 	06.
0383: 	<tap0\0\0\0\0>
0384: 	07.
0385: 	<tap1\0\0\0\0>
0386: 	08.
0387: 	<tap2\0\0\0\0>
0388: 	09.
0389: 	<tap3\0\0\0\0> 
0390: 	10.
0391: 	<tap4\0\0\0\0>
0392: 	11.
0393: 	<tap5\0\0\0\0>
0394: 	12.
0395: 	<tap6\0\0\0\0>
0396: 	13.
0397: 	<tap7\0\0\0\0>
0398: 	14.
0399: 	<tty0\0\0\0\0>
0400: 	15.
0401: 	<tty1\0\0\0\0>
0402: 	16.
0403: 	<tty2\0\0\0\0>
0404: 	17.
0405: 	<tty3\0\0\0\0>
0406: 	18.
0407: 	<tty4\0\0\0\0>
0408: 	19.
0409: 	<tty5\0\0\0\0>
0410: 	20.
0411: 	<tty6\0\0\0\0>
0412: 	21.
0413: 	<tty7\0\0\0\0>
0414: 	22.
0415: 	<lpr\0\0\0\0\0>
0416: 	01.
0417: 	<tty8\0\0\0\0> / really tty
0418: 9:
0419: 
0420: / binary directory
0421: 
0422: 	43.
0423: 	140016
0424: 	.byte 2,3
0425: 	9f-.-2
0426: 	41.
0427: 	<..\0\0\0\0\0\0>
0428: 	43.
0429:   	<.\0\0\0\0\0\0\0>
0430: 9:
0431: 
0432: / etcetra directory
0433: 
0434: 	44.
0435: 	140016
0436: 	.byte 2,3
0437: 	9f-.-2
0438: 	41.
0439: 	<..\0\0\0\0\0\0>
0440: 	44.
0441: 	<.\0\0\0\0\0\0\0>
0442: 	47.
0443: 	<init\0\0\0\0>
0444: 9:
0445: 
0446: / user directory
0447: 
0448: 	45.
0449: 	140016
0450: 	.byte 2,1
0451: 	9f-.-2
0452: 	41.
0453: 	<..\0\0\0\0\0\0>
0454: 	45.
0455: 	<.\0\0\0\0\0\0\0>
0456: 9:
0457: 
0458: / temporary directory
0459: 
0460: 	46.
0461: 	140017
0462: 	.byte 2,1
0463: 	9f-.-2
0464: 	41.
0465: 	<..\0\0\0\0\0\0>
0466: 	46.
0467: 	<.\0\0\0\0\0\0\0>
0468: 9:
0469: 
0470: / initialization program
0471: 
0472: 	47.
0473: 	100036
0474: 	.byte 1,3
0475: 	9f-.-2
0476: 8:
0477: 	sys    break; 0
0478: 	sys    open; 6f-8b+core; 0
0479: 	mov    r0,r1
0480: 	sys    seek; 65.; 0
0481: 1:
0482: 	mov    r1,r0
0483: 	sys    read; 9f-8b+core; 512.
0484: 	mov    9f,r5            / size
0485: 	beq    1f
0486: 	sys    creat; 9f-8b+core+4; 0
0487: 	mov    r0,r2
0488: 	movb   9f+2,0f
0489: 	sys    chmod; 9f-8b+core+4; 0:..
0490: 	movb   9f+3,0f
0491: 	sys    chown; 9f-8b+core+4; 0:..
0492: 2:
0493: 	tst    r5
0494: 	beq    2f
0495: 	mov    r1,r0
0496: 	sys    read; 9f-8b+core; 512.
0497: 	mov    $512.,0f
0498: 	cmp    r5,$512.
0499: 	bhi    3f
0500: 	mov    r5,0f
0501: 3:
0502: 	mov    r2,r0
0503: 	sys    write; 9f-8b+core; 0:..
0504: 	sub    r0,r5
0505: 	br     2b
0506: 2:
0507: 	mov    r2,r0
0508: 	sys    close
0509: 	br     1b
0510: 1:
0511: 	mov    r1,r0
0512: 	sys    close
0513: 	sys    exec; 5f-8b+core; 4f-8b+core
0514: 	sys    exit
0515: 4:
0516: 	5f-8b+core; 0
0517: 5:
0518: 	</etc/init\0>
0519: 6:
0520: 	</dev/tap0\0>
0521: 	.even
0522: 9:
0523: 
0524: / end of initialization data
0525: 
0526: 	0
0527: 
0528: 	.endif
0529: 

Ultrix-3.1/src/cmd/as/as19.s
0001: /
0002: //////////////////////////////////////////////////////////////////////
0003: /   Copyright (c) Digital Equipment Corporation 1984, 1985, 1986.    /
0004: /   All Rights Reserved. 					     /
0005: /   Reference "/usr/src/COPYRIGHT" for applicable restrictions.      /
0006: //////////////////////////////////////////////////////////////////////
0007: /
0008: .data
0009: sccsid19:
0010: <@(#)as19.s 3.0 as19.s\0>
0011: .even
0012: .text
0013: 
0014: / a9 -- pdp-11 assembler pass 1
0015: 
0016: eae = 0
0017: 
0018: / key to types
0019: 
0020: /	0	undefined
0021: /	1	absolute
0022: /	2	text
0023: /	3	data
0024: /	4	bss
0025: /	5	flop freg,dst (movfo, = stcfd)
0026: /	6	branch
0027: /	7	jsr
0028: /	10	rts
0029: /	11	sys
0030: /	12	movf (=ldf,stf)
0031: /	13	double operand (mov)
0032: /	14	flop fsrc,freg (addf)
0033: /	15	single operand (clr)
0034: /	16	.byte
0035: /	17	string (.ascii, "<")
0036: /	20	.even
0037: /	21	.if
0038: /	22	.endif
0039: /	23	.globl
0040: /	24	register
0041: /	25	.text
0042: /	26	.data
0043: /	27	.bss
0044: /	30	mul,div, etc
0045: /	31	sob
0046: /	32	.comm
0047: /	33	estimated text
0048: /	34	estimated data
0049: /	35	jbr
0050: /	36	jeq, jne, etc
0051: 
0052: 	.data
0053: symtab:
0054: / special variables
0055: 
0056: <.\0\0\0\0\0\0\0>; dotrel:02; dot:000000
0057: <..\0\0\0\0\0\0>;	01; dotdot:000000
0058: 
0059: / register
0060: 
0061: <r0\0\0\0\0\0\0>;	24;000000
0062: <r1\0\0\0\0\0\0>;	24;000001
0063: <r2\0\0\0\0\0\0>;	24;000002
0064: <r3\0\0\0\0\0\0>;	24;000003
0065: <r4\0\0\0\0\0\0>;	24;000004
0066: <r5\0\0\0\0\0\0>;	24;000005
0067: <sp\0\0\0\0\0\0>;	24;000006
0068: <pc\0\0\0\0\0\0>;	24;000007
0069: 
0070: .if eae
0071: 
0072: /eae & switches
0073: 
0074: <csw\0\0\0\0\0>;	01;177570
0075: <div\0\0\0\0\0>;	01;177300
0076: <ac\0\0\0\0\0\0>;	01;177302
0077: <mq\0\0\0\0\0\0>;	01;177304
0078: <mul\0\0\0\0\0>;	01;177306
0079: <sc\0\0\0\0\0\0>;	01;177310
0080: <sr\0\0\0\0\0\0>;	01;177311
0081: <nor\0\0\0\0\0>;	01;177312
0082: <lsh\0\0\0\0\0>;	01;177314
0083: <ash\0\0\0\0\0>;	01;177316
0084: 
0085: .endif
0086: 
0087: / double operand
0088: 
0089: <mov\0\0\0\0\0>;	13;0010000
0090: <movb\0\0\0\0>;		13;0110000
0091: <cmp\0\0\0\0\0>;	13;0020000
0092: <cmpb\0\0\0\0>;		13;0120000
0093: <bit\0\0\0\0\0>;	13;0030000
0094: <bitb\0\0\0\0>;		13;0130000
0095: <bic\0\0\0\0\0>;	13;0040000
0096: <bicb\0\0\0\0>;		13;0140000
0097: <bis\0\0\0\0\0>;	13;0050000
0098: <bisb\0\0\0\0>;		13;0150000
0099: <add\0\0\0\0\0>;	13;0060000
0100: <sub\0\0\0\0\0>;	13;0160000
0101: 
0102: / branch
0103: 
0104: <br\0\0\0\0\0\0>;	06;0000400
0105: <bne\0\0\0\0\0>;	06;0001000
0106: <beq\0\0\0\0\0>;	06;0001400
0107: <bge\0\0\0\0\0>;	06;0002000
0108: <blt\0\0\0\0\0>;	06;0002400
0109: <bgt\0\0\0\0\0>;	06;0003000
0110: <ble\0\0\0\0\0>;	06;0003400
0111: <bpl\0\0\0\0\0>;	06;0100000
0112: <bmi\0\0\0\0\0>;	06;0100400
0113: <bhi\0\0\0\0\0>;	06;0101000
0114: <blos\0\0\0\0>;		06;0101400
0115: <bvc\0\0\0\0\0>;	06;0102000
0116: <bvs\0\0\0\0\0>;	06;0102400
0117: <bhis\0\0\0\0>;		06;0103000
0118: <bec\0\0\0\0\0>;	06;0103000
0119: <bcc\0\0\0\0\0>;	06;0103000
0120: <blo\0\0\0\0\0>;	06;0103400
0121: <bcs\0\0\0\0\0>;	06;0103400
0122: <bes\0\0\0\0\0>;	06;0103400
0123: 
0124: / jump/branch type
0125: 
0126: <jbr\0\0\0\0\0>;	35;0000400
0127: <jne\0\0\0\0\0>;	36;0001000
0128: <jeq\0\0\0\0\0>;	36;0001400
0129: <jge\0\0\0\0\0>;	36;0002000
0130: <jlt\0\0\0\0\0>;	36;0002400
0131: <jgt\0\0\0\0\0>;	36;0003000
0132: <jle\0\0\0\0\0>;	36;0003400
0133: <jpl\0\0\0\0\0>;	36;0100000
0134: <jmi\0\0\0\0\0>;	36;0100400
0135: <jhi\0\0\0\0\0>;	36;0101000
0136: <jlos\0\0\0\0>;		36;0101400
0137: <jvc\0\0\0\0\0>;	36;0102000
0138: <jvs\0\0\0\0\0>;	36;0102400
0139: <jhis\0\0\0\0>;		36;0103000
0140: <jec\0\0\0\0\0>;	36;0103000
0141: <jcc\0\0\0\0\0>;	36;0103000
0142: <jlo\0\0\0\0\0>;	36;0103400
0143: <jcs\0\0\0\0\0>;	36;0103400
0144: <jes\0\0\0\0\0>;	36;0103400
0145: 
0146: / single operand
0147: 
0148: <clr\0\0\0\0\0>;	15;0005000
0149: <clrb\0\0\0\0>;		15;0105000
0150: <com\0\0\0\0\0>;	15;0005100
0151: <comb\0\0\0\0>;		15;0105100
0152: <inc\0\0\0\0\0>;	15;0005200
0153: <incb\0\0\0\0>;		15;0105200
0154: <dec\0\0\0\0\0>;	15;0005300
0155: <decb\0\0\0\0>;		15;0105300
0156: <neg\0\0\0\0\0>;	15;0005400
0157: <negb\0\0\0\0>;		15;0105400
0158: <adc\0\0\0\0\0>;	15;0005500
0159: <adcb\0\0\0\0>;		15;0105500
0160: <sbc\0\0\0\0\0>;	15;0005600
0161: <sbcb\0\0\0\0>;		15;0105600
0162: <tst\0\0\0\0\0>;	15;0005700
0163: <tstb\0\0\0\0>;		15;0105700
0164: <ror\0\0\0\0\0>;	15;0006000
0165: <rorb\0\0\0\0>;		15;0106000
0166: <rol\0\0\0\0\0>;	15;0006100
0167: <rolb\0\0\0\0>;		15;0106100
0168: <asr\0\0\0\0\0>;	15;0006200
0169: <asrb\0\0\0\0>;		15;0106200
0170: <asl\0\0\0\0\0>;	15;0006300
0171: <aslb\0\0\0\0>;		15;0106300
0172: <jmp\0\0\0\0\0>;	15;0000100
0173: <swab\0\0\0\0>;		15;0000300
0174: 
0175: / jsr
0176: 
0177: <jsr\0\0\0\0\0>;	07;0004000
0178: 
0179: / rts
0180: 
0181: <rts\0\0\0\0\0>;	010;000200
0182: 
0183: / simple operand
0184: 
0185: <sys\0\0\0\0\0>;	011;104400
0186: 
0187: / flag-setting
0188: 
0189: <clc\0\0\0\0\0>;	01;0000241
0190: <clv\0\0\0\0\0>;	01;0000242
0191: <clz\0\0\0\0\0>;	01;0000244
0192: <cln\0\0\0\0\0>;	01;0000250
0193: <sec\0\0\0\0\0>;	01;0000261
0194: <sev\0\0\0\0\0>;	01;0000262
0195: <sez\0\0\0\0\0>;	01;0000264
0196: <sen\0\0\0\0\0>;	01;0000270
0197: 
0198: / floating point ops
0199: 
0200: <cfcc\0\0\0\0>;		01;170000
0201: <setf\0\0\0\0>;		01;170001
0202: <setd\0\0\0\0>;		01;170011
0203: <seti\0\0\0\0>;		01;170002
0204: <setl\0\0\0\0>;		01;170012
0205: <clrf\0\0\0\0>;		15;170400
0206: <negf\0\0\0\0>;		15;170700
0207: <absf\0\0\0\0>;		15;170600
0208: <tstf\0\0\0\0>;		15;170500
0209: <movf\0\0\0\0>;		12;172400
0210: <movif\0\0\0>;		14;177000
0211: <movfi\0\0\0>;		05;175400
0212: <movof\0\0\0>;		14;177400
0213: <movfo\0\0\0>;		05;176000
0214: <addf\0\0\0\0>;		14;172000
0215: <subf\0\0\0\0>;		14;173000
0216: <mulf\0\0\0\0>;		14;171000
0217: <divf\0\0\0\0>;		14;174400
0218: <cmpf\0\0\0\0>;		14;173400
0219: <modf\0\0\0\0>;		14;171400
0220: <movie\0\0\0>;		14;176400
0221: <movei\0\0\0>;		05;175000
0222: <ldfps\0\0\0>;		15;170100
0223: <stfps\0\0\0>;		15;170200
0224: <fr0\0\0\0\0\0>;	24;000000
0225: <fr1\0\0\0\0\0>;	24;000001
0226: <fr2\0\0\0\0\0>;	24;000002
0227: <fr3\0\0\0\0\0>;	24;000003
0228: <fr4\0\0\0\0\0>;	24;000004
0229: <fr5\0\0\0\0\0>;	24;000005
0230: 
0231: / 11/45 operations
0232: 
0233: <als\0\0\0\0\0>;	30;072000
0234: <alsc\0\0\0\0>;		30;073000
0235: <mpy\0\0\0\0\0>;	30;070000
0236: .if eae-1
0237: <mul\0\0\0\0\0>;	30;070000
0238: <div\0\0\0\0\0>;	30;071000
0239: <ash\0\0\0\0\0>;	30;072000
0240: <ashc\0\0\0\0>;		30;073000
0241: .endif
0242: <dvd\0\0\0\0\0>;	30;071000
0243: <xor\0\0\0\0\0>;	07;074000
0244: <sxt\0\0\0\0\0>;	15;006700
0245: <mark\0\0\0\0>;		11;006400
0246: <sob\0\0\0\0\0>;	31;077000
0247: 
0248: / specials
0249: 
0250: <.byte\0\0\0>;		16;000000
0251: <.even\0\0\0>;		20;000000
0252: <.if\0\0\0\0\0>;	21;000000
0253: <.endif\0\0>;		22;000000
0254: <.globl\0\0>;		23;000000
0255: <.text\0\0\0>;		25;000000
0256: <.data\0\0\0>;		26;000000
0257: <.bss\0\0\0\0>;		27;000000
0258: <.comm\0\0\0>;		32;000000
0259: 
0260: ebsymtab:
0261: 
0262: 
0263: start:
0264: 	sys	signal; 2; 1
0265: 	ror	r0
0266: 	bcs	1f
0267: 	sys	signal; 2; aexit
0268: 1:
0269: 	mov	(sp)+,r0
0270: 	tst	(sp)+
0271: 1:
0272: 	mov	(sp),r1
0273: 	cmpb	(r1),$'-
0274: 	bne	1f
0275: 	tst	(sp)+
0276: 	dec	r0
0277: 	cmpb	1(r1),$'u
0278: 	bne	2f
0279: 	movb	$'g,unglob
0280: 	br	1b
0281: 2:
0282: 	tstb	1(r1)
0283: 	bne	2f
0284: 	movb	$'g,unglob
0285: 	br	1b
0286: 2:
0287: 	cmpb	1(r1),$'V
0288: 	bne	2f
0289: 	movb	$'V,ovloc
0290: 	br	1b
0291: 2:
0292: 	cmpb	1(r1),$'o
0293: 	bne	1f
0294: 	mov	(sp),outfp
0295: 	tst	(sp)+
0296: 	dec	r0
0297: 	br	1b
0298: 1:
0299: 	movb	r0,nargs
0300: 	tst	-(sp)
0301: 	mov	sp,curarg
0302: 
0303: 	sys	getpid
0304: 	mov	r0,a.pid
0305: 	mov	$a.tmp1,a.pnt
0306: 	clr	r4
0307: L7:
0308: 	cmp	$3,r4
0309: 	jle	L8
0310: 	clr	r3
0311: L10:
0312: 	cmp	$6,r3
0313: 	jle	L11
0314: 	mov	$7,r0
0315: 	mov	r3,r1
0316: 	mul	$3,r1
0317: 	ash	r1,r0
0318: 	mov	a.pid,r1
0319: 	com	r1
0320: 	bic	r1,r0
0321: 	mov	r3,r1
0322: 	mul	$3,r1
0323: 	neg	r1
0324: 	ash	r1,r0
0325: 	add	$60,r0
0326: 	mov	a.pnt,r1
0327: 	add	$16,r1
0328: 	sub	r3,r1
0329: 	movb	r0,(r1)
0330: 	inc	r3
0331: 	jbr	L10
0332: L11:
0333: 	add	$20,a.pnt
0334: 	inc	r4
0335: 	jbr	L7
0336: L8:
0337: 
0338: 	jsr	r5,fcreat; a.tmp1
0339: 	movb	r0,pof
0340: 	jsr	r5,fcreat; a.tmp2
0341: 	movb	r0,fbfil
0342: 	jsr	pc,setup
0343: 	jmp	go
0344: 
0345: setup:
0346: 	mov	$symtab,r1
0347: 1:
0348: 	clr	r3
0349: 	mov	$8,r2
0350: 	mov	r1,-(sp)
0351: 2:
0352: 	movb	(r1)+,r4
0353: 	beq	2f
0354: 	add	r4,r3
0355: 	swab	r3
0356: 	sob	r2,2b
0357: 2:
0358: 	clr	r2
0359: 	div	$hshsiz,r2
0360: 	ashc	$1,r2
0361: 	add	$hshtab,r3
0362: 4:
0363: 	sub	r2,r3
0364: 	cmp	r3,$hshtab
0365: 	bhi	3f
0366: 	add	$2*hshsiz,r3
0367: 3:
0368: 	tst	-(r3)
0369: 	bne	4b
0370: 	mov	(sp)+,r1
0371: 	mov	r1,(r3)
0372: 	add	$12.,r1
0373: 	cmp	r1,$ebsymtab
0374: 	blo	1b
0375: 	rts	pc
0376: 
0377: /overlay buffer
0378: inbuf	= setup
0379: .	=inbuf+512.
0380: 
