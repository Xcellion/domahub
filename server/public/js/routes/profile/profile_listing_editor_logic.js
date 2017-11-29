var current_listing = {};
var referer_chart = false;
var traffic_chart = false;
var completed_domains = 0;
var premium_blackscreen = $("#premium-blackscreen").clone();

$(document).ready(function(){

  //<editor-fold>-------------------------------OTHER-------------------------------

  //go into select mode
  $(".show-selector-button").on('click', function(){
    showSelector();
  });

  //close listings view dropper on click anywhere else (here instead of inside editor bc dont want to .off() on document)
  $(document).on("click", function(event) {
    if (!$(event.target).closest("#view-listings-button").length) {
      $("#view-listings-button-drop").addClass('is-hidden');
    }
  });

  //array find for IE (for stats tab)
  if(Array.prototype.find == null){
    Array.prototype.find = function(callback, thisArg){
      for(var i = 0; i < this.length; i++){
        if(callback.call(thisArg || window, this[i], i, this))
        return this[i];
      }
      return undefined;
    };
  }

  //</editor-fold>

});

//<editor-fold>-------------------------------EDITOR FUNCTIONS-------------------------------

//return to domain selector
function showSelector(keep_message){
  removeURLParameter("tab");
  multiSelectButtons();
  leftMenuActive();
  if (!keep_message){
    clearNotification();
  }
  $("#domain-selector").removeClass('is-hidden');
  $("#domain-editor").addClass('is-hidden');
}

//show domain names for multiple selected
function updateEditorDomains(selected_domain_ids){
  $(".current-domain-list").remove();

  if (selected_domain_ids.length == 1){
    //update domain name and plural
    $(".current-domain-name, #example-domain-name").text(getSelectedDomains("domain_name")[0]);
    $(".edit-domain-plural").addClass('is-hidden');
  }
  else if (selected_domain_ids.length > 1){
    //update domain name and plural
    $(".current-domain-name").text(selected_domain_ids.length + " Domains");
    $(".edit-domain-plural").removeClass('is-hidden');

    var domain_names_substr = [];
    var selected_domain_names = getSelectedDomains("domain_name");

    //minimum 50 for tooltip
    if (selected_domain_names.length < 50){
      for (var x = 0 ; x < selected_domain_names.length ; x++){
        domain_names_substr.push((selected_domain_names[x].length > 20) ? selected_domain_names[x].substr(0, 12) + "..." + selected_domain_names[x].substr(selected_domain_names[x].length - 7, selected_domain_names[x].length): selected_domain_names[x]);
      }
      $(".title-wrapper").append('<span class="current-domain-list icon is-tooltip" data-balloon-length="medium" data-balloon-break data-balloon="' + domain_names_substr.join("&#10;") + '" data-balloon-pos="down"> <i class="fa fa-question-circle"></i> </span> ');
    }
  }
}

//</editor-fold>

//<editor-fold>-------------------------------UPDATE EDITOR EDITING-------------------------------

//update a row if it's verified but not yet purchased
function updateEditorEditing(selected_domain_ids){

  //update the domain names
  updateEditorDomains(selected_domain_ids);

  //editing view specific things
  $(".editor-title").text("Editing - ");
  $(".non-edit-elem").addClass('is-hidden');
  $(".edit-elem").removeClass('is-hidden');

  setupEditingButtons();

  //set current listing to common denom listing_info obj
  if (selected_domain_ids.length > 1){
    var listing_info = getCommonListingInfo(selected_domain_ids);
    current_listing = listing_info;

    //hide domain capitalization
    $("#domain-name-cap-missing").removeClass('is-hidden');
    $("#domain-name-input").addClass('is-hidden');

    //change preview name
    $("#example-domain-name").text("Editing" + selected_domain_ids.length + "DomainNames.com");

    //tooltip to view individual listings
    $("#view-listings-button").removeAttr("href").off().on('click', function(){
      $("#view-listings-button-drop").toggleClass('is-hidden');
    });

    //domain list drop
    $("#view-listings-button-drop").empty();
    var domain_names_list = getSelectedDomains("domain_name");
    for (var x = 0 ; x < domain_names_list.length ; x++){
      var listing_href = (user.stripe_subscription_id) ? "https://" + domain_names_list[x].toLowerCase() : "/listing/" + domain_names_list[x].toLowerCase();
      var clipped_domain_name = (domain_names_list[x].length > 25) ? domain_names_list[x].substr(0, 15) + "..." + domain_names_list[x].substr(domain_names_list[x].length - 7, domain_names_list[x].length - 1) : domain_names_list[x];
      $("#view-listings-button-drop").append("<a target='_blank' href='" + listing_href + "' class='is-underlined'>" + clipped_domain_name + "</a>");
    }
  }
  else {
    var listing_info = getDomainByID(selected_domain_ids[0]);
    current_listing = listing_info;

    //view listing button link
    $("#view-listings-button").off().attr("href", (user.stripe_subscription_id) ? "https://" + listing_info.domain_name.toLowerCase() : "/listing/" + listing_info.domain_name);

    //show domain capitalization
    $("#domain-name-cap-missing").addClass('is-hidden');
    $("#domain-name-input").removeClass('is-hidden');
  }

  updateStatus(current_listing);
  updateInfoTab(current_listing);
  updateDesignTab(current_listing);
  updateRentalTab(current_listing);
  updateBindings(current_listing);
}

