var	account_model = require('../models/account_model.js'),
	listing_model = require('../models/listing_model.js');

var rhd = require('node-humanhash');
var crypto = require('crypto');

const url = require("url");
const val_url = require("valid-url");

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
	account_id = req.user.id;
	domain_name = url.parse(addhttp(req.body.domain_name)).host;
	description = req.body.description;

	//check if user id is legit
	if (parseFloat(account_id) != account_id >>> 0){
		error.handler(req, res, "Invalid user!");
	}
	else if (!description){
		error.handler(req, res, "Invalid domain description!");
	}
	else if (!val_url.isUri(addhttp(req.body.domain_name))){
		error.handler(req, res, "Invalid domain name!");
	}
	else {
		info = {
			domain_name : domain_name,
			description: req.body.description,
			owner_id: account_id,
			price_type: 0
		}

		Listing.insertSetInfo("listings", info, function(result){
			if (result.state == "success") {

				digest = crypto.createHash('md5').update("'" + result.insertId + "'").digest('hex');
				rhd = rhd.humanizeDigest(digest);

				res.json({
					state: "success",
					listing_info: {
						domain_name: domain_name,
						id: result.insertId,
						rhd: rhd,
						owner_id: account_id,
						price_type: 0
					},
					message: "Successfully added a new listing!"
				})
			}
			else {
				error.handler(req, res, "Listing already exists!", "json");
			}
		})
	}
}

//function to add protocol to a URL
function addhttp(url) {
    if (!/^(?:f|ht)tps?\:\/\//.test(url)) {
        url = "http://" + url;
    }
    return url;
}
