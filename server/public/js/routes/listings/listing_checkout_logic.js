$(document).ready(function () {

    //--------------------------------------------------------------------------------------------------------- HEADER STEPS

    //function to go to build a site step
    var not_user_step = function(){
        $("#step-header-log").addClass('is-disabled');
        $("#step-content-log").addClass('is-hidden');

        $("#step-header-site").removeClass('is-disabled');
        $("#step-content-site").removeClass('is-hidden');
    }

    //hide the login step if logged in
    if (user){
        not_user_step();
    }

    //continue as guest
    $("#guest-button").on("click", function(){
        not_user_step();
    });

    //click to go to different step
    $(".step-header").on("click", function(){
        if ($(this).attr('id') == "step-header-log" && user){
            //dont allow change to step 1 if logged in
        }
        else {
            $(".step-header").addClass('is-disabled');
            $(this).removeClass('is-disabled');

            $(".step-content").addClass('is-hidden');
            $(this).next(".step-content").removeClass('is-hidden');

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
            $(".address-input").val("");
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
            $("#rental-will-msg").addClass('is-hidden');
            $("#rental-will-duration-msg").addClass('is-hidden');
        }
    });

    //submit the new address
    $(".address-next-button").on('click', function(){
        $("#step-header-site").addClass('is-disabled');
        $("#step-content-site").addClass('is-hidden');

        $("#step-header-payment").removeClass('is-disabled');
        $("#step-content-payment").removeClass('is-hidden');
        showMessage("stripe-regular-message");
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
                $('#checkout-button').removeClass('is-loading');
                $("#stripe-error-message").removeClass('is-hidden').text(response.error.message).addClass('is-danger');
                $("#stripe-regular-message").addClass('is-hidden');
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
        $("#step-header-payment").addClass('is-disabled');
        $("#step-content-payment").addClass('is-hidden');

        $("#step-header-site").removeClass('is-disabled');
        $("#step-content-site").removeClass('is-hidden');
        showMessage(which_address);
    });

});

//function to show a specific message, hide all others
function showMessage(message_id){
    $(".regular-message").addClass('is-hidden');
    $("#" + message_id).removeClass('is-hidden');
    $(".error-message").addClass('is-hidden');
}

//check the address of the site
function checkAddress(){
    return true;
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
    checkout_button.off().addClass('is-loading');

    //successfully passed address and CC test
    if (checkAddress() && checkCC()){

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
    //create a new rental
    $.ajax({
        type: "POST",
        url: "/listing/" + listing_info.domain_name + "/checkout",
        data: {
            events: minEvents,
            new_user_email: $("#new_user_email").val(),
            address: $("#address_form_input").val(),
            stripeToken: stripeToken,
            rental_type: 0
        }
    }).done(function(data){
        checkout_button.removeClass('is-loading');
        unlock = true;
        if (data.unavailable){
            for (var x = 0; x < data.unavailable.length; x++){
                $('#calendar').fullCalendar('removeEvents', data.unavailable[x]._id);
                $("#calendar-error-message").removeClass('is-hidden').addClass('is-danger').html("Invalid slots have been removed from your selection!");
            }
        }
        else if (data.state == "success"){
            window.location.assign(window.location.origin + "/listing/" + listing_info.domain_name + "/checkout");
        }
        else if (data.state == "error"){
            $("#calendar-error-message").removeClass('is-hidden').addClass('is-danger').html("Something went wrong with the rental! Please try again.");
        }
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
