$(document).ready(function() {

  $(".feature-tab").on("click", function() {
    var blurb = $(this).data("feature");
    
    $(".feature-tab").removeClass("is-active");
    $(this).addClass("is-active");
    $(".blurb").addClass("is-hidden");
    $("#" + blurb).removeClass("is-hidden");
  });

});