function setupEditingButtons(){

  //to submit form changes
  $("#save-changes-button").off().on("click", function(e){
    submitListingChanges($(this));
  });

  //to cancel form changes
  $("#cancel-changes-button").off().on("click", function(e){
    cancelListingChanges();
  });

  //click to move to upgrade tab from design tab
  $("#other-tab-upgrade-button").off().on('click', function(e){
    $("#upgrade-tab").click();
  });

  //change tabs for editing
  $("#edit-toolbar .tab").off().on("click", function(e){
    var current_tab = $(".tab.is-active").attr("id").replace("-tab", "");
    var new_tab = $(this).attr("id").replace("-tab", "");

    if (current_tab != new_tab){
      //clear any existing messages
      clearNotification();

      //update tab URL
      updateQueryStringParam("tab", new_tab);

      //hide other tab selectors
      $(".tab.verified-elem").removeClass('is-active');
      $(this).addClass('is-active');

      //show specific tab
      $(".tab-drop").stop().fadeOut(300).addClass('is-hidden');
      $("#" + new_tab + "-tab-drop").stop().fadeIn(300).removeClass('is-hidden');
    }
  });

}

function updateStatus(listing_info){
  //status
  $("#status-toggle-button").data("status", (listing_info.status) ? listing_info.status : 0);

  //turned on, turn off?
  if (listing_info.status == 1){
    $("#status-toggle-button").addClass("is-primary").removeClass('is-danger');
    $("#status-icon").addClass("fa-toggle-on").removeClass('fa-toggle-off');
    $("#status-text").text("Active");
  }
  else {
    $("#status-toggle-button").addClass('is-danger').removeClass("is-primary");
    $("#status-icon").addClass('fa-toggle-off').removeClass("fa-toggle-on");
    $("#status-text").text("Inactive");
  }
}

