var	account_model = require('../../models/account_model.js'),
	listing_model = require('../../models/listing_model.js');

var httpProxy = require('http-proxy'),
 	proxy = httpProxy.createProxyServer({}),
	validator = require("validator");

// Listen for any error events
proxy.on('error', function (err, req, res) {
	console.log(err);
	res.redirect("http://domahub.com/error");
});

//to rewrite header on proxy
proxy.on('proxyReq', function(proxyReq, req, res, options) {
	proxyReq.setHeader('domahub', 'domahub');
});

module.exports = function(app, db, e){
	error = e;

	Account = new account_model(db);
	Listing = new listing_model(db);

	app.get("*", checkHost);
	app.get("/error", renderError);
}

//function to check if the requested host is not for domahub
function checkHost(req, res, next){
	console.log(req.headers.host, req.path);

	if (req.headers.host){
	    domain_name = req.headers.host.replace(/^(https?:\/\/)?(www\.)?/,'');

		//is not a valid FQDN
		if (!validator.isFQDN(domain_name)){
			error.handler(req, res, false, "api");
		}
		//requested domahub website, not domain
		else if (domain_name == "www.w3bbi.com"
		 	|| domain_name == "w3bbi.com"
			|| domain_name == "www.domahub.com"
			|| domain_name == "domahub.com"
			|| domain_name == "localhost"
			|| domain_name == "localhost:8080"){

			next();
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
	Listing.getCurrentRental(domain_name, function(result){
		if (result.state != "success"){error.handler(req, res, false, "api");}
		else {
			rental_listing_info = result.info;

			//current rental exists!
			if (result.rental_id){
				proxy.web(req, res, {
					target: "http://" + result.info.ip
				});
			}

			//redirect to listing page
			else {
				res.redirect("http://domahub.com/listing/" + domain_name)
			}
		}
	});
}

//display the error page
function renderError(req, res, next){
	res.render("error", {
		user: req.user
	});
}
