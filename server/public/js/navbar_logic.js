$(document).ready(function() {
  //only if navbar is there
  if ($("#navbar").length > 0){

    //used to display the message sent from the server
    if (typeof message != "undefined" && message){
      if (message == "Invalid username / password!" || message == "Login error!"){
        $('#modal-login').addClass('is-active');
      }
    }

    //adds is-active to login button
    $('.login-modal').on("click", function() {
      $('#modal-login').addClass('is-active');
    });

    //various ways to close login dropdown menu
    $('.modal-close, .modal-background').on("click", function() {
      $('#modal-login').removeClass('is-active');
      $("#message").attr("style", "").text("Log in below");
    });

    //ESC key to close modal
    $(document).keyup(function(e) {
      if (e.which == 27) {
        $('.modal').removeClass('is-active');
      }
    });

    //close modal if user is logged in
    if (user){
      $('#modal-login').removeClass('is-active');
    }

    //hamburger toggle button
    $(".nav-toggle").on("click", function() {
      $(this).toggleClass("is-active");
      $(".nav-menu").toggleClass("is-active");
    });

    //profile dropdown logic
    $(document).on("click", function(event) {
      //clicked off profile dropdown
      if (!$(event.target).closest("#profile-button").length && !$("#profile-dropdown").hasClass("is-hidden")) {
        if (!$(".nav").hasClass("is-white")){
          $("#profile-button").toggleClass("is-outlined");
        }
        $("#profile-dropdown").addClass("is-hidden");
        $("#profile-button").toggleClass("is-active");
      }
      //clicked on profile dropdown
      else if ($(event.target).closest("#profile-button").length){
        if (!$(".nav").hasClass("is-white")){
          $("#profile-button").toggleClass("is-outlined");
        }
        $("#profile-button").toggleClass("is-active");
        $("#profile-dropdown").toggleClass("is-hidden");
      }
    });

    //change navbar based on scroll
    navbarChange($(window));
    $(window).scroll(function(e){
      navbarChange($(this));
    });
  }

});

//function to change navbar on scroll
function navbarChange(windowelem){
  //before the top
  if (windowelem.scrollTop() <= 0) {
    $(".nav").removeClass("has-shadow");
  }
  //past the top
  else if (windowelem.scrollTop() > 0 && !$(".nav").hasClass("has-shadow")){
    $(".nav").addClass("has-shadow");
  }
}
