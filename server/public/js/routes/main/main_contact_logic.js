var can_submit = true;

$(document).ready(function() {

    $("#contact-form").submit(function(e){
        e.preventDefault();
        submitContact();
    });

});

//function to submit contact form
function submitContact(){
    if (can_submit) {
        can_submit = false;
        $("#contact-form").addClass('is-loading');
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
            $("#contact-form").removeClass('is-loading');

            if (data.state == "error"){
                console.log('s')
            }
            else {

            }
        });
    }
}
