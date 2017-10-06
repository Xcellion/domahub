var current_listing = (listings) ? listings[0] : {};
var referer_chart = false;
var traffic_chart = false;

$(document).ready(function(){

  //array find for IE
  if(Array.prototype.find == null){
    Array.prototype.find = function(callback, thisArg){
      for(var i = 0; i < this.length; i++){
        if(callback.call(thisArg || window, this[i], i, this))
        return this[i];
      }
      return undefined;
    };
  }

  //close offer modal
  $(".modal-close, .modal-background").on("click", function(){
    $(this).parent(".modal").removeClass('is-active');
  });

  //<editor-fold>-------------------------------URL-------------------------------

  var replace_url = [location.protocol, '//', location.host, location.pathname].join('');
  var url_tab = getParameterByName("tab");
  if (["verify", "info", "rental", "design", "stats", "offers", "purchased"].indexOf(url_tab) == -1){
    url_tab = "info";
    updateQueryStringParam("tab", "info");
  }

  var url_listing_index = 0;
  var url_listing = getParameterByName("listing");
  if (listings.length){
    for (var x = 0 ; x < listings.length; x++){
      if (listings[x].domain_name.toLowerCase() == url_listing){
        var url_listing_index = x;
        break;
      }
    }

    //url_listing doesnt exist in listing var, replace the history
    if (url_listing_index == 0){
      updateQueryStringParam("listing", listings[0].domain_name);
    }
  }

  //populate all themes
  populateThemeDropdown();

  //</editor-fold>

  //<editor-fold>-------------------------------FILTERS-------------------------------

  //mobile view nav menu
  $(".nav-toggle").on("click", function() {
    $(this).toggleClass("is-active");
    $(".nav-menu").toggleClass("is-active");
  });

  //close user dropdown menu on click outside the element
  $(document).on("click", function(event) {
    if (!$(event.target).closest("#user-dropdown-button").length) {
      if ($(".user-dropdown-menu").is(":visible")) {
        $(".user-dropdown-menu").addClass("is-hidden");
        $("#user-dropdown-button").toggleClass("is-active").blur();
      }
    }
  });

  //toggle user drop down menu on icon button click
  $("#user-dropdown-button").on("click", function() {
    $(this).toggleClass("is-active");
    $(".user-dropdown-menu").toggleClass("is-hidden");
  });

  //sorting
  $("#sort-select").on("change", function(){
    var sort_value = $(this).val().split("-");
    var sort_by = sort_value[0];
    var sort_order = sort_value[1];

    if (sort_order == "asc"){
      listings.sort(function(a,b){
        return a[sort_by] > b[sort_by];
      });
    }
    else if (sort_order == "desc"){
      listings.sort(function(a,b){
        return a[sort_by] < b[sort_by];
      });
    }

    createRows();
  });

  //domain search
  $("#domain-search").on("input keyup", function(){
    $(".table-row:not(.clone-row)").addClass('is-hidden');

    var search_term = $(this).val();

    $(".table-row:not(.clone-row)").filter(function(){
      if ($(this).data('domain_name').indexOf(search_term) != -1){
        return true;
      }
    }).removeClass('is-hidden');
  });

  //filters
  $("#filter-select").on("change", function(){
    $(".table-row:not(.clone-row)").addClass('is-hidden');

    var filter_val = $(this).val();
    $(".table-row:not(.clone-row)").filter(function(){
      if ($(this).data(filter_val)){
        return true;
      }
    }).removeClass('is-hidden');

    //something matches new filter
    if ($(".table-row:not(.clone-row):visible:first").length > 0){
      $("#no-listings-row").addClass('is-hidden');
    }
    //nothing matches the new filter
    else {
      $("#no-listings-row").removeClass('is-hidden');
    }
  });

  //</editor-fold>

  //<editor-fold>-------------------------------DOMAIN LIST-------------------------------

  createRows(url_listing_index, url_tab);

  //multiple delete listings
  $("#multi-delete").on("click", function(e){
    multiDelete($(this));
  });

  //multiple verify listings
  $("#multi-verify").on("click", function(e){
    multiVerify($(this));
  });

  //select all domains
  $("#select-all").on("click", function(e){
    selectAllRows($(this), $(this).data('selected'));
  });

  //</editor-fold>

  //<editor-fold>-------------------------------REGULAR TABS-------------------------------

  //click to move to upgrade tab from design tab
  $("#other-tab-upgrade-button").on('click', function(e){
    $("#upgrade-tab").click();
  });

  //change tabs
  $(".tab").on("click", function(e){
    var current_tab = $(".tab.is-active").attr("id").replace("-tab", "");
    var new_tab = $(this).attr("id").replace("-tab", "");

    if (current_tab != new_tab){
      //clear any existing messages
      errorMessage(false);
      successMessage(false);

      //update tab URL
      updateQueryStringParam("tab", new_tab);

      //hide other tab selectors
      $(".tab.verified-elem").removeClass('is-active');
      $(this).addClass('is-active');

      //show specific tab
      new_tab = (new_tab == "purchased") ? "offers-tab" : new_tab + "-tab";
      $(".drop-tab").stop().fadeOut(300).addClass('is-hidden');
      $("#" + new_tab + "-drop").stop().fadeIn(300).removeClass('is-hidden');

      //get offers if we havent yet
      if ($(this).attr("id") == "offers-tab" && current_listing.offers == undefined){
        getDomainOffers(current_listing.domain_name);
      }
      else if ($(this).attr("id") == "stats-tab" && current_listing.stats == undefined){
        getDomainStats(current_listing.domain_name);
      }

      //hide save/cancel changes buttons a tab that shouldnt show the save changes buttons
      if ($(this).hasClass("no-buttons-tab")){
        $("#tab-buttons-wrapper").addClass('is-hidden');
        $("#save-changes-button").addClass('is-hidden');
        $("#cancel-changes-button").addClass('is-hidden');
      }
      //clicked on a not upgrade tab
      else {
        $("#tab-buttons-wrapper").removeClass('is-hidden');
        $("#save-changes-button").removeClass('is-hidden');
        $("#cancel-changes-button").removeClass('is-hidden');
      }

      cancelListingChanges();
    }
  });

  //to submit form changes
  $("#save-changes-button").on("click", function(e){
    submitListingChanges();
  });

  //to cancel form changes
  $("#cancel-changes-button").on("click", function(e){
    cancelListingChanges();
  });

  //</editor-fold>
});

//<editor-fold>-------------------------------CREATE ROW VERIFIED DOMAIN-------------------------------

//function to create all rows
function createRows(cur_listing_index, url_tab){
  //empty the table
  $("#table-body").find(".table-row:not(.clone-row)").remove();

  //create rows for each listing
  for (var x = 0; x < listings.length; x++){
    $("#table-body").append(createRow(listings[x], x));
  }

  //show specific listing (or first listing)
  if (listings.length > 0){

    //a specific listing to show or show first one
    var listing_to_show = (cur_listing_index) ? listings[cur_listing_index] : listings[0];
    var index_for_table = (cur_listing_index) ? cur_listing_index : 0;

    current_listing = listing_to_show;

    var active_tab = (url_tab) ? url_tab : "info";
    $("#" + active_tab + "-tab").addClass('is-active');

    //show and hide elements that we need if there are listings
    $(".yes-listings-elem").removeClass('is-hidden');
    $(".no-listings-elem").addClass('is-hidden');
    $("#loading-tab").addClass('is-hidden');

    //update inputs for purchased domain
    if (listing_to_show.deposited || listing_to_show.accepted){
      editRowPurchased(listing_to_show);
    }
    //update inputs for verified
    else if (listing_to_show.verified){
      editRowVerified(listing_to_show);
    }
    //update inputs for unverified
    else {
      editRowUnverified(listing_to_show);
    }

    //add active to the left-side table
    $("#table-body").find(".table-row:not(.clone-row)").eq(index_for_table).addClass('is-active');

    //change domain name header and view button
    $(".current-domain-name").text(listing_to_show.domain_name);
    $("#current-domain-view").attr("href", (user.stripe_subscription_id) ? "https://" + listing_to_show.domain_name.toLowerCase() : "/listing/" + listing_to_show.domain_name);
  }
  //there are no listings to show!
  else {
    $(".yes-listings-elem").addClass('is-hidden');
    $(".no-listings-elem").removeClass('is-hidden');
    $("#loading-tab").addClass('is-hidden');
  }
}

//function to create a listing row
function createRow(listing_info, rownum){
  //choose a row to clone (accepted listings are verified by default)
  if (listing_info.verified){
    var tempRow = $("#verified-clone-row").clone();
  }
  else {
    var tempRow = $("#unverified-clone-row").clone();
    tempRow.data("verified", false);
  }

  //update row specifics and add handlers
  updateDomainName(tempRow, listing_info);
  updateIcon(tempRow, listing_info);

  //change domains
  tempRow.on("click", function(e){
    changeRow($(this), listing_info);
  });

  tempRow.removeClass('is-hidden clone-row').attr("id", "row-listing_id" + listing_info.id);
  tempRow.data("selected", false);
  updateRowData(tempRow, listing_info);

  //already got the dns and a records for unverified domain
  if (listing_info.a_records != undefined && listing_info.whois != undefined){
    tempRow.data("record_got", true);
  }

  return tempRow;
}

