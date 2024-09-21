$(document).ready(function() {

  //#region -------------------------------ACCOUNT TAB-------------------------------

    //#region -------------------------------ACCOUNT INFO-------------------------------

    //to show submit/cancel when data changes for account inputs
    $(".account-input").on("input", function(e){
      var this_val = $(this).val();
      var existing_val = (user[$(this).data("uservar")]) ? user[$(this).data("uservar")] : "";

      //show only if different
      if (this_val != existing_val){
        $("#account-submit, #cancel-button").removeClass("is-hidden");
      }
      else {
        clearNotification();
        hideSaveCancelButtons();
      }
    });

    //to submit any changes
    $("#account-details-form").on("submit", function(e){
      e.preventDefault();
      submitChanges({
        new_email: $("#email-input").val(),
        username: $("#username-input").val(),
        ga_tracking_id: $("#ga_tracking_id-input").val(),
      });
    });

    //to cancel any changes
    $("#cancel-button").on("click", function(e){
      cancelChanges();
    });

    //#endregion

    //#region -------------------------------PASSWORD CHANGE-------------------------------

    //change password modal
    $("#change-password-button").on("click", function(){
      clearNotification();
      $("#change-password-modal").addClass('is-active');
      $("#old-pw-input").focus();
    });

    //submit password change
    $("#password-form").on("submit", function(e){
      e.preventDefault();
      submitChanges(checkAccountPassword());
    });

    //#endregion

    //#region -------------------------------CONNECT A REGISTRAR-------------------------------

    updateRegistrars();

    //#endregion

    //#region -------------------------------EXPORT LISTINGS DATA-------------------------------

    //export all listings details
    $("#csv-export-button").on("click", function(){
      $(this).addClass("is-loading");
      let csvContent = "";
      var headers = [
        "domain_name",
        "status",
        "date_created",
        "date_expire",
        "date_registered",
        "rentable",
        "price_type",
        "price_rate",
        "buy_price",
        "min_price",
        "default_currency",
        "description",
        "description_footer",
        "description_footer_link",
        "categories",
        "paths",
        "background_image",
        "background_color",
        "logo",
        "primary_color",
        "secondary_color",
        "tertiary_color",
        "font_name",
        "font_color",
        "footer_background_color",
        "footer_color",
        "show_registrar",
      	"show_registration_date",
      	"show_godaddy_appraisal",
      	"show_domainindex_appraisal",
      	"show_freevaluator_appraisal",
      	"show_estibot_appraisal",
      	"show_categories",
      	"show_social_sharing",
      	"show_placeholder",
      	"show_traffic_graph",
      	"show_alexa_stats",
      	"show_history_ticker",
      	"show_domain_list",
        "registrar_name",
        "registrar_cost",
        "registrar_cost_currency",
        "registrar_admin_name",
        "registrar_admin_org",
        "registrar_admin_email",
        "registrar_admin_address",
        "registrar_admin_phone",
        "registrar_registrant_name",
        "registrar_registrant_org",
        "registrar_registrant_email",
        "registrar_registrant_address",
        "registrar_registrant_phone",
        "registrar_tech_name",
        "registrar_tech_org",
        "registrar_tech_email",
        "registrar_tech_address",
        "registrar_tech_phone",
        "hub",
        "hub_title",
        "hub_email",
        "hub_layout_count",
        "hub_layout_type",
      ]

      //create headers
      csvContent += headers.join(",") +"\r\n";

      user.listings.forEach(function(row){
        var row_details = [];
        for (var x = 0; x < headers.length; x++){
          //format dates before pushing
          if (row[headers[x]] && ["date_created", "date_expire", "date_registered"].indexOf(headers[x]) != -1){
            row_details.push(moment(row[headers[x]]).format("YYYY/MM/DD hh:mm A"));
          }
          //format currency before pushing
          else if (row[headers[x]] && ["price_rate", "buy_price", "min_price"].indexOf(headers[x]) != -1){
            if (row["default_currency"]){
              row_details.push(formatCurrency(row[headers[x]], row["default_currency"]));
            }
            else {
              row_details.push(formatCurrency(row[headers[x]], user.default_currency));
            }
          }
          else if (row[headers[x]] && headers[x] == "description"){
            row_details.push(row[headers[x]].replace(/(\r\n\t|\n|\r\t)/gm,""));
          }
          //format registrar cost currency before pushing
          else if (row[headers[x]] && headers[x] == "registrar_cost"){
            if (row["registrar_cost_currency"]){
              row_details.push(formatCurrency(row[headers[x]], row["registrar_cost_currency"]));
            }
            else {
              row_details.push(formatCurrency(row[headers[x]], user.default_currency));
            }
          }
          else {
            row_details.push(row[headers[x]]);
          }
        }
        csvContent += '"' + row_details.join('","') +'"\r\n';
      });

      //download
      var downloadLink = document.createElement("a");
      var blob = new Blob(["\ufeff", csvContent]);
      var url = URL.createObjectURL(blob);
      downloadLink.href = url;
      downloadLink.download = "DomaHub_Export_" + user.username + ".csv";  //Name the file here
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      $(this).removeClass("is-loading");
    });

    //#endregion

  //#endregion

  //#region -------------------------------PREMIUM TAB-------------------------------

    //#region -------------------------------STRIPE SET UP-------------------------------

    if (typeof Stripe != "undefined"){
      if (window.location.hostname == "localhost"){
        Stripe.setPublishableKey('pk_test_kcmOEkkC3QtULG5JiRMWVODJ');
      }
      else {
        Stripe.setPublishableKey('pk_live_506Yzo8MYppeCnLZkW9GEm13');
      }
    }

    setupUpgradeTab();

    //#endregion

    //#region -------------------------------CREDIT CARD CHANGE-------------------------------

    //format stripe cc icons
    $("#credit-card-form").find(".input").on("change keyup paste", function(){
      errorMessage(false);

      var card_type = $.payment.cardType($("#cc-num").val());
      if (card_type == "dinersclub") { card_type = "diners-club"}
      if (["maestro", "unionpay", "forbrugsforeningen", "dankort"].indexOf(card_type) != -1){ card_type = null}

      //show appropriate card icon
      if ($(".fal-cc-" + card_type) && card_type){
        $("#cc-icon").attr("data-icon", "cc-" + card_type);
      }
      //or show default
      else {
        $("#cc-icon").attr("data-icon", "credit-card");
      }
    });

    //click to show CC form modal if they want to change card (or add a new card)
    $("#change-card-button").on("click", function(){
      clearNotification();
      $("#credit-card-modal").addClass('is-active');
      $('#cc-num').focus();
    });

    //click to delete existing card
    $("#delete-card-button").on("click", function(){
      clearNotification();
      if (!user.stripe_subscription || (user.stripe_subscription && user.stripe_subscription.cancel_at_period_end)){
        submitDeleteCustomerCard();
      }
      else {
        setupCancelPremiumModal(true);
      }
    });

    //submit credit card form
    $("#credit-card-form").on("submit", function(e){
      e.preventDefault();
      submitForToken();
    });

    //#endregion

    //#region -------------------------------UPGRADE TO PREMIUM-------------------------------

    //upgrade to premium with existing credit card
    $("#upgrade-button").on("click", function(){
      submitPremium($(this), false, false);
    });

    //upgrade to premium with existing credit card (annual)
    $("#upgrade-button-annual").on("click", function(){
      submitPremium($(this), false, true);
    });

    //renew premium with existing credit card
    $("#renew-premium-button").on("click", function(){
      submitPremium($(this), true);
    });

    //button to show cancel premium modal
    $("#cancel-premium-confirm-button").on("click", function(){
      setupCancelPremiumModal(false);
    });

    //#endregion

    //#region -------------------------------PROMO CODE-------------------------------

    $("#refresh-referral-table-button").on('click', function(e){
      getReferrals();
    });

    //submit promo code
    $("#promo-form").on('submit', function(e){
      e.preventDefault();
      $("#promo-submit").addClass('is-loading');
      clearNotification();
      $.ajax({
        url: "/profile/promocode",
        method: "POST",
        data: {
          code : $("#promo-input").val()
        }
      }).done(function(data){
        $("#promo-submit").removeClass('is-loading');
        $("#promo-input").val("");
        if (data.state == "success"){
          if (data.user){
            user = data.user;
          }
          getReferrals();
          var subscription_exists_text = (user.stripe_subscription_id) ? "Your free month will be applied on the next applicable pay cycle." : "Please upgrade to Premium to receive your free month.";
          successMessage("Successfully applied promo code! " + subscription_exists_text);
        }
        else {
          errorMessage(data.message);
        }
        setupUpgradeTab();
      });
    });

    //#endregion

    //#region -------------------------------REFERRAL-------------------------------

    referralLinkCopy();

    //#endregion

  //#endregion

  //#region -------------------------------PAYMENT TAB-------------------------------

    //#region -------------------------------PERSONAL INFORMATION-------------------------------

    //fill out stripe info
    prefillStripeInfo();

    //set up phone
    $("#phone_number-input").intlTelInput({
      utilsScript: "/js/jquery/utils.js"
    });

    //to show submit/cancel when data changes for stripe inputs
    $(".stripe-account-input").on("input", function(e){
      clearNotification();
      hideSaveCancelButtons();

      //the value to check against the existing value
      if ($(this).attr("name") == "business_name_override"){
        var value_to_check = ($(this).prop("checked")) ? "on" : "off";
        $(this).val(value_to_check);
      }
      else {
        var value_to_check = $(this).val();
      }

      if (!user.stripe_account_id || value_to_check != user.stripe_account[$(this).data("uservar")]){
        $("#stripe-account-submit, #cancel-button").removeClass("is-hidden");
      }
    });

    //stripe form submit (personal info)
    $("#stripe-personal-form").on("submit", function(e){
      e.preventDefault();
      $("#stripe-account-submit").addClass('is-loading');
      clearNotification();

      //replace phone number with correct format
      var data = $(this).serializeArray();
      for (var x = 0; x < data.length; x++){
        if (data[x].name == "phone_number"){
          data[x].value = $("#phone_number-input").intlTelInput("getNumber");
        }
      }

      $.ajax({
        url: "/profile/payout",
        method: "POST",
        data: $.param(data)
      }).done(function(data){
        hideSaveCancelButtons();
        if (data.state == "success"){
          if (data.user){
            user = data.user;
          }
          successMessage("Successfully updated account settings!");
          prefillStripeInfo();
        }
        else {
          errorMessage(data.message);
        }
      });
    });

    //#endregion

    //#region -------------------------------BANK INFORMATION-------------------------------

    //change the bank forms based on country
    $("#currency-input").on("change", function(e){
      changeBankCountry($(this).val());
    });

    //click to show bank account modal if they want to change bank (or add a new bank)
    $("#change-bank-button").on("click", function(){
      clearNotification();
      $("#change-bank-modal").addClass('is-active');
    });

    //submit bank information
    $("#stripe-bank-form").on("submit", function(e){
      e.preventDefault();
      $("#stripe-bank-submit").addClass('is-loading');
      var bank_info = {
        country: $('#bank_country-input').val(),
        currency: $('#currency-input').val(),
        account_number: $('#account_number-input').val()
      }

      //different routing number according to country codes
      if ($("#account_routing-wrapper").is(":visible")) {
        bank_info.routing_number = $('#account_routing-input').val().toString() + $('#account_routing2-input').val().toString();
      }
      if ($("#account_routing3-wrapper").is(":visible")) {
        bank_info.account_holder_name = $('#account_routing3-input').val().toString();
      }

      //create stripe token
      Stripe.bankAccount.createToken(bank_info, function(status, response){
        if (status != 200){
          $("#stripe-bank-submit").removeClass('is-loading');
          errorMessage(response.error.message);
        }
        else {
          //submit to server
          if (user.stripe_bank){
            //create for first time
            submitBank(response.id);
          }
          else {
            //update default bank info
            submitBank(response.id, true);
          }
        }
      });
    });

    //#endregion

    //#region -------------------------------CURRENCY-------------------------------

    //change default currency
    $("#default_currency-input").on("input", function(){
      clearNotification();
      hideSaveCancelButtons();
      if ($("#default_currency-input").val() != user.default_currency){
        $("#currency-submit, #cancel-button").removeClass('is-hidden');
      }
    });

    //submit payments contact form
    $("#currency-form").submit(function(e){
      e.preventDefault();
      submitChanges({
        default_currency: $("#default_currency-input").val().toLowerCase(),
      });
    });

    //#endregion

    //#region -------------------------------PAYMENTS-------------------------------

    //account payments
    $(".account-payments-input").on("input", function(){
      clearNotification();
      hideSaveCancelButtons();
      if ($("#bitcoin_address-input").val() != user.bitcoin_address ||
          $("#paypal_email-input").val() != user.paypal_email ||
          $("#payoneer_email-input").val() != user.payoneer_email){
        $("#payments-submit, #cancel-button").removeClass('is-hidden');
      }
    });

    //submit payments contact form
    $("#payments-form").submit(function(e){
      e.preventDefault();
      submitChanges({
        paypal_email: $("#paypal_email-input").val().toLowerCase(),
        // payoneer_email: $("#payoneer_email-input").val().toLowerCase(),
        // bitcoin_address: $("#bitcoin_address-input").val().toLowerCase()
      });
    });

    //#endregion

  //#endregion

  //#region -------------------------------SHOW TAB-------------------------------

    //function that runs when back button is pressed
    window.onpopstate = function(event) {
      showSectionByURL();
    }

    //show section depending on url
    showSectionByURL();

    //show red notification indication next to tab
    if (!user.stripe_account){
      $("#payment-tab .stripe-required-info").removeClass('is-hidden');
      $("#stripe-personal-form").children(".card").removeClass('is-danger');
    }

    //add to history object depending on which table i clicked
    $(".tab").click(function(e){
      e.preventDefault();

      var temp_id = $(this).attr("id");
      temp_id = temp_id.substr(0, temp_id.length - 4);
      if(history.pushState) {
        history.pushState(null, null, '#' + temp_id);
      }
      else {
        location.hash = '#' + temp_id;
      }
      showSection(temp_id);
    });

    //reset password inputs on modals close
    $(".modal-close, .modal-background, .cancel-modal").on("click", function(){
      cancelChanges();
    });
    $(document).on("keyup", function(e) {
      if (e.which == 27) {
        cancelChanges();
      }
    });

    //#endregion

});

