$(document).ready(function() {

  //show background image
  if (listing_info.background_image){
    $(".hero").css({
      "background-image" : "url(" + listing_info.background_image + ")",
      "background-repeat" : "no-repeat",
      "background-position" : "center",
      "background-size" : "cover"
    });
  }

  //show logo
  if (listing_info.logo){
    $(".logo-item").attr("src", listing_info.logo);
  }
  setupCustomColors();

  //remove class to prevent screen flash DH green
  $("#page-contents").removeClass('is-hidden');
  $("#dh-footer").removeClass('is-hidden');
});

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
  stylize(listing_info.background_color, "#page-contents .hero", "background-color");
  stylize(listing_info.primary_color, "#page-contents #search-domain-tld", "color");
  stylize(listing_info.primary_color, "#page-contents .is-primary:not(.notification)", "color");
  stylize(listing_info.primary_color, "#page-contents .is-primary.button", "background-color", true);
  stylize(listing_info.primary_color, "#page-contents .is-primary.tag", "background-color", true);
  stylize(listing_info.primary_color, "#page-contents .sort-header .icon", "color");
  stylize(listing_info.secondary_color, "#page-contents .is-accent.tag", "background-color", true);
  stylize(listing_info.tertiary_color, "#page-contents .is-info.tag", "background-color", true);
  stylize(listing_info.font_color, "#page-contents .subtitle", "color");
  stylize(listing_info.footer_color, ".footer-item", "color");
  stylize(listing_info.footer_background_color, ".footer", "background-color");
}
