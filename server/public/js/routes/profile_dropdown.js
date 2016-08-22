$(document).ready(function() {

  $("#profile_button").click(function() {
    $(this).toggleClass("is-outlined is-active");
    $("#profile_dropdown").toggleClass("is-active");
  });

  $(".nav-toggle").click(function() {
    $(this).toggleClass("is-active");
    $(".nav-menu").toggleClass("is-active");
  });

});
