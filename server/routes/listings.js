var app,
	database,
	error;
	
var request = require('request');

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

	app.get('/listing/:domain_name', getListingAccount);
	app.get('/rental_info/:domain_name/:rental_id', getRental);
	app.get('/rental_info/:domain_name', getListingRental);
	app.get('/listing/:domain_name/:rental_id', isLoggedIn, getRentalPage);

	app.post('/listing/:domain_name/rent', isLoggedIn, postRental);
	app.post('/listing/:domain_name/:rental_id', isLoggedIn, postRentalPage);
}

//gets the listing info
function getListingAccount(req, res, next) {
	domain_name = req.params.domain_name
	
	//we dont accept listing ids, only domain names
	if (parseFloat(domain_name) === domain_name >>> 0){
		error.errorMessage(req, res, "No such listing exists!");
	}
	
	else {
		var new_listing_info = req.session.new_listing_info || false;
	
		Listing.getListingAccount(domain_name, function(result){
			if (result.state == "success"){
				res.render("listing.ejs", {
					user: req.user,
					listing_info: result.listing_info,
					new_listing_info: new_listing_info
				});
			}
			else {
				error.errorMessage(req, res, result.description);
			}
		});
	}
}

//helper function to send rental information
function sendRentalInfo(req, res, result){
	if (result.state == "success"){
	
		var allowedOrigins = ['http://www.youreacutie.com', 'http://www.imsorryimdumb.com', 'http://imsorryimdumb.com', 'http://youreacutie.com'];
		var origin = req.headers.origin;
		if (allowedOrigins.indexOf(origin) > -1){
			res.setHeader('Access-Control-Allow-Origin', origin);
		}
		res.setHeader('Content-Type', 'application/json');
		
		switch (result.rental_info.type){
			case 0:
				res.json(result.rental_details);
				break;
			case 1:
				res.json({location: result.rental_details[0].text_value});
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
		Listing.getRental(rental_id, false, function(result){
			sendRentalInfo(req, res, result);
		});
	}
}

//gets the current rental details and information for a listing
function getListingRental(req, res, next){
	domain_name = req.params.domain_name;
			
	//check if domain name is legit
	if (parseFloat(domain_name) === domain_name >>> 0){
		error.errorMessage(req, res, "Invalid listing!");
	}
	
	//get the current rental for the listing
	Listing.getListingRental(domain_name, false, function(result){
		sendRentalInfo(req, res, result);
	});
}

//gets the page to edit rental info
function getRentalPage(req, res, next){
	domain_name = req.params.domain_name
	rental_id = req.params.rental_id
	new_listing_info = req.session.new_listing_info;

	//we dont accept listing ids, only domain names
	if (parseFloat(domain_name) === domain_name >>> 0){
		error.errorMessage(req, res, "No such listing exists!");
	}
	
	//redirect to listing page if you just navigate to URL
	if (!new_listing_info && rental_id == "new"){
		res.redirect("/listing/" + domain_name);
	}
	//we're creating a new rental
	else if (parseFloat(rental_id) != rental_id >>> 0){
		Listing.getListingRental(domain_name, false, function(result){
			if (result.state == "success"){
				
				//get the default html for the domain
				request('http://www.' + result.listing_info.domain_name + '/reset.html', function (error, response, body) {
					if (!error && response.statusCode == 200) {
						res.render("rental.ejs", {
							user: req.user,
							listing_info: result.listing_info,
							rental_info: new_listing_info.rental_info,
							rental_html: body,
							rental_details: result.rental_details,
							new_listing_info: new_listing_info
						});
					}
				});
			}
			else {
				error.errorMessage(req, res, result.description);
			}
		});
	}
	//or editing an existing one
	else {
		delete req.session.new_listing_info;
		Listing.getListingRental(domain_name, rental_id, function(result){
			if (result.state == "success"){
				request('http://www.' + result.listing_info.domain_name + '/reset.html', function (error, response, body) {
					if (!error && response.statusCode == 200) {
						res.render("rental.ejs", {
							user: req.user,
							listing_info: result.listing_info,
							rental_info: result.rental_info,
							rental_html: body,
							rental_details: result.rental_details,
							new_listing_info: false
						});
					}
				});
			}
			else {
				error.errorMessage(req, res, result.description);
			}
		});
	}
}

//helper function to do some checks for rental posting
function rentalChecks(req, res, domain_name, user_id, type, events){
	var bool = true;
	
	//check if listing id is legit
	if (parseFloat(domain_name) === domain_name >>> 0){
		bool = false;
		error.errorMessage(req, res, "Invalid listing!", "message");
	}
	
	//check if user id is legit
	else if (parseFloat(user_id) != user_id >>> 0){
		bool = false;
		error.errorMessage(req, res, "Invalid user id!", "message");
	}
	
	//check if rental type is legit
	else if (parseFloat(type) != type >>> 0){
		bool = false;
		error.errorMessage(req, res, "Invalid rental type!", "message");
	}
	
	//check if events even exist
	else if (!events){
		bool = false;
		error.errorMessage(req, res, "Invalid date!", "message");
	}
	
	//check if all the event info are legit dates
	else if (events){
		
		for (var x = 0; x < events.length; x++){
			events[x].start = new Date(events[x].start);
			events[x].end = new Date(events[x].end);
			if (isNaN(events[x].start) || isNaN(events[x].end)){
				bool = false;
				error.errorMessage(req, res, "Invalid date!", "message");
			}
		}
	}
	
	return bool;
}

//check if rental time is legit and send user to rental edit page
function postRental(req, res, next){
	domain_name = req.params.domain_name;
	user_id = req.user.id;
	type = req.body.type;
	events = req.body.events;

	if (rentalChecks(req, res, domain_name, user_id, type, events)){
		//all gucci
		Listing.checkRentalTime(domain_name, events, req.user, function(result){
			if (result.state == "success"){
				//check if any are unavailable
				var unavailable = [];
				for (var x = 0; x < result.eventStates.length; x++){
					if (!result.eventStates[x].availability){
						unavailable.push(result.eventStates[x]);
					}
				}
				
				//some were unavailable
				if (unavailable.length){
					res.send({
						unavailable: unavailable
					});
				}
				//all good!
				else {
					var new_listing_info = {
						user: req.user,
						listing_info: result.listing_info,
						rental_info: result.eventStates,
						type: type
					}
					req.session.new_listing_info = new_listing_info;
					res.send({
						redirect: "/listing/" + domain_name + "/new"
					});
				}
			}
			else {
				error.errorMessage(req, res, result.description, "message");
			}
		});
	}
}

//function to edit a rental or create a new rental
function postRentalPage(req, res, next){
	domain_name = req.params.domain_name;
	rental_id = req.params.rental_id;
	user_id = req.user.id;
	rental_info = req.body.rental_info;
	rental_details = req.body.rental_details;
		
	//check if data is legit
	if (!rental_details || rental_details.length <= 0){
		error.errorMessage(req, res, "Invalid rental data!", "message");
	}
	else {
		//editing a rental
		if (parseFloat(rental_id) == rental_id >>> 0){
			Listing.setRentalDetails(rental_id, rental_info, rental_details, function(result){
				if (result.state == "success"){
					res.json("Success");
				}
				else {
					error.errorMessage(req, res, result.description, "message");
				}
			})
		}
		//new rental
		else if (rental_id == "new" && rentalChecks(req, res, domain_name, user_id, type, rental_info)){
			Listing.newRental(domain_name, user_id, rental_info, rental_details, function(result){
				if (result.state == "success"){
					delete req.session.new_listing_info;
					res.json("Success");
				}
				else {
					error.errorMessage(req, res, result.description, "message");
				}
			});
		}
	}
};
