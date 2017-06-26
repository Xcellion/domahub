$(document).ready(function() {
  var can_submit = true;

  //click to verify
  $('#login-form').submit(function(event){
    event.preventDefault();

    if (can_submit){
      can_submit = false;
      $.ajax({
        type: "POST",
        url: "/verify"
      }).done(function(data){
        if (data.state == "success"){
          $("#message").text("Please check your email for further instructions!");
          $("#form_to_hide").hide();
          $("#accept").show();
        }
        //token was wrong
        else if (data.message == "Please log in!"){
          window.location = window.location.origin + "/login";
        }
        else {
          console.log(data);
          can_submit = true;
          $("#message").text(data.message);
        }
      });
    }

  });
});
