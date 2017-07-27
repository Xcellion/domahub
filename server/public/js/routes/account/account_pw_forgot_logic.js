$(document).ready(function() {

  $('#target').submit(function(event){
    event.preventDefault();

    //if no email is entered
    if (!$("#email").val()) {
      $("#message").fadeOut(100, function(){
        $("#message").css("color", "#ed1c24").html("Please enter your email address!").fadeIn(100);
      });
      return false;
    }
    else {
      $.ajax({
        type: "POST",
        url: "/forgot",
        data: {
          email: $("#email").val()
        }
      }).done(function(data){
        //reset the data
        $("#email").val("");

        if (data.state == "success"){
          $("#message").text("Success! Please check your email for further instructions");
          $("#form_to_hide").hide();
          $("#accept").show();
        }
        else {
          $("#login-button").removeClass('is-loading');
          $("#message").text(data.message);
        }
      });
    }
  });
});
