var	account_model = require('../models/account_model.js'),
	listing_model = require('../models/listing_model.js');

var crypto = require('crypto');

const url = require("url");
const val_url = require("valid-url");

module.exports = function(app, db, auth, e){
	Auth = auth;
	error = e;

	Account = new account_model(db);
	// Listing = new listing_model(db);

	//function to check if logged in
	isLoggedIn = Auth.isLoggedIn;

	//profile page
	app.get('/profile', isLoggedIn, getProfile);
	app.get('/profile*', function(req, res){res.redirect('/profile')});
}

//goes to profile
function getProfile(req, res){
	account_id = req.user.id;

	//check if user id is legit
	if (parseFloat(account_id) == account_id >>> 0){
		//get all available listings
		Account.getListingsAccount(account_id, function(result){
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