//#region -------------------------------SHOW TAB-------------------------------

//show a specific section
function showSection(section_id){
  clearNotification();
  cancelChanges();
  $(".tab").removeClass("is-active");
  $("#" + section_id + "-tab").addClass("is-active");
  var temp_section = $("#" + section_id);
  $(".drop-tab").not(temp_section).addClass("is-hidden");
  temp_section.removeClass("is-hidden");

  //get AJAX for referrals if we havent yet
  if (section_id == "premium") {

    //get referrals
    if (!user.referrals){
      getReferrals();
    }
    else {
      createReferralsTable();
    }

    //if not premium, highlight upgrade left nav
    if (!user.stripe_subscription_id || !user.stripe_subscription || user.stripe_subscription.cancel_at_period_end == true){
      $(".left-tab").removeClass('is-active');
      $("#nav-premium-link").addClass('is-active');
    }
  }
}

//show a specific section when loading the page;
function showSectionByURL(){
  $('.nav-drop').addClass('is-hidden');   //for hiding the notification bubble when already on this page
  var temp_hash = location.hash.split("#")[1];
  var array_of_ids = $(".drop-tab").map(function(index) {
    return $(this).attr("id");
  }).toArray();

  if (array_of_ids.indexOf(temp_hash) == -1){
    showSection("account");
    window.history.replaceState({}, "", "/profile/settings#account");
  }
  else {
    showSection(temp_hash);
  }
}

