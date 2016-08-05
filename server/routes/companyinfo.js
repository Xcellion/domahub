module.exports = function(app, db, auth, e){
	Auth = auth;
	error = e;

	//function to check if logged in
	isLoggedIn = Auth.isLoggedIn;

	//default page
	app.get("/about", aboutPage);
	app.get('/login', isLoggedIn);
	app.get('/logout', Auth.logout);
	app.get('/signup', Auth.signup);

	//posts for account
	app.post('/signup', Auth.signupPost);
	app.post('/login', Auth.loginPost);
}

//display about page
function aboutPage(req, res, next){
	res.render("about", {
		message: Auth.messageReset(req),
		user: req.user
	});
}
