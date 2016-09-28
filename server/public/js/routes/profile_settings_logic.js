var can_submit = true;
//function that runs when back button is pressed
window.onpopstate = function(event) {
    showSectionByURL();
}

$(document).ready(function() {


    //function to show section depending on url
    showSectionByURL();

    $("#account-settings .account-input").bind("input", function(e){
        if ($("#change-account-save").hasClass("is-disabled")){
            $("#change-account-save").removeClass("is-disabled");
            $("#change-account-cancel").removeClass("is-hidden");
        }
    })

    //scroll to specific part of page depending on which side link you pressed
    $(".setting-link").click(function(e){
        e.preventDefault();
        window.scrollTo(0,0);

        temp_id = $(this).attr("id");
        temp_id = temp_id.substr(0, temp_id.length - 5);
        if(history.pushState) {
            history.pushState(null, null, '#' + temp_id);
        }
        else {
            location.hash = '#' + temp_id;
        }
        showSection(temp_id);
    });

    //submit any account changes
    $("#account-settings").submit(function(e){
        e.preventDefault();
        submit_data = checkSubmit();

        if (submit_data){
            $.ajax({
                url: "/profile/settings",
                method: "POST",
                data: submit_data
            }).done(function(data){
                if (data.state == "success"){
                    $("#basic-message").fadeOut(100, function(){
                        $("#basic-message").css("color", "#97cd76").text("Account information updated!").fadeIn(100);
                    });
                    user.email = $("#email-input").val();
                    user.username = $("#username-input").val();
                    cancelEdit();
                }
                else {
                    console.log(data);
                    $("#basic-message").fadeOut(100, function(){
                        $("#basic-message").css("color", "#ed1c24").text(data.message).fadeIn(100);
                    });
                }
            })
        }
    });

    //to toggle account changes
    $("#change-account-save").click(function(e){
        $("#account-settings").submit();
    });

    //to cancel account changes
    $("#change-account-cancel").click(function(e){
        resetInputs();
    });

});

//function to show a specific section
function showSection(section_id){
    $(".setting-link").removeClass("is-active");
    $("#" + section_id + "-link").addClass("is-active");
    temp_section = $("#" + section_id);
    $(".card, .is-fullwidth").not(temp_section).addClass("is-hidden");
    temp_section.removeClass("is-hidden");
}

function showSectionByURL(){
    temp_hash = location.hash.split("#")[1];
    array_of_ids = [];
    $(".card, .is-fullwidth").each(function(index) {
        array_of_ids.push($(this).attr("id"));
    });

    if (array_of_ids.indexOf(temp_hash) != -1){
        showSection(temp_hash);
    }
    else if (!temp_hash){
        showSection("basic");
    }
}

//function to check if we can submit and submit
function checkSubmit(){
    submit_data = checkAccountSubmit();

    if (can_submit && submit_data){
        return submit_data;
    }
    else {
        return false;
    }
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

    //if no password is entered
    else if ($("#old-pw-input").val().length > 70 || $("#old-pw-input").val().length < 6) {
        $("#basic-message").fadeOut(100, function(){
            $("#basic-message").css("color", "#ed1c24").text("Please enter your password!").fadeIn(100);
            $("#old-pw-input").addClass("is-danger").focus();
        });
        return false;
    }

    //if password is too short or long
    else if ($("#new-pw-input").val().length > 70 || $("#new-pw-input").val().length < 6) {
        $("#basic-message").fadeOut(100, function(){
            $("#basic-message").css("color", "#ed1c24").text("Please enter a valid new password!").fadeIn(100);
            $("#new-pw-input").addClass("is-danger").focus();
        });
        return false;
    }

    //if passwords do not match
    else if ($("#new-pw-input").val() != $("#verify-pw-input").val()){
        $("#basic-message").fadeOut(100, function(){
            $("#basic-message").css("color", "#ed1c24").text("New passwords do not match!").fadeIn(100);
            $("#new-pw-input").addClass("is-danger").focus();
            $("#verify-pw-input").addClass("is-danger");
        });
        return false;
    }
    else {
        return {
            email: $("#old-email-input").val(),
            new_email: $("#email-input").val(),
            username: $("#username-input").val(),
            password: $("#old-pw-input").val(),
            new_password: $("#new-pw-input").val()
            //gender: $("#gender-input").val(),
            //birthday: $("#birthday-year-input").val() + $("#birthday-month-input").val() + $("#birthday-day-input").val(),
            //phone: $("#phone-input").val()
        };
    }
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
    //$("#gender-input").val(user.gender).removeClass("is-danger");
    //$("#birthday-year-input").val(user.birthday.year).removeClass("is-danger");
    //$("#birthday-month-input-input").val(user.birthday.month).removeClass("is-danger");
    //$("#birthday-day-input").val(user.birthday.day).removeClass("is-danger");
    //$("#phone-input").val(user.phone).removeClass("is-danger");
}

//helper function to validate email address
function validateEmail(email) {
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}
