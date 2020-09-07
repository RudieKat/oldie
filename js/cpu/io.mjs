/*jshint esversion:6*/

/**
 * This is mildly insane
 * Addresses offset by 0x100. Functionality in 0x0 and 0x1 dependent on bit 7 (0x80) in 0x03
 * 
 * 0x00:    Data register: read from RCV buf, write to TMT bug
 * 0x01:    Enable/disable interrupts
 * 0x02:    Interrupt id and and FIFO register control
 * 0x03:    Line control, bit 7 (0x80) is the DLAB bit, when set 0x00 
 *          is divisor low byte (controlling the baud rate) is divisor high byte
 *          divisor 1 = 115200 baud, 2 = 57600, 3=38400, 4=28800, 5= 23040, 6=19200, 8=14400, 12=9600
 *          
 * IO is done by
 * 1: installing a device on  0x110 (setting a specific bit to 1)
 * 2: writing 1 to the right interrupt adress (0x101,0x102,0x103,0x104)
 * 3: 
 */
/*
void init_serial() {
   outb(PORT + 1, 0x00);    // Disable all interrupts
   outb(PORT + 3, 0x80);    // Enable DLAB (set baud rate divisor)
   outb(PORT + 0, 0x03);    // Set divisor to 3 (lo byte) 38400 baud
   outb(PORT + 1, 0x00);    //                  (hi byte)
   outb(PORT + 3, 0x03);    // 8 bits, no parity, one stop bit
   outb(PORT + 2, 0xC7);    // Enable FIFO, clear them, with 14-byte threshold
   outb(PORT + 4, 0x0B);    // IRQs enabled, RTS/DSR set
}*/