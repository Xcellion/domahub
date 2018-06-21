//<editor-fold>-------------------------------VARIABLES-------------------------------

var current_listing = {};
var referer_chart = false;
var traffic_chart = false;
var completed_domains_offers = 0;
var completed_domains_stats = 0;

//count for offers
var total_offers = 0;
var total_accepted = 0;
var total_rejected = 0;
var total_outstanding = 0;

//premium backdrops for promotion
var premium_blackscreen_design = $("#premium-blackscreen-design").clone();
var premium_blackscreen_hub = $("#premium-blackscreen-hub").clone();

//hash table for categories
var categories_hash = {};
for (var x = 0 ; x < categories.length ; x++){
  categories_hash[categories[x].back] = categories[x].front;
}

//</editor-fold>

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
  refreshSubmitButtons();
  removeURLParameter("tab");
  multiSelectButtons();
  leftMenuActive();
  if (!keep_message){
    clearNotification();
  }
  $("#domain-selector").removeClass('is-hidden');
  $("#domain-editor").addClass('is-hidden');
  updateMarqueeHandlers($(".td-domain"));

  $("#current-view-name").text("My Listings");
  $("#current-domain-name").text("");
}

//show domain names for multiple selected
function updateEditorDomains(selected_domain_ids){
  $(".current-domain-list").remove();

  if (selected_domain_ids.length == 1){
    //update domain name and plural
    var domain_name_selected = getSelectedDomains("domain_name")[0];
    domain_name_selected = punycode.toUnicode(domain_name_selected);
    $("#example-domain-name").text(domain_name_selected);
    $("#current-domain-name").html("&nbsp;- " + domain_name_selected);
    $(".edit-domain-plural").addClass('is-hidden');
  }
  else if (selected_domain_ids.length > 1){
    //update domain name and plural
    $("#current-domain-name").html("&nbsp;- " + selected_domain_ids.length + " Domains");
    $(".edit-domain-plural").removeClass('is-hidden');

    var domain_names_substr = [];
    var selected_domain_names = getSelectedDomains("domain_name");

    //minimum 50 for tooltip
    if (selected_domain_names.length < 50){
      for (var x = 0 ; x < selected_domain_names.length ; x++){
        var current_domain_name = punycode.toUnicode(selected_domain_names[x]);

        domain_names_substr.push((current_domain_name.length > 20) ? current_domain_name.substr(0, 12) + "..." + current_domain_name.substr(current_domain_name.length - 7, current_domain_name.length): current_domain_name);
      }
      $(".title-wrapper").append('<div class="current-domain-list icon is-small is-tooltip" data-balloon-length="medium" data-balloon-break data-balloon="' + domain_names_substr.join("&#10;") + '" data-balloon-pos="down"><i class="far fa-question-circle"></i></div>');
    }
  }
}

//</editor-fold>

