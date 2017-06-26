$(document).ready(function () {

    //set purchase price
    $("#total-price").text(moneyFormat.to(listing_info.buy_price));

    //<editor-fold>-------------------------------PAYMENT METHOD SELECTION-------------------------------

    //click choice block
    $(".choice-block").on("click", function() {
        var which_choice = $(this).attr("id");
        $("#choices-block").stop().fadeOut(250, function(){
            $("#choices-selected").stop().fadeIn(250);

            //stripe
            if (which_choice == "stripe-choice") {
                $("#stripe-choice-column").removeClass("is-hidden").find('#cc-num').focus();
                showMessage("stripe-regular-message");
            }

            //paypal
            else if (which_choice == "paypal-choice") {
                $("#paypal-choice-column").removeClass("is-hidden").find('input').focus();
                showMessage("paypal-regular-message");
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

    //</editor-fold>

    //<editor-fold>-------------------------------PAYMENT-------------------------------

    //key for stripe
    if (window.location.hostname == "localhost"){
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
                $('#checkout-button').removeClass('is-loading').on("click", function(){
                    submitStripe($(this));
                });
                showMessage("stripe-error-message", response.error.message);
            }
            //all good!
            else {
                submitNewPurchase(response.id);
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
        if ($(".fa-cc-" + card_type) && card_type){
            $("#cc-icon").removeClass();
            $("#cc-icon").addClass("fa fa-cc-" + card_type);
        }
        //or show default
        else {
            $("#cc-icon").removeClass();
            $("#cc-icon").addClass("fa fa-credit-card");
        }
    });

    //checkout button
    $('#checkout-button').on("click", function(e){
        submitStripe($(this));
    });

    //</editor-fold>

    //--------------------------------------------------------------------------------------------------------- BEHAVIOR TRACKER

    // $(".checkout-track").on("click", function(){
    //     trackCheckoutBehavior($(this).attr("id"));
    // });

});

//used to see what people are doing on this checkout page
function trackCheckoutBehavior(id){
    $.ajax({
        url: "/listing/" + listing_info.domain_name + "/checkouttrack",
        method: "POST",
        async: true,
        data: {
            elem_id : id
        }
    }).done(function(data){
        // console.log(data);
    });
}

//function to show a specific message, hide all others
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
    checkout_button.off().addClass('is-loading');

    //successfully passed CC test
    if (checkCC()){
        //submit to get the stripe token
        $("#stripe-form").submit();
    }
    else {
        checkout_button.removeClass('is-loading');
        checkout_button.on("click", function(){
            submitStripe(checkout_button);
        });
    }
}

//submit for a new rental
function submitNewPurchase(stripeToken){
    $.ajax({
        type: "POST",
        url: "/listing/" + listing_info.domain_name + "/buy",
        data: {
            stripeToken: stripeToken
        }
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
            showMessage("stripe-error-message", "Something went wrong with the payment! Please refresh the page and try again.");
            break;
    }

    //reattach handler
    $('#checkout-button').removeClass('is-loading').on("click", function(){
        submitStripe($(this));
    });
}

//handler for successful rental
function successHandler(rental_id, owner_hash_id){
    //hide certain stuff
    $("#choices-selected").remove();
    $("#edit-dates-button").find("a").text('Find similar domains').attr("href", "/listings");
    $("#checkout-success-content").removeClass('is-hidden');
    showMessage("stripe-success-message", "Hurray! Your purchase has been completed. Please check your email for further instructions on ownership transfer.");
}

//to format a number for $$$$
var moneyFormat = wNumb({
  thousand: ',',
  prefix: '$',
  decimals: 2
});
