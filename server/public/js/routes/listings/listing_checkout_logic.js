$(document).ready(function () {

    //--------------------------------------------------------------------------------------------------------- HEADER STEPS

    //hide the login step if logged in
    if (user){
        showStep("log");
        showMessage("address-regular-message");
    }

    //continue as guest
    $("#guest-button").on("click", function(){
        showStep("site");
        showMessage("address-regular-message");
    });

    //click to go to different step
    $(".step-header").on("click", function(){
        var step_id = $(this).attr('id').split("-");
        step_id = step_id[step_id.length - 1];
        if ($(this).attr('id') == "step-header-log" && user){
            //dont allow change to step 1 if logged in
        }
        else {
            showStep(step_id);
            showMessage($(this).next(".step-content").find(".regular-message:first-child").attr('id'));
        }
    });

    //--------------------------------------------------------------------------------------------------------- LISTING DETAILS CARD

    var total_duration = 0;
    var start_date = new_rental_info.new_rental_times[0][0];
    var end_date = new_rental_info.new_rental_times[0][0] + new_rental_info.new_rental_times[0][1];

    //loop through all new times, find start / end date, find total duration
    for (var x = 0; x < new_rental_info.new_rental_times.length; x++){
        total_duration += new_rental_info.new_rental_times[x][1];

        if (new_rental_info.new_rental_times[x][0] < start_date){
            start_date = new_rental_info.new_rental_times[x][0];
        }

        if (new_rental_info.new_rental_times[x][0] + new_rental_info.new_rental_times[x][1] > end_date){
            end_date = new_rental_info.new_rental_times[x][0] + new_rental_info.new_rental_times[x][1];
        }
    }

    $("#rental-start").text(moment(start_date).format("MMMM DD, YYYY"));
    $("#rental-end").text(moment(end_date).format("MMMM DD, YYYY"));

    total_duration = moment.duration(total_duration).as(listing_info.price_type)
    var duration_plural = (total_duration == 1) ? "" : "s";
    $("#total-duration").text(total_duration + ' ' + listing_info.price_type + duration_plural);
    $("#listing-price-rate").text(moneyFormat.to(listing_info.price_rate));

    //total price of the rental
    var total_price = calculatePrice(new_rental_info.new_rental_times, listing_info);
    $("#total-duration").text(total_duration + ' ' + listing_info.price_type + duration_plural);
    $(".total-price").text(moneyFormat.to(total_price));

    //--------------------------------------------------------------------------------------------------------- CHOICE BLOCKS

    //click choice block
    var which_address = "address-regular-message";
    $(".choice-block").on("click", function() {
        var which_choice = $(this);
        $("#choices-block").stop().fadeOut(250, function(){
            $("#choices-selected").stop().fadeIn(250);

            //build a website
            if (which_choice.hasClass("build-choice")) {
                $(".build-choice-column").removeClass("is-hidden");
                showMessage("address-build-message");
                which_address = "address-build-message";
            }

            //link a website
            else if (which_choice.hasClass("link-choice")) {
                $(".link-choice-column").removeClass("is-hidden");
                showMessage("address-link-message");
                which_address = "address-link-message";
            }

            //forward to a website
            else {
                $(".forward-choice-column").removeClass("is-hidden");
                showMessage("address-forward-message");
                which_address = "address-forward-message";
            }
        });

    });

    //back button on address selection
    $(".back-button").on("click", function() {
        $("#choices-selected").stop().fadeOut(250, function(){
            $("#choices-block").stop().fadeIn(250);
            $(".choice-column").addClass('is-hidden');
            showMessage("address-regular-message");
            $(".address-input").val("").removeClass('input-selected');
            $("#rental-will-msg").addClass('is-hidden');
            $("#rental-will-duration-msg").addClass('is-hidden');
        });
    });

    //change the card to display what will happen
    $(".address-input").on("change keyup paste", function(){
        if ($(this).val() != ""){
            var value_clipped = ($(this).val().length > 35) ? $(this).val().substr(0, 35) + "..." : $(this).val();
            if ($(this).attr("id") == "address-forward-input"){
                var rental_type_text = "will forward to <a href=" + $(this).val() + " class='is-accent'>this link </br>(" + value_clipped + ")</a>";
            }
            else {
                var rental_type_text = "will display the content on <a href=" + $(this).val() + " class='is-accent'>this link </br>(" + value_clipped + ")</a>";
            }
            $("#rental-will-msg").html(rental_type_text).removeClass('is-hidden');
            $("#rental-will-duration-msg").removeClass('is-hidden');
        }
        else {
            $(".address-input").removeClass('input-selected');
            $("#rental-will-msg").addClass('is-hidden');
            $("#rental-will-duration-msg").addClass('is-hidden');
        }
    }).on("keypress", function(e){
        //enter to go next
        if (e.keyCode == 13){
            $(this).parent(".control").next(".control").find(".address-next-button").click();
        }
    });

    //submit the new address
    $(".address-next-button").on('click', function(){
        var address_input = $(this).parent(".control").parent(".control").find(".address-input");
        if (checkAddress(address_input.val())){
            showStep("payment");
            showMessage("stripe-regular-message");
            address_input.addClass('input-selected');
        }
        else {
            showMessage("address-error-message");
        }
    });

    //--------------------------------------------------------------------------------------------------------- PAYMENT

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
                submitNewRental(response.id);
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

    //go back to address
    $("#back-to-address-button").on('click', function(){
        showStep("site");
        showMessage(which_address);
    });

});

