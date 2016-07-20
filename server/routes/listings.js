var stripe = require("stripe")("sk_test_PHd0TEZT5ytlF0qCNvmgAThp");

var crypto = require('crypto');

var request = require("request");
var dns = require("dns");
var url = require("url");
var val_url = require("valid-url");

var	account_model = require('../models/account_model.js'),
	listing_model = require('../models/listing_model.js'),
	Account,
	Passport;

module.exports = function(app, db, auth, e){
	error = e;

	Account = new account_model(db);
	Listing = new listing_model(db);

	//function to check if logged in
	isLoggedIn = auth.isLoggedIn;

	app.get('/listing', getSearchListing);
	app.get('/listing/:domain_name', getListing);
	app.get('/listing/:domain_name/activate', isLoggedIn, getActivateHash);
	app.get('/listing/:domain_name/:rental_id', isLoggedIn, getRental);

	app.post("/listing", postSearchListing);
	app.post('/listing/:domain_name/activate', isLoggedIn, activateListing);
	app.post('/listing/:domain_name/rent', isLoggedIn, postListing);
	app.post('/listing/:domain_name/edit', isLoggedIn, editRental);
	app.post('/listing/:domain_name/:rental_id', isLoggedIn, postRental);
}

//----------------------------------------------------------------w3bbi pages----------------------------------------------------------------

//listing page to search for domain name availability
function getSearchListing(req, res, next){
	res.render("listings");
}

function addhttp(url) {
    if (!/^(?:f|ht)tps?\:\/\//.test(url)) {
        url = "http://" + url;
    }
    return url;
}

//search for a specific domain name
function postSearchListing(req, res, next){
	domain_name = url.parse(addhttp(req.body.domain_name)).host;

	if (!val_url.isUri(addhttp(domain_name))){
		error.handler(req, res, "Invalid domain name!");
	}
	else{
		Listing.getListingInfo(domain_name, function(result){
			if (result.state == "error"){
				request({
					url: 'https://api.ote-godaddy.com/v1/domains/available?domain='+ domain_name + '&checkType=FAST&forTransfer=false',
					headers: {
						"Authorization": "sso-key VUxKSUdS_77eVNvivVEXKyjCTTUweLk:77eYkfS7McHYHvcAv9fZdN",
					}
				}, function (error, response, body) {
					if (!error && response.statusCode == 200) {
						res.json(JSON.parse(body));
					}
					else {
						console.log(error, response);
					}
				})
			}
			else {
				res.json({
					redirect: result.listing_info
				})
			}
		});
	}

}

function getActivateHash(req, res, next){
	account_id = req.user.id;
	domain_name = req.params.domain_name;

	if (!req.header("Referer") || req.header("Referer").split("/").pop() == "activate"){
		error.handler(req, res, "Cannot activate through URL!");
	}
	//check if user id is legit
	else if (parseFloat(account_id) != account_id >>> 0){
		error.handler(req, res, "Invalid user!");
	}
	//check if domain is legit
	else if (!val_url.isUri(addhttp(domain_name))){
		console.log(domain_name, addhttp(domain_name), val_url.isUri(addhttp(domain_name)))
		error.handler(req, res, "Invalid listing activation!");
	}
	else {
		Listing.getInfo("listings", "domain_name", domain_name, false, function(result){
			if (result.state == "success"){
				var hash = crypto.createHash('md5').update('"' + result.info[0].date_created + result.info[0].id + result.info[0].owner_id + '"').digest('hex');
				res.send(hash);
			}
			else {
				error.handler(req, res, "Invalid listing!");
			}
		})
	}
}

