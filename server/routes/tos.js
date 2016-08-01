var	account_model = require('../models/account_model.js'),
	listing_model = require('../models/listing_model.js');

module.exports = function(app, db, auth, e){
	Auth = auth;
	error = e;

	Account = new account_model(db);
	Listing = new listing_model(db);

	//function to check if logged in
	isLoggedIn = Auth.isLoggedIn;

	//default page
	app.get("/tos", tosPage);
	app.get('/login', isLoggedIn);
	app.get('/logout', Auth.logout);
	app.get('/signup', Auth.signup);

	//posts for account
	app.post('/signup', Auth.signupPost);
	app.post('/login', Auth.loginPost);
}

//display about page
function tosPage(req, res, next){
	res.render("tos", {
		message: Auth.messageReset(req),
		user: req.user
	});
}
