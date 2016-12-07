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
		var domain_name = $('#domain-name').val();

		//default to .com if theres nothing provided
		if (domain_name.indexOf(".") == -1){
			domain_name += ".com";
			$('#domain-name').val(domain_name);
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

	var pages_white_nav = ["listings", "faq", "contact", "profile", "mission", "about", "press", "careers", "terms", "privacy"];
	var current_page = (window.location.pathname == "/") ? "/" : window.location.pathname.split("/")[1];

	//remove white link if not a page that needs it
	if (pages_white_nav.indexOf(current_page) != -1){
		$(".nav-link").removeClass("is-white");
		$(".logo-text").addClass("primary-logo-light").removeClass("is-white");
		$(".nav-menu").removeClass("is-dark").addClass("is-white");
		$(".nav-toggle").removeClass("is-white").addClass("is-black");
		$("#profile-button, #login-modal").addClass("is-primary").removeClass("is-white");
	}

	$(window).scroll(function(e){

		//before the top
		if ($(this).scrollTop() <= 0 && $(".nav").hasClass("has-shadow")) {
			$(".nav").removeClass("has-shadow is-white");
			if (pages_white_nav.indexOf(current_page) != -1){
				$(".nav-link").removeClass("is-white");
				$(".logo-text").addClass("primary-logo-light").removeClass("is-white");
			}
			else {
				$("#profile-button, #login-modal").removeClass("is-primary").addClass("is-white");
				$(".logo-text").removeClass("primary-logo-light").addClass("is-white");
				$(".nav-link").addClass("is-white");
				$(".nav-menu").removeClass("is-white").addClass("is-dark");
				$(".nav-toggle").removeClass("is-black").addClass("is-white");
			}
		}
		//past the top
		else if ($(this).scrollTop() > 0 && !$(".nav").hasClass("has-shadow")){
			$(".nav").addClass("has-shadow is-white");
			$(".nav-link").removeClass("is-white");
			$(".nav-menu").removeClass("is-dark").addClass("is-white");
			$(".nav-toggle").removeClass("is-white").addClass("is-black");
			$(".logo-text").addClass("primary-logo-light").removeClass("is-white");
			$("#profile-button, #login-modal").addClass("is-primary").removeClass("is-white");
		}
	});

});
