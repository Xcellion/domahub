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

	// hamburger toggle button
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

	//if this is a page that has an image
	var potential_paths = [];
	if (window.location.pathname == "/"){
		var get_started_offset = $("#get-started").offset().top - 6 || 0;

		//while scrolling
		$(window).scroll(function(e){
			if ($(this).scrollTop() > get_started_offset && !$(".nav").hasClass("is-primary")){
				$(".nav").addClass("is-primary");
				$(".nav").addClass("has-shadow");
				$("#login-modal").addClass("is-inverted");
				$(".logo-text").addClass("is-white");
				$(".nav-link").addClass("is-active");
				$("#get-started").css({
					position: "fixed",
					top: "6px",
					"z-index": "1000",
					"border-color": "white"
				});
			}
			else if ($(this).scrollTop() <= get_started_offset && $(".nav").hasClass("is-primary")) {
				$(".nav").removeClass("is-primary");
				$(".nav").removeClass("has-shadow");
				$("#login-modal").removeClass("is-inverted");
				$(".logo-text").removeClass("is-white");
				$(".nav-link").removeClass("is-active");
				$("#get-started").removeAttr("style");
			}
		})
	}
	else {
		$(".nav").css({
			"background-color": "white"
		});
		$(".nav").addClass("has-shadow");
		//need to make link green
	}

});



//function to toggle navbar background color
function navbar_color(){
	$("#navbar").toggleClass();

}
