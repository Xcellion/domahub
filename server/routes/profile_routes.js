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
	app.get('/profile', [
		isLoggedIn,
		getProfile
	]);

	//routes for profile tabs - dashboard, inbox, mylistings, myrentals
	app.get('/profile/:profile_tab', function(req, res){
		tab = req.params.profile_tab;
		res.redirect('/profile/' + tab);
	});
}

//goes to profile
function getProfile(req, res){
	account_id = req.user.id;

	//get all available listings belonging to that account
	Account.getListingsAccount(account_id, function(result){
		if (result.state=="error"){error.handler(req, res, result.info);}
		else {
			listings = result.info;

			//get all rentals belonging to that account
			Account.getRentalsAccount(account_id, function(result){
				if (result.state=="error"){error.handler(req, res, result.info);}
				else {
					rentals = result.info;

					res.render("profile.ejs", {
						message: Auth.messageReset(req),
						user: req.user,
						listings: listings || false,
						rentals: rentals || false
					});
				}
			});
		}
	});
}