//handle checkboxes
function checkBox(module_value, elem, child){
  module_value = (module_value) ? module_value : 0;
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

  //<editor-fold>-------------------------------INFORMATION TAB EDITS-------------------------------

  //update information tab for editing a listing
  function updateInfoTab(listing_info){
    //pricing
    $("#buy-price-input").val(listing_info.buy_price);
    $("#min-price-input").val(listing_info.min_price);

    //domain descriptions
    $("#description").val(listing_info.description);
    $("#description-hook").val(listing_info.description_hook);
    $("#description-footer").val(listing_info.description_footer);
    $("#domain-name-input").val(listing_info.domain_name).attr("placeholder", listing_info.domain_name);

    //categories
    //remove any existing categories
    $(".category-selector").removeClass('is-primary');
    var listing_categories = (listing_info.categories) ? listing_info.categories.split(" ") : [];
    for (var x = 0; x < listing_categories.length; x++){
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

  //</editor-fold>

  //<editor-fold>-------------------------------RENTAL EDITS-------------------------------

  function updateRentalTab(listing_info){
    checkBox(listing_info.rentable, $("#rentable-input"));

    //rental pricing
    $("#price-rate-input").val(listing_info.price_rate);
    $("#price-type-input").val(listing_info.price_type);

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
        if (!ui.duringInitialization){
          changedValue($("#paths-input"), listing_info);
        }
      },
      afterTagRemoved : function(event, ui){
        if (!ui.duringInitialization){
          changedValue($("#paths-input"), listing_info);
        }
      }
    });

    //add custom class so we can gray it out if not rentable
    $(".tagit.textarea").addClass('rentable-input');
    updateRentalInputsDisabled(listing_info.rentable);
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

  function updateDesignTab(listing_info){
    //revert preview stuff
    $(".preview-elem").removeAttr('style');

    populateThemeDropdown();
    updatePremiumNotification();
    updateColorScheme(listing_info);
    updateFontStyling(listing_info);
    updateBackground(listing_info);
    updateLogo(listing_info);
    updateModules(listing_info);
    updatePriceInputs(listing_info);
  }

  //switch theme
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
        $("#design-tab-drop").prepend(premium_blackscreen);
      }
    }
  }
  function updatePriceInputs(listing_info){
    //update preview on design page
    if (listing_info.buy_price > 0){
      $("#example-buy-price-tag").removeClass('is-hidden').text("For sale - " + moneyFormat.to(parseFloat(listing_info.buy_price)));
    }
    else {
      $("#example-buy-price-tag").addClass('is-hidden');
    }
    if (listing_info.rentable && listing_info.price_rate > 0){
      $("#example-rent-price-tag").removeClass('is-hidden').text("For rent - " + moneyFormat.to(parseFloat(listing_info.price_rate)) + " / " + listing_info.price_type);
    }
    else {
      $("#example-rent-price-tag").addClass('is-hidden');
    }
  }
  function updateColorScheme(listing_info){
    var minicolor_options = {
      letterCase: "uppercase",
      swatches: ["#3CBC8D", "#FF5722", "#2196F3"]
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
    //remove any input values on upload forms
    $("#background-image-input").val("");
    $("#background-link-refresh").removeClass('is-primary').addClass('is-disabled');

    //background color
    var minicolor_options = {
      letterCase: "uppercase",
      swatches: ["#FFFFFF", "#E5E5E5", "#B2B2B2", "#7F7F7F", "#666666", "#222222", "#000000"]
    }

    var background_image = (listing_info.background_image == null || listing_info.background_image == undefined || listing_info.background_image == "") ? "https://placeholdit.imgix.net/~text?txtsize=20&txt=NO%20IMG&w=96&h=64" : listing_info.background_image;
    $("#background-link-input").val(listing_info.background_image);

    //background image of preview
    if (listing_info.background_image != null && listing_info.background_image != undefined && listing_info.background_image != ""){
      $("#example-wrapper").css({'background-image' : "url(" + background_image + ")"});
    }
    else {
      $("#example-wrapper").css('background-image', "");
    }

    $("#background-color-input").val(listing_info.background_color).minicolors("destroy").minicolors(minicolor_options);
    $("#example-wrapper").css({"background-color" : listing_info.background_color});
  }
  function updateLogo(listing_info){
    //remove any input values on upload forms
    $("#logo-image-input").val("");
    $("#logo-link-refresh").removeClass('is-primary').addClass('is-disabled');

    //logo depending on premium user or not
    if (user.stripe_subscription_id){
      var logo = (listing_info.logo == null || listing_info.logo == undefined || listing_info.logo == "") ? "https://placeholdit.imgix.net/~text?txtsize=20&txt=NO%20LOGO&w=200&h=125" : listing_info.logo;
    }
    else {
      var logo = (listing_info.logo == null || listing_info.logo == undefined || listing_info.logo == "") ? "/images/dh-assets/flat-logo/dh-flat-logo-primary.png" : listing_info.logo;
    }

    $("#logo-link-input").val(listing_info.logo);
    $("#example-logo").attr('src', logo);
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
    checkBox(listing_info.traffic_module, $("#traffic-module-input"), true);
    checkBox(listing_info.traffic_graph, $("#traffic-graph-input"));
    checkBox(listing_info.alexa_stats, $("#alexa-stats-input"));

    checkBox(listing_info.history_module, $("#history-module-input"));

    //alexa link
    if (listing_info){
      $("#alexa_link").attr("href", "https://www.alexa.com/siteinfo/" + listing_info.domain_name);
    }
    else {
      $("#alexa_link").attr("href", "https://www.alexa.com");
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
    $("#status-toggle-button").off().on("click", function(e){
      submitListingChanges($(this), true);
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

  }

  //</editor-fold>

  //<editor-fold>-------------------------------SUBMIT LISTING UPDATES-------------------------------

  //helper function to bind to inputs to listen for any changes from existing listing info
  function changedValue(input_elem, listing_info){
    var name_of_attr = input_elem.data("name");

    if (listing_info){
      if (name_of_attr == "background_image_link"){
        var listing_info_comparison = listing_info["background_image"];
      }
      else if (name_of_attr == "logo_image_link"){
        var listing_info_comparison = listing_info["logo"];
      }
      else {
        var listing_info_comparison = listing_info[name_of_attr];
      }
    }

    //clear any existing messages
    clearNotification();

    //only change if the value changed from existing (and if premium elem, has premium)
    if (input_elem.val() != listing_info_comparison &&
      ((input_elem.hasClass('premium-input') && user.stripe_subscription_id) ||
      (!input_elem.hasClass('premium-input')))
    ){
      $("#save-changes-button").removeClass("is-hidden");
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
    //hide the cancel / save
    else {
      //reset premium only inputs!
      if (input_elem.hasClass('premium-input')){
        input_elem.blur();
        errorMessage("You must <a class='is-underlined' href='/profile/settings#premium'>upgrade to a Premium Account</a> to be able to edit that!");
        cancelListingChanges(true);
      }
      else {
        refreshSubmitButtons();
      }
    }
  }

  //visually reset submit/cancel buttons
  function refreshSubmitButtons(){
    $("#cancel-changes-button").addClass("is-hidden");
    $("#save-changes-button").addClass('is-hidden');
  }

  //cancel the listing submit
  function cancelListingChanges(keep_message){
    refreshSubmitButtons();

    //revert all inputs
    updateEditorEditing(getSelectedDomains("id", true, true));

    if (!keep_message){
      clearNotification();
    }
  }

  //submit status change
  function submitListingChanges(submit_button, status_only){
    //clear any existing messages
    clearNotification();
    submit_button.addClass('is-loading');

    //append data for editing
    var formData = new FormData();
    var selected_ids = getSelectedDomains("id", true, true);
    formData.append("selected_ids", selected_ids);
    if (status_only){
      var new_status = ($("#status-toggle-button").data("status") == "1") ? 0 : 1;
      formData.append("status", new_status);
    }
    else {
      $(".changeable-input, #paths-input").each(function(e){
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
        if (input_val != listing_comparison && input_val != null && input_val != undefined){
          if ((input_name == "logo_image_link" || input_name == "background_image_link") && input_val == "" && listing_comparison == undefined){
          }
          else {
            formData.append(input_name, input_val);
          }
        }
      });
    }

    // // Display the key/value pairs
    // for (var pair of formData.entries()) {
    //   console.log(pair[0]+ ', ' + pair[1]);
    // }

    $.ajax({
      url: (selected_ids.length == 1) ? "/listing/" + getDomainByID(selected_ids[0]).domain_name.toLowerCase() + "/update" : "/listings/multiupdate",
      type: "POST",
      data: formData,
      // Options to tell jQuery not to process data or worry about the content-type
      cache: false,
      contentType: false,
      processData: false
    }, 'json').done(function(data){
      submit_button.removeClass('is-loading');
      refreshSubmitButtons();
      if (data.state == "success"){
        //status only success message
        if (status_only){
          var plural_success_msg = (selected_ids.length == 1) ? "This listing has" : selected_ids.length + " listings have";
          var active_inactive_text = (new_status == 0) ? "inactive!" : "active!";
          successMessage(plural_success_msg + " been set to " + active_inactive_text);
        }
        //editing success message
        else {
          var plural_success_msg = (selected_ids.length == 1) ? "this listing" : selected_ids.length + " listings";
          successMessage("Successfully changed settings for " + plural_success_msg + "!");
        }
        listings = data.listings;
        updateEditorEditing(selected_ids);
        createRows();
      }
      else {
        if (data.listings){
          listings = data.listings;
        }

        //not premium but tried to update premium stuff
        if (data.message == "not-premium"){
          updateEditorEditing(selected_ids);
          var error_msg = "You must <a class='is-underlined' href='/profile/settings#premium'>upgrade to a Premium Account</a> to be able to edit that!";
        }
        else {
          //listing is no longer pointed to domahub, revert to verify tab
          if (data.message == "verification-error"){
            var plural_error_msg = (selected_ids.length == 1) ? "This listing is" : "Some of the selected listings are";
            var error_msg = plural_error_msg + " no longer pointing to DomaHub! Please verify that you are the owner by confirming your DNS settings.";
          }
          else if (data.message == "ownership-error"){
            var plural_error_msg = (selected_ids.length == 1) ? "this listing" : "some of the listings";
            var error_msg = "You do not own " + plural_error_msg + " that you are trying to edit! Please select something else to edit.";
          }
          else if (data.message == "accepted-error"){
            var plural_error_msg = (selected_ids.length == 1) ? "this listing" : "some of the selected listings";
            var error_msg = "You have already accepted an offer for " + plural_error_msg + "! Please select something else to edit.";
          }
          else if (data.message == "deposited-error" || data.message == "transferred-error"){
            var plural_error_msg = (selected_ids.length == 1) ? "this listing" : "some of the selected listings";
            var error_msg = "You have already sold " + plural_error_msg + "! Please select something else to edit.";
          }
          else {
            var error_msg = data.message;
          }

          createRows(false);
          showSelector(true);
        }

        errorMessage(error_msg);
      }
    });
  }

  //</editor-fold>

//</editor-fold>

//<editor-fold>-------------------------------UPDATE EDITOR OFFERS-------------------------------

//update a row if it's verified but not yet purchased
function updateEditorOffers(selected_domain_ids){
  updateEditorDomains(selected_domain_ids);
  $(".non-offer-elem").addClass('is-hidden');
  $(".offer-elem").removeClass('is-hidden');

  //change domain name header
  if (selected_domain_ids.length == 0){
    $(".editor-title").text("My Listing Offers");
  }
  else {
    $(".editor-title").text("Viewing Offers - ");
  }

  //select verified rows here so we can keep the heading as "My Offers"
  if (selected_domain_ids.length == 0){
    selectSpecificRows("verified", 1);
    selected_domain_ids = getSelectedDomains("id", true);
  }
  setupOfferButtons(selected_domain_ids);
  createOffersTable(selected_domain_ids);
}

//set up offer buttons
function setupOfferButtons(selected_domain_ids){

  //no verified listings to select!
  if (selected_domain_ids.length == 0){
    $(".offer-button").addClass('is-hidden');
  }
  else {
    $(".offer-button").removeClass('is-hidden');

    //reset sort
    $(".offer-header-sort").data("sort_direction", false).find(".icon").removeClass('is-primary')
    $(".offer-header-sort").find(".fa").removeClass("fa-sort-desc fa-sort-asc").addClass("fa-sort");

    //sort by header
    $(".offer-header-sort").off().on("click", function(){
      var sort_value = $(this).data("value");
      var sort_direction = ($(this).data("sort_direction")) ? true : false;

      //sort icon
      $(".offer-header-sort").find(".icon").removeClass('is-primary')
      $(".offer-header-sort").find(".fa").removeClass("fa-sort-desc fa-sort-asc").addClass("fa-sort");
      $(this).find(".icon").addClass('is-primary');
      $(this).data("sort_direction", !sort_direction);
      if (sort_direction){
        $(this).find(".fa").removeClass("fa-sort-desc").addClass("fa-sort-asc");
      }
      else {
        $(this).find(".fa").addClass("fa-sort-desc").removeClass("fa-sort-asc");
      }

      //sort the rows
      $(".offer-row:not(#offer-clone)").sort(function(a,b){
        if (sort_value == "domain_name" || sort_value == "name"){
          var a_sort = $(a).data("offer")[sort_value].toLowerCase();
          var b_sort = $(b).data("offer")[sort_value].toLowerCase();
        }
        else {
          var a_sort = $(a).data("offer")[sort_value];
          var b_sort = $(b).data("offer")[sort_value];
        }

        if (sort_direction){
          return (a_sort > b_sort) ? 1 : (a_sort < b_sort) ? -1 : 0;
        }
        else {
          return (a_sort > b_sort) ? -1 : (a_sort < b_sort) ? 1 : 0;
        }
      }).appendTo("#offers-wrapper");

    });

    //search offers input
    $("#offer-search").off().on('input', function(){
      refreshOfferRows($(this).val(), $("#show-rejected-offers").hasClass('is-primary'));
    });

    //refresh offers button
    $("#refresh-offers-button").removeClass('is-hidden').off().on('click', function(){
      showLoadingOffers();
      createOffersTable(selected_domain_ids, true);
    });

    //rejected offers button
    $("#show-rejected-offers").removeClass('is-primary').off().on('click', function(){
      $(this).toggleClass('is-primary is-black').find(".fa").toggleClass('fa-toggle-on fa-toggle-off');
      refreshOfferRows($("#offer-search").val(), $("#show-rejected-offers").hasClass('is-primary'));
    }).find(".fa").removeClass('fa-toggle-on').addClass('fa-toggle-off');

  }

}

//show or hide offers based on toggle and search term
function refreshOfferRows(search_term, show_rejected){
  $(".offer-row:not(#offer-clone)").addClass('is-hidden').each(function(){
    if (search_term){
      //if offerer name or domain name is being searched for
      if ($(this).data("offer").name.toLowerCase().indexOf(search_term) != -1 || $(this).data("domain_name").toLowerCase().indexOf(search_term) != -1){
        if (!$(this).hasClass("rejected-offer") || ($(this).hasClass("rejected-offer") && show_rejected)){
          $(this).removeClass('is-hidden');
        }
      }
    }
    else {
      if (!$(this).hasClass("rejected-offer") || ($(this).hasClass("rejected-offer") && show_rejected)){
        $(this).removeClass('is-hidden');
      }
    }
  });

  //show no offers if there arent any offers (including rejected)
  if ($(".offer-row:not(#offer-clone, .is-hidden)").length == 0){
    $("#no-offers-table").removeClass('is-hidden');
    $("#offers-table").addClass('is-hidden');
  }
  else {
    $("#no-offers-table").addClass('is-hidden');
    $("#offers-table").removeClass('is-hidden');
  }
}

//show loading offers row
function showLoadingOffers(){
  $("#loading-offers-table").removeClass('is-hidden');
  $(".hidden-while-loading-offers, .whats-next-offer").addClass('is-hidden');
}

//create offer rows
function createOffersTable(selected_domain_ids, force){
  var selected_listings = [];

  //no selected listings to get offers (no verified or no listings)
  if (selected_domain_ids.length == 0){
    $("#no-verified-listings-table").removeClass('is-hidden');

    //no verified listings
    if (listings.length > 0){
      $(".offer-table-no-verified").removeClass('is-hidden');
    }
    //no listings
    else {
      $(".offer-table-no-listings").removeClass('is-hidden');
      $(".offer-table-no-verified").addClass('is-hidden');
    }
  }
  else {
    showLoadingOffers();
    $("#offers-wrapper").find(".offer-row:not(#offer-clone)").remove();
    completed_domains = 0;

    for (var x = 0; x < selected_domain_ids.length; x++){
      var listing_info = getDomainByID(selected_domain_ids[x]);

      //if we havent gotten offers yet
      if (listing_info.offers == undefined || force){
        selected_listings.push({
          domain_name : listing_info.domain_name,
          id : listing_info.id,
        });
      }
      else {
        updateOffersTable(listing_info, selected_domain_ids.length);
      }
    }
  }

  //if any offers to get
  if (selected_listings.length > 0){
    getListingOffers(selected_listings, selected_domain_ids);
  }
}

//get offers on a domain
function getListingOffers(selected_listings, selected_domain_ids){
  $.ajax({
    url: "/profile/mylistings/offers",
    method: "POST",
    data: {
      selected_listings : selected_listings
    }
  }).done(function(data){
    if (data.state == "success"){
      listings = data.listings;

      //make offer rows for domains we didnt yet
      for (var x = 0 ; x < selected_listings.length ; x++){
        for (var y = 0 ; y < listings.length ; y++){
          if (listings[y].id == selected_listings[x].id){
            selected_listings[x].offers = listings[y].offers;
            updateOffersTable(selected_listings[x], selected_domain_ids.length);
            break;
          }
        }
      }
    }
    else {
      errorMessage(data.message);
    }
  });
}

//update the offers table
function updateOffersTable(listing_info, total_domains){
  if (listing_info.offers){
    //clone offers
    for (var x = 0; x < listing_info.offers.length; x++){
      var cloned_offer_row = $("#offer-clone").clone();
      cloned_offer_row.removeAttr("id");
      cloned_offer_row.find(".td-offer-domain").text(listing_info.domain_name);
      cloned_offer_row.find(".td-offer-name").text(listing_info.offers[x].name);
      cloned_offer_row.find(".td-offer-timestamp").text(moment(listing_info.offers[x].timestamp).format("MMMM DD, YYYY")).attr("title", moment(listing_info.offers[x].timestamp).format("MMMM DD, YYYY - hh:mm:A"));
      cloned_offer_row.find(".td-offer-offer").text(moneyFormat.to(parseFloat(listing_info.offers[x].offer)));
      cloned_offer_row.attr("id", "offer-row-" + listing_info.offers[x].id);
      cloned_offer_row.data("domain_name", listing_info.domain_name).data("offer", listing_info.offers[x]);

      //set listing info
      if (listing_info.offers[x].deposited == 1){
        listing_info.deposited = 1;
      }
      if (listing_info.offers[x].accepted == 1){
        listing_info.accepted = 1;
      }
      if (listing_info.offers[x].transferred == 1){
        listing_info.transferred = 1;
      }

      //accepted an offer!
      if (listing_info.offers[x].deposited == 1 && listing_info.offers[x].transferred != -1){
        listing_info.accepted = 1;
        cloned_offer_row.find(".td-offer-status").text('Sold (Not Transferred)').addClass('is-primary');
      }
      else if (listing_info.offers[x].deposited == 1 && listing_info.offers[x].transferred == 1){
        listing_info.deposited = 1;
        cloned_offer_row.find(".td-offer-status").text('Sold (Transferred)').addClass('is-primary');
      }
      else if (listing_info.offers[x].accepted == 1){
        cloned_offer_row.find(".td-offer-status").text('Accepted').addClass('is-primary');
      }
      else if (listing_info.offers[x].accepted == 0){
        cloned_offer_row.find(".td-offer-status").text('Rejected').addClass('is-danger');
        cloned_offer_row.addClass('rejected-offer unaccepted-offer');
      }
      else {
        cloned_offer_row.find(".td-offer-status").text('Unanswered');
        cloned_offer_row.addClass('unaccepted-offer');
      }

      //click to open modal
      cloned_offer_row.off().on("click", function(){
        editOfferModal($(this).data("offer"), listing_info);
      });

      $("#offers-wrapper").prepend(cloned_offer_row);
    }

    completed_domains++;
  }

  //all offers gotten
  if (completed_domains == total_domains){
    finishedOfferTable(total_domains, listing_info);
  }
}

//finish creating offers table
function finishedOfferTable(total_domains, listing_info){
  $("#loading-offers-table").addClass('is-hidden');
  $(".hidden-while-loading-offers").removeClass('is-hidden');
  $("#offer-response-wrapper").removeClass('remove-margin-bottom-content');
  refreshOfferRows($("#offer-search").val(), $("#show-rejected-offers").hasClass('is-primary'));
  if (total_domains == 1){
    var real_listing_info_obj = getListingInfo(listing_info.id);
    if (real_listing_info_obj.accepted || real_listing_info_obj.deposited || real_listing_info_obj.transferred){
      whatsNextOfferView(real_listing_info_obj, true);
    }
  }
}

//edit modal with specific offer info
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

  //whats next button
  $("#offer-modal-whats-next").addClass('is-hidden');

  //this offer was accepted or rejected! hide the buttons
  if (offer.accepted == 1 || offer.accepted == 0){
    $("#offer-modal-button-wrapper").removeClass("remove-margin-bottom-content").addClass('is-hidden');
    $("#offer-response-label").removeClass('is-hidden');
    $("#offer-response").val((offer.response) ? offer.response : "You did not include a response.").addClass('is-disabled');
    var accept_or_reject_text = (offer.accepted == 1) ? "Accepted" : "Rejected";
    $("#offer-modal-domain").text(accept_or_reject_text + " offer for " + listing_info.domain_name);

    //accepted and toolbar visible (not already displaying whats next)
    if (offer.accepted && !$("#offers-toolbar").hasClass('is-hidden')){
      $("#offer-modal-whats-next").removeClass('is-hidden').off().on("click", function(){
        whatsNextOfferView(listing_info);
      });
    }
  }
  //not yet accepted
  else {
    $("#offer-modal-button-wrapper").addClass("remove-margin-bottom-content").removeClass('is-hidden');
    $("#offer-modal-domain").text("Offer for " + listing_info.domain_name);
    $("#offer-response-label").addClass('is-hidden');
    $("#offer-response").val("").removeClass('is-disabled');
    $("#accept_button").off().on("click", function(){
      acceptOrRejectOffer(true, $(this), listing_info, offer);
    });
    $("#reject_button").off().on("click", function(){
      acceptOrRejectOffer(false, $(this), listing_info, offer);
    });
  }
}

//resend the accepted offer email to offerer
function resendAcceptEmail(resend_button, listing_info, offer_id, deposit){
  if (offer_id){
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
}

//submit ajax for accept or reject
function acceptOrRejectOffer(accept, button_elem, listing_info, offer){
  button_elem.addClass('is-loading');
  var accept_url = (accept) ? "/accept" : "/reject";
  var response_to_offerer = $("#offer-response").val();
  $.ajax({
    url: "/listing/" + listing_info.domain_name.toLowerCase() + "/contact/" + offer.id + accept_url,
    method: "POST",
    data: {
      response: response_to_offerer
    }
  }).done(function(data){
    $("#offer-modal").removeClass('is-active');
    button_elem.removeClass('is-loading');
    if (data.state == "success"){
      offerSuccessHandler(accept, listing_info, offer, response_to_offerer);
    }
    else {
      //show accepted view if already accepted
      if (data.message == "already-accepted"){
        errorMessage("You have already accepted an offer for this listing!");
      }
      else {
        errorMessage(data.message);
      }
    }
  });
}

///get a specific offer by ID
function getOffer(offers, offer_id){
  for (var x = 0; x < offers.length; x++){
    if (offers[x].id == offer_id){
      return offers[x];
    }
  }
}

//function for offer accept success
function offerSuccessHandler(accept, listing_info, offer, response_to_offerer){
  successMessage("Successfully " + ((accept) ? "accepted" :  "rejected") + " the offer!");

  //set the real listing info accepted and offer response
  var real_listing_info_obj = getListingInfo(listing_info.id);
  offer.response = response_to_offerer;
  offer.accepted = accept;
  real_listing_info_obj.offers = listing_info.offers;
  real_listing_info_obj.accepted = accept;

  //accepted offer
  if (accept){
    //change class on the offer row
    $("#offer-row-" + offer.id).removeClass('unaccepted-offer').find(".td-offer-status").text('Accepted').addClass('is-primary');
    whatsNextOfferView(listing_info);
  }
  //rejected offer
  else {
    //change class on the offer row
    $("#offer-row-" + offer.id).addClass("is-hidden rejected-offer").find(".td-offer-status").text('Rejected').addClass('is-danger');
  }

  //refresh offers
  refreshOfferRows($("#offer-search").val(), $("#show-rejected-offers").hasClass('is-primary'));
}

//accepted the offer, unhide the accepted help text
function whatsNextOfferView(listing_info, dont_reselect){
  $("#offer-modal").removeClass('is-active');

  //recreate rows and only select this listing if necessary
  if (!dont_reselect){
    createRows([listing_info.id]);
    viewDomainOffers();
  }

  $("#offers-toolbar, .whats-next-offer").addClass('is-hidden');
  var deposit_offer = false;
  var offer = false;
  for (var x = 0 ; x < listing_info.offers.length ; x++){
    if (listing_info.offers[x].accepted == 1){
      offer = listing_info.offers[x];
      break;
    }
  }

  //hide margin on modal
  $("#offer-response-wrapper").addClass('remove-margin-bottom-content');

  //show appropriate next steps
  if (listing_info.deposited){
    $("#deposited-offer").removeClass('is-hidden');
    deposit_offer = true;
    $("#deposited-deadline").text(moment(offer.deadline).format("MMMM DD, YYYY"));
  }
  else if (listing_info.accepted){
    $("#accepted-offer").removeClass('is-hidden');
  }

  //resend payment email
  $(".resend-offer-email-button").off().on("click", function(){
    resendAcceptEmail($(this), listing_info, offer.id, deposit_offer);
  });

  //hide all rejected rows
  $("#offers-table .offer-row.rejected-offer").addClass('is-hidden');
}

//</editor-fold>

//<editor-fold>-------------------------------UDPATE EDITOR STATS-------------------------------

//view editor stats mode
function updateEditorStats(selected_domain_ids){
  updateEditorDomains(selected_domain_ids);

  //change domain name header
  if (selected_domain_ids.length == 0){
    $(".editor-title").text("My Listing Stats");
  }
  else {
    $(".editor-title").text("Viewing Stats - ");
  }
}

//get stats on a domain
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
          updateStats(current_listing, true);
        })(current_listing);
      }
    }
    else if (data.state != "success"){
      errorMessage(data.message);
    }
  });
}

