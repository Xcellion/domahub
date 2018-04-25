//on back button (show step but don't push to history)
window.onpopstate = function(event) {
  showSpecificStep(false);
};

//keep track of the method used to create domains (manual vs registrar connect)
var domain_created_by = "";

$(document).ready(function() {

  //<editor-fold>-------------------------------GENERIC STEP LOGIC-------------------------------

  //click next button to submit form for current step
  $(".onboarding-step-form").on("submit", function(e){
    e.preventDefault();

    var currentStep = $(this).closest(".onboarding-step-wrapper");
    submitSpecificStepForm(currentStep, currentStep.attr("id").replace("onboarding-step-", ""));
  });

  //skip step button
  $(".onboarding-skip-button").on("click", function(){
    showSpecificStep(true, $(this).closest(".onboarding-step-wrapper").next(".onboarding-step-wrapper").attr("id").replace("onboarding-step-", ""));
  });

  //go back a step
  $(".onboarding-prev-button").on("click", function(){
    showSpecificStep(true, $(this).closest(".onboarding-step-wrapper").prev(".onboarding-step-wrapper").attr("id").replace("onboarding-step-", ""), true);
  });

  //navigate to a step in the side menu
  $(".step-link").on("click", function() {
    $(".step-link").removeClass("is-active");
    $(this).addClass("is-active");
    showSpecificStep(true, $(this).data("step").toString());
  });

  //button to toggle collapsed steps menu on lower width
  $(".steps-menu-button").on("click", function() {
    $(".steps-menu").toggleClass("is-active");
  });

  //hide steps menu on click outside
  $(document).on("click", function(event) {
    if (!$(event.target).closest(".steps-menu-button").length && !$(event.target).closest(".menu-list").length) {
      if ($(".steps-menu").is(":visible")) {
        $(".steps-menu").removeClass("is-active");
      }
    }
  });

  //hide modal on escape key
  $(document).on("keyup", function(e) {
    if (e.which == 27) {
      closeModals();
    }
  });

  //close modal
  $(".modal-close, .modal-background, .cancel-modal").on("click", function(){
    closeModals();
  });

  //</editor-fold>

  //<editor-fold>-------------------------------PAGE SETUP-------------------------------

  //pre-fill any existing user stripe information
  if (user.stripe_account){
    for (var x in user.stripe_account){
      $("#" + x + "-input").val(user.stripe_account[x]);
    }
  }

  //pre-fill stripe bank info if exists
  if (user.stripe_bank){
    $("#existing-bank-details").removeClass('is-hidden').text("Current bank account - " + user.stripe_bank.bank_name + " ending in " + user.stripe_bank.last4);
  }

  //pre-fill paypal
  if (user.paypal_email){
    $("#paypal_email-input").val(user.paypal_email);
  }

  //gets the current step from URL or user obj (or show step 1) and dont add to history
  showSpecificStep(false);

  //change the bank forms based on country
  $("#currency-input").on("change", function(e){
    changeBankCountry($(this).val());
  });

  //set stripe key
  if (typeof Stripe != "undefined"){
    if (window.location.hostname == "localhost"){
      Stripe.setPublishableKey('pk_test_kcmOEkkC3QtULG5JiRMWVODJ');
    }
    else {
      Stripe.setPublishableKey('pk_live_506Yzo8MYppeCnLZkW9GEm13');
    }
  }

  //format all stripe inputs
  $('#cc-num').payment('formatCardNumber');
  $('#cc-exp').payment('formatCardExpiry');
  $('#cc-cvc').payment('formatCardCVC');
  $('#cc-zip').payment('restrictNumeric');

  //</editor-fold>

});

//<editor-fold>-------------------------------GENERIC STEP LOGIC-------------------------------

