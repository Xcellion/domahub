$(document).ready(function() {

  //if there was an login error, show the login modal
  if (message){
    $("#modal-login").addClass('is-active');
  }

  //switch between month and annual pricing
  $("#price-toggle").on("click", function() {
    if ($(this).prop("checked")) {
      $("#premium-price-month").addClass("is-active");
      $("#premium-price-annual").removeClass("is-hidden");
      $("#premium-price-text").html("Per month ($96 / year).");
    }
    else {
      $("#premium-price-month").removeClass("is-active");
      $("#premium-price-annual").addClass("is-hidden");
      $("#premium-price-text").html("Per month.");
    }
  });

});
