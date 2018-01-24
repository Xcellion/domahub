$(document).ready(function() {
  if (typeof listing_info != "undefined"){
    setupTheming();
  }
});

function hexToRgbA(hex, alpha, limit_white){
  if (hex){
    hex   = hex.replace('#', '');
    var r = parseInt(hex.length == 3 ? hex.slice(0, 1).repeat(2) : hex.slice(0, 2), 16);
    var g = parseInt(hex.length == 3 ? hex.slice(1, 2).repeat(2) : hex.slice(2, 4), 16);
    var b = parseInt(hex.length == 3 ? hex.slice(2, 3).repeat(2) : hex.slice(4, 6), 16);

    //prevent all white
    if (limit_white && r > 170 && g > 170 && b > 170){
      r = (r > 170) ? 170 : r;
      g = (g > 170) ? 170 : g;
      b = (b > 170) ? 170 : b;
    }

    if ( alpha ) {
      return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
    }
    else {
      return 'rgb(' + r + ', ' + g + ', ' + b + ')';
    }
  }
}

function setupTheming(){
  //remove class to prevent screen flash DH green
  $(".page-contents").removeClass('is-hidden');
  $("#dh-footer").removeClass('is-hidden');

  //if it's premium, check if theres any customization in the design
  if (listing_info.premium){
    setupCustomColorsListing();

    //show background image
    if (listing_info.background_image){
      $(".page-contents:not(.no-background)").css({
        "background-image" : "url(" + listing_info.background_image + ")",
        "background-repeat" : "no-repeat",
        "background-position" : "center",
        "background-size" : "cover",
        "background-attachment" : "fixed"
      });
    }
    else {
      $(".page-contents:not(.no-background)").css({
        "background-image" : "",
      });
    }
  }
}

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
  if (typeof color != "undefined" || typeof color != "null"){
    $(element).css(style, color);
    if (style == "background-color" && calculateluminance) {
      $(element).css("color", calculateLuminance(color));
    }
  }
  else {
    $(element).removeAttr("style");
  }
}

//setup any custom premium colors
function setupCustomColorsListing(){
  console.log("Setting up custom theme...");

  //title
  stylize(listing_info.primary_color, ".page-contents h1", "color");

  //click for more details
  stylize(listing_info.primary_color, ".page-contents #show-more-details", "color");

  //button
  stylize(listing_info.primary_color, ".page-contents .is-primary.button", "background-color", true);
  stylize(listing_info.secondary_color, ".page-contents .is-accent.button", "background-color", true);

  //tertiary color (links)
  stylize(listing_info.tertiary_color, ".page-contents a.is-info", "color");

  //price tags
  stylize(listing_info.primary_color, ".page-contents .main-price-tag", "color");
  stylize(listing_info.primary_color, ".page-contents .main-price-tag", "border-color");
  stylize("transparent", ".page-contents .main-price-tag", "background-color");

  //basic font on page
  stylize(listing_info.primary_color, ".page-contents #listing-description", "border-color");
  stylize(listing_info.font_color, ".page-contents .regular-font", "color");

  //tabs
  stylize(listing_info.font_color, ".page-contents .module-tab:not(.is-active) a", "color");
  stylize(listing_info.primary_color, ".page-contents .module-tab.is-active a", "color");

  //other domains tags
  stylize(hexToRgbA(listing_info.primary_color, 1, true), ".page-contents .otherowner-domain-price", "color");
  stylize(hexToRgbA(listing_info.primary_color, 1, true), ".page-contents .otherowner-domain-price", "border-color");

  //ticker
  stylize(hexToRgbA(listing_info.primary_color, 1, true), ".page-contents #ticker-wrapper .is-primary", "color");
  stylize(hexToRgbA(listing_info.secondary_color, 1, true), ".page-contents #ticker-wrapper .is-accent", "color");
  stylize(hexToRgbA(listing_info.tertiary_color, 1, true), ".page-contents #ticker-wrapper .is-info", "color");

  //social icons
  stylize(listing_info.primary_color, ".page-contents .social-share .icon", "color", true);
  stylize(listing_info.primary_color, ".page-contents .social-share .icon", "border-color");
  stylize("transparent", ".page-contents .social-share .icon", "background-color");

  //background
  stylize(listing_info.background_color, ".page-contents:not(.no-background)", "background-color");

  //font
  stylize(listing_info.font_name, ".page-contents h1.domain-title", "font-family");

  //footer
  stylize(listing_info.footer_color, ".page-contents .footer-item", "color");
  stylize(listing_info.footer_background_color, ".page-contents .footer", "background-color");
}
