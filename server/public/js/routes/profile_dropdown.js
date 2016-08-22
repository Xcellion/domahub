$(document).ready(function() {

  $("#profile_button").click(function() {
    $(this).toggleClass("is-outlined");
  });

  $(".nav-toggle").click(function() {
    $(this).toggleClass("is-active");
    $(".nav-menu").toggleClass("is-active");
  });

});
