$(document).ready(function() {

  $("#accept_button").on("click", function(e){
    acceptOrRejectOffer(true, $(this));
  });

  $("#reject_button").on("click", function(e){
    acceptOrRejectOffer(false, $(this));
  });
});

//submit ajax for accept or reject
function acceptOrRejectOffer(accept, button_elem){
  button_elem.addClass('is-loading');
  $(".button").off();

  var accept_url = (accept) ? "/accept" : "/reject";

  $.ajax({
    url: "/listing/" + listing_info.domain_name + "/contact/" + offer_info.id + accept_url,
    method: "POST"
  }).done(function(data){
    button_elem.removeClass('is-loading');
    $(".button").addClass('is-hidden');
    console.log(data);

    if (data.state == "success"){
      successHandler(accept);
    }
    else {
      errorHandler();
    }
  });
}

//run when accept or reject was successful
function successHandler(accept){
  $("#success-message").removeClass('is-hidden').addClass('is-active');
  var accept_text = (accept) ? "accepted" :  "rejected";
  $("#success-message-text").text("Successfully " + accept_text + " this offer! Now redirecting you back to your profile.");
  redirectDelay("/profile");
}

//redirect after a short delay
function redirectDelay(path){
  var seconds = 3;

  //add a period every second
  window.setInterval(function(){
    seconds--;
    $("#success-message-text").text($("#success-message-text").text().trim() + ".");

    //redirect after 3 seconds
    if (seconds == 0){
      window.location.href = path;
    }
  }, 1000);
}

//run when accept or reject was NOT successful
function errorHandler(){
  $("#error-message").removeClass('is-hidden').addClass('is-active');
}
