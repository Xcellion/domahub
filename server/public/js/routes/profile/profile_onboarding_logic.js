//on back button (show step but don't push to history)
window.onpopstate = function(event) {
  showSpecificStep(false);
};

//keep track of the method used to create domains (manual vs registrar connect)
var domain_created_by = "";

$(document).ready(function() {

  //<editor-fold>-------------------------------PAGE SETUP-------------------------------

  //gets the current step from URL (or show first step) and dont add to history
  showSpecificStep(false);

  //pre-fill any existing user stripe information
  if (user.stripe_account){
    for (var x in user.stripe_account){
      $("#" + x + "-input").val(user.stripe_account[x]);
    }
  }

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

  //<editor-fold>-------------------------------GENERIC STEP LOGIC-------------------------------

  //click next button to submit form for current step
  $(".onboarding-step-form").on("submit", function(e){
    e.preventDefault();
    //some vars to remember
    var currentProgress = parseFloat($(".progress").attr("value"));
    var currentStep = $(this).closest(".onboarding-step-wrapper");
    //progress the bar
    $(".progress").attr("value", currentProgress + 10);

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

  //</editor-fold>

});

//<editor-fold>-------------------------------GENERIC STEP LOGIC-------------------------------

//shows a specific step or gets the current step from URL (or show first step)
//push = whether or not to add to history
function showSpecificStep(push, current_step, backwards){

  //hide all left menu buttons (except setup wizard)
  $(".menu-item:not(#onboarding-left-tab-wrapper)").addClass("is-hidden");

  var url_step = getParameterByName("step");

  //if no defined step in function params, then get URL or 1
  if (!current_step){
    current_step = (url_step) ? url_step : "1";
  }

  //non-existant step
  if (url_step != "final" && (url_step >= $(".onboarding-step-wrapper").length || !Number.isInteger(parseInt(url_step)))){
    current_step = "1";
  }

  //update URL
  updateQueryStringParam("step", current_step, push);

  //show specific step and run logic
  $(".onboarding-step-wrapper").addClass('is-hidden');
  $("#onboarding-step-" + current_step).removeClass('is-hidden');
  runStepSpecificLogic(current_step, backwards);
}

//runs step-specific logic for each step
function runStepSpecificLogic(step_number, backwards){
  clearNotification();
  switch (step_number){
    case ("1"):
      stepOneLogic(backwards);
      break;
    case ("2"):
      stepTwoLogic(backwards);
      break;
    case ("3"):
      stepThreeLogic(backwards);
      break;
    case ("4"):
      stepFourLogic(backwards);
      break;
    case ("5"):
      stepFiveLogic(backwards);
      break;
    case ("6"):
      stepSixLogic(backwards);
      break;
    case ("7"):
      stepSevenLogic(backwards);
      break;
    case ("8"):
      stepEightLogic(backwards);
      break;
    case ("9"):
      stepNineLogic(backwards);
      break;
    case ("10"):
      stepTenLogic(backwards);
      break;
    case ("11"):
      stepElevenLogic(backwards);
      break;
    default:
      finishedAllStepsLogic();
      break;
  }
}

//runs step-specific form submission
function submitSpecificStepForm(form_elem, step_number){
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
  }
}

//</editor-fold>

//<editor-fold>-------------------------------STEP 1 (WELCOME MESSAGE)-------------------------------

function stepOneLogic(backwards){
  console.log("step 1 specific logic");
}

function stepOneSubmitFormLogic(form_elem){
  console.log("step 1 specific form submission");

  //show next step
  showSpecificStep(true, "2");
}

//</editor-fold>

//<editor-fold>-------------------------------STEP 2 (PERSONAL DETAILS)-------------------------------

function stepTwoLogic(backwards){
  console.log("step 2 specific logic");
}


function stepTwoSubmitFormLogic(form_elem){
  console.log("step 2 specific form submission");

  //show next step
  showSpecificStep(true, "3");
}

//</editor-fold>

//<editor-fold>-------------------------------STEP 3 (ADDRESS DETAILS)-------------------------------

function stepThreeLogic(backwards){
  console.log("step 3 specific logic");
}

function stepThreeSubmitFormLogic(form_elem){
  console.log("step 3 specific form submission");

  //ajax for submitting personal details
  form_elem.find(".onboarding-next-button").addClass('is-loading');
  $.ajax({
    url: "/profile/payout",
    method: "POST",
    data: form_elem.add(form_elem.prev(".onboarding-step-wrapper")).serialize()
  }).done(function(data){
    form_elem.find(".onboarding-next-button").removeClass("is-loading");
    if (data.state == "success"){
      if (data.user){
        user = data.user;
      }
      showSpecificStep(true, "4");
    }
    else {
      errorMessage(data.message);
    }
  });
}

//</editor-fold>

//<editor-fold>-------------------------------STEP 4 (BANK ACCOUNT)-------------------------------

function stepFourLogic(backwards){
  console.log("step 4 specific logic");

  //if we dont have a stripe account, skip bank account
  if (!user.stripe_account && !user.stripe_account_id){
    if (backwards){
      showSpecificStep(true, "3");
    }
    else {
      showSpecificStep(true, "5");
    }
  }

  //reset any existing values
  $(".excess-routing-input").val("");
  $(".excess-routing-wrapper, #account-wrapper").addClass('is-hidden');
  $("#currency-input").val("");
  $("#bank_country-input").val("");
}

function stepFourSubmitFormLogic(form_elem){
  console.log("step 4 specific form submission");

  form_elem.find(".onboarding-next-button").addClass('is-loading');
  var bank_info = {
    country: $('#bank_country-input').val(),
    currency: $('#currency-input').val(),
    account_number: $('#account_number-input').val()
  }

  //different routing number according to country codes
  if ($("#account_routing-wrapper").is(":visible")) {
    bank_info.routing_number = $('#account_routing-input').val().toString() + $('#account_routing2-input').val().toString();
  }
  if ($("#account_routing3-wrapper").is(":visible")) {
    bank_info.account_holder_name = $('#account_routing3-input').val().toString();
  }

  //create stripe token
  Stripe.bankAccount.createToken(bank_info, function(status, response){
    if (status != 200){
      form_elem.find(".onboarding-next-button").removeClass('is-loading');
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
    form_elem.find(".onboarding-next-button").removeClass('is-loading');
    if (data.state == "success"){
      if (data.user){
        user = data.user;
      }
      $("#change-bank-modal").removeClass('is-active');
      if (updating_bank){
        showSpecificStep(true, "5");
      }
      else {
        showSpecificStep(true, "5");
      }
    }
    else {
      errorMessage(data.message);
    }
  });
}

//</editor-fold>

//<editor-fold>-------------------------------STEP 5 (PAYPAL)-------------------------------

function stepFiveLogic(backwards){
  console.log("step 5 specific logic");
}

function stepFiveSubmitFormLogic(form_elem){
  console.log("step 5 specific form submission");

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
      showSpecificStep(true, "6");
    }
    else {
      errorMessage(data.message);
    }
  });
}

