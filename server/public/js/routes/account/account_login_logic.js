$(document).ready(function() {

	//if remember me is set in the cookie
	var remember_cookie = read_cookie("remember");
	if (remember_cookie){
		$("#remember-checkbox").prop("checked", true);
		$("#email").val(remember_cookie);
	}

	//remember me check box
	$("#remember-checkbox").click(function(){
		remember($(this).is(":checked"));
	});

	//to catch empty emails or empty passwords
	$('#navbar_form').submit(function(event){

		//re-set cookie for remember
		remember($("#remember-checkbox").is(":checked"));

		//if no email is entered
		if (!$("#email").val()) {
			$("#message").fadeOut(100, function(){
				$("#message").css("color", "#ed1c24").html("Please enter your email address!").fadeIn(100);
			});
			return false;
		}

		//if no password is entered
		if (!$("#password").val()) {
			$("#message").fadeOut(100, function(){
				$("#message").css("color", "#ed1c24").html("Please enter your password!").fadeIn(100);
			});
			return false;
		}
	});

});

//helper function to remember cookie
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
