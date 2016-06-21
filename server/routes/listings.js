var app,
	database,
	error;

var	account_model = require('../models/account_model.js'),
	listing_model = require('../models/listing_model.js'),
	Account,
	Passport;

module.exports = function(app_pass, db, auth, e){
	app = app_pass;
	database = db;
	error = e;
	
	Account = new account_model(database);
	Listing = new listing_model(database, Account);
		
	//function to check if logged in
	isLoggedIn = auth.isLoggedIn;

	app.get('/listing/:domain_name', getListing);
	app.get('/listing/:domain_name/:rental_id', getRentalPage);
	app.get('/rental_info/:domain_name/:rental_id', getRental);
	app.get('/rental_info/:domain_name', getListingRental);
	
	app.post('/listing/:listing/rent', isLoggedIn, postRental);
}

//gets the listing info
function getListing(req, res, next) {
	domain_name = req.params.domain_name
	
	//we dont accept listing ids, only domain names
	if (parseFloat(domain_name) === domain_name >>> 0){
		error.errorMessage(req, res, "No such listing exists!");
	}
	
	else {
		//get basic listing info
		Listing.getInfo("listings", "domain_name", domain_name, false, function(result){
			if (result.state == "success" && result.info){
				info = result.info[0];
				
				//get all rental info for that listing that is not default
				Listing.getInfo("rentals", "listing_id", result.info[0].id, ' AND date != "0000-00-00 00:00:00"', function(result){
					if (result.state == "success"){
						info.rentals = result.info;
						res.render("listing.ejs", {
							user: req.user,
							info: info
						});
					}
					else {
						//no existing rentals!
						if (result.description.length == 0){
							info.rentals = result.description;
							res.render("listing.ejs", {
								user: req.user,
								info: info
							});
						}
						else {
							error.errorMessage(req, res, "Rental listing error!");
						}
					}
				});
			}
			//listing doesnt exist
			else {
				error.errorMessage(req, res, "No such listing exists!");
			}
		});
	}
}

//gets the page to edit rental info
function getRentalPage(req, res, next){

}

//helper function to send rental information
function sendRentalInfo(req, res, result){
	if (result.state == "success"){
		switch (result.rental_info.type){
			case 0:
				res.jsonp(result.rental_details);
				break;
			case 1:
				res.redirect(result.rental_details[0].text_value);
				break;
		}
	}
	else {
		error.errorMessage(req, res, result.description, "json");
	}
}

//send rental details and info for a specific rental
function getRental(req, res, next) {
	rental_id = req.params.rental_id;

	//listing id error
	if (parseFloat(rental_id) != rental_id >>> 0){
		error.errorMessage(req, res, "No such rental exists!", "json");
	}

	else {
		Listing.getRental(rental_id, function(result){
			sendRentalInfo(req, res, result);
		});
	}
}

//gets the current rental details and information for a listing
function getListingRental(req, res, next){
	domain_name = req.params.domain_name;
	
	//get the current rental for the listing
	Listing.getListingRental(domain_name, function(result){
		sendRentalInfo(req, res, result);
	});
}

//create a new rental for a listing
function postRental(req, res, next){
	user_id = req.user.id;
	listing_id = req.params.listing
	events = req.body.events;
	type = req.body.type;
	
	checks = true;
		
	//check if listing id is legit
	if (parseFloat(listing_id) != listing_id >>> 0){
		checks = false;
		error.errorMessage(req, res, "Invalid listing!");
	}
	
	//check if user id is legit
	else if (parseFloat(user_id) != user_id >>> 0){
		checks = false;
		error.errorMessage(req, res, "Invalid user id!");
	}
	
	//check if rental type is legit
	else if (parseFloat(type) != type >>> 0){
		checks = false;
		error.errorMessage(req, res, "Invalid rental type!");
	}
	
	//check if events even exist
	else if (!events){
		checks = false;
		error.errorMessage(req, res, "Invalid date!");
	}
	
	//check if all the event info are legit dates
	else if (events){
		
		for (var x = 0; x < events.length; x++){
			events[x].start = new Date(events[x].start);
			events[x].end = new Date(events[x].end);
			if (isNaN(events[x].start) || isNaN(events[x].end)){
				checks = false;
				error.errorMessage(req, res, "Invalid date!");
			}
		}
	}
	
	if (checks){
		//all gucci
		Listing.newRental(listing_id, events, req.user, function(result){
			if (result.state == "success"){
				res.jsonp(result.eventStates);
			}
			else {
				error.errorMessage(req, res, "Rent failed!");
			}
		});
	}
}