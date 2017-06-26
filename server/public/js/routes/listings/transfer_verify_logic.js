$(document).ready(function() {

  $("#main_button").on("click", function(e){
    transferVerify(false, $(this));
  });

});

//function to submit ajax for accept or reject
function transferVerify(negate, button_elem){
  button_elem.addClass('is-loading');
  $(".button").off();

  $.ajax({
    url: "/listing/" + domain_name + "/bin/" + verification_code,
    method: "POST"
  }).done(function(data){
    button_elem.removeClass('is-loading');
    $(".button").addClass('is-hidden');
    console.log(data);

    if (data.state == "success"){
      successHandler(negate);
    }
    else {
      errorHandler();
    }
  });
}

//function to run when accept or reject was successful
function successHandler(negate){
  $("#success-message").removeClass('is-hidden');
  $("#success-message-text").text("Successfully verified the transfer!");
}

//function to run when accept or reject was NOT successful
function errorHandler(){
  $("#error-message").removeClass('is-hidden');
}
