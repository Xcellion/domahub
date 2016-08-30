$(document).ready(function() {
	// if (!$(".input").val()) {
	// 	$(".input").next().addClass("is-hidden");
	// 	$(".input").next().next().addClass("is-hidden");
	// };

	function validateEmail(email) {
	  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
	  return re.test(email);
	}

	$("#email_input").keyup(function() {
		if (validateEmail($(this).val())) {
			$(this).next().removeClass("is-hidden");
			$(this).next().next().addClass("is-hidden");
		}
		else if (!$(this).val()) {
			$(this).next().addClass("is-hidden");
			$(this).next().next().addClass("is-hidden");
		}
		else {
			$(this).next().addClass("is-hidden");
			$(this).next().next().removeClass("is-hidden");
		}
	});

	$("#fullname_input").keyup(function() {
		if ($(this).val().length >= 3) {
			$(this).next().removeClass("is-hidden");
			$(this).next().next().addClass("is-hidden");
		}
		else if (!$(this).val()) {
			$(this).next().addClass("is-hidden");
			$(this).next().next().addClass("is-hidden");
		}
		else {
			$(this).next().addClass("is-hidden");
			$(this).next().next().removeClass("is-hidden");
		}
	});

	$("#pw_input").keyup(function() {
		if ($(this).val() == $("#verify_pw").val()) {
			$("#verify_pw").next().removeClass("is-hidden");
			$("#verify_pw").next().next().addClass("is-hidden");
		}
		else if (!$(this).val()) {
			$("#verify_pw").next().addClass("is-hidden");
			$("#verify_pw").next().next().addClass("is-hidden");
		}
		else {
			$("#verify_pw").next().addClass("is-hidden");
			$("#verify_pw").next().next().removeClass("is-hidden");
		}
	});

	$("#verify_pw").keyup(function() {
		if ($("#pw_input").val() == $(this).val()) {
			$(this).next().removeClass("is-hidden");
			$(this).next().next().addClass("is-hidden");
		}
		else if (!$(this).val()) {
			$(this).next().addClass("is-hidden");
			$(this).next().next().addClass("is-hidden");
		}
		else {
			$(this).next().addClass("is-hidden");
			$(this).next().next().removeClass("is-hidden");
		}
	});

	//to catch empty emails, name, or passwords
	$('#target').submit(function(event){

		//if no email is entered
		if (!$("#email_input").val()) {
			$("#message").fadeOut(100, function(){
				$("#message").css("color", "#ed1c24").text("Please enter your email address!").fadeIn(100);
				$("#email_input").focus();
			});
			return false;
		}

		//if no name is entered
		else if (!$("#fullname_input").val()) {
			$("#message").fadeOut(100, function(){
				$("#message").css("color", "#ed1c24").text("Please enter your name!").fadeIn(100);
				$("#fullname_input").focus();
			});
			return false;
		}

		//if no password is entered
		else if (!$("#pw_input").val()) {
			$("#message").fadeOut(100, function(){
				$("#message").css("color", "#ed1c24").text("Please enter your password!").fadeIn(100);
				$("#pw_input").focus();
			});
			return false;
		}

		//if passwords do not match
		else if ($("#pw_input").val() != $("#verify_pw").val()){
			$("#message").fadeOut(100, function(){
				$("#message").css("color", "#ed1c24").html("Passwords do not match!").fadeIn(100);
				$("#pw_input").focus();
			});
			return false;
		}
	});
});
