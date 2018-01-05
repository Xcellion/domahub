$(document).ready(function() {

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

  //<editor-fold>-------------------------------ACCOUNT TAB-------------------------------

    //<editor-fold>-------------------------------ACCOUNT INFO-------------------------------

    //to show submit/cancel when data changes for account inputs
    $(".account-input").on("input", function(e){
      clearNotification();
      hideSaveCancelButtons();
      if ($(this).val() != user[$(this).data("uservar")] && user[$(this).data("uservar")]){
        $("#account-submit, #cancel-button").removeClass("is-hidden");
      }
    });

    //to submit any changes
    $("#stripe-account-form").on("submit", function(e){
      e.preventDefault();
      submitChanges({
        new_email: $("#email-input").val(),
        username: $("#username-input").val()
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
      if ($(".far-cc-" + card_type) && card_type){
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
      if (user.stripe_subscription && user.stripe_subscription.cancel_at_period_end){
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
        url: "/profile/settings/payout",
        method: "POST",
        data: $(this).serialize()
      }).done(function(data){
        hideSaveCancelButtons();
        if (data.state == "success"){
          if (data.user){
            user = data.user;
          }
          successMessage("Successfully updated settings!");
        }
        else {
          errorMessage(data.message);
        }
        prefillStripeInfo();
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
      $('#account_type-input').focus();
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
        $("#stripe-bank-submit").removeClass('is-loading');
        if (status != 200){
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

    //<editor-fold>-------------------------------PAYPAL-------------------------------

    //show paypal submit button
    $("#paypal_email-input").on("input", function(){
      clearNotification();
      hideSaveCancelButtons();
      if ($(this).val() != user.paypal_email){
        $("#paypal-submit, #cancel-button").removeClass('is-hidden');
      }
    });

    //submit paypal form
    $("#paypal-form").submit(function(e){
      e.preventDefault();
      submitChanges({
        paypal_email: $("#paypal_email-input").val().toLowerCase()
      });
    });

    //</editor-fold>

  //</editor-fold>

  //<editor-fold>-------------------------------TRANSACTIONS TAB-------------------------------

  //transfer to bank button
  $("#transfer-button").on('click', function(){
    $("#transfer-button").addClass('is-loading').off();
    $.ajax({
      url: "/profile/transfer",
      method: "POST"
    }).done(function(data){
      $("#transfer-button").removeClass('is-loading');

      if (data.state == "success"){
        $("#transfer-button").addClass("is-disabled");
        successMessage("Successfully transferred " + number_format.to(total_available) + " to your bank account!");
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
  });

  //refresh transactions
  $("#refresh-transactions-button").on('click', function(){
    getTransactions();
  });

  //show specific transactions only (search)
  $("#transactions-search").on("input", function(){
    showTransactionRows();
  });

  //show specific transactions only (filter)
  $("#transactions-filter-select").on("change", function(){
    showTransactionRows();
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

  //get AJAX for promo codes if we havent yet
  if (section_id == "premium") {
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
  else if (section_id == "transactions"){
    if (!user.transactions){
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
          errorMessage(data.message);
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

      $("#subscription-end-date").text(" on " + moment(user.stripe_subscription.current_period_end).format("MMMM D, YYYY"));

      //expiring
      if (user.stripe_subscription.cancel_at_period_end == true){

        //show notification that premium is expiring
        $("#premium-expire-notification").removeClass('is-hidden');

        //left nav and tab text
        $("#upgrade-to-premium-text, #upgrade-tab-header").text("Upgrade to Premium");
        $("#nav-premium-link").removeClass('is-hidden');

        var exp_date_text = moment(user.stripe_subscription.current_period_end).format("MMMM D, YYYY")
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

        //left nav and tab text
        $("#upgrade-to-premium-text, #upgrade-tab-header").text("Premium Status");
        $("#nav-premium-link").addClass('is-hidden');

        $("#renew-status").text("Premium is currently active! Press the button to cancel renewal.");

        //next charge (invoice)
        if (user.stripe_customer.upcoming_invoice){
          var next_charge_text = "Your upcoming charge of " + moneyFormat.to(user.stripe_customer.upcoming_invoice.subtotal / 100) + " on " + moment(user.stripe_customer.upcoming_invoice.date).format("MMMM D, YYYY");
          if (user.stripe_customer.upcoming_invoice.amount_due > 0){
            next_charge_text += " will be posted to your " + user.stripe_customer.brand + " card ending in " + user.stripe_customer.last4 + "."
          }
          else {
            next_charge_text += " has been waived due to your existing promotional credits!";
          }
        }
        $("#next-charge-tip").text(next_charge_text);

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

        //show notification that premium is expiring
        $("#premium-expire-notification").removeClass('is-hidden');
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
        payment_row.find(".payment-history-date").text(moment(user.stripe_customer.invoices[x].created).format("MMMM D, YYYY")).attr("title", moment(user.stripe_customer.invoices[x].created).format("MMMM DD, YYYY - hh:mmA"));
        payment_row.find(".payment-history-amount").html((user.stripe_customer.invoices[x].amount) ? moneyFormat.to(user.stripe_customer.invoices[x].amount / 100) : "<del>" + moneyFormat.to(user.stripe_customer.invoices[x].subtotal / 100) + "</del> Free!");
        $("#payment-history-body").append(payment_row);
      }
    }
    else {
      var payment_row = $("#payment-history-clone").clone().removeAttr("id").removeClass('is-hidden');
      payment_row.find(".payment-history-date").text(moment(user.stripe_subscription.created).format("MMMM D, YYYY")).attr("title", moment(user.stripe_subscription.created).format("MMMM DD, YYYY - hh:mmA"));
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
        referral_clone.find(".referral-created").text(moment(user.referrals[x].date_accessed).format("MMMM D, YYYY")).attr("title", moment(user.referrals[x].date_accessed).format("MMMM DD, YYYY - hh:mmA"));
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
        $("#unused-credit-status").text('These credits will be applied at the next billing cycle.');
      }

      $("#referral-table").removeClass('is-hidden');
    }

    //no existing referrals
    else {
      $("#upgrade-button .button-text").text("Upgrade $5/mo");
      $("#no-referral-table").removeClass('is-hidden');
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
      for (var x in user.stripe_bank){
        $("#" + x + "-input").val(user.stripe_bank[x]);
      }
      //change bank info
      changeBankCountry($("#currency-input").val());
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
      url: "/profile/settings/bank",
      data: {
        stripe_token: stripe_token
      },
      method: "POST"
    }).done(function(data){
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

//get transactions from stripe
function getTransactions(){
  $("#loading-transactions-table").removeClass('is-hidden');
  $("#no-matching-transactions-table, #no-transactions-table, #transactions-table").addClass('is-hidden');

  $.ajax({
    url: "/profile/gettransactions",
    method: "POST"
  }).done(function(data){
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
  if (user.transactions && user.transactions.total > 0){

    //stripe transactions
    if (user.transactions.stripe_transactions){
      for (var x = 0; x < user.transactions.stripe_transactions.length; x++){
        $("#transactions-table-body").append(createTransactionsRow(user.transactions.stripe_transactions[x]));
      }
    }

    //paypal transactions
    if (user.transactions.paypal_transactions){
    }

    //show transactions table and total transactions
    calculateTotals();
    $("#transactions-table").removeClass("is-hidden");
  }
  else {
    $("#no-transactions-table").removeClass("is-hidden");
  }
}

//create a single transactions row
function createTransactionsRow(stripe_charge){
  var temp_row = $("#transactions-row-clone").clone();
  temp_row.removeAttr('id').removeClass('is-hidden');

  //transactions details modal
  temp_row.on("click", function(){
    setupTransactionsModal(temp_row, stripe_charge);
  });

  //temp row data for search and filter
  temp_row.data("domain_name", stripe_charge.domain_name);
  temp_row.data("sale", (stripe_charge.rental_id) ? false : true);
  temp_row.data("rental", (stripe_charge.rental_id) ? true : false);
  temp_row.data("available", stripe_charge.available_on < new Date().getTime());
  temp_row.data("notavailable", stripe_charge.available_on > new Date().getTime());
  temp_row.data("actionable", stripe_charge.pending_transfer == "true");
  temp_row.data("exists", true);

  //all other row info
  temp_row.find(".transactions-row-date").text(moment(stripe_charge.created).format("MMMM D, YYYY")).attr("title", moment(stripe_charge.created).format("MMMM DD, YYYY - hh:mmA"));
  temp_row.find(".transactions-row-type").text((stripe_charge.rental_id) ? "Rental" : "Sale");
  var listing_href = (user.stripe_subscription_id) ? "https://" + stripe_charge.domain_name.toLowerCase() : "/listing/" + stripe_charge.domain_name;
  temp_row.find(".transactions-row-domain").html("<a target='_blank' class='is-underlined' href='" + listing_href + "'>" + stripe_charge.domain_name + "</a>");

  //balance available
  if (stripe_charge.available_on < new Date().getTime()){
    temp_row.find(".transactions-row-available").text("Available");
  }
  //balance not yet available
  else {
    //actionable
    if (stripe_charge.pending_transfer == "true"){
      temp_row.find(".transactions-row-available").text("Requires Action").append('<div class="icon is-small is-danger" data-balloon-length="large" data-balloon="Please transfer ownership of this domain to access these funds!" data-balloon-pos="up"><i class="far fa-exclamation-circle"></i></div>');
    }
    else {
      temp_row.find(".transactions-row-available").text("Not yet available").append('<div class="icon is-small is-tooltip" data-balloon-length="medium" data-balloon="Available for withdrawal on ' + moment(stripe_charge.available_on).format("MMMM D, YYYY") + '" data-balloon-pos="up"><i class="far fa-question-circle"></i></div>');
    }
  }

  //was refunded completely
  if (stripe_charge.amount == stripe_charge.amount_refunded){
    row.find(".transactions-row-amount .row-text").text("Refunded");
  }
  else {
    //calculate fees and profit
    var doma_fees = (stripe_charge.doma_fees) ? parseFloat(stripe_charge.doma_fees) : Math.round(stripe_charge.amount * 0.10);
    var stripe_fees = (stripe_charge.stripe_fees) ? parseFloat(stripe_charge.stripe_fees) : Math.round(stripe_charge.amount * 0.029) + 30;

    //profit + fees in money format
    var total_fees = (doma_fees + stripe_fees) / 100;
    var total_profit = (stripe_charge.amount - doma_fees - stripe_fees) / 100;
    var total_earned = stripe_charge.amount / 100;
    temp_row.data("total_earned", total_earned);
    temp_row.data("total_fees", total_fees);
    temp_row.data("total_profit", total_profit);

    //tooltip
    var tooltip_text = "Total earned - " + moneyFormat.to(total_earned) + "&#10;" + "Total fees - " + moneyFormat.to(total_fees);

    temp_row.find(".transactions-row-amount").html("<span data-balloon-break data-balloon='" + tooltip_text + "' data-balloon-pos='up'>" + moneyFormat.to(total_profit) + "</span>");
  }

  return temp_row;
}

//filter / search for specific transactions
function showTransactionRows(){
  $(".transactions-row:not(#transactions-row-clone)").addClass('is-hidden');

  var filter_val = $("#transactions-filter-select").val();
  var search_term = $("#transactions-search").val();
  $(".transactions-row:not(#transactions-row-clone)").filter(function(){
    if ($(this).data(filter_val) && $(this).data('domain_name').indexOf(search_term) != -1){
      return true;
    }
  }).removeClass('is-hidden');

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

//set up the transactions modal
function setupTransactionsModal(temp_row, stripe_charge){
  $("#transactions-details-modal").addClass('is-active');

  //format the modal
  $("#transactions-modal-timestamp").text("Received on " + moment(stripe_charge.created).format("MMMM D, YYYY")).attr('title', moment(stripe_charge.created).format("MMMM DD, YYYY - hh:mmA"));
  $("#transactions-modal-domain").text(((stripe_charge.rental_id) ? "Domain rental" : "Domain sale") + " for " + stripe_charge.domain_name);
  $("#transactions-modal-price").text(moneyFormat.to((stripe_charge.amount - stripe_charge.doma_fees - stripe_charge.stripe_fees) / 100) + " " + stripe_charge.currency.toUpperCase());

  //available for withdrawal
  if (stripe_charge.available_on < new Date().getTime()){
    $("#transactions-modal-available").text("Available for withdrawal!");
  }
  else {
    $("#transactions-modal-available").text("Available for withdrawal on " + moment(stripe_charge.available_on).format("MMMM D, YYYY"));
  }

  //hide premium or basic
  if (user.stripe_subscription){
    $(".premium-hidden").addClass('is-hidden');
    $(".basic-hidden").removeClass('is-hidden');
  }
  else {
    $(".basic-hidden").addClass('is-hidden');
    $(".premium-hidden").removeClass('is-hidden');
  }

  //calculate fees and profit
  var doma_fees = (stripe_charge.doma_fees) ? parseFloat(stripe_charge.doma_fees) : Math.round(stripe_charge.amount * 0.10);
  var stripe_fees = (stripe_charge.stripe_fees) ? parseFloat(stripe_charge.stripe_fees) : Math.round(stripe_charge.amount * 0.029) + 30;
  $("#transactions-modal-domafees").text(moneyFormat.to(doma_fees / 100) + " paid in DomaHub fees*");
  $("#transactions-modal-processfees").text(moneyFormat.to(stripe_fees / 100) + " paid in payments processing fees");

  //domain rental related stuff
  if (stripe_charge.rental_id){
    //preview rental
    $("#view-rental-button").attr('href', "/listing/" + stripe_charge.domain_name + "/" + stripe_charge.rental_id);
    $("#rental-buttons-wrapper").removeClass("is-hidden");

    //submit for refund
    $("#refund-rental-submit").off().on("click", function(){
      submitRefundRental(temp_row, stripe_charge);
    })

    //hide sales stuff
    $("#pending-transfer-wrapper").addClass('is-hidden');
    $("#available-on-wrapper").removeClass('is-hidden');
  }
  //domain sales related stuff
  else {
    $("#refund-rental-submit").off()
    $("#rental-buttons-wrapper").addClass("is-hidden");

    //show pending transfer warning
    if (stripe_charge.pending_transfer == "true"){
      $("#pending-transfer-wrapper").removeClass('is-hidden');
      $("#available-on-wrapper").addClass('is-hidden');

      //transfer ownership link
      if (stripe_charge.listing_id){
        $("#transfer-ownership-href").attr("href", "/profile/mylistings?listings=" + stripe_charge.listing_id + "&tab=offers");
      }
      else {
        $("#transfer-ownership-href").attr("href", "/profile/mylistings?tab=offers");
      }
    }
    else {
      $("#pending-transfer-wrapper").addClass('is-hidden');
      $("#available-on-wrapper").removeClass('is-hidden');
    }
  }
}

//to submit a refund
function submitRefundRental(temp_row, stripe_charge){
  $("#refund-rental-submit").addClass("is-loading");
  $.ajax({
    url: "/listing/" + stripe_charge.domain_name + "/" + stripe_charge.rental_id + "/refund",
    method: "POST",
    data: {
      stripe_id : stripe_charge.charge_id
    }
  }).done(function(data){
    $("#refund-rental-submit").removeClass("is-loading");
    if (data.state == "success"){
      createTransactionsTable();
    }
    else {
      errorMessage(data.message);
    }
  });
}

//re-calculate totals
function calculateTotals(){
  var total_earned = 0;
  var total_fees = 0;
  var total_profit = 0;
  var total_available = 0;

  //loop through and figure it out
  $(".transactions-row:not(#transactions-row-clone)").each(function(){
    total_earned += $(this).data("total_earned");
    total_fees += $(this).data("total_fees");
    total_profit += $(this).data("total_profit");

    //available to withdraw
    if ($(this).data("available")){
      total_available +=$(this).data("total_profit");
    }
  });

  //totals
  $("#total-earned").text(moneyFormat.to(total_earned));
  $("#total-fees").text(moneyFormat.to(total_fees));
  $("#total-profit").text(moneyFormat.to(total_profit));
  $("#total-available").text(moneyFormat.to(total_available));

  //if there are funds available and a bank to withdraw to
  if (total_available > 0 && user.stripe_account && user.stripe_bank){
    $("#transfer-button").removeClass('is-disabled');
  }
  else {
    $("#transfer-button").addClass('is-disabled');
  }
}

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

//</editor-fold>
