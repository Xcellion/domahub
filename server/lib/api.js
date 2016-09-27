var	listing_model = require('../models/listing_model.js');

var validator = require("validator");
var	request = require('request');
var url = require('url');

module.exports = function(app, db, e){
	error = e;
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

					req.session.hostname = url.parse(result.info.address).hostname;
					req.session.rented = result.info.address;
					proxyReq(req, res);
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
function proxyReq(req, res){
	req.url.replace(req.headers["host"], req.session.hostname)

	if (req.path != "/"){
		var address = (req.path == "/") ? req.session.hostname : req.session.hostname + req.url;
	}
	else {
		var address = (req.path == "/") ? req.session.rented : req.session.rented + req.url;
	}

	temp_headers = req.headers;
	temp_headers["Referer"] = req.session.rented;
	temp_headers["host"] = req.session.hostname;
	temp_headers["Host"] = req.session.hostname;
	temp_headers["Origin"] = req.session.hostname;
	address = addProtocol(address);

	var proxy_req = request({
		url: address,
		method: req.method,
		headers: temp_headers
	}, function (err, response, body) {
		if (err) {
			console.log(err);
			error.handler(req, res, false, "api");
		}
	});

	req.pipe(proxy_req).pipe(res);
}

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
