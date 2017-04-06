$(document).ready(function () {
  if ($("#header-step2").hasClass('is-disabled')) {
    $("#checkout-step2").addClass('is-hidden');
  };

  $(".choice-block").on("click", function() {
    $("#choices-block").addClass("is-hidden");
    $("#choices-selected").removeClass("is-hidden");
    $(".back-button").removeClass("is-hidden");
    if ($(this).hasClass("build-choice")) {
      $(".build-choice-column").toggleClass("is-hidden");
      $("#checkout-msg1").text("We are NOT sponsored by any of these providers below. Clicking the image will send you to the respective website.")
    }
    else if ($(this).hasClass("link-choice")) {
      $(".link-choice-column").toggleClass("is-hidden");
      $("#checkout-msg1").text("Enter the URL of the web content you wish to display on your rental.")
    }
    else {
      $(".forward-choice-column").toggleClass("is-hidden");
      $("#checkout-msg1").text("Enter the URL of the website you want to forward your rental to.")
    }
  });

  $(".back-button").on("click", function() {
    $(this).addClass("is-hidden");
    $("#checkout-msg1").text("There are many different ways to create content for your website. Please select one of the options below to move forward!")
    $("#choices-block").removeClass("is-hidden");
    $("#choices-selected").addClass("is-hidden");
    $(".choice-column").addClass("is-hidden");
  });
});
