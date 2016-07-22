$(document).ready(function() {

	//hide the choices until login
	$("#email_input").focus();

	$('#target').submit(function(event){
		//if no email is entered
		if (!$("#email_input").val()) {
			$("#sub_message").fadeOut(100, function(){
				$(this).css("color", "#ed1c24").html("Please enter your email address!").fadeIn(100);
				$("#email_input").focus();
			});
			//to prevent submission of the form
			return false;
		}

		//if no password is entered
		if (!$("#pw_input").val()) {
			$("#sub_message").fadeOut(100, function(){
				$(this).css("color", "#ed1c24").html("Please enter your password!").fadeIn(100);
				$("#pw_input").focus();
			});
			//to prevent submission of the form
			return false;
		}
	});

	if (!user){
		delete_cookie("type");
		delete_cookie("local_events");
	}
});