//function to update row data
function updateRowData(row, listing_info){
  row.data("id", listing_info.id);
  row.data("domain_name", listing_info.domain_name);
  row.data("unverified", (listing_info.verified) ? false : true);
  row.data("rented", listing_info.rented);
  row.data("status", (listing_info.status == 1) ? true : false);
  row.data("inactive", (listing_info.status == 0 && listing_info.verified) ? true : false);
}

//update the clone row with row specifics
function updateDomainName(tempRow, listing_info){
  tempRow.find(".td-domain").text(listing_info.domain_name);
  tempRow.find(".td-date").text(moment(listing_info.date_created).format("M/D/YYYY"));
  tempRow.find(".td-min").text("$" + listing_info.min_price);
  tempRow.find(".td-bin").text("$" + listing_info.buy_price);
  tempRow.find(".td-theme").text("Theme");
}
function updateIcon(tempRow, listing_info){
  tempRow.find(".select-button").on('click', function(e){
    e.stopPropagation();
    selectRow(tempRow);
  });
}

//function to change domain
function changeRow(row, listing_info, bool){

  //only if actually changing
  if (current_listing != listing_info || bool){

    refreshSubmitButtons();
    $(".changeable-input").off();

    //highlight selected row on table
    $(".table-row").removeClass('is-active').removeAttr("style");
    row.addClass('is-active');

    //clear any existing messages
    errorMessage(false);
    successMessage(false);

    //change URL param
    updateQueryStringParam("listing", listing_info.domain_name);

    //change domain name header and view button
    $(".current-domain-name").text(listing_info.domain_name);
    $("#current-domain-view").attr("href", (user.stripe_subscription_id) ? "https://" + listing_info.domain_name.toLowerCase() : "/listing/" + listing_info.domain_name);

    //update inputs for purchased/accepted domain
    if (listing_info.deposited || listing_info.accepted){
      editRowPurchased(listing_info);
    }
    //update inputs for verified
    else if (listing_info.verified){
      editRowVerified(listing_info);
    }
    //update inputs for unverified
    else {
      editRowUnverified(listing_info);
    }

    //change the current listing at the end
    current_listing = listing_info;
  }
}

//</editor-fold>

//<editor-fold>-------------------------------UPDATE ROW VERIFIED-------------------------------

//function to update a row if it's verified but not yet purchased
function editRowVerified(listing_info, fadeIn){

  var url_tab = getParameterByName("tab");
  //not yet purchased / verified, but URL is wrong
  if (url_tab == "verify" || (url_tab == "purchased" && !listing_info.deposited)){
    updateQueryStringParam("tab", "info");
    $(".tab").removeClass('is-active');
    $("#info-tab").addClass('is-active');
  }

  //hide purchased tab, show other tabs
  $(".purchased-elem").addClass('is-hidden');
  $(".unpurchased-elem").removeClass("is-hidden");

  //show the verified tabs, hide unverified
  $(".verified-elem").removeClass('is-hidden');
  $(".unverified-elem").addClass('is-hidden');

  //show buttons wrapper only on non button tabs
  if (!$(".verified-elem.tab.is-active").hasClass("no-buttons-tab")){
    $("#tab-buttons-wrapper").removeClass('is-hidden');
  }
  else {
    $("#tab-buttons-wrapper").addClass('is-hidden');
  }

  //show active tab drop
  $(".drop-tab").addClass('is-hidden');
  if (!fadeIn){
    $("#" + $(".verified-elem.tab.is-active").attr('id') + "-drop").stop().fadeIn(300).removeClass('is-hidden');
  }
  else {
    $("#" + $(".verified-elem.tab.is-active").attr('id') + "-drop").removeClass('is-hidden');
  }
  $("#current-domain-view").attr("href", (user.stripe_subscription_id) ? "https://" + listing_info.domain_name.toLowerCase() : "/listing/" + listing_info.domain_name);

  //get offers if we havent yet
  if (!fadeIn && url_tab == "offers" && listing_info.offers == undefined){
    getDomainOffers(listing_info.domain_name);
  }
  else {
    updateOffers(listing_info);
  }

  //get stats if we havent yet
  if (!fadeIn && url_tab == "stats" && listing_info.stats == undefined){
    getDomainStats(listing_info.domain_name);
  }
  else {
    updateStats(listing_info);
  }

  //info tab
  updateStatus(listing_info);
  updateDomainNameCapital(listing_info);
  updateDescription(listing_info);
  updateCategories(listing_info);
  updatePriceInputs(listing_info);

  //rental tab
  updatePaths(listing_info);

  //design tab
  //revert preview stuff
  $(".preview-elem").removeAttr('style');
  updatePremiumNotification();
  updateColorScheme(listing_info);
  updateFontStyling(listing_info);
  updateModules(listing_info);
  updateBackground(listing_info);
  updateLogo(listing_info);

  updateBindings(listing_info);
}

//function to update a row if it's been purchased
function editRowPurchased(listing_info){
  //show purchased tab, hide other tabs
  $(".purchased-elem").removeClass('is-hidden');
  $(".unpurchased-elem").addClass("is-hidden");

  //show offers tab only
  $("#drop-tab").addClass('is-active');
  $(".drop-tab").addClass('is-hidden');
  $("#offers-tab-drop").removeClass('is-hidden').show();
  $("#purchased-tab").addClass('is-active');

  //get offers if we havent yet
  if (listing_info.offers == undefined){
    getDomainOffers(listing_info.domain_name);
  }

  //update URL
  updateQueryStringParam("tab", "purchased");

  //hide buttons wrapper
  $("#tab-buttons-wrapper").addClass('is-hidden');
  $("#verified-drop-tab, #offers-tab-drop").removeClass('is-hidden');
  updateOffers(listing_info);
  updateStats(listing_info);
}

//<editor-fold>-------------------------------INFORMATION TAB EDITS-------------------------------

//update the information tab
function updateStatus(listing_info){
  $("#status-input").data("status", listing_info.status);
  if (listing_info.status == 1){
    $("#status-color").addClass("is-primary").removeClass('is-danger');
    $("#status-icon").addClass("fa-toggle-on").removeClass('fa-toggle-off');
  }
  else {
    $("#status-color").addClass('is-danger').removeClass("is-primary");
    $("#status-icon").addClass('fa-toggle-off').removeClass("fa-toggle-on");
  }
}
function updateDomainNameCapital(listing_info){
  $("#domain-name-input").val(listing_info.domain_name).attr("placeholder", listing_info.domain_name);
}
function updateDescription(listing_info){
  $("#description").val(listing_info.description);
  $("#description-hook").val(listing_info.description_hook);
  $("#description-footer").val(listing_info.description_footer);
}
function updateCategories(listing_info){
  var listing_categories = (listing_info.categories) ? listing_info.categories.split(" ") : [];
  $(".category-selector").removeClass('is-dark');
  for (var x = 0; x < listing_info.categories.split(" ").length; x++){
    //color existing categories
    var temp_category = $("." + listing_categories[x] + "-category").addClass('is-dark');
  }
  updateHiddenCategoryInput();
}
function updateHiddenCategoryInput(){
  var joined_categories = $(".category-selector.is-dark").map(function() {
    return $(this).data("category");
  }).toArray().sort().join(" ");
  joined_categories = (joined_categories == "") ? null : joined_categories;
  $("#categories-input").val(joined_categories);
}
function updatePaths(listing_info){
  var listing_paths = (listing_info.paths) ? listing_info.paths.split(",") : [];

  //if created tags before
  if ($("#paths-input").data('tags') == true){
    $("#paths-input").tagit("destroy");
  }
  else {
    $("#paths-input").data("tags", true);
  }

  $("#paths-input").val(listing_info.paths).tagit({
    animate: false,
    afterTagAdded : function(event, ui){
      changedValue($("#paths-input"), listing_info);
    },
    afterTagRemoved : function(event, ui){
      changedValue($("#paths-input"), listing_info);
    }
  });

  //add custom class so we can gray it out if not rentable
  $(".tagit.textarea").addClass('rentable-input');
}

//</editor-fold>

//<editor-fold>-------------------------------PRICE EDITS-------------------------------

//update the pricing tab
function updatePriceInputs(listing_info){
  checkBox(listing_info.rentable, $("#rentable-input"));
  checkBox(listing_info.buyable, $("#buyable-input"));

  updateRentalInputsDisabled(listing_info.rentable);
  $("#buy-price-input").val(listing_info.buy_price);
  $("#min-price-input").val(listing_info.min_price);
  $("#price-rate-input").val(listing_info.price_rate);
  $("#price-type-input").val(listing_info.price_type);

  //update preview on design page
  if (listing_info.buy_price > 0){
    $("#example-buy-price-tag").removeClass('is-hidden').text("For sale - " + moneyFormat.to(parseFloat(listing_info.buy_price)));
  }
  else {
    $("#example-buy-price-tag").addClass('is-hidden');
  }
  if (listing_info.rentable){
    $("#example-rent-price-tag").removeClass('is-hidden').text("For rent - " + moneyFormat.to(parseFloat(listing_info.price_rate)) + " / " + listing_info.price_type);
  }
  else {
    $("#example-rent-price-tag").addClass('is-hidden');
  }
}
function updateRentalInputsDisabled(rentable){
  if (rentable == 1){
    $(".rentable-input").removeClass('is-disabled');
  }
  else {
    $(".rentable-input").addClass('is-disabled');
  }
}

