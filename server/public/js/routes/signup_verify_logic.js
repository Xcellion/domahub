$(document).ready(function() {
	var can_submit = true;
	var can_verify = false;

    $("#verify-link").click(function(e) {
        e.preventDefault();
        if (can_verify){
            can_verify = false;
            $.ajax({
                type: "GET",
                url: "/verify"
            }).done(function(data){
                if (data.state == "success"){
                    $("#message").text("Please check your email for further instructions!");
					$("#form_to_hide, #resend").hide();
					$("#home").show();
                }
                else {
                    console.log(data);
                    $("#message").text("Something went wrong with the verification email!");
                }
            });
        }
    });

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
				else if (data.message == "Invalid token! Please click here to verify your account again!"){
					if (user){
						$("#message").html("Invalid token! Please click below to resend the verification email!");
						can_verify = true;
						$("#form_to_hide").hide();
						$("#resend").show();
					}
					else {
						$("#message").text("Invalid token! Please login and resend the verification email!");
						$("#form_to_hide").hide();
						$("#accept").show();
					}
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
