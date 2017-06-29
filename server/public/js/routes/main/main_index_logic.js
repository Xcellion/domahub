$(document).ready(function() {

  //focus the try it input if there wasnt a anchor tag in the URL
  if (!window.location.hash){
    $("#domain-name-input").focus();
  }

  //scroll down on learn more
  $("#learn-more-wrapper").on("click", function(e){
    e.preventDefault();
    $('html, body').stop().animate({
      scrollTop: $("#features").offset().top - $("#navbar").height()
    }, 500);
  });
});
