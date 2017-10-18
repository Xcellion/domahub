var current_listing = {};
var referer_chart = false;
var traffic_chart = false;
var completed_domains = 0;

$(document).ready(function(){

  //<editor-fold>-------------------------------OTHER-------------------------------

  //close offer modal
  $(".modal-close, .modal-background, #delete-nevermind").on("click", function(){
    $(this).closest(".modal").removeClass('is-active');
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

  //<editor-fold>-------------------------------BUTTONS-------------------------------

  //go into select mode
  $("#show-selector-button").on('click', function(){
    showSelector();
  });

  //to submit form changes
  $("#save-changes-button").on("click", function(e){
    submitListingChanges($(this));
  });

  //to cancel form changes
  $("#cancel-changes-button").on("click", function(e){
    cancelListingChanges();
  });

  $("#verify-button").on('click', function(){
    multiVerify($(this));
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
      $(".tab-drop").stop().fadeOut(300).addClass('is-hidden');
      $("#tab-title").text($("#" + new_tab + "-tab-drop").data('title'));
      $("#" + new_tab + "-tab-drop").stop().fadeIn(300).removeClass('is-hidden');
    }
  });

  //</editor-fold>

});

//<editor-fold>-------------------------------EDITOR FUNCTIONS-------------------------------

//function to return to domain selector
function showSelector(){
  removeURLParameter("tab");
  multiSelectButtons();
  leftMenuActive();
  errorMessage(false);
  successMessage(false);
  $("#domain-selector").removeClass('is-hidden');
  $("#domain-editor").addClass('is-hidden');
}

//function to show editor domain names (for editing, offers, stats)
function updateEditorDomains(selected_domain_ids){
  //show verified stuff, hide unverified stuff
  $(".verified-elem").removeClass('is-hidden');
  $(".unverified-elem").addClass('is-hidden');

  //title domain list tooltip
  $("#current-domain-list").remove();
  $("#view-listings-button-drop").empty();

  //update buttons
  if (selected_domain_ids.length == 1){
    var listing_info = getDomainByID(selected_domain_ids[0]);
    current_listing = listing_info;

    //update domain name and plural
    $(".current-domain-name, #example-domain-name").text(listing_info.domain_name);
    $(".edit-domain-plural").addClass('is-hidden');

    //view listing button link
    $("#view-listings-button").off().attr("href", (user.stripe_subscription_id) ? "https://" + listing_info.domain_name.toLowerCase() : "/listing/" + listing_info.domain_name);

    //show domain capitalization
    $("#domain-name-cap-missing").addClass('is-hidden');
    $("#domain-name-input").removeClass('is-hidden');
  }
  else if (selected_domain_ids.length > 1){
    //update domain name and plural
    $(".current-domain-name").text(selected_domain_ids.length + " Domains");
    $(".edit-domain-plural").removeClass('is-hidden');
    $("#example-domain-name").text("Editing" + selected_domain_ids.length + "DomainNames.com");

    //domain list drop
    var domain_title_list = []
    for (var x = 0 ; x < selected_domain_ids.length ; x++){
      var temp_listing_info = getDomainByID(selected_domain_ids[x]);
      var listing_href = (user.stripe_subscription_id) ? "https://" + temp_listing_info.domain_name.toLowerCase() : "/listing/" + temp_listing_info.domain_name;
      $("#view-listings-button-drop").append("<li><a target='_blank' href='" + listing_href + "' class='is-primary is-underlined'>" + temp_listing_info.domain_name + "</a></li>");
      domain_title_list.push(temp_listing_info.domain_name);
    }

    $("#editor-title-wrapper").append(' \
      <span id="current-domain-list" class="icon is-tooltip" \
       data-balloon-length="medium" data-balloon-break data-balloon="' + domain_title_list.join("&#10;") + '" \
       data-balloon-pos="down"> <i class="fa fa-question-circle"></i> \
      </span> \
    ');

    //tooltip to view individual listings
    $("#view-listings-button").removeAttr("href").on('click', function(){
      $("#view-listings-button-drop").toggleClass('is-hidden');
    });

    //close listings view dropper on click anywhere else
    $(document).on("click", function(event) {
      if (!$(event.target).closest("#view-listings-button").length) {
        $("#view-listings-button-drop").addClass('is-hidden');
      }
    });

    //hide domain capitalization
    $("#domain-name-cap-missing").removeClass('is-hidden');
    $("#domain-name-input").addClass('is-hidden');
  }
  else {
    $("#view-listings-button-wrapper").addClass('is-hidden');
  }
}

//</editor-fold>

//<editor-fold>-------------------------------UPDATE EDITOR EDITING-------------------------------

//function to update a row if it's verified but not yet purchased
function updateEditorEditing(selected_domain_ids){

  //update the domain names
  updateEditorDomains(selected_domain_ids);

  //editing view specific things
  $("#editor-title").text("Editing - ");
  $("#refresh-offers-button").addClass('is-hidden');
  $("#refresh-stats-button").addClass('is-hidden');

  //set current listing to common denom listing_info obj
  if (selected_domain_ids.length > 1){
    var listing_info = getCommonListingInfo(selected_domain_ids);
    current_listing = listing_info;
  }

  updateStatus(current_listing);
  updateInfoTab(current_listing);
  updateDesignTab(current_listing);
  updateRentalTab(current_listing);
  updateBindings(current_listing);
}

function updateStatus(listing_info){
  //status
  $("#status-toggle-button").data("status", (listing_info.status) ? listing_info.status : 0);

  //turned on, turn off?
  if (listing_info.status == 1){
    $("#status-color").addClass("is-primary").removeClass('is-danger');
    $("#status-icon").addClass("fa-toggle-on").removeClass('fa-toggle-off');
    $("#status-text").text("Active").addClass("is-primary").removeClass('is-danger');
  }
  else {
    $("#status-color").addClass('is-danger').removeClass("is-primary");
    $("#status-icon").addClass('fa-toggle-off').removeClass("fa-toggle-on");
    $("#status-text").text("Inactive").addClass("is-danger").removeClass('is-primary');
  }
}

//function to handle checkboxes
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

  //function to update information tab for editing a listing
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
    $(".category-selector").removeClass('is-dark');
    var listing_categories = (listing_info.categories) ? listing_info.categories.split(" ") : [];
    for (var x = 0; x < listing_categories.length; x++){
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

  //</editor-fold>

  //<editor-fold>-------------------------------RENTAL TAB EDITS-------------------------------

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
      $(this).toggleClass('is-dark');
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
    errorMessage(false);
    successMessage(false);

    //only change if the value changed from existing
    if (input_elem.val() != listing_info_comparison){
      input_elem.data('changed', true);
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
    //hide the cancel, disable the save
    else {
      input_elem.data('changed', false);
      $("#save-changes-button").addClass("is-hidden");
      $("#cancel-changes-button").addClass("is-hidden");
    }
  }

  //function to visually reset submit/cancel buttons
  function refreshSubmitButtons(){
    $("#cancel-changes-button").addClass("is-hidden");
    $("#save-changes-button").addClass('is-hidden');
  }

  //function to cancel the listing submit
  function cancelListingChanges(){
    refreshSubmitButtons();

    //revert all inputs
    updateEditorEditing(getSelectedDomains("id", true));

    errorMessage(false);
    successMessage(false);
  }

  //function to submit status change
  function submitListingChanges(submit_button, status_only){
    //clear any existing messages
    errorMessage(false);
    successMessage(false);
    submit_button.addClass('is-loading');

    //append data for editing
    var formData = new FormData();
    var selected_ids = getSelectedDomains("id", true);
    formData.append("selected_ids", selected_ids);
    if (status_only){
      var new_status = ($("#status-toggle-button").data("status") == "1") ? 0 : 1;
      formData.append("status", new_status);
    }
    else {
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
        if (input_val != listing_comparison && input_val != null && input_val != undefined && listing_comparison != undefined){
          if ((input_name == "logo_image_link" || input_name == "background_image_link") && $(this).data("uploading")){
          }
          else {
            formData.append(input_name, input_val);
          }
        }
      });
    }

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
        //listing is no longer pointed to domahub, revert to verify tab
        if (data.message == "verification-error"){
          var plural_error_msg = (selected_ids.length == 1) ? "This listing has" : "Some of the selected listings have";
          var error_msg = plural_error_msg + " not been verified yet! Please verify that you own this domain by confirming your DNS settings.";
        }
        else if (data.message == "ownership-error"){
          var plural_error_msg = (selected_ids.length == 1) ? "this listing" : "some of the listings";
          var error_msg = "You do not own " + plural_error_msg + " that you are trying to edit! Please select something else to edit.";
        }
        else if (data.message == "accepted-error"){
          var plural_error_msg = (selected_ids.length == 1) ? "this listing" : "some of the selected listings";
          var error_msg = "You have already accepted an offer for " + plural_error_msg + "! Please select something else to edit.";
        }
        else if (data.message == "deposited-error"){
          var plural_error_msg = (selected_ids.length == 1) ? "this listing" : "some of the selected listings";
          var error_msg = "You have already sold " + plural_error_msg + "! Please select something else to edit.";
        }
        else {
          var error_msg = data.message;
        }

        if (data.listings){
          listings = data.listings;
        }

        errorMessage(error_msg);
        createRows(false);
        showSelector();
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
      $("#listing-msg-error-text").html("You must upgrade to a Premium Account to be able to edit that!");
      $("#error-upgrade-button").removeClass('is-hidden');
    }
    else if (message && message == "nothing-changed"){
      refreshSubmitButtons();
      $("#listing-msg-error").addClass('is-hidden').removeClass("is-active");
    }
    else if (message){
      $("#listing-msg-error").removeClass('is-hidden').addClass("is-active");
      $("#listing-msg-error-text").html(message);
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

//</editor-fold>

//<editor-fold>-------------------------------UPDATE EDITOR OFFERS-------------------------------

//function to update a row if it's verified but not yet purchased
function updateEditorOffers(selected_domain_ids){
  updateEditorDomains(selected_domain_ids);
  //change domain name header
  if (selected_domain_ids.length == 0){
    $("#editor-title").text("My Listing Offers");
  }
  else {
    $("#editor-title").text("Viewing Offers - ");
  }
  $("#status-toggle-button").addClass('is-hidden');
  $("#refresh-stats-button").addClass('is-hidden');

  if (selected_domain_ids.length == 0){
    selectSpecificRows("verified", 1);
    selected_domain_ids = getSelectedDomains("id");
  }

  //search offers input
  $("#offer-search").off().on('input', function(){
    var search_term = $(this).val();
    if (search_term){
      $(".offer-row:not(#offer-clone)").addClass('is-hidden').each(function(){
        //if offerer name or domain name is being searched for
        if ($(this).data("offer").name.toLowerCase().indexOf(search_term) != -1 || $(this).data("domain_name").toLowerCase().indexOf(search_term) != -1){
          if (!$(this).hasClass("rejected-offer") || ($(this).hasClass("rejected-offer") && !$("#show-rejected-offers").hasClass('is-primary'))){
            $(this).removeClass('is-hidden');
          }
        }
      });
    }
    else {
      //show rows (show rejected if button toggled)
      if (!$("#show-rejected-offers").hasClass('is-primary')){
        $(".offer-row:not(#offer-clone)").removeClass('is-hidden');
      }
      else {
        $(".offer-row.unaccepted-offer:not(#offer-clone)").removeClass('is-hidden');
      }
    }
  });

  //refresh offers button
  $("#refresh-offers-button").off().on('click', function(){
    $(this).addClass('is-loading');
    createOffersTable(selected_domain_ids, true);
  });

  //rejected offers button
  $("#show-rejected-offers").removeClass('is-primary').off().on('click', function(){
    $(".rejected-offer").toggleClass('is-hidden');
    $(this).toggleClass('is-primary is-black').find(".fa").toggleClass('fa-toggle-on fa-toggle-off');

    //hide no offers if there are any offers (including rejected)
    if ($(".offer-row:not(#offer-clone, .is-hidden)").length == 0){
      $("#no-offers").removeClass('is-hidden');
    }
    else {
      $("#no-offers").addClass('is-hidden');
    }
  }).find(".fa").removeClass('fa-toggle-on').addClass('fa-toggle-off');

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

  createOffersTable(selected_domain_ids);
}

//function to create offer rows
function createOffersTable(selected_domain_ids, force){
  //show loading offers
  $("#loading-offers").removeClass('is-hidden');
  $("#no-offers").addClass('is-hidden');
  $(".hidden-while-loading-offers").addClass('is-hidden');
  $("#offers-wrapper").find(".offer-row:not(#offer-clone)").remove();
  completed_domains = 0;

  for (var x = 0; x < selected_domain_ids.length; x++){
    var listing_info = getDomainByID(selected_domain_ids[x]);

    //if we havent gotten offers yet
    if (listing_info.offers == undefined || force){
      getDomainOffers(listing_info, selected_domain_ids.length);
    }
    else {
      updateOffersTable(listing_info, selected_domain_ids.length);
    }
  }
}

//function to get offers on a domain
function getDomainOffers(listing_info, total_domains){
  $.ajax({
    url: "/listing/" + listing_info.domain_name.toLowerCase() + "/getoffers",
    method: "POST"
  }).done(function(data){
    $("#refresh-offers-button").removeClass('is-loading');
    if (data.listing){
      listing_info = data.listing;
      updateOffersTable(listing_info, total_domains);
    }
    else if (data.state != "success") {
      errorMessage(data.message);
    }
  });
}

//function to update the offers table
function updateOffersTable(listing_info, total_domains){
  if (listing_info.offers){
    //clone offers
    for (var x = 0; x < listing_info.offers.length; x++){
      var cloned_offer_row = $("#offer-clone").clone();
      cloned_offer_row.removeAttr("id");
      cloned_offer_row.find(".td-offer-domain").text(listing_info.domain_name);
      cloned_offer_row.find(".td-offer-name").text(listing_info.offers[x].name);
      cloned_offer_row.find(".td-offer-timestamp").text(moment(listing_info.offers[x].timestamp).format("MMMM DD, YYYY - h:mmA"));
      cloned_offer_row.find(".td-offer-offer").text(moneyFormat.to(parseFloat(listing_info.offers[x].offer)));
      cloned_offer_row.attr("id", "offer-row-" + listing_info.offers[x].id);
      cloned_offer_row.data("domain_name", listing_info.domain_name).data("offer", listing_info.offers[x]);

      //click to open modal
      cloned_offer_row.off().on("click", function(){
        editOfferModal($(this).data("offer"), listing_info);
      });

      //accepted an offer!
      if (listing_info.offers[x].accepted == 1){
        cloned_offer_row.find(".td-offer-status").text('Accepted').addClass('is-success');
      }
      else if (listing_info.offers[x].accepted == 0){
        cloned_offer_row.find(".td-offer-status").text('Rejected').addClass('is-danger');
        cloned_offer_row.addClass('rejected-offer unaccepted-offer');
      }
      else {
        cloned_offer_row.find(".td-offer-status").text('Unanswered');
        cloned_offer_row.addClass('unaccepted-offer');
      }

      $("#offers-wrapper").prepend(cloned_offer_row);
    }

    completed_domains++;

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

  //all offers gotten
  if (completed_domains == total_domains){
    //hide loading offers
    $("#loading-offers").addClass('is-hidden');

    //no offers!
    if ($(".offer-row:not(#offer-clone)").length == 0){
      $("#no-offers").removeClass('is-hidden');
    }
    //offers exist
    else {
      //show rows (show rejected if button toggled)
      if (!$("#show-rejected-offers").hasClass('is-primary')){
        $(".offer-row:not(#offer-clone, .rejected-offer)").removeClass('is-hidden');
      }
      else {
        $(".offer-row.unaccepted-offer:not(#offer-clone)").removeClass('is-hidden');
      }

      //hide no offers if there are any offers (that arent rejected)
      if ($(".offer-row:not(.rejected-offer, #offer-clone)").length){
        $("#no-offers").addClass('is-hidden');
      }
      else {
        $("#no-offers").removeClass('is-hidden');
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

///get a specific offer by ID
function getOffer(offers, offer_id){
  for (var x = 0; x < offers.length; x++){
    if (offers[x].id == offer_id){
      return offers[x];
    }
  }
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

//<editor-fold>-------------------------------UDPATE EDITOR STATS-------------------------------

//function to view editor stats mode
function updateEditorStats(selected_domain_ids){
  updateEditorDomains(selected_domain_ids);
  //change domain name header
  if (selected_domain_ids.length == 0){
    $("#editor-title").text("My Listing Stats");
  }
  else {
    $("#editor-title").text("Viewing Stats - ");
  }
  $("#status-toggle-button").addClass('is-hidden');
  $("#refresh-offers-button").addClass('is-hidden');
  $("#refresh-stats-button").removeClass('is-hidden');
}

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

//<editor-fold>-------------------------------UPDATE EDITOR UNVERIFIED-------------------------------

//function to initiate edit mode for unverified
function updateEditorUnverified(selected_domain_ids){
  //hide purchased elems
  $(".purchased-elem").addClass('is-hidden');
  $(".unpurchased-elem").removeClass("is-hidden");

  //show specific elems, hide others
  $(".verified-elem").addClass('is-hidden');
  $(".unverified-elem").removeClass('is-hidden');

  //hide buttons for now
  $("#verify-button").addClass('is-hidden');
  $("#refresh-dns-button").addClass('is-hidden');

  //refresh the DNS table button
  $("#refresh-dns-button").off().on("click", function(){
    $(this).addClass('is-loading');
    createDNSRecordRows(selected_domain_ids, true);
  });

  //change domain name header
  $("#editor-title").text("Verifying - ");
  if (selected_domain_ids.length > 1){
    $(".current-domain-name").text(selected_domain_ids.length + " Domains");
    $(".verification-plural").text("s");
    $(".verification-domains-plural").text("these domains");
  }
  else {
    var verifying_domain = getDomainByID(selected_domain_ids[0]);
    $(".current-domain-name").text(verifying_domain.domain_name);
    $(".verification-plural").text("");
    $(".verification-domains-plural").text("this domain");
  }

  //create all tables for each unverified listing
  createDNSRecordRows(selected_domain_ids);
}

//function to create DNS rows
function createDNSRecordRows(selected_domain_ids, force){
  //show loading
  $("#loading-records-row").removeClass('is-hidden');

  //loop through and create all tables for each unverified listing
  $(".cloned-dns-row").remove();
  for (var x = 0; x < selected_domain_ids.length; x++){
    var listing_info = getDomainByID(selected_domain_ids[x]);

    //get who is an A record data if we haven't yet
    if (listing_info.a_records == undefined || listing_info.whois == undefined || force){
      getDNSRecordAndWhois(listing_info, selected_domain_ids.length);
    }
    else {
      updateDNSRecordAndWhois(listing_info, selected_domain_ids.length);
    }
  }
}

//function to get A Record and Whois info for unverified domain
function getDNSRecordAndWhois(listing_info, total_unverified){
  $.ajax({
    url: "/listing/" + listing_info.domain_name.toLowerCase() + "/unverifiedinfo",
    method: "POST"
  }).done(function(data){
    (function(listing_info){
      listing_info.a_records = data.listing.a_records;
      listing_info.whois = data.listing.whois;

      //update the unverified domain table
      updateDNSRecordAndWhois(listing_info, total_unverified, true);
    })(listing_info);
  });
}

//update the registrar URL if there is one
function updateDNSRecordAndWhois(listing_info, total_unverified, prepend){
  var cloned_a_row = $("#doma-a-record-clone").clone().removeAttr('id').addClass('cloned-dns-row');
  var cloned_www_row = $("#doma-www-record-clone").clone().removeAttr('id').addClass('cloned-dns-row');
  if (prepend){
    $("#dns_table-body").prepend(cloned_a_row, cloned_www_row);
  }
  else {
    $("#dns_table-body").append(cloned_a_row, cloned_www_row);
  }
  cloned_a_row.find(".verify_table_domain_name").text(listing_info.domain_name);

  //update registrar
  if (listing_info.whois){
    var reg_name = listing_info.whois["Registrar"];
    var reg_url = listing_info.whois["Registrar URL"];
    var regex_url = /^((http|https):\/\/)/;
    if (!regex_url.test(reg_url)) { reg_url = "http://" + reg_url; }
    if (reg_name && reg_url){
      cloned_a_row.find(".verify_table_registrar").html("<a target='_blank' class='is-underlined is-primary' href='" + reg_url + "'>" + reg_name + "</a>");
    }
  }

  if (listing_info.a_records){
    //domahub IP exists!
    if (listing_info.a_records.indexOf("208.68.37.82") != -1){
      cloned_a_row.removeClass('needs-action-row')
      cloned_www_row.removeClass('needs-action-row')
      cloned_a_row.find(".existing_data").text("208.68.37.82");
      cloned_a_row.find(".next_step").text("Done!");
      cloned_www_row.find(".existing_data").text("208.68.37.82");
      cloned_www_row.find(".next_step").text("Done!");
    }
    else {
      createDomaRecords(cloned_a_row, cloned_www_row);
    }

    var temp_row_span = 2;

    //delete any existing records
    for (var x = 0; x < listing_info.a_records.length; x++){
      if (listing_info.a_records[x] != "208.68.37.82"){
        var cloned_existing_row = $("#existing-dns-row").clone().removeAttr('id').addClass('cloned-dns-row needs-action-row');
        cloned_existing_row.find(".existing_data").text(listing_info.a_records[x]);
        cloned_existing_row.find(".required_data").text("-");
        cloned_existing_row.find(".next_step").text("Delete this record.");
        if (prepend){
          $("#dns_table-body").prepend(cloned_existing_row);
        }
        else {
          $("#dns_table-body").append(cloned_existing_row);
        }
        temp_row_span++;
      }
    }

    //rowspans
    cloned_a_row.find(".verify_table_domain_name").attr('rowspan', temp_row_span);
    cloned_a_row.find(".verify_table_registrar").attr('rowspan', temp_row_span);
  }

  //no records found! just assume they need domahub records
  else {
    createDomaRecords(cloned_a_row, cloned_www_row);
  }

  //check if we can verify all listings
  checkDNSAllDone(total_unverified);
}

//function to do next steps if doma records arent found
function createDomaRecords(cloned_a_row, cloned_www_row){
  cloned_a_row.addClass('needs-action-row')
  cloned_www_row.addClass('needs-action-row')
  cloned_a_row.find(".existing_data").text("Not found!");
  cloned_a_row.find(".next_step").text("Create this record.");
  cloned_www_row.find(".existing_data").text("Not found!");
  cloned_www_row.find(".next_step").text("Create this record.");
}

//function to check if we can verify everything
function checkDNSAllDone(total_unverified){
  if ($(".needs-action-row").length == 0){
    $("#verify-button").removeClass('is-hidden');
    $("#refresh-dns-button").addClass('is-hidden');
  }
  else {
    $("#refresh-dns-button").removeClass('is-hidden');
    $("#verify-button").addClass('is-hidden');
  }

  //remove loading from refresh, remove loading row, show all cloned rows
  if ($(".cloned-dns-row .verify_table_domain_name").length == total_unverified) {
    $("#loading-records-row").addClass('is-hidden');
    $("#refresh-dns-button").removeClass('is-loading');
    $(".cloned-dns-row").removeClass('is-hidden');
  }
}

//function to multi-verify listings
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
    //deselect all rows
    selectAllRows($("#select-all"), false);
    verify_button.removeClass('is-loading');

    //success!
    if (data.state == "success"){
      successMessage("Successfully verified " + verify_ids.length + " listings!");
      listings = data.listings;
      createRows();
      showSelector();
    }
    //unverified listings error
    else if (data.unverified_listings){
      errorMessage("Failed to verify listings! Did you make the necessary DNS changes? If you think something is wrong, <a class='is-underlined' href='/contact'>contact us</a> and let us know!");
      $("#refresh-dns-button").removeClass('is-hidden');
      createDNSRecordRows(unverified_listings, true);
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
        errorMessage("Failed to verify! Please check your DNS details and try again.");
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
        if (x == "categories"){
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

//</editor-fold>
