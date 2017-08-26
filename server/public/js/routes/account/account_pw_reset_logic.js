$(document).ready(function() {

  //verify password input
  $("#pw-input").keyup(function() {
    pw_length = $(this).val().length;

    if (70 > pw_length && pw_length >= 6) {
      showSuccessDanger($(this), true);

      //if matching verified pw input field as well
      if ($("#verify-pw").val()){
        if ($("#verify-pw").val() == $(this).val()) {
          showSuccessDanger($("#verify-pw"), true);
        }
        else {
          showSuccessDanger($("#verify-pw"), false);
        }
      }
    }
    else if (pw_length == 0){
      showSuccessDanger($(this));
    }
    else {
      showSuccessDanger($(this), false);
    }
  });

  //verify passwords are matching
  $("#verify-pw").keyup(function() {
    if ($("#pw-input").val().length > 0 && $("#pw-input").val() == $(this).val()) {
      showSuccessDanger($(this), true);
    }
    else if ($(this).val().length == 0){
      showSuccessDanger($(this));
    }
    else {
      showSuccessDanger($(this), false);
    }
  });

  $('#login-form').submit(function(event){
    event.preventDefault();

    $("#reset-button").addClass('is-loading');

    $.ajax({
      type: "POST",
      url: window.location.pathname,
      data: {
        password: $("#pw-input").val()
      }
    }).done(function(data){
      //reset the data
      $("#pw-input").val("");
      $("#verify-pw").val("");
      $("#reset-button").removeClass('is-loading');

      if (data.state == "success"){
        $("#message").text("Success! You may log in with your new password!");
        $("#form_to_hide").hide();
        $("#accept").show();
      }
      else if (data.message == "Invalid token! Please click here to reset your password again!"){
        $("#message").html("Invalid token! Please click <a class='is-primary' href='/forgot'>here</a> to reset your password again!");
      }
      else {
        $("#message").html(data.message);
      }
    });
  });
});

//helper function to hide or show checkmark / x-mark
function showSuccessDanger(elem, bool){
  //if bool = true, show check mark
  if (bool == true){
    elem.siblings(".is-success").removeClass("is-hidden");
    elem.siblings(".is-danger").addClass("is-hidden");
  }
  else if (typeof bool == "undefined"){
    elem.siblings(".is-success").addClass("is-hidden");
    elem.siblings(".is-danger").addClass("is-hidden");
  }
  else {
    elem.siblings(".is-success").addClass("is-hidden");
    elem.siblings(".is-danger").removeClass("is-hidden");
  }
}
