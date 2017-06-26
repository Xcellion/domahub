$(document).ready(function() {
  var can_submit = true;

  //click to verify
  $('#login-form').submit(function(event){
    event.preventDefault();

    if (can_submit){
      can_submit = false;
      $.ajax({
        type: "POST",
        url: window.location.pathname
      }).done(function(data){
        if (data.state == "success"){
          $("#message").text("Success! Your account has been verified!");
          $("#form_to_hide").hide();
          $("#accept").show();
        }
        //token was wrong
        else {
          $("#message").text("Failed to verify!");
          $("#error-assistance").removeClass('is-hidden');
          $("#form_to_hide").hide();
          $("#contact-us-wrapper").removeClass('is-hidden');
          $("#contact-us-button").on("click", function(){
            Intercom("show");
          });
        }
      });
    }

  });
});
