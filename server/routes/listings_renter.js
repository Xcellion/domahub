var	listing_model = require('../models/listing_model.js');

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

		raw_info = {
			ip: new_rental_info.ip
		};

		//format any new times and combine with any times that need to be updates
		formatted_times = formatNewRentalTimes(rental_id, new_rental_info.formatted_times);
		combined_array = formatted_times.concat(new_rental_info.to_update);

		updateRental(req, res, rental_id, raw_info, function(){
			newRentalTimes(req, res, rental_id, combined_array, function(){
				delete req.session.new_rental_info;
				req.session.changed = true;
				res.send({message : "success"});
			});
		});
	},

	//function to create a new rental
	createRental : function(req, res, next){
		req.user.refresh_rental = true;		//to refresh the user object's list of rentals
		domain_name = req.params.domain_name;
		new_rental_info = req.session.new_rental_info;

		raw_info = {
			account_id: new_rental_info.account_id,
			listing_id: new_rental_info.listing_id,
			ip: new_rental_info.ip,
		};

		newListingRental(req, res, new_rental_info.listing_id, raw_info, function(rental_id){

			//format any new times
			formatted_times = formatNewRentalTimes(rental_id, new_rental_info.formatted_times);

			newRentalTimes(req, res, rental_id, formatted_times, function(state){
				if (state == "error"){
					Listing.deleteRental(rental_id, function(){
						error.handler(req, res, "Invalid rental times!", "json");
					})
				}
				else {
					delete req.session.new_rental_info;
					res.send({
						state: "success",
						rental_id: rental_id
					});
				}
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
		if (result.state != "success"){
			callback("error");
		}
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
