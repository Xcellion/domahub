$(document).ready(function() {
  // colorize("ff8751", ".button", "background-color");
  // colorize("ff8751", ".tag", "background-color");
  // colorize("238fea", "p", "color");
  // colorize("fff", "h1,h2,h3", "color");
  // colorize("ff8751", "a", "color");
});

var primaryColor = "f00";
var secondaryColor = "0f0";
var tertiaryColor = "00f";
var whiteText = "fff";
var blackText = "222";

function calculateLuminance(hex) {
  // parse hexcode and convert into decimal values
  var arrBuff = new ArrayBuffer(4);
  var vw = new DataView(arrBuff);
  vw.setUint32(0,parseInt(hex, 16),false);
  var arrByte = new Uint8Array(arrBuff);

  // variables for storing decimal values and others
  var red = arrByte[1];
  var green = arrByte[2];
  var blue = arrByte[3]
  var luminance = 0;
  var arrByteNew = [];

  // calculate the luminance value of each r g b
  arrByte.forEach(function(col) {
    col = col / 255.0;

    if (col <= 0.03928) {
      col = col / 12.92;
    }
    else {
      col = ((col + 0.055) / 1.055) ^ 2.4
    }

    arrByteNew.push(col);
  })

  // calculate the overall luminance of the color
  luminance = 0.2126 * arrByteNew[1] + 0.7152 * arrByteNew[2] + 0.0722 * arrByteNew[3];

  // return white or black text based on luminance
  if (luminance > 0.179) {
    return "#000";
  }
  else {
    return "#fff";
  }
}

function colorize(color, element, style) {
  $(element).css(style, "#" + color);
  if (style == "background-color") {
    $(element).css("color", calculateLuminance(color));
  }
}
