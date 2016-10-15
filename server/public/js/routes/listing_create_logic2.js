$(document).ready(function() {

  $("#next-button").click(function() {
    $(this).parents(".section").addClass("is-hidden");
    $(this).parents(".section").next(".section").removeClass("is-hidden");
  });

});
