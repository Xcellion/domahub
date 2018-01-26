$(document).ready(function() {

  $("#contact-form").on("submit", function(e){
    e.preventDefault();
    submitContact();
  });

  //hide any existing error messages
  $("input, textarea").on("keyup", function(e){
    clearNotification();
  });

  //random contact characters
  var random_char = random_characters[Math.floor(Math.random()*random_characters.length)];
  $("#contact_name").attr("placeholder", random_char.name);
  $("#contact_email").attr("placeholder", random_char.email);
  $("#contact_message").attr("placeholder", random_char.message);
});

//submit contact form
function submitContact(){
  console.log("WTF");
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
    if (data.state == "error"){
      errorMessage(data.message);
    }
    else {
      $("#contact-form").off();
      $("input, textarea").not("#submit-button").val("").addClass('is-disabled');
      $("#submit-button").addClass('is-disabled');
      successMessage("Message sent! We will get back to you as soon as possible. Thank you for your patience.");
    }
  });
}
