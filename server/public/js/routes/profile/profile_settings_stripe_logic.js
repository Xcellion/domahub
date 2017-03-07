$(document).ready(function() {
    if (window.location.hostname == "localhost"){
        Stripe.setPublishableKey('pk_test_kcmOEkkC3QtULG5JiRMWVODJ');
    }
    else {
        Stripe.setPublishableKey('pk_live_506Yzo8MYppeCnLZkW9GEm13');
    }

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

    //------------------------------------------------------------------------------------ PAY OUT ADDRESS

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

                    flashSuccess($("#payout-" + which_form + "-message"));
                    user = data.user;
                    cancelFormSubmit($("#payout-" + which_form + "-form"));
                }
                else {
                    flashError($("#payout-" + which_form + "-message"), data.message);
                }
            });
        }

    });

    //------------------------------------------------------------------------------------ PAY OUT PERSONAL INFO

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

    //------------------------------------------------------------------------------------ PAY OUT bank INFO

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

            //create stripe token
            Stripe.bankAccount.createToken({
                country: $('#country-input').val(),
                routing_number: $('#account_routing-input').val(),
                account_number: $('#account_number-input').val()
            }, function(status, response){
                if (status != 200){
                    console.log(status, response);
                    flashError($("#payout-bank-message"), response.error.message);
                }
                else {
                    //submit to server
                    submitBank(response.id);
                }
            });
        }
    });

});

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
        flashError($("#payout-" + which_form + "-message"), "Missing " + which_form + " information!");
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
            flashSuccess($("#payout-bank-message"));
            user = data.user;
            cancelFormSubmit($("#payout-bank-form"));
        }
        else {
            flashError($("#payout-bank-message"), data.message);
        }
    });
}

//flash error
function flashError(elem, message){
    elem.fadeOut(100, function(){
        elem.removeClass('is-success').addClass('is-danger').text(message).fadeIn(100);
    });
}

//flash success
function flashSuccess(elem){
    elem.fadeOut(100, function(){
        elem.removeClass('is-danger').addClass("is-success").text("Account information updated!").fadeIn(100);
    });
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

//cancel form edit
function cancelFormEdit(form){
    form.find(".stripe-input").addClass('is-disabled');
    form.find(".cancel-payout ").addClass("is-hidden");
    form.find(".submit-payout ").addClass("is-disabled");
}

// //function to deauthorize stripe
// function deauthorizeStripe(e){
//     e.preventDefault();
//     var that = $(this);
//
//     that.addClass('is-loading');
//     that.off("click");  //remove click handler
//
//     $.ajax({
//         type: "POST",
//         url: "/deauthorizestripe"
//     }).done(function(data){
//         if (data.state == "success"){
//             that.text("Revoked!");
//         }
//         else {
//             that.on("click", deauthorizeStripe);
//         }
//     }).always(function(){
//         that.removeClass('is-loading');
//     });
// }