//</editor-fold>

//<editor-fold>-------------------------------STEP 6 (PREMIUM)-------------------------------

function stepSixLogic(backwards){
  console.log("step 6 specific logic");

  //if already premium, skip this step
  if (user.stripe_subscription_id && user.stripe_subscription){
    if (backwards){
      showSpecificStep(true, "5");
    }
    else {
      showSpecificStep(true, "7");
    }
  }
  else {
    //reset values of CC inputs
    $('#cc-num').val("");
    $('#cc-exp').val("");
    $('#cc-cvc').val("");
  }
}

function stepSixSubmitFormLogic(form_elem){
  console.log("step 6 specific form submission");

  form_elem.find(".onboarding-next-button").addClass('is-loading');
  $.ajax({
    url: "/profile/upgrade",
    method: "POST",
    data: {
      annual : $("#subscription-type-input").val() == "annual"
    }
  }).done(function(data){
    console.log(data);
    form_elem.find(".onboarding-next-button").removeClass('is-loading');
    if (data.state == "success"){
      if (data.user){
        user = data.user;
      }
      // showSpecificStep(true, "7");
    }
    else {
      var error_msg = data.message || "Something went wrong with the payment! Please refresh the page and try again.";
      errorMessage(error_msg);
    }
  });
}

//</editor-fold>

//<editor-fold>-------------------------------STEP 7 (ACCOUNT SETUP FINISHED)-------------------------------

function stepSevenLogic(backwards){
  console.log("step 7 specific logic");
  $("#go-step-8, #go-step-9").off().on("click", function() {
    if ($(this).attr("id") == "go-step-8") {
      showSpecificStep(true, "8");
    }
    else {
      showSpecificStep(true, "9");
    }
  });
}

function stepSevenSubmitFormLogic(form_elem){
  console.log("step 7 specific form submission");
}

//</editor-fold>

//<editor-fold>-------------------------------STEP 8 (CONNECT REGISTRAR)-------------------------------

function stepEightLogic(backwards){
  console.log("step 8 specific logic");

  updateRegistrars();
}

function stepEightSubmitFormLogic(form_elem){
  console.log("step 8 specific form submission");

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
          infoMessage("We couldn't find any unlisted domains in your connected registrars! If there is something wrong, please <a class='is-underlined contact-link' href='/contact'>contact us</a> for assistance!");
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

function stepNineLogic(backwards){
  console.log("step 9 specific logic");

  if (backwards && domain_created_by == "connect"){
    showSpecificStep(true, "8");
  }
}

function stepNineSubmitFormLogic(form_elem){
  console.log("step 9 specific form submission");

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

function stepTenLogic(backwards){
  console.log("step 10 specific logic");

  //if we refreshed and came to this step, show step 8 instead
  if (domain_created_by == ""){
    showSpecificStep(true, "8");
  }
}

function stepTenSubmitFormLogic(form_elem){
  console.log("step 10 specific form submission");

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
      infoMessage("Now creating listings...this process could take a long time. Do not refresh the page or close the browser when creating a large set of listings.");
      $.ajax({
        url: "/listings/create",
        method: "POST",
        data: {
          domains: domains
        }
      }).done(function(data){
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
      $("#total-created-listings").text(success_amount);
      showSpecificStep(true, "final");
    }
  }

  //</editor-fold>

//</editor-fold>

//<editor-fold>-------------------------------STEP FINAL-------------------------------

//logic for after all steps are finished
function finishedAllStepsLogic(){
  console.log("finished all steps!");

  //show all left menu buttons (MAKE THIS DYNAMIC)
  $(".menu-item").removeClass("is-hidden");

  //mark account as having finished
  // $.ajax({
  //   url: "/profile/welcome/finished",
  //   method: "POST",
  // }).done(function(data){
  //   if (data.state == "success" && data.user){
  //     user = data.user;
  //   }
  // });
}

//</editor-fold>
