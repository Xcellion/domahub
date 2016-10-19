var	listing_model = require('../models/listing_model.js');

var validator = require("validator");
var whois = require("whois");
var parser = require('parse-whois');

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
	checkRentalAddress : function(req, res, next){
		var address = addProtocol(req.body.address);

		//check for address
		if (!validator.isIP(address) && !validator.isURL(address, {protocols: ["http", "https"], require_protocol: true})){
			error.handler(req, res, "Invalid address!", "json");
		}
		//all good
		else {
			req.session.new_rental_info = {
				rental_db_info : {
					account_id: req.user.id,
					listing_id: req.session.listing_info.id,
					address: address
				}
			};
			next();
		}
	},

	//function to check times
	checkRentalTimes : function(req, res, next){
		var times = req.body.events;

		//no times posted
		if (!times || times.length <= 0){
			error.handler(req, res, "Invalid dates!", "json");
		}
		else {
			//check if its even a valid JS date
			invalid_times = [];
			var time_now = (new Date()).getTime();
			for (var x = 0; x < times.length; x++){
				temp_start = new Date(times[x].start);
				temp_end = new Date(times[x].end);
				if (isNaN(temp_start) || isNaN(temp_end) || temp_end.getTime() < time_now || temp_start.getTime() < time_now){
					invalid_times.push(times[x]);
				}
			}

			//send back any that were unavailable
			if (invalid_times.length > 0){
				res.send({unavailable : invalid_times})
			}

			else {
				//helper function, check against the DB for any unavailable times
				crossCheckRentalTime(req.session.listing_info.rentals, times, function(unavailable_times, available_times){
					//send back any that were unavailable
					if (unavailable_times.length > 0){
						res.send({unavailable : unavailable_times})
					}
					//all checks are good!
					else {
						req.session.new_rental_info.new_rental_times = available_times;
						next();
					}
				});
			}
		}
	},

	//function to calculate and check for the price
	checkRentalPrice : function(req, res, next){
		var price = calculatePrice(req.body.events, req.session.listing_info);

		//check for price
		if (!price){
			error.handler(req, res, "Invalid price!", "json");
		}
		else {
			req.session.new_rental_info.price = price;
			next();
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

	//gets the listing info and all rental info/times belonging to it for a verified and active listing
	getActiveListing : function(req, res, next) {
		Listing.getActiveListing(req.params.domain_name, function(result){
			if (result.state=="error" || (result.state == "success" && result.info.length <= 0)){error.handler(req, res, "Invalid listing!");}
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

	//function to get the stripe id of the listing owner and if listing is premium/basic
	getOwnerStripe : function(req, res, next){
		//get the stripe id of the listing owner
		Account.getStripeAndType(req.params.domain_name, function(result){
			if (result.state == "error"){error.handler(req, res, result.info);}
			else {
				req.session.new_rental_info.owner_stripe_id = result.info[0].stripe_user_id;	//stripe id
				req.session.new_rental_info.listing_exp_date = (result.info[0].exp_date) ? result.info[0].exp_date : 0;		//premium or basic listing expiration date

				next();
			}
		});
	},

	renderListingHub : function(req, res, next){
		res.render("listing_hub.ejs", {
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

		//helper function, create a new rental
		newListingRental(req, res, req.session.new_rental_info.listing_id, req.session.new_rental_info.rental_db_info, function(rental_id){

			//format it with the new rental_id from above
			formatNewRentalTimes(rental_id, req.session.new_rental_info.new_rental_times);

			//helper function, create new rental times for the above new rental
			newRentalTimes(req, res, rental_id, req.session.new_rental_info.new_rental_times, function(){
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
			delete req.session.new_rental_info;
			if (result.state != "success"){error.handler(req, res, result.description);}
			else {
				res.send({
					state: "success",
					rental_id: rental_id
				});
			}
		});
	},

}

//----------------------------------------------------------------helper functions----------------------------------------------------------------

//helper function to get specific rental info, times, and details
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

//helper function to create a new rental
function newListingRental(req, res, listing_id, raw_info, callback){
	Listing.newListingRental(req.session.new_rental_info.listing_id, raw_info, function(result){
		if (result.state != "success"){error.handler(req, res, result.description);}
		else {
			callback(result.info.insertId);
		}
	});
}

//helper function to update rental info
function updateRental(req, res, rental_id, raw_info, callback){
	Listing.updateRental(req.params.rental_id, raw_info, function(result){
		if (result.state != "success"){error.handler(req, res, result.description);}
		else {
			callback();
		}
	});
}

//----------------------------------------------------------------RENTAL TIME HELPERS----------------------------------------------------------------

//helper function to format new rental times
function formatNewRentalTimes(rental_id, times){
	//add the rental id to the formatted
	for (var x in times){
		times[x].unshift(rental_id);
		times[x].push("");
	}
}

//helper function to create new rental times
function newRentalTimes(req, res, rental_id, times, callback){
	Listing.newRentalTimes(rental_id, times, function(result){
		if (result.state != "success"){error.handler(req, res, result.description);}
		else {
			callback();
		}
	});
}

//helper function to join all rental times
function joinRentalTimes(rental_times){
	var temp_times = rental_times.slice(0);

    //loop once
    for (var x = temp_times.length - 1; x >= 0; x--){
        var orig_start = temp_times[x].date;
        var orig_end = orig_start + temp_times[x].duration;

        //loop twice to check with all others
        for (var y = temp_times.length - 1; y >= 0; y--){
            var compare_start = temp_times[y].date;
            var compare_end = compare_start + temp_times[y].duration;

            //touches bottom
            if (x != y && orig_start == compare_end){
				temp_times[y].duration = temp_times[y].duration + temp_times[x].duration;
                temp_times.splice(x, 1);
            }
        }
    }

	return temp_times;
}

//helper function to check database for availability
function crossCheckRentalTime(existing_times, new_times, callback){
	var unavailable = [];		//array of all unavailable events
	var available = [];

	//loop through all posted rental times
	for (var y = 0; y < new_times.length; y++){
		var user_start = new_times[y].start;
		var user_duration = new_times[y].end - new_times[y].start;

		var totally_new = true;

		//cross reference with all existing times
		for (var x = 0; x < existing_times.length; x++){
			//check for any overlaps that prevent it from being created
			if (checkOverlap(user_start, user_duration, existing_times[x].date, existing_times[x].duration)){
				totally_new = false;
				unavailable.push(user_times[y]);
			}
		}

		var tempValue = [];

		//totally available! format the time for DB entry
		if (totally_new){
			tempValue.push(
				user_start,
				user_duration
			);
			available.push(tempValue);
		}
	}

	//send back unavailable and formatted events
	callback(unavailable, available);
}

//helper function to check if dates overlap
function checkOverlap(dateX, durationX, dateY, durationY){
	return ((dateX.getTime() < dateY.getTime() + durationY) && (dateY.getTime() < dateX.getTime() + durationX));
}

//helper function to change a date to UTC
function toUTC(date, offset){
	date = new Date(date - (offset * 60 * 1000));
	return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),  date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
}

//helper function to run whois since domain isn't listed but is a real domain
function renderWhoIs(req, res, domain_name){
	whois.lookup(domain_name, function(err, data){
		if (err){
			//something went wrong in looking up the domain
			res.render("listing_404.ejs", {
				user: req.user
			});
		}

		//look up domain owner info
		else {
			var whoisObj = {};
			var array = parser.parseWhoIsData(data);
			for (var x = 0; x < array.length; x++){
				whoisObj[array[x].attribute] = array[x].value;
			}

			var email = whoisObj["Registrant Email"] || whoisObj["Admin Email"] || whoisObj["Tech Email"] || "";
			var owner_name = whoisObj["Registrant Organization"] || whoisObj["Registrant Name"] || "Nobody";
			var description = "This domain is currently unavailable for rent at domahub. ";

			var options = {
				user: req.user,
				listing_info: {
					domain_name: domain_name,
					email: email,
					username: owner_name,
					description: description
				}
			}

			//nobody owns it!
			if (owner_name == "Nobody"){
				options.listing_info.description += "However, it's available for purchase at the below links!";
				res.render("listing_unlisted_available.ejs", options);
			}
			//someone owns it
			else {
				options.listing_info.description += "However, if you'd like you can fill out the below time slots and we'll let the owner know!";
				res.render("listing_unlisted_unavailable.ejs", options);
			}
		}


	});
}

//---------------------------------------------------------------------------------------------------------------------------------

//helper function to add http or https
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
			var tempDuration = times[x].end - times[x].start;

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