//<editor-fold>-------------------------------UPDATE EDITOR EDITING-------------------------------

  //<editor-fold>-------------------------------SHOW TAB-------------------------------

  //update a row if it's verified but not yet purchased
  function updateEditorEditing(selected_domain_ids){

    //update the domain names
    updateEditorDomains(selected_domain_ids);

    //editing view specific things
    $("#current-view-name").html("Editing");
    $(".non-edit-elem").addClass('is-hidden');
    $(".edit-elem").removeClass('is-hidden');

    setupEditingButtons();

    //set current listing to common denom listing_info obj
    if (selected_domain_ids.length > 1){
      var listing_info = getCommonListingInfo(selected_domain_ids);
      current_listing = listing_info;

      //plural "this domain"
      $(".this-domain").text("these domains");

      //hide domain capitalization
      $("#domain-name-cap-missing").text('You cannot edit capitalization for multiple domains. Please select a single domain to edit.');
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

        //if demo
        if (!user.id){
          var listing_href = ((window.location.hostname.indexOf("domahub") != -1) ? "https://domahub.com/listing/" + domain_names_list[x].toLowerCase() : "http://localhost:8080/listing/" + domain_names_list[x].toLowerCase()) + "?compare=true&theme=Random";
        }
        //if production
        else if (window.location.hostname.indexOf("domahub") != -1){
          var listing_href = (user.stripe_subscription_id) ? "https://" + domain_names_list[x].toLowerCase() : "/listing/" + domain_names_list[x].toLowerCase();
        }
        //testing
        else {
          var listing_href = "http://localhost:8080/listing/" + domain_names_list[x].toLowerCase();
        }

        var clipped_domain_name = (domain_names_list[x].length > 25) ? domain_names_list[x].substr(0, 15) + "..." + domain_names_list[x].substr(domain_names_list[x].length - 7, domain_names_list[x].length - 1) : domain_names_list[x];
        $("#view-listings-button-drop").append("<a target='_blank' href='" + listing_href + "' class='is-underlined'>" + clipped_domain_name + "</a>" + " ");
      }
    }
    else {
      var listing_info = getDomainByID(selected_domain_ids[0]);
      current_listing = listing_info;

      //plural "this domain"
      $(".this-domain").text("this domain");

      //if demo
      if (!user.id){
        var listing_href = ((window.location.hostname.indexOf("domahub") != -1) ? "https://domahub.com/listing/" + listing_info.domain_name.toLowerCase() : "http://localhost:8080/listing/" + listing_info.domain_name.toLowerCase()) + "?compare=true&theme=Random";
      }
      //if production
      else if (window.location.hostname.indexOf("domahub") != -1){
        var listing_href = (user.stripe_subscription_id) ? "https://" + listing_info.domain_name.toLowerCase() : "/listing/" + listing_info.domain_name.toLowerCase();
      }
      //testing
      else {
        var listing_href = "http://localhost:8080/listing/" + listing_info.domain_name.toLowerCase();
      }
      $("#view-listings-button").off().attr("href", listing_href);

      //show domain capitalization
      $("#domain-name-input").removeClass('is-hidden');
    }

    //refresh all changeable inputs
    $(".changeable-input").val("");

    updateStatus(current_listing);
    updateInfoTab(current_listing);
    updateDesignTab(current_listing);
    updateDomainInfoTab(current_listing, selected_domain_ids);
    updateRentalTab(current_listing);
    updateHubTab(current_listing, selected_domain_ids);
    updateBindings(current_listing, selected_domain_ids);
  }

  function setupEditingButtons(){

    //to submit form changes
    $("#save-changes-button").off().on("click", function(e){
      submitListingChanges($(this));
    });

    //to submit registrar contact modal changes
    $("#save-registrar-contact-button").off().on("click", function(e){
      submitListingChanges($(this), false, true);
    });

    //to cancel form changes
    $("#cancel-changes-button, #cancel-registrar-contact-button").off().on("click", function(e){
      cancelListingChanges();
    });

    //click to move to upgrade tab from design tab
    $("#other-tab-upgrade-button").off().on('click', function(e){
      $("#upgrade-tab").click();
    });

    //change tabs for editing
    $("#edit-toolbar .tab").off().on("click", function(e){
      var current_tab = $("#edit-toolbar .tab.is-active").attr("id").replace("-tab", "");
      var new_tab = $(this).attr("id").replace("-tab", "");

      if (current_tab != new_tab){
        //clear any existing messages
        clearNotification();

        //update tab URL
        updateQueryStringParam("tab", new_tab, true);

        //hide other tab selectors
        $(".tab.verified-elem").removeClass('is-active');
        $(this).addClass('is-active');

        //show this new tab
        showTab(new_tab);
      }
    });

  }

  //show specific tab
  function showTab(new_tab){
    $(".tab-drop").stop().fadeOut(300).addClass('is-hidden');
    $("#" + new_tab + "-tab-drop").stop().fadeIn(300).removeClass('is-hidden');

    //update marquee if showing hub
    if (new_tab == "hub"){
      updateMarqueeHandlers($(".sortable-marquee"));
    }
  }

  function updateStatus(listing_info){
    //status
    $("#status-toggle-button").data("status", (listing_info.status) ? listing_info.status : 0);

    //turned on, turn off?
    if (listing_info.status == 1){
      $("#status-toggle-button").addClass("is-primary").removeClass('is-danger');
      $("#status-icon").find("svg").attr("data-icon", "toggle-on");
      $("#status-text").text("Active");
    }
    else {
      $("#status-toggle-button").addClass('is-danger').removeClass("is-primary");
      $("#status-icon").find("svg").attr("data-icon", "toggle-off");
      $("#status-text").text("Inactive");
    }
  }

  //handle checkboxes
  function checkBox(module_value, elem, child){
    if (typeof module_value != "null" && typeof module_value != "undefined"){
      elem.val(module_value).prop("checked", module_value);
    }
  }

  //</editor-fold>

  //<editor-fold>-------------------------------INFORMATION TAB EDITS-------------------------------

  //update information tab for editing a listing
  function updateInfoTab(listing_info){

    //supported currencies
    if (user.currencies){

      //create list of acceptable currencies
      if (user.currencies.payment_currencies){
        $(".currency-select").children().remove();
        $(".currency-select").append("<option selected value='' disabled>Please select your default currency</option>");
        $(".currency-select").append("<option disabled>Default Currencies</option>");

        //append account and listing default currencies
        if (listing_info.default_currency){
          $(".currency-select").append("<option value=" + listing_info.default_currency + ">&nbsp;&nbsp;" + listing_info.default_currency.toUpperCase() +" - " + currency_codes[listing_info.default_currency.toUpperCase()].name + " (Listing default)</option>");
        }
        if (user.default_currency && user.default_currency != listing_info.default_currency){
          $(".currency-select").append("<option value=" + user.default_currency + ">&nbsp;&nbsp;" + user.default_currency.toUpperCase() +" - " + currency_codes[user.default_currency.toUpperCase()].name + " (Account default)</option>");
        }

        //create list of other currencies
        $(".currency-select").append("<option disabled>Other Currencies</option>");
        for (var x = 0 ; x < user.currencies.payment_currencies.length ; x++){
          var current_currency = currency_codes[user.currencies.payment_currencies[x].toUpperCase()];

          //not account and not listing default
          if (user.currencies.payment_currencies[x] != user.default_currency && user.currencies.payment_currencies[x] != listing_info.default_currency){
            //if it exists in our db
            if (current_currency != undefined){
              $(".currency-select").append("<option value=" + user.currencies.payment_currencies[x] + ">&nbsp;&nbsp;" + user.currencies.payment_currencies[x].toUpperCase() +" - " + current_currency.name + "</option>");
            }
            else {
              $(".currency-select").append("<option value=" + user.currencies.payment_currencies[x] + ">&nbsp;&nbsp;" + user.currencies.payment_currencies[x].toUpperCase() + "</option>");
            }
          }
        }
      }

      //select the default currency
      $("#default_currency-input").val(listing_info.default_currency);
    }

    //pricing
    if (listing_info.buy_price){
      $("#buy-price-input").val(listing_info.buy_price / getCurrencyMultiplier(listing_info.default_currency));
    }
    if (listing_info.min_price){
      $("#min-price-input").val(listing_info.min_price / getCurrencyMultiplier(listing_info.default_currency));
    }

    //domain descriptions
    $("#description").val(listing_info.description);
    $("#description-hook").val(listing_info.description_hook);
    $("#description-footer").val(listing_info.description_footer);
    $("#description-footer-link").val(listing_info.description_footer_link);
    if (listing_info.domain_name){
      $("#domain-name-input").attr("placeholder", punycode.toUnicode(listing_info.domain_name)).val(punycode.toUnicode(listing_info.domain_name));
    }

    //categories
    $("#categories-input").val(listing_info.categories);
    updateCategorySelections(listing_info.categories);
  }
  function updateCategoryInputDropdown(listing_info){
    $("#categories-input").on("focusin", function(){
      $("#categories-dropdown").removeClass('is-hidden');
    });

    //close category dropdown
    $(document).on("click", function(event) {
      if (!$(event.target).closest("#categories-input").length && !$(event.target).closest("#categories-dropdown").length) {
        if ($("#categories-dropdown").is(":visible")) {
          $("#categories-dropdown").addClass("is-hidden");
        }
      }
    });

    //category checkbox
    $(".category-checkbox-input").on("change", function(){
      $("#categories-input").val($(".category-checkbox-input").map(function(){
        if ($(this).prop("checked")) { return $(this).val() }
      }).toArray().join(" "));
      changedValue($("#categories-input"), listing_info);
    });
  }
  function updateCategorySelections(categories){
    $(".category-checkbox-input").prop("checked", false);
    var categories_array = (categories) ? categories.split(" ") : "";
    for (var x = 0 ; x < categories_array.length ; x++){
      $("#" + categories_array[x] + "-category-input").prop('checked', true);
    }
  }

  //</editor-fold>

  //<editor-fold>-------------------------------DOMAIN INFORMATION TAB EDITS-------------------------------

  //update the domain information tab for editing registrar/domain info
  function updateDomainInfoTab(listing_info, selected_domain_ids){
    //registrar info
    $("#registrar-name-input").val(listing_info.registrar_name);
    $("#date-expire-input").val((listing_info.date_expire) ? moment(listing_info.date_expire).format('YYYY-MM-DDTHH:mm') : "");
    $("#date-registered-input").val((listing_info.date_registered) ? moment(listing_info.date_registered).format('YYYY-MM-DDTHH:mm') : "");

    //registrar currency and cost
    if (listing_info.registrar_cost && listing_info.registrar_cost_currency){
      $("#annual-cost-currency-input").val(listing_info.registrar_cost_currency);
      var registrar_cost_currency_multiplier = (listing_info.registrar_cost_currency) ? Math.pow(10, currency_codes[$("#annual-cost-currency-input").val().toUpperCase()].fractionSize) : 1;
      $("#annual-cost-input").val(listing_info.registrar_cost / registrar_cost_currency_multiplier);
    }

    //reset modal inputs
    if (!$("#registrar-contact-modal").hasClass('is-active')){
      $(".registrar-modal-input").val("");
    }

    //reduce function to change texts + figure out if all are missing
    var test_contact_details = function(p, elem, i){
      var elem_exists = listing_info["registrar_" + elem] != "" && listing_info["registrar_" + elem] != null;
      if (elem_exists){
        $("#registrar-" + elem + "-doesnt-exist").addClass("is-hidden");
        $("#registrar-" + elem + "-text").removeClass("is-hidden").html(" &middot; " + listing_info["registrar_" + elem])
      }
      else {
        $("#registrar-" + elem + "-text").addClass("is-hidden");
      }
      return (elem_exists === true) ? p + 1 : p;
    }

    //admin
    var all_admin_exists = [
      "admin_name",
      "admin_org",
      "admin_email",
      "admin_address",
      "admin_phone"
    ].reduce(test_contact_details, 0);
    if (all_admin_exists == 0){
      $("#registrar-admin_name-doesnt-exist").removeClass("is-hidden");
    }

    //registrant
    var all_registrant_exists = [
      "registrant_name",
      "registrant_org",
      "registrant_email",
      "registrant_address",
      "registrant_phone"
    ].reduce(test_contact_details, 0);
    if (all_registrant_exists == 0){
      $("#registrar-registrant_name-doesnt-exist").removeClass("is-hidden");
    }

    //tech
    var all_tech_exists = [
      "tech_name",
      "tech_org",
      "tech_email",
      "tech_address",
      "tech_phone"
    ].reduce(test_contact_details, 0);
    if (all_tech_exists == 0){
      $("#registrar-tech_name-doesnt-exist").removeClass("is-hidden");
    }

    updateDomainContact(listing_info);
    updateDomainExpenses(listing_info, selected_domain_ids);
  }
  function updateDomainContact(listing_info){

    //phone input
    $("#registrar-contact-phone-input").intlTelInput("destroy").intlTelInput({
      utilsScript : "/js/jquery/utils.js",
      autoPlaceholder : "aggressive"
    });

    $("#edit-registrar-contact-button").off().on("change", function(){
      updateDomainContactModal($(this).val(), listing_info);
    }).on("blur", function(){
      $(this).val("off");
    });
  }
  function updateDomainContactModal(which_contact, listing_info){
    var registrar_display_text = (which_contact == "admin") ? "Administrator" : which_contact.substr(0,1).toUpperCase() + which_contact.substr(1, which_contact.length - 1);
    $(".registrar-which-text").text(registrar_display_text);

    clearNotification();
    $(".modal").removeClass('is-active');
    $("#registrar-contact-modal").addClass('is-active');

    //update the text and values of inputs
    $("#registrar-contact-name-input").data("name", "registrar_" + which_contact + "_name").attr("data-name", "registrar_" + which_contact + "_name").val(listing_info["registrar_" + which_contact + "_name"]);
    $("#registrar-contact-org-input").data("name", "registrar_" + which_contact + "_org").attr("data-name", "registrar_" + which_contact + "_org").val(listing_info["registrar_" + which_contact + "_org"]);
    $("#registrar-contact-email-input").data("name", "registrar_" + which_contact + "_email").attr("data-name", "registrar_" + which_contact + "_email").val(listing_info["registrar_" + which_contact + "_email"]);
    $("#registrar-contact-address-input").data("name", "registrar_" + which_contact + "_address").attr("data-name", "registrar_" + which_contact + "_address").val(listing_info["registrar_" + which_contact + "_address"]);
    $("#registrar-contact-phone-input").data("name", "registrar_" + which_contact + "_phone").attr("data-name", "registrar_" + which_contact + "_phone").val(listing_info["registrar_" + which_contact + "_phone"]);

    //contact phone number
    if (listing_info["registrar_" + which_contact + "_phone"]){
      $("#registrar-contact-phone-input").intlTelInput("setNumber", listing_info["registrar_" + which_contact + "_phone"]).val(listing_info["registrar_" + which_contact + "_phone"]);
    }
    else {
      $("#registrar-contact-phone-input").val("");
    }
  }
  function extraCloseModal(){
    if (getParameterByName("tab") == "domain-info"){
      cancelListingChanges();
    }
  }

  function updateDomainExpenses(listing_info, selected_domain_ids){
    //add new expense button
    $("#add-new-expense-button").off().on("click", function(){
      updateDomainExpenseModal("new", false, listing_info);
    });

    //submit domain expense form
    $("#domain-expense-form").off().on("submit", function(e){
      e.preventDefault();
      submitDomainExpense($(this), selected_domain_ids, $(this).data("expense_type"), $(this).data("expense_ids"));
    });

    //delete domain expense
    $("#delete-domain-expense-button").off().on("click", function(){
      submitDomainExpense($(this), selected_domain_ids, "delete", $(this).data("expense_ids"));
    });

    //cancel expense button
    $(".cancel-expense-button").off().on("click", function(){
      $(".modal").removeClass("is-active");
    });

    //expense table
    if (listing_info.expenses){
      createDomainExpenseTable(listing_info);
    }
    //get expenses if not demo
    else if (user.id){
      getDomainExpenses(listing_info, selected_domain_ids);
    }
  }
  function createDomainExpenseTable(listing_info, selected_domain_ids){
    $("#domain-expense-table-wrapper").addClass('is-hidden');
    $(".cloned-expense-row").remove();
    if (listing_info.expenses){
      for (var x = 0 ; x < listing_info.expenses.length ; x++){
        var expense_clone = $("#domain-expense-clone").clone().removeAttr("id").removeClass("is-hidden").addClass("cloned-expense-row").data("domain_expense", listing_info.expenses[x]);
        expense_clone.find(".domain-expense-name").text(listing_info.expenses[x].expense_name);
        expense_clone.find(".domain-expense-cost").text(formatCurrency(parseFloat(listing_info.expenses[x].expense_cost), listing_info.expenses[x].expense_currency));
        expense_clone.find(".domain-expense-date").text(moment(listing_info.expenses[x].expense_date).format("YYYY-MM-DD")).attr("title", moment(listing_info.expenses[x].expense_date).format("YYYY-MM-DD HH:mm"));
        expense_clone.find(".domain-expense-delete-button").on("click", function(){
          updateDeleteDomainExpenseModal($(this).closest(".cloned-expense-row").data("domain_expense"), listing_info);
        });
        expense_clone.find(".domain-expense-edit-button").on("click", function(){
          updateDomainExpenseModal("edit", $(this).closest(".cloned-expense-row").data("domain_expense"), listing_info);
        });
        $("#domain-expense-table").append(expense_clone);
      }
      $("#domain-expense-table-wrapper").removeClass('is-hidden');
    }
  }
  function getDomainExpenses(listing_info, selected_domain_ids){
    $.ajax({
      url: "/listings/getexpenses",
      method : "POST",
      data : {
        selected_ids : selected_domain_ids.join(",")
      }
    }, 'json').done(function(data){
      if (data.state == "success"){
        updateDomainExpenseTable(data, selected_domain_ids);
      }
      else {
        errorMessage(data.message);
      }
    });
  }
  function updateDomainExpenseModal(expense_type, domain_expense, listing_info){
    clearNotification();
    if (expense_type == "new"){
      $(".domain-expense-input").val("");
      var expense_display_text = "Adding New ";

      //pre-select domain default currency (based on account or listing default)
      if (listing_info.default_currency){
        $("#domain-expense-currency-input").val(listing_info.default_currency);
      }
      else if (user.default_currency){
        $("#domain-expense-currency-input").val(user.default_currency);
      }
    }
    else {
      $("#domain-expense-name-input").val(domain_expense.expense_name);
      $("#domain-expense-cost-input").val(domain_expense.expense_cost);
      $("#domain-expense-currency-input").val(domain_expense.expense_currency);
      $("#domain-expense-date-input").val(moment(domain_expense.expense_date).format('YYYY-MM-DDTHH:mm'));
      var expense_display_text = "Editing ";
    }
    $("#domain-expense-modal").addClass('is-active');
    $("#domain-expense-name-input").focus();

    //display what are we doing to this expense (new, edit)
    $("#how-change-domain-expense").text(expense_display_text);

    //for submission of new/edit/delete expense
    $("#domain-expense-form").data("expense_type", expense_type).data("expense_ids", (domain_expense.expense_ids) ? domain_expense.expense_ids : [domain_expense.id]);
  }
  function updateDeleteDomainExpenseModal(domain_expense, listing_info){
    clearNotification();
    $("#domain-expense-name-delete-text").text(domain_expense.expense_name);
    $("#domain-expense-cost-delete-text").text(formatCurrency(parseFloat(domain_expense.expense_cost), domain_expense.expense_cost_currency));
    $("#domain-expense-date-delete-text").text(moment(domain_expense.expense_date).format("YYYY-MM-DD HH:mmA"));
    $("#domain-expense-delete-modal").addClass('is-active');

    //expense IDS
    $("#delete-domain-expense-button").data("expense_ids", (domain_expense.expense_ids) ? domain_expense.expense_ids : [domain_expense.id]);
  }
  function submitDomainExpense(button_elem, selected_domain_ids, expense_type, expense_ids){
    button_elem.addClass("is-loading");

    var submit_data = {
      selected_ids : selected_domain_ids.join(",")
    }

    //edit or create new
    if (expense_type != "delete"){
      submit_data.expense_name = $("#domain-expense-name-input").val();
      submit_data.expense_currency = $("#domain-expense-currency-input").val();
      submit_data.expense_cost = $("#domain-expense-cost-input").val();
      submit_data.expense_date = $("#domain-expense-date-input").val();
    }

    //edit or delete
    if (expense_type != "new"){
      submit_data.expense_ids = expense_ids;
    }

    $.ajax({
      url: "/listings/" + expense_type + "expenses",
      method : "POST",
      data : submit_data
    }, 'json').done(function(data){
      button_elem.removeClass("is-loading");
      if (data.state == "success"){
        $(".modal").removeClass('is-active');

        //success msg
        if (expense_type == "new"){
          var success_msg = "created a new";
        }
        else if (expense_type == "edit"){
          var success_msg = "edited an existing";
        }
        else {
          var success_msg = "deleted an existing";
        }
        var success_plural = (selected_domain_ids.length == 1) ? "for this domain!" : "for " + selected_domain_ids.length + " domains!";
        successMessage("Successfully " + success_msg + " domain expense " + success_plural);

        //recreate table after listing object refresh
        updateDomainExpenseTable(data, selected_domain_ids);
      }
      else {
        errorMessage(data.message);
      }
    });
  }
  function updateDomainExpenseTable(data, selected_domain_ids){
    listings = data.listings;
    if (selected_domain_ids.length > 1){
      current_listing = getCommonListingInfo(selected_domain_ids);
    }
    else {
      current_listing = getDomainByID(selected_domain_ids[0]);
    }
    createDomainExpenseTable(current_listing, selected_domain_ids);
  }

  //</editor-fold>

  //<editor-fold>-------------------------------RENTAL EDITS-------------------------------

  function updateRentalTab(listing_info){
    checkBox(listing_info.rentable, $("#rentable-input"));

    //rental pricing
    if (listing_info.price_rate){
      $("#price-rate-input").val(listing_info.price_rate / getCurrencyMultiplier(listing_info.default_currency));
    }
    if (listing_info.price_type){
      $("#price-type-input").val(listing_info.price_type);
    }

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
    $(".tagit.input").addClass('rentable-input');
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
    updateFooterStyling(listing_info);
    updateBackground(listing_info);
    updateLogo(listing_info);
    updateModules(listing_info);
    updateContentDesign(listing_info);
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
    updateFooterStyling(theme_to_load);
    $("#theme-input").val(theme_to_load.theme_name);
    changedValue($(".changeable-input"), theme_to_load);
  }

  //update the design tab
  function updatePremiumNotification(){
    //if premium, remove the notification / disabled inputs
    if (user.stripe_subscription_id){
      $(".premium-input").removeClass("is-disabled");
      $(".blackscreen").addClass("is-hidden");
    }
    else {
      $(".premium-input").addClass("is-disabled");
      $(".blackscreen").removeClass("is-hidden");

      //premium blackscreen deleted
      if ($("#premium-blackscreen-design").length == 0){
        $("#design-tab-drop").find(".column").eq(0).prepend(premium_blackscreen_design);
      }

      //premium blackscreen deleted
      if ($("#premium-blackscreen-hub").length == 0){
        $("#hub-tab-drop").find(".column").eq(0).prepend(premium_blackscreen_hub);
      }
    }
  }
  function updatePriceInputs(listing_info){
    //update preview on design page
    if (listing_info.buy_price > 0){
      $("#example-buy-price-tag").removeClass('is-hidden').text("For sale - " + formatCurrency(parseFloat(listing_info.buy_price), listing_info.default_currency));
    }
    else {
      $("#example-buy-price-tag").addClass('is-hidden');
    }
    if (listing_info.rentable && listing_info.price_rate > 0){
      $("#example-rent-price-tag").removeClass('is-hidden').text("For rent - " + formatCurrency(parseFloat(listing_info.price_rate), listing_info.default_currency) + " / " + listing_info.price_type);
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

    $("#primary-color-input").val(listing_info.primary_color);
    $("#primary-color-input").minicolors("destroy").minicolors(minicolor_options);
    $("#secondary-color-input").val(listing_info.secondary_color);
    $("#secondary-color-input").minicolors("destroy").minicolors(minicolor_options);
    $("#tertiary-color-input").val(listing_info.tertiary_color);
    $("#tertiary-color-input").minicolors("destroy").minicolors(minicolor_options);

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
      swatches: ["#FFFFFF", "#E5E5E5", "#B2B2B2", "#7F7F7F", "#666666", "#222222", "#000000"]
    }

    $("#font-color-input").val(listing_info.font_color);
    $("#font-color-input").minicolors("destroy").minicolors(minicolor_options);
    $("#font-name-input").val(listing_info.font_name);

    //update the preview
    $("#example-domain-name").css("font-family", listing_info.font_name);
    $("#example-font").css("color", listing_info.font_color);
  }
  function updateFooterStyling(listing_info){
    var minicolor_options = {
      letterCase: "uppercase",
      swatches: ["#FFFFFF", "#E5E5E5", "#B2B2B2", "#7F7F7F", "#666666", "#222222", "#000000"]
    }

    $("#footer-background-color-input").val(listing_info.footer_background_color)
    $("#footer-background-color-input").minicolors("destroy").minicolors(minicolor_options);
    $("#footer-color-input").val(listing_info.footer_color);
    $("#footer-color-input").minicolors("destroy").minicolors(minicolor_options);

    //update the preview
    $("#example-footer-background").css("background-color", listing_info.footer_background_color);
    $("#example-footer-text").css("color", listing_info.footer_color);
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

    $("#background-color-input").val(listing_info.background_color);
    $("#background-color-input").minicolors("destroy").minicolors(minicolor_options);
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
  function updateContentDesign(listing_info){
    checkBox(listing_info.show_placeholder, $("#placeholder-input"));
    checkBox(listing_info.show_domain_list, $("#domain-list-input"));
    checkBox(listing_info.show_traffic_graph, $("#traffic-graph-input"));
    checkBox(listing_info.show_alexa_stats, $("#alexa-stats-input"));
    checkBox(listing_info.show_history_ticker, $("#show-history-ticker-input"));
  }
  function updateModules(listing_info){
    //info module
    checkBox(listing_info.show_registrar, $("#show-registrar-input"));
    checkBox(listing_info.show_registration_date, $("#show-registration-date-input"));
    checkBox(listing_info.show_social_sharing, $("#show-social-sharing-input"));
    checkBox(listing_info.show_categories, $("#show-categories-input"));

    //appraisal links
    checkBox(listing_info.show_godaddy_appraisal, $("#show-godaddy-appraisal-input"));
    checkBox(listing_info.show_domainindex_appraisal, $("#show-domainindex-appraisal-input"));
    checkBox(listing_info.show_freevaluator_appraisal, $("#show-freevaluator-appraisal-input"));
    checkBox(listing_info.show_estibot_appraisal, $("#show-estibot-appraisal-input"));

    $("#godaddy-appraisal-label").attr("href", "https://www.godaddy.com/domain-value-appraisal/appraisal/?checkAvail=1&tmskey=&domainToCheck=" + listing_info.domain_name);
    $("#domainindex-appraisal-label").attr("href", "http://domainindex.com/domains/" + listing_info.domain_name);
    $("#freevaluator-appraisal-label").attr("href", "http://www.freevaluator.com/?domain=" + listing_info.domain_name);
    $("#estibot-appraisal-label").attr("href", "https://www.estibot.com/verify.php?type=normal&data=" + listing_info.domain_name);

    //alexa link
    if (listing_info.domain_name){
      $("#alexa_link").attr("href", "https://www.alexa.com/siteinfo/" + listing_info.domain_name);
    }
    else {
      $("#alexa_link").attr("href", "https://www.alexa.com");
    }
  }

  //</editor-fold>

  //<editor-fold>-------------------------------HUB EDITS-------------------------------

  function updateHubTab(listing_info, selected_domain_ids){
    //hub details
    checkBox(listing_info.hub, $("#hub-input"));
    checkBox(listing_info.hub_email, $("#hub-email-input"));
    $("#hub-title-input").val(listing_info.hub_title);

    //phone number
    if (listing_info.hub_phone){
      $("#hub-phone-input").intlTelInput("setNumber", listing_info.hub_phone).val(listing_info.hub_phone);
    }
    else {
      $("#hub-phone-input").val("");
    }

    $("#hub-phone-input").intlTelInput("destroy").intlTelInput({
      utilsScript : "/js/jquery/utils.js",
      autoPlaceholder : "aggressive"
    });

    //hub design
    $("#hub-layout-count-input").val(listing_info.hub_layout_count);
    $("#hub-layout-type-input").val(listing_info.hub_layout_type);

    if (selected_domain_ids.length > 1){
      $("#multiple-edit-hub").removeClass('is-hidden');
    }
    else {
      $("#multiple-edit-hub").addClass('is-hidden');

      //make the list of sortable domains
      $("#sortable-wrapper").empty();
      if (listing_info.hub_listing_ids && listing_info.hub_listing_ids.length > 0){
        $("#no-domains-in-hub").addClass('is-hidden');
        var domain_ids_in_hub = listing_info.hub_listing_ids.split(",");
        var domains_in_hub = [];
        domain_ids_in_hub.filter(function(elem){
          var listing_info = listings.find(function(e){
            return e.id == elem
          });

          if (listing_info){
            domains_in_hub.push(listing_info);
            return true;
          }
          else {
            return false;
          }
        });

        //create the rows
        if (domains_in_hub.length > 0){
          for (var x = 0 ; x < domains_in_hub.length ; x++){
            var domain_clone = $("#sortable-clone").clone().removeAttr("id").removeClass('is-hidden');
            domain_clone.find(".domain_name").addClass("sortable-marquee").text(punycode.toUnicode(domains_in_hub[x].domain_name));
            domain_clone.data("listing_id", domains_in_hub[x].id);

            //get front-end categories
            if (domains_in_hub[x].categories){
              var categories_for_sortable = domains_in_hub[x].categories.split(" ").map(function(elem){
                return "<span class='marquee-category-tag'>" + categories_hash[elem] + "<span>";
              }).join(" ");
            }
            else {
              var categories_for_sortable = "";
            }

            domain_clone.find(".categories").addClass("sortable-marquee").html(categories_for_sortable);
            $("#sortable-wrapper").append(domain_clone);
          }

          //make them sortable
          $("#sortable-wrapper").sortable({
            cursor: "pointer",
            stop : function(){
              var ranked_ids = "";
              $("#sortable-wrapper > div").each(function(){
                ranked_ids += $(this).data("listing_id") + ",";
              });
              ranked_ids = ranked_ids.slice(0, -1);
              $("#hub-listing-ids-input").val(ranked_ids);
              changedValue($("#hub-listing-ids-input"), listing_info);
            }
          });
          $("#sortable-wrapper").disableSelection();

          //marquee when necessary
          $(document).ready(function () {
            updateMarqueeHandlers($(".sortable-marquee"));
          });
        }
        else {
          $("#no-domains-in-hub").removeClass('is-hidden');
        }
      }
      else if (listing_info.hub) {
        $("#no-domains-in-hub").removeClass('is-hidden');
      }

      //not a hub!
      if (!listing_info.hub){
        $("#not-a-hub").removeClass('is-hidden');
        $("#no-domains-in-hub, #multiple-edit-hub").addClass("is-hidden");
      }
      else {
        $("#not-a-hub").addClass('is-hidden');
      }
    }

    updateHubInputsDisabled(listing_info.hub);
  }
  function updateHubInputsDisabled(hub){
    if (hub == 1){
      $(".hub-input").removeClass('is-disabled');
    }
    else {
      $(".hub-input").addClass('is-disabled');
    }
  }
  //make marquees move if necessary (function needed for resize)
  function updateMarqueeHandlers(elem){
    elem.marquee("destroy").each(function(){
      if (this.offsetWidth < this.scrollWidth){
        updateMarqueeHandler($(this));
      }
    });
  }
  //start a marquee on an element (handle destroy when mouseleave)
  function updateMarqueeHandler(elem){
    elem.marquee("destroy").marquee({
      startVisible : true,
      delayBeforeStart : 0,
      speed : 100
    }).marquee("pause").on("mouseenter", function(){
      $(this).marquee("resume");
    }).on("mouseleave", function(){
      updateMarqueeHandler(elem);
    });
  }

  //resize marquee
  $(window).resize(function(){
    updateMarqueeHandlers($(".sortable-marquee"));
    updateMarqueeHandlers($(".td-domain"));
  });

  //</editor-fold>

  //<editor-fold>-------------------------------BINDINGS-------------------------------

  //update change bindings (category, changeable-input, status)
  function updateBindings(listing_info, selected_domain_ids){

    //bind new handlers for any changeable inputs
    $(".changeable-input").off().on("change input", function(e){
      changedValue($(this), listing_info);
    });

    //update status binding
    $("#status-toggle-button").off().on("click", function(e){
      submitListingChanges($(this), true);
    });

    $("#lookup-dns-button").off().on("click", function(e){
      clearNotification();

      //lookup DNS button
      var selected_listings = [];
      for (var x = 0; x < selected_domain_ids.length; x++){
        var listing_info = getDomainByID(selected_domain_ids[x]);
        selected_listings.push({
          domain_name : listing_info.domain_name,
          id : selected_domain_ids[x],
          client_index : x
        });
      }

      $(this).addClass('is-loading');
      getDNSRecords(selected_listings, selected_domain_ids, false, function(data){
        $("#lookup-dns-button").removeClass('is-loading');
        var plural_msg = (selected_domain_ids.length == 1) ? "this listing" : selected_domain_ids.length + " listings";
        if (data.no_whois && data.no_whois == selected_domain_ids.length){
          listings = data.listings;
          errorMessage("Failed to look up registrar information for " + plural_msg + "! Please enter the information manually.");
        }
        if (data.nothing_changed && data.nothing_changed == selected_domain_ids.length){
          listings = data.listings;
          infoMessage("No new registrar details were changed for " + plural_msg + ".");
        }
        else if (data.state == "success"){
          listings = data.listings;
          var final_msg = "";

          //some have nothing changed
          if (data.nothing_changed > 0){
            var plural_nothing_msg = (data.nothing_changed == 1) ? "a listing" : data.nothing_changed + " listings";
            final_msg += "No new registrar details were changed for " + plural_nothing_msg + ".";
          }

          //some have changed
          if (data.nothing_changed + data.no_whois != selected_domain_ids.length){
            var plural_changed_msg = (selected_domain_ids.length - (data.nothing_changed + data.no_whois) == 1) ? "a listing" : (selected_domain_ids.length - (data.nothing_changed + data.no_whois)) + " listings";
            if (final_msg != ""){
              final_msg += "</br></br>";
            }
            final_msg += "Successfully changed registrar information for " + plural_changed_msg + ".";
          }

          //some errored
          if (data.no_whois > 0){
            var plural_nowhois_msg = (data.no_whois == 1) ? "a listing" : data.no_whois + " listings";
            if (final_msg != ""){
              final_msg += "</br></br>";
            }
            final_msg += "Failed to look up registrar information for " + plural_nowhois_msg + "! Please enter the information manually.";
            errorMessage(final_msg);
          }
          else if (data.nothing_changed == 0){
            successMessage(final_msg);
          }
          else {
            infoMessage(final_msg);
          }
        }
        else {
          errorMessage(data.message);
        }
        updateEditorEditing(selected_domain_ids);
        createRows();
      });
    });

    //module checkbox handlers
    $(".checkbox-input").off().on("change", function(){
      var new_checkbox_val = ($(this).val() == "1") ? 0 : 1;
      $(this).val(new_checkbox_val);
      changedValue($(this), listing_info);
    });

    //category dropdown
    $("#categories-input").on("input", function(){
      updateCategorySelections($(this).val());
    });
    updateCategoryInputDropdown(listing_info);

    //load theme buttons
    loadThemeHandler();

    //currency change reset prices to 0
    $("#default_currency-input").on("change", function(){
      if ($("#default_currency-input").val() != listing_info.default_currency){
        $("#min-price-input, #buy-price-input, #price-rate-input").val(0);
        checkBox(0, $("#rentable-input"));
        updateRentalInputsDisabled(0);
      }
      else {
        $("#buy-price-input").val(listing_info.buy_price / getCurrencyMultiplier(listing_info.default_currency));
        $("#min-price-input").val(listing_info.min_price / getCurrencyMultiplier(listing_info.default_currency));
        $("#price-rate-input").val(listing_info.price_rate / getCurrencyMultiplier(listing_info.default_currency));
        checkBox(listing_info.rentable, $("#rentable-input"));
        updateRentalInputsDisabled(listing_info.rentable);
      }
    });

    //registrar currency change reset cost to 0
    $("#annual-cost-currency-input").on("change", function(){

      //if we're changing the currency
      if ($("#annual-cost-currency-input").val() != listing_info.registrar_cost_currency){
        //something new was entered
        if ($("#annual-cost-input").val() == listing_info.registrar_cost / Math.pow(10, currency_codes[$("#annual-cost-currency-input").val().toUpperCase()].fractionSize || 0)){
          $("#annual-cost-input").val(0);
        }
      }
      //return to what it was if we're changing the currency back
      else {
        $("#annual-cost-input").val(listing_info.registrar_cost / Math.pow(10, currency_codes[$("#annual-cost-currency-input").val().toUpperCase()].fractionSize || 0));
      }
    });

    //allow rentals checkbox
    $("#rentable-input").on("change", function(){
      updateRentalInputsDisabled($(this).val());
    });

    //allow hub checkbox
    $("#hub-input").on("change", function(){
      updateHubInputsDisabled($(this).val());
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

    //change footer background color
    $("#footer-background-color-input").on("input", function(){
      $("#example-footer-background").css("background-color", $(this).val());
    });

    //change footer font color
    $("#footer-color-input").on("input", function(){
      $("#example-footer-text").css("color", $(this).val());
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
  function changedValue(input_elem, listing_info, force){
    var name_of_attr = input_elem.data("name");
    var value_of_input = input_elem.val();

    if (listing_info){
      if (name_of_attr == "background_image_link"){
        var listing_info_comparison = listing_info["background_image"];
      }
      else if (name_of_attr == "logo_image_link"){
        var listing_info_comparison = listing_info["logo"];
      }
      else if (["price_rate", "buy_price", "min_price"].indexOf(name_of_attr) != -1){
        var listing_info_comparison = listing_info[name_of_attr];
        value_of_input *= getCurrencyMultiplier($("#default_currency-input").val());
        if ($("#default_currency-input").val() != listing_info["default_currency"]){
          force = true;
        }
      }
      else if (name_of_attr == "registrar_cost"){
        var listing_info_comparison = listing_info[name_of_attr];
        value_of_input *= getCurrencyMultiplier($("#annual-cost-currency-input").val());
        if ($("#annual-cost-currency-input").val() != listing_info["registrar_cost_currency"]){
          force = true;
        }
      }
      else {
        var listing_info_comparison = listing_info[name_of_attr];
      }
    }

    //clear any existing messages
    clearNotification();

    //only change if the value changed from existing (and if premium elem, has premium)
    if (force || (value_of_input != listing_info_comparison &&
      ((input_elem.hasClass('premium-input') && user.stripe_subscription_id) ||
      (!input_elem.hasClass('premium-input'))))
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
      if (input_elem.hasClass('premium-input') && !user.stripe_subscription_id){
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

    $(".modal").removeClass('is-active');

    //revert all inputs
    updateEditorEditing(getSelectedDomains("id", true, true));

    if (!keep_message){
      clearNotification();
    }
  }

  //submit status change
  function submitListingChanges(submit_button, status_only, contact_modal){
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
      var elements_list = (contact_modal) ? ".modal-input" : ".changeable-input, #paths-input";
      $(elements_list).each(function(e){
        var input_name = $(this).data("name");
        var input_val = (input_name == "background_image" || input_name == "logo") ? $(this)[0].files[0] : $(this).val();

        //if changing listing image link
        if (input_name == "background_image_link"){
          var listing_comparison = current_listing["background_image"];
        }
        else if (input_name == "logo_image_link"){
          var listing_comparison = current_listing["logo"];
        }
        else if (input_name.indexOf("phone") != -1 && typeof intlTelInputUtils != "undefined"){
          var input_val = $(this).intlTelInput("getNumber", intlTelInputUtils.numberFormat.INTERNATIONAL);
          var listing_comparison = (current_listing[input_name] == null || current_listing[input_name] == undefined) ? "" : current_listing[input_name];
        }
        else if (input_name == "date_expire"){
          var listing_comparison = (current_listing.date_expire) ? moment(current_listing.date_expire).format('YYYY-MM-DDTHH:mm') : "";
        }
        else if (input_name == "date_registered"){
          var listing_comparison = (current_listing.date_registered) ? moment(current_listing.date_registered).format('YYYY-MM-DDTHH:mm') : "";
        }
        else if (["price_rate", "buy_price", "min_price"].indexOf(input_name) != -1){
          var listing_comparison = current_listing[input_name] * getCurrencyMultiplier($("#default_currency-input").val());
        }
        else if (input_name == "registrar_cost"){
          var listing_comparison = current_listing[input_name] * getCurrencyMultiplier($("#annual-cost-currency-input").val());
        }
        else {
          var listing_comparison = (current_listing[input_name] == null || current_listing[input_name] == undefined) ? "" : current_listing[input_name];
        }

        //if null or undefined (or not uploading, for background/logo link input)
        if (input_val != listing_comparison && input_val != null && input_val != undefined && !$(this).data("uploading")){
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
    // submit_button.removeClass('is-loading');

    $.ajax({
      url: (selected_ids.length == 1) ? "/listing/" + getDomainByID(selected_ids[0]).domain_name.toLowerCase() + "/update" : "/listings/multiupdate",
      type: "POST",
      data: formData,
      // Options to tell jQuery not to process data or worry about the content-type
      cache: false,
      contentType: false,
      processData: false
    }, 'json').done(function(data){
      if (data.listings){
        listings = data.listings;
      }
      submit_button.removeClass('is-loading');
      refreshSubmitButtons();

      if (data.state == "success"){
        $(".modal").removeClass("is-active");

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
        createRows(selected_ids);
        updateEditorEditing(selected_ids);
      }
      else {

        //nothing was changed
        if (data.message == "nothing-changed"){
          var plural_error_msg = (selected_ids.length == 1) ? "this listing" : "the selected listings";
          infoMessage("No details were changed for " + plural_error_msg + ". Did you enter in the correct information?");
          updateEditorEditing(selected_ids);
        }
        else {
          //not premium but tried to update premium stuff
          if (data.message == "not-premium"){
            var error_msg = "You must <a class='is-underlined' href='/profile/settings#premium'>upgrade to a Premium Account</a> to be able to edit that!";
            updateEditorEditing(selected_ids);
          }
          else if (data.message == "dns-pending"){
            var error_msg = "The DNS changes on " + ((selected_ids.length == 1) ? "this domain" : "these domains") + " are still pending. Please wait up to 72 hours for the changes to set and try again.";
            updateEditorEditing(selected_ids);
          }
          else {
            //listing is no longer pointed to domahub, revert to verify tab
            if (data.message == "verification-error"){
              var plural_error_msg = (selected_ids.length == 1) ? "This listing is" : "Some of the selected listings are";
              var error_msg = plural_error_msg + " no longer pointing to DomaHub! Please verify that you are the owner by confirming your DNS settings.";
              showSelector(true);
              createRows(false);
            }
            else if (data.message == "ownership-error"){
              var plural_error_msg = (selected_ids.length == 1) ? "this listing" : "some of the listings";
              var error_msg = "You do not own " + plural_error_msg + " that you are trying to edit! Please select something else to edit.";
              showSelector(true);
              createRows(false);
            }
            else if (data.message == "accepted-error"){
              var plural_error_msg = (selected_ids.length == 1) ? "this listing" : "some of the selected listings";
              var error_msg = "You have already accepted an offer for " + plural_error_msg + "! Please select something else to edit.";
              showSelector(true);
              createRows(false);
            }
            else if (data.message == "deposited-error" || data.message == "transferred-error"){
              var plural_error_msg = (selected_ids.length == 1) ? "this listing" : "some of the selected listings";
              var error_msg = "You have already sold " + plural_error_msg + "! Please select something else to edit.";
              showSelector(true);
              createRows(false);
            }
            else {
              var error_msg = data.message;
            }

          }

          errorMessage(error_msg);
        }

      }
    });
  }

  //</editor-fold>

//</editor-fold>

//<editor-fold>-------------------------------UPDATE EDITOR OFFERS-------------------------------

//update a row if it's verified but not yet purchased
function updateEditorOffers(selected_domain_ids){
  //select verified rows here so we can keep the heading as "My Offers"
  if (selected_domain_ids.length == 0){
    selectSpecificRows("verified", 1);
    selected_domain_ids = getSelectedDomains("id", true);
  }

  updateEditorDomains(selected_domain_ids);
  $(".non-offer-elem").addClass('is-hidden');
  $(".offer-elem").removeClass('is-hidden');
  $("#current-view-name").html("Viewing Offers");

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
    $(".offer-header-sort").find("svg").attr("data-icon", "sort");

    //sort by header
    $(".offer-header-sort").off().on("click", function(){
      var sort_value = $(this).data("value");
      var sort_direction = ($(this).data("sort_direction")) ? true : false;

      //sort icon
      $(".offer-header-sort").find(".icon").removeClass('is-primary')
      $(".offer-header-sort").find("svg").attr("data-icon", "sort");
      $(this).find(".icon").addClass('is-primary');
      $(this).data("sort_direction", !sort_direction);
      if (sort_direction){
        $(this).find("svg").attr("data-icon", "sort-up");
      }
      else {
        $(this).find("svg").attr("data-icon", "sort-down");
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
      $(this).toggleClass("is-primary is-black");
      if ($(this).hasClass("is-primary")) {
        $(this).find("svg").attr("data-icon", "toggle-on");
      }
      else {
        $(this).find("svg").attr("data-icon", "toggle-off");
      }
      refreshOfferRows($("#offer-search").val(), $("#show-rejected-offers").hasClass('is-primary'));
    });

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
  $("#refresh-offers-button").addClass('is-loading');
  $("#loading-offers-table, #loading-offers-card").removeClass('is-hidden');
  $(".hidden-while-loading-offers, .whats-next-offer").addClass('is-hidden');
}

//hide loading offers row
function hideLoadingOffers(){
  $("#refresh-offers-button").removeClass('is-loading');
  $("#loading-offers-table, #loading-offers-card").addClass('is-hidden');
  $(".hidden-while-loading-offers, .whats-next-offer").addClass('is-hidden');
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
    }
    else {
      errorMessage(data.message);
    }

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
  });
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
    completed_domains_offers = 0;

    //reset counters
    total_offers = 0;
    total_accepted = 0;
    total_rejected = 0;
    total_outstanding = 0;

    for (var x = 0; x < selected_domain_ids.length; x++){
      var listing_info = getDomainByID(selected_domain_ids[x]);

      //if we havent gotten offers yet
      if (listing_info.offers == undefined || force){
        selected_listings.push(listing_info);
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

//update the offers table
function updateOffersTable(listing_info, total_domains){
  if (listing_info.offers){
    //clone offers
    for (var x = 0; x < listing_info.offers.length; x++){
      var cloned_offer_row = $("#offer-clone").clone();
      cloned_offer_row.removeAttr("id");
      cloned_offer_row.find(".td-offer-domain").text(punycode.toUnicode(listing_info.domain_name));
      cloned_offer_row.find(".td-offer-name").text(listing_info.offers[x].name);
      cloned_offer_row.find(".td-offer-timestamp").text(moment(listing_info.offers[x].timestamp).format("YYYY-MM-DD")).attr("title", moment(listing_info.offers[x].timestamp).format("YYYY-MM-DD HH:mm"));
      cloned_offer_row.attr("id", "offer-row-" + listing_info.offers[x].id);
      cloned_offer_row.data("domain_name", listing_info.domain_name).data("offer", listing_info.offers[x]);

      //price converted
      cloned_offer_row.find(".td-offer-offer").text(formatCurrency(parseFloat(listing_info.offers[x].offer), listing_info.offers[x].offer_currency));
      if (listing_info.offers[x].offer_original){
        cloned_offer_row.find(".td-offer-offer").prepend("<div class='bubble-tooltip icon is-small is-tooltip' data-balloon-length='medium' data-balloon='Converted at " + formatCurrency(1 * multiplier(user.default_currency), listing_info.offers[x].offer_original_currency, 0) + " " + listing_info.offers[x].offer_original_currency.toUpperCase() + " to ~" + formatCurrency(listing_info.offers[x].offer_exchange_rate, user.default_currency) + " " + user.default_currency.toUpperCase() + "' data-balloon-pos='up'><i class='fal fa-question-circle'></i></div>");
      }

      //set listing info
      if (listing_info.offers[x].deposited == 1){
        listing_info.deposited = 1;
      }
      if (listing_info.offers[x].accepted == 1){
        listing_info.accepted = 1;
        total_accepted++;
      }
      else if (listing_info.accepted == null && listing_info.offers[x].accepted == null){
        total_outstanding++;
      }
      else {
        total_rejected++;
      }
      if (listing_info.offers[x].transferred == 1){
        listing_info.transferred = 1;
      }

      total_offers++;

      //accepted an offer!
      if (listing_info.offers[x].deposited == 1 && listing_info.offers[x].transferred != 1){
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
      else if (listing_info.offers[x].accepted == 0 || listing_info.accepted == 1){
        cloned_offer_row.find(".td-offer-status").text('Rejected').addClass('is-danger');
        cloned_offer_row.addClass('rejected-offer unaccepted-offer');
      }
      else {
        cloned_offer_row.find(".td-offer-status").text('Unanswered');
        cloned_offer_row.addClass('unaccepted-offer');
      }

      //click to open modal
      cloned_offer_row.off().on("click", function(){
        editOfferModal($(this).data("offer"), listing_info, total_domains);
      });

      $("#offers-wrapper").prepend(cloned_offer_row);
    }
  }

  completed_domains_offers++;

  //all offers gotten
  if (completed_domains_offers == total_domains){
    finishedOfferTable(total_domains, listing_info);
  }
}

//finish creating offers table
function finishedOfferTable(total_domains, listing_info){
  hideLoadingOffers();
  $("#offer-response-wrapper").removeClass('remove-margin-bottom-content');
  refreshOfferRows($("#offer-search").val(), $("#show-rejected-offers").hasClass('is-primary'));
  if (total_domains == 1){
    var real_listing_info_obj = getListingInfo(listing_info.id);
    if (real_listing_info_obj.accepted || real_listing_info_obj.deposited || real_listing_info_obj.transferred){
      whatsNextOfferView(real_listing_info_obj, true);
    }
    else {
      $("#offers-toolbar").removeClass('is-hidden');
      $("#regular-offer").removeClass("is-hidden");

      //counters
      $("#total-offers").text(pluralizeOffer(total_offers));
      $("#total-accepted").text(pluralizeOffer(total_accepted));
      $("#total-rejected").text(pluralizeOffer(total_rejected));
      $("#total-outstanding").text(pluralizeOffer(total_outstanding));
    }
  }
  else {
    $("#offers-toolbar").removeClass('is-hidden');
    $("#regular-offer").removeClass("is-hidden");

    //counters
    $("#total-offers").text(pluralizeOffer(total_offers));
    $("#total-accepted").text(pluralizeOffer(total_accepted));
    $("#total-rejected").text(pluralizeOffer(total_rejected));
    $("#total-outstanding").text(pluralizeOffer(total_outstanding));
  }
}

//pluralize offers number
function pluralizeOffer(amount){
  return (amount == 1) ? amount + " Offer" : amount + " Offers";
}

//edit modal with specific offer info
function editOfferModal(offer, listing_info, total_domains){
  $("#offer-modal").addClass('is-active');
  $("#offer-response").val("");
  $("#offer-modal-timestamp").text(moment(offer.timestamp).format("YYYY-MM-DD HH:mm"));
  $("#offer-modal-price").text(formatCurrency(parseFloat(offer.offer), offer.offer_currency) + " " + offer.offer_currency.toUpperCase());
  $("#offer-modal-name").text(offer.name);
  $("#offer-modal-email").text(offer.email);
  $("#offer-modal-phone").text(offer.phone);
  $("#offer-modal-ip").text(offer.user_ip).attr("href", "http://whatismyipaddress.com/ip/" + offer.user_ip);
  var offer_message = (offer.message) ? offer.message : "The buyer did not include a message";
  $("#offer-modal-message").text(offer_message);

  //whats next button
  $("#offer-modal-whats-next").addClass('is-hidden');

  //an offer was accepted or rejected! hide the buttons
  if (offer.accepted == 1 || offer.accepted == 0 || listing_info.accepted){
    $("#offer-modal-button-wrapper").removeClass("remove-margin-bottom-content").addClass('is-hidden');
    $("#offer-response-label").removeClass('is-hidden');
    $("#offer-response").val((offer.response) ? offer.response : "You did not include a response.").addClass('is-disabled');
    var accept_or_reject_text = (offer.accepted == 1) ? "Accepted" : "Rejected";
    $("#offer-modal-domain").text(accept_or_reject_text + " offer for " + punycode.toUnicode(listing_info.domain_name));

    //show margin-top for "whats next?"
    $("#offer-response-wrapper").removeClass('remove-margin-bottom-content');

    //only show what's next if we're not selecting only 1
    if (total_domains > 1){
      //accepted and toolbar visible (not already displaying whats next)
      if ((!offer.transferred && offer.accepted && !$("#offers-toolbar").hasClass('is-hidden')) || listing_info.accepted){
        $("#offer-modal-whats-next").removeClass('is-hidden').off().on("click", function(){
          whatsNextOfferView(listing_info);
        });
      }
    }
    else {
      $("#offer-response-wrapper").addClass('remove-margin-bottom-content');
    }
  }
  //not yet accepted
  else {
    $("#offer-modal-button-wrapper").addClass("remove-margin-bottom-content").removeClass('is-hidden');
    $("#offer-modal-domain").text("Offer for " + punycode.toUnicode(listing_info.domain_name));
    $("#offer-response-label").addClass('is-hidden');
    $("#offer-response").val("").removeClass('is-disabled');

    //hide margin on modal
    $("#offer-response-wrapper").removeClass('remove-margin-bottom-content');

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
        $(".resend-offer-email-button").addClass("is-hidden");
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
      if (data.listings){
        updateCurrentListing(data.listings);
      }
      offerSuccessHandler(accept, listing_info, offer, response_to_offerer);
      successMessage(data.message);
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

  //refresh offers
  refreshOfferRows($("#offer-search").val(), $("#show-rejected-offers").hasClass('is-primary'));

  //accepted offer
  if (accept){
    //change class on the offer row
    $("#offer-row-" + offer.id).removeClass('unaccepted-offer').find(".td-offer-status").text('Accepted').addClass('is-primary');
    whatsNextOfferView(real_listing_info_obj);
  }
  //rejected offer
  else {
    //change class on the offer row
    $("#offer-row-" + offer.id).addClass("is-hidden rejected-offer").find(".td-offer-status").text('Rejected').addClass('is-danger');
  }
}

//accepted the offer, unhide the accepted help text
function whatsNextOfferView(listing_info, dont_reselect){
  $("#offer-modal").removeClass('is-active');
  $(".unaccepted-offer").addClass('is-hidden');
  $(".resend-offer-email-button").removeClass("is-hidden");

  //recreate rows and only select this listing if necessary
  if (!dont_reselect){
    createRows([listing_info.id]);
    viewDomainOffers();
  }

  $("#offers-toolbar, .whats-next-offer, #regular-offer").addClass('is-hidden');
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
  if (listing_info.transferred){
    $("#transferred-offer").removeClass('is-hidden');
  }
  else if (listing_info.deposited){
    $("#deposited-offer").removeClass('is-hidden');
    deposit_offer = true;
    var deadline = (offer.deadline) ? moment(new Date(offer.deadline)) : moment(offer.timestamp).add("2", "weeks");
    $("#deposited-deadline").text(deadline.format("YYYY-MM-DD"));
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
  updateEditorStatsButtons();

  //select verified rows here if none selected already
  if (selected_domain_ids.length == 0){
    selectSpecificRows("verified", 1);
    selected_domain_ids = getSelectedDomains("id", true);
  }

  $("#current-view-name").text("My Statistics");
  $(".non-stats-elem").addClass('is-hidden');
  $(".stats-elem").removeClass('is-hidden');
  createStatsTable(selected_domain_ids);
}

//change tabs for stats page
function updateEditorStatsButtons(){
  $("#stats-toolbar .tab").off().on("click", function(e){
    var current_tab = $("#stats-toolbar .tab.is-active").attr("id").replace("-tab", "");
    var new_tab = $(this).attr("id").replace("-tab", "");
    console.log(current_tab, new_tab);

    if (current_tab != new_tab){
      //clear any existing messages
      clearNotification();

      //update tab URL
      updateQueryStringParam("tab", new_tab, true);

      //hide other tab selectors
      $(".tab.verified-elem").removeClass('is-active');
      $(this).addClass('is-active');

      //show this new tab
      showTab(new_tab);
    }
  });
}

//create offer rows
function createStatsTable(selected_domain_ids, force){
  var selected_listings = [];

  //no selected listings to get offers (no verified or no listings)
  if (selected_domain_ids.length == 0){

    //no verified listings
    if (listings.length > 0){

    }
    //no listings
    else {

    }
  }
  else {
    showLoadingStats();
    completed_domains_stats = 0;

    for (var x = 0; x < selected_domain_ids.length; x++){
      var listing_info = getDomainByID(selected_domain_ids[x]);

      //if we havent gotten offers yet
      if (listing_info.stats == undefined || force){
        selected_listings.push(listing_info);
      }
      else {
        updateStatsTable(listing_info, selected_domain_ids.length);
      }
    }
  }

  //if any stats to get
  if (selected_listings.length > 0){
    getListingStats(selected_listings, selected_domain_ids);
  }
}

//loading messages to show while getting stats
function showLoadingStats(){

}

//get stats on a domain
function getListingStats(selected_listings, selected_domain_ids){
  $.ajax({
    url: "/profile/mylistings/stats",
    method: "POST",
    data: {
      selected_listings : selected_listings
    }
  }).done(function(data){
    if (data.state == "success"){
      listings = data.listings;
    }
    else {
      errorMessage(data.message);
    }

    //make offer rows for domains we didnt yet
    for (var x = 0 ; x < selected_listings.length ; x++){
      for (var y = 0 ; y < listings.length ; y++){
        if (listings[y].id == selected_listings[x].id){
          selected_listings[x].stats = listings[y].stats;
          updateStatsTable(selected_listings[x], selected_domain_ids.length);
          break;
        }
      }
    }
  });
}

//update the stats tab
function updateStatsTable(listing_info, total_domains){
  //no stats retrieved yet, show loading
  if (listing_info.stats == undefined){
    showLoadingStats(true);
  }
  //show stats if we have it, hide loading msg
  else {

  }
}

  //<editor-fold>-------------------------------STATS TABLES-------------------------------

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
  $("#current-view-name").html("Verifying");
  if (selected_domain_ids.length > 1){
    $("#current-domain-name").html("&nbsp;- " + selected_domain_ids.length + " Domains");
    $(".verification-plural").text("s");
    $(".verification-domains-plural").text("these domains");
    $("#prev-dns-table-button, #next-dns-table-button").removeClass('is-hidden');
  }
  else {
    var verifying_domain = getDomainByID(selected_domain_ids[0]);
    $("#current-domain-name").html("&nbsp;- " + punycode.toUnicode(verifying_domain.domain_name));
    $(".verification-plural").text("");
    $(".verification-domains-plural").text("this domain");
  }

  //create all tables for each unverified listing
  createDNSRecordRows(selected_domain_ids);
}

//set up verification buttons
function setupVerificationButtons(selected_domain_ids){

  //show next / prev table buttons
  $("#prev-dns-table-button, #next-dns-table-button").off().on("click", function(){
    var upcoming_index = $(".cloned-dns-table:not(.is-hidden)").data("index") + $(this).data("value");
    upcoming_index = (upcoming_index < 0) ? $(".cloned-dns-table").length - 1 : upcoming_index;
    upcoming_index = (upcoming_index > $(".cloned-dns-table").length - 1) ? 0 : upcoming_index;
    $(".cloned-dns-table:not(.is-hidden)").addClass('is-hidden').stop().fadeOut(300, function(){
      $(".cloned-dns-table").eq(upcoming_index).stop().fadeIn(300).removeClass('is-hidden');

      //show auto-DNS button if there is a registrar connected
      updateAutoDNSButton($(".cloned-dns-table").eq(upcoming_index));
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
  $(".verify-hidden-while-loading").addClass("is-hidden");
  $("#refresh-dns-button").addClass('is-loading');

  $("#verification-left").addClass('is-pastel').removeClass('is-primary is-danger');
  $("#verification-left-danger, #verification-left-success").addClass('is-hidden');
  $("#verification-left-load").removeClass('is-hidden');
  $("#verification-left-text").removeClass('is-white').text("Now loading existing DNS records.");

  //loop through and create all tables for each unverified listing
  $(".cloned-dns-table").remove();
  var selected_listings = [];
  for (var x = 0; x < selected_domain_ids.length; x++){
    var listing_info = getDomainByID(selected_domain_ids[x]);

    //get whois and A record data if we haven't yet (or being refreshed)
    if (listing_info.a_records == undefined || listing_info.whois == undefined || force){
      selected_listings.push({
        domain_name : listing_info.domain_name,
        id : selected_domain_ids[x],
        registrar_id : listing_info.registrar_id,
        client_index : x
      });
    }
    else {
      createDNSTable(listing_info, selected_domain_ids.length, x);
    }
  }

  //if we need to get any DNS records, get them in one call
  if (selected_listings.length > 0){
    getDNSRecords(selected_listings, selected_domain_ids, true, function(data){
      if (data.state == "success"){
        listings = data.listings;
      }

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
    });
  }
}

//get DNS settings at once for all selected domains (and unknown DNS)
function getDNSRecords(selected_listings, selected_domain_ids, get_a, cb){
  $.ajax({
    url: "/profile/mylistings/dnsrecords",
    method: "POST",
    data: {
      selected_listings : selected_listings,
      get_a : get_a
    }
  }).done(function(data){
    cb(data);
  });
}

//update the registrar URL if there is one
function createDNSTable(listing_info, total_unverified, row_index){
  var cloned_table = $("#current-dns-table-clone").clone().removeAttr('id').attr("id", "dns-table" + row_index).addClass("cloned-dns-table").data("index", row_index);
  var cloned_a_row = cloned_table.find(".doma-a-record");
  var cloned_www_row = cloned_table.find(".doma-www-record");

  //should show auto DNS button
  cloned_table.data("show_auto", listing_info.registrar_id != null);

  var clipped_domain_name = (listing_info.domain_name.length > 25) ? listing_info.domain_name.substr(0, 15) + "..." + listing_info.domain_name.substr(listing_info.domain_name.length - 7, listing_info.domain_name.length - 1) : listing_info.domain_name;

  //table header text
  var table_header_text = "<span class='is-hidden-mobile'>Current DNS Settings for </span><span>" + punycode.toUnicode(clipped_domain_name) + "</span>";
  if (total_unverified > 1){
    table_header_text = "<span class='is-hidden-mobile'>Domain " + (row_index + 1) + " / " + total_unverified + " - </span>" + table_header_text;
  }
  if (listing_info.whois){
    var reg_name = (listing_info.whois["Registrar"] && listing_info.whois["Registrar"].length > 25) ? listing_info.whois["Registrar"].substr(0, 25) + "..." : listing_info.whois["Registrar"];
    var reg_url = listing_info.whois["Registrar URL"];
    var regex_url = /^((http|https):\/\/)/;
    if (!regex_url.test(reg_url)) { reg_url = "http://" + reg_url; }
    if (reg_name && reg_url){
      table_header_text += " (<a target='_blank' class='is-bold is-primary' href='" + reg_url + "'>" + reg_name + "</a>)";
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
    $(".verify-hidden-while-loading").removeClass('is-hidden');

    //figure out hiding or show next/prev buttons
    if (total_unverified > 1){
      $("#prev-dns-table-button, #next-dns-table-button").removeClass('is-hidden');
    }
    else {
      $("#prev-dns-table-button, #next-dns-table-button").addClass('is-hidden');
    }

    $("#refresh-dns-button").removeClass('is-loading');
    $("#loading-dns-table").addClass('is-hidden');

    //sort by selected index
    $(".cloned-dns-table").sort(function(a, b){
      return ($(a).data("index") < $(b).data("index")) ? -1 : ($(a).data("index") > $(b).data("index")) ? 1 : 0;
    }).appendTo("#current-dns-tables");

    //show the first unfinished
    if ($(".cloned-dns-table .is-danger").length){
      $(".cloned-dns-table .is-danger").closest(".cloned-dns-table").eq(0).removeClass('is-hidden');
    }
    else {
      $(".cloned-dns-table").eq(0).removeClass('is-hidden');
    }

    //show auto-DNS button if there is a registrar connected
    updateAutoDNSButton($(".cloned-dns-table:not(.is-hidden)"));

    //all DNS settings are good
    $("#verification-left-load").addClass('is-hidden');
    if ($(".cloned-dns-table .needs-action-row").length == 0){
      $("#verify-button").removeClass('is-hidden');
      $("#refresh-dns-button").addClass('is-hidden');
      $("#verification-left").addClass('is-primary').removeClass('is-danger is-pastel');
      $("#verification-left-success").removeClass('is-hidden');
      $("#verification-left-text").addClass('is-white').text("All DNS settings look good! Please click the verify now button!");
    }
    else {
      $("#verify-button").addClass('is-hidden');
      $("#refresh-dns-button").removeClass('is-hidden');
      $("#verification-left").addClass('is-danger').removeClass('is-primary is-pastel');
      $("#verification-left-danger").removeClass('is-hidden');
      $("#verification-left-text").addClass('is-white').text("You have " + $(".cloned-dns-table .needs-action-row").length + " entries left to modify.");
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
      if (data.listings){
        listings = data.listings;
      }
      successMessage("Successfully verified " + verify_ids.length + " listings!");
      createRows();
      showSelector(true);
    }
    //unverified listings error
    else if (data.unverified_listings){
      errorMessage("Failed to verify listings! Were you able to make the necessary changes? Sometimes DNS changes can take up to 72 hours. Please try again at a later time.");
      createDNSRecordRows(data.unverified_listings, true);    //refresh the domain DNS tables
    }
    else {
      errorMessage(data.message);
    }
  });
}

//show auto-DNS button if there is a registrar connected
function updateAutoDNSButton(cloned_dns_table){
  if (cloned_dns_table.data("show_auto")){
    $("#auto-dns-button").removeClass("is-hidden").off().on("click", function(){

      //attempt to automatically make DNS changes via connected registrar
      $("#auto-dns-button").addClass('is-loading');
      var verify_ids = getSelectedDomains("id", false);
      $.ajax({
        url: "/profile/mylistings/verify/auto",
        method: "POST",
        data: {
          ids: verify_ids
        }
      }).done(function(data){
        $("#auto-dns-button").removeClass('is-loading');
        if (data.state == "success"){
          if (data.listings){
            listings = data.listings;
          }

          var success_msg_text = "";
          var pluralizer = function(number){
            return (number == 1) ? "a domain" : number + " domains";
          }
          var was_there_error = false;
          var was_there_success = false;

          //verified
          if (data.verified_ids && data.verified_ids.length > 0){
            success_msg_text += "Successfully verified " + pluralizer(data.verified_ids.length) + "!";
            was_there_success = true;
          }
          if (data.pending_dns_ids && data.pending_dns_ids.length > 0){
            success_msg_text += "Successfully changed DNS settings for " + pluralizer(data.pending_dns_ids.length) + "! It may take up to 72 hours for the changes to take effect. In the meanwhile, please feel free to edit your listing details.";
            was_there_success = true;
          }
          //unchanged DNS settings
          if (data.dns_unchanged_listing_ids && data.dns_unchanged_listing_ids.length > 0){
            success_msg_text += "Failed to change DNS settings for " + pluralizer(data.dns_unchanged_listing_ids.length) + ". Please make the changes manually to verify ownership.";
            was_there_error = true;
          }

          //success or info or error message
          if (was_there_error && was_there_success){
            infoMessage(success_msg_text);
          }
          else if (was_there_error){
            errorMessage(success_msg_text);
          }
          else {
            successMessage(success_msg_text);
          }

          //if any success, show selector
          if (was_there_success && !was_there_error){
            createRows();
            showSelector(true);
          }
          //if only error, refresh tables
          else {
            createDNSRecordRows(data.dns_unchanged_listing_ids, true);
          }
        }
        else {
          errorMessage(data.message);
        }

      });
    });
  }
  else {
    $("#auto-dns-button").addClass("is-hidden").off();
  }
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
    if (listing_ids.indexOf(item.id) != -1){    //common parameters of selected listings only
      if (arr === false){                       //first object, set it
        arr = Object.assign({}, item);
      }
      else {                                    //object afterwards (compare)
        for (var x in item){
          //categories special case
          if (x == "categories" && item[x] == arr[x] && arr[x]){
            arr[x] = arr[x].split(" ").filter(function(n){
              return item[x].split(" ").indexOf(n) != -1
            }).join(" ");
          }

          //expenses special case
          else if (x == "expenses" && typeof item[x] != "undefined" && item[x] != null){

            //if existing expenses obj is an array (expenses exist already)
            if (Array.isArray(arr[x]) && Array.isArray(item[x])){
              var temp_expenses = [];
              for (var y = 0 ; y < arr[x].length ; y++){
                var temp_expense_ids = [];
                for (var z = 0 ; z < item[x].length ; z++){
                  if (arr[x][y].expense_name == item[x][z].expense_name &&
                      arr[x][y].expense_date == item[x][z].expense_date &&
                      arr[x][y].expense_cost == item[x][z].expense_cost
                  ){
                    temp_expense_ids.push(arr[x][y].id, item[x][z].id);
                  }
                }

                //if something was the same!
                if (temp_expense_ids.length != 0){
                  var temp_expense = {
                    expense_ids : temp_expense_ids,
                    expense_name : arr[x][y].expense_name,
                    expense_date : arr[x][y].expense_date,
                    expense_cost : arr[x][y].expense_cost
                  }

                  //add to the expenses object
                  temp_expenses.push(temp_expense);
                }
              }
              arr[x] = temp_expenses;
            }
            else {
              arr[x] = null;
            }
          }

          //different, make it null
          else if (item[x] != arr[x]){
            arr[x] = null;
          }
        }
      }
    }
    return arr;
  }, false);
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
