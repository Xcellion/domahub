var	listing_model = require('../models/listing_model.js');

var validator = require("validator");
var	request = require('request');
var url = require('url');
var fs = require('fs');
var concat = require('concat-stream');

module.exports = function(app, db, e){
	error = e;
	Listing = new listing_model(db);

	app.use("*", checkHost);
}

//function to check if the requested host is not for domahub
function checkHost(req, res, next){
	if (req.headers.host){
		var domain_name = req.headers.host.replace(/^(https?:\/\/)?(www\.)?/,'');

		if (domain_name == "www.w3bbi.com"
		|| domain_name == "w3bbi.com"
		|| domain_name == "www.domahub.com"
		|| domain_name == "domahub.com"
		|| domain_name == "localhost"
		|| domain_name == "localhost:8080"){
			next();
		}
		else if (!validator.isFQDN(domain_name)){
			error.handler(req, res, "Invalid rental!");
		}
		else {
			getCurrentRental(req, res, domain_name);
		}
	}
	else {
		res.redirect('/');
	}
}

//send the current rental details and information for a listing
function getCurrentRental(req, res, domain_name){
	//requesting something besides main page, pipe the request
	if (req.session.rented){
		console.log("Proxying!...");
		req.pipe(request({
			url: req.session.rented + req.originalUrl
		})).pipe(res);
	}
	else {
		Listing.getCurrentRental(domain_name, function(result){
			if (result.state != "success" || result.info.length == 0){
				console.log("Not rented! Redirecting to listing page");
				delete req.session.rented;
				res.redirect("https://domahub.com/listing/" + domain_name);
			}
			else {
				//current rental exists!
				console.log("Currently rented! Proxying request to " + result.info[0].address);
				req.session.rented = result.info[0].address;

				//proxy the request
				proxyReq(req, res, result.info[0].address, domain_name);
			}
		});
	}

}

//function to proxy request
function proxyReq(req, res, address, domain_name){
	request[req.method.toLowerCase()]({
		url: addProtocol(address),
		encoding: null
	}, function (err, response, body) {
		//not an image requested
		if (response.headers['content-type'].indexOf("image") == -1){
			fs.readFile('./server/views/proxy-index.ejs', function (err, html) {
				if (err) {error.handler(req, res, "Invalid rental!");}
				else {
					req.session.rented_headers = response.headers;
					res.end(Buffer.concat([body, html]));
				}
			});
		}
		else {
			res.render("proxy-image.ejs", {
				image: address,
				domain_name: domain_name
			});
		}
	}).on('error', function(err){
		error.handler(req, res, "Invalid rental!");
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