//function to change listing to active
function activateListing(req, res, next){
	account_id = req.user.id;
	domain_name = req.params.domain_name;
	activation_type = req.body.activation_type;

	//check if user id is legit
	if (parseFloat(account_id) != account_id >>> 0){
		error.handler(req, res, "Invalid user!");
	}
	//check if domain is legit
	else if (!val_url.isUri(addhttp(domain_name))){
		console.log(domain_name, addhttp(domain_name), val_url.isUri(addhttp(domain_name)))
		error.handler(req, res, "Invalid listing activation!");
	}
	else {
		var activate = false;
		Listing.getInfo("listings", "domain_name", domain_name, false, function(result){
			if (result.state == "success"){
				var hash = crypto.createHash('md5').update('"' + result.info.date_created + result.info.id + result.info.owner_id + '"').digest('hex');
			}
			else {
				error.handler(req, res, "Invalid listing!");
			}
		})

		switch (activation_type){

			//using a DNS txt record to prove ownership
			case ("txt"):
				dns.resolveTxt(domain_name, function(err, values){
					if (err){
						console.log(err);
					}
					else {
						for (var x = 0; x < values.length; x++){
							if (values[x][0] == hash){
								activate = true;
								break;
							}
						}
					}
				})
				break;

			//using a custom html file to prove ownership
			case ("html"):
				break;

			//using a custom meta file in the main index page of the website to prove ownership
			case ("meta"):
				break;

			//utilizing a custom header in the htaccess file to prove ownership
			case ("htaccess"):
				request({
					url: addhttp(domain_name)
				}, function (error, response, body) {
					if (!error && response.statusCode == 200) {
						if (response.headers.w3bbi == hash){
							activate = true;
						}
					}
					else {
						console.log(error, response);
					}
				})
				break;

			default:
				error.handler(req, res, "Invalid activation type!");
				break;
		}
	}
}


//gets the listing info and sends user to the listing page
function getListing(req, res, next) {
	domain_name = req.params.domain_name

	//we dont accept listing ids, only domain names
	if (parseFloat(domain_name) === domain_name >>> 0){
		error.handler(req, res, "Invalid listing!");
	}
	else {
		var new_rental_info = req.session.new_rental_info || false;
		var old_rental_info = req.session.old_rental_info || false;

		Listing.getListingInfo(domain_name, function(result){
			if (result.state == "success"){
				var render = {
					user: req.user,
					listing_info: result.listing_info,
					new_rental_info: new_rental_info,
					old_rental_info: old_rental_info
				}
				//if redirected here from somewhere due to an error
				if (req.session.message){
					render.message = Auth.messageReset(req);
				}

				//if sending just the updated listing info instead of the whole page
				if (req.header("page-or-data") == "data"){
					res.json(result.listing_info);
				}
				else {
					res.render("listing.ejs", render);
				}
			}

			//listing doesnt exist, redirect to main page
			else {
				error.handler(req, res, result.description);
			}
		});
	}
}

//gets the rental/listing info and sends user to the rental edit page
function getRental(req, res, next){
	account_id = req.user.id;
	domain_name = req.params.domain_name;
	rental_id = req.params.rental_id;
	new_rental_info = req.session.new_rental_info;
	old_rental_info = req.session.old_rental_info;

	//we dont accept listing ids, only domain names
	if (parseFloat(domain_name) === domain_name >>> 0){
		error.handler(req, res, "Invalid listing!");
	}
	//redirect to listing page if rental is not a number
	else if ((parseFloat(rental_id) != rental_id >>> 0) && rental_id != "new"){
		error.handler(req, res, "Invalid rental!");
	}
	//navigated to /new directly without any rental details
	else if ((parseFloat(rental_id) != rental_id >>> 0) && !new_rental_info){
		error.handler(req, res, "No rental information!");
	}
	//we're creating a new rental
	else if (rental_id == "new"){
		Listing.getListingRental(domain_name, false, false, function(result){
			if (result.state == "success"){
				res.render("rental.ejs", {
					user: req.user,
					listing_info: result.listing_info,
					rental_html: body,
					rental_info: undefined,
					rental_details: result.rental_details,
					new_rental_info: new_rental_info
				});
			}
			else {
				error.handler(req, res, result.description);
			}
		});
	}
	//editing an existing rental
	else {
		Listing.getListingRental(domain_name, rental_id, account_id, function(result){
			if (result.state == "success"){
				if (result.rental_info.same_details){
					console.log("Same details found! Redirecting...");
					res.redirect("/listing/" + domain_name + "/" + result.rental_info.same_details);
				}
				else {
					var render = {
						user: req.user,
						listing_info: result.listing_info,
						rental_info: result.rental_info,
						rental_details: result.rental_details
					}
					res.render("rental.ejs", render);
				}
			}
			else {
				error.handler(req, res, result.description);
			}
		});
	}
}