//shows a specific step or gets the current step from URL (or show first step)
//push = whether or not to add to history
function showSpecificStep(push, step_to_show, backwards, refreshing){

  //if no defined step in function params, then get URL or user.onboarding_step or 1
  var current_step = getParameterByName("step");
  if (!step_to_show){
    step_to_show = (current_step) ? current_step : (user.onboarding_step) ? user.onboarding_step : "1";
  }

  //finished, don't let them go back in steps
  if (user.onboarding_step >= 12){
    step_to_show = user.onboarding_step;
    refreshing = true;
  }

  //non-existant step
  if (parseInt(step_to_show) <= 0 || step_to_show > $(".onboarding-step-wrapper").length || !Number.isInteger(parseInt(step_to_show))){
    step_to_show = (user.onboarding_step) ? user.onboarding_step : "1";
  }

  //run step specific logic then show step. (needed bc some steps skip others)
  runStepSpecificLogic(step_to_show, backwards, function(){

    //update step-link active
    $(".step-link").removeClass("is-active");
    $(".step-link[data-step=" + step_to_show  + "]").addClass("is-active");

    //update URL
    updateQueryStringParam("step", step_to_show, push);

    //show specific step
    $(".onboarding-step-wrapper").addClass("is-hidden");

    //show sliding out if next step isn't current step (aka not refreshing) and if loading screen isnt visible
    if (step_to_show != current_step && !refreshing){
      $("#onboarding-step-" + current_step).removeClass("slide-in is-hidden").addClass('slide-out');
      toggleLoadingScreen("step-form" + step_to_show, false);
      // maybe need to show loading if the set step logic isnt fast enough
      $("#onboarding-step-" + current_step).one('oanimationend animationend webkitAnimationEnd', function() {
        if (!$(".loading-screen").hasClass("is-hidden")){
          toggleLoadingScreen("step-form" + $(this).attr("id").replace("onboarding-step-", ""), true);
        }
        $(this).off("oanimationend animationend webkitAnimationEnd");
      });
    }
    //refreshing
    else if (!$(".loading-screen").hasClass("is-hidden")){
      toggleLoadingScreen("step-form" + step_to_show, true);
    }

    //set the step number on back end and then show next step
    setBackEndStep(step_to_show, function(){
      toggleLoadingScreen("step-form" + step_to_show, false);
      $("#onboarding-step-" + step_to_show).removeClass('slide-out is-hidden').addClass("slide-in");
    });

  });
}

//set the backend step if different
function setBackEndStep(step_number, cb, button){
  if (button){
    button.addClass("is-loading");
  }

  if (step_number != user.onboarding_step){
    $.ajax({
      url: "/profile/welcome/setstep",
      method: "POST",
      data: {
        onboarding_step : step_number
      }
    }).done(function(data){
      if (data.state == "success" && data.user){
        user = data.user;
        // setTimeout(function(){ cb(); }, 3000);   //artificial delay
        cb();
      }
      else {
        button.removeClass('is-loading');
        errorMessage("Something went wrong! Please refresh the page and try again!");
      }
    });
  }
  else {
    // setTimeout(function(){ cb(); }, 3000);   //artificial delay
    cb();
  }
}

//add checks or minuses
function checkPreviousStep(step_number) {
  if (step_number == 1) {
    $(".step-tracker[data-tracker='1']").addClass("is-hidden");
    if (user.stripe_account) {
      $(".step-link[data-step='2']").find(".icon.is-primary").removeClass("is-hidden");
    }
    else {
      $(".step-link[data-step='2']").find(".icon.is-danger").removeClass("is-hidden");
    }
  }

  if (step_number == 2) {
    $(".step-tracker[data-tracker='2']").addClass("is-hidden");
    if (user.stripe_bank || user.paypal_email) {
      $(".step-link[data-step='4']").find(".icon.is-primary").removeClass("is-hidden");
      return checkPreviousStep(1);
    }
    else {
      $(".step-link[data-step='4']").find(".icon.is-danger").removeClass("is-hidden");
      return checkPreviousStep(1);
    }
  }

  if (step_number == 3) {
    $(".step-tracker[data-tracker='3']").addClass("is-hidden");
    if (user.listings.length > 0 || user.registrars.length > 0) {
      $(".step-link[data-step='7']").find(".icon.is-primary").removeClass("is-hidden");
      return checkPreviousStep(2);
    }
    else {
      $(".step-link[data-step='7']").find(".icon.is-danger").removeClass("is-hidden");
      return checkPreviousStep(2);
    }
  }
}

//change sub-step number (1 of 2)
function subStepHandler(step_number, substep, total_steps) {
  $(`.step-tracker[data-tracker=${step_number}]`).next(".icon").addClass("is-hidden");
  $(`.step-tracker[data-tracker=${step_number}]`).removeClass("is-hidden").html(`${substep} of ${total_steps}`);
}

//runs step-specific logic for each step
function runStepSpecificLogic(step_number, backwards, cb){
  clearNotification();
  switch (step_number){
    case ("1"):
      stepOneLogic(backwards, cb);
      break;
    case ("2"):
      stepTwoLogic(backwards, cb);
      break;
    case ("3"):
      stepThreeLogic(backwards, cb);
      break;
    case ("4"):
      stepFourLogic(backwards, cb);
      break;
    case ("5"):
      stepFiveLogic(backwards, cb);
      break;
    case ("6"):
      stepSixLogic(backwards, cb);
      break;
    case ("7"):
      stepSevenLogic(backwards, cb);
      break;
    case ("8"):
      stepEightLogic(backwards, cb);
      break;
    case ("9"):
      stepNineLogic(backwards, cb);
      break;
    case ("10"):
      stepTenLogic(backwards, cb);
      break;
    case ("11"):
      stepElevenLogic(backwards, cb);
      break;
    default:
      finishedAllStepsLogic(cb);
      break;
  }
}

