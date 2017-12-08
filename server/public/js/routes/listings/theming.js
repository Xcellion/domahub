$(document).ready(function() {

  //remove class to prevent screen flash DH green
  $("#page-contents").removeClass('is-hidden');
  $("#dh-footer").removeClass('is-hidden');

  //if it's premium, check if theres any customization in the design
  if (listing_info.premium){
    setupCustomColors();

    //show background image
    if (listing_info.background_image){
      $("#page-contents:not(.no-background)").css("background-image", "url(" + listing_info.background_image + ")");
      $("#page-contents:not(.no-background)").css("background-repeat", "no-repeat");
      $("#page-contents:not(.no-background)").css("background-position", "center");
      $("#page-contents:not(.no-background)").css("background-size", "cover");
    }

    //show custom logo
    if (listing_info.logo){
      $("#custom_logo").attr("src", listing_info.logo);
    }
  }
});

var primaryColor = "#3CBC8D";
var secondaryColor = "0f0";
var tertiaryColor = "00f";
var whiteText = "#fff";
var blackText = "#1b2733";

//return white or black text based on luminance
function calculateLuminance(rgb) {
  var hexValue = rgb.replace(/[^0-9A-Fa-f]/, '');
  var r,g,b;
  if (hexValue.length === 3) {
    hexValue = hexValue[0] + hexValue[0] + hexValue[1] + hexValue[1] + hexValue[2] + hexValue[2];
  }
  if (hexValue.length !== 6) {
    return 0;
  }
  r = parseInt(hexValue.substring(0,2), 16) / 255;
  g = parseInt(hexValue.substring(2,4), 16) / 255;
  b = parseInt(hexValue.substring(4,6), 16) / 255;

  // calculate the overall luminance of the color
  var luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  if (luminance > 0.8) {
    return "#1b2733";
  }
  else {
    return "#fff";
  }
}

function stylize(color, element, style, calculateluminance) {
  if (color){
    $(element).css(style, color);
    if (style == "background-color" && calculateluminance) {
      $(element).css("color", calculateLuminance(color));
    }
  }
}

//setup any custom premium colors
function setupCustomColors(){
  console.log("Setting up custom theme...");
  stylize(listing_info.primary_color, "#page-contents .is-primary:not(.notification)", "color");
  stylize(listing_info.primary_color, ".daterangepicker td.active, .daterangepicker td.active:hover", "background-color", true);
  stylize(listing_info.primary_color, "#page-contents .is-primary.button", "background-color", true);
  stylize(listing_info.primary_color, ".tag:not(.category-tag)", "background-color", true);
  stylize(listing_info.primary_color, ".social-share", "color");
  stylize(listing_info.font_color, ".subtitle", "color");
  stylize(listing_info.font_color, ".regular-font", "color");
  stylize(listing_info.font_color, "#page-contents .tabs li a", "color");
  stylize(listing_info.font_color, "small.heading", "color");
  stylize(listing_info.secondary_color, ".category-tag", "background-color", true);
  stylize(listing_info.secondary_color, ".is-accent:not(.tag)", "color");
  stylize(listing_info.secondary_color, ".is-accent.button", "background-color", true);
  stylize(listing_info.secondary_color, "#typed-slash", "color");
  stylize(listing_info.tertiary_color, "a.is-info", "color");
  stylize(listing_info.tertiary_color, "ul.is-vertical li", "color");
  stylize(listing_info.background_color, "#page-contents:not(.no-background)", "background-color");
  stylize(listing_info.font_name, "#domain-title", "font-family");
  stylize(listing_info.font_name, "#typed-slash", "font-family");
}
