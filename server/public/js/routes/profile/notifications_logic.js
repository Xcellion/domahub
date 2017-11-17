//helper function to display/hide error messages per listing
function errorMessage(message){
  //hide success
  $("#error-notification").addClass('is-hidden').removeClass("is-active");

  if (message){
    $("#error-notification").removeClass('is-hidden').addClass("is-active");
    $("#error-message").html(message);
  }
  else if (!message) {
    $("#error-notification").addClass('is-hidden').removeClass("is-active");
  }
}

//helper function to display success messages per listing
function successMessage(message){
  //hide any error
  $("#error-notification").addClass('is-hidden').removeClass("is-active");

  if (message){
    $("#success-notification").removeClass('is-hidden').addClass("is-active");
    $("#success-message").html(message);
  }
  else if (!message){
    $("#success-notification").addClass('is-hidden').removeClass("is-active");
  }
}

//refresh notifications
function clearNotification(){
  errorMessage(false);
  successMessage(false);
}

function loadNotification() {
  if (message.substring(0,5) == "Promo") {
    successMessage(message);
  }
  else if (typeof message != "undefined") {
    errorMessage(message);
  }
  else {
    clearNotification();
  }
}
