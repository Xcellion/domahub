//<editor-fold>----------------------------------NOTIFICATION FUNCTIONS--------------------------------

var times_errored = 0;

//display/hide error messages
function errorMessage(message){
  //remove any colors and hide existing notification
  $("#popup-notification").removeClass("is-primary is-info growl-out");

  //domahub demo
  if (message == "demo-error"){
    infoMessage("Oops! You cannot do that in the DomaHub demo! But in the real thing you would've been able to :)");
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

    $("#popup-notification").removeClass("is-hidden").addClass('is-danger growl-in');
    $("#popup-notification-message").html(message);
    contactLinkHandler();
  }
  else if (!message) {
    $("#popup-notification").removeClass('growl-in');
  }
}

//display success messages
function successMessage(message){
  //remove any colors and hide existing notification
  $("#popup-notification").removeClass("is-danger is-info growl-out");

  if (message){
    $("#popup-notification").removeClass("is-hidden").addClass("is-primary growl-in");
    $("#popup-notification-message").html(message);

    //refresh notifications
    if (typeof showNotifications != "undefined"){
      showNotifications();
    }
  }
  else if (!message){
    $("#popup-notification").removeClass("growl-in");
  }
}

//display informational messages
function infoMessage(message){
  //remove any colors and hide existing notification
  $("#popup-notification").removeClass("is-danger is-primary growl-out");

  if (message){
    $("#popup-notification").removeClass("is-hidden").addClass("is-info growl-in");
    $("#popup-notification-message").html(message);
  }
  else if (!message){
    $("#popup-notification").removeClass("growl-in");
  }
}

//refresh notifications
function clearNotification(){
  infoMessage(false);
  errorMessage(false);
  successMessage(false);
}

//check if we should display a success or error msg (for login)
function loadNotification() {

  //email address is not verified for this account
  if (message == "non-verified-email"){
    errorMessage("You must first verify your email address before logging in. Please check your inbox for a verification email from DomaHub!</br></br>To resend the email, please click <a id='verify-link' class='is-underlined'>here</a>.");

    //ajax to resend email for verifying email
    $("#verify-link").on("click", function(){
      $(this).off();
      $.ajax({
        type: "POST",
        url: "/verify"
      }).done(function(data){
        successMessage("Please check your inbox to finish verifying your DomaHub account!");
      });
    });
  }
  else if (message.toLowerCase().indexOf("success") != -1) {
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
    if (!$(".left-menu").hasClass("is-active")){
      e.preventDefault();
      $(".left-menu").addClass('is-active');
      $("#contact-button").click();
      $("#contact_message").focus();
    }
  });
}

//</editor-fold>

$(document).ready(function(){

  //delete notifications button
  $(".delete").on("click", function(e){
    var notification = $(this).parent(".notification");
    notification.removeClass("growl-in").addClass("growl-out");

    setTimeout(function() {
      notification.addClass("is-hidden");
    }, 250);

  });

});
