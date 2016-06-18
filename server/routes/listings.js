var app,
	database;

var	account_model = require('../models/account_model.js'),
	listing_model = require('../models/listing_model.js'),
	Account,
	Passport;

module.exports = function(app_pass, db, pp){
	app = app_pass;
	database = db;
	Passport = pp;
	
	Account = new account_model(database);
	Listing = new listing_model(database, Account);
	
	//get a new listing
	app.get('/listing/:listing', getListing);
	
	//create new rental
	app.post('/listing/:listing/rent', isLoggedIn, postRental);
	
	//returns the files 
	app.get('/rental_info/:domain_name/:rental_id', getRentalInfo);
	
	//returns current rental
	app.get('/rental_info/:domain_name', getRentalInfo);
}

//make sure user is logged in before doing anything
function isLoggedIn(req, res, next) {
	//if user is authenticated in the session
	if (req.isAuthenticated()){
		delete req.user.password;
		console.log("Authenticated!");
		return next();
	}
	else {
		req.session.message = "Not logged in!"
		res.redirect("/");
	}
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
function getRentalInfo(req, res, next){
	domain_name = req.params.domain_name;
	rental_id = req.params.rental_id || false;
	
	if (rental_id){
		console.log("Attempting to get rental info for domain " + domain_name + " and rental #" + rental_id);
	}
	else{
		console.log("Attempting to get current rental info for domain " + domain_name);
	}
	
	//doesnt matter if its a rental id or not
	Listing.getListing(domain_name, rental_id, function(result){
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
	
	//check if event info is legit
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