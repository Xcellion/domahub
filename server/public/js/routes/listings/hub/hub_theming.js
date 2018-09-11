$(document).ready(function() {

  //show background image
  if (listing_hub_info.background_image){
    $(".hub-section.hero").css({
      "background-image" : "url(" + listing_hub_info.background_image + ")",
      "background-repeat" : "no-repeat",
      "background-position" : "center",
      "background-size" : "cover"
    });
  }

  //show logo
  if (listing_hub_info.logo){
    $(".hub-section .logo-item").attr("src", listing_hub_info.logo).removeClass('is-hidden');
    $(".hub-section .logo-item").closest("a").attr('title', listing_hub_info.hub_title);
  }
  setupCustomColorsHub();

  //remove class to prevent screen flash DH green
  $("body").removeClass('is-hidden');

  //<editor-fold>-------------------------------LEGAL MESSAGE-------------------------------

  //show legal message
  // $("#legal-info").removeClass("is-hidden").css("display", "block").on("click", function(){
  //   $("#legal-modal").addClass('is-active');
  // });

  if (listing_hub_info.owner_address){
    var owner_address = listing_hub_info.owner_address.line1;
    if (listing_hub_info.owner_address.line2){
      owner_address += listing_hub_info.owner_address.line2;
    }
    owner_address += ", " + listing_hub_info.owner_address.city;
    owner_address += ", " + listing_hub_info.owner_address.state;
    owner_address += ", " + listing_hub_info.owner_address.postal_code;
    owner_address += ", " + listing_hub_info.owner_address.country;
  }


  //contact
  if (listing_hub_info.owner_business_name){
    $("#legal-contact").text(listing_hub_info.owner_business_name);
    $("#legal-contact-wrapper").removeClass("is-hidden");
  }
  else if (listing_hub_info.owner_name){
    $("#legal-contact").text(listing_hub_info.owner_name);
    $("#legal-contact-wrapper").removeClass("is-hidden");
  }
  else {
    $("#legal-contact-wrapper").addClass("is-hidden");
  }

  //address
  if (listing_hub_info.owner_address){
    $("#legal-address").text(owner_address);
    $("#legal-address-wrapper").removeClass("is-hidden");
  }
  else {
    $("#legal-address-wrapper").addClass("is-hidden");
  }

  //email
  if (listing_hub_info.owner_email){
    $("#legal-email").text(listing_hub_info.owner_email);
    $("#legal-email-wrapper").removeClass("is-hidden");
  }
  else {
    $("#legal-email-wrapper").addClass("is-hidden");
  }

  //phone
  if (listing_hub_info.owner_phone){
    $("#legal-phone").text(listing_hub_info.owner_phone);
    $("#legal-phone-wrapper").removeClass("is-hidden");
  }
  else {
    $("#legal-phone-wrapper").addClass("is-hidden");
  }

  //</editor-fold>

});

//setup any custom premium colors
function setupCustomColorsHub(){
  console.log("Setting up custom theme for hub...");
  stylize(listing_hub_info.background_color, ".hub-section.hero", "background-color");
  stylize(listing_hub_info.primary_color, ".hub-section #search-domain-tld", "color");
  stylize(listing_hub_info.primary_color, ".hub-section .is-primary:not(.notification)", "color");
  stylize(listing_hub_info.primary_color, ".hub-section .is-primary.button", "background-color", true);
  stylize(hexToRgbA(listing_hub_info.primary_color, 1, true), ".hub-section .is-primary.tag.is-dot", "background-color");
  stylize(listing_hub_info.primary_color, ".hub-section .price-tag", "background-color", true);
  stylize(hexToRgbA(listing_hub_info.primary_color, 1, true), ".hub-section .sort-header .icon", "color");
  stylize(listing_hub_info.primary_color, ".hub-section .price-tag", "background-color", true);
  stylize(listing_hub_info.primary_color, ".hub-section .price-tag::before", "background");
  stylize(hexToRgbA(listing_hub_info.secondary_color, 1, true), ".hub-section .is-accent.tag.is-dot", "background-color");
  stylize(hexToRgbA(listing_hub_info.tertiary_color, 1, true), ".hub-section .is-info.tag.is-dot", "background-color");
  stylize(listing_hub_info.font_color, ".hub-section .subtitle", "color");
  stylize(listing_hub_info.font_color, ".hub-section .nav-item", "color");
  stylize(listing_hub_info.font_name, ".hub-section .title.is-1", "font-family");

  //listing hub footer
  stylize(listing_hub_info.footer_color, ".hub-section .footer-item", "color");
  stylize(listing_hub_info.footer_color, ".hub-section #listing-hub-email > #obf > a", "color");
  stylize(listing_hub_info.footer_background_color, ".hub-section .footer", "background-color");
  stylize(listing_hub_info.primary_color, ".hub-section .page-contents .tabs li a", "color");
}
