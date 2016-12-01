var	listing_model = require('../models/listing_model.js');
var node_env = process.env.NODE_ENV || 'dev'; 	//dev or prod bool

var validator = require("validator");
var	request = require('request');
var url = require('url');

module.exports = function(app, db, e){
	error = e;
	Listing = new listing_model(db);

	app.use(checkHost);
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

			//if dev environment or going to a listings page
			if (node_env == "dev" || req.path.indexOf("/listing/") != -1 || req.path == "/stripe/webhook"){
				next();
			}
			else {
				res.render("under_construction.ejs");
			}
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
		//proxyReq(req, res, req.session.rented);
		req.pipe(request(result.info[0].address)).pipe(res);
	}
	else {
		Listing.getCurrentRental(domain_name, function(result){
			if (result.state != "success" || result.info.length == 0){
				console.log("Not rented! Redirecting to listing page");
				delete req.session.rented;
				res.redirect("https://domahub.com/listing/" + domain_name)
			}
			else {
				//current rental exists!
				console.log("Currently rented! Proxying request to " + result.info[0].address);
				req.session.hostname = url.parse(result.info[0].address).hostname;
				req.session.rented = result.info[0].address;
				//proxyReq(req, res);
				req.pipe(request(result.info[0].address)).pipe(res);
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

	request[req.method.toLowerCase()]({
		url: addProtocol(address),
		encoding: null
	}, function (err, response, body) {
		if (err) {
			console.log(err);
			error.handler(req, res, false, "api");
		}
		else {
			console.log(body);
			res.setHeader("content-type", response.headers["content-type"]);
			res.write(body,'binary');
    		res.end(null, 'binary');
		}
	});
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
