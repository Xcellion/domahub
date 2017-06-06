//function that runs when back button is pressed
window.onpopstate = function(event) {
    showSectionByURL();
}

//function to show a specific section
function showSection(section_id){
    resetErrorSuccess();
    cancelEdits();
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
    window.scrollTo(0,0);

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
    $(".account-form .account-input").on("input", function(e){
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

    //<editor-fold>-------------------------------ACCOUNT INFO-------------------------------

    //submit any account changes
    $("#account-form").submit(function(e){
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
                    flashError($("#basic-message"), data.message);
                }
                resetInputs($("#account-form"));
            });
        }
    });

    //to cancel any changes
    $("#change-account-cancel").on("click", function(e){
        e.preventDefault();
        $("#change-account-submit").addClass("is-disabled");
        $("#change-account-cancel").addClass("is-hidden");
        $("#account-form").find("input").val("").removeClass("is-danger");
        $("#email-input").val(user.email);
        $("#username-input").val(user.username);
    });

    //to toggle account changes
    $("#change-account-submit").on("click", function(e){
        e.preventDefault();
        $("#account-form").submit();
    });

    //</editor-fold>

    //<editor-fold>-------------------------------PAYPAL INFO-------------------------------

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
                    flashSuccess($("#paypal-message"));
                    user = data.user;
                }
                else {
                    flashError($("#paypal-message"), data.message);
                }
                resetInputs($("#paypal-form"));
            })
        }
        else {
            flashError($("#paypal-message"), "Invalid email address!", $("#paypal_email-input"));
        }
    });

    //to cancel paypal changes
    $("#paypal-cancel").on("click", function(e){
        e.preventDefault();
        $("#paypal-submit").addClass("is-disabled");
        $("#paypal-cancel").addClass("is-hidden");
        $("#paypal_email-input").val(user.paypal_email).removeClass("is-danger");
    });

    //</editor-fold>

    //<editor-fold>-------------------------------EDIT INFO-------------------------------

    //to edit the current section
    $(".edit-section-button").on("click", function(e){
        var current_section = $(this).closest(".card");

        current_section.find(".input, .select").toggleClass('is-disabled');
        current_section.find(".hidden-edit").toggleClass('is-hidden');
        if (current_section.attr("id") == "payout-bank"){
            $("#account_number-last4").toggleClass("is-hidden")
        }
        prefillStripeInfo();
    });

    //</editor-fold>

});

//flash error
function flashError(elem, message, focus_elem){
    var error_msg = message || "Something went wrong!";
    elem.stop().fadeOut(100, function(){
        elem.removeClass('is-success').addClass('is-danger').text(error_msg).stop().fadeIn(100);
        if (focus_elem){
            focus_elem.focus().addClass('is-danger');
        }
    });
}

//flash success
function flashSuccess(elem){
    elem.stop().fadeOut(100, function(){
        elem.removeClass('is-danger').addClass("is-success").text("Account information updated!").stop().fadeIn(100);
    });
}

//function to cancel edit mode
function cancelEdits(){
    $(".card").find(".input, .select").addClass('is-disabled');
    $(".card").find(".hidden-edit").addClass('is-hidden');
}

//function to reset account inputs upon cancel
function resetInputs(form_elem){
    form_elem.find(".input.is-danger").removeClass("is-danger");
    form_elem.find(".button.is-primary").addClass("is-disabled");
    form_elem.find(".button.is-danger").addClass("is-hidden");
    form_elem.find(".hidden-edit").addClass("is-hidden");
    form_elem.find(".account-input").addClass("is-disabled");
    form_elem.find(".account-input").each(function(){
        $(this).val(user[$(this).attr("id").replace("-input", "")]);
    })
}

//function to check new account settings
function checkAccountSubmit(){
    //if no email is entered
    if (!validateEmail($("#email-input").val())) {
        flashError($("#basic-message"), "Please enter a valid email address!", $("#email-input"));
        return false;
    }

    //if username is not legit
    else if (!$("#username-input").val() || $("#username-input").val().length > 70 || $("#username-input").val().includes(" ")) {
        flashError($("#basic-message"), "Please enter a valid email username!", $("#username-input"));
        return false;
    }

    //if the old password is not entered
    else if ($("#old-pw-input").val().length > 70 || $("#old-pw-input").val().length < 6) {
        flashError($("#basic-message"), "Please enter your password to make any changes!", $("#old-pw-input"));
        return false;
    }

    //if new password is too short or long
    else if ($("#new-pw-input").val() && ($("#new-pw-input").val().length > 70 || $("#new-pw-input").val().length < 6)) {
        flashError($("#basic-message"), "Please enter a password at least 6 characters long!", $("#new-pw-input"));
        return false;
    }

    //if new passwords do not match
    else if ($("#new-pw-input").val() && $("#new-pw-input").val() != $("#verify-pw-input").val()){
        flashError($("#basic-message"), "New passwords do not match!", $("#verify-input"));
        return false;
    }
    else {
        return {
            new_email: $("#email-input").val(),
            username: $("#username-input").val(),
            password: $("#old-pw-input").val(),
            new_password: ($("#new-pw-input").val() == "") ? undefined : $("#new-pw-input").val()
        };
    }
}

//helper function to validate email address
function validateEmail(email) {
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}