//function to show a specific message, hide all others
function showMessage(message_id, text){
    $(".regular-message").addClass('is-hidden');
    $(".error-message").addClass('is-hidden');
    $("#" + message_id).removeClass('is-hidden');

    //optional text
    if (text){
        $("#" + message_id).text(text);
    }
}

//function to show step
function showStep(step_id){
    $(".step-header").addClass('is-disabled');
    $(".step-content").addClass('is-hidden');

    $("#step-header-" + step_id).removeClass('is-disabled');
    $("#step-content-" + step_id).removeClass('is-hidden');
}

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

//client side check and then submit for a new stripe token
function submitStripe(checkout_button){
    showMessage("stripe-regular-message");
    checkout_button.off().addClass('is-loading');

    //successfully passed address and CC test
    if (checkAddress($(".input-selected").val()) && checkCC()){
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
function submitNewRental(stripeToken){
    $.ajax({
        type: "POST",
        url: "/listing/" + listing_info.domain_name + "/rent",
        data: {
            events: new_rental_info.unformatted_times,
            new_user_email: $("#new_user_email").val(),
            address: $(".input-selected").val(),
            stripeToken: stripeToken,
            rental_type: ($(".input-selected").attr("id") == "address-forward-input") ? 1 : 0
        }
    }).done(function(data){
        $("#checkout-button").removeClass('is-loading');
        console.log(data);
        if (data.unavailable){
            errorHandler("Invalid times");
        }
        else if (data.state == "success"){
            console.log('yay');
        }
        else if (data.state == "error"){
            errorHandler(data.message);
        }
    });
}

function errorHandler(message){
    switch (message){
		case "Invalid times!":
            showMessage("stripe-error-message", "The selected times are not available anymore! Please edit your selected rental dates.");
			break;
		case "Nothing displayed at that address!":
            showStep("site");
            showMessage("address-error-message", "There's nothing to display on that site! Please choose a different website link.");
			break;
		case "Invalid rental type!":
            showMessage("stripe-error-message", "Something went wrong with the rental! Please refresh this page and try again.");
			break;
		case "Invalid address!":
            showStep("site");
            showMessage("address-error-message");
			break;
		case "Invalid email!":
            showStep("log");
			break;
		default:
            showMessage("stripe-error-message", "Something went wrong with the rental! Please try again.");
            break;
    }

    //reattach handler
    $('#checkout-button').removeClass('is-loading').on("click", function(){
        submitStripe($(this));
    });
}

//to format a number for $$$$
var moneyFormat = wNumb({
	thousand: ',',
	prefix: '$',
	decimals: 0
});

//helper function to get price of events
function calculatePrice(times, listing_info){
    if (times && listing_info){
        var totalPrice = 0;

        for (var x = 0; x < times.length; x++){
            //get total number of price type units
            var tempPrice = moment.duration(parseFloat(times[x][1]));
            if (listing_info.price_type == "month"){
                tempPrice = tempPrice.asDays() / 30;
            }
            else {
                tempPrice = tempPrice.as(listing_info.price_type);
                tempPrice = Number(Math.round(tempPrice+'e2')+'e-2');
            }

            totalPrice += tempPrice;
        }

        return totalPrice * listing_info.price_rate;
    }
    else {return false;}
}