//#endregion

//#region -------------------------------ACCOUNT TAB-------------------------------

  //prefills all domahub account info
  function prefillAccountInfo(){
    $(".account-input").each(function(){
      $(this).val(user[$(this).data("uservar")]);
    });
  }

  //#region -------------------------------SUBMIT ACCOUNT CHANGES-------------------------------

  //submit account changes AJAX
  function submitChanges(submit_data){
    if (submit_data){
      $(".toolbar-submit-button").addClass('is-loading');
      clearNotification();
      $.ajax({
        url: "/profile/settings",
        method: "POST",
        data: submit_data
      }).done(function(data){
        hideSaveCancelButtons();
        closeModals();
        if (data.state == "success"){
          if (data.user){
            user = data.user;
          }
          successMessage("Successfully updated account settings!");
        }
        else {
          if (data.message == "invalid-ga-tracking"){
            errorMessage("Please provide a valid Google Analytics tracking ID! For instructions on how to get your tracking ID, please <a href='https://support.google.com/analytics/answer/1008080?hl=en#trackingID' class='is-underlined'>click here</a>.");
          }
          else {
            errorMessage(data.message);
          }
        }

        prefillAccountInfo();
      });
    }
  }

  //check new account passwords
  function checkAccountPassword(){
    //if new passwords do not match
    if ($("#new-pw-input").val() != $("#verify-pw-input").val()){
      errorMessage("Your new passwords do not match!");
    }
    else {
      return {
        password: $("#old-pw-input").val(),
        new_password: ($("#new-pw-input").val() == "") ? undefined : $("#new-pw-input").val()
      };
    }
  }

  //cancel changes
  function cancelChanges(){
    clearNotification();
    hideSaveCancelButtons();
    prefillAccountInfo();
    prefillStripeInfo();
    closeModals();
  }

  //#endregion

