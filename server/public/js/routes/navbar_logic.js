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

	//$("#domain-name").width($(".container").width() - $(".nav-left").width() - $(".nav-toggle").width() - $(".nav-right").width());

	if (window.location.pathname == "/"){
		var get_started_offset = $("#index-img").offset().top + $("#index-img").height() || 0;
		window.onresize = function(event) {
			get_started_offset = $("#index-img").offset().top + $("#index-img").height() || 0;
		};

		//while scrolling
		$(window).scroll(function(e){

			//before the image
			if ($(this).scrollTop() <= get_started_offset && $(".nav").hasClass("is-white")) {
				$(".nav").removeClass("is-white has-shadow");
				$("#searchbar-form").addClass("is-transparent");
				$("#login-modal").parent(".nav-item").removeClass("is-hidden");
				$("#signup").removeClass("is-primary button");
				$("#signup").addClass("is-white nav-link");
				$(".nav-link").addClass("is-white");
				$(".nav-link").parent(".nav-item").removeClass("is-hidden");
			}
			//past the image
			else if ($(this).scrollTop() > get_started_offset && !$(".nav").hasClass("is-white")){
				$(".nav").addClass("is-white has-shadow");
				$("#searchbar-form").removeClass("is-transparent");
				$("#signup").removeClass("is-white nav-link");
				$("#signup").addClass("button is-primary");
				$("#login-modal").parent(".nav-item").addClass("is-hidden");
				$(".nav-link").removeClass("is-white");
				$(".nav-link").parent(".nav-item").addClass("is-hidden");
			}
		})
	}
	else {
		$(".nav").css({
			"background-color": "white"
		});
		$(".nav").addClass("has-shadow");
		$(".nav-link").removeClass("is-white");
	}

});



//function to toggle navbar background color
function navbar_color(){
	$("#navbar").toggleClass();

}
