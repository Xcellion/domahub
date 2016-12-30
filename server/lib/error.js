module.exports = {
	handler: handler
}

//handle errors, either send them back json, or redirect the page
function handler(req, res, message, type) {
	switch (type){
		//send direct message or redirect page
		case "json":
			console.log("ERROR: " + message);
			res.send({
				state: "error",
				message: message
			});
			break;
		//redirect page
		default:
			var redirectTo = req.header("Referer") || "/login";
			req.session.message = message;

			switch (message){
				case "Invalid user!":
				case "Invalid password!":
					req.session.message = "Invalid username / password!";
					break;
				case "Invalid user / rental!":
					req.session.message = "Invalid rental!";
				case "Invalid rental!":
				case "No rental information!":
				case "Invalid rental / listing!":
					redirectTo = RemoveLastDirectoryPartOf(req.path);
					break;
				case "Cannot activate through URL!":
				case "Invalid stripe token!":
					redirectTo = "/profile";
					break;
				case "Invalid rental data!":
					redirectTo = req.path;
					break;
				case "Invalid listing!":
				case "Invalid domain name!":
				case "Invalid listing activation!":
				case "DNS error!":
					redirectTo = "/";
					break;
				case "Signup error!":
				case "Invalid price!":
				default:
					break;
			}

			console.log(message + " Sending back to " + redirectTo);
			res.redirect(redirectTo);
			break;
	}
}

//helper function to remove last part of URL
function RemoveLastDirectoryPartOf(the_url){
    var the_arr = the_url.split('/');
    the_arr.pop();
    return( the_arr.join('/') );
}
