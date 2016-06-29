var app,
	database;

var	account_model = require('../models/account_model.js'),
	listing_model = require('../models/listing_model.js'),
	Account,
	Passport;

module.exports = function(app_pass, db, auth){
	app = app_pass;
	database = db;
	
	Account = new account_model(database);
	Listing = new listing_model(database, Account);
	
	//function to check if logged in
	isLoggedIn = auth.isLoggedIn;

	//default page
	app.get("/", mainPage);
	app.get('/profile', isLoggedIn, mainPage);
	app.get('/login', isLoggedIn);
	app.get('/logout', isLoggedIn, logout);
	app.get('/signup', signup);
	
	app.post('/signup', auth.signupPost);
	app.post('/login', auth.loginPost);
}

//display main page with all listings
function mainPage(req, res, next){
	message = req.session.message;
	Listing.getAllListings(function(result){
		if (result.state == "success"){
			res.render("index.ejs", {
				message: message,
				listings: result.listings,
				auth: req.user
			});
		}
	});
}

//goes to profile
function profile(req, res){
	message = req.session.message || "";
	res.render("profile.ejs", {
		message: message,
		auth: req.user
	});
}

//log out of the session
function logout(req, res) {
	console.log("Logging out");
	req.logout();
	res.redirect('/');
};

//sign up for a new account
function signup(req, res){
	var message = req.session.message || "";
	req.session.message = "";
	res.render("signup.ejs", { message: message});
};