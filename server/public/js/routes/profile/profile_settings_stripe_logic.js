$(document).ready(function() {

  //<editor-fold>-------------------------------STRIPE SET UP-------------------------------

  setUpUpgradeTab();

  if (window.location.hostname == "localhost"){
    Stripe.setPublishableKey('pk_test_kcmOEkkC3QtULG5JiRMWVODJ');
  }
  else {
    Stripe.setPublishableKey('pk_live_506Yzo8MYppeCnLZkW9GEm13');
  }

  //</editor-fold>

  //<editor-fold>-------------------------------CREDIT CARD CHANGE-------------------------------

  //format stripe cc icons
  $("#stripe-form").find(".stripe-input").on("change keyup paste", function(){
    errorMessage(false);

    var card_type = $.payment.cardType($("#cc-num").val());
    if (card_type == "dinersclub") { card_type = "diners-club"}
    if (["maestro", "unionpay", "forbrugsforeningen", "dankort"].indexOf(card_type) != -1){ card_type = null}

    //show appropriate card icon
    if ($(".fa-cc-" + card_type) && card_type){
      $("#cc-icon").removeClass().addClass("fa fa-cc-" + card_type);
    }
    //or show default
    else {
      $("#cc-icon").removeClass().addClass("fa fa-credit-card");
    }
  });

  //click to show CC form if they want to change card (or add a new card)
  $("#change-card-button").on("click", function(){
    $("#credit-card-modal").addClass('is-active');
    $('#cc-num').focus();
  });

  //click checkout button to submit and get stripe token
  $("#submit-card-button").on("click", function(e){
    submitForToken();
  });

  //</editor-fold>

  //<editor-fold>-------------------------------UPGRADE TO PREMIUM-------------------------------

  //upgrade to premium with existing credit card (or renew subscription)
  $("#upgrade-button, #renew-premium-button").on("click", function(){
    submitPremium($(this));
  });

  //button to cancel subscription
  $("#cancel-premium-button").off().on("click", function(){
    submitCancelPremium($(this));
  });

  //</editor-fold>

  //<editor-fold>------------------------------------------------------------------------------------ PAY OUT ADDRESS

  //change the bank forms based on country
  $("#currency-input").on("change", function(e){
    changeBankCountry($(this).val());
  });

  //to highlight submit when data changes for stripe form
  $(".stripe-form").find(".stripe-input").bind("input click", function(e){
    var stripe_form = $(this).closest(".stripe-form");
    var success_button = stripe_form.find(".button.is-primary");
    var cancel_button = stripe_form.find(".button.is-danger");

    if (checkFieldsFilled(stripe_form)){
      success_button.removeClass("is-disabled");
      cancel_button.removeClass("is-hidden");
    }
    else {
      success_button.addClass("is-disabled");
      cancel_button.addClass("is-hidden");
    }
  });

  $(".payout-next").on("click", function(e){
    e.preventDefault();
    $(this).closest(".payout-form").addClass('is-hidden').next(".payout-form").removeClass('is-hidden');
  });

  //to cancel any changes
  $("#payout-address-cancel").click(function(e){
    e.preventDefault();
    cancelFormSubmit($("#payout-address-form"));
  });

  //go next on address to personal info
  $("#payout-address-next").on('click', function(e){
    e.preventDefault();
    showSection("payout-personal");
  });

  //stripe form submit button click
  $("#payout-address-submit, #payout-personal-submit").on("click", function(e){
    e.preventDefault();
    $(this).closest(".stripe-form").submit();
  });

  //stripe form submit
  $(".stripe-form").not("#payout-bank-form").on("submit", function(e){
    e.preventDefault();
    var stripe_form = $(this);
    var which_form = $(this).attr('id').split("-")[1];

    //make sure all required fields are good
    if (checkRequiredFields($(this), which_form)){
      $.ajax({
        url: "/profile/settings/payout/" + which_form,
        data: $("#payout-" + which_form + "-form").serialize(),
        method: "POST"
      }).done(function(data){
        if (data.state == "success"){

          //show hidden next button
          stripe_form.find(".payout-next-button").removeClass('is-hidden');
          $(".hide-stripe").removeClass('is-hidden');

          successMessage("Successfully updated settings!");
          user = data.user;
          cancelFormSubmit($("#payout-" + which_form + "-form"));
        }
        else {
          errorMessage(data.message);
        }
      });
    }

  });

  //</editor-fold>

  //<editor-fold>------------------------------------------------------------------------------------ PAY OUT PERSONAL INFO

  //remove hidden stripe sections if stripe account is made
  if (user.stripe_account){
    $(".hide-stripe").removeClass('is-hidden');
    $("#payout-address-link").text('Payout Address');
    prefillStripeInfo();
  }

  //to cancel any changes
  $("#payout-personal-cancel").click(function(e){
    e.preventDefault();
    cancelFormSubmit($("#payout-personal-form"));
  });

  //go next on personal to bank info
  $("#payout-personal-next").on('click', function(e){
    e.preventDefault();
    showSection("payout-bank");
  });

  //</editor-fold>

  //<editor-fold>------------------------------------------------------------------------------------ PAY OUT BANK INFO

  //to cancel any changes
  $("#payout-bank-cancel").click(function(e){
    e.preventDefault();
    cancelFormSubmit($("#payout-bank-form"));
  });

  //submit bank information
  $("#payout-bank-submit").on("click", function(e){

    //check if all required fields are filled
    if (checkRequiredFields($(this), "bank")){
      e.preventDefault();

      var stripe_info = {
        country: $('#bank_country-input').val(),
        currency: $('#currency-input').val(),
        account_number: $('#account_number-input').val()
      }

      if ($("#account_routing-wrapper").is(":visible")) {
        stripe_info.routing_number = $('#account_routing-input').val().toString() + $('#account_routing2-input').val().toString();
      }

      if ($("#account_routing3-wrapper").is(":visible")) {
        stripe_info.account_holder_name = $('#account_routing3-input').val().toString();
      }

      //create stripe token
      Stripe.bankAccount.createToken(stripe_info, function(status, response){
        if (status != 200){
          errorMessage(response.error.message);
        }
        else {
          //submit to server
          submitBank(response.id);
        }
      });
    }
  });

  //</editor-fold>

  //<editor-fold>-------------------------------PAYPAL-------------------------------

  //submit paypal form
  $("#paypal-form").submit(function(e){
    e.preventDefault();

    if (validateEmail($("#paypal_email-input").val())){
      $.ajax({
        url: "/profile/settings",
        method: "POST",
        data: {
          paypal_email: $("#paypal_email-input").val()
        }
      }).done(function(data){
        if (data.state == "success"){
          successMessage("Successfully updated settings!");
          user = data.user;
        }
        else {
          errorMessage(data.message);
        }
        resetInputs($("#paypal-form"));
      })
    }
    else {
      errorMessage("Please enter a valid email address!");
    }
  });

  //</editor-fold>

  //<editor-fold>-------------------------------PROMO CODE-------------------------------

  $("#promo-form").on('submit', function(e){
    e.preventDefault();
    $("#promo-submit").addClass('is-loading');
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
        var subscription_exists_text = (user.stripe_subscription_id) ? "Your free month will be applied on the next pay cycle." : "Please upgrade to Premium to receive your free month.";
        successMessage("Successfully applied promo code! " + subscription_exists_text);
      }
      else {
        errorMessage(data.message);
      }
    });
  });

  //</editor-fold>

});

