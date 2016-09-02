var	listing_model = require('../models/listing_model.js');
var	data_model = require('../models/data_model.js');
var listings_renter = require("./listings_renter");
var listings_owner = require("./listings_owner");

var stripe = require("stripe")("sk_test_PHd0TEZT5ytlF0qCNvmgAThp");		//stripe API

var validator = require("validator");
var whois = require("whois");
var parser = require('parse-whois');

module.exports = function(app, db, auth, e){
	//models
	Listing = new listing_model(db);
	Data = new data_model(db);

	error = e;
	isLoggedIn = auth.isLoggedIn;

	//initiate the two types of listing routes
	listings_owner.init(e, Listing);
	listings_renter.init(e, Listing);

	//------------------------------------------------------------------------------------------------ LISTING RELATED

	//render create listing page
	app.get('/listing/create', [
		isLoggedIn,
		listings_owner.renderCreateListing
	]);

	//redirect all /create to proper /create
	app.get('/listing/create*', function(req, res){
		res.redirect("/listing/create");
	})

	//create a single listing
	app.post('/listing/create', [
		isLoggedIn,
		listings_owner.checkListingCreate,
		listings_owner.createListing
	]);

	//create multiple listings
	app.post('/listing/create/batch', [
		isLoggedIn,
		listings_owner.uploadSizeCheck,
		listings_owner.checkListingBatch,
		listings_owner.createListingBatch
	]);

	//------------------------------------------------------------------------------------------------ RENTAL RELATED

	//render the 404 listing page
	app.get('/listing', [
		listings_renter.renderListing404
	]);

	//w3bbi easter egg page
	app.get('/listing/w3bbi.com', function(req, res){
		res.render("listing_w3bbi.ejs", {
			user: req.user,
			message: Auth.messageReset(req)
		})
	});

	//render listing page
	app.get('/listing/:domain_name', [
		checkDomain,
		listings_renter.getListing,
		listings_renter.renderListing
	]);

	//render a specific rental
	app.get('/listing/:domain_name/:rental_id', [
		isLoggedIn,
		checkDomain,
		checkRental,
		listings_renter.getListing,
		listings_renter.getRental,
		listings_renter.renderListing
	]);

	//create a new rental
	app.post('/listing/:domain_name/rent', [
		isLoggedIn,
		checkDomain,
		listings_renter.getListing,
		checkNewRentalInfo,
		listings_renter.createRental
	]);

	//editing an existing rental
	app.post('/listing/:domain_name/:rental_id', [
		isLoggedIn,
		checkDomain,
		checkRental,
		listings_renter.getListing,
		checkNewRentalInfo,
		listings_renter.editRental
	]);
}

//check if listing exists
function checkDomain(req, res, next){
	var domain_name = req.params.domain_name || req.body.domain_name;

	if (!validator.isFQDN(domain_name)){
		error.handler(req, res, "Invalid domain name!");
	}
	else {
		//if already got the info from previous session
		if (req.session.listing_info && (req.session.listing_info.domain_name == domain_name)){
			next();
		}
		else {
			delete req.session.listing_info;
			delete req.session.rental_info;
			delete req.session.new_rental_info;

			//first check to see if listing is legit
			Listing.checkListing(domain_name, function(result){
				listing_result = result;

				//add to search history
				account_id = (typeof req.user == "undefined") ? null : req.user.id;
				var now = new Date();
				var now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());

				history_info = {
					account_id: account_id,			//who searched if who exists
					domain_name: domain_name.toLowerCase(),		//what they searched for
					search_timestamp: now_utc		//when they searched for it
				}

				Data.newSearchHistory(history_info, function(result){
					//doesnt exist!
					if (!listing_result.info.length || listing_result.state == "error"){
						renderWhoIs(req, res, domain_name);
					}
					//exists! handle the rest of the route
					else {
						next();
					}
				})
			});
		}
	}
}

//helper function to run whois since domain isn't listed but is a real domain
function renderWhoIs(req, res, domain_name){
	whois.lookup(domain_name, function(err, data){
		var whoisObj = {};
		if (!err){
			var array = parser.parseWhoIsData(data);
			for (var x = 0; x < array.length; x++){
				whoisObj[array[x].attribute] = array[x].value;
			}
		}
		email = whoisObj["Registrant Email"] || whoisObj["Admin Email"] || whoisObj["Tech Email"] || "";
		owner_name = whoisObj["Registrant Organization"] || whoisObj["Registrant Name"] || "Nobody";
		description = "This domain is currently unavailable for rent at w3bbi. "

		if (owner_name == "Nobody"){
			description += "However, it's available for purchase at the below links!";
		}
		else {
			description += "However, if you'd like you can fill out the below time slots and we'll let the owner know!";
		}

		res.render("listing.ejs", {
			user: req.user,
			message: Auth.messageReset(req),
			whoisObj: whoisObj,
			listing_info: {
				domain_name: domain_name,
				email: email,
				fullname: owner_name,
				price_type: false,
				description: description
			},
			new_rental_info : false,
			rental_info : false,
			available: (owner_name == "Nobody") ? 1 : 2
		});
	});
}


