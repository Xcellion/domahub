$(document).ready(function () {

    //--------------------------------------------------------------------------------------------------------- HEADER STEPS

    //hide the login step if logged in
    if (user){
        showStep("site");
        showMessage("address-regular-message");
    }

    //continue as guest
    $("#guest-button").on("click", function(){
        $(this).next(".control").removeClass('is-hidden');
        $(this).addClass("is-hidden");
        $("#new-user-email").focus();
        $("#email-balloon").removeClass('is-hidden');
        showMessage("guest-regular-message", "Enter your email below.");
    });

    //submit guest email
    $("#guest-submit").on("click", function() {
        if (checkEmail($("#new-user-email").val())){
            showStep("site");
            showMessage("address-regular-message");
        }
        else {
            showMessage("log-error-message");
        }
    });

    //enter in an email for guests
    $("#new-user-email").on("change keyup paste", function(){
        if ($(this).val()){
            $("#guest-submit").removeClass('is-disabled');
        }
        else {
            $("#guest-submit").addClass('is-disabled');
        }
    }).on("keypress", function(e){
        //enter to go next
        if (e.keyCode == 13 && checkEmail($(this).val())){
            $("#guest-submit").click();
        }
    });

    //click to go to different step
    $(".step-header").on("click", function(){
        if ($(this).attr('id') == "step-header-log" && user){
            //dont allow change to step 1 if logged in
        }
        else if ($(this).data('can-go') == true){
            var step_id = $(this).attr('id').split("-");
            step_id = step_id[step_id.length - 1];
            showStep(step_id);
            showMessage($(this).next(".step-content").find(".regular-message:first-child").attr('id'));
        }
    });

    //--------------------------------------------------------------------------------------------------------- LISTING DETAILS CARD

    var starttime = moment(new_rental_info.starttime);
    var endtime = moment(new_rental_info.endtime);
    var total_duration = endtime.diff(starttime);

    $("#rental-start").text(starttime.format("MMMM D, YYYY"));
    $("#rental-end").text(endtime.format("MMMM D, YYYY"));

    //total duration of the rental (rounded)
    total_duration = moment.duration(total_duration).as(listing_info.price_type);
    total_duration = Math.round(total_duration * 100) / 100
    var duration_plural = (total_duration == 1) ? "" : "s";
    $("#total-duration").text(total_duration + ' ' + listing_info.price_type + duration_plural);
    $("#listing-price-rate").text(moneyFormat.to(listing_info.price_rate));

    //total price of the rental
    var total_price = calculatePrice(starttime, endtime, listing_info);
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
                $(".build-choice-column").removeClass("is-hidden").find('input').focus();
                showMessage("address-build-message");
                which_address = "address-build-message";
            }

            //link a website
            else if (which_choice.hasClass("link-choice")) {
                $(".link-choice-column").removeClass("is-hidden").find('input').focus();
                showMessage("address-link-message");
                which_address = "address-link-message";
            }

            //forward to a website
            else {
                $(".forward-choice-column").removeClass("is-hidden").find('input').focus();
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
                var rental_type_text = "Will forward to <a target='_blank' href=" + $(this).val() + " class='is-accent'>this link </br>(" + value_clipped + ")</a>";
            }
            else {
                var rental_type_text = "Will display the content on <a target='_blank' href=" + $(this).val() + " class='is-accent'>this link </br>(" + value_clipped + ")</a>";
            }
            $("#rental-will-msg").html(rental_type_text).removeClass('is-hidden');
            $("#rental-will-duration-msg").removeClass('is-hidden');
            $(".address-next-button").removeClass('is-disabled');
        }
        else {
            $(".address-input").removeClass('input-selected');
            $(".address-next-button").addClass('is-disabled');
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
    $("#log-error-message").addClass('is-hidden');
    $("#" + message_id).removeClass('is-hidden');

    //optional text
    if (text){
        $("#" + message_id).html(text);
    }
}

