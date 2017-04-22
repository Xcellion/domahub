$(document).ready(function() {
	//only if navbar is there
	if ($("#navbar").length > 0){

		//used to display the message sent from the server
		if (typeof message != "undefined" && message){
			$("#message").text(message);
			if (message == "Invalid username / password!" || message == "Login error!"){
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
		$('.login-modal').click(function() {
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

		//close modal if user is logged in
		if (user){
			$("#login_modal").removeAttr("style");
		}

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

		//list of pages that need a green doma logo // white background. otherwise transparent and white logo
		var pages_white_nav = ["checkout", "listings", "faq", "contact", "profile", "mission", "about", "press", "careers", "terms", "privacy", "nothinghere"];
		var current_page = (window.location.pathname == "/") ? "/" : window.location.pathname.split("/")[1];

		if (window.location.pathname.split("/").pop() == "checkout"){
			current_page = "checkout";
		}

		//remove white link if not a page that needs it
		if (pages_white_nav.indexOf(current_page) != -1){
			$(".nav-link").removeClass("is-white");
			$(".nav-menu").removeClass("is-black");
			$("#nav-logo, .circle-logo").addClass("is-primary").removeClass("is-white");
			$(".nav-toggle").removeClass("is-white").addClass("is-black");
			$("#profile-button, .login-modal").addClass("is-primary").removeClass("is-white");
		}

		//change navbar based on scroll
		navbarChange($(window), pages_white_nav, current_page);
		$(window).scroll(function(e){
			navbarChange($(this), pages_white_nav, current_page);
		});
	}

	//delete notifications button
	$(".delete").on("click", function(e){
		e.preventDefault();
		$(this).parent(".notification").addClass('is-hidden');
	});

});

//function to change navbar on scroll
function navbarChange(windowelem, pages_white_nav, current_page){
	//before the top
	if (windowelem.scrollTop() <= 0) {
		$(".nav").removeClass("has-shadow is-white");
		if (pages_white_nav.indexOf(current_page) != -1){
			$(".nav-link").removeClass("is-white");
			$("#nav-logo, .circle-logo").addClass("is-primary").removeClass("is-white");
		}
		else {
			$("#profile-button, .login-modal").removeClass("is-primary").addClass("is-white");
			$("#nav-logo, .circle-logo").removeClass("is-primary").addClass("is-white");
			$(".nav-link").addClass("is-white");
			$(".nav-menu").addClass("is-black");
			$(".nav-toggle").removeClass("is-black").addClass("is-white");
		}
	}
	//past the top
	else if (windowelem.scrollTop() > 0 && !$(".nav").hasClass("has-shadow")){
		$(".nav").addClass("has-shadow is-white");
		$(".nav-link").removeClass("is-white");
		$(".nav-menu").removeClass("is-black");
		$(".nav-toggle").removeClass("is-white").addClass("is-black");
		$("#nav-logo, .circle-logo").addClass("is-primary").removeClass("is-white");
		$("#profile-button, .login-modal").addClass("is-primary").removeClass("is-white");
	}
}
