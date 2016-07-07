var app,
	database,
	error;
	
var request = require('request');
var stripe = require("stripe")("sk_test_PHd0TEZT5ytlF0qCNvmgAThp");

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
	
	//API for rental info
	app.get('/rental_info/:domain_name/:rental_id', getRental);
	app.get('/rental_info/:domain_name', getCurrentRental);

	//w3bbi pages
	app.get('/listing/:domain_name', getListingPage);
	app.get('/listing/:domain_name/:rental_id', isLoggedIn, getRentalPage);

	//w3bbi posts
	app.post('/listing/:domain_name/rent', isLoggedIn, postListingPage);
	app.post('/listing/:domain_name/:rental_id', isLoggedIn, postRentalPage);
}

//----------------------------------------------------------------API pages----------------------------------------------------------------

//send rental details and info for a specific rental
function getRental(req, res, next) {
	rental_id = req.params.rental_id;

	//check if rental id is legit
	if (parseFloat(rental_id) != rental_id >>> 0){
		error.handler(req, res, "Invalid rental!", "json");
	}
	else {
		Listing.getRental(rental_id, false, function(result){
			sendRentalInfo(req, res, result);
		});
	}
}

//send the current rental details and information for a listing
function getCurrentRental(req, res, next){
	domain_name = req.params.domain_name;
			
	//check if domain name is legit
	if (parseFloat(domain_name) === domain_name >>> 0){
		error.handler(req, res, "Invalid listing!", "json");
	}
	else {
		//get the current rental for the listing
		Listing.getListingRental(domain_name, false, function(result){
			sendRentalInfo(req, res, result);
		});
	}
}

//helper function to send rental information
function sendRentalInfo(req, res, result){
	if (result.state == "success"){
	
		//allow access-control list
		var allowedOrigins = [
			'http://www.youreacutie.com', 
			'http://www.imsorryimdumb.com', 
			'http://imsorryimdumb.com', 
			'http://youreacutie.com'
		];
		var origin = req.headers.origin;
		if (allowedOrigins.indexOf(origin) > -1){
			res.setHeader('Access-Control-Allow-Origin', origin);
		}
		res.setHeader('Content-Type', 'application/json');
		
		//what type of rental is it?
		switch (result.rental_info.type){
			//simple page
			case 0:
				res.json(result.rental_details);
				break;
			//simple redirect
			case 1:
				res.json({location: result.rental_details[0].text_value});
				break;
		}
	}
	else {
		error.handler(req, res, result.description, "json");
	}
}

//----------------------------------------------------------------w3bbi pages----------------------------------------------------------------

//gets the listing info and sends user to the listing page
function getListingPage(req, res, next) {
	domain_name = req.params.domain_name
	
	//we dont accept listing ids, only domain names
	if (parseFloat(domain_name) === domain_name >>> 0){
		error.handler(req, res, "Invalid listing!");
	}
	else {
		var new_listing_info = req.session.new_listing_info || false;
		
		Listing.getListingInfo(domain_name, function(result){
			if (result.state == "success"){
				var render = {
					user: req.user,
					listing_info: result.listing_info,
					new_listing_info: new_listing_info
				}
				//if redirected here from somewhere due to an error
				if (req.session.message){
					render.message = req.session.message;
					delete req.session.message;
				}
				res.render("listing.ejs", render);
			}
			
			//listing doesnt exist, redirect to main page
			else {
				error.handler(req, res, result.description);
			}
		});
	}
}

//gets the rental/listing info and sends user to the rental edit page
function getRentalPage(req, res, next){
	domain_name = req.params.domain_name
	rental_id = req.params.rental_id
	new_listing_info = req.session.new_listing_info;

	//we dont accept listing ids, only domain names
	if (parseFloat(domain_name) === domain_name >>> 0){
		error.handler(req, res, "Invalid listing!");
	}
	//redirect to listing page if rental is not a number
	else if ((parseFloat(rental_id) != rental_id >>> 0) && rental_id != "new"){
		error.handler(req, res, "Invalid rental!");
	}
	//navigated to /new directly without any rental details
	else if (!new_listing_info){
		error.handler(req, res, "No rental information!");
	}
	//we're creating a new rental
	else if (rental_id == "new"){
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
				error.handler(req, res, result.description);
			}
		});
	}
	//editing an existing rental
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
							rental_details: result.rental_details
						});
					}
				});
			}
			else {
				error.handler(req, res, result.description);
			}
		});
	}
}

//----------------------------------------------------------------w3bbi post pages----------------------------------------------------------------

//check if rental time is legit, price is legit, and send user to rental edit page
function postListingPage(req, res, next){
	domain_name = req.params.domain_name;
	user_id = req.user.id;
	type = req.body.type;
	events = req.body.events;

	if (rentalChecks(req, res, domain_name, user_id, type, events)){
		//all gucci
		Listing.checkRentalTime(domain_name, events, req.user, function(result){
			if (result.state == "success"){		
				//some were unavailable
				if (result.unavailable.length){
					res.json({
						unavailable: unavailable
					});
				}
				//all good!
				else {
					//double check price
					var price = eventPrices(events, result.listing_info);

					if (price){
						var new_listing_info = {
							user: req.user,
							listing_info: result.listing_info,
							rental_info: result.eventStates,
							type: type,
							price: price
						}
						req.session.new_listing_info = new_listing_info;
						res.send({
							redirect: "/listing/" + domain_name + "/new"
						});
					}
					else {
						error.handler(req, res, "Invalid price!");
					}

				}
			}
			else {
				error.handler(req, res, result.description);
			}
		});
	}
}