//show loading stats
function showLoadingStats(show){
  $("#no-stats").addClass('is-hidden');
  $("#loading-stats").removeClass('is-hidden');
  $(".stats-loading").addClass('is-hidden');
}

//update the stats tab
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

//format the stats to the required format
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

//create a chart
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

//initiate chart only if uninitiated
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

//<editor-fold>-------------------------------UPDATE EDITOR UNVERIFIED-------------------------------

//initiate edit mode for unverified
function updateEditorUnverified(selected_domain_ids){

  updateEditorDomains(selected_domain_ids);
  $(".non-verify-elem").addClass('is-hidden');
  $(".verify-elem").removeClass('is-hidden');

  //select unverified rows only so we can keep the heading as "Verification"
  if (selected_domain_ids.length == 0){
    selectSpecificRows("verified", false);
    selected_domain_ids = getSelectedDomains("id", false);
  }

  setupVerificationButtons(selected_domain_ids);

  //change domain name header
  $(".editor-title").text("Verifying - ");
  if (selected_domain_ids.length > 1){
    $(".current-domain-name").text(selected_domain_ids.length + " Domains");
    $(".verification-plural").text("s");
    $(".verification-domains-plural").text("these domains");
    $("#prev-dns-table-button, #next-dns-table-button").removeClass('is-hidden');
  }
  else {
    var verifying_domain = getDomainByID(selected_domain_ids[0]);
    $(".current-domain-name").text(verifying_domain.domain_name);
    $(".verification-plural").text("");
    $(".verification-domains-plural").text("this domain");
    $("#prev-dns-table-button, #next-dns-table-button").addClass('is-hidden');
  }

  //create all tables for each unverified listing
  createDNSRecordRows(selected_domain_ids);
}

