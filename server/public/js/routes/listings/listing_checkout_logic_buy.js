$(document).ready(function () {

  //<editor-fold>------------------------------------------PAGE SETUP----------------------------------------

  //punycode the domain name
  $(".punycode-domain").each(function(){
    $(this).text(punycode.toUnicode($(this).text()));
  });

  //set purchase price
  if (new_buying_info.id){
    $("#total-price").text(formatCurrency(new_buying_info.offer, listing_info.default_currency));
  }
  else {
    $("#total-price").text(formatCurrency(listing_info.buy_price, listing_info.default_currency));
  }

  $(".checkout-track").on("click", function(){
      trackCheckoutBehavior($(this).attr("id"));
  });

  //</editor-fold>

  //<editor-fold>------------------------------------------PAYMENT METHOD SELECTION----------------------------------------

  //click choice block
  $(".choice-block").on("click", function() {
    var which_choice = $(this).attr("id");
    $("#choices-block").stop().fadeOut(250, function(){
      $("#choices-selected").stop().fadeIn(250);

      //stripe
      if (which_choice == "stripe-choice") {
        $("#stripe-choice-column").removeClass("is-hidden").find('#cc-num').focus();
        showMessage("stripe-regular-message");
        $("#paypal-button").addClass("is-hidden");
        $("#checkout-button").removeClass("is-hidden");
      }

      //paypal
      else if (which_choice == "paypal-choice") {
        $("#paypal-choice-column").removeClass("is-hidden");
        showMessage("paypal-regular-message");
        $("#paypal-button").removeClass("is-hidden");
        $("#checkout-button").addClass("is-hidden");
      }

      //bitcoin
      else if (which_choice == "bitcoin-choice") {
        $("#bitcoin-choice-column").removeClass("is-hidden");
        showMessage("bitcoin-regular-message");
      }
    });

  });

  //back button to go back to payment method selection
  $(".goback-button").on("click", function() {
    $("#choices-selected").stop().fadeOut(250, function(){
      $("#choices-block").stop().fadeIn(250);
      $(".choice-column").addClass('is-hidden');
      showMessage("payment-regular-message");
    });
  });

  //create paypal button
  createPayPalButton();

  //</editor-fold>

  //<editor-fold>------------------------------------------STRIPE----------------------------------------

  //key for stripe
  if (node_env == "dev"){
    Stripe.setPublishableKey('pk_test_kcmOEkkC3QtULG5JiRMWVODJ');
  }
  else {
    Stripe.setPublishableKey('pk_live_506Yzo8MYppeCnLZkW9GEm13');
  }

  //format all stripe inputs
  $('#cc-num').payment('formatCardNumber');
  $('#cc-exp').payment('formatCardExpiry');
  $('#cc-cvc').payment('formatCardCVC');
  $('#cc-zip').payment('restrictNumeric');

  //stripe submit checkout handler
  $('#checkout-button').on("click", function(e){
    submitStripe();
  });

  //request a token from stripe
  $("#stripe-form").submit(function(e){
    Stripe.card.createToken($(this), function(status, response){
      if (response.error){
        $('#checkout-button').removeClass('is-loading');
        showMessage("stripe-error-message", response.error.message);
      }
      //all good!
      else {
        submitNewPurchase("stripe", response.id);
      }
    });
    return false;
  });

  //to remove any stripe error messages
  $(".stripe-input").on("change keyup paste", function(){
    if ($("#stripe-error-message").hasClass('is-danger')){
      $("#stripe-error-message").addClass('is-hidden');
      $("#stripe-regular-message").removeClass('is-hidden');
    }

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

  //</editor-fold>

});

//<editor-fold>------------------------------------------PAYPAL----------------------------------------

//create a paypal checkout button
function createPayPalButton(){
  paypal.Button.render({
    env : 'sandbox',
    // env: 'production',
    commit : true,
    style : {
      color : 'black',
      shape : 'rect',
      size : 'responsive',
      label : "checkout",
      tagline : false
    },

    //set up a getter to create a Payment ID using the payments api on server
    payment : function() {
      return new paypal.Promise(function(resolve, reject) {

        //make an ajax call to backend get the Payment ID (via PayPal Payment Create api)
        $.ajax({
          type: "POST",
          url: "/listing/" + listing_info.domain_name.toLowerCase() + "/buy/paypalID",
        }).done(function(data){
          if (data.state == "success" && data.payment){
            resolve(data.payment.id);
          }
          else {
            errorHandler("Something went wrong with your PayPal payment! Please refresh the page and try again.");
            reject(new Error(data.message));
          }
        }).fail(function(err){
          errorHandler("Something went wrong with your PayPal payment! Please refresh the page and try again.");
          reject(new Error(err));
        });
      });
    },

    //payment has been authorized, submit and execute payment via PayPal Payment Execute api
    onAuthorize : function(data) {
      submitNewPurchase("paypal", {
        paymentID: data.paymentID,
        payerID: data.payerID
      });
    },

    //when the customer cancels the payment
    onCancel : function(data) {
      console.log('The payment was cancelled!', data);
    },

    //when theres an error with the payment
    onError: function(err) {
      console.log("Something went wrong!", err)
    }

  }, '#paypal-button');
}

//</editor-fold>

//<editor-fold>------------------------------------------STRIPE----------------------------------------

//check the CC info
function checkCC(){
  $("#stripe-regular-message").addClass('is-hidden');
  if (!$("#cc-num").val()){
    $("#stripe-error-message").removeClass('is-hidden').addClass('is-danger').html("Please provide a credit card to charge.");
  }
  else if (!$("#cc-exp").val()){
    $("#stripe-error-message").removeClass('is-hidden').addClass('is-danger').html("Please provide your credit card expiration date.");
  }
  else if (!$("#cc-cvc").val()){
    $("#stripe-error-message").removeClass('is-hidden').addClass('is-danger').html("Please provide your credit card CVC number.");
  }
  else if (!$("#cc-zip").val()){
    $("#stripe-error-message").removeClass('is-hidden').addClass('is-danger').html("Please provide a ZIP code.");
  }
  else {
    $("#stripe-regular-message").removeClass('is-hidden');
    return true;
  }
}

//client side check and then submit for a new stripe token
function submitStripe(checkout_button){
  showMessage("stripe-regular-message");
  $("#checkout-button").addClass('is-loading');

  //successfully passed CC test
  if (checkCC()){
    //submit to get the stripe token
    $("#stripe-form").submit();
  }
  else {
    $("#checkout-button").removeClass('is-loading');
  }
}

//</editor-fold>

//<editor-fold>------------------------------------------SUBMIT PAYMENT----------------------------------------

//submit for a new purchase
function submitNewPurchase(type, token){
  var data_for_submit = {
    payment_type : type
  }

  if (type == "stripe"){
    data_for_submit.stripeToken = token;
  }
  else if (type == "paypal" && token){
    data_for_submit.paymentID = token.paymentID;
    data_for_submit.payerID = token.payerID;
  }

  $.ajax({
    type: "POST",
    url: "/listing/" + listing_info.domain_name.toLowerCase() + "/buy",
    data: data_for_submit
  }).done(function(data){
    $("#checkout-button").removeClass('is-loading');
    if (data.state == "success"){
      successHandler(data);
    }
    else {
      errorHandler(data.message);
    }
  });
}

//handler for various error messages
function errorHandler(message){
  switch (message){
    case "Invalid email!":
      showStep("log");
      showMessage("log-error-message");
    break;
    default:
    if (message){
      showMessage("stripe-error-message", message);
    }
    else {
      showMessage("stripe-error-message", "Something went wrong with processing the purchase! Please refresh the page and try again.");
    }
    break;
  }

  //reattach handler
  $('#checkout-button').removeClass('is-loading').on("click", function(){
    submitStripe($(this));
  });
}

//handler for successful purchase
function successHandler(rental_id, owner_hash_id){
  //hide certain stuff
  $("#choices-selected").remove();
  $("#edit-dates-button").remove();
  $("#checkout-success-content").removeClass('is-hidden');
  showMessage("stripe-success-message", "Hurray! Your purchase has been completed. Please check your email for further instructions on ownership transfer.");
}

//</editor-fold>

//<editor-fold>------------------------------------------HELPERS----------------------------------------

//used to see what people are doing on this checkout page
function trackCheckoutBehavior(id){
  $.ajax({
    url: "/listing/" + listing_info.domain_name.toLowerCase() + "/checkouttrack",
    method: "POST",
    async: true,
    data: {
      elem_id : id
    }
  }).done(function(data){
    // console.log(data);
  });
}

//show a specific message, hide all others
function showMessage(message_id, text){
  $(".regular-message").addClass('is-hidden');
  $(".error-message").addClass('is-hidden');
  $("#log-error-message").addClass('is-hidden');
  $("#" + message_id).removeClass('is-hidden');

  //optional text
  if (text){
    $("#" + message_id).html(text);
  }
}

//to format a number for currency
function formatCurrency(number, currency_code){
  var default_currency_details = (currency_code) ? currency_codes[currency_code.toUpperCase()] : currency_codes["USD"];
  var currency_details = {
    thousand: ',',
    decimals: 0,
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

//get multiplier of a currency
function getCurrencyMultiplier(currency_code){
  var default_currency_details = (currency_code) ? currency_codes[currency_code.toUpperCase()] : currency_codes["USD"];
  return Math.pow(10, default_currency_details.fractionSize);
}

//</editor-fold>
