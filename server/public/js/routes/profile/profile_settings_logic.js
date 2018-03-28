$(document).ready(function() {

  //<editor-fold>-------------------------------ACCOUNT TAB-------------------------------

    //<editor-fold>-------------------------------ACCOUNT INFO-------------------------------

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

    //</editor-fold>

    //<editor-fold>-------------------------------PASSWORD CHANGE-------------------------------

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

    //</editor-fold>

    //<editor-fold>-------------------------------CONNECT A REGISTRAR-------------------------------

    updateRegistrars();

    //</editor-fold>

  //</editor-fold>

  //<editor-fold>-------------------------------PREMIUM TAB-------------------------------

    //<editor-fold>-------------------------------STRIPE SET UP-------------------------------

    if (typeof Stripe != "undefined"){
      if (window.location.hostname == "localhost"){
        Stripe.setPublishableKey('pk_test_kcmOEkkC3QtULG5JiRMWVODJ');
      }
      else {
        Stripe.setPublishableKey('pk_live_506Yzo8MYppeCnLZkW9GEm13');
      }
    }

    setupUpgradeTab();

    //</editor-fold>

    //<editor-fold>-------------------------------CREDIT CARD CHANGE-------------------------------

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

    //</editor-fold>

    //<editor-fold>-------------------------------UPGRADE TO PREMIUM-------------------------------

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

    //</editor-fold>

    //<editor-fold>-------------------------------PROMO CODE-------------------------------

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

    //</editor-fold>

    //<editor-fold>-------------------------------REFERRAL-------------------------------

    referralLinkCopy();

    //</editor-fold>

  //</editor-fold>

  //<editor-fold>-------------------------------PAYMENT TAB-------------------------------

    //<editor-fold>-------------------------------PERSONAL INFORMATION-------------------------------

    //fill out stripe info
    prefillStripeInfo();

    //to show submit/cancel when data changes for stripe inputs
    $(".stripe-account-input").on("input", function(e){
      clearNotification();
      hideSaveCancelButtons();
      if (!user.stripe_account_id || $(this).val() != user.stripe_account[$(this).data("uservar")]){
        $("#stripe-account-submit, #cancel-button").removeClass("is-hidden");
      }
    });

    //stripe form submit (personal info)
    $("#stripe-personal-form").on("submit", function(e){
      e.preventDefault();
      $("#stripe-account-submit").addClass('is-loading');
      clearNotification();
      $.ajax({
        url: "/profile/payout",
        method: "POST",
        data: $(this).serialize()
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

    //</editor-fold>

    //<editor-fold>-------------------------------BANK INFORMATION-------------------------------

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

    //</editor-fold>

    //<editor-fold>-------------------------------PAYMENTS-------------------------------

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
        payoneer_email: $("#payoneer_email-input").val().toLowerCase(),
        bitcoin_address: $("#bitcoin_address-input").val().toLowerCase()
      });
    });

    //</editor-fold>

  //</editor-fold>

  //<editor-fold>-------------------------------TRANSACTIONS TAB-------------------------------

  //show withdrawal modal
  $("#transfer-button").on("click", function(){
    setupWithdrawModal();
  });

  //withdrawal to account
  $("#withdrawal-modal-form").on("submit", function(e){
    e.preventDefault();
    withdrawMoney();
  });

  //refresh transactions
  $("#refresh-transactions-button").on("click", function(){
    getTransactions();
  });

  //show free transactions
  $("#show-free-transactions").data("toggled", false).on("click", function(){
    toggleFreeTransactionsButton(!$("#show-free-transactions").data("toggled"));
    showTransactionRows();
  });

  //show specific transactions only (search)
  $("#transactions-search").on("input", function(){
    showTransactionRows();
  });

  //show specific transactions only (filter)
  $("#transactions-filter-select").on("change", function(){
    if ($(this).val() == "free"){
      toggleFreeTransactionsButton(true);
    }
    else {
      toggleFreeTransactionsButton(false);
    }
    showTransactionRows();
  });

  //sort transactions
  $(".transaction-header-sort").on("click", function(){
    var sort_value = $(this).data("value");
    var sort_direction = ($(".transaction-header-sort").find(".icon").data("sort_direction")) ? true : false;

    $(".transaction-header-sort").find(".icon").removeClass("is-primary");
    $(".listing-header-sort").find("svg").attr("data-icon", "sort");

    //add sort to this column
    $(this).find(".icon").addClass('is-primary');
    $(".transaction-header-sort").find(".icon").data("sort_direction", !sort_direction).find(".fa").addClass()
    if (sort_direction){
      $(this).find("svg").attr("data-icon", "sort-up");
    }
    else {
      $(this).find("svg").attr("data-icon", "sort-down");
    }
    showTransactionRows();
  });

  //</editor-fold>

  //<editor-fold>-------------------------------SHOW TAB-------------------------------

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

    //</editor-fold>

});