//set up verification buttons
function setupVerificationButtons(selected_domain_ids){

  $("#prev-dns-table-button, #next-dns-table-button").off().on("click", function(){
    var upcoming_index = $(".cloned-dns-table:not(.is-hidden)").data("index") + $(this).data("value");
    upcoming_index = (upcoming_index < 0) ? $(".cloned-dns-table").length - 1 : upcoming_index;
    upcoming_index = (upcoming_index > $(".cloned-dns-table").length - 1) ? 0 : upcoming_index;
    $(".cloned-dns-table:not(.is-hidden)").addClass('is-hidden').stop().fadeOut(300, function(){
      $(".cloned-dns-table").eq(upcoming_index).stop().fadeIn(300).removeClass('is-hidden');
    });
  });

  //refresh the DNS table button
  $("#refresh-dns-button").off().on("click", function(){
    createDNSRecordRows(selected_domain_ids, true);
  });

  //verify the domains!
  $("#verify-button").off().on('click', function(){
    multiVerify($(this));
  });
}

//create DNS rows
function createDNSRecordRows(selected_domain_ids, force){
  //show loading
  $("#loading-dns-table").removeClass('is-hidden');
  $("#verify-toolbar").addClass("is-hidden");
  $("#verification-left").addClass('is-hidden');
  $("#required-assistance").addClass("remove-margin-bottom-content");

  //loop through and create all tables for each unverified listing
  $(".cloned-dns-table").remove();
  var selected_listings = [];
  for (var x = 0; x < selected_domain_ids.length; x++){
    var listing_info = getDomainByID(selected_domain_ids[x]);

    //get who is an A record data if we haven't yet (or being refreshed)
    if (listing_info.a_records == undefined || listing_info.whois == undefined || force){
      selected_listings.push({
        domain_name : listing_info.domain_name,
        id : selected_domain_ids[x],
        client_index : x
      });
    }
    else {
      createDNSTable(listing_info, selected_domain_ids.length, x);
    }
  }

  //if we need to get any DNS records, get them in one call
  if (selected_listings.length > 0){
    getDNSRecords(selected_listings, selected_domain_ids);
  }
}

