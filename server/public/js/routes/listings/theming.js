$(document).ready(function() {
  if (typeof listing_info != "undefined"){
    setupTheming();
    setupFooter();
  }
});

//<editor-fold>-------------------------------SET UP THEMING-------------------------------

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

//setup any custom premium colors
function setupCustomColorsListing(){
  console.log("Setting up custom theme...");

  //title
  stylize(listing_info.primary_color, ".page-contents h1.title", "color");

  //click for more details
  stylize(listing_info.primary_color, ".page-contents #show-more-details", "color");

  //button
  stylize(hexToRgbA(listing_info.primary_color, 1, true), ".page-contents .is-primary.button", "background-color", true);
  stylize(listing_info.secondary_color, ".page-contents .is-accent.button", "background-color", true);

  //tertiary color (links)
  stylize(listing_info.tertiary_color, ".page-contents a.is-info:not(.button)", "color");
  stylize(listing_info.primary_color, ".page-contents a.is-primary:not(.button)", "color");

  //price tags
  stylize(listing_info.primary_color, ".page-contents .main-price-tag", "color");
  stylize(listing_info.primary_color, ".page-contents .main-price-tag", "border-color");
  stylize("transparent", ".page-contents .main-price-tag", "background-color");

  //basic font on page
  stylize(listing_info.primary_color, ".page-contents #listing-description", "border-color");
  stylize(listing_info.font_color, ".page-contents .regular-font", "color");
  stylize(hexToRgbA(listing_info.primary_color, 1, true), ".page-contents .card-content h1", "color");

  //tabs
  stylize(listing_info.font_color, ".page-contents .module-tab:not(.is-active) a", "color");
  stylize(listing_info.primary_color, ".page-contents .module-tab.is-active a", "color");
  $('head').append('<style>.page-contents .tabs li.is-active a::before{background:' + listing_info.primary_color + ' !important; }</style>');

  //other domains tags
  stylize(hexToRgbA(listing_info.primary_color, 1, true), ".page-contents .otherowner-domain-price", "color");
  stylize(hexToRgbA(listing_info.primary_color, 1, true), ".page-contents .otherowner-domain-price", "border-color");

  //ticker
  stylize(hexToRgbA(listing_info.primary_color, 1, true), ".page-contents .icon.is-primary", "color");
  stylize(hexToRgbA(listing_info.secondary_color, 1, true), ".page-contents .icon.is-accent", "color");
  stylize(hexToRgbA(listing_info.tertiary_color, 1, true), ".page-contents .icon.is-info", "color");

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

  //sold page notification
  stylize(hexToRgbA(listing_info.primary_color, 0.8), ".page-contents #sold-domain-notitication", "background-color", true);
  stylize(listing_info.primary_color, ".page-contents .icon-box", "background-color", true);
}

//</editor-fold>

//<editor-fold>-------------------------------SET UP FOOTER-------------------------------

function setupFooter(){

  console.log("Setting up custom footer...");

  //<editor-fold>-------------------------------FOOTER LOGO-------------------------------

  if (listing_info.premium && listing_info.logo){
    $(".page-contents #listing-footer-logo").attr("src", listing_info.logo);
    $(".page-contents .logo-item").closest("a").attr('title', listing_info.domain_name);
  }
  else if (listing_info.premium){
    $(".page-contents .logo-item").closest("a").attr('title', listing_info.domain_name);
    $(".page-contents .logo-item").closest("a").css("visibility", "hidden");
    $(".page-contents #listing-footer-logo").addClass('is-hidden');
  }
  else {
    $(".page-contents .logo-item").removeClass('is-hidden').attr("src", "/images/dh-assets/circle-logo/dh-circle-logo-primary.png");
    $("#listing-footer-logo").closest("a").attr("href", "https://domahub.com");
    $(".page-contents .logo-item").closest("a").attr('title', "DomaHub Domains");
  }

  //</editor-fold>

  //<editor-fold>-------------------------------FOOTER TEXT-------------------------------

  //footer text
  if (listing_info.premium && listing_info.description_footer){
    $(".page-contents #listing-footer").text(listing_info.description_footer)
  }
  else if (listing_info.premium){
    $(".page-contents #listing-footer").text("Buy this domain today!");
  }
  else {
    $(".page-contents #listing-footer").text("Sell more domains with DomaHub landing pages.");
  }

  //descriptive footer link
  if (listing_info.premium && listing_info.description_footer_link){
    $(".page-contents #listing-footer, #listing-footer-logo-link").attr("href", listing_info.description_footer_link).addClass("is-underlined");
  }
  else if (listing_info.premium){
    $(".page-contents #listing-footer, #listing-footer-logo-link").removeAttr("href").removeClass("is-underlined");
  }
  else {
    $(".page-contents #listing-footer, #listing-footer-logo-link").attr("href", "https://domahub.com").addClass("is-underlined");;
  }

  //</editor-fold>

}

//</editor-fold>

//<editor-fold>-------------------------------HELPERS-------------------------------

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

//hexcode to RGBA function (with built in limiter for white backgrounds)
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

//function to use JS to style an element
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

//</editor-fold>
