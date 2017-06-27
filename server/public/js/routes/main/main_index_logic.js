$(document).ready(function() {
  //scroll down on learn more
  $("#learn-more-wrapper").on("click", function(e){
    e.preventDefault();
    $('html, body').stop().animate({
      scrollTop: $("#features").offset().top - $("#navbar").height()
    }, 500);
  });
});
