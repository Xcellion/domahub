$(document).ready(function() {
  //click to verify
  $('#login-form').submit(function(event){
    event.preventDefault();
    $("#verify-button").addClass('is-loading');

    $.ajax({
      type: "POST",
      url: window.location.pathname
    }).done(function(data){
      $("#verify-button").removeClass('is-loading');

      if (data.state == "success"){
        $("#message").text("Success! Your account has been verified!");
        $("#form_to_hide").hide();
        $("#accept").show();
      }
      //token was wrong
      else {
        $("#message").text("Something went wrong in verifying your account!");
        $("#form_to_hide").hide();
        $("#contact-us-wrapper").removeClass('is-hidden');
      }
    });

  });
});
