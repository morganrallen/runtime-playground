"use strict";

var fs = require("fs");
var Screen = require("./screen.js");
var map = require("./keymap.js");
var serial = require("./serial.js");

// location and dimensions of VGA frame buffer
var start = 0xB8000;
var bytes = 2;
var cols  = 80;
var rows  = 25;
var size  = cols * rows * bytes;

var tick = 0;

// initialize display based on frame buffer
var display = new Uint16Array(buff(start, size));
var screen  = new Screen(display);


var banner = fs.readFileSync(__dirname + "/banner.txt", "utf8");

var cmd = "";
var PS = " > ";

function prompt() {
  screen.newline();
  screen.write(PS);
}

screen.writeFun(banner);
screen.newline();

function debug(msg) {
  screen.newline();
  screen.write("[debug] " + msg);
  screen.newline();
}

// welcome message
screen.write(" Welcome to Runtime");
prompt();

function putLine(x, y, str) {
  var pos = parseInt(x) * screen.cols + parseInt(y);

  //debug("putting '" + str + "' at " + x + ", " + y + " (" + pos + ")");

  if(typeof str === "number") {
    display[pos] = 0x0A << 8 | str;
  } else {
    for(var i = 0; i < str.length; i++) {
      display[pos + i] = 0x0A << 8 | str[i].charCodeAt(0);
    }
  }
}

global.debug = debug;

function parseNum(n) {
  if(typeof n === "number") return n;
  if(n.indexOf("0x") === 0) return parseInt(n, 16);
  if(n.indexOf("b") === 0) return parseInt(n, 2);

  return parseInt(n, 10);
}

function execCommand() {
  var args = cmd.split(" ");
  var c = args.shift().trim();

  if(c.length === 0) {
    return;
  }

  switch(c) {
    case "ani":
      for(var i = 0; i < display.length; i++) {
        display[i] = 0x0A << 8 | String(i % 10).charCodeAt(0);
        var j = 0;
        while(j++ < 0xff){};
      }
    break;

    case "ani2":
      for(var i = 0; i < 10; i++) {
        screen.write(" " + screen.linearChar());
      }
    break;

    case "char":
      screen.newline();
      debug(screen.linearChar());
      debug("[" + screen.cursor + "]");
      screen.newline();
    break;

    case "clear":
      screen.clear();
    break;

    case "put":
      if(args.length < 3) {
        screen.newline();
        screen.write("  put requires 3 arguments. x, y, string");
      }

      var str = args.slice(2).join(" ");

      putLine(args[0], args[1], str);
    break;

    case "putx":
      if(args.length < 3) {
        screen.newline();
        screen.write("  put requires 3 arguments. x, y, hexval");
      }

      putLine(args[0], args[1], parseInt(args[2], 16));
    break;

    case "p":
      if(args.length < 2) {
        screen.newline();
        screen.write("  p requires 2 arguments. address, value");
        return;
      }

      var addr = parseInt(args[0], 16);
      var payload = args[1];

      var mem = new Uint8Array(buff(addr, payload.length));
      for(var i = 0; i < payload.length; i++) {
        mem[i] = payload[i];
      }
    break;

    case "tick":
      screen.newline();
      screen.write("tock " + tick);
    break;

    case "x":
    case "X":
      if(args.length < 2) {
        screen.newline();
        screen.write("  X requires 3 arguments. start, len");

        return;
      }

      var start = parseNum(args[0]);
      var len = parseNum(args[1]);
      if(len % 2 === 1) len++;

      screen.newline();
      screen.write("examining " + len + " bytes starting at " + start);
      screen.newline();

      var mem = new Uint16Array(buff(start, len));
      boots.dumpMem(mem, screen, start);
    break;

    case "si":
      screen.newline();
      screen.write(inb(0x3f8));
    break;

    case "s":
      screen.newline();
      serial.write(args[0] + "\n");
    break;

    default:
      screen.newline();
      screen.write("  " + cmd + " is an unkown command");
    break;
  }

  cmd = "";
}

var boots = require("./boot-stats");
//boots(screen);
// run loop

var tog = true;

serial.init();

while(true) {
  var num;
  var key;

  var intr = poll();

  serial.write(serial.read());

  if (4 === intr) {
    if(!tog) {
      putLine(0, 0, "X");
    } else {
      putLine(0, 0, "X");
    }

    tog = !tog;
  }

  if (1 === intr) {
    if (num = inb(0x60)) {
      var status = "   [" + screen.cursor + "]";
      status += "[" + inb(0x3f8) + "]";
      var c = screen.cols - status.length - 2;
      putLine(screen.rows - 1, c, status);

      if (key = map(num)) {
        if (key === "\n") {
          if(cmd.length > 0) {
            execCommand();
          }

          prompt();
        } else if (key === "\b") {
          if(screen.cursor[1] > PS.length) {
            cmd = cmd.split("").slice(0, -1).join("");

            screen.backspace();
          }
        } else if (key) {
          cmd += key;

          screen.write(key);
        } else {
          screen.write(".");
        }
      }
    }
  }

  tick++;
}
