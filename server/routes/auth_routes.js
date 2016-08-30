module.exports = function(app, auth){
	Auth = auth;

	//function to check if logged in
	isLoggedIn = Auth.isLoggedIn;

	app.get('/auth', authCheck);
	app.get('/login', isLoggedIn);
	app.get('/logout', Auth.logout);
	app.get('/signup', Auth.signup);

	//posts for account
	app.post('/signup', Auth.signupPost);
	app.post('/login', Auth.loginPost);
}

//function to re-send user and message
function authCheck(req, res){
	res.send({
		user : req.user,
		message: Auth.messageReset(req)
	});
}
