var can_submit = true;

$(document).ready(function() {

    //scroll to specific part of page depending on which side link you pressed
    $(".setting-link").click(function(e){
        temp_id = $(this).attr("id");
        console.log($("#" + temp_id.substr(0, temp_id.length - 5)));
        $("html, body").stop().animate({
            scrollTop: $("#" + temp_id.substr(0, temp_id.length - 5)).offset().top - 70
        }, "fast");
    });

    //submit any account changes
    $("#account-settings").submit(function(e){
        e.preventDefault();
        submit_data = checkAccountSubmit();

        if (can_submit && submit_data){
            console.log(submit_data);
        }
        else {

        }
    });

    //to toggle account changes
    $("#change-account-toggle").click(function(e){
        var temp_text = ($(this).text() == "Save Changes") ? "Edit Information" : "Save Changes";
        var pw_text = ($("#pw-label").text() == "Password") ? "New Password" : "Password";

        if (temp_text == "Edit Information"){
            $("#account-settings").submit();
        }
        else {
            //something went wrong
        }
        $("#pw-label").text(pw_text);
        $(this).text(temp_text);
        $(this).toggleClass("is-success is-info");
        $('.account-input').toggleClass("is-disabled");
        $('.input-to-hide').toggleClass("is-hidden");
    })

});

//function to check new account settings
function checkAccountSubmit(){
    //if no email is entered
    if (!validateEmail($("#email-input").val())) {
        $("#basic-message").fadeOut(100, function(){
            $("#basic-message").css("color", "#ed1c24").text("Please enter your email address!").fadeIn(100);
            $("#email-input").addClass("is-danger").fadeIn(100).focus();
        });
        return false;
    }

    //if username is not legit
    else if (!$("#username-input").val() || $("#username-input").val().length > 70 || $("#username-input").val().includes(" ")) {
        return false;
    }

    //if no password is entered
    else if (!$("#old-pw-input").val() || !$("#new-pw-input").val()) {
        return false;
    }

    //if password is too short or long
    else if ($("#new-pw-input").val().length > 70 || $("#new-pw-input").val().length < 6) {
        return false;
    }

    //if passwords do not match
    else if ($("#new-pw-input").val() != $("#verify-pw").val()){
        return false;
    }
    else {
        return {
            email: $("#email-input").val(),
            username: $("#username-input").val(),
            old_password: $("#old-pw-input").val(),
            new_password: $("#new-pw-input").val()
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
