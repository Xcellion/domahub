$(document).ready(function() {

	//to catch empty emails, name, or passwords
	$('#target').submit(function(event){

		//if no email is entered
		if (!$("#email_input").val()) {
			$("#message").fadeOut(100, function(){
				$("#message").css("color", "#ed1c24").text("Please enter your email address!").fadeIn(100);
				console.log($("#email_input").focus().next().addClass("is-danger"));
			});
			return false;
		}

		//if no name is entered
		else if (!$("#fullname_input").val()) {
			$("#message").fadeOut(100, function(){
				$("#message").css("color", "#ed1c24").text("Please enter your name!").fadeIn(100);
			});
			return false;
		}

		//if no password is entered
		else if (!$("#pw_input").val()) {
			$("#message").fadeOut(100, function(){
				$("#message").css("color", "#ed1c24").text("Please enter your password!").fadeIn(100);
			});
			return false;
		}

		//if passwords do not match
		else if ($("#pw_input").val() != $("#verify_input").val()){
			$("#message").fadeOut(100, function(){
				$("#message").css("color", "#ed1c24").html("Passwords do not match!").fadeIn(100);
			});
			return false;
		}
	});
});