//function to edit a rental or create a new rental
function postRentalPage(req, res, next){
	user_id = req.user.id;

	domain_name = req.params.domain_name;
	rental_id = req.params.rental_id;
	rental_info = req.body.rental_info;
	rental_details = req.body.rental_details;
	
	//stripe stuff
	sess_price = req.session.new_listing_info.price;
	stripeToken = req.body.stripeToken;

	//check if data is legit
	if (!rental_details || rental_details.length <= 0){
		error.handler(req, res, "Invalid rental data!");
	}
	else {
		//editing a rental
		if (parseFloat(rental_id) == rental_id >>> 0){
			Listing.setRentalDetails(rental_id, rental_info, rental_details, function(result){
				if (result.state == "success"){
					res.json({
						message: "Success"
					});
				}
				else {
					error.handler(req, res, result.description);
				}
			})
		}
		//new rental
		else if (stripeToken && rental_id == "pay" && rentalChecks(req, res, domain_name, user_id, type, rental_info)){
		
			//triple check price
			Listing.getInfo("listings", "domain_name", domain_name, false, function(result){
				db_price = eventPrices(rental_info.rental_info, result.info[0]);
				
				if (sess_price == db_price){
					//first check if payment was good
					if (payCheck(stripeToken, db_price, domain_name) === true){
						Listing.newRental(domain_name, user_id, rental_info, rental_details, function(result){
							if (result.state == "success"){
								delete req.session.new_listing_info;
								res.json({
									message: "Success",
									rental_id: result.rental_id
								});
							}
							else {
								error.handler(req, res, result.description);
							}
						});
					}
				}
				//price was tampered with in the session
				else {
					console.log(sess_price, db_price);
				}
			});
		}
	}
};

//helper function to do some checks for rental posting
function rentalChecks(req, res, domain_name, user_id, type, events){
	var bool = true;
	
	//check if listing id is legit
	if (parseFloat(domain_name) === domain_name >>> 0){
		bool = false;
		error.handler(req, res, "Invalid listing!");
	}
	//check if user id is legit
	else if (parseFloat(user_id) != user_id >>> 0){
		bool = false;
		error.handler(req, res, "Invalid user id!");
	}
	//check if rental type is legit
	else if (parseFloat(type) != type >>> 0){
		bool = false;
		error.handler(req, res, "Invalid rental type!", "json");
	}
	//check if events even exist
	else if (!events){
		bool = false;
		error.handler(req, res, "Invalid date!", "json");
	}
	//check if all the event info are legit dates
	else if (events){
		for (var x = 0; x < events.length; x++){
			events[x].start = new Date(events[x].start);
			events[x].end = new Date(events[x].end);
			if (isNaN(events[x].start) || isNaN(events[x].end)){
				bool = false;
				error.handler(req, res, "Invalid date!");
			}
		}
	}
	
	return bool;
}

//helper function to get price of events
function eventPrices(events, listing_info){
	var weeks_price = days_price = hours_price = half_hours_price = totalPrice = 0;
		
	for (var x = 0; x < events.length; x++){
		var tempDuration = new Date(events[x].end) - new Date(events[x].start);
		
		var weeks = divided(tempDuration, 604800000);
		tempDuration = (weeks > 0) ? tempDuration -= weeks*604800000 : tempDuration;
		
		var days = divided(tempDuration, 86400000);
		tempDuration = (days > 0) ? tempDuration -= days*86400000 : tempDuration;
		
		var hours = divided(tempDuration, 3600000);
		tempDuration = (hours > 0) ? tempDuration -= hours*3600000 : tempDuration;
		
		var half_hours = divided(tempDuration, 1800000);
		tempDuration = (half_hours > 0) ? tempDuration -= half_hours*1800000 : tempDuration;
		
		weeks_price += weeks * listing_info.week_price;
		days_price += days * listing_info.day_price;
		hours_price += hours * listing_info.hour_price;
		half_hours_price += half_hours * listing_info.hour_price;
	}
	
	totalPrice = weeks_price + days_price + hours_price + half_hours_price;
	
	return totalPrice;
}

//helper function to divide number
function divided(num, den){
    return Math[num > 0 ? 'floor' : 'ceil'](num / den);
}

//function to pay via stripe
function payCheck(stripeToken, price, domain_name){
	var bool = true;
	
	console.log("Stripe token is - " + stripeToken);

	var charge = stripe.charges.create({
		amount: price * 100, // amount in cents
		currency: "usd",
		source: stripeToken,
		description: "Rental for " + domain_name
	}, function(err, charge) {
		if (err && err.type === 'StripeCardError') {
			// The card has been declined
			console.log(err);
			bool = false;
		}
	});
	return bool;
}