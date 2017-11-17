$(document).ready(function() {

  //click to verify
  $('#login-form').submit(function(event){
    event.preventDefault();
    $("#sendverify-button").addClass('is-loading');

    $.ajax({
      type: "POST",
      url: "/verify"
    }).done(function(data){
      $("#message").text("Please check your email to finish verifying this account!");
      $("#form_to_hide").hide();
      $("#accept").show();
    });

  });
});
