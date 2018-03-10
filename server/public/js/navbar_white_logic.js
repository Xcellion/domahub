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

  //features menu toggle
  $('#features-menu').on("click", function() {
    $('.hover-menu').toggleClass("is-active");
  })

  //ESC key to close modal
  $(document).keyup(function(e) {
    if (e.which == 27) {
      $('.modal').removeClass('is-active');
    }
  });

  //</editor-fold>

  //<editor-fold>-------------------------------NAVBAR-------------------------------

  //hamburger toggle button (not logged in)
  $(".nav-toggle, #profile-button").on("click", function() {
    $(this).toggleClass("is-active");
    $(".nav-mobile-menu").toggleClass("is-active");
  });

  //features menu toggle
  $('#features-menu').on("click", function() {
    $('.hover-menu').toggleClass("is-active");
  })

  //clicked off navbar dropdown
  $(document).on("click", function(event) {
    if (!$(event.target).closest(".menu-toggle").length && $(".nav-mobile-menu").hasClass('is-active')) {
      $(".nav-toggle, .nav-mobile-menu").removeClass("is-active");
    }
    if (!$(event.target).closest("#features-menu").length && !$(event.target).closest(".hover-menu-link").length) {
      if ($(".hover-menu").is(":visible")) {
        $(".hover-menu").removeClass("is-active");
        $(this).toggleClass("is-active").blur();
      }
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
