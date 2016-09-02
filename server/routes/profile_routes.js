var	account_model = require('../models/account_model.js');

var crypto = require('crypto');

const url = require("url");

module.exports = function(app, db, auth, e){
	Auth = auth;
	error = e;

	Account = new account_model(db);

	//function to check if logged in
	isLoggedIn = Auth.isLoggedIn;

	//profile page route
	profile_tab_routes = [
		"/profile/dashboard",
		"/profile/inbox",
		"/profile/mylistings",
		"/profile/myrentals"
	]

	//check if user is legit, get all listings, get all rentals, then renders the appropriate page
	app.get(profile_tab_routes, [
		isLoggedIn,
		getListingsAccount,
		getRentalsAccount,
		renderProfile
	]);

	//redirect anything not caught above to /profile
	app.get("/profile*", function(req, res){ res.redirect("/profile/dashboard") });
}

//gets all listings for a user
function getListingsAccount(req, res, next){

	//if we dont already have the list of listings or if we need to refresh them
	if (!req.user.listings || req.user.refresh_listing){
		delete req.user.refresh_listing;
		account_id = req.user.id;

		Account.getListingsAccount(account_id, function(result){
			if (result.state=="error"){error.handler(req, res, result.info);}
			else {
				req.user.listings = result.info;
				next();
			}
		});
	}
	else {
		next();
	}
}

//gets all rentals for a user
function getRentalsAccount(req, res, next){

	//if we dont already have the list of rentals or if we need to refresh them
	if (!req.user.rentals || req.user.refresh_rental){
		delete req.user.refresh_rental;
		account_id = req.user.id;

		Account.getRentalsAccount(account_id, function(result){
			if (result.state=="error"){error.handler(req, res, result.info);}
			else {
				req.user.rentals = result.info;
				next();
			}
		});
	}
	else {
		next();
	}
}

//renders profile page
function renderProfile(req, res){
	account_id = req.user.id;

	ejs_name = req.path.slice(1, req.path.length).split("/").join("_") + ".ejs";

	res.render(ejs_name, {
		message: Auth.messageReset(req),
		user: req.user,
		listings: req.user.listings || false,
		rentals: req.user.rentals || false
	});
}
