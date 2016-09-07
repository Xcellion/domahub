$(document).ready(function() {
	//used to display the message sent from the server
	if (typeof message != "undefined" && message){
		$("#message").text(message);
		if (message == "Invalid username / password!"){
			$('#modal-login').addClass('is-active');
			$("#message").css("color", "#ed1c24");
		}
	}

	//redirect search to the appropriate /listing page
	$("#searchbar-form").submit(function(e){
		e.preventDefault();
        window.location = window.location.origin + "/listing/" + $('#domain-name').val();
	});

	//modal stuff
	$('#login-modal').click(function() {
	  $('#modal-login').addClass('is-active');
	});

	$('.modal-close, .modal-background').click(function() {
	  $('#modal-login').removeClass('is-active');
	  $("#message").text("Please log in below");
	  $("#message").attr("style", "");
	});


	$(".nav-toggle").click(function() {
	  $(this).toggleClass("is-active");
	  $(".nav-menu").toggleClass("is-active");
	});

	//profile dropdown logic
	$(document).on("click", function(event) {
		//clicked off profile dropdown
		if (!$(event.target).closest("#profile-button").length && !$("#profile-dropdown").hasClass("is-hidden")) {
			$("#profile-dropdown").addClass("is-hidden");
			$("#profile-button").toggleClass("is-outlined is-active");
		}
		//clicked on profile dropdown
		else if ($(event.target).closest("#profile-button").length){
			$("#profile-button").toggleClass("is-outlined is-active");
			$("#profile-dropdown").toggleClass("is-hidden");
		}
	});

});
