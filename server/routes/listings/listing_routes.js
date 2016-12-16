var	listing_model = require('../../models/listing_model.js');
var	data_model = require('../../models/data_model.js');

var search_functions = require("../listings/listings_search_functions.js");
var renter_functions = require("../listings/listings_renter_functions.js");
var owner_functions = require("../listings/listings_owner_functions.js");
var stats_functions = require("../listings/listings_stats_functions.js");
var profile_functions = require("../profiles/profile_functions.js");

var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()
var urlencodedParser = bodyParser.urlencoded({ extended: true })

var validator = require("validator");

module.exports = function(app, db, auth, error, stripe){
	Listing = new listing_model(db);
	Data = new data_model(db);

	//-------------------------------------------------------------------------------------------------------------------- SEARCH LISTINGS

	//render the listing page hub
	app.get('/listings', [
		search_functions.renderListingHub
	]);

	//get a random listing with specific category
	app.get("/listing/random/:category", [
		search_functions.getRandomListingByCategory
	]);

	//search for a listing with specific filters
	app.post("/listing/search", [
		urlencodedParser,
		search_functions.checkSearchParams,
		search_functions.getListingBySearchParams
	]);

	//-------------------------------------------------------------------------------------------------------------------- OWNER RELATED

	//render listing create choice
	app.get('/listings/create', [
		auth.checkLoggedIn,
		owner_functions.renderCreateListingChoice
	]);

	//check all posted textarea domains to render table
	app.post("/listings/create/table", [
		urlencodedParser,
		auth.checkLoggedIn,
		owner_functions.checkPostedDomains
	]);

	//create new domains from table
	app.post("/listings/create", [
		urlencodedParser,
		auth.checkLoggedIn,
		owner_functions.checkPostedListingInfo,
		owner_functions.checkPostedPremium,
		profile_functions.getAccountListings,		//to find out which listings were not created in multi-create
		owner_functions.createListings,
		stripe.createStripeCustomer,
		stripe.createStripeSubscriptions,
		owner_functions.updatePremium
	]);

	//render create listing table
	app.get('/listings/create/single', [
		auth.checkLoggedIn,
		owner_functions.renderCreateListingSingle
	]);

	// //render create listing page
	// app.get('/listings/create/multiple', [
	// 	auth.checkLoggedIn,
	// 	owner_functions.renderCreateListingMultiple
	// ]);

	//redirect all /create to proper /create
	app.get('/listings/create*', function(req, res){
		res.redirect("/listings/create");
	});

	//create a single premium listing
	app.post('/listings/create/premium', [
		urlencodedParser,
		auth.checkLoggedIn,
		owner_functions.checkListingCreateInfo,
		owner_functions.checkListingCreatePrice,
		profile_functions.getAccountListings,
		owner_functions.createListing,
		stripe.createStripeCustomer,
		stripe.createSingleStripeSubscription		//end here, and stripe webhooks will update the db
	]);

	//create multiple listings
	app.post('/listings/create/multiple', [
		auth.checkLoggedIn,
		profile_functions.getAccountListings,
		owner_functions.checkCSVUploadSize,
		owner_functions.checkListingBatch,
		owner_functions.createListingBatch
	]);

	//verify that someone changed their DNS to point to domahub
	app.get('/listing/:domain_name/verify', [
		auth.checkLoggedIn,
		checkDomainValid,
		checkDomainListed,
		owner_functions.checkListingOwner,
		owner_functions.verifyListing,
		owner_functions.updateListing
	]);

	//update listing information
	app.post('/listing/:domain_name/update', [
		auth.checkLoggedIn,
		checkDomainValid,
		checkDomainListed,
		profile_functions.getAccountListings,
		owner_functions.checkListingOwner,
		owner_functions.checkListingVerified,
		owner_functions.checkImageUploadSize,
		owner_functions.checkListingImage,
		owner_functions.checkListingStatus,
		owner_functions.checkListingDetails,
		owner_functions.checkListingPriceType,
		owner_functions.checkListingExisting,
		owner_functions.updateListing
	]);

	//update listing to premium
	app.post('/listing/:domain_name/upgrade', [
		urlencodedParser,
		auth.checkLoggedIn,
		checkDomainValid,
		checkDomainListed,
		profile_functions.getAccountListings,
		owner_functions.checkListingOwner,
		owner_functions.checkListingVerified,
		stripe.createStripeCustomer,
		stripe.createSingleStripeSubscription,
		owner_functions.updateListing	//only if we're renewing a subscription
	]);

	//degrade listing to basic
	app.post('/listing/:domain_name/downgrade', [
		auth.checkLoggedIn,
		checkDomainValid,
		checkDomainListed,
		profile_functions.getAccountListings,
		owner_functions.checkListingOwner,
		owner_functions.checkListingVerified,
		stripe.cancelStripeSubscription,
		owner_functions.updateListing
	]);

	//-------------------------------------------------------------------------------------------------------------------- RENTAL RELATED

	//domahub easter egg page
	app.get(['/listing/domahub.com', '/listing/w3bbi.com'], function(req, res){
		res.render("listings/listing_w3bbi.ejs", {
			user: req.user,
			message: Auth.messageReset(req)
		})
	});

	//render listing page
	app.get('/listing/:domain_name', [
		checkDomainValid,
		renter_functions.checkDomainListedAndAddToSearch,
		renter_functions.getVerifiedListing,
		renter_functions.deleteRentalInfo,
		renter_functions.renderListing
	]);

	//get listing info / times
	app.post('/listing/:domain_name/times', [
		checkDomainValid,
		checkDomainListed,
		renter_functions.getVerifiedListing,
		renter_functions.deleteRentalInfo,
		renter_functions.getListingRentalTimes
	]);

	//associate a user with a hash rental
	app.get('/listing/:domain_name/:rental_id/:owner_hash_id', [
		checkDomainValid,
		checkDomainListed,
		renter_functions.getRental,
		auth.checkLoggedIn,
		renter_functions.updateRentalOwner,
		renter_functions.editRental
	]);

	//create a new rental
	app.post('/listing/:domain_name/rent', [
		urlencodedParser,
		checkDomainValid,
		checkDomainListed,
		renter_functions.getVerifiedListing,
		renter_functions.checkRentalInfo,
		renter_functions.checkRentalTimes,
		renter_functions.checkRentalPrice,
		renter_functions.createRental,
		renter_functions.getOwnerStripe,
		stripe.chargeMoney,
		renter_functions.emailToRegister,
		renter_functions.toggleActivateRental,
		renter_functions.sendRentalSuccess
	]);

	//changing rental status
	app.post('/listing/:domain_name/:rental_id/edit', [
		urlencodedParser,
		auth.checkLoggedIn,
		checkDomainValid,
		checkDomainListed,
		renter_functions.getRental,
		renter_functions.checkRental,
		renter_functions.createRentalObject,
		renter_functions.checkPostedRentalAddress,
		renter_functions.checkPostedRentalStatus,
		renter_functions.editRental
	]);

	//adding time to an existing rental
	app.post('/listing/:domain_name/:rental_id/time', [
		urlencodedParser,
		auth.checkLoggedIn,
		checkDomainValid,
		checkDomainListed,
		renter_functions.getRental,
		renter_functions.checkRental,
		renter_functions.createRentalObject,
		renter_functions.getVerifiedListing,
		renter_functions.checkRentalTimes,
		renter_functions.checkRentalPrice,
		renter_functions.getOwnerStripe,
		stripe.chargeMoney,
		renter_functions.editRentalTimes,
		profile_functions.getAccountRentals,
		renter_functions.sendRentalSuccess
	]);

}

//function to check validity of domain name
function checkDomainValid(req, res, next){
	console.log("F: Checking domain validity...");

	var domain_name = req.params.domain_name || req.body["domain-name"];

	if (!validator.isFQDN(domain_name)){
		error.handler(req, res, "Invalid domain name!");
	}
	else {
		next();
	}
}

//function to check if listing is listed on domahub
function checkDomainListed(req, res, next){
	console.log("F: Checking if domain is listed...");

	var domain_name = req.params.domain_name || req.body["domain-name"];

	Listing.checkListing(domain_name, function(result){
		if (!result.info.length || result.state == "error"){
			error.handler(req, res, "Invalid domain name!");
		}
		else {
			next();
		}
	});
}

//function to check if listing is NOT listed on domahub
function checkDomainNotListed(req, res, next){
	console.log("F: Checking if domain is NOT listed...");

	var domain_name = req.params.domain_name || req.body["domain-name"];

	Listing.checkListing(domain_name, function(result){
		if (!result.info.length || result.state == "error"){
			next();
		}
		else {
			error.handler(req, res, "Invalid domain name!");
		}
	});
}
