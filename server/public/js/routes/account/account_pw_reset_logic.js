var can_submit = true;

$(document).ready(function() {

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
		if ($("#pw-input").val() == $(this).val()) {
			showSuccessDanger($(this), true);
		}
		else if ($(this).val().length == 0){
			showSuccessDanger($(this));
		}
		else {
			showSuccessDanger($(this), false);
		}
	});

	$('#login-form').submit(function(event){
		event.preventDefault();

		//if no password is entered
		if (!$("#pw-input").val()) {
			$("#message").fadeOut(100, function(){
				$("#message").css("color", "#ed1c24").text("Please enter a password!").fadeIn(100);
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
		else {
			can_submit = false;

			$.ajax({
				type: "POST",
				url: window.location.pathname,
				data: {
					password: $("#pw-input").val()
				}
			}).done(function(data){
				//reset the data
				$("#pw-input").val("");
				$("#verify-pw").val("");

				if (data.state == "success"){
					$("#message").removeAttr("style").text("Success! You may log in with your new password!");
					$("#form_to_hide").hide();
					$("#accept").show();
				}
				else if (data.message == "Invalid token! Please click here to reset your password again!"){
					$("#message").html("Invalid token! Please click <a href='/forgot'>here</a> to reset your password again!");
				}
				else {
					console.log(data);
					can_submit = true;
					$("#message").html(data.message);
				}
			});
		}
	});
});

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