//<editor-fold>-------------------------------SET UP PREMIUM TAB CARD-------------------------------

//function to set up upgrade card appearance
function setUpUpgradeTab(){
  //format all stripe inputs
  $('#cc-num').val("").payment('formatCardNumber');
  $('#cc-exp').val("").payment('formatCardExpiry');
  $('#cc-cvc').val("").payment('formatCardCVC');
  $('#cc-zip').val("").payment('restrictNumeric');

  //hide modal
  $(".modal").removeClass('is-active');

  //is already premium
  if (user.stripe_subscription_id){
    $("#upgrade-to-premium-text, #upgrade-tab-header").text("Premium Status");
    $("#nav-premium-link").addClass('is-hidden');

    //expiring
    if (user.premium_expiring == true){
      $("#renew-status").text("Premium is active, but will expire on " + moment(user.premium_exp_date * 1000).format("MMM DD, YYYY") + ". You will not be charged further for this account.");

      //not renewing, so hide the cancel button
      $("#cancel-premium-button").addClass("is-hidden");

      //show button click to renew subscription
      $("#renew-premium-button").removeClass("is-hidden");
      $("#upgrade-button").addClass('is-hidden');
    }
    //not expiring, show cancel button
    else {
      $("#renew-status").text("Premium is currently active! Your next charge of $5 will be posted on " + moment(user.premium_exp_date * 1000).format("MMM DD, YYYY"));

      //renewing, so hide the renew button
      $("#renew-premium-button").addClass("is-hidden").removeClass('is-loading');

      //show button to cancel subscription
      $("#cancel-premium-button").removeClass("is-hidden");
      $("#upgrade-button").addClass('is-hidden');
    }
  }
  else {
    $("#upgrade-to-premium-text, #upgrade-tab-header").text("Upgrade to Premium");

    //has a credit card on file, but no premium
    if (user.premium_cc_last4 || user.premium_cc_brand){
      $("#renew-status").text("Click the upgrade button to upgrade to a Premium account!");
      $("#upgrade-button").removeClass('is-hidden');
    }
    else {
      $("#renew-status").text("Add a new card to upgrade to a Premium account!");
      $("#upgrade-button").addClass('is-hidden');
    }
  }

  //user has a credit card on file!
  if (user.premium_cc_last4 || user.premium_cc_brand){
    $("#change-card-button span:nth-child(2)").text("Change Card");

    //last 4 digits
    var premium_cc_last4 = (user.premium_cc_last4) ? user.premium_cc_last4 : "****";
    var premium_cc_brand = (user.premium_cc_brand) ? user.premium_cc_brand : "Credit"
    $("#existing-cc").text(premium_cc_brand + " card ending in " + premium_cc_last4);
  }

}

