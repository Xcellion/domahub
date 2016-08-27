$(document).ready(function() {

	//to catch empty emails or empty passwords
	$('#target').submit(function(event){

		//if no email is entered
		if (!$("#email").val()) {
			$("#message").fadeOut(100, function(){
				$("#message").css("color", "#ed1c24").html("Please enter your email address!").fadeIn(100);
				$("#email").focus();
			});
			//to prevent submission of the form
			return false;
		}

		//if no password is entered
		if (!$("#password").val()) {
			$("#message").fadeOut(100, function(){
				$("#message").css("color", "#ed1c24").html("Please enter your password!").fadeIn(100);
				$("#password").focus();
			});
			//to prevent submission of the form
			return false;
		}
	});

	//used to display the message sent from the server
	if (typeof message != "undefined" && message){
		$("#message").text(message);
		if (message == "Invalid username / password!"){
			$('#modal_login').addClass('is-active');
			$("#message").css("color", "#ed1c24");
		}
	}

	//redirect search to the appropriate /listing page
	$("#searchbar_form").submit(function(e){
		e.preventDefault();
        window.location = window.location.origin + "/listing/" + $('#domain_name').val();
	});

	//modal stuff
	$('#login_modal').click(function() {
	  $('#modal_login').addClass('is-active');
	});

	$('.modal-close, .modal-background').click(function() {
	  $('#modal_login').removeClass('is-active');
	});

	//profile logic
	$("#profile_button").click(function() {
	  $(this).toggleClass("is-outlined is-active");
	  $("#profile_dropdown").toggleClass("is-active");
	});

	$(".nav-toggle").click(function() {
	  $(this).toggleClass("is-active");
	  $(".nav-menu").toggleClass("is-active");
	});
});
