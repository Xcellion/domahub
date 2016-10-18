$(document).ready(function() {

  $(".box").click(function() {
    $(".box").removeClass("is-active");

    if ($(this).hasClass("is-active")) {
      $(this).removeClass("is-active");
    } else {
      $(this).addClass("is-active");
    }
  });

  $(".next-button").click(function() {
    $(this).parents(".section").addClass("is-hidden");
    $(this).parents(".section").next(".section").removeClass("is-hidden");
  });

  $(".fa-question-circle-o").hover(function(e){
      console.log("more info pls");
  })

});
