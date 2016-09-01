module.exports = function(app, auth){
	Auth = auth;

	//function to check if logged in
	isLoggedIn = Auth.isLoggedIn;

	app.get('/login', isLoggedIn);
	app.get('/logout', Auth.logout);
	app.get('/signup', Auth.signup);
	app.get('/forgot', Auth.forgot);

	//posts for account
	app.post('/signup', Auth.signupPost);
	app.post('/login', Auth.loginPost);
	app.post('/forgot', Auth.forgotPost);
}