//----------------------------------------------------------------w3bbi post pages----------------------------------------------------------------

//check if rental time is legit, price is legit, and send user to rental edit page
function postListing(req, res, next){
	domain_name = req.params.domain_name;
	user_id = req.user.id;
	type = req.body.type;
	events = req.body.events;

	if (req.body.old_rental_info != "false"){
		req.session.old_rental_info = req.body.old_rental_info;
		if (!events){
			events = [];
		}
	}
	else {
		delete req.session.old_rental_info;
	}
	old_rental_info = req.session.old_rental_info || false;
	if (rentalChecks(req, res, domain_name, user_id, type, events)){
		//various rental checks are all gucci
		Listing.checkRentalTime(domain_name, events, req.user, function(result){
			if (result.state == "success"){
				//some were unavailable
				if (result.unavailable.length){
					res.json({
						unavailable: result.unavailable
					});
				}
				//all good!
				else {
					//double check price
					var price = eventPrices(events, result.listing_info);

					if (price){
						var new_rental_info = {
								user: req.user,
								listing_info: result.listing_info,
								rentals: result.eventStates,
								type: type,
								price: price
							}

						req.session.new_rental_info = new_rental_info;
					}
					else if (parseFloat(old_rental_info.rental_id) != old_rental_info.rental_id >>> 0 && events.length === 0){
						error.handler(req, res, "Invalid price!");
					}

					//update the type of rental
					if (parseFloat(old_rental_info.rental_id) === old_rental_info.rental_id >>> 0){
						Listing.setInfo("rentals", "rental_id", old_rental_info.rental_id, {type: type}, false, function(result){
							if (result.state == "success"){
								res.send({redirect: "/listing/" + domain_name + "/" + old_rental_info.rental_id});
							}
							else {
								error.handler(req, res, result.description);
							}
						});
					}
					//no old rental to update
					else if (price){
						res.send({redirect: "/listing/" + domain_name + "/new"});
					}
				}
			}
			else {
				error.handler(req, res, result.description);
			}
		});
	}
}

//function to initiate editing a rental
function editRental(req, res, next){
	user_id = req.user.id;
	domain_name = req.params.domain_name;
	rental_id = req.body.rental_id;

	//check if rental is legit
	if (parseFloat(rental_id) != rental_id >>> 0){
		error.handler(req, res, "Invalid rental!", "json");
	}
	else {
		req.session.old_rental_info = {
			rental_id: rental_id
		}
		res.redirect("/listing/" + domain_name);
	}
}

//function to edit a rental or create a new rental
function postRental(req, res, next){
	user_id = req.user.id;

	domain_name = req.params.domain_name;
	rental_id = req.params.rental_id;
	rental_info = req.body.rental_info;
	rental_details = req.body.rental_details;

	if (old_rental_info){
		rental_info.old_rental_info = req.session.old_rental_info;
	}

	//check if data is legit
	if (!rental_details || rental_details.length <= 0){
		error.handler(req, res, "Invalid rental data!");
	}
	else {
		//editing a rental
		if (parseFloat(rental_id) == rental_id >>> 0){
			Listing.setRental(rental_id, rental_info, rental_details, function(result){
				if (result.state == "success"){
					delete req.session.old_rental_info;
					res.json({
						message: "success"
					});
				}
				else {
					error.handler(req, res, result.description);
				}
			})
		}
		//new rental
		else if (rental_id == "pay" && rentalChecks(req, res, domain_name, user_id, type, rental_info)){
			//stripe stuff
			sess_price = req.session.new_rental_info.price;
			stripeToken = req.body.stripeToken;

			//triple check price
			Listing.getInfo("listings", "domain_name", domain_name, false, function(result){
				db_price = eventPrices(rental_info.rentals, result.info[0]);

				if (sess_price == db_price){
					//first check if payment was good
					if (payCheck(stripeToken, db_price, domain_name) === true){
						Listing.newRental(domain_name, user_id, rental_info, rental_info.rentals, rental_details, function(result){
							if (result.state == "success"){
								delete req.session.new_rental_info;
								delete req.session.old_rental_info;
								res.json({
									message: "success",
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
