$(document).ready(function() {

  $(".faq-header").click(function() {
    $(this).toggleClass("is-active");
    $(this).siblings(".qa-wrapper").toggleClass("is-hidden");
  });

});