//#endregion

//#region -------------------------------PREMIUM TAB-------------------------------

  //#region -------------------------------SET UP PREMIUM TAB CARD-------------------------------

  //set up upgrade card appearance
  function setupUpgradeTab(){
    //format all stripe inputs
    $('#cc-num').val("").payment('formatCardNumber');
    $('#cc-exp').val("").payment('formatCardExpiry');
    $('#cc-cvc').val("").payment('formatCardCVC');
    $('#cc-zip').val("").payment('restrictNumeric');

    //hide modal
    $(".modal").removeClass('is-active');

    //is already premium
    if (user.stripe_subscription_id && user.stripe_subscription){

      //premium payments history
      if (user.stripe_customer && user.stripe_customer.invoices){
        setupPaymentsHistory();
      }

      //show and hide premium/basic stuff
      $(".basic-elem").addClass('is-hidden');
      $(".premium-elem").removeClass('is-hidden');
      $("#premium-header").removeClass('no-border-bottom');

      $("#subscription-end-date").text(" on " + moment(user.stripe_subscription.current_period_end).format("YYYY-MM-DD"));

      //expiring
      if (user.stripe_subscription.cancel_at_period_end == true){

        //show notification that premium is expiring
        $("#premium-expire-notification").removeClass('is-hidden');
        $("#premium-card-header").addClass('no-border-bottom');

        //left nav and tab text
        $("#upgrade-to-premium-text, #upgrade-tab-header").text("Upgrade to Premium");
        $("#nav-premium-link").removeClass('is-hidden');

        var exp_date_text = moment(user.stripe_subscription.current_period_end).format("YYYY-MM-DD")
        $(".exp-date-text").text(exp_date_text);
        $("#next-charge-tip").text("You will not be charged further for this account.");

        //not renewing, so hide the cancel button
        $("#cancel-premium-confirm-button").addClass("is-hidden");

        //show button click to renew subscription
        if (user.stripe_customer && user.stripe_customer.brand && user.stripe_customer.last4){
          $("#renew-premium-button").removeClass("is-hidden");
          var status_text = "Please press the button to renew your Premium account."
        }
        else {
          $("#renew-premium-button").addClass("is-hidden");
          var status_text = "Please add a default payment method to renew your Premium account."
        }

        $("#renew-status").text(status_text);
        $(".upgrade-button").addClass('is-hidden');
      }
      //not expiring, show cancel button
      else {
        //hide notification that premium is expiring
        $("#premium-expire-notification").addClass('is-hidden');
        $("#premium-card-header").removeClass('no-border-bottom');

        //left nav and tab text
        $("#upgrade-to-premium-text, #upgrade-tab-header").text("Premium Status");
        $("#nav-premium-link").addClass('is-hidden');

        $("#renew-status").text("Premium is currently active! Press the button to cancel renewal.");

        //next charge (invoice)
        setupNextChargeTip();

        //renewing, so hide the renew button
        $("#renew-premium-button").addClass("is-hidden").removeClass('is-loading');

        //show button to cancel subscription
        $("#cancel-premium-confirm-button").removeClass("is-hidden");
        $(".upgrade-button").addClass('is-hidden');
      }
    }
    else {
      $("#upgrade-to-premium-text, #upgrade-tab-header").text("Upgrade to Premium");

      //show and hide premium/basic stuff
      $("#premium-header").addClass('no-border-bottom');
      $(".basic-elem").removeClass('is-hidden');
      $(".premium-elem").addClass('is-hidden');

      //hide notification that premium is expiring
      $("#premium-expire-notification").addClass('is-hidden');
      $("#premium-card-header").addClass('no-border-bottom');

      //has a credit card on file, but no premium
      if (user.stripe_customer && user.stripe_customer.brand && user.stripe_customer.last4){
        $("#renew-status").text("Choose a payment plan to upgrade!");
        $(".upgrade-button").removeClass('is-hidden');
      }
      else {
        $("#renew-status").text("Add a new card to upgrade to a Premium account!");
        $(".upgrade-button").addClass('is-hidden');
      }
    }

    if (user.stripe_customer){

      //user has a credit card on file!
      if (user.stripe_customer.brand && user.stripe_customer.last4){
        $("#delete-card-button").removeClass('is-hidden');
        $("#change-card-button span:nth-child(2)").text("Change Card");

        //last 4 digits
        var premium_cc_last4 = (user.stripe_customer.last4) ? user.stripe_customer.last4 : "****";
        var premium_cc_brand = (user.stripe_customer.brand) ? user.stripe_customer.brand : "Credit"
        $(".existing-cc").removeClass('is-hidden').text("Current card - " + premium_cc_brand + " ending in " + premium_cc_last4);
      }
      else {
        $("#delete-card-button").addClass('is-hidden');
        $("#change-card-button span:nth-child(2)").text("Add A New Card");
        $(".existing-cc").text("");
        $(".tip.existing-cc").text("Click the button to add a default credit card!");

        //show notification that premium is expiring if they have a subscription
        if (user.stripe_subscription){
          $("#premium-expire-notification").removeClass('is-hidden');
        }
      }

    }

  }

  //set up payments history card
  function setupPaymentsHistory(){
    $("#payments-history-card").removeClass('is-hidden');
    $("#premium-upgrade-card").removeClass("remove-margin-bottom-content");
    $("#payment-history-body .payment-history-row:not(#payment-history-clone)").remove();

    if (user.stripe_customer.invoices.length){
      for (var x = 0 ; x < user.stripe_customer.invoices.length ; x++){
        var payment_row = $("#payment-history-clone").clone().removeAttr("id").removeClass('is-hidden');
        payment_row.find(".payment-history-date").text(moment(user.stripe_customer.invoices[x].created).format("YYYY-MM-DD")).attr("title", moment(user.stripe_customer.invoices[x].created).format("YYYY-MM-DD HH:mm"));
        payment_row.find(".payment-history-amount").html((user.stripe_customer.invoices[x].amount) ? formatCurrency(user.stripe_customer.invoices[x].amount, "usd") : "<del>" + formatCurrency(user.stripe_customer.invoices[x].subtotal, "usd") + "</del> Free!");
        $("#payment-history-body").append(payment_row);
      }
    }
    else {
      var payment_row = $("#payment-history-clone").clone().removeAttr("id").removeClass('is-hidden');
      payment_row.find(".payment-history-date").text(moment(user.stripe_subscription.created).format("YYYY-MM-DD")).attr("title", moment(user.stripe_subscription.created).format("YYYY-MM-DD HH:mm"));
      payment_row.find(".payment-history-amount").text("Free!");
      $("#payment-history-body").append(payment_row);
    }
  }

  //set up cancel premium modal
  function setupCancelPremiumModal(delete_card){
    clearNotification();
    $("#cancel-premium-modal").addClass('is-active');

    var total_active_listings = user.listings.filter(function(listing){
      return listing.status == 1;
    }).length

    //figure out what the user will lose from cancelling premium
    if (total_active_listings > 100){
      $("#premium-cancel-disable-wrapper").append("<li>" + (total_active_listings - 100)+ " listings will be disabled.");
    }

    //confirm deletion of card
    if (delete_card){
      $(".delete-card-description").removeClass('is-hidden');
      $(".cancel-premium-description").addClass('is-hidden');

      //click to delete card (modal confirm button)
      $("#cancel-premium-button").off().on("click", function(){
        submitDeleteCustomerCard();
        $("#cancel-premium-button").addClass('is-disabled');
        cancelChanges();
      });

      //confirm delete card by typing delete
      $("#cancel-confirmation-input").off().on('input', function(){
        if ($(this).val() == "DELETE"){
          $("#cancel-premium-button").removeClass('is-disabled');
        }
        else {
          $("#cancel-premium-button").addClass('is-disabled');
        }
      });
    }
    //confirm cancel subscription
    else {
      $(".delete-card-description").addClass('is-hidden');
      $(".cancel-premium-description").removeClass('is-hidden');

      //click to delete card (modal confirm button)
      $("#cancel-premium-button").off().on("click", function(){
        submitCancelPremium();
        $("#cancel-premium-button").addClass('is-disabled');
        cancelChanges();
      });

      //confirm cancel premium by typing cancel
      $("#cancel-confirmation-input").off().on('input', function(){
        if ($(this).val() == "CANCEL"){
          $("#cancel-premium-button").removeClass('is-disabled');
        }
        else {
          $("#cancel-premium-button").addClass('is-disabled');
        }
      });
    }
  }

  //set up next invoice charge
  function setupNextChargeTip(){
    if (user.stripe_customer && user.stripe_customer.upcoming_invoice){
      var next_charge_text = "Your upcoming charge of " + formatCurrency(user.stripe_customer.upcoming_invoice.subtotal, "usd") + " on " + moment(user.stripe_customer.upcoming_invoice.date).format("YYYY-MM-DD");
      if (user.stripe_customer.upcoming_invoice.amount_due > 0){
        next_charge_text += " will be posted to your " + user.stripe_customer.brand + " card ending in " + user.stripe_customer.last4 + "."
      }
      else {
        next_charge_text += " will be waived thanks to your promotional credits!";
      }
      $("#next-charge-tip").text(next_charge_text);
    }
  }

  //#endregion

  //#region -------------------------------CREDIT CARD CHANGE-------------------------------

  //submit to Stripe for a new token
  function submitForToken(){
    $("#submit-card-button").addClass('is-loading');
    if (typeof Stripe == "undefined"){
      $("#submit-card-button").removeClass('is-loading');
      errorMessage("Something went wrong with your payment details. Please refresh the page and try again.");
    }
    else {
      Stripe.card.createToken($("#credit-card-form"), function(status, response){
        if (response.error){
          $("#submit-card-button").removeClass('is-loading');
          errorMessage(response.error.message);
        }
        else {
          //all good, submit stripetoken and listing id to dh server
          submitCustomerCard(response.id);
        }
      });
    }
  }

  //submit for a new CC (or change existing)
  function submitCustomerCard(stripeToken){
    clearNotification();
    $.ajax({
      url: "/profile/newcard",
      method: "POST",
      data: {
        stripeToken : stripeToken
      }
    }).done(function(data){
      $("#submit-card-button").removeClass('is-loading');

      if (data.state == "success"){
        if (data.user){
          user = data.user;
        }
        successMessage("Successfully changed the default payment method for a Premium account!");
      }
      else {
        errorMessage(data.message);
      }

      setupUpgradeTab();
    });
  }

  //submit to delete existing CC
  function submitDeleteCustomerCard(){
    $("#delete-card-button").addClass('is-loading');
    $.ajax({
      url: "/profile/deletecard",
      method: "POST"
    }).done(function(data){
      $("#delete-card-button").removeClass('is-loading');
      if (data.state == "success"){
        if (data.user){
          user = data.user;
        }
        successMessage("Successfully removed the default payment method!");
      }
      else {
        errorMessage(data.message);
      }

      setupUpgradeTab();
    });
  }

  //#endregion

  //#region -------------------------------UPGRADE TO PREMIUM-------------------------------

  //submit a new premium or to renew the premium again
  function submitPremium(button_elem, renew, annual){
    button_elem.addClass('is-loading');
    clearNotification();
    $.ajax({
      url: "/profile/upgrade",
      method: "POST",
      data: {
        annual : annual
      }
    }).done(function(data){
      button_elem.removeClass('is-loading');

      if (data.state == "success"){
        if (data.user){
          user = data.user;
        }
        if (renew){
          successMessage("Successfully renewed Premium! Welcome back, let's go sell some domains!");
        }
        else {
          successMessage("Successfully upgraded to Premium! Let's go sell some domains!");
        }
        getReferrals();
      }
      else {
        var error_msg = data.message || "Something went wrong with the payment! Please refresh the page and try again.";
        errorMessage(error_msg);
      }

      setupUpgradeTab();
    });
  }

  //cancel renewal of premium
  function submitCancelPremium(button_elem){
    $("#cancel-premium-confirm-button").addClass('is-loading');
    clearNotification();
    $.ajax({
      url: "/profile/downgrade",
      method: "POST"
    }).done(function(data){
      $("#cancel-premium-confirm-button").removeClass('is-loading');
      if (data.state == "success"){
        if (data.user){
          user = data.user;
        }
        successMessage("Successfully cancelled Premium! Sorry to see you go!");
      }
      else {
        var error_msg = data.message || "Something went wrong with the cancellation! Please refresh the page and try again.";
        errorMessage(error_msg);
      }

      setupUpgradeTab();
    });
  }

  //#endregion

  //#region -------------------------------REFERRALS-------------------------------

  //get referrals
  function getReferrals(){
    $("#loading-referral-table").removeClass('is-hidden');
    $("#no-referral-table, #referral-table").addClass('is-hidden');

    $.ajax({
      url: "/profile/getreferrals",
      method: "POST"
    }).done(function(data){
      if (data.state == "success"){
        if (data.user){
          user = data.user;
        }
      }
      else {
        if (data.message != "demo-error"){
          errorMessage(data.message);
        }
      }
      createReferralsTable();
    });
  }

  //create the referrals table
  function createReferralsTable(){
    $("#loading-referral-table").addClass('is-hidden');

    //show referrals
    if (user.referrals && user.referrals.length > 0){
      var total_redeemed = 0;
      var total_left = 0;
      $(".referral-row:not(#referral-clone)").remove();

      for (var x = 0 ; x < user.referrals.length ; x++){
        var referral_clone = $("#referral-clone").clone().removeAttr("id").removeClass('is-hidden');
        referral_clone.find(".referral-months").text(formatCurrency(user.referrals[x].amount_off, "usd"));
        referral_clone.find(".referral-created").text(moment(user.referrals[x].date_accessed).format("YYYY-MM-DD")).attr("title", moment(user.referrals[x].date_accessed).format("YYYY-MM-DD HH:mm"));
        referral_clone.find(".referral-redeemed").text((user.referrals[x].date_redeemed) ? "Used!" : "Not used!");

        //referred by someone
        if (user.referrals[x].referer_id != user.id && Number.isInteger(user.referrals[x].referer_id)){
          total_redeemed += user.referrals[x].amount_off;
          if (!user.referrals[x].date_redeemed){
            total_left += user.referrals[x].amount_off;
          }
          referral_clone.find(".referral-type").text("Referred by user");
        }
        //referral
        else if (user.referrals[x].referer_id == user.id){
          if (user.referrals[x].date_redeemed){
            total_redeemed += user.referrals[x].amount_off;
          }
          referral_clone.find(".referral-type").text("Referred a user");
          if (user.referrals[x].date_redeemed_r){
            var redeemed_text = "Used!";
          }
          else if (user.referrals[x].date_redeemed){
            var redeemed_text = "Not used!";
            total_left += user.referrals[x].amount_off;
          }
          else {
            var redeemed_text = "Not yet usable!";
            referral_clone.find(".icon").removeClass('is-hidden');
            //to fix the overlap on tooltips for first two rows
            if (x < 2){
              referral_clone.find(".icon").attr("data-balloon-pos", "down");
            }
          }
          referral_clone.find(".referral-redeemed").text(redeemed_text);
        }
        //coupon
        else {
          total_redeemed += user.referrals[x].amount_off;
          if (!user.referrals[x].date_redeemed){
            total_left += user.referrals[x].amount_off;
          }
          referral_clone.find(".referral-type").text("Promo code");
        }
        $("#referral-table").append(referral_clone);
      }

      //show referral table + total months free
      $("#total-amount-redeemed").text(formatCurrency(total_redeemed, "usd"));
      $(".unused-credits").text(formatCurrency(total_left, "usd"));

      //show unused credit tip
      if (total_left > 0 && user.stripe_subscription && user.stripe_subscription.cancel_at_period_end){
        $("#unused-credit-status").text('You still have unused credits to use towards a Premium account!');
      }
      else {
        $("#unused-credit-status").text('Any unused credits will be applied three days before the next billing cycle.');
      }

      setupNextChargeTip();

      $("#referral-table").removeClass('is-hidden');
    }

    //no existing referrals
    else {
      $("#upgrade-button .button-text").text("Upgrade $5/mo");
      $("#no-referral-table").removeClass('is-hidden');
      $(".unused-credits").text("$0.00");
    }
  }

  //handle referral link copy
  function referralLinkCopy(){
    $("#referral-link").on("focus", function(){
      $(this).select();
    });
    $("#referral-link-copy").on("click", function(){
      $("#referral-link").select();
      document.execCommand("copy");
      $("#referral-link").blur();
      $(this).find("svg").attr("data-icon", "check");
      $("#referral-link-text").text("Copied!");
    });
  }

  //#endregion

