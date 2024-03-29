0001: / ux -- unix
0002: 
0003: systm:
0004: 
0005: 	.=.+2
0006: 	.=.+128.
0007: 	.=.+2
0008: 	.=.+64.
0009: 	s.time: .=.+4
0010: 	s.syst: .=.+4
0011: 	s.wait: .=.+4
0012: 	s.idlet:.=.+4
0013: 	s.chrgt:.=.+4
0014: 	s.drerr:.=.+2
0015: inode:
0016: 	i.flgs: .=.+2
0017: 	i.nlks: .=.+1
0018: 	i.uid:  .=.+1
0019: 	i.size: .=.+2
0020: 	i.dskp: .=.+16.
0021: 	i.ctim: .=.+4
0022: 	i.mtim: .=.+4
0023: 	. = inode+32.
0024: mount:	.=.+1024.
0025: proc:
0026: 	p.pid:  .=.+[2*nproc]
0027: 	p.dska: .=.+[2*nproc]
0028: 	p.ppid: .=.+[2*nproc]
0029: 	p.break:.=.+[2*nproc]
0030: 	p.link: .=.+nproc
0031: 	p.stat: .=.+nproc
0032: tty:
0033: 	. = .+[ntty*8.]
0034: fsp:	.=.+[nfiles*8.]
0035: bufp:	.=.+[nbuf*2]+6
0036: sb0:	.=.+8
0037: sb1:	.=.+8
0038: swp:	.=.+8
0039: ii:	.=.+2
0040: idev:	.=.+2
0041: cdev:	.=.+2
0042: deverr: .=.+12.
0043: active:	.=.+2
0044: rfap:	.=.+2
0045: rkap:	.=.+2
0046: tcap:	.=.+2
0047: tcstate:.=.+2
0048: tcerrc:	.=.+2
0049: mnti:	.=.+2
0050: mntd:	.=.+2
0051: mpid:	.=.+2
0052: clockp:	.=.+2
0053: rootdir:.=.+2
0054: toutt:	.=.+16.; touts: .=.+32.
0055: runq:	.=.+6
0056: 
0057: wlist:	.=.+40.
0058: cc:	.=.+30.
0059: cf:	.=.+31.
0060: cl:	.=.+31.
0061: clist:	.=.+510.
0062: imod:	.=.+1
0063: smod:	.=.+1
0064: mmod:	.=.+1
0065: uquant:	.=.+1
0066: sysflg:	.=.+1
0067: pptiflg:.=.+1
0068: ttyoch:	.=.+1
0069:  .even
0070:  .=.+100.; sstack:
0071: buffer:	.=.+[ntty*140.]
0072: 	.=.+[nbuf*520.]
0073: 
0074:  . = core-64.
0075: user:
0076: 	u.sp:    .=.+2
0077: 	u.usp:   .=.+2
0078: 	u.r0:    .=.+2
0079: 	u.cdir:  .=.+2
0080: 	u.fp:    .=.+10.
0081: 	u.fofp:  .=.+2
0082: 	u.dirp:  .=.+2
0083: 	u.namep: .=.+2
0084: 	u.off:   .=.+2
0085: 	u.base:  .=.+2
0086: 	u.count: .=.+2
0087: 	u.nread: .=.+2
0088: 	u.break: .=.+2
0089: 	u.ttyp:  .=.+2
0090: 	u.dirbuf:.=.+10.
0091: 	u.pri:   .=.+2
0092: 	u.intr:  .=.+2
0093: 	u.quit:  .=.+2
0094: 	u.emt:   .=.+2
0095: 	u.ilgins:.=.+2
0096: 	u.cdev:  .=.+2
0097: 	u.uid:   .=.+1
0098: 	u.ruid:  .=.+1
0099: 	u.bsys:  .=.+1
0100: 	u.uno:   .=.+1
0101: . = core
0102: 

V2/cmd/db4.s
0001: / db4 -- debugger
0002: 
0003: maxsym = 24000.
0004: core:
0005:    <core\0>
0006: a.out:
0007:    <a.out\0>
0008: .even
0009: zero:	0
0010: .bss
0011: regbuf:
0012: 	u.sp:	.=.+2
0013: 	u.usp:	.=.+2
0014: 	u.uusp:	.=.+2
0015: 	u.break:.=.+2
0016: 	u.r0:	.=.+2
0017: 	u.savps:.=.+2
0018: 	u.core:	.=.+2
0019: 	.=regbuf+512.
0020: 	u.pusp:	.=.+2
0021: .data
0022: objmagic: br .+20
0023: namsiz:	nambuf
0024: incdot: 2
0025: nlcom: '/
0026: 
0027: regnames:
0028: 	<sp\0\0\0\0\0\0>; 1; 161000
0029: 	<ps\0\0\0\0\0\0>; 1; 160776
0030: 	<pc\0\0\0\0\0\0>; 1; 160774
0031: 	<r0\0\0\0\0\0\0>; 1; 160772
0032: 	<r1\0\0\0\0\0\0>; 1; 160770
0033: 	<r2\0\0\0\0\0\0>; 1; 160766
0034: 	<r3\0\0\0\0\0\0>; 1; 160764
0035: 	<r4\0\0\0\0\0\0>; 1; 160762
0036: 	<r5\0\0\0\0\0\0>; 1; 160760
0037: .if fpp
0038: fregnames:
0039: 	<fr0\0\0\0\0\0>; 1; 160754
0040: 	<fr1\0\0\0\0\0>; 1; 160750
0041: 	<fr2\0\0\0\0\0>; 1; 160744
0042: 	<fr3\0\0\0\0\0>; 1; 160740
0043: 	<fr4\0\0\0\0\0>; 1; 160734
0044: 	<fr5\0\0\0\0\0>; 1; 160730
0045: .endif
0046: ereg:
0047: 
0048: 	.bss
0049: 
0050: starmod:.=.+2
0051: symbol:	.=.+10.
0052: getoff:	.=.+2
0053: namstrt: .=.+2
0054: bytemod: .=.+2
0055: savsp: .=.+2
0056: error: .=.+2
0057: ttyfin: .=.+2
0058: dbfin: .=.+2
0059: dbfout: .=.+2
0060: ch: .=.+2
0061: lastop: .=.+2
0062: addres: .=.+2
0063: taddr: .=.+2
0064: adrflg: .=.+2
0065: f.size:	.=.+2
0066: fpsr:	.=.+2
0067: och:	.=.+2
0068: dot: .=.+2
0069: count: .=.+2
0070: syscnt: .=.+2
0071: temp: .=.+2
0072: temp1: .=.+2
0073: obuf: .=.+8.
0074: ecore = db+8192.
0075: inbuf: .=.+128.
0076: nambuf:	.=.+20
0077: 
