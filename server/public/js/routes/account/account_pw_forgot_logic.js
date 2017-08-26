$(document).ready(function() {
  $('#forgot-form').submit(function(event){
    event.preventDefault();
    $("#forgot-button").addClass('is-loading');
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
        $("#message").text("Success! Please check your email for further instructions.");
        $("#form_to_hide").hide();
        $("#accept").show();
      }
      else {
        $("#forgot-button").removeClass('is-loading');
        $("#message").text(data.message);
      }
    });
  });
});
