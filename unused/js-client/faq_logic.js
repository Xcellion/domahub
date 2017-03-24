$(document).ready(function() {

  $(".faq-header").click(function() {

    $(this).siblings('.content').toggleClass('is-hidden');

  });


});

// $(".faq-question").on(("click, keydown",function(e) {
//
//   if (e.keyCode == 13) {
//     $(".faq-question").removeClass("is-active");
//     $(".faq-question").next().addClass("is-hidden");
//
//     if ($(this).hasClass("is-active")) {
//       $(this).removeClass("is-active");
//       $(this).next().addClass("is-hidden");
//     } else {
//       $(this).addClass("is-active");
//       $(this).next().removeClass("is-hidden");
//     }
//   }
