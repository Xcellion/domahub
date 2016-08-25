module.exports = function(app, db, auth, e){
	Auth = auth;
	error = e;

	//function to check if logged in
	isLoggedIn = Auth.isLoggedIn;

	//default page
	app.get('/about', companyPage);
	app.get('/mission', companyPage);
	app.get('/press', companyPage);
	app.get('/faq', companyPage);
	app.get('/login', isLoggedIn);
	app.get('/logout', Auth.logout);
	app.get('/signup', Auth.signup);

	//posts for account
	app.post('/signup', Auth.signupPost);
	app.post('/login', Auth.loginPost);
}

//display about tab content
function companyPage(req, res, next){
	res.render('company', {
		message: Auth.messageReset(req),
		user: req.user
	});
}
