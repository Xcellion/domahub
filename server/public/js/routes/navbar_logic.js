$(document).ready(function() {
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
	  $("#message").text("Please log in below");
	  $("#message").attr("style", "");
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