//check if rental belongs to account and exists
function checkRental(req, res, next){
	var domain_name = req.params.domain_name;
	var rental_id = req.params.rental_id;

	//if already got the info from previous session
	if (req.session.def_rental_info && req.session.rental_info
		&& (req.session.rental_info.rental_id == rental_id)
	){
		next();
	}
	else if ((parseFloat(rental_id) != rental_id >>> 0) && rental_id != "new"){
		error.handler(req, res, "Invalid rental!");
	}
	else {
		delete req.session.rental_info;
		delete req.session.def_rental_info;
		//check if account owns that rental
		Listing.checkAccountRental(req.user.id, rental_id, function(result){
			if (result.state == "error" || result.info.length == 0){error.handler(req, res, "Invalid user / rental!");}
			else {
				//check if that rental belongs to that listing
				Listing.checkListingRental(rental_id, domain_name, function(result){
					if (result.state == "error" || result.info.length == 0){error.handler(req, res, "Invalid rental!");}
					else {
						next();
					}
				});
			}
		});
	}
}

//function to check the rental info posted
function checkNewRentalInfo(req, res, next){
	domain_name = req.params.domain_name;
	times = req.body.events;
	ip = req.body.ip;
	price = calculatePrice(times, req.session.listing_info);
	stripeToken = req.body.stripeToken;

	bool = true;	//bool to check for new or edit

	//if its an entirely new rental
	if (!req.session.rental_info && !req.body.rental_id){
		if (!times || times.length <= 0){
			bool = false;
			error.handler(req, res, "Invalid date!", "json");
		}
		else if (!price){
			bool = false;
			error.handler(req, res, "Invalid price!");
		}
	}
	//passed above checks, continue to check for IP and times
	if (bool && !ValidateIPaddress(ip)){
		error.handler(req, res, "Invalid IP address!", "json");
	}
	else {
		//check if its even a valid JS date
		if (times){
			invalid_times = [];

			for (var x = 0; x < times.length; x++){
				times[x].start = new Date(times[x].start);
				times[x].end = new Date(times[x].end);
				if (isNaN(times[x].start) || isNaN(times[x].end)){
					invalid_times.push(times[x]);
				}
			}

			if (invalid_times.length > 0){
				res.send({unavailable : invalid_times})
			}
			//if all are valid dates, check the DB if they're available
			else {
				checkRentalTime(req.session.listing_info.id, times, function(invalid_times, formatted_times){
					if (invalid_times.length > 0){
						res.send({unavailable : invalid_times})
					}
					else {
						//check pricing since new times exist
						if (payCheck(stripeToken, price, domain_name)){
							req.session.new_rental_info = {
								account_id: req.user.id,
								listing_id: req.session.listing_info.id,
								formatted_times : formatted_times,
								ip: ip
							};
							next();
						}
						else {
							error.handler(req, res, "Invalid price!");
						}
					}
				});
			}
		}

		//no new times exist, just update the rental info
		else {
			req.session.new_rental_info = {
				account_id: req.user.id,
				listing_id: req.session.listing_info.id,
				formatted_times : false,
				ip: ip
			};
			next();
		}
	}
}

//function to check database for availability
function checkRentalTime(listing_id, times, callback){
	Listing.checkRentalTime(listing_id, times, function(result){
		invalid_times = result.unavailable;
		formatted_times = result.formatted;

		callback(invalid_times, formatted_times);
	});
}


//---------------------------------------------------------------------------------------------------------------------------------

//helper function to divide number
function divided(num, den){
    return Math[num > 0 ? 'floor' : 'ceil'](num / den);
}

//helper function to get price of events
function calculatePrice(times, listing_info){
	if (times && listing_info){
		var weeks_price = days_price = hours_price = half_hours_price = totalPrice = 0;

		for (var x = 0; x < times.length; x++){
			var tempDuration = new Date(times[x].end) - new Date(times[x].start);

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
	else {return false;}
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

//helper function to validate ip address
function ValidateIPaddress(ipaddress){
	return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress)
}
