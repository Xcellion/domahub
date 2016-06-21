var database;

module.exports = {
	errorMessage: errorMessage
}

//make sure user is logged in before doing anything
function errorMessage(req, res, message, type) {
	switch (type){
		case "json":
			res.json(message);
			break;
		default:
			//redirect back
			redirectTo = "/";
			req.session.redirectTo = redirectTo;
			
			//set message
			console.log(message + " Sending back to " + redirectTo);
			req.session.message = message;
			
			res.redirect(redirectTo);
			break;
	}
}