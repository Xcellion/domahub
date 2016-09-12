$(document).ready(function() {
	if (redirect){
		//message to change depending on where to redirect
		switch (redirect){
			case "/profile":
				path_msg = "profile";
			case "/":
			default:
				path_msg = "home";
		}

		var message = "Please wait. Redirecting you to the " + path_msg + " page."
		$("#message").text(message);
		redirectDelay(redirect);
	}
});

//redirect after a short delay
function redirectDelay(path){
	var seconds = 5;

	//add a period every second
	window.setInterval(function(){
		seconds--;
		$("#message").append(".");

		//redirect after 5 seconds
		if (seconds == 0){
			window.location.href = path;
		}
	}, 1000);

}