//get DNS settings at once for all selected domains (and unknown DNS)
function getDNSRecords(selected_listings, selected_domain_ids){
  $.ajax({
    url: "/profile/mylistings/dnsrecords",
    method: "POST",
    data: {
      selected_listings : selected_listings
    }
  }).done(function(data){
    if (data.state == "success"){
      listings = data.listings;

      //make tables for domains we didnt yet
      for (var x = 0 ; x < selected_listings.length ; x++){
        for (var y = 0 ; y < listings.length ; y++){
          if (listings[y].id == selected_listings[x].id){
            selected_listings[x].a_records = listings[y].a_records;
            selected_listings[x].whois = listings[y].whois;
            createDNSTable(selected_listings[x], selected_domain_ids.length, selected_listings[x].client_index);
            break;
          }
        }
      }
    }
    else {
      errorMessage(data.message);
    }
  });
}

//update the registrar URL if there is one
function createDNSTable(listing_info, total_unverified, row_index){
  var cloned_table = $("#current-dns-table-clone").clone().removeAttr('id').attr("id", "dns-table" + row_index).addClass("cloned-dns-table").data("index", row_index)
  var cloned_a_row = cloned_table.find(".doma-a-record");
  var cloned_www_row = cloned_table.find(".doma-www-record");

  var clipped_domain_name = (listing_info.domain_name.length > 25) ? listing_info.domain_name.substr(0, 15) + "..." + listing_info.domain_name.substr(listing_info.domain_name.length - 7, listing_info.domain_name.length - 1) : listing_info.domain_name;

  //table header text
  var table_header_text = "<span class='is-hidden-mobile'>Current DNS Settings for </span><span>" + clipped_domain_name + "</span>";
  if (total_unverified > 1){
    table_header_text = "<span class='is-hidden-mobile'>Domain " + (row_index + 1) + " / " + total_unverified + " - </span>" + table_header_text;
  }
  if (listing_info.whois){
    var reg_name = (listing_info.whois["Registrar"] && listing_info.whois["Registrar"].length > 25) ? listing_info.whois["Registrar"].substr(0, 25) + "..." : listing_info.whois["Registrar"];
    var reg_url = listing_info.whois["Registrar URL"];
    var regex_url = /^((http|https):\/\/)/;
    if (!regex_url.test(reg_url)) { reg_url = "http://" + reg_url; }
    if (reg_name && reg_url){
      table_header_text += " (<a target='_blank' class='is-underlined is-primary' href='" + reg_url + "'>" + reg_name + "</a>)";
    }
  }

  if (listing_info.a_records){
    //domahub IP exists!
    if (listing_info.a_records.indexOf("208.68.37.82") != -1){
      cloned_a_row.removeClass('needs-action-row');
      cloned_www_row.removeClass('needs-action-row');
      cloned_a_row.find(".existing_data").text("208.68.37.82");
      cloned_a_row.find(".next_step").removeClass('is-danger').addClass('is-primary').text("Done!");
      cloned_www_row.find(".existing_data").text("208.68.37.82");
      cloned_www_row.find(".next_step").removeClass('is-danger').addClass('is-primary').text("Done!");
    }
    else {
      createDomaRecords(cloned_a_row, cloned_www_row);
    }

    //must delete any existing records
    for (var x = 0; x < listing_info.a_records.length; x++){
      if (listing_info.a_records[x] != "208.68.37.82"){
        var cloned_existing_row = cloned_table.find(".existing-dns-row").clone().removeAttr('id').removeClass('existing-dns-row');
        cloned_existing_row.find(".existing_data").text(listing_info.a_records[x]);
        cloned_existing_row.find(".required_data").text("-");
        cloned_existing_row.find(".next_step").text("Delete this record.");
        cloned_table.append(cloned_existing_row);
      }
    }
  }
  //no records found! just assume they need domahub records
  else {
    createDomaRecords(cloned_a_row, cloned_www_row);
  }

  //incomplete
  if (cloned_table.find(".is-danger").length > 1){
    table_header_text = "<span class='is-incomplete dns-status'>Incomplete</span>" + table_header_text;
  }
  //complete
  else {
    table_header_text = "<span class='is-complete dns-status'>Completed</span>" + table_header_text;
  }

  cloned_table.find(".existing-dns-row").remove();
  cloned_table.find(".table-header").html(table_header_text);
  $("#current-dns-tables").append(cloned_table);

  //check if we can verify all listings
  checkDNSAllDone(total_unverified);
}