//#endregion

//#region -------------------------------PAYMENT TAB-------------------------------

  //#region -------------------------------STRIPE ACCOUNT-------------------------------

  //handle checkboxes
  function checkBox(module_value, elem){
    if (module_value == "off"){
      elem.val(module_value).prop("checked", false);
    }
    else {
      elem.val(module_value).prop("checked", true);
    }
  }

  //pre-fill existing stripe information
  function prefillStripeInfo(){

    //hide bank inputs
    $(".excess-routing-wrapper").addClass('is-hidden');

    //stripe account information
    if (user.stripe_account){
      for (var x in user.stripe_account){
        $("#" + x + "-input").val(user.stripe_account[x]);
      }
      checkBox(user.stripe_account.business_name_override, $("#business_name_override-input"));

      $("#change-bank-button").removeClass('is-hidden');
      $(".stripe-required-info").addClass('is-hidden');
      $("#stripe-personal-form").children(".card").removeClass('is-danger');
      $("#bank-tooltip").removeClass('is-hidden');
      $(".existing-bank").text("Click the button to add a default bank account!");
      $("#default-currency-tip").text("The default currency used when purchasing or renting your domains.");
    }
    else {
      $(".stripe-required-info").removeClass('is-hidden');
      $("#stripe-personal-form").children(".card").addClass('is-danger');
      $("#bank-tooltip").addClass('is-hidden');
      $(".stripe-account-input").val("");
      $(".existing-bank").text("Please enter your legal information before you can add a bank account!");
      $("#default-currency-tip").text("Please enter in your legal information before you can select a default currency!");
    }

    //supported currencies
    if (user.currencies){
      $("#default-currency-select").removeClass("is-hidden");

      //create list of acceptable currencies
      if (user.currencies.payment_currencies){
        $("#default_currency-input").children().remove();
        $("#default_currency-input").append("<option selected disabled>Please select your default currency</option>");
        for (var x = 0 ; x < user.currencies.payment_currencies.length ; x++){
          var current_currency = currency_codes[user.currencies.payment_currencies[x].toUpperCase()];
          if (current_currency != undefined){
            $("#default_currency-input").append("<option value=" + user.currencies.payment_currencies[x] + ">" + user.currencies.payment_currencies[x].toUpperCase() +" - " + current_currency.name + "</option>");
          }
          else {
            $("#default_currency-input").append("<option value=" + user.currencies.payment_currencies[x] + ">(" + user.currencies.payment_currencies[x].toUpperCase() +")</option>");
          }
        }
      }

      //select the default currency
      if (user.default_currency){
        $("#default_currency-input").val(user.default_currency);
      }
    }

    //stripe bank information
    if (user.stripe_bank){
      //existing bank info
      $(".existing-bank").removeClass('is-hidden').text("Current bank account - " + user.stripe_bank.bank_name + " ending in " + user.stripe_bank.last4);
      $("#change-bank-button span:nth-child(2)").text("Change Bank");
    }
    else {
      $("#account-wrapper, .excess-routing-wrapper").addClass('is-hidden');
      $(".stripe-bank-input").val("");
    }
  }

  //#endregion

  //#region -------------------------------BANK INFORMATION-------------------------------

  //submit stripe token for bank info
  function submitBank(stripe_token, updating_bank){
    $.ajax({
      url: "/profile/bank",
      data: {
        stripe_token: stripe_token
      },
      method: "POST"
    }).done(function(data){
      $("#stripe-bank-submit").removeClass('is-loading');
      if (data.state == "success"){
        if (data.user){
          user = data.user;
        }
        $("#change-bank-modal").removeClass('is-active');
        if (updating_bank){
          successMessage("Successfully updated your bank account information!");
        }
        else {
          successMessage("Successfully added a new bank account!");
        }
      }
      else {
        errorMessage(data.message);
      }
      prefillStripeInfo();
    });
  }

  //change bank forms based on country
  function changeBankCountry(currency){
    $("#account-wrapper").removeClass('is-hidden');
    $(".excess-routing-input").val("").attr("required", false);
    $("#account_number-input").attr("required", true);
    switch (currency){
      case "AUD":
      $("#account_routing-text").text("BSB");
      $("#account_number-text").text("Account Number ");
      $("#account_routing-wrapper").removeClass("is-hidden");
      $("#account_routing-input").attr("required", true);
      $("#account_routing2-wrapper").addClass("is-hidden");
      $("#account_routing3-wrapper").addClass("is-hidden");
      break;
      case "USD":
      $("#account_routing-text").text("Routing Number");
      $("#account_number-text").text("Account Number ");
      $("#account_routing-wrapper").removeClass("is-hidden");
      $("#account_routing-input").attr("required", true);
      $("#account_routing2-wrapper").addClass("is-hidden");
      $("#account_routing3-wrapper").addClass("is-hidden");
      break;
      case "CAD":
      $("#account_routing-text").text("Transit Number");
      $("#account_routing2-text").text("Institution Number");
      $("#account_number-text").text("Account Number ");
      $("#account_routing-wrapper").removeClass("is-hidden");
      $("#account_routing-input").attr("required", true);
      $("#account_routing2-wrapper").removeClass("is-hidden");
      $("#account_routing2-input").attr("required", true);
      $("#account_routing3-wrapper").addClass("is-hidden");
      break;
      case "JPY":
      $("#account_routing-text").text("Bank Code");
      $("#account_routing2-text").text("Branch Code");
      $("#account_number-text").text("Account Number ");
      $("#account_routing-wrapper").removeClass("is-hidden");
      $("#account_routing-input").attr("required", true);
      $("#account_routing2-wrapper").removeClass("is-hidden");
      $("#account_routing2-input").attr("required", true);
      $("#account_routing3-wrapper").removeClass("is-hidden");
      $("#account_routing3-input").attr("required", true);
      break;
      case "SGD":
      $("#account_routing-text").text("Bank Code");
      $("#account_routing2-text").text("Branch Code");
      $("#account_number-text").text("Account Number ");
      $("#account_routing-wrapper").removeClass("is-hidden");
      $("#account_routing-input").attr("required", true);
      $("#account_routing2-wrapper").removeClass("is-hidden");
      $("#account_routing2-input").attr("required", true);
      $("#account_routing3-wrapper").addClass("is-hidden");
      break;
      case "HKD":
      $("#account_routing-text").text("Clearing Code");
      $("#account_routing2-text").text("Branch Code");
      $("#account_number-text").text("Account Number ");
      $("#account_routing-wrapper").removeClass("is-hidden");
      $("#account_routing-input").attr("required", true);
      $("#account_routing2-wrapper").removeClass("is-hidden");
      $("#account_routing2-input").attr("required", true);
      $("#account_routing3-wrapper").addClass("is-hidden");
      break;
      default:
      $("#account_number-text").text("IBAN ");
      $(".excess-routing-wrapper").addClass("is-hidden");
      break;
    }
  }

  //#endregion

