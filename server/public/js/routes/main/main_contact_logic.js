var can_submit = true;

$(document).ready(function() {

    $("#contact-form").submit(function(e){
        e.preventDefault();
        submitContact();
    });

    //hide any existing error messages
    $("input, textarea").on("keyup", function(e){
        $("#error_message").addClass("is-hidden");
    });

});

//function to submit contact form
function submitContact(){
    if (can_submit) {
        can_submit = false;
        $("#submit-button").addClass('is-loading');
        $.ajax({
            url: "/contact",
            data: {
                contact_email: $("#contact_email").val(),
                contact_name: $("#contact_name").val(),
                contact_message: $("#contact_message").val()
            },
            method: "POST"
        }).done(function(data){
            can_submit = true;
            $("#submit-button").removeClass('is-loading');
            if (data.state == "error"){
                $("#error_message").text(data.message).removeClass("is-hidden");
            }
            else {
                //to do, empty the values and say thank you
            }
        });
    }
}