//</editor-fold>

//<editor-fold>-------------------------------DESIGN TAB EDITS-------------------------------

//function to switch theme
function switchTheme(theme_name){
  var theme_to_load = findTheme(theme_name);

  //if there wasnt a theme, load domahub theme
  if (!theme_to_load){
    var theme_to_load = findTheme("DomaHub");
  }

  updateBackground(theme_to_load);
  updateColorScheme(theme_to_load);
  updateFontStyling(theme_to_load);
  $("#theme-input").val(theme_to_load.theme_name);
  changedValue($(".changeable-input"), theme_to_load);
}

//update the design tab
function updatePremiumNotification(){
  //if premium, remove the notification / disabled inputs
  if (user.stripe_subscription_id){
    $("#premium-only-notification").addClass("is-hidden");
    $(".premium-input").removeClass("is-disabled");
    $("#premium-blackscreen").addClass("is-hidden");
  }
  else {
    $("#premium-only-notification").removeClass("is-hidden");
    $(".premium-input").addClass("is-disabled");

    //premium blackscreen exists (not deleted by user)
    if ($("#premium-blackscreen").length != 0){
      $("#premium-blackscreen").removeClass("is-hidden");
    }
    else {
      $("#design-tab-drop").prepend('<div id="premium-blackscreen" class="blackscreen"> \
      <div id="premium-only-notification" class="content has-text-centered"> \
      <p> \
      Please upgrade to a Premium account to customize the look and feel of your landing page! \
      </p> \
      <a href="/features#pricing" class="is-primary"> \
      What is a Premium account? \
      </a> \
      <div class="margin-top-15 control has-text-centered"> \
      <a href="/profile/settings#premium" class="button is-stylish no-shadow is-primary is-small"> \
      <span class="icon is-small"> \
      <i class="fa fa-diamond"></i> \
      </span> \
      <span>Upgrade</span> \
      </a> \
      </div> \
      </div> \
      </div>');
    }
  }
}
function updateColorScheme(listing_info){
  var minicolor_options = {
    letterCase: "uppercase",
    swatches: ["#3cbc8d", "#FF5722", "#2196F3"]
  }
  $("#primary-color-input").val(listing_info.primary_color).minicolors("destroy").minicolors(minicolor_options);
  $("#secondary-color-input").val(listing_info.secondary_color).minicolors("destroy").minicolors(minicolor_options);
  $("#tertiary-color-input").val(listing_info.tertiary_color).minicolors("destroy").minicolors(minicolor_options);

  //update the preview
  $("#example-domain-name").css("color", listing_info.primary_color);
  $("#example-button-primary, #example-rent-price-tag, #example-buy-price-tag").css({
    "background-color" : listing_info.primary_color,
    "border-color" : listing_info.primary_color,
    "color" : calculateLuminance(listing_info.primary_color)
  });
  $("#example-button-accent").css({
    "background-color" : listing_info.secondary_color,
    "border-color" : listing_info.secondary_color,
    "color" : calculateLuminance(listing_info.secondary_color)
  });
  $("#example-link-info").css("color", listing_info.tertiary_color);
}
function updateFontStyling(listing_info){
  var minicolor_options = {
    letterCase: "uppercase",
    swatches: ["#000", "#222", "#D3D3D3", "#FFF"]
  }
  $("#font-color-input").val(listing_info.font_color).minicolors("destroy").minicolors(minicolor_options);
  $("#font-name-input").val(listing_info.font_name);

  //update the preview
  $("#example-domain-name").css("font-family", listing_info.font_name);
  $("#example-font").css("color", listing_info.font_color);
}
function updateBackground(listing_info){
  var background_image = (listing_info.background_image == null || listing_info.background_image == undefined || listing_info.background_image == "") ? "https://placeholdit.imgix.net/~text?txtsize=20&txt=NO%20IMG&w=96&h=64" : listing_info.background_image;

  //remove any input values on upload forms
  $("#background-image-input").val("");
  $("#background-link-input").val(listing_info.background_image);
  $("#background-link-refresh").removeClass('is-primary').addClass('is-disabled');

  //background image of preview
  if (listing_info.background_image != null && listing_info.background_image != undefined && listing_info.background_image != ""){
    $("#example-wrapper").css({'background-image' : "url(" + background_image + ")"});
  }
  else {
    $("#example-wrapper").css('background-image', "");
  }

  //background color
  var minicolor_options = {
    letterCase: "uppercase",
    swatches: ["#FFFFFF", "#E5E5E5", "#B2B2B2", "#7F7F7F", "#666666", "#222222", "#000000"]
  }
  $("#background-color-input").val(listing_info.background_color).minicolors("destroy").minicolors(minicolor_options);
  $("#example-wrapper").css({"background-color" : listing_info.background_color});
}
function updateLogo(listing_info){
  //logo depending on premium user or not
  if (user.stripe_subscription_id){
    var logo = (listing_info.logo == null || listing_info.logo == undefined || listing_info.logo == "") ? "https://placeholdit.imgix.net/~text?txtsize=20&txt=NO%20LOGO&w=200&h=150" : listing_info.logo;
  }
  else {
    var logo = (listing_info.logo == null || listing_info.logo == undefined || listing_info.logo == "") ? "/images/dh-assets/flat-logo/dh-flat-logo-primary.png" : listing_info.logo;
  }

  //remove any input values on upload forms
  $("#logo-image-input").val("");
  $("#logo-link-input").val(listing_info.logo);
  $("#logo-link-refresh").removeClass('is-primary').addClass('is-disabled');

  $("#example-logo").attr('src', logo).off().on("error", function() {
    $(this).attr("src", "/images/dh-assets/flat-logo/dh-flat-logo-primary.png");
  });
}
function updateModules(listing_info){
  //info module
  checkBox(listing_info.info_module, $("#info-module-input"), true);
  checkBox(listing_info.domain_owner, $("#domain-owner-input"));
  checkBox(listing_info.domain_age, $("#domain-age-input"));
  checkBox(listing_info.domain_list, $("#domain-list-input"));
  checkBox(listing_info.domain_appraisal, $("#domain-appraisal-input"));
  checkBox(listing_info.social_sharing, $("#social-sharing-input"));

  //traffic module
  checkBox(listing_info.traffic_module, $("#traffic-module-input"));
  checkBox(listing_info.traffic_graph, $("#traffic-graph-input"));
  checkBox(listing_info.alexa_stats, $("#alexa-stats-input"));

  checkBox(listing_info.history_module, $("#history-module-input"));

  //alexa link
  $("#alexa_link").attr("href", "https://www.alexa.com/siteinfo/" + listing_info.domain_name);
}
function checkBox(module_value, elem, child){
  elem.val(module_value).prop("checked", module_value);
  if (child){
    if (module_value){
      $("." + elem.attr("id").replace("input", "child")).removeClass('is-disabled');
    }
    else {
      $("." + elem.attr("id").replace("input", "child")).addClass('is-disabled');
    }
  }
}
function updateModuleChildren(elem){
  if (elem.val() == 1){
    $("." + elem.attr("id").replace("input", "child")).removeClass('is-disabled');
  }
  else {
    $("." + elem.attr("id").replace("input", "child")).addClass('is-disabled');
  }
}

//</editor-fold>

//<editor-fold>-------------------------------OFFER TAB EDITS-------------------------------

//function to show loading offers
function showLoadingOffers(){
  $("#loading-offers").removeClass('is-hidden');
  $(".hidden-while-loading-offers").addClass('is-hidden');
  $("#offers-wrapper").empty();
}

///get a specific offer by ID
function getOffer(offers, offer_id){
  for (var x = 0; x < offers.length; x++){
    if (offers[x].id == offer_id){
      return offers[x];
    }
  }
}

//function to get offers on a domain
function getDomainOffers(domain_name){
  showLoadingOffers();
  $.ajax({
    url: "/listing/" + domain_name.toLowerCase() + "/getoffers",
    method: "POST"
  }).done(function(data){
    if (data.listings){
      updateCurrentListing(data.listings);

      //update local listings variable
      if (current_listing){
        (function(current_listing){

          $("#refresh-offers").removeClass('is-loading');

          //update the change row handler
          $("#row-listing_id" + current_listing.id).off().on("click", function(e){
            changeRow($(this), current_listing, true);
          });

          updateOffers(current_listing);
        })(current_listing);
      }
    }
    else if (data.state != "success") {
      errorMessage(data.message);
    }
  });
}