//do next steps if doma records arent found
function createDomaRecords(cloned_a_row, cloned_www_row){
  cloned_a_row.addClass('needs-action-row')
  cloned_www_row.addClass('needs-action-row')
  cloned_a_row.find(".existing_data").text("Not found!");
  cloned_a_row.find(".next_step").text("Create this record.");
  cloned_www_row.find(".existing_data").text("Not found!");
  cloned_www_row.find(".next_step").text("Create this record.");
}

//check if we can verify everything
function checkDNSAllDone(total_unverified){
  //remove loading from refresh, remove loading row, show all cloned rows
  if ($(".cloned-dns-table").length == total_unverified) {
    $("#verify-toolbar").removeClass('is-hidden');
    $("#loading-dns-table").addClass('is-hidden');

    //sort by selected index
    $(".cloned-dns-table").sort(function(a, b){
      return ($(a).data("index") < $(b).data("index")) ? -1 : ($(a).data("index") > $(b).data("index")) ? 1 : 0;
    }).appendTo("#current-dns-tables");

    if ($(".cloned-dns-table .is-danger").length){
      $(".cloned-dns-table .is-danger").closest(".cloned-dns-table").eq(0).removeClass('is-hidden');
    }
    else {
      $(".cloned-dns-table").eq(0).removeClass('is-hidden');
    }

    //all DNS settings are good
    $("#required-assistance").removeClass("remove-margin-bottom-content");
    if ($(".cloned-dns-table .needs-action-row").length == 0){
      $("#verify-button").removeClass('is-hidden');
      $("#refresh-dns-button").addClass('is-hidden');
      $("#verification-left").addClass('is-primary').removeClass('is-danger is-hidden').text("All DNS settings look good! Click the button below to verify your domains.");
    }
    else {
      $("#verify-button").addClass('is-hidden');
      $("#refresh-dns-button").removeClass('is-hidden');
      $("#verification-left").addClass('is-danger').removeClass('is-primary is-hidden').text("You have " + $(".cloned-dns-table .needs-action-row").length + " DNS settings left to modify.");
    }
  }
}

