var database;
var url = require("url");

module.exports = {
	handler: handler
}

//handle errors, either send them back json, or redirect the page
function handler(req, res, message, type) {
	switch (type){
		//errors for api
		case "api":
			req.session.message = "Test";
			res.redirect(301, 'http://domahub.com');
			break;
		case "json":
			res.send({
				state: "error",
				message: message
			});
			break;
		//all other errors
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
					console.log("Someone tried to access someone else's rental!");
				case "Invalid rental!":
				case "No rental information!":
				case "Invalid rental / listing!":
					redirectTo = RemoveLastDirectoryPartOf(req.path);
					break;
				case "Cannot activate through URL!":
					redirectTo = "/profile";
					break;
				case "Invalid rental data!":
					redirectTo = req.path;
					break;
				case "Invalid listing!":
				case "Invalid domain name!":
				case "Invalid listing activation!":
					redirectTo = "/listing";
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
