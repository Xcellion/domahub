$(document).ready(function() {
	//if remember me is set in the cookie
	var remember_cookie = readCookie("remember");
	if (remember_cookie){
		$("#remember-checkbox").prop("checked", true);
		$("#email").val(remember_cookie);
	}

	//remember me check box
	$("#remember-checkbox").on("click", function(){
		rememberAccount($(this).is(":checked"));
	});

	$("#login-form").on('submit', function(){
		$("#login-button").addClass('is-loading');
	});

	//to catch empty emails or empty passwords
	$('#navbar_form').on("submit", function(event){
		//re-set cookie for remember
		rememberAccount($("#remember-checkbox").is(":checked"));

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

//helper function to validate email address
function validateEmail(email) {
  var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(email);
}

//helper function to remember cookie
function rememberAccount(bool){
	if (bool && validateEmail($("#email").val())){
		bakeCookie("remember", $("#email").val())
	}
	else {
		deleteCookie("remember");
	}
}

//helper function to make cookie
function bakeCookie(name, value) {
	var cookie = [name, '=', JSON.stringify(value), '; path=/;'].join('');
	document.cookie = cookie;
}

//helper function to read a cookie
function readCookie(name) {
	var result = document.cookie.match(new RegExp(name + '=([^;]+)'));
	result && (result = JSON.parse(result[1]));
	return result;
}

//helper function to delete a cookie
function deleteCookie(name) {
	//document.cookie = [name, '=; expires=Thu, 01-Jan-1970 00:00:01 GMT; path=/; domain=.', window.location.host.toString()].join('');
	document.cookie = [name, '=; expires=Thu, 01-Jan-1970 00:00:01 GMT', '; path=/;'].join('');
}
