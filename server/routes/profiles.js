var	account_model = require('../models/account_model.js');

var crypto = require('crypto');

const url = require("url");
const val_url = require("valid-url");

module.exports = function(app, db, auth, e){
	Auth = auth;
	error = e;

	Account = new account_model(db);

	//function to check if logged in
	isLoggedIn = Auth.isLoggedIn;

	//profile page
	app.get('/profile', [
		isLoggedIn,
		getProfile
	]);
	app.get('/profile*', function(req, res){res.redirect('/profile')});
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
