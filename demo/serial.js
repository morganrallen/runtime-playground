"use strict";

var PORT = 0x3f8;

function serial_received() {
  return inb(PORT + 5) & 1;
}

function read_serial() {
  var c = -1;;
  do {
    c = inb(0x3f8 + 5);
  } while ((c & 0x1e) || ((c & 1) == 0));
  c = inb(0x3f8);
  return c;
}

function is_transmit_empty() {
  return inb(PORT + 5) & 0x20;
}

function write_serial(a) {
  while (is_transmit_empty() === 0);

  outb(PORT,a);
}

module.exports = {
  init: function() {
    outb(PORT + 1, 0x00);    // Disable all interrupts
    outb(PORT + 3, 0x80);    // Enable DLAB (set baud rate divisor)
    outb(PORT + 0, 0x03);    // Set divisor to 3 (lo byte) 38400 baud
    outb(PORT + 1, 0x00);    //                  (hi byte)
    outb(PORT + 3, 0x03);    // 8 bits, no parity, one stop bit
    outb(PORT + 2, 0xC7);    // Enable FIFO, clear them, with 14-byte threshold
    outb(PORT + 4, 0x0B);    // IRQs enabled, RTS/DSR set
  },

  read: read_serial,

  write: function(str) {
    for(var i = 0; i < str.length; i++) {
      write_serial(str.charCodeAt(i));
    }
  }
};
