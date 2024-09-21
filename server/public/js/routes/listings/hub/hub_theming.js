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

  //#region -------------------------------LEGAL MESSAGE-------------------------------

  setupLegalMessage(listing_hub_info);

  //#endregion

});

//setup any custom premium colors
function setupCustomColorsHub(){
  console.log("Setting up custom theme for hub...");
  stylize(listing_hub_info.background_color, ".hub-section.hero", "background-color");
  stylize(listing_hub_info.primary_color, ".hub-section #search-domain-tld", "color");
  stylize(listing_hub_info.primary_color, ".hub-section .is-primary:not(.notification):not(.no-theme)", "color");
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
