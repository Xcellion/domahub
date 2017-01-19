var	listing_model = require('../models/listing_model.js');
var search_functions = require("../routes/listings/listings_search_functions.js");

var validator = require("validator");
var	request = require('request');
var url = require('url');
var fs = require('fs');
var path = require('path');
var concat = require('concat-stream');
var node_env = process.env.NODE_ENV || 'dev'; 	//dev or prod bool

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
	if (req.session.rented_info){
		console.log("Proxying rental request for an existing session for " + domain_name + "!");
		searchAndDirect(req.session.rental_info, req, res);
	}
	else {
		Listing.getCurrentRental(domain_name, function(result){
			if (result.state != "success" || result.info.length == 0){
				console.log("Not rented! Redirecting to listing page");
				delete req.session.rented_info;
				res.redirect("https://domahub.com/listing/" + domain_name);
			}
			else {
				searchAndDirect(result.info[0], req, res);
			}
		});
	}

}

//function to add to search and decide where to proxy
function searchAndDirect(rental_info, req, res){
	console.log("Currently rented!");
	//add it to stats
	search_functions.newRentalHistory(rental_info.rental_id, req);

	//proxy the request
	if (rental_info.address){
		console.log("Proxying request to " + rental_info.address + "...");
		req.session.rented_info = rental_info;
		requestProxy(req, res, rental_info);
	}
	else {
		console.log("No address associated with rental! Display default empty page...");
		res.render("./views/proxy/proxy-image.ejs", {
			image: "",
			preview: false,
			doma_rental_info : rental_info
		});
	}
}

//function to proxy request
function requestProxy(req, res, rental_info){
	request({
		url: addProtocol(rental_info.address),
		encoding: null
	}, function (err, response, body) {
		//an image was requested
		if (response.headers['content-type'].indexOf("image") != -1){
			console.log("F: Requested rental address was an image!");
			res.render("./views/proxy/proxy-image.ejs", {
				image: rental_info.address,
				preview: false,
				doma_rental_info : rental_info
			});
		}
		else {
			console.log("F: Requested rental address was a website!");

			//pathes for the domahub overlay
			var index_path = (node_env == "dev") ? path.resolve(process.cwd(), 'server', 'views', 'proxy', 'proxy-index.ejs') : path.resolve(process.cwd(), 'views', 'proxy', 'proxy-index.ejs');
			var noedit_path = (node_env == "dev") ? path.resolve(process.cwd(), 'server', 'views', 'proxy', 'proxy-noedit.ejs') : path.resolve(process.cwd(), 'views', 'proxy', 'proxy-noedit.ejs');
			var rental_info_buffer = new Buffer("<script>var doma_rental_info = " + JSON.stringify(rental_info) + "</script>");

			var proxy_index = fs.readFileSync(index_path);
			var proxy_noedit = fs.readFileSync(noedit_path);
			var buffer_array = [body, rental_info_buffer, proxy_index, proxy_noedit];
			res.end(Buffer.concat(buffer_array));
		}
	}).on('error', function(err){
		res.redirect("https://domahub.com/listing/" + rental_info.domain_name);
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
