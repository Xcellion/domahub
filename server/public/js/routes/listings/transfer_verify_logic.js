$(document).ready(function() {

  $("#verify-button").on("click", function(e){
    transferVerify($(this));
  });

});

//submit ajax for verifying transfer
function transferVerify(button_elem){
  button_elem.addClass('is-loading');
  $(".button").off();

  $.ajax({
    url: "/listing/" + listing_info.domain_name + "/bin/" + offer_info.verification_code,
    method: "POST"
  }).done(function(data){
    button_elem.removeClass('is-loading');
    $(".button").addClass('is-hidden');
    console.log(data);

    if (data.state == "success"){
      $("#message").text("Successfully verified the transfer! Congratulations on your purchase! You may now close this page.");
      $("#gohome-button").attr('href', listing_info.domain_name).removeClass('is-hidden');
    }
    else {
      $("#message").text("Something went wrong with the verification! Please refresh this page and try again.");
      $("#reload-button").removeClass('is-hidden').on("click", function(e){
        location.reload();
      });
    }
  });
}
