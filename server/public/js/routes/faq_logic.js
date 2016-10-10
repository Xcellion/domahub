$(document).ready(function() {

  $(".faq-question").click(function() {

    $(".faq-question").removeClass("is-active");
    $(".faq-question").next().addClass("is-hidden");

    if ($(this).hasClass("is-active")) {
      $(this).removeClass("is-active");
      $(this).next().addClass("is-hidden");
    } else {
      $(this).addClass("is-active");
      $(this).next().removeClass("is-hidden");
    }
    
  });

});
