//on back button (show step and don't push to history)
window.onpopstate = function(event) {
  showSpecificStep(false);
};

$(document).ready(function() {

  //gets the current step from URL (or show first step) and dont add to history
  showSpecificStep(false);

  //<editor-fold>-------------------------------GENERIC STEP LOGIC-------------------------------

  //click next button to submit form for current step
  $(".onboarding-step-wrapper").on("submit", function(e){
    e.preventDefault();
    submitSpecificStepForm($(this).attr("id").replace("onboarding-step-", ""));
  });

  //go back a step
  $(".onboarding-prev-button").on("click", function(){
    showSpecificStep(true, $(this).closest(".onboarding-step-wrapper").prev(".onboarding-step-wrapper").attr("id").replace("onboarding-step-", ""));
  });

  //</editor-fold>

});

//<editor-fold>-------------------------------GENERIC STEP LOGIC-------------------------------

//shows a specific step or gets the current step from URL (or show first step)
//push = whether or not to add to history
function showSpecificStep(push, current_step){
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
  runStepSpecificLogic(current_step);
}

//runs step-specific logic for each step
function runStepSpecificLogic(step_number){
  switch (step_number){
    case ("1"):
      stepOneLogic();
      break;
    case ("2"):
      stepTwoLogic();
      break;
    case ("3"):
      stepThreeLogic();
      break;
    case ("4"):
      stepFourLogic();
      break;
    case ("5"):
      stepFiveLogic();
      break;
    case ("6"):
      stepSixLogic();
      break;
  }
}

//runs step-specific form submission
function submitSpecificStepForm(step_number){
  switch (step_number){
    case ("1"):
      stepOneSubmitFormLogic();
      break;
    case ("2"):
      stepTwoSubmitFormLogic();
      break;
    case ("3"):
      stepThreeSubmitFormLogic();
      break;
    case ("4"):
      stepFourSubmitFormLogic();
      break;
    case ("5"):
      stepFiveSubmitFormLogic();
      break;
    case ("6"):
      stepSixSubmitFormLogic();
      break;
    default:
      finishedAllStepsLogic();
      break;
  }
}

//logic for after all steps are finished
function finishedAllStepsLogic(){
  console.log("finished all steps!");
  $(".onboarding-step-wrapper").addClass('is-hidden');
  $("#final-step-wrapper").removeClass('is-hidden');
}

//</editor-fold>

//<editor-fold>-------------------------------STEP 1 (WELCOME MESSAGE)-------------------------------

function stepOneLogic(){
  console.log("step 1 specific logic");
}

function stepOneSubmitFormLogic(){
  console.log("step 1 specific form submission");

  //show step two
  showSpecificStep(true, "2");
}

//</editor-fold>

//<editor-fold>-------------------------------STEP 2 (PERSONAL DETAILS)-------------------------------

function stepTwoLogic(){
  console.log("step 2 specific logic");
}

function stepTwoSubmitFormLogic(){
  console.log("step 2 specific form submission");

  //ajax for submitting personal details
}

//</editor-fold>

//<editor-fold>-------------------------------STEP 3 (ADDRESS DETAILS)-------------------------------

function stepThreeLogic(){
  console.log("step 3 specific logic");
}

function stepThreeSubmitFormLogic(){
  console.log("step 3 specific form submission");
}

//</editor-fold>

//<editor-fold>-------------------------------STEP 4 ()-------------------------------

function stepFourLogic(){
  console.log("step 4 specific logic");
}

function stepFourSubmitFormLogic(){
  console.log("step 4 specific form submission");
}

//</editor-fold>

//<editor-fold>-------------------------------STEP 5 ()-------------------------------

function stepFiveLogic(){
  console.log("step 5 specific logic");
}

function stepFiveSubmitFormLogic(){
  console.log("step 5 specific form submission");
}

//</editor-fold>

//<editor-fold>-------------------------------STEP 6 ()-------------------------------

function stepSixLogic(){
  console.log("step 6 specific logic");
}

function stepSixSubmitFormLogic(){
  console.log("step 6 specific form submission");
}

//</editor-fold>
