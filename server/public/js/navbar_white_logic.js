$(document).ready(function() {

  //<editor-fold>-------------------------------LOGIN MODAL-------------------------------

  //show login modal if there was an error
  if (typeof message != "undefined" && message){
    $('#modal-login').addClass('is-active');
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

  //</editor-fold>

  //<editor-fold>-------------------------------NAVBAR-------------------------------

  //hamburger toggle button (not logged in)
  $(".nav-toggle").on("click", function() {
    $(this).toggleClass("is-active");
    $(".nav-menu").toggleClass("is-active");
  });

  //profile dropdown
  $("#profile-button").on("click", function() {
    $("#profile-dropdown").toggleClass("is-hidden");
  });

  //clicked off navbar dropdown
  $(document).on("click", function(event) {
    if (!$(event.target).closest(".nav-toggle").length && $(".nav-menu").hasClass('is-active')) {
      $(".nav-toggle, .nav-menu").removeClass("is-active");
    }
    if (!$(event.target).closest("#profile-button").length && !$("#profile-button").hasClass('is-hidden')) {
      $("#profile-dropdown").addClass("is-hidden");
    }
  });

  //change navbar based on scroll
  navbarChange($(window));
  $(window).scroll(function(e){
    navbarChange($(this));
  });

});

function navbarChange(windowelem){
  if (windowelem.scrollTop() <= 0) {
    $(".nav").removeClass("has-shadow");
  }
  else if (windowelem.scrollTop() > 0 && !$(".nav").hasClass("has-shadow")){
    $(".nav").addClass("has-shadow");
  }
}
