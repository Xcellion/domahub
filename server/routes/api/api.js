var	account_model = require('../../models/account_model.js'),
	listing_model = require('../../models/listing_model.js');

module.exports = function(app, db, e, p){
	error = e;
	proxy = p

	Account = new account_model(db);
	// Listing = new listing_model(db);

	app.get("*", checkHost);
}

//function to check if the requested host is not for w3bbi
function checkHost(req, res, next){
	if (req.headers.host){
	    domain_name = req.headers.host.replace(/^(https?:\/\/)?(www\.)?/,'');

		//check if requesting for w3bbi main page or a listed domain
		if (domain_name != "www.w3bbi.com"
			&& domain_name != "w3bbi.com"
			&& domain_name != "localhost"
			&& domain_name != "localhost:8080"){

			req.session.api = true;
	        getCurrentRental(req, res, domain_name);
	    }

		//requested w3bbi website, not domain
	    else {
	        next();
	    }
	}
	else {
		error.handler(req, res, false, "api");
	}
}

//send the current rental details and information for a listing
function getCurrentRental(req, res, domain_name){
	//get the current rental for the listing
	Listing.getCurrentRental(domain_name, function(result){
		if (result.state != "success"){error.handler(req, res, false, "api");}
		else {
			rental_listing_info = result.info;
			Listing.getRentalDetails(result.rental_id, function(result){
				rental_listing_info.details = result.info
				sendRentalInfo(req, res, domain_name, rental_listing_info);
			});
		}
	});
}

//helper function to send rental information
function sendRentalInfo(req, res, domain_name, rental_info, details){
	if (rental_info){
		//what type of rental is it?
		switch (rental_info.type){
			//http proxy
			case 1:
				proxy.web(req, res, {
					target: 'http://216.58.194.206'
				});
				break;
			//simple page
			case 0:
			case 2:
				res.render("reset.ejs", {
					domain_name: domain_name,
					rental_info: rental_info,
					def_rental_info: rental_info,
				});
			break;
		}
	}

	//domain doesnt exist at w3bbi
	else {
		error.handler(req, res, false, "api");
	}
}