//function to update the offers tab
function updateOffers(listing_info){
  //show offers if we have it
  if (listing_info.offers == undefined){
    showLoadingOffers();
  }
  //hide loading msg
  else {
    $("#loading-offers").addClass('is-hidden');
    $("#offers-wrapper").empty();

    //rejected offers button
    $("#show-rejected-offers").removeClass('is-primary').off().on('click', function(){
      $(".rejected-offer").toggleClass('is-hidden');
      $(this).toggleClass('is-primary is-black').find(".fa").toggleClass('fa-toggle-on fa-toggle-off');

      //hide no offers if there are any offers (including rejected)
      if ($(".offer-row:not(#offer-clone)").length == 0){
        $("#no-offers").removeClass('is-hidden');
      }
      else {
        $("#no-offers").toggleClass('is-hidden');
      }
    }).find(".fa").removeClass('fa-toggle-on').addClass('fa-toggle-off');

    //refresh offers button
    $("#refresh-offers").off().on('click', function(){
      $(this).addClass('is-loading');
      getDomainOffers(listing_info.domain_name);
    });

    //sort offers
    $("#offers-sort-select").val("timestamp_desc").off().on("change", function(){
      var sort_value = $(this).val().split("_");
      var sort_by = sort_value[0];
      var sort_order = sort_value[1];

      var offers_to_sort = $(".offer-row:not(#offer-clone)");
      if (sort_order == "asc"){
        offers_to_sort.sort(function(a,b){
          if (sort_by == "name"){
            return $(a).data("offer-data")[sort_by].toLowerCase() > $(b).data("offer-data")[sort_by].toLowerCase();
          }
          else {
            return $(a).data("offer-data")[sort_by] > $(b).data("offer-data")[sort_by];
          }
        });
      }
      else {
        offers_to_sort.sort(function(a,b){
          if (sort_by == "name"){
            return $(a).data("offer-data")[sort_by].toLowerCase() < $(b).data("offer-data")[sort_by].toLowerCase();
          }
          else {
            return $(a).data("offer-data")[sort_by] < $(b).data("offer-data")[sort_by];
          }
        });
      }

      //re-order and append to parent
      for (var i = 0; i < offers_to_sort.length; i++) {
        offers_to_sort[i].parentNode.appendChild(offers_to_sort[i]);
      }
    });

    //no offers!
    if (!listing_info.offers.length){
      $("#no-offers").removeClass('is-hidden');
      $("#offers-toolbar").removeClass('is-hidden');
      $("#accepted-offer").addClass('is-hidden');
      $("#deposited-offer").addClass('is-hidden');
    }
    else {
      //show toolbar for sort
      $("#offers-toolbar").removeClass('is-hidden');

      //clone offers
      for (var x = 0; x < listing_info.offers.length; x++){
        var cloned_offer_row = $("#offer-clone").clone();
        cloned_offer_row.removeAttr("id").removeClass('is-hidden');
        cloned_offer_row.find(".offer-timestamp").text(moment(listing_info.offers[x].timestamp).format("MMMM DD, YYYY - h:mmA"));
        cloned_offer_row.find(".offer-name").text(listing_info.offers[x].name);
        cloned_offer_row.find(".offer-email").text(listing_info.offers[x].email).attr("href", "mailto:" + listing_info.offers[x].email);
        cloned_offer_row.find(".offer-phone").text(listing_info.offers[x].phone);
        cloned_offer_row.find(".offer-offer").text(moneyFormat.to(parseFloat(listing_info.offers[x].offer)));
        cloned_offer_row.find(".offer-message").text(listing_info.offers[x].message);
        cloned_offer_row.attr("id", "offer-row-" + listing_info.offers[x].id);
        cloned_offer_row.data("offer-data", listing_info.offers[x]);

        //click to open modal
        cloned_offer_row.find(".offer-modal-button").data("offer", listing_info.offers[x]).off().on("click", function(){
          editOfferModal($(this).data("offer"), listing_info);
        });
        cloned_offer_row.off().on('click', function(){
          editOfferModal($(this).find(".offer-modal-button").data("offer"), listing_info);
        });

        //accepted an offer!
        if (listing_info.offers[x].accepted == 1){
          $("#offers-toolbar").addClass('is-hidden');
          cloned_offer_row.find(".offer-accepted").text('Accepted - ').addClass('is-success');
          $("#accepted-offer").data("offer_id", listing_info.offers[x].id);
        }
        else if (listing_info.offers[x].accepted == 0){
          cloned_offer_row.find(".offer-accepted").text('Rejected - ').addClass('is-danger');
          cloned_offer_row.addClass('rejected-offer is-hidden unaccepted-offer');
        }
        else {
          cloned_offer_row.addClass('unaccepted-offer');
        }

        //deposited! figure out deadline
        if (listing_info.offers[x].deadline){
          var deposited_deadline = listing_info.offers[x].deadline;
        }

        $("#offers-wrapper").prepend(cloned_offer_row);
      }

      //hide no offers if there are any offers (that arent rejected)
      if ($(".offer-row:not(.rejected-offer, #offer-clone)").length){
        $("#no-offers").addClass('is-hidden');
      }
      else {
        $("#no-offers").removeClass('is-hidden');
      }

      //money has been deposited!
      if (listing_info.deposited == 1){
        $("#offers-toolbar").addClass('is-hidden');
        $('.unaccepted-offer').addClass('is-hidden');
        $("#deposited-offer").removeClass('is-hidden');
        $("#deposited-deadline").text(moment(deposited_deadline).format("MMMM DD, YYYY - h:mmA"));

        //resend the deposited offer email button
        $("#resend-deposit").off().on("click", function(){
          resendAcceptEmail($(this), listing_info, $("#accepted-offer").data("offer_id"), true);
        });
      }
      else {
        $("#deposited-offer").addClass('is-hidden');

        //accepted an offer! hide other offers
        if (listing_info.accepted == 1){
          $('.unaccepted-offer').addClass('is-hidden');
          $("#accepted-offer").removeClass('is-hidden');

          //resend the accepted offer email button
          $("#resend-accept").off().on("click", function(){
            resendAcceptEmail($(this), listing_info, $("#accepted-offer").data("offer_id"), false);
          });
        }
        else {
          $("#accepted-offer").addClass('is-hidden');
        }
      }
    }
  }
}

//function to edit modal with specific offer info
function editOfferModal(offer, listing_info){
  $("#offer-modal").addClass('is-active');
  $("#offer-response").val("");
  $("#offer-modal-timestamp").text(moment(offer.timestamp).format("MMMM DD, YYYY - h:MMA"));
  $("#offer-modal-price").text(moneyFormat.to(parseFloat(offer.offer)));
  $("#offer-modal-name").text(offer.name);
  $("#offer-modal-email").text(offer.email);
  $("#offer-modal-phone").text(offer.phone);
  $("#offer-modal-ip").text(offer.user_ip).attr("href", "http://whatismyipaddress.com/ip/" + offer.user_ip);
  $("#offer-modal-message").text(offer.message);

  //this offer was accepted or rejected! hide the buttons
  if (offer.accepted == 1 || offer.accepted == 0){
    $("#offer-modal-button-wrapper").addClass('is-hidden');
    $("#offer-response-label").removeClass('is-hidden');
    $("#offer-response").val((offer.response) ? offer.response : "You did not include a response.").addClass('is-disabled');
    var accept_or_reject_text = (offer.accepted == 1) ? "Accepted" : "Rejected";
    $("#offer-modal-domain").text(accept_or_reject_text + " offer for " + listing_info.domain_name);
  }
  //not yet accepted
  else {
    $("#offer-modal-button-wrapper").removeClass('is-hidden');
    $("#offer-modal-domain").text("Offer for " + listing_info.domain_name);
    $("#offer-response-label").addClass('is-hidden');
    $("#offer-response").val("").removeClass('is-disabled');
    $("#accept_button").off().on("click", function(){
      acceptOrRejectOffer(true, $(this), listing_info, offer.id);
    });
    $("#reject_button").off().on("click", function(){
      acceptOrRejectOffer(false, $(this), listing_info, offer.id);
    });
  }
}

//function to resend the accepted offer email to offerer
function resendAcceptEmail(resend_button, listing_info, offer_id, deposit){
  resend_button.off().addClass('is-loading');
  $.ajax({
    url: "/listing/" + listing_info.domain_name.toLowerCase() + "/contact/" + offer_id + "/resend",
    method: "POST"
  }).done(function(data){
    resend_button.removeClass('is-loading');
    if (data.state == "success"){
      var success_text = (deposit) ? "transfer verification" : "payment information";
      successMessage("Successfully re-sent the " + success_text + " email to the buyer!");
      resend_button.addClass('is-hidden');

      //remove the resend button (for margin bottom on previous p)
      $(".resend-wrapper").remove();
    }
    else {
      errorMessage(data.message);
    }
  });
}

//function to submit ajax for accept or reject
function acceptOrRejectOffer(accept, button_elem, listing_info, offer_id){
  button_elem.addClass('is-loading');
  var accept_url = (accept) ? "/accept" : "/reject";
  var response_to_offerer = $("#offer-response").val();
  $.ajax({
    url: "/listing/" + listing_info.domain_name.toLowerCase() + "/contact/" + offer_id + accept_url,
    method: "POST",
    data: {
      response: response_to_offerer
    }
  }).done(function(data){
    button_elem.removeClass('is-loading');
    if (data.state == "success"){

      //set the response text
      getOffer(listing_info.offers, offer_id).response = response_to_offerer;

      //hide stuff if accepted!
      if (accept){
        $("#offers-toolbar").addClass('is-hidden');

        //show purchased tab, hide other tabs
        $(".purchased-elem").removeClass('is-hidden');
        $(".unpurchased-elem").addClass("is-hidden");
      }
      offerSuccessHandler(accept, listing_info, offer_id);
    }
    else {
      offerErrorHandler(data.message, offer_id);
    }
  });
}

