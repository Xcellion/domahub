$(document).ready(function() {
	//used to display the message sent from the server
	if (typeof message != "undefined" && message){
		$("#message").text(message);
		if (message == "Invalid username / password!"){
			$('#modal_login').addClass('is-active');
			$("#message").css("color", "#ed1c24");
		}
	}

	//if remember me is set in the cookie
	var remember_cookie = read_cookie("remember");
	if (remember_cookie){
		$("#remember_checkbox").prop("checked", true);
		$("#email").val(remember_cookie);
	}

	//redirect search to the appropriate /listing page
	$("#searchbar_form").submit(function(e){
		e.preventDefault();
		remember($("#remember_checkbox").is(":checked"));
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

	//remember me check box
	$("#remember_checkbox").click(function(){
		remember($(this).is(":checked"));
	});
});

//remember cookie
function remember(bool){
	if (bool && validateEmail($("#email").val())){
		bake_cookie("remember", $("#email").val())
	}
	else {
		delete_cookie("remember");
	}
}

//helper function to validate email address
function validateEmail(email) {
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}
