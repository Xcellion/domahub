$(document).ready(function() {

	// Calling Login Form
	$("#login_link").click(function() {
			$("#register_form").hide();
			$("#login_form").show();
			location.assign("/test/login.html");
			return false;
	});

	// Calling Register Form
	$("#register_link").click(function() {
			$("#login_form").hide();
			$("#register_form").show();
			location.assign("/signup");
			return false;
	});

	$('#target').submit(function(event){
		//if no email is entered
		if (!$("#email_input").val()) {
			$("#message").html("Please enter your email address!");
			$("#email_input").focus();
			//to prevent submission of the form
			return false;
		}

		//if email is not valid
		else if (!validateEmail($("#email_input").val())){
			$("#message").html("Please enter a valid email address!").fadeIn(100);
			$("#email_input").focus();
			//to prevent submission of the form
			return false;
		}

		//if no password is entered
		else if (!$("#pw_input").val()) {
			$("message").html("Please enter your password!").fadeIn(100);
			$("#pw_input").focus();
			//to prevent submission of the form
			return false;
		}

		//if passwords do not match
		else if ($("#pw_input").val() != $("#verify_input").val()){
			$("#message").html("Passwords do not match!").fadeIn(100);
			$("#pw_input").focus();
			//to prevent submission of the form
			return false;
		}
	});
});

function validateEmail(email) {
    var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    return re.test(email);
}