//#endregion

//#region -------------------------------HELPERS-------------------------------

function hideSaveCancelButtons(){
  $(".toolbar-submit-button, .toolbar-button").removeClass('is-loading');
  $(".toolbar-button").addClass('is-hidden');
}

//get the multiplier of a currency
function multiplier(code){
  return (code && currency_codes[code.toUpperCase()]) ? Math.pow(10, currency_codes[code.toUpperCase()].fractionSize) : 1;
}

//to format a number for currency
function formatCurrency(number, currency_code, decimals){
  var default_currency_details = (currency_code) ? currency_codes[currency_code.toUpperCase()] : currency_codes[user.default_currency.toUpperCase()];
  var currency_details = {
    thousand: ',',
    decimals: default_currency_details.fractionSize,
  }

  //override currency decimals
  if (decimals != undefined){
    currency_details.decimals = decimals;
  }

  //right aligned symbol
  if (default_currency_details.symbol && default_currency_details.symbol.rtl){
    currency_details.suffix = default_currency_details.symbol.grapheme;
  }
  else if (default_currency_details.symbol && !default_currency_details.symbol.rtl){
    currency_details.prefix = default_currency_details.symbol.grapheme;
  }

  return wNumb(currency_details).to(number / Math.pow(10, default_currency_details.fractionSize));
}

//#endregion
