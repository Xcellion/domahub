$(document).ready(function() {

  $("#contact-form").on("submit", function(e){
    e.preventDefault();
    submitContact();
  });

  //hide any existing error messages
  $("input, textarea").on("keyup", function(e){
    $("#error_message").addClass("is-hidden");
  });

  //random contact characters
  var random_char = random_characters[Math.floor(Math.random()*random_characters.length)];
  $("#contact_name").attr("placeholder", random_char.name);
  $("#contact_email").attr("placeholder", random_char.email);
  $("#contact_message").attr("placeholder", random_char.message);
});

//function to submit contact form
function submitContact(){
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
    $("#submit-button").removeClass('is-loading');
    $(".notification").addClass('is-hidden');
    if (data.state == "error"){
      $("#message-error-text").text(data.message);
      $("#message-error").removeClass("is-hidden").addClass("is-active");
    }
    else {
      $("#contact-form").off();
      $("input, textarea").not("#submit-button").val("").addClass('is-disabled');
      $("#submit-button").addClass('is-disabled');
      $("#message-success").removeClass("is-hidden").addClass("is-active");
    }
  });
}
