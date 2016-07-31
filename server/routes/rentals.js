var request = require('request');

var	account_model = require('../models/account_model.js'),
	listing_model = require('../models/listing_model.js'),
	Account,
	Passport;

module.exports = function(app, db, auth, e){
	error = e;

	Account = new account_model(db);
	Listing = new listing_model(db, Account);

	//function to check if logged in
	isLoggedIn = auth.isLoggedIn;

	//API for rental info
	app.get('/rental_info/:domain_name/:rental_id', getRental);
	app.get('/rental_info/:domain_name', getCurrentRental);
}

//----------------------------------------------------------------API pages----------------------------------------------------------------

//send rental details and info for a specific rental
function getRental(req, res, next) {
	rental_id = req.params.rental_id;
	domain_name = req.params.domain_name.replace(/^(https?:\/\/)?(www\.)?/,'');

	//check if rental id is legit
	if (parseFloat(rental_id) != rental_id >>> 0){
		error.handler(req, res, "Invalid rental!", "json");
	}
	//check if domain name is legit
	else if (parseFloat(domain_name) === domain_name >>> 0){
		error.handler(req, res, "Invalid listing!", "json");
	}
	else {
		Listing.getListingRental(domain_name, rental_id, false, function(result){
			sendRentalInfo(req, res, result);
		});
	}
}

//send the current rental details and information for a listing
function getCurrentRental(req, res, next){
	domain_name = req.params.domain_name.replace(/^(https?:\/\/)?(www\.)?/,'');

	//check if listing is legit
	if (parseFloat(domain_name) == domain_name >>> 0){
		error.handler(req, res, "Invalid listing!", "json");
	}
	else {
		//get the current rental for the listing
		Listing.getListingRental(domain_name, false, false, function(result){
			sendRentalInfo(req, res, result);
		});
	}
}

//helper function to send rental information
function sendRentalInfo(req, res, result){
	if (result.state == "success"){
		//what type of rental is it?
		switch (result.rental_info.type){
			//default page 0
			//simple page 2
			case 0:
			case 2:
				res.render("reset.ejs", {
					listing_info: result.listing_info,
					rental_info: result.rental_info,
					default_rental_info: result.default_rental_info
				});
				break;
			//simple redirect 1
			case 1:
				res.json({location: result.rental_details[0].text_value});
				break;
		}
	}
	else {
		error.handler(req, res, result.description, "json");
	}
}
