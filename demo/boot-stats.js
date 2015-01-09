"use strict";

function fmt(s) {
  s = String(s);
  if(s.length === 1) {
    return "0" + s;
  }
  if(s.length === 3) {
    return " " + s;
  }
  return s;
}

function dumpMem(buf, screen, offset) {
  for(var pos = 0; pos < buf.length; pos++) {
    if(pos % 8 === 0) {
      var blkAddr = ((offset || 0) + Math.floor(pos / 8));
      screen.write("0x" + fmt(blkAddr.toString(16)));
      screen.write("    ");
    }

    screen.write(fmt(buf[pos].toString(16)));
    screen.write(" ");

    if(pos % 4 === 3) {
      screen.write("   ");
    }

    if(pos % 8 === 7) {
      screen.newline();
    }
  }
}

module.exports = function(screen) {
  var IVT = new Uint16Array(buff(0x000003FF, 2000));

  dumpMem(IVT, screen);
};

module.exports.dumpMem = dumpMem;
