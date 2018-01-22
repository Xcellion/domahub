//<editor-fold>----------------------------------NOTIFICATION FUNCTIONS--------------------------------

var times_errored = 0;

//display/hide error messages
function errorMessage(message){
  //hide success
  $("#error-notification, #success-notification, #info-notification").addClass('is-hidden').removeClass("is-active");

  //domahub demo
  if (message == "demo-error"){
    infoMessage("Oops! You cannot do that in the DomaHub demo! Click here to <a class='is-underlined' href='/signup'>sign up</a> for a new account.");
  }
  else if (message){

    //display contact us message if keeps erroring
    if (times_errored >= 2){
      if (message.indexOf("</a>") == -1){
        message = message + "</br></br>If you are having any issues, please <a class='contact-link is-underlined' href='/contact'>contact us</a> for assistance."
      }
    }
    else {
      times_errored++;
    }

    $("#error-notification").removeClass('is-hidden').addClass("is-active");
    $("#error-message").html(message);
    contactLinkHandler();
  }
  else if (!message) {
    $("#error-notification").addClass('is-hidden').removeClass("is-active");
  }
}

//display success messages
function successMessage(message){
  //hide any error
  $("#error-notification, #success-notification, #info-notification").addClass('is-hidden').removeClass("is-active");

  if (message){
    $("#success-notification").removeClass('is-hidden').addClass("is-active");
    $("#success-message").html(message);
  }
  else if (!message){
    $("#success-notification").addClass('is-hidden').removeClass("is-active");
  }
}

//display informational messages
function infoMessage(message){
  //hide any error
  $("#error-notification, #success-notification, #info-notification").addClass('is-hidden').removeClass("is-active");

  if (message){
    $("#info-notification").removeClass('is-hidden').addClass("is-active");
    $("#info-message").html(message);
  }
  else if (!message){
    $("#info-notification").addClass('is-hidden').removeClass("is-active");
  }
}

//refresh notifications
function clearNotification(){
  errorMessage(false);
  successMessage(false);
}

//check if we should display a success or error msg (for login)
function loadNotification() {
  if (message.toLowerCase().indexOf("success") != -1) {
    successMessage(message);
  }
  else if (typeof message != "undefined") {
    errorMessage(message);
  }
  else {
    clearNotification();
  }
}

//</editor-fold>

//<editor-fold>----------------------------------CONTACT US--------------------------------

//any link that says to contact us
function contactLinkHandler(){
  $(".contact-link").off().on("click", function(e){
    if ($("#contact-button").is(":visible")){
      e.preventDefault();
      $("#contact-dropdown-menu").toggleClass('is-hidden');
      $("#contact_message").focus();
    }
  });
}

//</editor-fold>
