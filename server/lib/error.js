var database;

module.exports = {
	handler: handler
}

//make sure user is logged in before doing anything
function handler(req, res, message, type) {
	switch (type){
		case "json":
			res.json(message);
			break;
		default:
			var redirectTo = req.header("Referer") || "/";
			req.session.message = message;
			
			//if the user is coming from a click instead of a URL enter
			if (req.header("Referer")){
				switch (message){
					case "User exists!":
						break;
					case "Invalid user!":
					case "Invalid password!":
						console.log(message);
						req.session.message = "Invalid username / password!"
						break;
					default:
						break;
				}
			}
			//user came from URL input
			else {
				switch (message){
					case "Invalid listing!":
						break;
					case "Invalid user!":
					case "Invalid password!":
						req.session.message = "Invalid username / password!";
					case "Invalid rental!":
					case "Invalid rental type!":
					case "Invalid rental date!":
						redirectTo = RemoveLastDirectoryPartOf(req.path);
						break;
					case "Invalid rental data!":
						redirectTo = req.path;
						break;
					default:
						break;
				}
			}
			
			req.session.redirectTo = redirectTo;

			console.log(message + " Sending back to " + redirectTo);
			res.redirect(redirectTo);
			req.session.message = "";
			break;
	}
}

//helper function to remove last part of URL
function RemoveLastDirectoryPartOf(the_url){
    var the_arr = the_url.split('/');
    the_arr.pop();
    return( the_arr.join('/') );
}