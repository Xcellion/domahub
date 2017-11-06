$(document).ready(function() {

  //<editor-fold>-------------------------------SHOW SECTION-------------------------------

  //function to show section depending on url
  showSectionByURL();

  //add to history object depending on which table i clicked
  $(".tab").click(function(e){
    e.preventDefault();

    var temp_id = $(this).attr("id");
    temp_id = temp_id.substr(0, temp_id.length - 4);
    if(history.pushState) {
      history.pushState(null, null, '#' + temp_id);
    }
    else {
      location.hash = '#' + temp_id;
    }
    showSection(temp_id);
  });

  //</editor-fold>

  //<editor-fold>-------------------------------ACCOUNT INFO-------------------------------

  //to show submit/cancel when data changes for account inputs
  $(".account-input").on("input", function(e){
    if ($(this).val() != user[$(this).data("uservar")] && user[$(this).data("uservar")]){
      $("#account-submit, #account-cancel").removeClass("is-hidden");
      $(".tab").last().addClass("sub-tabs");
    }
    else {
      $("#account-submit, #account-cancel").addClass("is-hidden");
      $(".tab").last().removeClass("sub-tabs");
    }
  });

  //to submit any changes
  $("#account-submit").on("click", function(e){
    submitChanges(checkAccountSettings());
  });

  //to cancel any changes
  $("#account-cancel").on("click", function(e){
    cancelChanges();
  });

  //</editor-fold>

  //<editor-fold>-------------------------------PASSWORD CHANGE-------------------------------

  //change password modal
  $("#change-password-button").on("click", function(){
    $("#change-password-modal").addClass('is-active');
    $("#old-pw-input").focus();
  });

  //submit password change
  $("#password-submit").on("click", function(e){
    submitChanges(checkAccountPassword());
  });

  //reset password inputs on modal close
  $(".modal-close, .modal-background, .cancel-modal").on("click", function(){
    cancelChanges();
  });
  $(document).on("keyup", function(e) {
    if (e.which == 27) {
      cancelChanges();
    }
  });

  //</editor-fold>

});

//<editor-fold>-------------------------------SHOW SECTION-------------------------------

//function that runs when back button is pressed
window.onpopstate = function(event) {
  showSectionByURL();
}

//function to show a specific section
function showSection(section_id){
  $(".tab").removeClass("is-active");
  $("#" + section_id + "-tab").addClass("is-active");
  var temp_section = $("#" + section_id);
  $(".drop-tab").not(temp_section).addClass("is-hidden");
  temp_section.removeClass("is-hidden");

  //get AJAX for promo codes if we havent yet
  if (section_id == "premium") {
    if (!user.referrals){
      $.ajax({
        url: "/profile/getreferrals",
        method: "POST"
      }).done(function(data){
        if (data.state == "success"){
          user = data.user;
        }

        createReferralsTable();
      });
    }
    else {
      createReferralsTable();
    }
  }
}

//function to show a specific section when loading the page;
function showSectionByURL(){
  var temp_hash = location.hash.split("#")[1];
  var array_of_ids = $(".drop-tab").map(function(index) {
    return $(this).attr("id");
  }).toArray();

  if (array_of_ids.indexOf(temp_hash) == -1){
    showSection("account");
    window.history.replaceState({}, "", "/profile/settings#account");
  }
  else {
    showSection(temp_hash);
  }
}

//</editor-fold>

//<editor-fold>-------------------------------REFERRALS-------------------------------

//function to create the referrals table
function createReferralsTable(){
  if (user.referrals && user.referrals.length > 0){
    $(".referral-row:not(#referral-clone)").remove();

    for (var x = 0 ; x < user.referrals.length ; x++){
      var referral_clone = $("#referral-clone").clone().removeAttr("id");

      referral_clone.find(".referral-username").text(user.referrals[x].username);
      referral_clone.find(".referral-created").text(moment(user.referrals[x].date_created).format("MMMM DD, YYYY"));
      referral_clone.find(".referral-redeemed").text((user.referrals[x].date_accessed) ? moment(user.referrals[x].date_accessed).format("MMMM DD, YYYY") : "-");

      $("#referral-table").append(referral_clone);
    }

    $(".referral-row:not(#referral-clone)").removeClass('is-hidden');
  }
  else {
    $("#no-referrals").removeClass('is-hidden');
  }
}

//</editor-fold>

//<editor-fold>-------------------------------SUBMIT ACCOUNT CHANGES-------------------------------

//function to submit account changes AJAX
function submitChanges(submit_data){
  if (submit_data){
    $("#account-submit").addClass('is-loading');
    $.ajax({
      url: "/profile/settings",
      method: "POST",
      data: submit_data
    }).done(function(data){
      $("#account-submit").removeClass('is-loading');
      if (data.state == "success"){
        successMessage("Successfully updated account settings!");
        user = data.user;
      }
      else {
        errorMessage(data.message);
      }
      cancelChanges();
    });
  }
}

//function to check new account settings
function checkAccountSettings(){
  //if no email is entered
  if (!validateEmail($("#email-input").val())) {
    errorMessage("Please enter a valid email address!");
  }
  //if username is not legit
  else if (!$("#username-input").val() || $("#username-input").val().length < 3 || $("#username-input").val().length > 70 || $("#username-input").val().includes(" ")) {
    errorMessage("Please enter a valid username!");
  }
  else {
    return {
      new_email: $("#email-input").val(),
      username: $("#username-input").val()
    };
  }
}

//function to check new account passwords
function checkAccountPassword(){
  //no passwords entered
  if (!$("#old-pw-input").val()){
    errorMessage("Please enter your old password!");
  }
  else if (!$("#new-pw-input").val() || !$("#verify-pw-input").val()){
    errorMessage("Please enter a new password to change to!");
  }
  //if new password is too short or long
  else if ($("#new-pw-input").val() && ($("#new-pw-input").val().length > 70 || $("#new-pw-input").val().length < 6)) {
    errorMessage("Please enter a password at least 6 characters long!");
  }
  //if new passwords do not match
  else if ($("#new-pw-input").val() && $("#new-pw-input").val() != $("#verify-pw-input").val()){
    errorMessage("Your new passwords do not match!");
  }
  else {
    return {
      password: $("#old-pw-input").val(),
      new_password: ($("#new-pw-input").val() == "") ? undefined : $("#new-pw-input").val()
    };
  }
}

//function to cancel changes
function cancelChanges(){
  clearNotification();
  $("#account-submit, #account-cancel").addClass("is-hidden");
  $(".account-input").each(function(){
    $(this).val(user[$(this).data("uservar")]);
  });

  //clear modal inputs
  $(".modal-input").val("");
}

//</editor-fold>

//<editor-fold>-------------------------------HELPERS-------------------------------

//helper function to validate email address
function validateEmail(email) {
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

//</editor-fold>
