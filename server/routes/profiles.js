var	account_model = require('../models/account_model.js'),
	listing_model = require('../models/listing_model.js');

const url = require("url");

module.exports = function(app, db, auth, e){
	Auth = auth;
	error = e;

	Account = new account_model(db);
	Listing = new listing_model(db);

	//function to check if logged in
	isLoggedIn = Auth.isLoggedIn;

	//profile page
	app.get('/profile', isLoggedIn, getProfile);
	app.get('/profile*', function(req, res){res.redirect('/profile')});

	//posts for account
	app.post('/profile', isLoggedIn, postProfile);
	app.post('/profile/changeActive', isLoggedIn, changeActive);
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

//posts new listing information to the profile
function postProfile(req, res){
	user = req.user;
	domain_name = req.body.domain_name;
	description = req.body.description;

	//check if user id is legit
	if (parseFloat(account_id) == account_id >>> 0 && description && domain_name){
		info = {
			domain_name : url.parse(req.body.domain_name).host,
			description: req.body.description,
			owner_id: user.id,
			price_type: 2
		}
		Listing.insertSetInfo("listings", info, function(result){
			if (result.state == "success") {
				console.log(result);
				res.send({
					state: "success",
					message: "Successfully added a new listing!"
				})
			}
			else {
				error.handler(req, res, "Invalid listing!");
			}
		})
	}
	else {
		error.handler(req, res, "Invalid user!");
	}
}

//function to change listing to active
function changeActive(req, res, next){
	account_id = req.user.id;
	domain_name = req.body.domain_name;

	//check if user id is legit
	if (parseFloat(account_id) == account_id >>> 0 && domain_name){
		Listing.setListingAccount(domain_name, account_id, function(result){
			console.log(result);
		})
	}
	else {
		error.handler(req, res, "Invalid user!");
	}
}
