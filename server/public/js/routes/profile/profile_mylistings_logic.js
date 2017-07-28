var current_listing = (listings) ? listings[0] : {};

$(document).ready(function(){

  $(".filter-menu-toggle").on("click", function() {
    $("#filter-menu").toggleClass("is-active");
  });

  //populate all themes
  populateThemeDropdown();

  //<editor-fold>-------------------------------FILTERS-------------------------------

  //sorting
  $("#sort-select").on("change", function(){
    var sort_by = $(this).val();

    //sort by date created
    if (sort_by == "date"){
      listings.sort(function(a,b){
        return sortBy("id", true, a, b);
      });
    }
    //sort A to Z
    else if (sort_by == "az"){
      listings.sort(function(a,b){
        return sortBy("domain_name", true, a, b);
      });
    }
    //sort Z to A
    else if (sort_by == "za") {
      listings.sort(function(a,b){
        return sortBy("domain_name", false, a, b);
      });
    }
    //buy_price ascending
    else if (sort_by == "price_asc"){
      listings.sort(function(a,b){
        return sortBy("buy_price", true, a, b);
      });
    }
    //buy_price ascending
    else if (sort_by == "price_asc"){
      listings.sort(function(a,b){
        return sortBy("buy_price", false, a, b);
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
  });

  //</editor-fold>

  //<editor-fold>-------------------------------DOMAIN LIST-------------------------------

  createRows();

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
    //clear any existing messages
    errorMessage(false);
    successMessage(false);

    //hide other tab selectors
    $(".tab.verified-elem").removeClass('is-active');
    $(this).addClass('is-active');

    //show specific tab
    $(".drop-tab").stop().fadeOut(300).addClass('is-hidden');
    $("#" + $(this).attr("id") + "-drop").stop().fadeIn(300).removeClass('is-hidden');

    //hide save/cancel changes buttons on offers tab
    if ($(this).attr("id") == "offers-tab"){
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
function createRows(cur_listing_index){
  //empty the table
  $("#table-body").find(".table-row:not(.clone-row)").remove();

  //create rows for each listing
  for (var x = 0; x < listings.length; x++){
    $("#table-body").append(createRow(listings[x], x));
  }

  //show the first child
  if (listings.length > 0){

    //a specific listing to show or show first one
    var listing_to_show = (cur_listing_index) ? listings[cur_listing_index] : listings[0];
    var index_for_table = (cur_listing_index) ? cur_listing_index : 0;

    current_listing = listing_to_show;

    //show and hide elements that we need if there are listings
    $(".yes-listings-elem").removeClass('is-hidden');
    $(".no-listings-elem").addClass('is-hidden');
    $("#loading-tab").addClass('is-hidden');

    //update inputs for purchased domain
    if (listing_to_show.accepted){
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
    $("#current-domain-view").attr("href", "/listing/" + listing_to_show.domain_name);
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
  if (listing_info.verified || listing_info.accepted){
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
  tempRow.data("editing", false);
  tempRow.data("selected", false);
  tempRow.data("id", listing_info.id);
  tempRow.data("domain_name", listing_info.domain_name);
  tempRow.data("unverified", (listing_info.verified) ? false : true);
  tempRow.data("rented", listing_info.rented);

  //already got the dns and a records for unverified domain
  if (listing_info.a_records != undefined && listing_info.whois != undefined){
    tempRow.data("record_got", true);
  }

  return tempRow;
}

//update the clone row with row specifics
function updateDomainName(tempRow, listing_info){
  tempRow.find(".td-domain").text(listing_info.domain_name);
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

    current_listing = listing_info;

    //change domain name header and view button
    $(".current-domain-name").text(listing_info.domain_name);
    $("#current-domain-view").attr("href", "/listing/" + listing_info.domain_name);

    //update inputs for purchased domain
    if (listing_info.accepted){
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
  }
}

//</editor-fold>

//<editor-fold>-------------------------------UPDATE ROW VERIFIED-------------------------------

//function to update a row if it's verified but not yet purchased
function editRowVerified(listing_info){

  //get offers if we haven't yet
  if (listing_info.offers == undefined){
    getDomainOffers(listing_info.domain_name);
  }
  else {
    updateOffers(listing_info);
  }

  //hide purchased tab, show other tabs
  $(".purchased-elem").addClass('is-hidden');
  $(".unpurchased-elem").removeClass("is-hidden");

  //show the verified tabs, hide unverified
  $(".verified-elem").removeClass('is-hidden');
  $(".unverified-elem").addClass('is-hidden');

  //show buttons wrapper only on non upgrade/offer tabs
  if ($(".verified-elem.tab.is-active").attr("id") != "offers-tab" && $(".verified-elem.tab.is-active").attr("id") != "upgrade-tab"){
    $("#tab-buttons-wrapper").removeClass('is-hidden');
  }

  //show active tab drop
  $(".drop-tab").addClass('is-hidden');
  $("#" + $(".verified-elem.tab.is-active").attr('id') + "-drop").removeClass('is-hidden');

  //revert preview stuff
  $(".preview-elem").removeAttr('style');

  updateStatus(listing_info);
  updateDescription(listing_info);
  updateCategories(listing_info);
  updatePaths(listing_info);

  updatePriceInputs(listing_info);

  updatePremiumNotification();
  updateColorScheme(listing_info);
  updateFontStyling(listing_info);
  updateModules(listing_info);
  updateBackground(listing_info);
  updateModules(listing_info);
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

  //hide buttons wrapper
  $("#tab-buttons-wrapper").addClass('is-hidden');
  $("#verified-drop-tab, #offers-tab-drop").removeClass('is-hidden');
  updateOffers(listing_info);
}

//function to get offers on a domain
function getDomainOffers(domain_name){
  console.log("GETTING OFFERS");

  $.ajax({
    url: "/listing/" + domain_name + "/getoffers",
    method: "POST"
  }).done(function(data){
    updateCurrentListing(data.listings);

    //update local listings variable
    if (current_listing){
      (function(current_listing){

        //update the change row handler
        $("#row-listing_id" + current_listing.id).off().on("click", function(e){
          changeRow($(this), current_listing, true);
        });

        updateOffers(current_listing);
      })(current_listing);
    }
  });
}

  //<editor-fold>-------------------------------OFFER TAB EDITS-------------------------------

  //function to update the offers tab
  function updateOffers(listing_info){
    if (listing_info.offers == undefined){
      getDomainOffers(listing_info.domain_name);
    }
    else {
      //hide loading msg
      $("#loading-offers").addClass('is-hidden');
      $("#offers-wrapper").empty();

      if (listing_info.offers.length){
        $("#no-offers").addClass('is-hidden');

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
          if (listing_info.offers[x].accepted == 1){
            cloned_offer_row.find(".offer-accepted").text('Accepted - ');
          }
          else {
            cloned_offer_row.addClass('unaccepted-offer');
            cloned_offer_row.find(".offer-accept").removeClass('is-hidden').attr("href", "/listing/" + listing_info.domain_name + "/contact/" + listing_info.offers[x].id + "/accept");
            cloned_offer_row.find(".offer-reject").removeClass('is-hidden').attr("href", "/listing/" + listing_info.domain_name + "/contact/" + listing_info.offers[x].id + "/reject");
          }
          $("#offers-wrapper").append(cloned_offer_row);
        }

        //accepted an offer! hide other offers
        if (listing_info.accepted == 1){
          $('.unaccepted-offer').addClass('is-hidden');
          $("#accepted-offer").removeClass('is-hidden');
        }
        else {
          $("#accepted-offer").addClass('is-hidden');
        }
      }
      else {
        $("#no-offers").removeClass('is-hidden');
        $("#accepted-offer").addClass('is-hidden');
      }
    }
  }

  //</editor-fold>

  //<editor-fold>-------------------------------INFORMATION TAB EDITS-------------------------------

  //update the information tab
  function updateStatus(listing_info){
    $("#status-input").val(listing_info.status);

    if (listing_info.status == 1){
      $("#status-text").text("Active");
      $("#status-color").addClass("is-primary").removeClass('is-danger');
      $("#status-icon").addClass("fa-toggle-on").removeClass('fa-toggle-off');
    }
    else {
      $("#status-text").text("Inactive");
      $("#status-color").addClass('is-danger').removeClass("is-primary");
      $("#status-icon").addClass('fa-toggle-off').removeClass("fa-toggle-on");
    }
  }
  function updateDescription(listing_info){
    $("#description").val(listing_info.description);
    $("#short-desc").val(listing_info.description_hook);
  }
  function updateCategories(listing_info){
    var listing_categories = (listing_info.categories) ? listing_info.categories.split(" ") : [];
    $(".category-selector").removeClass('is-primary');
    for (var x = 0; x < listing_info.categories.split(" ").length; x++){
      //color existing categories
      var temp_category = $("." + listing_categories[x] + "-category").addClass('is-primary');
    }
    updateHiddenCategoryInput();
  }
  function updateHiddenCategoryInput(){
    var joined_categories = $(".category-selector.is-primary").map(function() {
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
    }
    else {
      $("#premium-only-notification").removeClass("is-hidden");
      $(".premium-input").addClass("is-disabled");
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
      "color" : calculateLuminance(listing_info.primary_color)
    });
    $("#example-button-accent").css({
      "background-color" : listing_info.secondary_color,
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
    $("#background-image").attr('src', background_image).off().on("error", function() {
      $(this).attr("src", "https://placeholdit.imgix.net/~text?txtsize=20&txt=LOADING...%20&w=96&h=64");
    });

    var minicolor_options = {
      letterCase: "uppercase",
      swatches: ["#FFFFFF", "#E5E5E5", "#B2B2B2", "#7F7F7F", "#666666", "#222222", "#000000"]
    }
    $("#background-color-input").val(listing_info.background_color).minicolors("destroy").minicolors(minicolor_options);

    //update the preview
    $("#example-wrapper").css("background-color", listing_info.background_color);
  }
  function updateLogo(listing_info){
    var logo = (listing_info.logo == null || listing_info.logo == undefined || listing_info.logo == "") ? "/images/dh-assets/flat-logo/dh-flat-logo-primary.png" : listing_info.logo;
    $("#logo-image").attr('src', logo).off().on("error", function() {
      $(this).attr("src", "/images/dh-assets/flat-logo/dh-flat-logo-primary.png");
    });
  }
  function updateModules(listing_info){
    checkBox(listing_info.history_module, $("#history-module-input"));
    checkBox(listing_info.traffic_module, $("#traffic-module-input"));
    checkBox(listing_info.info_module, $("#info-module-input"));

    //alexa link
    $("#alexa_link").attr("href", "https://www.alexa.com/siteinfo/" + listing_info.domain_name);
  }
  function checkBox(module_value, elem){
    if (module_value){
      elem.val(module_value).prop("checked", true);
    }
    else {
      elem.val(module_value).prop("checked", false);
    }
  }

  //</editor-fold>

  //<editor-fold>-------------------------------BINDINGS-------------------------------

  //update change bindings (category, changeable-input, status)
  function updateBindings(listing_info){

    //click to add this category
    $(".category-selector").off().on("click", function(e){
      $(this).toggleClass('is-primary');
      updateHiddenCategoryInput();
      changedValue($("#categories-input"), listing_info);
    });

    //bind new handlers for any changeable inputs
    $(".changeable-input").off().on("change input", function(e){
      changedValue($(this), listing_info);
    });

    //update status binding
    $("#status-color").off().on("click", function(e){
      var new_status = ($("#status-input").val() == "1") ? 0 : 1;
      updateStatus({ status : new_status });
      submitStatusChange(listing_info);
    });

    //module checkbox handlers
    $(".checkbox-input").off().on("change", function(){
      var new_checkbox_val = ($(this).val() == "1") ? 0 : 1;
      $(this).val(new_checkbox_val);
      changedValue($(this), listing_info);
    });

    //load theme buttons
    loadThemeHandler();

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
        "color" : calculateLuminance($(this).val())
      });
      $("#example-domain-name").css("color", $(this).val());
    });

    //change secondary font color
    $("#secondary-color-input").on("input", function(){
      $("#example-button-accent").css({
        "background-color" : $(this).val(),
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
        // temp_label.text(temp_label.data("default-name"));
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

  //clear any existing messages
  errorMessage(false);
  successMessage(false);

  var save_button = $("#save-changes-button");
  var cancel_button = $("#cancel-changes-button");

  //only change if the value changed from existing or if image exists
  if ((name_of_attr != "background_image" && name_of_attr != "logo" && input_elem.val() != listing_info[name_of_attr])
  || ((name_of_attr == "background_image" || name_of_attr == "logo") && input_elem.val())
  || ((name_of_attr == "background_image" || name_of_attr == "logo") && input_elem.data("deleted"))){
    input_elem.data('changed', true);
    save_button.removeClass("is-disabled");
    cancel_button.removeClass("is-hidden");
  }
  //hide the cancel, disable the save
  else {
    input_elem.data('changed', false);
    save_button.addClass("is-disabled");
    cancel_button.addClass("is-hidden");
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
  editRowVerified(current_listing);

  errorMessage(false);
  successMessage(false);
}

//function to submit status change
function submitStatusChange(listing_info){
  //clear any existing messages
  errorMessage(false);
  successMessage(false);

  var formData = new FormData();
  formData.append("status", $("#status-input").val());

  $.ajax({
    url: "/listing/" + listing_info.domain_name + "/update",
    type: "POST",
    data: formData,
    // Options to tell jQuery not to process data or worry about the content-type
    cache: false,
    contentType: false,
    processData: false
  }, 'json').done(function(data){
    if (data.state == "success"){
      var active_inactive_text = ($("#status-input").val() == "0") ? "inactive" : "active";
      successMessage("Listing has been set to " + active_inactive_text + "!");
      updateCurrentListing(data.listings);
      refreshSubmitButtons();

      (function(new_listing_info){
        //update the change row handler
        $("#row-listing_id" + new_listing_info.id).off().on("click", function(e){
          changeRow($(this), new_listing_info, true);
        });

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

    //if background image is being deleted
    if (input_name == "background_image" && $(this).data("deleted")){
      var input_val = "";
      $(this).data('deleted', false);
    }

    //if logo is being deleted
    if (input_name == "logo" && $(this).data("deleted")){
      var input_val = "";
      $(this).data('deleted', false);
    }

    //if null or undefined
    current_listing[input_name] = (current_listing[input_name] == null || current_listing[input_name] == undefined) ? "" : current_listing[input_name];
    if (input_val != current_listing[input_name]){
      formData.append(input_name, input_val);
    }
  });

  $("#save-changes-button").addClass("is-loading");

  $.ajax({
    url: "/listing/" + current_listing.domain_name + "/update",
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

      //update images if necessary
      if (data.new_background_image){
        updateBackground({ background_image : data.new_background_image});
      }
      if (data.new_logo){
        updateBackground({ logo : data.new_logo});
      }

      refreshSubmitButtons();

      (function(listing_info){
        //update the change row handler
        $("#row-listing_id" + current_listing.id).off().on("click", function(e){
          changeRow($(this), listing_info, true);
        });

        updateBindings(listing_info);
      })(current_listing);
    }
    else {
      errorMessage(data.message);
    }
  });
}

//helper function to display/hide error messages per listing
function errorMessage(message){
  if (message && message != "nothing-changed"){
    successMessage(false);
    $("#listing-msg-error").removeClass('is-hidden').addClass("is-active");
    $("#listing-msg-error-text").text(message);
  }
  else {
    $("#listing-msg-error").addClass('is-hidden').removeClass("is-active");
  }
}

//helper function to display success messages per listing
function successMessage(message){
  if (message){
    errorMessage(false);
    $("#listing-msg-success").removeClass('is-hidden').addClass("is-active");
    $("#listing-msg-success-text").text(message);
  }
  else {
    $("#listing-msg-success").addClass('is-hidden').removeClass("is-active");
  }
}

//</editor-fold>

//<editor-fold>-------------------------------UPDATE ROW UNVERIFIED-------------------------------

//function to initiate edit mode for unverified
function editRowUnverified(listing_info){

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
  $.ajax({
    url: "/listing/" + domain_name + "/unverifiedInfo",
    method: "POST"
  }).done(function(data){
    $("#refresh-dns-button").removeClass("is-loading");
    var unverified_domain = getUserListingObj(listings, domain_name);

    if (unverified_domain){
      (function(unverified_domain){

        unverified_domain.a_records = data.listing.a_records;
        unverified_domain.whois = data.listing.whois;

        //only if the current visible listing is the one we asked AJAX info for
        if (current_listing.domain_name == unverified_domain.domain_name){
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
    $("#registrar_url").replaceWith("<p id='registrar_url'>Please <a target='_blank' class='is-accent' href='" + reg_url + "'>log in to your domain provider</a> (" + reg_name + ") to create these entries.");
  }
}

//update the table with any existing DNS records
function updateExistingDNS(a_records){
  if (a_records){
    //hide loading message
    $("#loading-records-row").addClass('is-hidden');

    var temp_a_records = a_records.slice(0);

    //domahub IP exists
    if (temp_a_records.indexOf("208.68.37.82") != -1){
      temp_a_records.splice(temp_a_records.indexOf("208.68.37.82"), 1);
      $("#existing_a_record_clone").removeClass('is-hidden').find(".existing_data").text("208.68.37.82");
      $("#existing_a_record_clone").find(".next_step").html("<span class='is-success'>Done!</span>");

      //prevent refreshing of table
      $("#refresh-dns-button").off().addClass('is-disabled');
    }
    else {
      $("#existing_a_record_clone").removeClass('is-hidden').find(".existing_data").text("-");
      $("#existing_a_record_clone").find(".next_step").html("<span class='is-primary'>Create this record.</span>");
    }

    //clear table first of non-clones
    $("#dns_table-body").find(".clone-dns-row:not(#existing_a_record_clone)").remove();

    //delete any existing records
    for (var x = 0; x < temp_a_records.length; x++){
      var temp_dns_row = $("#existing_a_record_clone").clone().removeAttr('id').removeClass('is-hidden');
      temp_dns_row.find(".existing_data").text(a_records[x]);
      temp_dns_row.find(".required_data").text("-");
      temp_dns_row.find(".next_step").html("<span class='is-danger'>Delete this record.</span>");
      $("#dns_table-body").append(temp_dns_row);
    }
  }
  else {
    //clear table first
    $("#dns_table-body").find(".clone-dns-row:not(#existing_a_record_clone)").remove();
    $("#existing_a_record_clone").removeClass('is-hidden').find(".existing_data").text("Not found!").addClass('is-danger');
  }
}

//update the verify button
function updateVerificationButton(listing_info, cb_when_verified){
  var verify_button = $("#verify-button");

  //ajax to make sure it's all done, then display a regular row if verified
  verify_button.off().on("click", function(e){
    e.preventDefault();

    verify_button.addClass('is-loading');
    $.ajax({
      url: "/listing/" + listing_info.domain_name + "/verify",
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

    verify_button.on("click", function(){
      multiVerify(verify_button);
    }).removeClass('is-loading');

    //deselect all rows
    selectAllRows($("#select-all"), true);

    //unverified listings error
    if (data.unverified_listings){
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

    //success rows
    if (data.state == "success"){
      verificationHandler(data);
      successMessage("Successfully verified listings!");
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
  delete_button.off();

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
    delete_button.on("click", function(){
      multiDelete(delete_button);
    });

    //deselect all rows
    selectAllRows($("#select-all"), true);

    if (data.state == "success"){
      deletionHandler(data.rows, selected_rows);
    }
    else {
      console.log(data);
    }
  });
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
}

//</editor-fold>

//<editor-fold>-------------------------------HELPER FUNCTIONS--------------------------------

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
    if (listings[x].domain_name == domain_name){
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
