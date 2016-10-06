var	listing_model = require('../models/listing_model.js');

var validator = require("validator");
var node_env = process.env.NODE_ENV || 'dev'; 	//dev or prod bool
if (node_env == "dev"){
	var stripe = require("stripe")("sk_test_PHd0TEZT5ytlF0qCNvmgAThp");		//stripe API development key
}
else {
	var stripe = require("stripe")("sk_test_PHd0TEZT5ytlF0qCNvmgAThp");		//stripe API production key
}

module.exports = {

	init : function(e, l){
		error = e;
		Listing = l;
	},

	//check if rental belongs to account and exists
	checkRental : function(req, res, next){
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
	},

	//function to check the rental info posted
	checkNewRentalInfo : function(req, res, next){
		domain_name = req.params.domain_name;
		times = req.body.events;
		address = addProtocol(req.body.address);
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
		//passed above checks, continue to check for address and times
		if (bool && !validator.isIP(address) && !validator.isURL(address, {protocols: ["http", "https"], require_protocol: true})){
			error.handler(req, res, "Invalid address!", "json");
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
					checkRentalTime(req.session.listing_info.id, times, function(invalid_times, formatted_times, to_update, delete_stuff){
						if (invalid_times.length > 0 || (formatted_times.length == 0 && to_update.length == 0)){
							res.send({unavailable : invalid_times})
						}
						//all checks are good!
						else {
							req.session.new_rental_info = {
								account_id: req.user.id,
								listing_id: req.session.listing_info.id,
								formatted_times : formatted_times,
								to_update: to_update,
								delete_stuff: delete_stuff,
								address: address,
								price: price,
								stripeToken: stripeToken
							};
							next();
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
					address: address
				};
				next();
			}
		}
	},

	//check if listing is a valid domain name and add it to the search history
	checkDomainAndAddToSearch : function(req, res, next){
		var domain_name = req.params.domain_name || req.body["domain-name"];

		if (!validator.isFQDN(domain_name)){
			error.handler(req, res, "Invalid domain name!");
		}
		else {
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
	},

	//gets the listing info and all rental info/times belonging to it
	getListing : function(req, res, next) {
		domain_name = req.params.domain_name

		Listing.getListing(domain_name, function(result){
			if (result.state=="error"){error.handler(req, res, result.info);}
			else {
				listing_info = result.info[0];

				//get rental info for that listing
				Listing.getListingRentalsInfo(listing_info.id, function(result){
					if (result.state=="error"){error.handler(req, res, result.info);}
					else {
						listing_info.rentals = joinRentalTimes(result.info);
						req.session.listing_info = listing_info;
						next();
					}
				});
			}
		});
	},

	//gets the rental/listing info and sends user to the rental edit page
	getRental : function(req, res, next){
		domain_name = req.params.domain_name;
		rental_id = req.params.rental_id;

		//if already got the info from previous session
		if (req.session.changed || !req.session.rental_info || (req.session.rental_info.rental_id != rental_id)){
			delete req.session.changed;
			getRental(req, res, rental_id, function(rental_info){
				req.session.rental_info = rental_info;
				next();
			});
		}
		//get it otherwise
		else {
			next()
		}
	},

	renderListing404 : function(req, res, next){
		res.render("listing_404.ejs", {
			user: req.user
		});
	},

	renderListing : function(req, res, next){
		//clear out rental_id session if navigating back
		if (!req.params.rental_id){
			delete req.session.rental_info;
			delete req.session.new_rental_info;
		}

		res.render("listing.ejs", {
			user: req.user,
			message: Auth.messageReset(req),
			listing_info: req.session.listing_info,
			new_rental_info : req.session.new_rental_info || false,
			rental_info : req.session.rental_info || false,
			available: 3
		});
	},

	//function to create a new rental
	createRental : function(req, res, next){
		domain_name = req.params.domain_name;
		new_rental_info = req.session.new_rental_info;

		raw_info = {
			account_id: new_rental_info.account_id,
			listing_id: new_rental_info.listing_id,
			address: new_rental_info.address,
		};

		newListingRental(req, res, new_rental_info.listing_id, raw_info, function(rental_id){

			//format any new times
			formatted_times = formatNewRentalTimes(rental_id, new_rental_info.formatted_times);

			newRentalTimes(req, res, rental_id, new_rental_info.formatted_times, function(){
				req.session.new_rental_info.rental_id = rental_id;
				next();
			});
		});
	},

	//function to initiate editing a rental
	editRental : function(req, res, next){
		domain_name = req.params.domain_name;
		rental_id = req.params.rental_id;
		new_rental_info = req.session.new_rental_info;

		raw_info = {
			address: new_rental_info.address
		};

		formatted_times = formatNewRentalTimes(rental_id, new_rental_info.formatted_times);

		updateRental(req, res, rental_id, raw_info, function(){
			newRentalTimes(req, res, rental_id, new_rental_info.formatted_times, function(){
				delete req.session.new_rental_info;
				req.session.changed = true;
				res.send({message : "success"});
			});
		});
	},

	//activate the rental once its good
	toggleActivateRental: function(req, res, next){
		rental_id = req.session.new_rental_info.rental_id;

		Listing.toggleActivateRental(rental_id, function(result){
			if (result.state != "success"){error.handler(req, res, result.description);}
			else {
				delete req.session.new_rental_info;
				res.send({
					state: "success",
					rental_id: rental_id
				});
			}
		});
	},

	//function to charge account
	chargeMoney : function(req, res, next){
		domain_name = req.params.domain_name;
		price = req.session.new_rental_info.price;
		stripeToken = req.session.new_rental_info.stripeToken;
		rental_id = req.session.new_rental_info.rental_id;

		//get the stripe id of the listing owner
		Account.getStripeAndType(domain_name, function(result){
			if (result.state == "error"){error.handler(req, res, result.info);}
			else {
				stripe_id = result.info[0].stripe_user_id;
				type = result.info[0].type;

				//check pricing
				payCheck(stripe_id, stripeToken, price, domain_name, type, function(bool){
					if (bool){
						next();
					}
					else {
						error.handler(req, res, "Invalid price!");
					}
				});
			}
		});
	},
}

//----------------------------------------------------------------helper functions----------------------------------------------------------------

//function to get specific rental info, times, and details
function getRental(req, res, rental_id, callback){
	Listing.getRentalInfo(rental_id, function(result){
		if (result.state != "success"){error.handler(req, res, result.description);}
		else {
			rental_info = result.info[0];

			Listing.getRentalTimes(rental_id, function(result){
				if (result.state != "success"){error.handler(req, res, result.description);}
				else {
					rental_info.times = joinRentalTimes(result.info);
					callback(rental_info);
				}
			});
		}
	});
}

//function to create a new rental
function newListingRental(req, res, listing_id, raw_info, callback){
	Listing.newListingRental(new_rental_info.listing_id, raw_info, function(result){
		if (result.state != "success"){error.handler(req, res, result.description);}
		else {
			callback(result.info.insertId);
		}
	});
}

//function to format new rental times
function formatNewRentalTimes(rental_id, times){
	//add the rental id to the formatted
	for (var x in times){
		times[x].unshift(rental_id);
		times[x].push("");
	}
	return times;
}

//function to create new rental times
function newRentalTimes(req, res, rental_id, times, callback){
	Listing.newRentalTimes(rental_id, times, function(result){
		if (result.state != "success"){error.handler(req, res, result.description);}
		else {
			callback();
		}
	});
}

//function to update rental info
function updateRental(req, res, rental_id, raw_info, callback){
	Listing.updateRental(req.params.rental_id, raw_info, function(result){
		if (result.state != "success"){error.handler(req, res, result.description);}
		else {
			callback();
		}
	});
}

//function to join all rental times
function joinRentalTimes(rental_times){
	var temp_times = rental_times.slice(0);

    //loop once
    for (var x = temp_times.length - 1; x >= 0; x--){
        var orig_start = new Date(temp_times[x].date);
        var orig_end = new Date(orig_start.getTime() + temp_times[x].duration);

        //loop twice to check with all others
        for (var y = temp_times.length - 1; y >= 0; y--){
            var compare_start = new Date(temp_times[y].date);
            var compare_end = new Date(compare_start.getTime() + temp_times[y].duration);

            //touches bottom
            if (x != y && orig_start.getTime() == compare_end.getTime()){
				temp_times[y].duration = temp_times[y].duration + temp_times[x].duration;
                temp_times.splice(x, 1);
            }
        }
    }

	return temp_times;
}

//function to check database for availability
function checkRentalTime(listing_id, times, callback){
	Listing.checkRentalTime(listing_id, times, function(result){
		if (result.state == "error"){error.handler(req, res, result.info);}
		else {
			invalid_times = result.unavailable;
			formatted_times = result.formatted;
			to_update = result.to_update;
			delete_stuff = result.delete_stuff;

			callback(invalid_times, formatted_times, to_update, delete_stuff);
		}
	});
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
		description = "This domain is currently unavailable for rent at domahub. "

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
				username: owner_name,
				status: false,
				description: description
			},
			new_rental_info : false,
			rental_info : false,
			available: (owner_name == "Nobody") ? 1 : 2
		});
	});
}

//---------------------------------------------------------------------------------------------------------------------------------

//function to add http or https
function addProtocol(address){
	if (!validator.isURL(address, {
		protocols: ["http", "https"],
		require_protocol: true
	})){
		address = "http://" + address;
	}
	return address;
}

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
function payCheck(stripe_id, stripeToken, price, domain_name, type, cb){
	var total_price = price * 100;		//USD in cents
	var application_fee = (type == 1) ? total_price / 10 : 0;		//application fee if the listing is basic
	var customer_pays = total_price - application_fee;

	var stripeOptions = {
		amount: customer_pays, // amount in cents
		currency: "usd",
		source: stripeToken,
		description: "Rental for " + domain_name
	}

	if (application_fee > 0){
		stripeOptions.application_fee = application_fee;
	}

	//charge the end user, transfer to the owner, take 10% if its a basic listing
	stripe.charges.create(stripeOptions, {
		stripe_account: stripe_id
	}, function(err, charge) {
		if (err) {
			console.log(err);
			cb(false);
		}
		else {
			console.log("Payment processed! " + stripe_id + " has been paid " + customer_pays + " with " + application_fee + " in Doma fees.")
			cb(true);
		}
	});
}