//</editor-fold>

//<editor-fold>-------------------------------CREDIT CARD CHANGE-------------------------------

//check the CC info
function checkCC(){
  if (!$("#cc-num").val()){
    errorMessage("Please provide a credit card to charge!");
  }
  else if (!$("#cc-exp").val()){
    errorMessage("Please provide your credit card expiration date!");
  }
  else if (!$("#cc-cvc").val()){
    errorMessage("Please provide your credit card CVC number!");
  }
  else if (!$("#cc-zip").val()){
    errorMessage("Please provide a ZIP code!");
  }
  else {
    return true;
  }
}

//function to submit to Stripe for a new token
function submitForToken(){
  if (checkCC()){
    $("#submit-card-button").addClass('is-loading');
    Stripe.card.createToken($("#stripe-form"), function(status, response){
      if (response.error){
        $("#submit-card-button").removeClass('is-loading');
        errorMessage(response.error.message);
      }
      else {
        //all good, submit stripetoken and listing id to dh server
        submitCC(response.id);
      }
    });
  }
}

//function to submit for a new CC card (or change existing)
function submitCC(stripeToken){
  $.ajax({
    url: "/profile/newcard",
    method: "POST",
    data: {
      stripeToken : stripeToken
    }
  }).done(function(data){
    $("#submit-card-button").removeClass('is-loading');

    if (data.state == "success"){
      user = data.user;
      successMessage("Successfully changed the default payment method!");
    }
    else {
      errorMessage(data.message);
    }

    setUpUpgradeTab();
  });
}

//</editor-fold>

//<editor-fold>-------------------------------UPGRADE TO PREMIUM-------------------------------

//function to submit a new premium or to renew the premium again
function submitPremium(button_elem){
  button_elem.addClass('is-loading');
  $.ajax({
    url: "/profile/upgrade",
    method: "POST",
    data: {}
  }).done(function(data){
    //if user is returning premium user or a new premium user
    var new_premium = (user.stripe_customer_id) ? false : true;
    var was_expiring = user.premium_expiring;

    //update client side variable
    if (data.user){
      user = data.user;
    }

    button_elem.removeClass('is-loading');
    if (data.state == "success"){
      if (!new_premium && was_expiring == true){
        successMessage("Successfully renewed Premium! Welcome back!");
      }
      else {
        successMessage("Successfully upgraded to Premium!");
      }
    }
    else {
      var error_msg = data.message || "Something went wrong with the renewal! Please refresh the page and try again.";
      errorMessage(error_msg);
    }

    setUpUpgradeTab();
  });
}

//function to cancel renewal of premium
function submitCancelPremium(button_elem){
  button_elem.addClass('is-loading');
  $.ajax({
    url: "/profile/downgrade",
    method: "POST"
  }).done(function(data){
    button_elem.removeClass('is-loading');

    if (data.user){
      user = data.user;
    }

    if (data.state == "success"){
      successMessage("Successfully cancelled Premium! Sorry to see you go!");
    }
    else {
      var error_msg = data.message || "Something went wrong with the cancellation! Please refresh the page and try again.";
      errorMessage(error_msg);
    }

    setUpUpgradeTab();
  });
}

//</editor-fold>

//<editor-fold>------------------------------------------------------------------------------------ HELPERS

//function to check if all fields are filled out
function checkFieldsFilled(form_elem){
  var required = form_elem.find(".stripe-input[required]");

  //make sure all required are filled
  var required_filled = required.filter(function(){
    return $(this).val();
  }).toArray();

  //if stripe info exists, make sure it's changed
  if (user.stripe_info){
    var changed = form_elem.find(".stripe-input").filter(function(){
      return $(this).val() != user.stripe_info[$(this).attr("id").replace("-input", "")];
    });
  }

  return (user.stripe_info) ? required.length == required_filled.length && changed.length > 0 : required.length == required_filled.length;
}

