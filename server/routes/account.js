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
	app.get('/profile', isLoggedIn, profile);
	app.get('/login', isLoggedIn);
	app.get('/logout', Auth.logout);
	app.get('/signup', Auth.signup);
	
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
	});
}

//goes to profile
function profile(req, res){
	account_id = req.user.id;
	
	//check if user id is legit
	if (parseFloat(account_id) == account_id >>> 0){
		//get all available listings
		Listing.getAllListings(function(result){
			listings = result.listings;
			
			//get all rentals for that user
			Account.getRentalsAccount(account_id, function(result){
				rentals = result.rentals;
				
				res.render("profile.ejs", {
					message: Auth.messageReset(req),
					user: req.user,
					listings: listings,
					rentals: rentals
				});
			});
			
		});
	}
	else {
		error.handler(req, res, "Invalid user!");
	}
}