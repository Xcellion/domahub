$(document).ready(function() {

	//to catch empty emails or empty passwords
	$('#target').submit(function(event){

		//if no email is entered
		if (!$("#email").val()) {
			$("#message").fadeOut(100, function(){
				$("#message").css("color", "#ed1c24").html("Please enter your email address!").fadeIn(100);
			});
			return false;
		}

		//if no password is entered
		if (!$("#password").val()) {
			$("#message").fadeOut(100, function(){
				$("#message").css("color", "#ed1c24").html("Please enter your password!").fadeIn(100);
			});
			return false;
		}
	});

});
