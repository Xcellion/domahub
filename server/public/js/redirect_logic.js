$(document).ready(function() {
	if (redirect){
		console.log(redirect);
		//message to change depending on where to redirect
		switch (redirect){
			case "/profile":
				path_msg = "profile";
				break;
			case "/":
			default:
				path_msg = "home";
				break;
		}

		var message = "Please wait. Redirecting you to the " + path_msg + " page."
		$("#message").text(message);
		redirectDelay(redirect);
	}
});

//redirect after a short delay
function redirectDelay(path){
	var seconds = 3;

	//add a period every second
	window.setInterval(function(){
		seconds--;
		$("#message").append(".");

		//redirect after 3 seconds
		if (seconds == 0){
			window.location.href = path;
		}
	}, 1000);

}