//runs step-specific form submission
function submitSpecificStepForm(form_elem, step_number){
  clearNotification();
  switch (step_number){
    case ("1"):
      stepOneSubmitFormLogic(form_elem);
      break;
    case ("2"):
      stepTwoSubmitFormLogic(form_elem);
      break;
    case ("3"):
      stepThreeSubmitFormLogic(form_elem);
      break;
    case ("4"):
      stepFourSubmitFormLogic(form_elem);
      break;
    case ("5"):
      stepFiveSubmitFormLogic(form_elem);
      break;
    case ("6"):
      stepSixSubmitFormLogic(form_elem);
      break;
    case ("7"):
      stepSevenSubmitFormLogic(form_elem);
      break;
    case ("8"):
      stepEightSubmitFormLogic(form_elem);
      break;
    case ("9"):
      stepNineSubmitFormLogic(form_elem);
      break;
    case ("10"):
      stepTenSubmitFormLogic(form_elem);
      break;
    case ("11"):
      stepElevenSubmitFormLogic(backwards, cb);
      break;
  }
}

//show or hide loading screen
function toggleLoadingScreen(current_form, show, message) {
  if (show) {
    $(current_form).addClass('is-hidden');
    $(".loading-screen").removeClass("is-hidden");
  }
  else {
    $(current_form).removeClass('is-hidden');
    $(".loading-screen").addClass("is-hidden");
  }

  if (message) {
    $("#loading-screen-heading").html(message);
  }
}

//</editor-fold>

