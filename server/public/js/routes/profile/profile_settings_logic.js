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
                resetInputs();
                if (data.state == "success"){
                    flashSuccess($("#basic-message"));
                    user = data.user;
                }
                else {
                    flashError($("#basic-message"), data.message);
                }
            })
        }
    });

    //to cancel any changes
    $("#change-account-cancel").on("click", function(e){
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
    $("#change-account-submit").on("click", function(e){
        e.preventDefault();
        $("#account-settings").submit();
    });

    //------------------------------------------------------------------------------------ EDIT INFO

    //to edit the current section
    $(".edit-section-button").on("click", function(e){
        var current_section = $(this).closest(".card");

        current_section.find(".input, .select").toggleClass('is-disabled');
        current_section.find(".hidden-edit").toggleClass('is-hidden');
    });

});

//function to cancel edit mode
function cancelEdits(){
    $(".card").find(".input, .select").addClass('is-disabled');
    $(".card").find(".hidden-edit").addClass('is-hidden');
}

//function to reset account inputs upon cancel
function resetInputs(){
    $("#change-account-save").addClass("is-disabled");
    $("#change-account-cancel").addClass("is-hidden");
    $("#email-input").val(user.email).removeClass("is-danger");
    $("#username-input").val(user.username).removeClass("is-danger");
    $("#old-pw-input").val("").removeClass("is-danger");
    $("#new-pw-input").val("").removeClass("is-danger");
    $("#verify-pw-input").val("").removeClass("is-danger");
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
