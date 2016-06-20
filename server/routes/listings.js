var app,
	database;

var	account_model = require('../models/account_model.js'),
	listing_model = require('../models/listing_model.js'),
	Account,
	Passport;

module.exports = function(app_pass, db, auth){
	app = app_pass;
	database = db;
	
	Account = new account_model(database);
	Listing = new listing_model(database, Account);
		
	//function to check if logged in
	isLoggedIn = auth.isLoggedIn;

	app.get('/listing/:listing', getListing);
	app.get('/rental_info/:domain_name/:rental_id', getRentalDetails);
	app.get('/rental_info/:domain_name', getRentalDetails);
	
	app.post('/listing/:listing/rent', isLoggedIn, postRental);
}

//gets the listing info
function getListing(req, res, next) {
	listing = req.params.listing
	whereParam = "";
	
	//listing id?
	if (parseFloat(listing) === listing >>> 0){
		console.log("Attempting to get info for listing #" + listing);
		whereParam = "id";
	}
	//or listing name?
	else {
		console.log("Attempting to get info for listing " + listing);
		whereParam = "domain_name";
	}
	
	//get basic listing info
	Listing.getInfo("listings", whereParam, listing, false, function(result){
		if (result.state == "success" && result.info){
			info = result.info[0];
			listing = result.info[0].id;
			
			//get all rental info for that listing that is not default
			Listing.getInfo("rentals", "listing_id", listing, ' AND date != "0000-00-00 00:00:00"', function(result){
				if (result.state == "success"){
					info.rentals = result.info;
					res.render("listing.ejs", {
						user: req.user,
						info: info
					});
				}
				else {
					req.session.message = "Rental listing error!"
					res.redirect("/");
				}
			});
		}
		//listing doesnt exist
		else {
			req.session.message = "No such listing exists!"
			res.redirect("/");
		}
	});
}

//gets the file information for a particular rental
function getRentalDetails(req, res, next){
	domain_name = req.params.domain_name;
	rental_id = req.params.rental_id || false;
	
	if (rental_id){
		console.log("Attempting to get rental info for domain " + domain_name + " and rental #" + rental_id);
	}
	else{
		console.log("Attempting to get current rental info for domain " + domain_name);
	}
	
	//doesnt matter if its a rental id or not
	Listing.getRentalDetails(domain_name, rental_id, function(result){
		if (result.state == "success"){
			res.jsonp(result.info);
		}
		else {
			res.status(404).send('Not found');
		}
	});
}

//create a new rental for a listing
function postRental(req, res, next){
	listing_id = req.params.listing
	events = req.body.events;
	user_id = req.user.id;
		
	//check if listing id is legit
	if (parseFloat(listing_id) != listing_id >>> 0){
		req.session.message = "Invalid listing!";
		res.redirect("/");
	}
	
	//check if user id is legit
	else if (parseFloat(user_id) != user_id >>> 0){
		req.session.message = "Invalid user id!";
		res.redirect("/");
	}
	
	//check if events even exist
	else if (!events){
		req.session.message = "Invalid date!";
		res.redirect("/");
	}
	
	//check if all the event info are legit dates
	else if (events){
		for (var x = 0; x < events.length; x++){
			events[x].start = new Date(events[x].start);
			events[x].end = new Date(events[x].end);
			if (isNaN(events[x].start) || isNaN(events[x].end)){
				req.session.message = "Invalid date!";
				res.redirect("/");
			}
		}
	}
	
	if (events){
		//all gucci
		Listing.newRental(listing_id, events, req.user, function(result){
		if (result.state == "success"){
				res.jsonp(result.eventStates);
			}
			else {
				res.status(404).send('Not found');
			}
		});
	}
}