//check if any required field is blank
function checkRequiredFields(form_elem, which_form){
  //clear pre-existing missing
  $(".stripe-input.is-danger").removeClass('is-danger');

  var required_missing = form_elem.find(".stripe-input").filter('[required]');
  var required_missing_vals = required_missing.map(function(value){ return $(this).val() }).toArray();
  var required_missing_idx = required_missing_vals.indexOf("");
  if (required_missing_idx > 0){
    $(required_missing[required_missing_idx]).addClass('is-danger');
    errorMessage("Missing " + which_form + " information!");
    return false;
  }
  else {
    return true;
  }
}

//function to pre-fill existing stripe information
function prefillStripeInfo(){
  for (var x in user.stripe_info){
    if (user.stripe_info[x]){
      $("#" + x + "-input").val(user.stripe_info[x]);
    }
  }
  changeBankCountry($("#currency-input").val());
}

//function to submit stripe token for bank info
function submitBank(stripe_token){
  $.ajax({
    url: "/profile/settings/payout/bank",
    data: {
      stripe_token: stripe_token,
      account_type: $("#account_type-input").val()
    },
    method: "POST"
  }).done(function(data){
    if (data.state == "success"){
      $(".hide-stripe").removeClass('is-hidden');
      successMessage("Successfully updated settings!");
      user = data.user;
      cancelFormSubmit($("#payout-bank-form"));
    }
    else {
      errorMessage(data.message);
    }
  });
}

//change bank forms based on country
function changeBankCountry(currency){
  if (currency != user.stripe_info.currency){
    $(".excess-routing-input").val("");
  }

  switch (currency){
    case "AUD":
    $("#account_routing-text").text("BSB");
    $("#account_number-text").text("Account Number ");
    $("#account_routing-wrapper").removeClass("is-hidden");
    $("#account_routing2-wrapper").addClass("is-hidden");
    $("#account_routing3-wrapper").addClass("is-hidden");
    break;
    case "USD":
    $("#account_routing-text").text("Routing Number");
    $("#account_number-text").text("Account Number ");
    $("#account_routing-wrapper").removeClass("is-hidden");
    $("#account_routing2-wrapper").addClass("is-hidden");
    $("#account_routing3-wrapper").addClass("is-hidden");
    break;
    case "CAD":
    $("#account_routing-text").text("Transit Number");
    $("#account_routing2-text").text("Institution Number");
    $("#account_number-text").text("Account Number ");
    $("#account_routing-wrapper").removeClass("is-hidden");
    $("#account_routing2-wrapper").removeClass("is-hidden");
    $("#account_routing3-wrapper").addClass("is-hidden");
    break;
    case "JPY":
    $("#account_routing-text").text("Bank Code");
    $("#account_routing2-text").text("Branch Code");
    $("#account_number-text").text("Account Number ");
    $("#account_routing-wrapper").removeClass("is-hidden");
    $("#account_routing2-wrapper").removeClass("is-hidden");
    $("#account_routing3-wrapper").removeClass("is-hidden");
    break;
    case "SGD":
    $("#account_routing-text").text("Bank Code");
    $("#account_routing2-text").text("Branch Code");
    $("#account_number-text").text("Account Number ");
    $("#account_routing-wrapper").removeClass("is-hidden");
    $("#account_routing2-wrapper").removeClass("is-hidden");
    $("#account_routing3-wrapper").addClass("is-hidden");
    break;
    case "HKD":
    $("#account_routing-text").text("Clearing Code");
    $("#account_routing2-text").text("Branch Code");
    $("#account_number-text").text("Account Number ");
    $("#account_routing-wrapper").removeClass("is-hidden");
    $("#account_routing2-wrapper").removeClass("is-hidden");
    $("#account_routing3-wrapper").addClass("is-hidden");
    break;
    default:
    $("#account_number-text").text("IBAN ");
    $(".excess-routing-wrapper").addClass("is-hidden");
    break;
  }
}

//reset error success flashes
function resetErrorSuccess(leaving_form){
  cancelFormSubmit($("#payout-address-form"));
  cancelFormSubmit($("#payout-personal-form"));
  cancelFormSubmit($("#payout-bank-form"));
  $(".stripe-input.is-danger").removeClass('is-danger');
  $(".stripe-input.is-success").removeClass('is-success');
  $(".setting-message").hide();
}

//cancel form submit
function cancelFormSubmit(form){
  if (!user.stripe_info){
    form.find(".stripe-input").val("").removeClass('is-danger');
  }
  else {
    form.find(".stripe-input").val("").removeClass('is-danger');
    prefillStripeInfo();
  }
  form.find(".cancel-payout").addClass("is-hidden");
  form.find(".submit-payout").addClass("is-disabled");
}

//</editor-fold>
