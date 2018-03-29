$(document).ready(function () {

  //<editor-fold>------------------------------------------PAGE SETUP----------------------------------------

  //set up the page
  showStep("site");
  showMessage("site-regular-message");

  //production to track what elements were clicked on
  $(".checkout-track").on("click", function(){
    trackCheckoutBehavior($(this).attr("id"));
  });

  //</editor-fold>

  //<editor-fold>------------------------------------------LISTING DETAILS CARD----------------------------------------

  var starttime = moment(new_rental_info.starttime);
  var endtime = moment(new_rental_info.endtime);
  var total_duration = endtime.diff(starttime);

  $("#rental-start").text(starttime.format("MMMM D, YYYY"));
  $("#rental-end").text(endtime.format("MMMM D, YYYY"));

  //total duration of the rental (rounded)
  total_duration = moment.duration(total_duration).as(listing_info.price_type);
  total_duration = Math.round(total_duration * 100) / 100;
  var duration_plural = (total_duration == 1) ? "" : "s";
  $("#total-duration").text(total_duration + ' ' + listing_info.price_type + duration_plural);
  $("#listing-price-rate").text(moneyFormat.to(listing_info.price_rate));

  //total price of the rental
  var overlappedTime = anyFreeDayOverlap(starttime, endtime);
  var total_price = calculatePrice(starttime, endtime, overlappedTime, listing_info);
  $("#total-duration").text(total_duration + ' ' + listing_info.price_type + duration_plural);
  $("#sub-total-price").text(moneyFormat.to(total_price));

  //discounted times
  if (overlappedTime){
    var orig_price = calculatePrice(starttime, endtime, 0, listing_info);
    var discount_price = calculateDiscountPrice(moment.duration(overlappedTime));
    $("#sub-total-price").text(moneyFormat.to(orig_price));

    $(".discount-hidden").removeClass('is-hidden');
    discount_duration = moment.duration(overlappedTime).as(listing_info.price_type);
    discount_duration = Math.round(discount_duration * 100) / 100;
    var duration_plural = (discount_duration == 1) ? "" : "s";
    $("#discount-duration").text(discount_duration + " " + listing_info.price_type + duration_plural);
    $("#discount-price").text("-$" + discount_price);
  }

  //free or not
  if (total_price != 0){
    $("#total-price").text(moneyFormat.to(total_price));
  }
  else {
    $("#total-price").text("Free");
  }

  //change the listing details card to display what will happen (on address input)
  $(".address-input").on("change keyup paste input", function(){
    if ($(this).val() != ""){
      var value_clipped = ($(this).val().length > 35) ? $(this).val().substr(0, 35) + "..." : $(this).val();
      var link_absolute = ($(this).val().indexOf("http") == -1) ? "http://" + $(this).val() : $(this).val();
      if ($(this).attr("id") == "address-forward-input"){
        $("#rental-will-msg").text("Will forward to");
      }
      else {
        $("#rental-will-msg").text("Will display the content on");
      }
      $("#rental-will-link").text(value_clipped).attr('href', link_absolute);
      $("#rental-will-wrapper").removeClass('is-hidden');
      $("#rental-will-duration-msg").removeClass('is-hidden');
      $(".address-next-button").removeClass('is-disabled');
    }
    else {
      $(".address-input").removeClass('input-selected');
      $(".address-next-button").addClass('is-disabled');
      $("#rental-will-wrapper").addClass('is-hidden');
      $("#rental-will-duration-msg").addClass('is-hidden');
    }
  }).on("keypress", function(e){
    //enter to go next
    if (e.keyCode == 13){
      $(this).parent(".control").next(".control").find(".address-next-button").click();
    }
  });

  //</editor-fold>

  //<editor-fold>------------------------------------------CHOICE BLOCKS (RENTAL / PAYMENT TYPE)----------------------------------------

  //click choice block (what type of rental / payment you want)
  $(".choice-block").on("click", function() {
    var which_choice = $(this);

    var step_content = $(this).closest(".step-content");
    var choices_selected = step_content.find(".choices-selected");
    var choices_block = step_content.find(".choices-block");

    choices_block.stop().fadeOut(250, function(){
      choices_selected.stop().fadeIn(250);

      //build a website
      if (which_choice.hasClass("build-choice")) {
        $(".build-choice-column").removeClass("is-hidden").find('input').focus();
        showMessage("address-build-message");
      }

      //link a website
      else if (which_choice.hasClass("link-choice")) {
        $(".link-choice-column").removeClass("is-hidden").find('input').focus();
        showMessage("address-link-message");
      }

      //forward to a website
      else if (which_choice.hasClass("forward-choice")){
        $(".forward-choice-column").removeClass("is-hidden").find('input').focus();
        showMessage("address-forward-message");
      }

      //stripe (credit card)
      else if (which_choice.hasClass("stripe-choice")){
        $(".stripe-choice-column").removeClass("is-hidden").find('input:first').focus();
        showMessage("stripe-regular-message");
        $("#paypal-button").addClass("is-hidden");
        $("#checkout-button").removeClass("is-hidden");
      }

      //paypal
      else if (which_choice.hasClass("paypal-choice")){
        $(".paypal-choice-column").removeClass("is-hidden");
        showMessage("paypal-regular-message");
        $("#paypal-button").removeClass("is-hidden");
        $("#checkout-button").addClass("is-hidden");
      }

      //bitcoin
      else if (which_choice.hasClass("bitcoin-choice")){
        $(".bitcoin-choice-column").removeClass("is-hidden").find('input').focus();
        showMessage("bitcoin-regular-message");
      }
    });

  });

  //back button on address / payment selection
  $(".back-button").on("click", function() {
    var step_content = $(this).closest(".step-content");
    var which_step = step_content.attr("id").split("-")[2] + "-regular-message";
    var choices_selected = step_content.find(".choices-selected");
    var choices_block = step_content.find(".choices-block");

    choices_selected.stop().fadeOut(250, function(){
      choices_block.stop().fadeIn(250);
      step_content.find(".choice-column").addClass('is-hidden');
      showMessage(which_step);

      //going back to address
      if (which_step == "site-regular-message"){
        $(".address-input").val("").removeClass('input-selected');
        $("#rental-will-wrapper").addClass('is-hidden');
        $("#rental-will-duration-msg").addClass('is-hidden');
        $(".address-next-button").addClass('is-disabled');
      }
    });
  });

  //submit the new address and go next to payment type selector
  $(".address-next-button").on('click', function(){
    var address_input = $(this).parent(".control").parent(".control").find(".address-input");
    if (checkAddress(address_input.val())){
      showStep("payment");
      showMessage("payment-regular-message");
      address_input.addClass('input-selected');
    }
    else {
      showMessage("address-error-message");
    }
  });

  //go back to address from payment type selector
  $("#back-to-address-button").on('click', function(){
    showStep("site");
    showMessage("site-regular-message");
  });

  //</editor-fold>

  //<editor-fold>------------------------------------------PAYMENT----------------------------------------

    //stripe submit checkout handler
    $('#checkout-button').on("click", function(e){
      submitStripe();
    });

    //create paypal button
    createPayPalButton();

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

    //request a token from stripe
    $("#stripe-form").submit(function(e){
      Stripe.card.createToken($(this), function(status, response){
        if (response.error){
          $('#checkout-button').removeClass('is-loading');
          showMessage("stripe-error-message", response.error.message);
        }
        //all good!
        else {
          submitNewRental("stripe", response.id);
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

    //<editor-fold>------------------------------------------PAYPAL----------------------------------------

    //</editor-fold>

  //</editor-fold>

});

//<editor-fold>------------------------------------------CHECKS----------------------------------------

//check the address of the site
function checkAddress(address){
  return address.includes(".");
}

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

//</editor-fold>

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
      size : 'large',
      label : "checkout",
      tagline : false
    },

    //set up a getter to create a Payment ID using the payments api on server
    payment : function() {
      return new paypal.Promise(function(resolve, reject) {

        //make an ajax call to backend get the Payment ID (via PayPal Payment Create api)
        $.ajax({
          type: "POST",
          url: "/listing/" + listing_info.domain_name.toLowerCase() + "/rent/paypalID",
        }).done(function(data){
          if (data.state == "success" && data.payment){
            resolve(data.payment.id);
          }
          else {
            errorHandler(data.message);
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
      submitNewRental("paypal", {
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

//client side check and then submit for a new stripe token
function submitStripe(){
  showMessage("stripe-regular-message");
  $("#checkout-button").addClass('is-loading');

  //successfully passed address and CC test
  if (new_rental_info.price != 0 && checkCC() && checkAddress($(".input-selected").val())){
    $("#stripe-form").submit();   //submit to get the stripe token
  }
  //free! so just submit
  else if (new_rental_info.price == 0 && checkAddress($(".input-selected").val())){
    submitNewRental();
  }
  //client side failed check
  else {
    $("#checkout-button").removeClass('is-loading');
  }
}

//</editor-fold>

//<editor-fold>------------------------------------------SUBMIT PAYMENT----------------------------------------

//submit for a new rental
function submitNewRental(type, token){
  var data_for_submit = {
    starttime: new_rental_info.starttime,
    endtime: new_rental_info.endtime,
    address: $(".input-selected").val(),
    rental_type: ($(".input-selected").attr("id") == "address-forward-input") ? 1 : 0,
    payment_type: type
  }

  //type of payment
  if (type == "stripe" && token){
    data_for_submit.stripeToken = token;
  }
  else if (type == "paypal" && token){
    data_for_submit.paymentID = token.paymentID;
    data_for_submit.payerID = token.payerID;
    $("#paypal-button-loading").removeClass('is-hidden');
    $("#paypal-button").addClass('is-hidden');
  }

  //optional email for unregistered renters
  if ($("#new-user-email").val()){
    data_for_submit.new_user_email = $("#new-user-email").val();
  }

  $.ajax({
    type: "POST",
    url: "/listing/" + listing_info.domain_name.toLowerCase() + "/rent",
    data: data_for_submit
  }).done(function(data){
    $("#checkout-button").removeClass('is-loading');

    //handlers
    if (data.state == "success"){
      successHandler(data.rental_id, data.owner_hash_id);
    }
    else if (data.unavailable){
      errorHandler("Dates are unavailable!");
    }
    else {
      errorHandler(data.message);
    }

    //show paypal again
    if (type == "paypal"){
      $("#paypal-button-loading").addClass('is-hidden');
      $("#paypal-button").removeClass('is-hidden');
    }
  });
}

//handler for various error messages
function errorHandler(message){
  switch (message){
    case "Dates are unavailable!":
    showMessage("stripe-error-message", "The selected time slot is not available anymore! Please edit your selected rental dates.");
    break;
    case "Invalid dates!":
    showMessage("stripe-error-message", "The selected time slot was invalid! Please edit your selected rental dates.");
    break;
    case "Invalid start time!":
    showMessage("stripe-error-message", "The selected start time was invalid! Please edit your selected rental dates.");
    break;
    case "Invalid end time!":
    showMessage("stripe-error-message", "The selected end time was invalid! Please edit your selected rental dates.");
    break;
    case "There's something wrong with this address!":
    showStep("site");
    showMessage("address-error-message", "There's something wrong with this address! Please choose a different website link.");
    break;
    case "Invalid rental type!":
    showMessage("stripe-error-message", "Something went wrong with processing the rental! Please refresh the page and try again.");
    break;
    case "Invalid address!":
    showStep("site");
    showMessage("address-error-message", "This is an invalid website link! Please choose a different website link.");
    break;
    case "Malicious address!":
    showStep("site");
    showMessage("address-error-message", "This website link has been deemed malicious or dangerous! Please choose a different website link.");
    break;
    default:
    if (message){
      showMessage("stripe-error-message", message);
    }
    else {
      showMessage("stripe-error-message", "Something went wrong with processing the rental! Please refresh the page and try again.");
    }
    break;
  }
}

//handler for successful rental
function successHandler(rental_id, owner_hash_id){

  //hide the payment choices section
  $(".choices-selected").fadeOut(250, function(){
    //show success message
    var domain_and_path = (new_rental_info.path) ? listing_info.domain_name + "/" + new_rental_info.path : listing_info.domain_name;
    var starttime_format = moment(new_rental_info.starttime).format("MMMM D, YYYY");
    var endtime_format = moment(new_rental_info.endtime).format("MMMM D, YYYY");
    showMessage("stripe-success-message", "Hurray! Your rental was successfully created for <strong>" + domain_and_path + "</strong>. It is scheduled to start on <strong>" + starttime_format + "</strong> and end on <strong>" + endtime_format + "</strong>.");

    //hide certain stuff
    $("#checkout-card-content").remove();
    $("#checkout-success-content").removeClass('is-hidden');
    $("#edit-dates-text").text('Rent again');
    $("#edit-dates-icon").removeClass('fa-pencil').addClass('fa-check');

    //remove click handler for going back to login/customize
    $(".step-header").off();

    var owner_hash_id = (owner_hash_id) ? "/" + owner_hash_id : "";

    //edit preview button
    if (listing_info.premium){
      $("#rental-preview-button").attr("href", "/listing/" + listing_info.domain_name.toLowerCase() + "/" + rental_id);
      $("#rental-link-input").val("https://" + listing_info.domain_name.toLowerCase() + "/listing/" + listing_info.domain_name.toLowerCase() + "/" + rental_id + owner_hash_id);
    } else {
      $("#rental-preview-button").attr("href", "https://domahub.com/listing/" + listing_info.domain_name.toLowerCase() + "/" + rental_id);
      $("#rental-link-input").val("https://domahub.com/listing/" + listing_info.domain_name.toLowerCase() + "/" + rental_id + owner_hash_id);
    }

    //copy ownership url
    $("#rental-link-input").on("click", function(){
      $(this).select();
    });
    $("#rental-link-copy").on("click", function(){
      $("#rental-link-input").select();
      document.execCommand("copy");
      $("#rental-link-input").blur();
      $(this).find("i").removeClass("fa-clipboard").addClass('fa-check-square-o');
    });
  });
}

//</editor-fold>

//<editor-fold>------------------------------------------HELPERS----------------------------------------

//to format a number for $$$$
var moneyFormat = wNumb({
  thousand: ',',
  prefix: '$',
  decimals: 2
});

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

//show step
function showStep(step_id){
  $(".step-header").addClass('is-disabled');
  $(".step-content").addClass('is-hidden');
  if (step_id == "site"){
    var coming_step_id = "log";
  }
  $("#step-header-" + step_id).removeClass('is-disabled');
  $("#step-content-" + step_id).removeClass("is-hidden");

  //focus any visible input fields
  $("#step-content-" + step_id).find("input:visible").first().focus();
}

//helper function to get price of events
function calculatePrice(starttime, endtime, overlappedTime, listing_info){
  if (starttime && endtime && listing_info){
    //get total number of price type units
    var totalPrice = moment.duration(endtime.diff(starttime));
    totalPrice.subtract(overlappedTime);
    if (listing_info.price_type == "month"){
      totalPrice = totalPrice.asDays() / 30;
    }
    else {
      totalPrice = totalPrice.as(listing_info.price_type);
      totalPrice = Number(Math.round(totalPrice+'e2')+'e-2');
    }

    return totalPrice * listing_info.price_rate;
  }
  else {return "ERROR";}
}

//figure out price from milliseconds
function calculateDiscountPrice(totalduration){
  if (listing_info.price_type == "month"){
    totalduration = totalduration.asDays() / 30;
  }
  else {
    totalduration = totalduration.as(listing_info.price_type);
    totalduration = Number(Math.round(totalduration+'e2')+'e-2');
  }
  return Number(Math.round((totalduration * listing_info.price_rate)+'e2')+'e-2').toFixed(2)
}

//figure out if the start and end dates overlap any free periods
function anyFreeDayOverlap(starttime, endtime){
  if (listing_info.freetimes && listing_info.freetimes.length > 0){
    var overlap_time = 0;
    for (var x = 0; x < listing_info.freetimes.length; x++){
      var freetime_start = moment(listing_info.freetimes[x].date);
      var freetime_end = moment(listing_info.freetimes[x].date + listing_info.freetimes[x].duration);

      //there is overlap
      if (starttime.isBefore(freetime_end) && endtime.isAfter(freetime_start)){
        //completely covered by free time
        if (starttime.isSameOrAfter(freetime_start) && endtime.isSameOrBefore(freetime_end)){
          overlap_time += endtime.diff(starttime);
        }
        //completely covers free time
        else if (freetime_start.isSameOrAfter(starttime) && freetime_end.isSameOrBefore(endtime)){
          overlap_time += freetime_end.diff(freetime_start);
        }
        //overlap partially in the end of wanted time
        else if (starttime.isSameOrBefore(freetime_start) && endtime.isSameOrBefore(freetime_end)){
          overlap_time += endtime.diff(freetime_start);
        }
        //overlap partially at the beginning of wanted time
        else {
          overlap_time += freetime_end.diff(starttime);
        }
      }
    }
    return overlap_time;
  }
  else {
    return 0;
  }
}

//</editor-fold>