//multi-verify listings
function multiVerify(verify_button){
  verify_button.addClass('is-loading');
  var verify_ids = getSelectedDomains("id", false);

  $.ajax({
    url: "/profile/mylistings/verify",
    method: "POST",
    data: {
      ids: verify_ids
    }
  }).done(function(data){
    verify_button.removeClass('is-loading');

    //success!
    if (data.state == "success"){
      listings = data.listings;
      successMessage("Successfully verified " + verify_ids.length + " listings!");
      createRows();
      showSelector(true);
    }
    //unverified listings error
    else if (data.unverified_listings){
      errorMessage("Failed to verify listings! Did you make the necessary DNS changes? If you think something is wrong, <a class='is-underlined' href='/contact'>contact us</a> and let us know!");
      createDNSRecordRows(data.unverified_listings, true);
    }
    else {
      errorMessage(data.message);
    }
  });
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
        errorMessage(data.message);
      }
    });
  });
}

//</editor-fold>

//<editor-fold>-------------------------------HELPER FUNCTIONS--------------------------------

String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

//return white or black text based on luminance
function calculateLuminance(rgb) {
  if (rgb){
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

//helper function get a combined listing_info object with common values
function getCommonListingInfo(listing_ids){
  return listings.reduce(function(arr, item){
    if (listing_ids.indexOf(item.id) != -1){
      for (var x in item){
        if (x == "categories" && item[x]){
          arr[x] = arr[x].split(" ").filter(function(n){
            return item[x].split(" ").indexOf(n) != -1
          }).join(" ");
        }
        else if (item[x] != arr[x]){
          delete arr[x];
        }
      }
    }
    return arr;
  }, Object.assign({}, listings[0]));
}

//get the listing
function getListingInfo(id){
  for (var x = 0 ; x < listings.length ; x++){
    if (listings[x].id == id){
      return listings[x];
    }
  }
}

//</editor-fold>