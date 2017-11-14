$(document).ready(function() {

  //display any message from the server
  loadNotification();

  //reset message, prevent space
  $("input").keydown(function(e) {
    if (e.keyCode == 32){
      e.preventDefault();
      return false;
    }
  });

  //verify email
  $("#email-input").keyup(function(e) {
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
    var name_length = $(this).val().length;
    var name_val = $(this).val();
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
    var pw_length = $(this).val().length;

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
      errorMessage("Your passwords do not match!");
      return false;
    }
    //if recaptcha is not done
    else if (!validateCaptcha()){
      errorMessage("Please prove that you are not a robot!");
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
