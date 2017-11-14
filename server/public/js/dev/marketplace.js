$(document).ready(function() {

  $(".misc-button").on("click", function() {
    $(".misc-options").addClass("is-hidden");
    $(this).next(".misc-options").removeClass("is-hidden");
  })

  $(document).on("click", function(event) {
    if (!$(event.target).closest(".misc-button").length) {
      if ($(".misc-options").is(":visible")) {
        $(".misc-options").addClass("is-hidden");
        $(".misc-button").toggleClass("is-active").blur();
      }
    }
  });

})
