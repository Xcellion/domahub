$(document).ready(function() {
  if (typeof listing_info != "undefined"){
    setupTheming();
  }
});

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
        "background-size" : "cover"
      });
    }
    else {
      $(".page-contents:not(.no-background)").removeAttr("style");
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
  if (color){
    $(element).css(style, color);
    if (style == "background-color" && calculateluminance) {
      $(element).css("color", calculateLuminance(color));
    }
  }
}

//setup any custom premium colors
function setupCustomColorsListing(){
  console.log("Setting up custom theme...");

  //primary color
  stylize(listing_info.primary_color, ".page-contents .is-primary:not(.notification)", "color");
  stylize(listing_info.primary_color, ".page-contents .is-primary.button", "background-color", true);

  //secondary color
  stylize(listing_info.secondary_color, ".page-contents .is-accent:not(.notification)", "color");
  stylize(listing_info.secondary_color, ".page-contents .is-accent.button", "background-color", true);

  //tertiary color (links)
  stylize(listing_info.tertiary_color, ".page-contents .is-info:not(.notification)", "color");

  //price tags
  stylize(listing_info.primary_color, ".page-contents .tag", "color");
  stylize(listing_info.primary_color, ".page-contents .tag", "border-color");
  stylize("transparent", ".page-contents .tag", "background-color");

  //basic font on page
  stylize(listing_info.primary_color, ".page-contents #listing-description", "border-color");
  stylize(listing_info.font_color, ".page-contents .regular-font", "color");

  //module tabs
  stylize(listing_info.font_color, ".page-contents .module-tab:not(.is-active) a", "color");
  stylize(listing_info.primary_color, ".page-contents .module-tab.is-active a", "color");

  //social icons
  stylize(listing_info.primary_color, ".page-contents .social-share .icon", "color", true);
  stylize("transparent", ".page-contents .social-share .icon", "background-color");

  //background
  stylize(listing_info.background_color, ".page-contents:not(.no-background)", "background-color");

  //font
  stylize(listing_info.font_name, ".page-contents h1.domain-title", "font-family");

  //footer
  stylize(listing_info.footer_color, ".page-contents .footer-item", "color");
  stylize(listing_info.footer_background_color, ".page-contents .footer", "background-color");
}
