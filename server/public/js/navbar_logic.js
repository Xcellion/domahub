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
    $(".nav-mobile-menu").toggleClass("is-active");
  });

  //profile dropdown
  $("#profile-button").on("click", function() {
    $("#profile-dropdown").toggleClass("is-hidden");
  });

  //features menu toggle
  $('#features-menu').on("click", function() {
    $('.hover-menu').toggleClass("is-active");
  })

  //clicked off navbar dropdown
  $(document).on("click", function(event) {
    if (!$(event.target).closest(".nav-toggle").length && $(".nav-mobile-menu").hasClass('is-active')) {
      $(".nav-toggle, .nav-mobile-menu").removeClass("is-active");
    }
    if (!$(event.target).closest("#profile-button").length && !$("#profile-button").hasClass('is-hidden')) {
      $("#profile-dropdown").addClass("is-hidden");
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

  //change navbar based on resize
  window.onresize = function(event) {
    navbarChange($(this));
  };

  //</editor-fold>

});

//change navbar on scroll
function navbarChange(windowelem){
  //at the top
  if (windowelem.scrollTop() <= 0) {
    $("#nav-logo .circle-logo").removeClass('is-primary').addClass('is-white');
    $(".circle-logo").removeClass('is-primary').addClass('is-white');
    $(".nav").removeClass("has-shadow is-white");
    $(".nav-toggle").removeClass("is-black").addClass("is-white");
    $(".nav-center .button").addClass('is-hidden');

    //only if desktop
    if ($("#nav-logo").is(":visible")){
      $(".nav-link").addClass('is-white');
    }
    else {
      $(".nav-link").removeClass('is-white');
    }
  }
  //past the top
  else if (windowelem.scrollTop() > 0 && !$(".nav").hasClass("has-shadow")){
    $("#nav-logo").addClass('is-primary').removeClass('is-white');
    $(".circle-logo").addClass('is-primary').removeClass('is-white');
    $(".nav").addClass("has-shadow is-white");
    $(".nav-link").removeClass('is-white');
    $(".nav-toggle").addClass("is-black").removeClass("is-white");
    $(".nav-center .button").removeClass('is-hidden');
  }
}
