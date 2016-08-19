$(document).ready(function() {
	$('#target').submit(function(event){
		//if no email is entered
		if (!$("#email").val()) {
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
		delete_cookies();
	}

	//used to display the message sent from the server
	if (typeof message != "undefined" && message){
		$("#message").text(message);
	}

	$("#searchbar_form").submit(function(e){
		e.preventDefault();
        window.location = window.location.origin + "/listing/" + $('#domain_name').val();;
	})
});