//function for offer accept success
function offerSuccessHandler(accept, listing_info, offer_id){
  var accept_text = (accept) ? "accepted" :  "rejected";
  successMessage("Successfully " + accept_text + " the offer!");
  $("#offer-modal").removeClass('is-active');

  //accepted offer
  if (accept){

    //change offer to accepted
    listing_info.accepted = 1;
    for (var x = 0 ; x < listing_info.offers.length; x++){
      if (listing_info.offers[x].id == offer_id){
        listing_info.offers[x].accepted = 1;
        break;
      }
    }

    //show accepted view
    $("#offer-row-" + offer_id).removeClass('unaccepted-offer').find(".offer-accepted").text('Accepted - ').addClass('is-success');
    $('.unaccepted-offer').addClass('is-hidden');
    $("#accepted-offer").removeClass('is-hidden');
  }
  //rejected offer
  else {
    //remove offer from listing_info
    for (var x = 0 ; x < listing_info.offers.length; x++){
      if (listing_info.offers[x].id == offer_id){
        listing_info.offers[x].accepted = 0;
        break;
      }
    }

    //hide the offer row
    $("#offer-row-" + offer_id).addClass("is-hidden rejected-offer").find(".offer-accepted").text('Rejected - ').addClass('is-danger');

    //no more offers!
    if ($(".offer-row:not(.rejected-offer):not(#offer-clone").length == 0){
      $("#no-offers").removeClass('is-hidden');
    }
  }
}

//function for offer accept error
function offerErrorHandler(message, offer_id){
  $("#offer-modal").removeClass('is-active');

  //show accepted view if already accepted
  if (message == "already-accepted"){
    $('.unaccepted-offer').addClass('is-hidden');
    $("#accepted-offer").removeClass('is-hidden');
    errorMessage("You have already accepted an offer for this listing!");
  }
  else {
    errorMessage(message);
  }
}

//</editor-fold>

//<editor-fold>-------------------------------STATS TAB EDITS-------------------------------

//function to get stats on a domain
function getDomainStats(domain_name){
  showLoadingStats();
  $.ajax({
    url: "/listing/" + domain_name.toLowerCase() + "/getstats",
    method: "POST"
  }).done(function(data){
    if (data.listings){
      updateCurrentListing(data.listings);

      //update local listings variable
      if (current_listing){
        (function(current_listing){

          //update the change row handler
          $("#row-listing_id" + current_listing.id).off().on("click", function(e){
            changeRow($(this), current_listing, true);
          });
          updateStats(current_listing, true);
        })(current_listing);
      }
    }
    else if (data.state != "success"){
      errorMessage(data.message);
    }
  });
}

//function to show loading stats
function showLoadingStats(show){
  $("#no-stats").addClass('is-hidden');
  $("#loading-stats").removeClass('is-hidden');
  $(".stats-loading").addClass('is-hidden');
}

//function to update the stats tab
function updateStats(listing_info, force_redraw){
  //no offers retrieved yet, show loading
  if (listing_info.stats == undefined){
    showLoadingStats(true);
  }
  //show offers if we have it, hide loading msg
  else {
    $("#loading-stats").addClass('is-hidden');
    $(".stats-loading").removeClass('is-hidden');

    //different listing! make referer chart
    if (force_redraw || !traffic_chart || !referer_chart || current_listing.domain_name != listing_info.domain_name){
      if (listing_info.stats && listing_info.stats.length > 0){
        $("#no-stats").addClass('is-hidden');
        var formatted_dataset = formatDataset(listing_info.stats, listing_info);
        createTrafficChart(formatted_dataset, listing_info);
        createRefererChart(formatted_dataset, listing_info);
      }
      else {
        $("#no-stats").removeClass('is-hidden');
      }
    }
  }
}

//function to format the stats to the required format
function formatDataset(stats, listing_info) {

  //traffic dataset
  var earliest_date = stats[stats.length - 1].timestamp;
  var num_months_since = Math.min(Math.ceil(moment.duration(new Date().getTime() - earliest_date).as("month") + 1), 12);    //12 months or less
  var months_since = [];
  for (var x = 0 ; x < num_months_since ; x++){
    var temp_month = moment().startOf("month").subtract(x, "month");
    months_since.push({
      label : temp_month.format("MMM"),
      timestamp : temp_month._d.getTime(),
      views : 0
    });
  }

  var views_per_month = [];
  var cur_month_needle = 0;
  var referer_dataset = stats.reduce(function (rv, cur) {
    //sort into groups divided by months
    if (cur_month_needle < num_months_since){
      if (cur.timestamp > months_since[cur_month_needle].timestamp){
        months_since[cur_month_needle].views++;
      }
      else {
        cur_month_needle++;
        if (cur_month_needle < num_months_since){
          months_since[cur_month_needle].views++;
        }
      }
    }

    //group referer by similar domains
    let v = "referer" instanceof Function ? key(cur) : cur["referer"];
    var el = rv.find(function (r) {
      return r && r["referer"] === v;
    });
    if (el) {
      el["views"]++;
    } else if (v != "" && v != listing_info.domain_name) {
      //if not empty, we can show the stat
      rv.push({ "referer": v, views: 1});
    }
    return rv;
  }, []);

  //sort the dataset (most views to least)
  referer_dataset.sort(function(a,b) {return (a.views > b.views) ? -1 : ((b.views > a.views) ? 1 : 0);} );

  //split into separate arrays for Chart JS
  var referer_views = [];
  var referer_labels = [];
  for (var x = 0; x < referer_dataset.length; x++){
    referer_views.push(referer_dataset[x].views);
    referer_labels.push(referer_dataset[x]["referer"]);
  }

  //reverse the dates
  months_since.reverse();

  var traffic_views = [];
  var traffic_labels = [];
  for (var x = 0; x < months_since.length; x++){
    traffic_views.push(months_since[x].views);
    traffic_labels.push(months_since[x].label);
  }

  return {
    referer_views : referer_views,
    referer_labels : referer_labels,
    traffic_views : traffic_views,
    traffic_labels : traffic_labels
  }
}

//function to create a chart
function createRefererChart(formatted_dataset, listing_info){
  //unique referer chart
  var referer_dataset = {
    label: "Hits",
    borderColor: "#3CBC8D",
    borderWidth: 1,
    backgroundColor: "rgba(60, 188, 141, 0.65)",
    data: formatted_dataset.referer_views
  }

  //destroy if we're making a new one
  if (referer_chart){
    referer_chart.destroy();
  }

  //create the new chart
  referer_chart = new Chart($("#referer-chart"), {
    type: 'horizontalBar',
    data: {
      labels: formatted_dataset.referer_labels,
      datasets: [referer_dataset]
    },
    options: {
      barPercentage: 1,
      categoryPercentage : 1,
      legend: {
        display: false
      }
    }
  });
}

//function to initiate chart only if uninitiated
function createTrafficChart(formatted_dataset, listing_info){
  if (traffic_chart){
    traffic_chart.destroy();
  }

  traffic_chart = new Chart($("#traffic-chart"), {
    type: 'line',
    data: {
      labels: formatted_dataset.traffic_labels,
      datasets: [{
        label: "Website Views",
        borderColor: "#3CBC8D",
        backgroundColor: "rgba(60, 188, 141, 0.65)",
        data: formatted_dataset.traffic_views
      }]
    },
    options: {
      legend: {
        display:false
      },
      hover: {
        mode: "index"
      },
      tooltips: {
        titleSpacing: 0,
        callbacks: {
          label: function(tooltipItems, data) {
            if (formatted_dataset.traffic_labels.indexOf(tooltipItems.xLabel) != -1){
              return tooltipItems.xLabel
            }
            else {
              return moment(tooltipItems.xLabel).format("MMM DD");
            }
          },
          title: function(tooltipItems, data){
            if (tooltipItems[0].datasetIndex == 0 && tooltipItems[0].yLabel == 0){
              return false;
            }
            else if (formatted_dataset.traffic_labels.indexOf(tooltipItems[0].xLabel) != -1){
              return false;
            }
            else {
              return (tooltipItems[0].index == 0) ? "Rental Start" : "Rental End";
            }
          },
          footer: function(tooltipItems, data){
            if (tooltipItems[0].datasetIndex == 0 && tooltipItems[0].yLabel == 0){
              return false;
            }
            else {
              var views_plural = (tooltipItems[0].yLabel == 1) ? " view" : " views";
              var views_formatted = wNumb({
                thousand: ','
              }).to(tooltipItems[0].yLabel);
              return views_formatted + views_plural;
            }
          }
        }
      },
      scales: {
        xAxes: [{
          type: "category"
        }],
        yAxes: [{
          display: true,
          type: 'linear',
          ticks: {
            beginAtZero: true   // minimum value will be 0.
          }
        }]
      }
    }
  });
}

//</editor-fold>

//<editor-fold>-------------------------------BINDINGS-------------------------------