//<editor-fold>-------------------------------SHOW TAB-------------------------------

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
  //get AJAX for all transactions
  else if (section_id == "transactions"){
    if (!user.transactions || !user.transactions_remote){
      getTransactions();
    }
    else {
      createTransactionsTable();
    }
  }
  else {
    leftMenuActive();
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

//</editor-fold>

//<editor-fold>-------------------------------ACCOUNT TAB-------------------------------

  //prefills all domahub account info
  function prefillAccountInfo(){
    $(".account-input").each(function(){
      $(this).val(user[$(this).data("uservar")]);
    });
  }

  //<editor-fold>-------------------------------SUBMIT ACCOUNT CHANGES-------------------------------

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
          successMessage("Successfully updated account settings!");
          if (data.user){
            user = data.user;
          }
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

  //</editor-fold>

//</editor-fold>

//<editor-fold>-------------------------------PREMIUM TAB-------------------------------

  //<editor-fold>-------------------------------SET UP PREMIUM TAB CARD-------------------------------

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
    $("#payment-history-body .payment-history-row:not(#payment-history-clone)").remove();

    if (user.stripe_customer.invoices.length){
      for (var x = 0 ; x < user.stripe_customer.invoices.length ; x++){
        var payment_row = $("#payment-history-clone").clone().removeAttr("id").removeClass('is-hidden');
        payment_row.find(".payment-history-date").text(moment(user.stripe_customer.invoices[x].created).format("YYYY-MM-DD")).attr("title", moment(user.stripe_customer.invoices[x].created).format("YYYY-MM-DD HH:mm"));
        payment_row.find(".payment-history-amount").html((user.stripe_customer.invoices[x].amount) ? moneyFormat.to(user.stripe_customer.invoices[x].amount / 100) : "<del>" + moneyFormat.to(user.stripe_customer.invoices[x].subtotal / 100) + "</del> Free!");
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
      var next_charge_text = "Your upcoming charge of " + moneyFormat.to(user.stripe_customer.upcoming_invoice.subtotal / 100) + " on " + moment(user.stripe_customer.upcoming_invoice.date).format("YYYY-MM-DD");
      if (user.stripe_customer.upcoming_invoice.amount_due > 0){
        next_charge_text += " will be posted to your " + user.stripe_customer.brand + " card ending in " + user.stripe_customer.last4 + "."
      }
      else {
        next_charge_text += " will be waived thanks to your promotional credits!";
      }
      $("#next-charge-tip").text(next_charge_text);
    }
  }

  //</editor-fold>

  //<editor-fold>-------------------------------CREDIT CARD CHANGE-------------------------------

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

  //</editor-fold>

  //<editor-fold>-------------------------------UPGRADE TO PREMIUM-------------------------------

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

  //</editor-fold>

  //<editor-fold>-------------------------------REFERRALS-------------------------------

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
        referral_clone.find(".referral-months").text(moneyFormat.to(user.referrals[x].amount_off / 100));
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
      $("#total-amount-redeemed").text(moneyFormat.to(total_redeemed / 100));
      $(".unused-credits").text(moneyFormat.to(total_left / 100));

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

  //</editor-fold>

//</editor-fold>

//<editor-fold>-------------------------------PAYMENT TAB-------------------------------

  //<editor-fold>-------------------------------STRIPE ACCOUNT-------------------------------

  //pre-fill existing stripe information
  function prefillStripeInfo(){

    //hide bank inputs
    $(".excess-routing-wrapper").addClass('is-hidden');

    //stripe account information
    if (user.stripe_account){
      for (var x in user.stripe_account){
        $("#" + x + "-input").val(user.stripe_account[x]);
      }
      $("#change-bank-button").removeClass('is-hidden');
      $(".stripe-required-info").addClass('is-hidden');
      $("#stripe-personal-form").children(".card").removeClass('is-danger');
      $("#bank-tooltip").removeClass('is-hidden');
      $(".existing-bank").text("Click the button to add a default bank account!");
    }
    else {
      $(".stripe-required-info").removeClass('is-hidden');
      $("#stripe-personal-form").children(".card").addClass('is-danger');
      $("#bank-tooltip").addClass('is-hidden');
      $(".stripe-account-input").val("");
      $(".existing-bank").text("Please enter your legal information before you can add a bank account!");
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

  //</editor-fold>

  //<editor-fold>-------------------------------BANK INFORMATION-------------------------------

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

  //</editor-fold>

//</editor-fold>

//<editor-fold>-------------------------------TRANSACTIONS TAB-------------------------------

  //<editor-fold>-------------------------------CREATE ROWS-------------------------------

  //get transactions
  function getTransactions(){

    //show loading stuff
    $("#loading-transactions-table").removeClass('is-hidden');
    $("#no-matching-transactions-table, #no-transactions-table, #transactions-table").addClass('is-hidden');
    $(".total-loading").text("Loading...");
    $("span.withdrawal-available").text("");
    $("#refresh-transactions-button").addClass("is-loading");
    $("#transactions-toolbar").addClass("is-hidden");

    $.ajax({
      url: "/profile/gettransactions",
      method: "POST"
    }).done(function(data){

      //remove loading stuff
      $("#transactions-toolbar").removeClass("is-hidden");
      $("#refresh-transactions-button").removeClass("is-loading");

      if (data.state == "success"){
        if (data.user){
          user = data.user;
        }
      }
      else {
        errorMessage(data.message);
      }
      createTransactionsTable();
    });
  }

  //create all transactions rows
  function createTransactionsTable(){

    //hide modal
    $("#transactions-details-modal").removeClass('is-active');
    $("#loading-transactions-table").addClass('is-hidden');
    $("#transactions-toolbar").removeClass('is-hidden');

    $(".transactions-row:not(#transactions-row-clone)").remove();

    //transactions rows
    if (user.transactions){
      for (var x = 0; x < user.transactions.length; x++){
        $("#transactions-table-body").append(createTransactionsRow(user.transactions[x], x));
      }

      //show transactions table and total transactions
      calculateTotals();
      showTransactionRows();

      //if any visible
      if ($(".transactions-row:not(.is-hidden)").length > 0){
        $("#transactions-table").removeClass("is-hidden");
        $("#no-transactions-table").addClass("is-hidden");
      }
      else {
        $("#transactions-table").addClass("is-hidden");
        $("#no-transactions-table").removeClass("is-hidden");
      }
    }
    else {
      $("#transactions-table").addClass("is-hidden");
      $("#no-transactions-table").removeClass("is-hidden");
    }
  }

  //create a single transactions row
  function createTransactionsRow(transaction, rownum){
    var temp_row = $("#transactions-row-clone").clone();
    temp_row.removeAttr('id').removeClass('is-hidden');

    //transactions details modal
    temp_row.on("click", function(){
      setupTransactionsModal(temp_row, transaction);
    });

    //temp row data for search and filter
    temp_row.data("transaction_obj", transaction);
    temp_row.data("domain_name", transaction.domain_name);
    temp_row.data("sale", transaction.transaction_type == "sale");
    temp_row.data("rental", transaction.transaction_type == "rental");
    temp_row.data("expense", transaction.transaction_type == "expense");
    temp_row.data("exists", true);

    //all other row info
    temp_row.find(".transactions-row-date").text(moment(transaction.date_created).format("YYYY-MM-DD")).attr("title", moment(transaction.date_created).format("YYYY-MM-DD HH:mm"));
    temp_row.find(".transactions-row-type").text(transaction.transaction_type.substr(0,1).toUpperCase() + transaction.transaction_type.substr(1));
    var listing_href = (user.stripe_subscription_id) ? "https://" + transaction.domain_name.toLowerCase() : "/listing/" + transaction.domain_name.toLowerCase();
    temp_row.find(".transactions-row-domain").html("<a target='_blank' class='is-underlined' href='" + listing_href + "'>" + transaction.domain_name + "</a>");

    //payment type
    if (transaction.payment_type == "paypal"){
      var payment_type_text = "PayPal";
    }
    else if (transaction.payment_type == "stripe"){
      var payment_type_text = "Credit Card";
    }
    else {
      var payment_type_text = "-";
    }
    temp_row.find(".transactions-row-payment").text(payment_type_text);

    //free rental
    if (!transaction.transaction_cost || transaction.transaction_cost == null){
      temp_row.find(".transactions-row-available").text("Free " + transaction.transaction_type.substr(0, 1).toUpperCase() + transaction.transaction_type.substr(1));
      temp_row.find(".transactions-row-amount").text("-");
      temp_row.data("total_earned", 0);
      temp_row.data("total_fees", 0);
      temp_row.data("total_profit", 0);

      //for filters
      temp_row.data("free", true);
      temp_row.data("available", false);
    }
    //has a price
    else {
      temp_row.data("free", false);

      //profit + fees in money format
      var doma_fees = (transaction.doma_fees) ? transaction.doma_fees : 0;
      var payment_fees = (transaction.payment_fees) ? transaction.payment_fees : 0;

      //totals for prices
      var total_fees = (doma_fees + payment_fees) / 100;
      var total_profit = (transaction.transaction_cost) ? ((transaction.transaction_cost - doma_fees - payment_fees) / 100) : 0;
      var total_earned = (transaction.transaction_cost) ? (transaction.transaction_cost / 100) : 0;

      //refunded
      if (transaction.transaction_cost - ((transaction.transaction_cost_refunded) ? transaction.transaction_cost_refunded : 0) <= 0){
        temp_row.data("refunded", true);
        temp_row.data("available", false);
        temp_row.find(".transactions-row-available").text("Refunded");

        //price strikethrough (only for stripe)
        if (transaction.payment_type == "stripe"){
          temp_row.find(".transactions-row-amount").text(moneyFormat.to(total_profit)).addClass("text-line-through");
        }
        else if (transaction.payment_type == "paypal"){
          temp_row.find(".transactions-row-amount").text(moneyFormat.to(-0.3)).addClass('is-danger');
        }

        //for calculating totals later
        temp_row.data("total_earned", 0);
        temp_row.data("total_fees", ((transaction.payment_type == "paypal") ? 0.30 : 0));   //paypal doesnt refund 30 cent flat fee
      }
      //not refunded
      else {

        //tooltip for prices
        if (transaction.transaction_type == "expense"){
          temp_row.find(".transactions-row-amount").text(moneyFormat.to(-total_profit)).addClass('is-danger');
          temp_row.find(".transactions-row-available").text("Expense Recorded")
          temp_row.data("total_earned", -total_earned);
          temp_row.data("total_fees", 0);
        }
        else {

          //for calculating totals later
          temp_row.data("total_earned", total_earned);
          temp_row.data("total_fees", total_fees);

          //total earned tooltip hover
          var tooltip_text = "Total earned - " + moneyFormat.to(total_earned) + "&#10;" + "Total fees - " + moneyFormat.to(total_fees);
          temp_row.find(".transactions-row-amount").html("<span data-balloon-break data-balloon='" + tooltip_text + "' data-balloon-pos='left'>" + moneyFormat.to(total_profit) + "</span>").addClass('is-primary');

          //if we can withdraw from bank
          var payment_available_on = moment(new Date(transaction.payment_available_on));

          //withdrawn already
          if (transaction.withdrawn_on){
            temp_row.find(".transactions-row-available").text("Withdrawn").append('<div class="bubble-tooltip icon is-small is-tooltip" data-balloon-length="medium" data-balloon="Funds withdrawn on ' + moment(new Date(transaction.withdrawn_on)).format("YYYY-MM-DD") + '" data-balloon-pos="up"><i class="fal fa-question-circle"></i></div>');
            temp_row.find(".transactions-row-amount").removeClass("is-primary");
            temp_row.data("withdrawn", true);
          }
          //needs to transfer
          else if (!transaction.available && transaction.transaction_type == "sale"){
            temp_row.find(".transactions-row-available").text("Requires Action").append('<div class="bubble-tooltip icon is-small is-danger" data-balloon-length="medium" data-balloon="Please transfer domain ownership to access these funds!" data-balloon-pos="up"><i class="fal fa-exclamation-circle"></i></div>');
            temp_row.data("notavailable", true);
            temp_row.data("actionable", true);
          }
          //if has a set available date
          else if (payment_available_on.isValid() && payment_available_on.valueOf() > new Date().getTime()){
            temp_row.find(".transactions-row-available").text("Not yet available").append('<div class="bubble-tooltip icon is-small is-danger" data-balloon-length="medium" data-balloon="Available for withdrawal on ' + payment_available_on.format("MMMM DD") + '!" data-balloon-pos="up"><i class="fal fa-exclamation-circle"></i></div>');
            temp_row.data("notavailable", true);
          }
          //if okay from payment details ('approved' for paypal, 'available' for stripe)
          else if (["approved", "available"].indexOf(transaction.payment_status) != -1) {
            temp_row.find(".transactions-row-available").text("Available");
            temp_row.data("available", true);
          }
          //not available
          else {
            temp_row.data("notavailable", true);
            temp_row.find(".transactions-row-available").text("Not yet available");
          }
        }

      }

    }

    return temp_row;
  }

  //calculate totals of all transactions
  function calculateTotals(){
    var total_earned = 0;
    var total_fees = 0;
    var total_available = 0;
    var total_unavailable = 0;
    var total_withdrawn = 0;
    var total_expenses = 0;

    //loop through and figure it out
    $(".transactions-row:not(#transactions-row-clone)").each(function(){
      total_fees += $(this).data("total_fees");

      //count towards revenue if its not an expense
      if (!$(this).data("expense")){
        total_earned += $(this).data("total_earned");
      }
      else {
        total_expenses += Math.abs($(this).data("total_earned"));
      }

      //available to withdraw
      if ($(this).data("available")){
        total_available += ($(this).data("total_earned") - $(this).data("total_fees"));
      }
      if ($(this).data("notavailable")){
        total_unavailable += ($(this).data("total_earned") - $(this).data("total_fees"));
      }

      //count withdrawn
      if ($(this).data("withdrawn")){
        total_withdrawn += ($(this).data("total_earned") - $(this).data("total_fees"));
      }
    });

    var total_profit = total_earned - total_expenses - total_fees;

    //totals
    moneyCountAnimation($("#total-revenue"), total_earned);
    moneyCountAnimation($("#total-expense"), total_expenses);
    moneyCountAnimation($("#total-fees"), total_fees);
    moneyCountAnimation($("#total-profit"), total_profit);
    moneyCountAnimation($("#total-withdrawn"), total_withdrawn);
    moneyCountAnimation($("#total-not-withdrawn"), total_unavailable);
    moneyCountAnimation($(".withdrawal-available"), total_available);
    $(".withdrawal-available").data("total_available", total_available);

    //if there are funds available and a bank to withdraw to
    if (total_available > 0 && user.stripe_account && user.stripe_bank){
      $("#transfer-button").removeClass('is-hidden').prev(".control").removeClass("remove-margin-bottom-content");
    }
    else {
      $("#transfer-button").addClass('is-hidden').prev(".control").addClass("remove-margin-bottom-content");
    }
  }

  //</editor-fold>

  //<editor-fold>-------------------------------EDIT ROWS-------------------------------

  //sets the toggle free transactions button on or off
  function toggleFreeTransactionsButton(toggled){
    $("#show-free-transactions").data("toggled", toggled);
    if (toggled){
      $("#show-free-transactions").addClass("is-primary");
      $("#show-free-transactions").find("svg").attr("data-icon", "toggle-on");
    }
    else {
      $("#show-free-transactions").removeClass("is-primary");
      $("#show-free-transactions").find("svg").attr("data-icon", "toggle-off");
    }
  }

  //filter / sort / search and show matching transactions
  function showTransactionRows(){
    $(".transactions-row:not(#transactions-row-clone)").addClass('is-hidden');

    var filter_val = $("#transactions-filter-select").val();
    var search_term = $("#transactions-search").val().toLowerCase();
    var sort_by = $(".transaction-header-sort .icon.is-primary").attr("data-sort-by") || "date_created";
    var sort_direction = ($(".transaction-header-sort .icon.is-primary").data("sort_direction")) ? true : false;

    //filter / search / free toggle
    $(".transactions-row:not(#transactions-row-clone)").filter(function(){
      if ($(this).data(filter_val) &&
      $(this).data('domain_name').toLowerCase().indexOf(search_term) != -1
    ){
      if ($(this).data('free') && $("#show-free-transactions").data('toggled')){
        return true
      }
      else if (!$(this).data('free')){
        return true;
      }
    }}).removeClass('is-hidden').sort(function(a,b){
      if (sort_by){
        if (sort_by == "transaction_cost"){
          var a_sort = parseFloat($(a).data("total_earned")) - parseFloat($(a).data("total_fees")) || 0;
          var b_sort = parseFloat($(b).data("total_earned")) - parseFloat($(b).data("total_fees")) || 0;
        }
        else if (sort_by == "status" || sort_by == "domain_name"){
          var a_sort = $(a).find(".sort-by-" + sort_by).text().toLowerCase();
          var b_sort = $(b).find(".sort-by-" + sort_by).text().toLowerCase();
        }
        else {
          var a_sort = $(a).data("transaction_obj")[sort_by] || "";
          var b_sort = $(b).data("transaction_obj")[sort_by] || "";
        }

        if (!sort_direction){
          return (a_sort > b_sort) ? 1 : (a_sort < b_sort) ? -1 : 0;
        }
        else {
          return (a_sort > b_sort) ? -1 : (a_sort < b_sort) ? 1 : 0;
        }
      }
    }).appendTo('#transactions-table-body');

    //change tooltip direction for first visible 4
    if ($(".transactions-row:not(#transactions-row-clone):not(.is-hidden)").length < 4){
      $(".transactions-row:not(#transactions-row-clone):not(.is-hidden)").find(".bubble-tooltip").attr('data-balloon-pos', "right").attr('data-balloon-length', "large");
    }
    else {
      $(".transactions-row:not(#transactions-row-clone):not(.is-hidden)").find(".bubble-tooltip").attr('data-balloon-pos', "up").attr('data-balloon-length', "medium");
      for (var x = 0 ; x < 3; x++){
        $(".transactions-row:not(#transactions-row-clone):not(.is-hidden)").eq(x).find(".bubble-tooltip").attr('data-balloon-pos', "down");
      }
    }

    if (user.transactions){
      $("#no-transactions-table").addClass('is-hidden');
      //something matches
      if ($(".transactions-row:not(#transactions-row-clone):not(.is-hidden)").length > 0){
        $("#no-matching-transactions-table").addClass('is-hidden');
        $("#transactions-table").removeClass('is-hidden');
      }
      //nothing matches
      else {
        $("#no-matching-transactions-table").removeClass('is-hidden');
        $("#transactions-table").addClass('is-hidden');
      }
    }
  }

  //</editor-fold>

  //<editor-fold>-------------------------------TRANSACTION MODAL-------------------------------

  //set up the transactions modal
  function setupTransactionsModal(temp_row, transaction){
    $("#transactions-details-modal").addClass('is-active');

    //format the modal
    var payment_method_text = (transaction.payment_type == "paypal") ? "PayPal" : "credit card";

    var modal_timestamp_text = ""

    if (transaction.transaction_type == "expense"){
      modal_timestamp_text = "Recorded on " + moment(transaction.date_created).format("YYYY-MM-DD");
    }
    else if (transaction.transaction_type == "rental" && transaction.transaction_cost == null){
      modal_timestamp_text = "Created on " + moment(transaction.date_created).format("YYYY-MM-DD");
    }
    else {
      modal_timestamp_text = "Received on " + moment(transaction.date_created).format("YYYY-MM-DD") + " via " + payment_method_text;
    }

    $("#transactions-modal-timestamp").text(modal_timestamp_text).attr('title', moment(transaction.date_created).format("YYYY-MM-DD HH:mm"));
    $("#transactions-modal-domain").text("Domain " + transaction.transaction_type + " for " + transaction.domain_name);

    //calculate fees and profit
    var doma_fees = (transaction.doma_fees) ? transaction.doma_fees : 0;
    var payment_fees = (transaction.payment_fees) ? transaction.payment_fees : 0;
    $("#transactions-modal-price").text(moneyFormat.to((transaction.transaction_cost - doma_fees - payment_fees) / 100) + " USD");

    //refunded!
    if (temp_row.data("refunded")){

      //price strikethrough
      $("#transactions-modal-price").addClass("text-line-through");

      //refunded date text
      var refunded_text = (moment(new Date(transaction.date_refunded)).isValid()) ? "Refunded on " + moment(new Date(transaction.date_refunded)).format("YYYY-MM-DD") : "Refunded";
      $("#transactions-modal-available").text(refunded_text);

      //hide premium commission promo message
      $("#commission-promo-message").addClass("is-hidden");
      $("#transaction-modal-rental-buttons-wrapper").addClass("remove-margin-bottom-content");

      //hide refund button
      $("#refund-rental-submit").off().closest(".control").addClass('is-hidden');

      //hide fees
      $("#transactions-modal-domafees").closest("li").addClass("is-hidden");

      //paypal doesnt refund 30 cents flat fee
      if (transaction.payment_type == "paypal"){
        $("#transactions-modal-processfees").text(moneyFormat.to(0.30) + " paid in payments processing fees");
        $("#payment-fees-wrapper").removeClass("is-hidden");
        $("#paypal-refund-notice").removeClass('is-hidden');
      }
      else {
        $("#payment-fees-wrapper").addClass("is-hidden");
        $("#paypal-refund-notice").addClass('is-hidden');
      }
    }
    else {

      //remove strikethrough from refunded
      $("#transactions-modal-price").removeClass("text-line-through")

      //available for withdrawal
      if (temp_row.data("available")){
        $("#transactions-modal-available").text("Available for withdrawal!");
      }
      else if (temp_row.data("withdrawn")){
        $("#transactions-modal-available").text("Funds withdrawn on " + moment(new Date(transaction.withdrawn_on)).format("YYYY-MM-DD"));
      }
      else {
        var not_available_text = (moment(new Date(transaction.payment_available_on)).isValid()) ? "Available for withdrawal on " + moment(new Date(transaction.payment_available_on)).format("YYYY-MM-DD") : "Not yet available for withdrawal";
        $("#transactions-modal-available").text(not_available_text);
      }

      //show premium commission promo message
      $("#commission-promo-message").removeClass("is-hidden");
      $("#transaction-modal-rental-buttons-wrapper").removeClass("remove-margin-bottom-content");
      if (user.stripe_subscription){
        $(".premium-hidden").addClass('is-hidden');
        $(".basic-hidden").removeClass('is-hidden');
      }
      else {
        $(".basic-hidden").addClass('is-hidden');
        $(".premium-hidden").removeClass('is-hidden');
      }

      //fees and profit text
      $("#transactions-modal-domafees").text(moneyFormat.to(doma_fees / 100) + " paid in DomaHub fees*").closest("li").removeClass("is-hidden");
      $("#transactions-modal-processfees").text(moneyFormat.to(payment_fees / 100) + " paid in payments processing fees").closest("li").removeClass("is-hidden");
    }

    //domain rental related stuff
    if (transaction.transaction_type == "rental"){
      //preview rental
      $("#view-rental-button").attr('href', "/listing/" + transaction.domain_name.toLowerCase() + "/" + transaction.id);

      //buttons
      $("#transaction-modal-rental-buttons-wrapper").removeClass("is-hidden");
      $("#transaction-modal-expense-buttons-wrapper").addClass("is-hidden");

      //hide sales stuff
      $("#pending-transfer-wrapper").addClass('is-hidden');
      $("#available-on-wrapper").removeClass('is-hidden');

      //free rental
      if (temp_row.data("free")){

        $("#transactions-modal-available").text("This was a free rental!");
        $("#transaction-modal-rental-buttons-wrapper").addClass("remove-margin-bottom-content");

        //hide fees
        $("#transactions-modal-domafees").closest("li").addClass("is-hidden");
        $("#payment-fees-wrapper").addClass("is-hidden");

        //hide promo message
        $(".premium-hidden").addClass('is-hidden');
        $(".basic-hidden").addClass('is-hidden');

        //hide refund button
        $("#refund-rental-submit").off().closest(".control").addClass('is-hidden');
      }
      else {
        //submit for refund
        if (transaction.transaction_id && !temp_row.data("refunded")){
          $("#refund-rental-submit").off().on("click", function(){
            submitRefundRental(temp_row, transaction);
          }).closest(".control").removeClass('is-hidden');
        }
      }
    }
    //domain sales related stuff
    else if (transaction.transaction_type == "sale") {

      //hide buttons
      $("#transaction-modal-rental-buttons-wrapper, #transaction-modal-expense-buttons-wrapper").addClass("is-hidden");
      $("#refund-rental-submit").off().closest(".control").addClass('is-hidden');
      $("#payment-fees-wrapper").removeClass("is-hidden");

      //show pending transfer warning
      if (transaction.available != 1){
        $("#pending-transfer-wrapper").removeClass('is-hidden');
        $("#available-on-wrapper").addClass('is-hidden');

        //transfer ownership link
        $("#transfer-ownership-href").attr("href", "/profile/mylistings?listings=" + transaction.listing_id + "&tab=offers");
      }
      else {
        $("#pending-transfer-wrapper").addClass('is-hidden');
        $("#available-on-wrapper").removeClass('is-hidden');
      }
    }
    //domain expense related stuff
    else {
      $("#transactions-modal-domafees").text(moneyFormat.to((transaction.transaction_cost) / 100) + " paid" + ((transaction.transaction_details) ? " for " + transaction.transaction_details : ""));
      $("#commission-promo-message, #pending-transfer-wrapper, #available-on-wrapper, #payment-fees-wrapper").addClass("is-hidden");

      //button for edit / delete
      $("#transaction-modal-rental-buttons-wrapper").addClass("is-hidden");
      $("#transaction-modal-expense-buttons-wrapper").removeClass("is-hidden");
      $("#edit-domain-expense-button").attr("href", "/profile/mylistings?listings=" + transaction.listing_id + "&tab=domain-info");
    }
  }

  //to submit a refund
  function submitRefundRental(temp_row, transaction){
    $("#refund-rental-submit").addClass("is-loading");
    $.ajax({
      url: "/listing/" + transaction.domain_name.toLowerCase() + "/" + transaction.id + "/refund",
      method: "POST",
      data : {
        transaction_id : (transaction.payment_type == "paypal") ? transaction.sales_id : transaction.transaction_id
      }
    }).done(function(data){
      $("#refund-rental-submit").removeClass("is-loading");
      if (data.state == "success"){
        getTransactions();
      }
      else {
        errorMessage(data.message);
      }
    });
  }

  //</editor-fold>

  //<editor-fold>-------------------------------WITHDRAWAL-------------------------------

  //for withdrawal selection
  function setupWithdrawModal(){
    $("#withdrawal-modal").addClass('is-active');

    //stripe bank account
    if (user.stripe_bank){
      $("#withdrawal-bank-option").text("Bank account - " + user.stripe_bank.bank_name + " " + user.stripe_bank.last4);
    }
    else {
      $("#withdrawal-bank-option").addClass('is-hidden');
    }

    //paypal
    if (user.paypal_email){
      $("#withdrawal-paypal-option").text("PayPal account - " + user.paypal_email);
    }
    else {
      $("#withdrawal-paypal-option").addClass('is-hidden');
    }

    //bitcoin
    if (user.bitcoin_address){
      $("#withdrawal-bitcoin-option").text("PayPal account - " + user.bitcoin_address);
    }
    else {
      $("#withdrawal-bitcoin-option").addClass('is-hidden');
    }

    //payoneer
    if (user.payoneer_email){
      $("#withdrawal-payoneer-option").text("PayPal account - " + user.payoneer_email);
    }
    else {
      $("#withdrawal-payoneer-option").addClass('is-hidden');
    }
  }

  //withdraw money
  function withdrawMoney(){
    $("#withdrawal-modal-submit-button").addClass('is-loading');

    //for success message
    if ($("#withdrawal-destination-input").val() == "bank"){
      var destination_account_text = "bank account";
    }
    else if ($("#withdrawal-destination-input").val() == "paypal"){
      var destination_account_text = "PayPal account";
    }

    $.ajax({
      url : "/profile/transfer",
      method : "POST",
      data : {
        destination_account : $("#withdrawal-destination-input").val()
      }
    }).done(function(data){
      $("#withdrawal-modal-submit-button").removeClass('is-loading');
      if (data.state == "success"){
        var total_available = $(".withdrawal-available").data("total_available");
        successMessage("Successfully submitted a withdrawal request for " + moneyFormat.to(total_available) + " to your " + destination_account_text + "!</br></br>Please look out for a follow-up email within the next few business days.");
        $(".modal").removeClass("is-active");
        if (data.user){
          user = data.user;
        }
        createTransactionsTable();
      }
      else {
        switch (data.message){
          case ("Invalid charges!"):
          errorMessage("Something went wrong with the transfer! Please refresh the page and try again.");
          break;
          case ("No bank account to charge"):
          errorMessage("You need to add a valid bank account to your DomaHub account to be able to withdraw money!");
          break;
          default:
          errorMessage(data.message);
          break;
        }
      }
    });
  }

  //</editor-fold>

//</editor-fold>

//<editor-fold>-------------------------------HELPERS-------------------------------

function hideSaveCancelButtons(){
  $(".toolbar-button").removeClass('is-loading');
  $(".toolbar-button").addClass('is-hidden');
}

//to format a number for $$$$
var moneyFormat = wNumb({
  thousand: ',',
  prefix: '$',
  decimals: 2
});

//count money animation
function moneyCountAnimation(elem, number){
  elem.prop('Counter', 0).stop().animate({
    Counter: number
  }, {
    duration : 500,
    easing: 'swing',
    step: function (now) {
      $(this).text(moneyFormat.to(parseFloat(now)));
    }
  });
}

//</editor-fold>
