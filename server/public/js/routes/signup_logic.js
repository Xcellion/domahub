$(document).ready(function() {

	//verify email
	$("#email_input").keyup(function(e) {
		//if correct email, show check
		if (validateEmail($(this).val())) {
			successDanger(true, $(this));
		}
		else {
			successDanger(false, $(this));
		}
	});

	$("#fullname_input").keyup(function() {
		//if not blank
		if ($(this).val().length > 0) {
			successDanger(true, $(this));
		}
		else {
			successDanger(false, $(this));
		}
	});

	$("#verify_pw").keyup(function() {
		if ($("#pw_input").val() == $(this).val()) {
			successDanger(true, $(this));
		}
		else {
			successDanger(false, $(this));
		}
	});

	//to catch empty emails, name, or passwords
	$('#target').submit(function(event){

		//if no email is entered
		if (!$("#email_input").val()) {
			$("#message").fadeOut(100, function(){
				$("#message").css("color", "#ed1c24").text("Please enter your email address!").fadeIn(100);
				$("#email_input").focus();
			});
			return false;
		}

		//if no name is entered
		else if (!$("#fullname_input").val()) {
			$("#message").fadeOut(100, function(){
				$("#message").css("color", "#ed1c24").text("Please enter your name!").fadeIn(100);
				$("#fullname_input").focus();
			});
			return false;
		}

		//if no password is entered
		else if (!$("#pw_input").val()) {
			$("#message").fadeOut(100, function(){
				$("#message").css("color", "#ed1c24").text("Please enter your password!").fadeIn(100);
				$("#pw_input").focus();
			});
			return false;
		}

		//if passwords do not match
		else if ($("#pw_input").val() != $("#verify_pw").val()){
			$("#message").fadeOut(100, function(){
				$("#message").css("color", "#ed1c24").html("Passwords do not match!").fadeIn(100);
				$("#pw_input").focus();
			});
			return false;
		}
	});
});

//helper function to hide or show checkmark / x-mark
function successDanger(bool, elem){
	//if bool = true, show check mark
	if (bool){
		elem.siblings(".is-success").removeClass("is-hidden");
		elem.siblings(".is-danger").addClass("is-hidden");
	}
	else {
		elem.siblings(".is-success").addClass("is-hidden");
		elem.siblings(".is-danger").removeClass("is-hidden");
	}
}

//helper function to validate email address
function validateEmail(email) {
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}
