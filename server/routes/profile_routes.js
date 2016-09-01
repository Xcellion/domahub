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
	if (!req.session.userlistings){
		account_id = req.user.id;

		Account.getListingsAccount(account_id, function(result){
			if (result.state=="error"){error.handler(req, res, result.info);}
			else {
				req.session.userlistings = result.info;
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
	if (!req.session.userrentals){
		account_id = req.user.id;

		Account.getRentalsAccount(account_id, function(result){
			if (result.state=="error"){error.handler(req, res, result.info);}
			else {
				req.session.userrentals = result.info;
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
		listings: req.session.userlistings || false,
		rentals: req.session.userrentals || false
	});
}
