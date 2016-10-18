$(document).ready(function() {

  $(".box").click(function() {
    $(".box").removeClass("is-active");

    if ($(this).hasClass("is-active")) {
      $(this).removeClass("is-active");
    } else {
      $(this).addClass("is-active");
    }
  });

  //next button for sections
  $(".next-button").click(function() {
    var current_section = $(".current-section");
    var next_section = $(".current-section").next(".section");
    current_section.addClass("is-hidden").removeClass("current-section")
    next_section.addClass("current-section").removeClass("is-hidden");
  });

  //next button for sections
  $(".prev-button").click(function() {
    var current_section = $(".current-section");
    var prev_section = $(".current-section").prev(".section");
    current_section.addClass("is-hidden").removeClass("current-section")
    prev_section.addClass("current-section").removeClass("is-hidden");
  });

  $(".fa-question-circle-o").hover(function(e){
      console.log("more info pls");
  });

});
