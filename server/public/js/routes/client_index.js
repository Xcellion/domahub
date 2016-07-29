$(document).ready(function() {

	//hide the choices until login
	$("#username").focus();

	$('#target').submit(function(event){
		//if no email is entered
		if (!$("#username").val()) {
			$("#message").fadeOut(100, function(){
				$(this).css("color", "#ed1c24").html("Please enter your email address!").fadeIn(100);
				$("#username").focus();
			});
			//to prevent submission of the form
			return false;
		}

		//if no password is entered
		if (!$("#password").val()) {
			$("#password").fadeOut(100, function(){
				$(this).css("color", "#ed1c24").html("Please enter your password!").fadeIn(100);
				$("#pw_input").focus();
			});
			//to prevent submission of the form
			return false;
		}
	});

	//used to delete any old cookies set from renting a domain
	if (typeof user == "undefined"){
		delete_cookie("type");
		delete_cookie("local_events");
	}

	//used to display the message sent from the server
	if (typeof message != "undefined"){
		$("#message").text(message);
	}
});