//function to show step
function showStep(step_id){
    $(".step-header").addClass('is-disabled');
    $(".step-content").addClass('is-hidden');

    if (step_id == "site"){
        var coming_step_id = "log";
    }

    $("#step-header-" + step_id).removeClass('is-disabled');
    $("#step-header-" + step_id).data("can-go", true);
    $("#step-header-" + coming_step_id).data("can-go", true);
    $("#step-content-" + step_id).removeClass('is-hidden');

    //focus any visible input fields
    $("#step-content-" + step_id).find("input:visible").first().focus();
}

//check the address of the site
function checkAddress(address){
    return address.includes(".");
}

//check the email
function checkEmail(email){
    return email.includes("@");
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
            starttime: new_rental_info.starttime,
            endtime: new_rental_info.endtime,
            new_user_email: $("#new-user-email").val(),
            address: $(".input-selected").val(),
            stripeToken: stripeToken,
            rental_type: ($(".input-selected").attr("id") == "address-forward-input") ? 1 : 0
        }
    }).done(function(data){
        $("#checkout-button").removeClass('is-loading');
        if (data.unavailable){
            errorHandler("Invalid times");
        }
        else if (data.state == "success"){
            successHandler(data.rental_id, data.owner_hash_id);
        }
        else if (data.state == "error"){
            errorHandler(data.message);
        }
    });
}
//handler for various error messages
function errorHandler(message){
    console.log(message);
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
            showMessage("address-error-message", "This is an invalid website link! Please choose a different website link.");
			break;
        case "Malicious address!":
            showStep("site");
            showMessage("address-error-message", "This website link has been deemed malicious or dangerous! Please choose a different website link.");
            break;
		case "Invalid email!":
            showStep("log");
            showMessage("log-error-message");
			break;
		default:
            showMessage("stripe-error-message", "Something went wrong with the rental! Please refresh the page and try again.");
            break;
    }

    //reattach handler
    $('#checkout-button').removeClass('is-loading').on("click", function(){
        submitStripe($(this));
    });
}

//handler for successful rental
function successHandler(rental_id, owner_hash_id){
    //show success message
    var domain_and_path = (new_rental_info.path) ? listing_info.domain_name + "/" + new_rental_info.path : listing_info.domain_name;
    var starttime_format = moment(new_rental_info.starttime).format("MMMM D, YYYY");
    var endtime_format = moment(new_rental_info.endtime).format("MMMM D, YYYY");
    showMessage("stripe-success-message", "Hurray! Your rental was successfully created for <strong>" + domain_and_path + "</strong>. It is scheduled to start on <strong>" + starttime_format + "</strong> and end on <strong>" + endtime_format + "</strong>.");

    //hide certain stuff
    $("#checkout-card-content").remove();
    $("#checkout-success-content").removeClass('is-hidden');
    $("#edit-dates-button").find("a").text('Rent again').addClass('is-primary');

    //remove click handler for going back to login/customize
    $(".step-header").off();

    //edit preview button
    $("#rental-preview-button").attr("href", "https://domahub.com/listing/" + listing_info.domain_name + "/" + rental_id);

    //copy ownership url
    if (!user){
        $("#rental-link-input").val("https://domahub.com/listing/" + listing_info.domain_name + "/" + rental_id + "/" + owner_hash_id).on("click", function(){
            $(this).select();
        });
        $("#rental-link-button").on("click", function(){
            $("#rental-link-input").select();
            document.execCommand("copy");
            $("#rental-link-input").blur();
            $(this).find("i").removeClass("fa-clipboard").addClass('fa-check-square-o');
        });
    }
}

//to format a number for $$$$
var moneyFormat = wNumb({
	thousand: ',',
	prefix: '$',
	decimals: 2
});

//helper function to get price of events
function calculatePrice(starttime, endtime, listing_info){
    if (starttime && endtime && listing_info){
        //get total number of price type units
        var totalPrice = moment.duration(endtime.diff(starttime));
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
