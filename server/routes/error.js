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
			var redirectTo;
			req.session.message = message;

			//if the user is coming from a click instead of a URL enter
			if (req.header("Referer")){
				redirectTo = req.header("Referer");
			}
			//user came from URL input
			else {

				switch (message){
					case "Invalid listing!":
						redirectTo = "/";
						break;
					case "Invalid user!":
						req.session.message = "Please log in!";
					case "Invalid rental!":
					case "Invalid rental type!":
					case "Invalid rental date!":
						redirectTo = RemoveLastDirectoryPartOf(req.path);
						break;
					case "Invalid rental data!":
						redirectTo = req.path;
						break;
					default:
						redirectTo = "/"
						break;
				}
			}
			
			req.session.redirectTo = redirectTo;

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