//update change bindings (category, changeable-input, status)
function updateBindings(listing_info){

  //click to add this category
  $(".category-selector").off().on("click", function(e){
    $(this).toggleClass('is-dark');
    updateHiddenCategoryInput();
    changedValue($("#categories-input"), listing_info);
  });

  //bind new handlers for any changeable inputs
  $(".changeable-input").off().on("change input", function(e){
    changedValue($(this), listing_info);
  });

  //update status binding
  $("#status-input").off().on("click", function(e){
    submitStatusChange(listing_info);
  });

  //module checkbox handlers
  $(".checkbox-input").off().on("change", function(){
    var new_checkbox_val = ($(this).val() == "1") ? 0 : 1;
    $(this).val(new_checkbox_val);
    changedValue($(this), listing_info);

    //parent module
    if ($(this).hasClass('parent-module')){
      updateModuleChildren($(this));
    }
  });

  //load theme buttons
  loadThemeHandler();

  //allow rentals checkbox
  $("#rentable-input").on("change", function(){
    updateRentalInputsDisabled($(this).val());
  });

  //change domain name font
  $("#font-name-input").on("input", function(){
    $("#example-domain-name").css("font-family", $(this).val());
  });

  //change primary font color
  $("#primary-color-input").on("input", function(){
    $("#example-button-primary, #example-rent-price-tag, #example-buy-price-tag").css({
      "background-color" : $(this).val(),
      "border-color" : $(this).val(),
      "color" : calculateLuminance($(this).val())
    });
    $("#example-domain-name").css("color", $(this).val());
  });

  //change secondary font color
  $("#secondary-color-input").on("input", function(){
    $("#example-button-accent").css({
      "background-color" : $(this).val(),
      "border-color" : $(this).val(),
      "color" : calculateLuminance($(this).val())
    });
  });

  //change tertiary font color
  $("#tertiary-color-input").on("input", function(){
    $("#example-link-info").css("color", $(this).val());
  });

  //change regular font color
  $("#font-color-input").on("input", function(){
    $("#example-font").css("color", $(this).val());
  });

  //change background color
  $("#background-color-input").on("input", function(){
    $("#example-wrapper").css("background-color", $(this).val());
  });

  //remove uploading data and any uploaded images if typing the link
  $("#background-link-input").on("input", function(){
    $(this).data("uploading", false);
    $("#background-image-input").val("");
    var background_compare = (listing_info.background_image == null || listing_info.background_image == undefined) ? "" : listing_info.background_image;
    if ($(this).val() != background_compare){
      $("#background-link-refresh").addClass('is-primary').removeClass('is-disabled');
    }
    else {
      $("#background-link-refresh").removeClass('is-primary').addClass('is-disabled');
    }
  });

  //remove uploading data and any uploaded images if typing the link (logo)
  $("#logo-link-input").on("input", function(){
    $(this).data("uploading", false);
    $("#logo-image-input").val("");
    var logo_compare = (listing_info.logo == null || listing_info.logo == undefined) ? "" : listing_info.logo;
    if ($(this).val() != logo_compare){
      $("#logo-link-refresh").addClass('is-primary').removeClass('is-disabled');
    }
    else {
      $("#logo-link-refresh").removeClass('is-primary').addClass('is-disabled');
    }
  });

  //refresh background image (for preview)
  $("#background-link-refresh").off().on("click", function(){
    $("#background-link-refresh").removeClass('is-primary').addClass('is-disabled');
    $("#example-wrapper").css({'background-image' : "url(" + $("#background-link-input").val() + ")"});
  });

  //refresh logo (for preview)
  $("#logo-link-refresh").off().on("click", function(){
    $("#logo-link-refresh").removeClass('is-primary').addClass('is-disabled');
    $("#example-logo").attr('src', $("#logo-link-input").val());
  });

  //delete images
  $(".delete-image").off().on("click", function(){
    var image_id = $(this).attr('id');
    var temp_img = $("#" + image_id + "-image");
    var temp_input = $("#" + image_id + "-image-input");
    var temp_label = $("#" + image_id + "-image-label");

    if (temp_img.attr("src") != temp_img.data("default-img")){
      var old_src = temp_img.attr("src");
      temp_img.data("old_src", old_src);
      temp_img.attr("src", temp_img.data("default-img"));
      temp_input.data("deleted", true);
      temp_input.val("");
      $("#example-wrapper").css("background-image", "");
    }
    changedValue(temp_input, listing_info);
  });

}

//</editor-fold>

//</editor-fold>

//<editor-fold>-------------------------------SUBMIT LISTING UPDATES-------------------------------

//helper function to bind to inputs to listen for any changes from existing listing info
function changedValue(input_elem, listing_info){
  var name_of_attr = input_elem.data("name");
  if (name_of_attr == "background_image_link"){
    var listing_info_comparison = listing_info["background_image"];
  }
  else if (name_of_attr == "logo_image_link"){
    var listing_info_comparison = listing_info["logo"];
  }
  else {
    var listing_info_comparison = listing_info[name_of_attr];
  }

  listing_info_comparison = (listing_info_comparison == undefined || listing_info_comparison == null) ? "" : listing_info_comparison;

  //clear any existing messages
  errorMessage(false);
  successMessage(false);

  //only change if the value changed from existing
  if (input_elem.val() != listing_info_comparison){
    input_elem.data('changed', true);
    $("#save-changes-button").removeClass("is-disabled");
    $("#cancel-changes-button").removeClass("is-hidden");

    //changing background image
    if (name_of_attr == "background_image" && input_elem[0].files[0]){
      $("#background-link-input").data("uploading", true).val("Now uploading - " + input_elem[0].files[0].name);
      $("#example-wrapper").css("background-image", "url(https://placeholdit.imgix.net/~text?txtsize=50&txt=NOW%20UPLOADING&w=1000&h=250)");
    }
    else if (name_of_attr == "logo" && input_elem[0].files[0]){
      $("#logo-link-input").data("uploading", true).val("Now uploading - " + input_elem[0].files[0].name);
      $("#example-logo").attr("src-image", "https://placeholdit.imgix.net/~text?txtsize=50&txt=NOW%20UPLOADING");
    }
  }
  //hide the cancel, disable the save
  else {
    input_elem.data('changed', false);
    $("#save-changes-button").addClass("is-disabled");
    $("#cancel-changes-button").addClass("is-hidden");
  }
}

//function to visually reset submit/cancel buttons
function refreshSubmitButtons(){
  $("#cancel-changes-button").addClass("is-hidden");
  $("#save-changes-button").removeClass("is-loading").addClass('is-disabled');
}

//function to cancel the listing submit
function cancelListingChanges(){
  refreshSubmitButtons();

  //revert all inputs
  if (current_listing.deposited || current_listing.accepted){
    editRowPurchased(current_listing);
  }
  else if (current_listing.verified){
    editRowVerified(current_listing, true);   //true to prevent fade in
  }
  else {
    editRowUnverified(current_listing);
  }

  errorMessage(false);
  successMessage(false);
}

//function to submit status change
function submitStatusChange(listing_info){
  //take off the event handler for now
  $("#status-color").off();

  //clear any existing messages
  errorMessage(false);
  successMessage(false);

  var new_status = ($("#status-input").data("status") == "1") ? 0 : 1;
  var formData = new FormData();
  formData.append("status", new_status);

  $.ajax({
    url: "/listing/" + listing_info.domain_name.toLowerCase() + "/update",
    type: "POST",
    data: formData,
    // Options to tell jQuery not to process data or worry about the content-type
    cache: false,
    contentType: false,
    processData: false
  }, 'json').done(function(data){
    //reattach status binding
    $("#status-color").on("click", function(e){
      submitStatusChange(listing_info);
    });

    if (data.state == "success"){
      var active_inactive_text = (new_status == 0) ? "inactive! It is no longer visible to the public." : "active! It is now available to the public.";
      successMessage("This listing has been set to " + active_inactive_text);
      updateCurrentListing(data.listings);
      refreshSubmitButtons();

      (function(new_listing_info){
        //update the change row handler
        $("#row-listing_id" + new_listing_info.id).off().on("click", function(e){
          changeRow($(this), new_listing_info, true);
        });

        updateRowData($("#row-listing_id" + new_listing_info.id), new_listing_info);
        updateStatus({ status : new_status });
        updateBindings(new_listing_info);
      })(listing_info);
    }
    else {
      //listing is no longer pointed to domahub, revert to verify tab
      if (data.message == "verification-error"){
        delete listing_info.verified;

        (function(new_listing_info){
          errorMessage("This domain is no longer pointed to DomaHub! Please verify your DNS settings.");

          //find the index of the faulty listing
          var index_to_change = getListingIndex(new_listing_info.domain_name);

          //recreate the rows
          createRows(index_to_change);
          editRowUnverified(new_listing_info);
          updateBindings(new_listing_info);
        })(listing_info);
      }
      else {
        errorMessage(data.message);
      }
    }
  });
}

