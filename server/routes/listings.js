var app,
	database;

var	account_model = require('../models/account_model.js'),
	listing_model = require('../models/listing_model.js'),
	Account,
	Passport;

module.exports = function(app_pass, db, pp){
	app = app_pass;
	database = db;
	Passport = pp;
	
	Account = new account_model(database);
	Listing = new listing_model(database, Account);
	
	//checks if the user is logged in before running anything
	app.get('/listing/:listing_id', isLoggedIn, getListing);
}

//make sure user is logged in before doing anything
function isLoggedIn(req, res, next) {
	//if user is authenticated in the session
	if (req.isAuthenticated()){
		delete req.user.password;
		console.log("Authenticated!");
		return next();
	}
	else {
		return next();
	}
}

//gets the listing info
function getListing(req, res, next) {
	listing_id = req.params.listing_id
	
	//only if the listing id is a number
	if (parseFloat(listing_id) === listing_id >>> 0){
		Listing.getListingInfo(listing_id, "listings", function(result){
			if (result.state == "success" && result.listing_info){
				res.render("listing.ejs", {
					user: req.user,
					listing_info: result.listing_info
				});
			}
			//listing doesnt exist
			else {
				res.render("listing_error.ejs", {
					message: "No such listing exists!"
				});
			}
		});
	}
	else {
		res.render("listing_error.ejs", {
			message: "Please enter a number!"
		});
	}
}