//<editor-fold>-------------------------------STEP SPECIFIC LOGIC-------------------------------

  //<editor-fold>-------------------------------STEP 1 (WELCOME MESSAGE)-------------------------------

  function stepOneLogic(backwards, cb){
    //console.log("step 1 specific logic");

    //advance progress bar
    $(".progress").attr("value", 0);

    //show step
    cb();
  }

  function stepOneSubmitFormLogic(form_elem){
    //console.log("step 1 specific form submission");

    //show next step
    showSpecificStep(true, "2");
  }

  //</editor-fold>

  //<editor-fold>-------------------------------STEP 2 (PERSONAL DETAILS)-------------------------------

  function stepTwoLogic(backwards, cb){
    //set substep number
    subStepHandler("1", 1, 2);

    //advance progress bar
    $(".progress").attr("value", 10);

    //show step
    cb();
  }


  function stepTwoSubmitFormLogic(form_elem){
    //console.log("step 2 specific form submission");
    //show next step
    showSpecificStep(true, "3");
  }

  //</editor-fold>

  //<editor-fold>-------------------------------STEP 3 (ADDRESS DETAILS)-------------------------------

  function stepThreeLogic(backwards, cb){
    //set substep number
    subStepHandler("1", 2, 2);

    //advance progress bar
    $(".progress").attr("value", 20);

    //show step
    cb();
  }

  function stepThreeSubmitFormLogic(form_elem){
    //console.log("step 3 specific form submission");

    toggleLoadingScreen(form_elem, true, "Submitting your information...");

    //ajax for submitting personal details
    form_elem.find(".onboarding-next-button").addClass('is-loading');
    $.ajax({
      url: "/profile/payout",
      method: "POST",
      data: $("#step-form-3").add($("#step-form-2")).serialize()
    }).done(function(data){
      form_elem.find(".onboarding-next-button").removeClass("is-loading");
      if (data.state == "success"){
        if (data.user){
          user = data.user;
        }
        showSpecificStep(true, "4", false, true);
      }
      else {
        toggleLoadingScreen(form_elem, false);
        errorMessage(data.message);
      }
    });
  }

  //</editor-fold>

  //<editor-fold>-------------------------------STEP 4 (PAYOUT METHODS)-------------------------------

  function stepFourLogic(backwards, cb){
    //check previous step and change substep for current
    checkPreviousStep(1);
    subStepHandler("2", 1, 2);

    //advance progress bar
    $(".progress").attr("value", 30);

    //create listing buttons
    $("#go-step-5, #go-step-6").off().on("click", function() {
      $("#payout-step-tracker").html("2 of 2");
      if ($(this).attr("id") == "go-step-5") {
        showSpecificStep(true, "5");
      }
      else {
        showSpecificStep(true, "6");
      }
    });

    //show step
    cb();
  }

  //no next button on this step
  function stepFourSubmitFormLogic(form_elem){
    // console.log("step 4 specific form submission");
  }

  //</editor-fold>

  //<editor-fold>-------------------------------STEP 5 (BANK ACCOUNT)-------------------------------

  function stepFiveLogic(backwards, cb){
    //check previous step and change substep for current
    checkPreviousStep(1);
    subStepHandler("2", 2, 2);

    //advance progress bar
    $(".progress").attr("value", 40);

    //if we dont have a stripe account, skip bank account
    if (!user.stripe_account && !user.stripe_account_id){
      if (backwards){
        showSpecificStep(true, "4");
      }
      else {
        showSpecificStep(true, "5");
      }
    }
    else {
      //reset any existing values
      $(".excess-routing-input").val("");
      $(".excess-routing-wrapper, #account-wrapper").addClass('is-hidden');
      $("#currency-input").val("");
      $("#bank_country-input").val("");

      //show step
      cb();
    }
  }

  function stepFiveSubmitFormLogic(form_elem){
    //console.log("step 5 specific form submission");

    toggleLoadingScreen(form_elem, true, "Submitting your information...");

    var bank_info = {
      country: $('#bank_country-input').val(),
      currency: $('#currency-input').val(),
      account_number: $('#account_number-input').val()
    }

    //different routing number according to country codes
    if (!$("#account_routing-wrapper").hasClass("is-hidden")) {
      bank_info.routing_number = $('#account_routing-input').val().toString() + $('#account_routing2-input').val().toString();
    }
    if (!$("#account_routing3-wrapper").hasClass("is-hidden")) {
      bank_info.account_holder_name = $('#account_routing3-input').val().toString();
    }

    //create stripe token
    Stripe.bankAccount.createToken(bank_info, function(status, response){
      if (status != 200){
        toggleLoadingScreen(form_elem, false);
        errorMessage(response.error.message);
      }
      else {
        //submit to server
        if (user.stripe_bank){
          //create for first time
          submitBank(response.id, false, form_elem);
        }
        else {
          //update default bank info
          submitBank(response.id, true, form_elem);
        }
      }
    });
  }

  //change bank forms based on country
  function changeBankCountry(currency){
    $("#account-wrapper").removeClass('is-hidden');
    $(".excess-routing-input").val("").attr("required", false);
    $("#account_number-input").attr("required", true);
    switch (currency){
      case "AUD":
      $("#account_routing-text").text("BSB");
      $("#account_number-text").text("Account Number ");
      $("#account_routing-wrapper").removeClass("is-hidden");
      $("#account_routing-input").attr("required", true);
      $("#account_routing2-wrapper").addClass("is-hidden");
      $("#account_routing3-wrapper").addClass("is-hidden");
      break;
      case "USD":
      $("#account_routing-text").text("Routing Number");
      $("#account_number-text").text("Account Number ");
      $("#account_routing-wrapper").removeClass("is-hidden");
      $("#account_routing-input").attr("required", true);
      $("#account_routing2-wrapper").addClass("is-hidden");
      $("#account_routing3-wrapper").addClass("is-hidden");
      break;
      case "CAD":
      $("#account_routing-text").text("Transit Number");
      $("#account_routing2-text").text("Institution Number");
      $("#account_number-text").text("Account Number ");
      $("#account_routing-wrapper").removeClass("is-hidden");
      $("#account_routing-input").attr("required", true);
      $("#account_routing2-wrapper").removeClass("is-hidden");
      $("#account_routing2-input").attr("required", true);
      $("#account_routing3-wrapper").addClass("is-hidden");
      break;
      case "JPY":
      $("#account_routing-text").text("Bank Code");
      $("#account_routing2-text").text("Branch Code");
      $("#account_number-text").text("Account Number ");
      $("#account_routing-wrapper").removeClass("is-hidden");
      $("#account_routing-input").attr("required", true);
      $("#account_routing2-wrapper").removeClass("is-hidden");
      $("#account_routing2-input").attr("required", true);
      $("#account_routing3-wrapper").removeClass("is-hidden");
      $("#account_routing3-input").attr("required", true);
      break;
      case "SGD":
      $("#account_routing-text").text("Bank Code");
      $("#account_routing2-text").text("Branch Code");
      $("#account_number-text").text("Account Number ");
      $("#account_routing-wrapper").removeClass("is-hidden");
      $("#account_routing-input").attr("required", true);
      $("#account_routing2-wrapper").removeClass("is-hidden");
      $("#account_routing2-input").attr("required", true);
      $("#account_routing3-wrapper").addClass("is-hidden");
      break;
      case "HKD":
      $("#account_routing-text").text("Clearing Code");
      $("#account_routing2-text").text("Branch Code");
      $("#account_number-text").text("Account Number ");
      $("#account_routing-wrapper").removeClass("is-hidden");
      $("#account_routing-input").attr("required", true);
      $("#account_routing2-wrapper").removeClass("is-hidden");
      $("#account_routing2-input").attr("required", true);
      $("#account_routing3-wrapper").addClass("is-hidden");
      break;
      default:
      $("#account_number-text").text("IBAN ");
      $(".excess-routing-wrapper").addClass("is-hidden");
      break;
    }
  }

  //submit stripe token for bank info
  function submitBank(stripe_token, updating_bank, form_elem){
    $.ajax({
      url: "/profile/bank",
      data: {
        stripe_token: stripe_token
      },
      method: "POST"
    }).done(function(data){
      toggleLoadingScreen(form_elem, false);
      if (data.state == "success"){
        if (data.user){
          user = data.user;
        }
        $("#change-bank-modal").removeClass('is-active');
        if (updating_bank){
          showSpecificStep(true, "7");
        }
        else {
          showSpecificStep(true, "7");
        }
      }
      else {
        toggleLoadingScreen(form_elem, false);
        errorMessage(data.message);
      }
    });
  }

  //</editor-fold>

  //<editor-fold>-------------------------------STEP 6 (PAYPAL)-------------------------------

  function stepSixLogic(backwards, cb){
    //check previous step and change substep for current
    checkPreviousStep(1);
    subStepHandler("2", 2, 2);

    //advance progress bar
    $(".progress").attr("value", 40);

    //show step
    cb();
  }

  function stepSixSubmitFormLogic(form_elem){
    //console.log("step 6 specific form submission");

    //submit changes to server
    form_elem.find(".onboarding-next-button").addClass('is-loading');
    $.ajax({
      url: "/profile/settings",
      method: "POST",
      data: {
        paypal_email: $("#paypal_email-input").val().toLowerCase()
      }
    }).done(function(data){
      form_elem.find(".onboarding-next-button").removeClass('is-loading');
      if (data.state == "success"){
        if (data.user){
          user = data.user;
        }
        showSpecificStep(true, "7");
      }
      else {
        errorMessage(data.message);
      }
    });
  }

  //</editor-fold>

  //<editor-fold>-------------------------------STEP 7 (ACCOUNT SETUP FINISHED)-------------------------------

  function stepSevenLogic(backwards, cb){
    //check previous step and change substep for current
    checkPreviousStep(2);
    subStepHandler("3", 1, 3);

    //advance progress bar
    $(".progress").attr("value", 50);

    //create listing buttons
    $("#go-step-8, #go-step-9").off().on("click", function() {
      if ($(this).attr("id") == "go-step-8") {
        domain_created_by = "connect";
        showSpecificStep(true, "8");
      }
      else {
        domain_created_by = "manual";
        showSpecificStep(true, "9");
      }
    });

    //show step
    cb();
  }

  //no next button on this step
  function stepSevenSubmitFormLogic(form_elem){
    // console.log("step 7 specific form submission");
  }

  //</editor-fold>

  //<editor-fold>-------------------------------STEP 8 (CONNECT REGISTRAR)-------------------------------

  function stepEightLogic(backwards, cb){
    //check previous step and change substep for current
    checkPreviousStep(2);
    subStepHandler("3", 2, 3);

    //advance progress bar
    $(".progress").attr("value", 65);

    //backwards but nothing selected (refreshed on manual creation)
    if (backwards && (domain_created_by == "manual" || domain_created_by == "")){
      showSpecificStep(true, "7");
    }
    else {
      domain_created_by = "connect";

      //disable next button if there are no registrars
      if (!user.registrars || user.registrars.length <= 0){
        $("#onboarding-step-8").find(".onboarding-next-button").addClass('is-disabled');
      }
      else {
        $("#onboarding-step-8").find(".onboarding-next-button").removeClass('is-disabled');
      }

      updateRegistrars();

      //show step
      cb();
    }

  }

  function stepEightSubmitFormLogic(form_elem){
    //console.log("step 8 specific form submission");

    if (user.registrars.length > 0 || !user.registrars){
      form_elem.find(".onboarding-next-button").addClass('is-loading');
      $.ajax({
        url: "/profile/registrar/lookup",
        method: "POST"
      }).done(function(data){
        form_elem.find(".onboarding-next-button").removeClass('is-loading');
        if (data.state == "success"){
          createDomainsTable(data.bad_listings, data.good_listings);
          if (data.good_listings.length > 0){
            var total_good_domains = (data.good_listings.length == 1) ? "an unlisted domain" : data.good_listings.length + " unlisted domains"
            var excess_hundred = (data.good_listings.length > 100) ? " Now showing the first 20 listings." : "";
            domain_created_by = "connect";
            showSpecificStep(true, "10");
          }
          else if (data.bad_listings.length == 0){
            infoMessage("We couldn't find any unlisted domains in your connected registrars! Please try creating your domain listings manually.</br></br>If there is something wrong, please <a class='is-underlined contact-link' href='/contact'>contact us</a> for assistance!");
          }
          else {
            errorMessage("Something went wrong in looking up your domains! Please refresh the page and try again. If this continues, please create your listings manually.");
          }
        }
        else {
          errorMessage(data.message);
        }
      });
    }
    else {
      errorMessage("You don't have any registrars to look up! Please click a connect button to add specific registrars.");
    }
  }

  //</editor-fold>

  //<editor-fold>-------------------------------STEP 9 (MANUAL DOMAIN ENTRY)-------------------------------

  function stepNineLogic(backwards, cb){
    //check previous step and change substep for current
    checkPreviousStep(2);
    subStepHandler("3", 2, 3);

    //advance progress bar
    $(".progress").attr("value", 65);

    //show step 8 if going backwards and using "connect registrar"
    if (backwards && domain_created_by == "connect"){
      showSpecificStep(true, "8");
    }
    //else show step
    else {
      domain_created_by = "manual";
      cb();
    }
  }

  function stepNineSubmitFormLogic(form_elem){
    //console.log("step 9 specific form submission");

    form_elem.find(".onboarding-next-button").addClass('is-loading');
    clearNotification();
    $.ajax({
      url: "/listings/create/table",
      method: "POST",
      data: {
        domain_names: $("#domain-names").val().replace(/\s/g,'').replace(/^[,\s]+|[,\s]+$/g, '').replace(/,[,\s]*,/g, ',').split(",")
      }
    }).done(function(data){
      form_elem.find(".onboarding-next-button").removeClass('is-loading');

      //successfully checked domain names, create the table
      if (data.state == "success"){
        createDomainsTable(data.bad_listings, data.good_listings);
        domain_created_by = "manual";
        showSpecificStep(true, "10");
      }
      else {
        if (data.message == "max-domains-reached"){
          errorMessage("You cannot exceed 100 domains for a Basic account. Please <a class='is-underlined' href='/profile/settings#premium'>upgrade to a Premium account</a> to create more listings!");
        }
        else {
          errorMessage(data.message);
        }
      }
    }).error(function(){
      errorMessage("You can only create up to 100 domains at a time!");
    });
  }

  //</editor-fold>

  //<editor-fold>-------------------------------STEP 10 (DOMAIN TABLE)-------------------------------

  function stepTenLogic(backwards, cb){
    //check previous step and change substep for current
    checkPreviousStep(2);
    subStepHandler("3", 3, 3);

    //advance progress bar
    $(".progress").attr("value", 80);

    //if we refreshed and came to this step, show step 7 instead
    if (domain_created_by == ""){
      showSpecificStep(true, "7", false, true);
    }
    //else show step
    else {
      cb();
    }
  }

  function stepTenSubmitFormLogic(form_elem){
    //console.log("step 10 specific form submission");

    submitDomains(form_elem);
  }

    //<editor-fold>-------------------------------TABLE SET UP-------------------------------

    //create domains table
    function createDomainsTable(bad_listings, good_listings){

      //remove any existing
      $(".table-row:not(#clone-row)").remove();

      if (bad_listings.length > 0){
        for (var x = 0; x < bad_listings.length; x++){
          createTableRow(bad_listings[x]);
        }
      }

      if (good_listings.length > 0){
        for (var y = 0; y < good_listings.length; y++){
          createTableRow(good_listings[y], true);
        }
      }
    }

    //create table row
    function createTableRow(data, good){
      var temp_table_row = $("#clone-row").clone();
      temp_table_row.removeAttr('id').removeClass('is-hidden');    //clone row

      //set row domain data
      if (data && data.domain_name){
        temp_table_row.attr("data-domain_name", data.domain_name.toLowerCase());
        temp_table_row.find(".domain-name-input").val(data.domain_name);
      }


      //click handler for row delete
      temp_table_row.find(".delete-icon").on("click", function(){
        $(this).closest('tr').remove();
        if ($(".delete-icon").length == 1){
          createTableRow("");
        }
        clearNotification();
      });

      //handler to clear reasons and append the reason
      temp_table_row.find(".domain-name-input").on("input change", function(){
        //set domain name data
        temp_table_row.attr("data-domain_name", $(this).val());

        //check to see if it's legit domain name
        if ($(this).val().indexOf(".") != -1 || $(this).val() == ""){
          temp_table_row.removeClass('errored-row');
          $(this).removeClass('is-danger');
          $(this).closest("td").find("small").remove();
          clearNotification();
        }
      });

      //looked up from a specific registrar
      if (good){
        createGoodReasons(data.reasons, temp_table_row, true);
      }
      //reasons for why it was a bad listing
      else {
        createBadReasons(data.reasons, temp_table_row);
      }

      temp_table_row.appendTo("#domain-input-body");
    }

    //edit the rows to append any bad reasons
    function createBadReasons(reasons, row){
      if (reasons){
        $("#clear-errored-button").removeClass('is-hidden');
        row.addClass('errored-row');

        //append latest one
        for (var x = 0; x < reasons.length; x++){
          var explanation = $("<small class='is-danger tip is-inline no-margin'>" + reasons[x] + "</small>")
          if (reasons[x] == "Invalid min. price!"){
            var reason_input = ".min-price-input";
          }
          else if (reasons[x] == "Invalid BIN price!"){
            var reason_input = ".buy-price-input";
          }
          else {
            var reason_input = ".domain-name-input";
          }
        }

        row.find(reason_input).addClass('is-danger').closest('td').append(explanation);
      }
    }

    //edit the rows to append any good reasons
    function createGoodReasons(reasons, row, registrar){
      if (reasons){
        //append latest one
        for (var x = 0 ; x < reasons.length ; x++){
          var explanation = $("<small class='is-primary tip is-inline no-margin'>" + reasons[x] + "</small>")
          row.find('.domain-name-input').closest("td").append(explanation);
        }

        //only if successfully created, and not successful lookup via registrar
        if (!registrar){
          row.addClass('success-row').find(".table-input").removeClass('is-danger').addClass('is-primary').addClass('is-disabled');
        }
      }
    }

    //</editor-fold>

    //<editor-fold>-------------------------------TABLE SUBMIT-------------------------------

    //get the table row values for ajax submission
    function getTableListingInfo(){
      var temp_array = [];
      $(".table-row").not("#clone-row").each(function(idx, elem) {
        var temp_row = $(this);
        //if domain name is not empty and not disabled
        if (temp_row.find(".domain-name-input").val() && !temp_row.find(".domain-name-input").hasClass('is-disabled')){
          var row_obj = {
            domain_name : temp_row.find(".domain-name-input").val().replace(/\s/g, ''),
            min_price : (temp_row.find(".min-price-input").val() == "") ? 0 : temp_row.find(".min-price-input").val(),
            buy_price : (temp_row.find(".buy-price-input").val() == "") ? 0 : temp_row.find(".buy-price-input").val()
          };
          temp_array.push(row_obj);
        }
      });
      return temp_array;
    }

    //submit table domains (NOT TEXTAREA)
    function submitDomains(form_elem){
      deleteEmptyTableRows();
      var domains = getTableListingInfo(".domain-name-input");
      if (domains.length > 0){
        form_elem.find(".onboarding-next-button").addClass('is-loading');
        deleteGoodTableRows();
        clearNotification();
        toggleLoadingScreen(form_elem, true, "Now adding your domains...");
        $.ajax({
          url: "/listings/create",
          method: "POST",
          data: {
            domains: domains
          }
        }).done(function(data){
          toggleLoadingScreen(form_elem, false);
          form_elem.find(".onboarding-next-button").removeClass('is-loading');
          clearNotification();
          if (data.state == "error"){
            if (data.message == "max-domains-reached"){
              errorMessage("You cannot exceed 100 domains for a Basic account. Please <a class='is-underlined' href='/profile/settings#premium'>upgrade to a Premium account</a> to create more listings!");
            }
            else {
              errorMessage(data.message);
            }
          }
          else {
            //handle any good or bad listings
            updateRows(data.bad_listings, data.good_listings);
          }
        });
      }
    }

    //delete table rows that are already successful (so we dont create duplicates)
    function deleteGoodTableRows(){
      var good_domain_inputs = $(".domain-name-input").filter(function() { return $(this).hasClass("is-disabled");});
      good_domain_inputs.closest("tr").not("#clone-row").remove();
      if ($(".table-row").length == 1){
        createTableRow("");
      }
    }

    //</editor-fold>

    //<editor-fold>-------------------------------TABLE BUTTONS-------------------------------

    //delete empty table rows
    function deleteEmptyTableRows(){
      var empty_domain_inputs = $(".domain-name-input").filter(function() { return $(this).val() == ""; });
      empty_domain_inputs.closest("tr").not("#clone-row").remove();
      if ($(".table-row").length == 1){
        createTableRow("");
      }
    }

    //delete all rows
    function deleteAllRows(){
      $(".table-row").not("#clone-row").remove();
      if ($(".table-row").length == 1){
        createTableRow("");
      }
    }

    //delete all errored rows
    function deleteErroredRows(){
      $(".table-row.errored-row").not("#clone-row").remove();
      if ($(".table-row").length == 1){
        createTableRow("");
      }
    }

    //</editor-fold>

    //<editor-fold>-------------------------------TABLE UPDATE-------------------------------

    //refresh rows on ajax return
    function updateRows(bad_listings, good_listings){
      console.log(bad_listings, good_listings);

      //remove small error reasons
      $("td small").remove();
      $("td .is-danger").removeClass("is-danger");

      //append bad reasons
      if (bad_listings && bad_listings.length > 0){
        for (var x = 0; x < bad_listings.length; x++){
          createBadReasons(
            bad_listings[x].reasons,
            $(".table-row:not(#clone-row)[data-domain_name='" + bad_listings[x].domain_name + "']")
          );
        }
      }

      //notify the user
      var error_amount = (bad_listings.length == 1) ? "a domain name" : bad_listings.length + " domains"
      if (!good_listings || (good_listings.length == 0 && bad_listings.length > 0)){
        errorMessage("There was something wrong with " + error_amount + "! See below for more details.");
      }
      else if (good_listings.length > 0){
        var success_amount = (good_listings.length == 1) ? "listing" : good_listings.length + " listings"
        $("#total-created-listings").text("your first " + success_amount);
        showSpecificStep(true, "11", false, true);
      }
    }

    //</editor-fold>

  //</editor-fold>

  //<editor-fold>-------------------------------STEP 11 (CHECKOUT)-------------------------------

  function stepElevenLogic(backwards, cb){
    //check previous step
    checkPreviousStep(3);

    //advance progress bar
    $(".progress").attr("value", 90);

    //if already premium, skip this step
    if (user.stripe_subscription_id && user.stripe_subscription){
      if (backwards){
        showSpecificStep(true, "10");
      }
      else {
        showSpecificStep(true, "12", false, true);
      }
    }
    else {
      //reset values of CC inputs
      $('#cc-num').val("");
      $('#cc-exp').val("");
      $('#cc-cvc').val("");

      //show step
      cb();
    }
  }

  function stepElevenSubmitFormLogic(form_elem){
    //console.log("step 11 specific form submission");

    form_elem.find(".onboarding-next-button").addClass('is-loading');
    $.ajax({
      url: "/profile/upgrade",
      method: "POST",
      data: {
        annual : $("#subscription-type-input").val() == "annual"
      }
    }).done(function(data){
      form_elem.find(".onboarding-next-button").removeClass('is-loading');
      if (data.state == "success"){
        if (data.user){
          user = data.user;
        }
        showSpecificStep(true, "12");
      }
      else {
        var error_msg = data.message || "Something went wrong with the payment! Please refresh the page and try again.";
        errorMessage(error_msg);
      }
    });
  }

  //</editor-fold>

  //<editor-fold>-------------------------------STEP FINAL-------------------------------

  //logic for after all steps are finished
  function finishedAllStepsLogic(cb){

    //advance progress bar
    $(".progress").attr("value", 100);

    //show all left menu buttons
    $(".menu-item").removeClass("is-hidden");

    //set the user.onboarding_step to 12 (so we don't get forced to this page again) and redirect to /dashboard
    $("#goto-tutorial-button").off().on("click", function(){
      setBackEndStep(12, function(){
        window.location = "/profile/dashboard";
      }, $(this));
    });

    //show final check
    $(".step-link").off("click");

    //set the user.onboarding_step to 12 (so we don't get forced to this page again) and redirect to /dashboard
    $("#skip-tutorial-button").off().on("click", function(){
      setBackEndStep(13, function(){
        window.location = "/profile/dashboard";
      }, $(this));
    });

    cb();
  }

  //</editor-fold>

