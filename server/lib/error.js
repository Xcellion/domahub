var database;

module.exports = {
	handler: handler
}

//handle errors, either send them back json, or redirect the page
function handler(req, res, message, type) {
	switch (type){
		case "json":
			res.json({
				message: message,
				state: "error"
			});
			break;
		default:
			var redirectTo = req.header("Referer") || "/login";
			var redirectBack = req.path;
			req.session.message = message;

			switch (message){
				case "Invalid user!":
				case "Invalid password!":
					req.session.message = "Invalid username / password!";
					break;
				case "Invalid user / rental!":
					req.session.message = "Invalid rental!";
					console.log("Someone tried to access someone else's rental!");
				case "Invalid rental!":
				case "No rental information!":
					redirectTo = RemoveLastDirectoryPartOf(req.path);
					break;
				case "Invalid rental data!":
					redirectTo = req.path;
					break;
				case "Signup error!":
				case "Invalid listing!":
				case "Invalid price!":
				default:
					console.log(message);
					break;
			}
			
			req.session.redirectBack = redirectBack;

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