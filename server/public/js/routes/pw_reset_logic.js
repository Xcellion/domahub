var can_submit = true;

$(document).ready(function() {

	//verify fullname
	$("#pw_input").keyup(function() {
		//if not blank
		if ($(this).val().length > 0) {
			showSuccessDanger($(this), true);
		}
		else if ($(this).val().length == 0){
			showSuccessDanger($(this));
		}
		else {
			showSuccessDanger($(this), false);
		}
	});

	//verify passwords are matching
	$("#verify_pw").keyup(function() {
		if ($("#pw_input").val() == $(this).val()) {
			showSuccessDanger($(this), true);
		}
		else if ($(this).val().length == 0){
			showSuccessDanger($(this));
		}
		else {
			showSuccessDanger($(this), false);
		}
	});

	$('#login_form').submit(function(event){
		event.preventDefault();

		//if no password is entered
		if (!$("#pw_input").val()) {
			$("#message").fadeOut(100, function(){
				$("#message").css("color", "#ed1c24").text("Please enter a password!").fadeIn(100);
				$("#pw_input").focus();
				showSuccessDanger($("#pw_input"), false);
			});
			return false;
		}

		//if passwords do not match
		else if ($("#pw_input").val() != $("#verify_pw").val()){
			$("#message").fadeOut(100, function(){
				$("#message").css("color", "#ed1c24").html("Passwords do not match!").fadeIn(100);
				$("#pw_input").focus();
				showSuccessDanger($("#verify_pw"), false);
			});
			return false;
		}
		else {
			can_submit = false;

			$.ajax({
				type: "POST",
				url: window.location.pathname,
				data: {
					password: $("#pw_input").val()
				}
			}).done(function(data){
				//reset the data
				$("#pw_input").val("");
				$("#verify_pw").val("");

				if (data.state == "success"){
					$("#message").text("Success! You may log in with your new password!");
					$("#form_to_hide").hide();
					$("#accept").show();
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