//function to submit any changes to a listing
function submitListingChanges(){

  //clear any existing messages
  errorMessage(false);
  successMessage(false);

  //only add changed inputs
  var formData = new FormData();
  $(".changeable-input").each(function(e){
    var input_name = $(this).data("name");
    var input_val = (input_name == "background_image" || input_name == "logo") ? $(this)[0].files[0] : $(this).val();

    //if changing listing image link
    if (input_name == "background_image_link"){
      var listing_comparison = current_listing["background_image"];
    }
    else if (input_name == "logo_image_link"){
      var listing_comparison = current_listing["logo"];
    }
    else {
      var listing_comparison = (current_listing[input_name] == null || current_listing[input_name] == undefined) ? "" : current_listing[input_name];
    }

    //if null or undefined
    if (input_val != listing_comparison && input_val != null){
      if ((input_name == "logo_image_link" || input_name == "background_image_link") && $(this).data("uploading")){
      }
      else {
        formData.append(input_name, input_val);
      }
    }
  });

  $("#save-changes-button").addClass("is-loading");

  $.ajax({
    url: "/listing/" + current_listing.domain_name.toLowerCase() + "/update",
    type: "POST",
    data: formData,
    // Options to tell jQuery not to process data or worry about the content-type
    cache: false,
    contentType: false,
    processData: false
  }, 'json').done(function(data){
    $("#save-changes-button").removeClass("is-loading");

    if (data.state == "success"){
      successMessage("Successfully updated this listing!");
      updateCurrentListing(data.listings);

      (function(new_listing_info){
        //update the change row handler
        $("#row-listing_id" + current_listing.id).off().on("click", function(e){
          changeRow($(this), new_listing_info, true);
        });

        //change domain name header && URL param
        updateQueryStringParam("listing", new_listing_info.domain_name);
        $(".current-domain-name").text(new_listing_info.domain_name);
        updateDomainName($("#row-listing_id" + new_listing_info.id), new_listing_info);

        updateBackground(new_listing_info);
        updateLogo(new_listing_info);
        refreshSubmitButtons();
        updateModules(new_listing_info);
        updateBindings(new_listing_info);
      })(current_listing);
    }
    else {
      errorMessage(data.message);
    }
  });
}

//helper function to display/hide error messages per listing
function errorMessage(message){
  //hide success
  $("#listing-msg-success").addClass('is-hidden').removeClass("is-active");
  $("#error-upgrade-button").addClass('is-hidden');

  if (message && message == "not-premium"){
    updatePremiumNotification();
    $("#listing-msg-error").removeClass('is-hidden').addClass("is-active");
    $("#listing-msg-error-text").text("You must upgrade to a Premium Account to be able to edit that!");
    $("#error-upgrade-button").removeClass('is-hidden');
  }
  else if (message && message == "nothing-changed"){
    refreshSubmitButtons();
    $("#listing-msg-error").addClass('is-hidden').removeClass("is-active");
  }
  else if (message){
    $("#listing-msg-error").removeClass('is-hidden').addClass("is-active");
    $("#listing-msg-error-text").text(message);
  }
  else if (!message) {
    $("#listing-msg-error").addClass('is-hidden').removeClass("is-active");
  }
}

//helper function to display success messages per listing
function successMessage(message){
  //hide error
  $("#listing-msg-error").addClass('is-hidden').removeClass("is-active");

  if (message){
    $("#listing-msg-success").removeClass('is-hidden').addClass("is-active");
    $("#listing-msg-success-text").text(message);
  }
  else if (!message){
    $("#listing-msg-success").addClass('is-hidden').removeClass("is-active");
  }
}

//</editor-fold>

//<editor-fold>-------------------------------UPDATE ROW UNVERIFIED-------------------------------

//function to initiate edit mode for unverified
function editRowUnverified(listing_info){
  //change tab URL
  updateQueryStringParam("tab", "verify");

  //disable verify now button (reverted if DNS changes are made)
  $("#verify-button").addClass('is-disabled');

  //refresh the DNS table button
  $("#refresh-dns-button").removeClass('is-disabled').off().on("click", function(){
    $(this).addClass('is-loading');
    $("#loading-records-row").removeClass('is-hidden');
    $("#dns_table-body").find(".clone-dns-row").addClass("is-hidden");
    getDNSRecordAndWhois(listing_info.domain_name);
  });

  //get who is an A record data if we haven't yet
  if (listing_info.a_records == undefined || listing_info.whois == undefined){
    getDNSRecordAndWhois(listing_info.domain_name);
  }
  else {
    updateRegistrarURL(listing_info.whois);
    updateExistingDNS(listing_info.a_records);
  }

  //hide purchased tab, show other tabs
  $(".purchased-elem").addClass('is-hidden');
  $(".unpurchased-elem").removeClass("is-hidden");

  //show the verification tab, hide others
  $("#verify-tab").addClass('is-active');
  $(".verified-elem").addClass('is-hidden');
  $(".unverified-elem").removeClass('is-hidden');

  //show buttons wrapper
  $("#tab-buttons-wrapper").removeClass('is-hidden');

  //function to run after successful verification
  updateVerificationButton(listing_info, function(){
    listing_info.verified = 1;

    //if connected to stripe, auto enable
    if (user.stripe_info && user.stripe_info.charges_enabled){
      listing_info.status = 1;
    }

    //recreate the rows
    createRows();
    editRowVerified(listing_info);
    successMessage("Successfully verified this domain! You may now edit the listing details.");
  });
}

//function to get A Record and Whois info for unverified domain
function getDNSRecordAndWhois(domain_name){
  $("#loading-records-row").removeClass('is-hidden');
  //clear table first of non-clones
  $("#dns_table-body").find(".clone-dns-row:not(#existing_a_record_clone)").remove();
  $.ajax({
    url: "/listing/" + domain_name.toLowerCase() + "/unverifiedInfo",
    method: "POST"
  }).done(function(data){
    $("#refresh-dns-button").removeClass("is-loading");
    var unverified_domain = getUserListingObj(listings, domain_name);

    if (unverified_domain){
      (function(unverified_domain){

        unverified_domain.a_records = data.listing.a_records;
        unverified_domain.whois = data.listing.whois;

        //only if the current visible listing is the one we asked AJAX info for
        if (current_listing.domain_name.toLowerCase() == unverified_domain.domain_name.toLowerCase()){
          //update the change row handler
          $("#row-listing_id" + current_listing.id).off().on("click", function(e){
            changeRow($(this), unverified_domain, true);
          });

          //update the unverified domain table
          updateRegistrarURL(unverified_domain.whois);
          updateExistingDNS(unverified_domain.a_records);
        }

      })(unverified_domain);
    }
  });
}

//update the registrar URL if there is one
function updateRegistrarURL(whois){
  if (whois && (whois.Registrar || whois["Sponsoring Registrar"])){
    var reg_name = whois.Registrar || whois["Sponsoring Registrar"];
    var reg_url = whois["Registrar URL"] || whois["Registrar URL (registration services)"];
    var regex_url = /^((http|https):\/\/)/;
    if (!regex_url.test(reg_url)) { reg_url = "http://" + reg_url; }
    $("#registrar_url").replaceWith("<p id='registrar_url'>Please <a target='_blank' class='is-primary' href='" + reg_url + "'>log in to your domain provider</a> (" + reg_name + ") to create these entries.");
  }
}

//update the table with any existing DNS records
function updateExistingDNS(a_records){
  //hide loading message
  $("#loading-records-row").addClass('is-hidden');

  //clear table first of non-clones
  $("#dns_table-body").find(".clone-dns-row:not(#existing_a_record_clone)").remove();
  if (a_records){

    var temp_a_records = a_records.slice(0);

    //domahub IP exists
    if (temp_a_records.indexOf("208.68.37.82") != -1){
      temp_a_records.splice(temp_a_records.indexOf("208.68.37.82"), 1);
      createDomaRecords(true);

      //if only domahub
      if (a_records.length == 1 && a_records[0] == "208.68.37.82"){
        $("#existing_a_record_clone").find(".next_step").html("<span class='is-success'>Done! Press the button below!</span>");

        $("#verify-button").removeClass('is-disabled');
        $("#refresh-dns-button").off().addClass('is-disabled');   //prevent refreshing of table
      }
      else {
        $("#existing_a_record_clone").find(".next_step").html("<span class='is-success'>Done!</span>");
      }
    }
    else {
      createDomaRecords(false);
    }

    //delete any existing records
    for (var x = 0; x < temp_a_records.length; x++){
      if (temp_a_records[x] != "208.68.37.82"){
        var temp_dns_row = $("#existing_a_record_clone").clone().removeAttr('id').removeClass('is-hidden');
        temp_dns_row.find(".existing_data").text(temp_a_records[x]);
        temp_dns_row.find(".required_data").text("-");
        temp_dns_row.find(".next_step").html("<span class='is-danger'>Delete this record.</span>");
        $("#dns_table-body").append(temp_dns_row);
      }
    }
  }
  else {
    createDomaRecords(false);
  }
}

