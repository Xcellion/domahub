var	account_model = require('../../models/account_model.js'),
	listing_model = require('../../models/listing_model.js');

var validator = require("validator");
	request = require('request');

module.exports = function(app, db, e){
	error = e;

	Account = new account_model(db);
	Listing = new listing_model(db);

	app.get("*", checkHost);
	app.get("/error", renderError);
}

//function to check if the requested host is not for domahub
function checkHost(req, res, next){
	if (req.headers.host){
	    domain_name = req.headers.host.replace(/^(https?:\/\/)?(www\.)?/,'');
		//requested domahub website, not domain
		if (domain_name == "www.w3bbi.com"
		 	|| domain_name == "w3bbi.com"
			|| domain_name == "www.domahub.com"
			|| domain_name == "domahub.com"
			|| domain_name == "localhost"
			|| domain_name == "localhost:8080"){

			next();
	    }
		//is not a valid FQDN
		else if (!validator.isFQDN(domain_name)){
			error.handler(req, res, false, "api");
		}
	    else {
			getCurrentRental(req, res, domain_name);
	    }
	}
	else {
		error.handler(req, res, false, "api");
	}
}

//send the current rental details and information for a listing
function getCurrentRental(req, res, domain_name){
	//get the current rental for the listing
	if (req.session.rented){
		proxyReq(req, res, req.session.rented);
	}
	else {
		Listing.getCurrentRental(domain_name, function(result){
			if (result.state != "success"){error.handler(req, res, false, "api");}
			else {
				//current rental exists!
				if (result.rental_id){
					console.log("Currently rented! Proxying request...");
					req.session.rented = result.info.ip;
					proxyReq(req, res, result.info.ip)
				}

				//redirect to listing page
				else {
					console.log("Not rented! Redirecting to listing page");
					delete req.session.rented;
					res.redirect("http://domahub.com/listing/" + domain_name)
				}
			}
		});
	}

}

//display the error page
function renderError(req, res, next){
	res.render("error", {
		user: req.user
	});
}

//function to proxy request
function proxyReq(req, res, target){
	request.get({
		url: 'http://' + target + req.path,
		encoding: null
	},
		function (err, response, body) {
			if (!err) {
				req.session.doma = true;
				res.setHeader('content-type', response.headers['content-type']);
				res.send(body);
			}
			else {
				console.log(err);
				error.handler(req, res, false, "api");
			}
		}
	);
}
