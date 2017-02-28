//function that runs when back button is pressed
window.onpopstate = function(event) {
    showSectionByURL();
}

//function to show a specific section
function showSection(section_id){
    //resetErrorSuccess();
    $(".setting-link").removeClass("is-active");
    $("#" + section_id + "-link").addClass("is-active");
    temp_section = $("#" + section_id);
    $(".card").not(temp_section).addClass("is-hidden");
    temp_section.removeClass("is-hidden");
}

function showSectionByURL(){
    temp_hash = location.hash.split("#")[1];
    array_of_ids = [];
    $(".card").each(function(index) {
        array_of_ids.push($(this).attr("id"));
    });

    if (array_of_ids.indexOf(temp_hash) == -1){
        showSection("basic");
    }
    else {
        showSection(temp_hash);
    }
}

$(document).ready(function() {
    if (window.location.hostname == "localhost"){
        Stripe.setPublishableKey('pk_test_kcmOEkkC3QtULG5JiRMWVODJ');
    }
    else {
        Stripe.setPublishableKey('pk_live_506Yzo8MYppeCnLZkW9GEm13 ');
    }

    //function to show section depending on url
    showSectionByURL();

    //add to history object depending on which link i clicked
    $(".setting-link").click(function(e){
        e.preventDefault();

        var temp_id = $(this).attr("id");
        temp_id = temp_id.substr(0, temp_id.length - 5);
        if(history.pushState) {
            history.pushState(null, null, '#' + temp_id);
        }
        else {
            location.hash = '#' + temp_id;
        }
        showSection(temp_id);
    });

    //to highlight submit when data changes for account form
    $(".account-form .account-input").bind("input", function(e){
        var account_form = $(this).closest(".account-form");
        var success_button = account_form.find(".button.is-primary");
        var cancel_button = account_form.find(".button.is-danger");

        if ($(this).val() != user[$(this).attr("id").replace("-input", "")]){
            success_button.removeClass("is-disabled");
            cancel_button.removeClass("is-hidden");
        }
        else {
            success_button.addClass("is-disabled");
            cancel_button.addClass("is-hidden");
        }
    });

    //to highlight submit when data changes for stripe form
    $(".stripe-form .stripe-input").bind("input", function(e){
        var stripe_form = $(this).closest(".stripe-form");
        var success_button = stripe_form.find(".button.is-primary");
        var cancel_button = stripe_form.find(".button.is-danger");

        if ($(this).val() != user.stripe_info[$(this).attr("id").replace("-input", "")]){
            success_button.removeClass("is-disabled");
            cancel_button.removeClass("is-hidden");
        }
        else {
            success_button.addClass("is-disabled");
            cancel_button.addClass("is-hidden");
        }
    });

    //------------------------------------------------------------------------------------ ACCOUNT INFO

    //submit any account changes
    $("#account-settings").submit(function(e){
        e.preventDefault();
        submit_data = checkAccountSubmit();

        if (submit_data){
            $.ajax({
                url: "/profile/settings",
                method: "POST",
                data: submit_data
            }).done(function(data){
                if (data.state == "success"){
                    flashSuccess($("#basic-message"));
                    user = data.user;
                }
                else {
                    resetInputs();
                    flashError($("#basic-message"), data.message);
                }
            })
        }
    });

    //to cancel any changes
    $("#change-account-cancel").click(function(e){
        e.preventDefault();
        $("#change-account-submit").addClass("is-disabled");
        $("#change-account-cancel").addClass("is-hidden");
        $("#account-settings").find("input").val("").removeClass("is-danger");
        $("#email-input").val(user.email);
        $("#username-input").val(user.username);
        //$("#gender-input").val(user.gender).removeClass("is-danger");
        //$("#birthday-year-input").val(user.birthday.year).removeClass("is-danger");
        //$("#birthday-month-input-input").val(user.birthday.month).removeClass("is-danger");
        //$("#birthday-day-input").val(user.birthday.day).removeClass("is-danger");
        //$("#phone-input").val(user.phone).removeClass("is-danger");
    });

    //to toggle account changes
    $("#change-account-submit").click(function(e){
        $("#account-settings").submit();
    });

    //revoke stripe access
    $("#revoke-stripe-button").on("click", deauthorizeStripe);
    $("#provide-stripe-button").on("click", function(){
        $(this).addClass('is-loading');
    });

    //------------------------------------------------------------------------------------ PAY OUT ADDRESS

    $(".payout-next").on("click", function(e){
        e.preventDefault();
        $(this).closest(".payout-form").addClass('is-hidden').next(".payout-form").removeClass('is-hidden');
    });

    //to cancel any changes
    $("#payout-address-cancel").click(function(e){
        e.preventDefault();
        cancelForm($("#payout-address-form"));
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
    $(".stripe-form").on("submit", function(e){
        e.preventDefault();
        var which_form = $(this).attr('id').split("-")[1];
        if (which_form == "address"){
            $("#payout-address-next").removeClass('is-hidden');
        }

        //make sure all required fields are good
        if (checkRequiredFields($(this), which_form)){
            $.ajax({
                url: "/profile/settings/payout/" + which_form,
                data: $("#payout-" + which_form + "-form").serialize(),
                method: "POST"
            }).done(function(data){
                if (data.state == "success"){
                    $(".hide-stripe").removeClass('is-hidden');
                    flashSuccess($("#payout-" + which_form + "-message"));
                    user = data.user;
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
        prefillStripeInfo();
    }

    //to cancel any changes
    $("#payout-personal-cancel").click(function(e){
        e.preventDefault();
        cancelForm($("#payout-personal-form"));
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
        cancelForm($("#payout-bank-form"));
    });

    //submit bank information
    $("#payout-bank-submit").on("click", function(e){

        //check if all required fields are filled
        if (checkRequiredFields($(this), "bank")){
            e.preventDefault();

            //create stripe token
            Stripe.bankAccount.createToken({
                country: $('#country-input').val(),
                routing_number: $('#account-routing-input').val(),
                account_number: $('#account-number-input').val()
            }, function(status, response){
                console.log(status, response);
                if (status != 200){
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

//check if any required field is blank
function checkRequiredFields(form_elem, which_form){
    //clear pre-existing missing
    $(".is-danger").removeClass('is-danger');

    var required_missing = form_elem.find(".stripe-input").filter('[required]');
    var required_missing_vals = required_missing.map(function(value){ return $(this).val() }).toArray();
    var required_missing_idx = required_missing_vals.indexOf("");
    if (required_missing_idx > 0){
        $(required_missing[required_missing_idx]).addClass('is-danger');
        flashError($("#payout-" + which_form + "-message"), "Missing " + which_form + " information!");
        return false;
    }
    else if (which_form == "bank" && $("input[type=checkbox]:checked").length == 0){
        flashError($("#payout-" + which_form + "-message"), "Please accept the terms of service!");
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
            account_type: $("#account-type-input").val()
        },
        method: "POST"
    }).done(function(data){
        if (data.state == "success"){
            $(".hide-stripe").removeClass('is-hidden');
            $("#payout-bank-message").fadeOut(100, function(){
                $("#payout-bank-message").css("color", "#97cd76").text("Account information updated!").fadeIn(100);
            });
            user = data.user;
        }
        else {
            console.log(data);
            $("#payout-bank-message").fadeOut(100, function(){
                $("#payout-bank-message").css("color", "#ed1c24").text(data.message).fadeIn(100);
            });
        }
    });
}

//flash error
function flashError(elem, message){
    elem.fadeOut(100, function(){
        elem.addClass('is-danger').text(message).fadeIn(100);
    });
}

//flash success
function flashSuccess(elem){
    elem.fadeOut(100, function(){
        elem.addClass("is-success").text("Account information updated!").fadeIn(100);
    });
}

//reset error success flashes
function resetErrorSuccess(){
    cancelForm($("#payout-address-form"));
    cancelForm($("#payout-personal-form"));
    cancelForm($("#payout-bank-form"));
    $("#payout-personal-cancel").click();
    $("#payout-bank-cancel").click();
    $(".is-danger").removeClass('is-danger');
    $(".is-success").removeClass('is-success');
}

//cancel form submit
function cancelForm(form){
    //form.find("input").val("").removeClass('is-danger');
    form.find(".cancel-payout ").addClass("is-hidden");
    form.find(".submit-payout ").addClass("is-disabled");
}

//function to deauthorize stripe
function deauthorizeStripe(e){
    e.preventDefault();
    var that = $(this);

    that.addClass('is-loading');
    that.off("click");  //remove click handler

    $.ajax({
        type: "POST",
        url: "/deauthorizestripe"
    }).done(function(data){
        if (data.state == "success"){
            that.text("Revoked!");
        }
        else {
            that.on("click", deauthorizeStripe);
        }
    }).always(function(){
        that.removeClass('is-loading');
    });
}

//function to check new account settings
function checkAccountSubmit(){
    //if no email is entered
    if (!validateEmail($("#email-input").val())) {
        $("#basic-message").fadeOut(100, function(){
            $("#basic-message").css("color", "#ed1c24").text("Please enter your email address!").fadeIn(100);
            $("#email-input").addClass("is-danger").focus();
        });
        return false;
    }

    //if username is not legit
    else if (!$("#username-input").val() || $("#username-input").val().length > 70 || $("#username-input").val().includes(" ")) {
        $("#basic-message").fadeOut(100, function(){
            $("#basic-message").css("color", "#ed1c24").text("Please enter a valid username!").fadeIn(100);
            $("#username-input").addClass("is-danger").focus();
        });
        return false;
    }

    // //if the old password is not entered
    else if ($("#old-pw-input").val().length > 70 || $("#old-pw-input").val().length < 6) {
        $("#basic-message").fadeOut(100, function(){
            $("#basic-message").css("color", "#ed1c24").text("Please enter your password to make any changes!").fadeIn(100);
            $("#old-pw-input").addClass("is-danger").focus();
        });
        return false;
    }

    //if new password is too short or long
    else if ($("#new-pw-input").val() && ($("#new-pw-input").val().length > 70 || $("#new-pw-input").val().length < 6)) {
        $("#basic-message").fadeOut(100, function(){
            $("#basic-message").css("color", "#ed1c24").text("Please enter a password at least 6 characters long!").fadeIn(100);
            $("#new-pw-input").addClass("is-danger").focus();
        });
        return false;
    }

    //if new passwords do not match
    else if ($("#new-pw-input").val() && $("#new-pw-input").val() != $("#verify-pw-input").val()){
        $("#basic-message").fadeOut(100, function(){
            $("#basic-message").css("color", "#ed1c24").text("New passwords do not match!").fadeIn(100);
            $("#new-pw-input").addClass("is-danger").focus();
            $("#verify-pw-input").addClass("is-danger");
        });
        return false;
    }
    else {
        return {
            new_email: (user.email == $("#new_email-input").val()) ? undefined : $("#email-input").val(),
            username: (user.username == $("#username-input").val()) ? undefined : $("#username-input").val(),
            password: $("#old-pw-input").val(),
            new_password: ($("#new-pw-input").val() == "") ? undefined : $("#new-pw-input").val()
            //gender: $("#gender-input").val(),
            //birthday: $("#birthday-year-input").val() + $("#birthday-month-input").val() + $("#birthday-day-input").val(),
            //phone: $("#phone-input").val()
        };
    }
}

//helper function to validate email address
function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}
