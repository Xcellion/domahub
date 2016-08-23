var stripe = require("stripe")("sk_test_PHd0TEZT5ytlF0qCNvmgAThp");

var request = require("request");
var url = require("url");
var val_url = require("valid-url");

var	listing_model = require('../../models/listing_model.js');

module.exports = {

	init : function(e, l){
		error = e;
		Listing = l;
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
						listing_info.rentals = result.info;
						req.session.listing_info = listing_info;
						next();
					}
				});
			}
		});
	},

	renderListing : function(req, res, next){
		res.render("listing.ejs", {
			user: req.user,
			message: Auth.messageReset(req),
			listing_info: req.session.listing_info,
			new_rental_info : req.session.new_rental_info || false,
			rental_info : req.session.rental_info || false
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

	//function to initiate editing a rental
	editRental : function(req, res, next){
		domain_name = req.params.domain_name;
		rental_id = req.params.rental_id;
		new_rental_info = req.session.new_rental_info;

		if (!new_rental_info){
			error.handler(req, res, "Invalid rental!", "json");
		}
		else {
			raw_info = {
				ip: new_rental_info.ip
			};

			updateListingRental(req, res, rental_id, raw_info, function(){
				if (new_rental_info.formatted_times){
					newRentalTimes(req, res, rental_id, new_rental_info.formatted_times, function(){
						delete req.session.new_rental_info;
						req.session.changed = true;
						res.send({message : "success"});
					});
				}
			});
		}
	},

	//function to create a new rental
	createRental : function(req, res, next){
		domain_name = req.params.domain_name;
		new_rental_info = req.session.new_rental_info;

		raw_info = {
			account_id: new_rental_info.account_id,
			listing_id: new_rental_info.listing_id,
			ip: new_rental_info.ip,
		};

		newListingRental(req, res, new_rental_info.listing_id, raw_info, function(rental_id){
			newRentalTimes(req, res, rental_id, new_rental_info.formatted_times, function(){
				delete req.session.new_rental_info;
				res.send({
					message: "success",
					rental_id: rental_id
				});
			});
		});
	}

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
					rental_info.times = result.info;
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
		//create the rental times
		else {
			callback(result.info.insertId);
		}
	});
}

//function to create new rental times
function newRentalTimes(req, res, rental_id, times, callback){
	//add the rental id to the formatted times
	for (var x in times){
		times[x].unshift(rental_id);
	}
	Listing.newRentalTimes(rental_id, times, function(result){
		if (result.state != "success"){
			Listing.deleteRental(rental_id, function(){
				error.handler(req, res, "Invalid rental times!", "json");
			})
		}
		else {
			callback();
		}
	});
}

//function to update rental info
function updateListingRental(req, res, rental_id, raw_info, callback){
	Listing.updateListingRental(req.params.rental_id, raw_info, function(result){
		if (result.state != "success"){error.handler(req, res, result.description);}
		else {
			callback();
		}
	});
}
