//update registrar card depending on if we have existing registrars
function updateRegistrars(){

  //button to show registrar modal
  $(".add-registrar-button").on("click", function(){
    setupRegistrarModal($(this).data("registrar"));
  });

  //submit registrar form
  $("#registrar-form").on("submit", function(e){
    e.preventDefault();
    submitRegistrar();
  });

  //update the text on the buttons and the label
  $(".registrar-button-text").each(function(){
    $(this).text("Connect " + $(this).data("registrar_name"));
  });
  $(".registrar-tip").each(function(){
    $(this).text("Click the button to update your " + $(this).data("registrar_name") + " account.");
  });

  //disable lookup button
  $("#lookup-domains-button").addClass('is-disabled');
  $(".registrar-tip").each(function(){
    $(this).text("Click the button to connect your " + $(this).data("registrar_name") + " account.");
  });

  //if user has any registrars connected
  if (user.registrars && user.registrars.length > 0){
    for (var x = 0 ; x < user.registrars.length ; x++){
      var registrar_connect_text = $(".add-registrar-button[data-registrar=" + user.registrars[x].name + "]").find(".registrar-button-text");
      registrar_connect_text.text("Update " + registrar_connect_text.data("registrar_name"));
      var registrar_connect_tip = $(".registrar-tip[data-registrar=" + user.registrars[x].name + "]");
      registrar_connect_tip.text("Click the button to update your " + registrar_connect_tip.data("registrar_name") + " account.");
    }

    //enable lookup button
    $("#lookup-domains-button").removeClass('is-disabled');
  }
}

//show the registrar modal and set it up for different registrars
function setupRegistrarModal(registrar){
  clearNotification();
  $("#registrar-name-input").val(registrar);

  //set up the registrar modal depending on the registrar name
  switch(registrar){
    case "godaddy":
      $("#registrar-guide-link").attr("href", "https://medium.com/@domahub/how-to-connect-your-godaddy-account-to-domahub-ab8e6741347");
      $("#api-key-link").removeClass('is-hidden').attr('href', "https://developer.godaddy.com/keys/");
      $("#registrar-api-key-label").text("Production API Key").closest(".registrar-wrapper").removeClass("is-hidden");
      $("#registrar-username-label").text("Customer Number").closest(".registrar-wrapper").removeClass("is-hidden");
      $("#registrar-password-label").text("Production Key Secret").closest(".registrar-wrapper").removeClass("is-hidden").find("input").attr("required", true);
      break;
    case "namecheap":
      $("#registrar-guide-link").attr("href", "https://medium.com/@domahub/how-to-connect-your-namecheap-account-to-domahub-509317e7bfac");
      $("#api-key-link").removeClass('is-hidden').attr('href', "https://ap.www.namecheap.com/Profile/Tools/ApiAccess");
      $("#registrar-api-key-label").text("API Key").closest(".registrar-wrapper").removeClass("is-hidden");
      $("#registrar-username-label").text("Username").closest(".registrar-wrapper").removeClass("is-hidden");
      $("#registrar-password-label").closest(".registrar-wrapper").addClass("is-hidden").find("input").attr("required", false);
      break;
    case "namesilo":
      $("#registrar-guide-link").attr("href", "https://medium.com/@domahub/how-to-connect-your-namesilo-account-to-domahub-9508aa178aa3");
      $("#api-key-link").removeClass('is-hidden').attr('href', "https://www.namesilo.com/account_api.php");
      $("#registrar-api-key-label").text("API Key").closest(".registrar-wrapper").removeClass("is-hidden");
      $("#registrar-username-label").closest(".registrar-wrapper").addClass("is-hidden").find("input").attr("required", false);
      $("#registrar-password-label").closest(".registrar-wrapper").addClass("is-hidden").find("input").attr("required", false);
      break;
  }

  //show registrar modal
  if (registrar){
    $("#registrar-modal").addClass('is-active');
    $("#registrar-form").find("input").first().focus()
  }
}

//submit registrar AJAX
function submitRegistrar(){
  $("#registrar-submit").addClass('is-loading');
  clearNotification();
  $.ajax({
    url: "/profile/registrar",
    method: "POST",
    data: $("#registrar-form").serialize()
  }).done(function(data){
    $("#registrar-submit").removeClass('is-loading');
    if (data.state == "success"){
      closeModals();
      successMessage("Successfully updated registrar information!");
      user = data.user;
      updateRegistrars();
    }
    else {
      errorMessage(data.message);
    }
  });
}
