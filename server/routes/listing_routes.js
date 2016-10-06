var	listing_model = require('../models/listing_model.js');
var	data_model = require('../models/data_model.js');
var listings_renter = require("./listings_renter_routes");
var listings_owner = require("./listings_owner_routes");

var validator = require("validator");
var whois = require("whois");
var parser = require('parse-whois');

module.exports = function(app, db, auth, e){
	Listing = new listing_model(db);
	Data = new data_model(db);

	error = e;
	checkLoggedIn = auth.checkLoggedIn;

	//initiate the two types of listing routes
	listings_owner.init(e, Listing);
	listings_renter.init(e, Listing);

	//------------------------------------------------------------------------------------------------ OWNER RELATED

	//render create listing page
	app.get('/listing/create', [
		checkLoggedIn,
		listings_owner.checkAccountListingPriv,
		listings_owner.renderCreateListing
	]);

	//redirect all /create to proper /create
	app.get('/listing/create*', function(req, res){
		res.redirect("/listing/create");
	})

	//create a single listing
	app.post('/listing/create', [
		checkLoggedIn,
		listings_owner.checkAccountListingPriv,
		listings_owner.checkListingCreate,
		listings_owner.createListing
	]);

	//create multiple listings
	app.post('/listing/create/batch', [
		checkLoggedIn,
		listings_owner.checkAccountListingPriv,
		listings_owner.checkUploadSize,
		listings_owner.checkListingBatch,
		listings_owner.createListingBatch
	]);

	//verify that someone changed their DNS to point to domahub
	app.get('/listing/:domain_name/verify', [
		checkLoggedIn,
		listings_owner.checkAccountListingPriv,
		checkDomainListed,
		listings_owner.checkListingOwner,
		listings_owner.verifyListing,
		listings_owner.updateListing
	]);

	//update listing information
	app.post('/listing/:domain_name/update', [
		checkLoggedIn,
		listings_owner.checkAccountListingPriv,
		checkDomainListed,
		listings_owner.checkListingOwner,
		listings_owner.checkListingDetails,
		//listings_owner.checkListingPriceType,
		listings_owner.updateListing
	]);

	//------------------------------------------------------------------------------------------------ RENTAL RELATED

	//render the 404 listing page
	app.get('/listing', [
		listings_renter.renderListing404
	]);

	//domahub easter egg page
	app.get('/listing/domahub.com, /listing/w3bbi.com', function(req, res){
		res.render("listing_w3bbi.ejs", {
			user: req.user,
			message: Auth.messageReset(req)
		})
	});

	//render listing page
	app.get('/listing/:domain_name', [
		listings_renter.checkDomainAndAddToSearch,
		listings_renter.getListing,
		listings_renter.renderListing
	]);

	//render a specific rental
	app.get('/listing/:domain_name/:rental_id', [
		checkLoggedIn,
		checkDomainListed,
		listings_renter.checkRental,
		listings_renter.getListing,
		listings_renter.getRental,
		listings_renter.renderListing
	]);

	//create a new rental
	app.post('/listing/:domain_name/rent', [
		checkLoggedIn,
		checkDomainListed,
		listings_renter.getListing,
		listings_renter.checkNewRentalInfo,
		listings_renter.createRental,
		listings_renter.chargeMoney,
		listings_renter.toggleActivateRental
	]);

	//editing an existing rental
	app.post('/listing/:domain_name/:rental_id', [
		checkLoggedIn,
		checkDomainListed,
		listings_renter.checkRental,
		listings_renter.getListing,
		listings_renter.checkNewRentalInfo,
		listings_renter.editRental
	]);
}

//function to check if listing is listed on domahub
function checkDomainListed(req, res, next){
	var domain_name = req.params.domain_name || req.body["domain-name"];

	if (!validator.isFQDN(domain_name)){
		error.handler(req, res, "Invalid domain name!");
	}
	else {
		Listing.checkListing(domain_name, function(result){
			if (!result.info.length || result.state == "error"){
				error.handler(req, res, "Invalid domain name!");
			}
			else {
				next();
			}
		});
	}
}
