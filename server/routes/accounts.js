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
	app.get("/", mainPage);
	app.get('/login', isLoggedIn);
	app.get('/logout', Auth.logout);
	app.get('/signup', Auth.signup);

	//posts for account
	app.post('/signup', Auth.signupPost);
	app.post('/login', Auth.loginPost);
}

//display main page with all listings
function mainPage(req, res, next){
	Listing.getAllListings(function(result){
		if (result.state == "success"){
			res.render("index.ejs", {
				message: Auth.messageReset(req),
				listings: result.listings,
				user: req.user
			});
		}
		else {
			res.render("index.ejs", {
				message: "Database error!"
			});
		}
	});
}
