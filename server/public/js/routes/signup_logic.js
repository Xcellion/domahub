$(document).ready(function() {

	//verify email
	$("#email-input").keyup(function(e) {
		//if correct email, show check
		if (validateEmail($(this).val())) {
			showSuccessDanger($(this), true);
		}
		else if ($(this).val().length == 0){
			showSuccessDanger($(this));
		}
		else {
			showSuccessDanger($(this), false);
		}
	});

	//prevent space in username
	$("input").keydown(function(e) {
		if (e.keyCode == 32){
			e.preventDefault();
			return false;
		}
	});

	//verify username
	$("#username-input").keyup(function(e) {
		name_length = $(this).val().length;
		name_val = $(this).val();
		if (name_val.includes(" ")){
			showSuccessDanger($(this), false);
		}
		else if (70 > name_length && name_length > 0) {
			showSuccessDanger($(this), true);
		}
		else if (name_length == 0){
			showSuccessDanger($(this));
		}
		else {
			showSuccessDanger($(this), false);
		}
	});

	//verify password input
	$("#pw-input").keyup(function() {
		pw_length = $(this).val().length;

		if (70 > pw_length && pw_length >= 6) {
			showSuccessDanger($(this), true);
		}
		else if (pw_length == 0){
			showSuccessDanger($(this));
		}
		else {
			showSuccessDanger($(this), false);
		}
	});

	//verify passwords are matching
	$("#verify-pw").keyup(function() {
		if ($("#pw-input").val().length > 0 && $("#pw-input").val() == $(this).val()) {
			showSuccessDanger($(this), true);
		}
		else if ($(this).val().length == 0){
			showSuccessDanger($(this));
		}
		else {
			showSuccessDanger($(this), false);
		}
	});

	//to catch empty emails, name, or passwords
	$('#target').submit(function(event){

		//if no email is entered
		if (!$("#email-input").val()) {
			$("#message").fadeOut(100, function(){
				$("#message").css("color", "#ed1c24").text("Please enter your email address!").fadeIn(100);
				$("#email-input").focus();
				showSuccessDanger($("#email-input"), false);
			});
			return false;
		}

		//if no name is entered
		else if (!$("#username-input").val() || $("#username-input").val().length > 70 || $("#username-input").val().includes(" ")) {
			$("#message").fadeOut(100, function(){
				$("#message").css("color", "#ed1c24").text("Please enter a valid name!").fadeIn(100);
				$("#username-input").focus();
				showSuccessDanger($("#username-input"), false);
			});
			return false;
		}

		//if no password is entered
		else if (!$("#pw-input").val()) {
			$("#message").fadeOut(100, function(){
				$("#message").css("color", "#ed1c24").text("Please enter a password!").fadeIn(100);
				$("#pw-input").focus();
				showSuccessDanger($("#pw-input"), false);
			});
			return false;
		}

		//if password is too short or long
		else if ($("#pw-input").val().length > 70 || $("#pw-input").val().length < 6) {
			$("#message").fadeOut(100, function(){
				$("#message").css("color", "#ed1c24").text("Please enter a valid password!").fadeIn(100);
				$("#pw-input").focus();
				showSuccessDanger($("#pw-input"), false);
			});
			return false;
		}

		//if passwords do not match
		else if ($("#pw-input").val() != $("#verify-pw").val()){
			$("#message").fadeOut(100, function(){
				$("#message").css("color", "#ed1c24").html("Passwords do not match!").fadeIn(100);
				$("#pw-input").focus();
				showSuccessDanger($("#verify-pw"), false);
			});
			return false;
		}

		//if recaptcha is not done
		else if (validateform()){
			$("#message").fadeOut(100, function(){
				$("#message").css("color", "#ed1c24").html("Please prove you're not a robot!").fadeIn(100);
			});
			return false;
		}

	});
});

//to validate recaptcha client side
function validateform(){
	var captcha_response = grecaptcha.getResponse();
	return captcha_response.length == 0;
}

//helper function to hide or show checkmark / x-mark
function showSuccessDanger(elem, bool){
	//if bool = true, show check mark
	if (bool == true){
		elem.siblings(".is-success").removeClass("is-hidden");
		elem.siblings(".is-danger").addClass("is-hidden");
	}
	else if (typeof bool == "undefined"){
		elem.siblings(".is-success").addClass("is-hidden");
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