function createDomaRecords(exists){

  var existing_data_text = (exists) ? "207.68.37.82" : "Not found!";
  var next_step_class = (exists) ? "is-primary" : "is-danger";
  var next_step_text = (exists) ? "Done!" : "Create this record.";

  //create @ host
  var temp_dns_row = $("#existing_a_record_clone").clone().removeAttr('id').removeClass('is-hidden');
  temp_dns_row.find(".dns_host").text("@");
  temp_dns_row.find(".existing_data").text(existing_data_text);
  temp_dns_row.find(".required_data").text("208.68.37.82");
  temp_dns_row.find(".next_step").html("<span class='" + next_step_class + "'>" + next_step_text + "</span>");
  $("#dns_table-body").append(temp_dns_row);

  //create www host as well
  var temp_dns_row = $("#existing_a_record_clone").clone().removeAttr('id').removeClass('is-hidden');
  temp_dns_row.find(".dns_host").text("www");
  temp_dns_row.find(".existing_data").text(existing_data_text);
  temp_dns_row.find(".required_data").text("208.68.37.82");
  temp_dns_row.find(".next_step").html("<span class='" + next_step_class + "'>" + next_step_text + "</span>");
  $("#dns_table-body").append(temp_dns_row);
}

//update the verify button
function updateVerificationButton(listing_info, cb_when_verified){
  var verify_button = $("#verify-button");

  //ajax to make sure it's all done, then display a regular row if verified
  verify_button.off().on("click", function(e){
    e.preventDefault();

    verify_button.addClass('is-loading');
    $.ajax({
      url: "/listing/" + listing_info.domain_name.toLowerCase() + "/verify",
      method: "POST"
    }).done(function(data){
      verify_button.removeClass('is-loading is-danger');
      if (data.state == "success"){
        cb_when_verified();
      }
      else {
        errorMessage("Failed to verify! Please check your DNS details and try again.");
      }
    });
  });
}

//</editor-fold>

//<editor-fold>-------------------------------SELECT ROW-------------------------------

//function to select a row
function selectRow(row){
  var selected = (row.prop("checked") == false) ? true : false;
  var verified = row.data("verified");
  row.data("selected", selected);

  var icon_i = row.find(".select-button i");

  row.toggleClass('is-selected');

  multiSelectButtons();
}

//function to select all rows
function selectAllRows(select_all_button, select_or_deselect){

  //select all
  if (!select_or_deselect){
    select_all_button.data('selected', true);
    select_all_button.find("i").removeClass("fa-square-o").addClass('fa-check-square-o box-checked');

    $(".table-row:not(.clone-row)").addClass('is-selected');
    $(".table-row .select-button").prop("checked", true);
  }
  //deselect all
  else {
    select_all_button.data('selected', false);
    select_all_button.find("i").addClass("fa-square-o").removeClass('fa-check-square-o box-checked');

    $(".table-row:not(.clone-row)").removeClass('is-selected');
    $(".table-row .select-button").prop("checked", false);
  }

  select_all_button.data('selected', !select_or_deselect);
  multiSelectButtons();
}

//helper function to handle multi-select action buttons
function multiSelectButtons(){

  //remove delete confirmation (if exists);
  $("#multi-delete").data("confirm", false).find("#multi-delete-text").text("Delete");

  var selected_rows = $(".table-row:not(.clone-row)").filter(function(){ return $(this).hasClass("is-selected") == true });
  var verified_selected_rows = selected_rows.filter(function(){ return $(this).data("verified") == false});

  if (selected_rows.length > 0){
    $("#multi-delete").removeClass("is-disabled");
  }
  else {
    $("#multi-delete").addClass("is-disabled");
  }

  if (verified_selected_rows.length > 0){
    $("#multi-verify").removeClass("is-disabled");
  }
  else {
    $("#multi-verify").addClass("is-disabled");
  }
}

//function to multi-verify listings
function multiVerify(verify_button){
  verify_button.off().addClass('is-loading');

  var ids = [];
  var selected_rows = $(".table-row").filter(function(){
    if ($(this).hasClass('is-selected')){
      ids.push($(this).data('id'));
      return true;
    }
  });

  $.ajax({
    url: "/profile/mylistings/verify",
    method: "POST",
    data: {
      ids: ids
    }
  }).done(function(data){
    console.log(data);

    verify_button.removeClass('is-loading').blur().on("click", function(){
      multiVerify(verify_button);
    });

    //deselect all rows
    selectAllRows($("#select-all"), true);

    //success rows
    if (data.state == "success"){
      verificationHandler(data);
      successMessage("Successfully verified " + ids.length + " listings!");
    }
    //unverified listings error
    else if (data.unverified_listings){
      errorMessage("Failed to verify listings! Did you make the necessary DNS changes?");

      //add danger to failed rows
      for (var x = 0; x < data.unverified_listings.length; x++){
        $(".row-disp").each(function(){
          if ($(this).data('id') == data.unverified_listings[x]){
            $(this).find(".td-edit>.button").addClass('is-danger');
            $(this).find(".td-arrow>.icon").addClass('is-danger');
            $(this).find(".td-arrow .fa").removeClass('fa-square-o').addClass('fa-exclamation-triangle');
          }
        });
      }
    }
  });
}

//function to handle post-verification of multi listings
function verificationHandler(data){
  listings = data.listings;
  createRows();
}

//function to delete multiple rows
function multiDelete(delete_button){
  //confirm first
  if (!delete_button.data("confirm")){
    delete_button.data("confirm", true).find("#multi-delete-text").text("You sure?");
  }
  else {
    delete_button.addClass('is-loading').off();

    var deletion_ids = [];
    var selected_rows = $(".table-row").filter(function(){
      if ($(this).hasClass('is-selected')){
        deletion_ids.push($(this).data('id'));
        return true;
      }
    });

    $.ajax({
      url: "/profile/mylistings/delete",
      method: "POST",
      data: {
        ids: deletion_ids
      }
    }).done(function(data){
      //re-add handler, re-add confirmation
      delete_button.removeClass('is-loading').blur().data("confirm", false).on("click", function(){
        multiDelete(delete_button);
      }).find("#multi-delete-text").text("Delete")

      //deselect all rows
      selectAllRows($("#select-all"), true);
      if (data.state == "success"){
        deletionHandler(data.rows, selected_rows);
        successMessage("Successfully deleted " + deletion_ids.length + " listings!");
      }
    });
  }
}

//function to handle post-deletion of multi listings
function deletionHandler(rows, selected_rows){
  listings = rows;
  for (var x = 0; x < selected_rows.length; x++){
    $(selected_rows[x]).remove();
  }

  //there are no more listings!
  if (rows.length == 0){
    $(".yes-listings-elem").addClass('is-hidden');
    $(".no-listings-elem").removeClass('is-hidden');
    $("#loading-tab").addClass('is-hidden');
  }
  //recreate the rows
  else {
    createRows();
  }
}

//</editor-fold>

//<editor-fold>-------------------------------HELPER FUNCTIONS--------------------------------

//function to get a URL query param by name
function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
  results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function updateQueryStringParam(key, value) {

  var baseUrl = [location.protocol, '//', location.host, location.pathname].join(''),
  urlQueryString = document.location.search,
  newParam = key + '=' + value,
  params = '?' + newParam;

  // If the "search" string exists, then build params from it
  if (urlQueryString) {

    updateRegex = new RegExp('([\?&])' + key + '[^&]*');
    removeRegex = new RegExp('([\?&])' + key + '=[^&;]+[&;]?');

    if( typeof value == 'undefined' || value == null || value == '' ) { // Remove param if value is empty

      params = urlQueryString.replace(removeRegex, "$1");
      params = params.replace( /[&;]$/, "" );

    } else if (urlQueryString.match(updateRegex) !== null) { // If param exists already, update it

      params = urlQueryString.replace(updateRegex, "$1" + newParam);

    } else { // Otherwise, add it to end of query string

      params = urlQueryString + '&' + newParam;

    }

  }

  window.history.replaceState({}, "", baseUrl + params);
};

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
    return "#222";
  }
  else {
    return "#fff";
  }
}

//function to sort
function sortBy(property_name, asc, a, b){
  if (asc){
    if (a[property_name] < b[property_name]){
      return -1;
    }
    if (a[property_name] > b[property_name]) {
      return 1;
    }
    return 0;
  }
  else {
    if (a[property_name] > b[property_name]){
      return -1;
    }
    if (a[property_name] < b[property_name]) {
      return 1;
    }
    return 0;
  }
}

function toUpperCase(string){
  return string.charAt(0).toUpperCase() + string.substr(1);
}

//update the current_listing object based on
function updateCurrentListing(new_listings){

  //loop and update any new variables
  for (var y = 0; y < new_listings.length; y++){
    for (var z = 0; z < listings.length; z++){
      if (new_listings[y].id == listings[z].id){
        for (var w in new_listings[y]){
          listings[z][w] = new_listings[y][w];
        }
        break;
      }
    }
  }

  //update current listing info
  for (var x = 0; x < listings.length; x++){
    if (listings[x].id == current_listing.id){
      current_listing = listings[x];
      break;
    }
  }
}

//helper function to get the user listings object for a specific domain
function getUserListingObj(listings, domain_name){
  for (var x = 0; x < listings.length; x++){
    if (listings[x].domain_name.toLowerCase() == domain_name.toLowerCase()){
      return listings[x];
    }
  }
}

//helper function to find index of a specific listing in listings array
function getListingIndex(domain_name){
  for (var x = 0; x < listings.length; x++){
    if (listings[x].domain_name.toLowerCase() == domain_name.toLowerCase()){
      return x;
    }
  }
}

//to format a number for $$$$
var moneyFormat = wNumb({
  thousand: ',',
  prefix: '$',
  decimals: 0
});

//</editor-fold>
