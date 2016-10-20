$(document).ready(function() {
	var can_submit = true;

	//click to verify
	$('#login-form').submit(function(event){
		event.preventDefault();

		if (can_submit){
			can_submit = false;
			$.ajax({
				type: "POST",
				url: window.location.pathname
			}).done(function(data){
				if (data.state == "success"){
					$("#message").text("Success! You account has been verified!");
					$("#form_to_hide").hide();
					$("#accept").show();
				}
				//token was wrong
				else if (data.message == "Invalid token! Please click here to verify your account again!"){
					$("#message").text("Invalid token! Please login and resend the verification email.");
					$("#form_to_hide").hide();
					$("#accept").show();
				}
				else {
					console.log(data);
					can_submit = true;
					$("#message").text(data.message);
				}
			});
		}

	});
});