//</editor-fold>

//<editor-fold>-------------------------------HELPERS-------------------------------

//modal close function
function closeModals(){
  clearNotification();
  $(".modal").find("input, textarea, select").val("");
  $(".modal").removeClass('is-active');
  $("#cancel-premium-button").addClass("is-disabled");
}

//get a URL query param by name
function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
  results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function updateQueryStringParam(key, value, push) {
  var baseUrl = [location.protocol, '//', location.host, location.pathname].join(''),
  urlQueryString = document.location.search,
  newParam = key + '=' + value,
  params = '?' + newParam;
  // If the "search" string exists, then build params from it
  if (urlQueryString) {
    updateRegex = new RegExp('([\?&])' + key + '[^&]*');
    removeRegex = new RegExp('([\?&])' + key + '=[^&;]+[&;]?');
    if( typeof value == 'undefined' || value == null || value == '' ) { // Remove param if value is empty
      params = urlQueryString.replace(removeRegex, "$1");
      params = params.replace( /[&;]$/, "" );
    } else if (urlQueryString.match(updateRegex) !== null) { // If param exists already, update it
      params = urlQueryString.replace(updateRegex, "$1" + newParam);
    } else { // Otherwise, add it to end of query string
      params = urlQueryString + '&' + newParam;
    }
  }
  params = (params == "?") ? "" : params;
  if (push){
    window.history.pushState({}, "", baseUrl + params);
  }
  else {
    window.history.replaceState({}, "", baseUrl + params);
  }
};

//</editor-fold>
