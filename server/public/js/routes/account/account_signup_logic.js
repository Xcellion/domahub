$(document).ready(function() {

  //prevent space in username
  $("input").keydown(function(e) {
    $("#message").text("Create a new account below.").removeAttr("style");

    if (e.keyCode == 32){
      e.preventDefault();
      return false;
    }
  });

  //verify email
  $("#email-input").keyup(function(e) {
    //if correct email, show check
    if (validateEmail($(this).val())) {
      showSuccessDanger($(this), true);
    }
    else if ($(this).val().length == 0){
      showSuccessDanger($(this));
    }
    else {
      showSuccessDanger($(this), false);
    }
  });

  //verify username
  $("#username-input").keyup(function(e) {
    name_length = $(this).val().length;
    name_val = $(this).val();
    if (name_val.includes(" ")){
      showSuccessDanger($(this), false);
    }
    else if (70 > name_length && name_length >= 3) {
      showSuccessDanger($(this), true);
    }
    else if (name_length == 0){
      showSuccessDanger($(this));
    }
    else {
      showSuccessDanger($(this), false);
    }
  });

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

  //on submit form (catch recaptcha client side and pw match)
  $('#target').on("submit", function(event){
    //passwords dont match
    if ($("#pw-input").val() != $("#verify-pw").val()){
      $("#message").fadeOut(100, function(){
        $("#message").css("color", "#ed1c24").html("Your passwords don't match!").fadeIn(100);
      });
      return false;
    }
    //if recaptcha is not done
    else if (!validateCaptcha()){
      $("#message").fadeOut(100, function(){
        $("#message").css("color", "#ed1c24").html("Please prove you're not a robot!").fadeIn(100);
      });
      return false;
    }
    //successful submission!
    else {
      $("#signup-login-button").addClass('is-loading');
    }
  });
});

//to validate recaptcha client side
function validateCaptcha(){
  var captcha_response = grecaptcha.getResponse();
  return captcha_response.length != 0;
}

//to validate an email using regex
function validateEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
}

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
