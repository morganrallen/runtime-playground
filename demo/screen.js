function Screen(buffer){
  this.buffer = buffer
  this.bytes  = 2
  this.cols   = 80
  this.rows   = 25
  this.color  = 0x0A
  //             row, col
  this.cursor = [ 0 ,  0 ]
}

Screen.prototype.clear = function(){
  var b = this.buffer
  for(var i=0; i<b.length; i++){
    b[i] = 0
  }

  this.cursor = [ 0, 0 ];
}

Screen.prototype.nextChar = function() {
  var row = this.cursor[0]
  var col = this.cursor[1]

  if (row === this.rows) {
    this.cursor[0] = row + 1
    this.cursor[1] = 0
  } else {
    this.cursor[1] = col + 1
  }
}

Screen.prototype.backspace = function () {
  if (this.cursor[1] === 0) return

  this.cursor[1]--
  this.putChar(' ')
}

Screen.prototype.linearChar = function () {
  return this.cursor[0] * this.cols + this.cursor[1]
}

Screen.prototype.newline = function () {
  if(this.cursor[0] > this.rows - 3) {
    for(var pos = this.cols; pos < this.buffer.length; pos++) {
      this.buffer[pos - this.cols] = this.buffer[pos] || 0x00;
    }
  } else {
    this.cursor[0]++;
  }

  this.cursor[1] = 0;
}

Screen.prototype.returnOrClear = function (){
  if (this.cursor[0] >= this.rows - 1) {
    this.clear()
    this.startChar()
    this.cursor[0] = 0
  } else {
    this.newline()
  }
}

Screen.prototype.startChar = function(){
  this.cursor[1] = 0
}

Screen.prototype.putChar = function (c) {
  var pos = this.linearChar()
  this.buffer[pos] = this.color << 8 | c.charCodeAt(0)
}

Screen.prototype.writeChar = function (c) {
  var pos = this.linearChar()
  this.buffer[pos] = this.color << 8 | c.charCodeAt(0)
  this.nextChar()
}

Screen.prototype.write = function (line) {
  for(var i=0; i<line.length; i++) {
    var char = line[i]
    if (char === '\n') {
      this.returnOrClear()
    } else {
      this.writeChar(char)
    }
  }
}

Screen.prototype.writeFun = function (line) {
  var c = this.color;

  for(var i=0; i<line.length; i++) {
    this.color = (i*12) % 255;

    var char = line[i]
    if (char === '\n') {
      this.returnOrClear()
    } else {
      this.writeChar(char)
    }
  }

  this.color = c;
}

module.exports = Screen
