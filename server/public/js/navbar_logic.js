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
		var domain_name = $('#domain-name').val()

		//default to .com if theres nothing provided
		if (domain_name.indexOf(".") == -1){
			domain_name += ".com";
		}

        window.location = window.location.origin + "/listing/" + domain_name;
	});

	// adds is-active to login button
	$('#login-modal').click(function() {
	  $('#modal-login').addClass('is-active');
	});

	// various ways to close login dropdown menu
	$('.modal-close, .modal-background').click(function() {
	  $('#modal-login').removeClass('is-active');
	  $("#message").text("Please log in below");
	  $("#message").attr("style", "");
	});

	$(document).keyup(function(e) {
		if (e.which == 27) {
			$('#modal-login').removeClass('is-active');
		}
	});

	//hamburger toggle button
	$(".nav-toggle").click(function() {
	  $(this).toggleClass("is-active");
	  $(".nav-menu").toggleClass("is-active");
	});

	//profile dropdown logic
	$(document).on("click", function(event) {
		//clicked off profile dropdown
		if (!$(event.target).closest("#profile-button").length && !$("#profile-dropdown").hasClass("is-hidden")) {
			if (!$(".nav").hasClass("is-white")){
				$("#profile-button").toggleClass("is-outlined");
			}
			$("#profile-dropdown").addClass("is-hidden");
			$("#profile-button").toggleClass("is-active");
		}
		//clicked on profile dropdown
		else if ($(event.target).closest("#profile-button").length){
			if (!$(".nav").hasClass("is-white")){
				$("#profile-button").toggleClass("is-outlined");
			}
			$("#profile-button").toggleClass("is-active");
			$("#profile-dropdown").toggleClass("is-hidden");
		}
	});

	var pages_white_nav = ["listings", "faq", "contact", "getstarted"];
	var current_page = (window.location.pathname == "/") ? "/" : window.location.pathname.split("/")[1];

	if (pages_white_nav.indexOf(current_page) != -1){
		navbar_white(true);
	}
	else {
		$(window).scroll(function(e){

			//before the top
			if ($(this).scrollTop() <= 0 && $(".nav").hasClass("has-shadow")) {
				navbar_white(false);
			}
			//past the top
			else if ($(this).scrollTop() > 0 && !$(".nav").hasClass("has-shadow")){
				navbar_white(true);
			}
		});
	}

});

//function to toggle navbar with white background
function navbar_white(bool){
	if (bool){
		$(".nav").addClass("has-shadow is-white");
		$(".nav-link").removeClass("white-link");
	}
	else {
		$(".nav").removeClass("has-shadow is-white");
		$(".nav-link").addClass("white-link");
	}
}
