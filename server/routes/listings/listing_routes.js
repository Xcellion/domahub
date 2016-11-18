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

	//-------------------------------------------------------------------------------------------------------------------- DESIRED TIMES

	app.post("/listing/:domain_name/timeswanted", [
		urlencodedParser,
		checkDomainValid,
		checkDomainNotListed,	//make sure the domain isnt listed on doma
		stats_functions.checkRentalTimes,
		stats_functions.newDesiredTimes
	]);

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

	//redirect all /create to proper /create
	app.get('/listings/create', [
		auth.checkLoggedIn,
		owner_functions.renderCreateListingChoice
	]);

	//render create listing page
	app.get('/listings/create/single', [
		auth.checkLoggedIn,
		owner_functions.renderCreateListingSingle
	]);

	//render create listing page
	app.get('/listings/create/multiple', [
		auth.checkLoggedIn,
		owner_functions.renderCreateListingMultiple
	]);

	//redirect all /create to proper /create
	app.get('/listings/create*', function(req, res){
		res.redirect("/listings/create");
	});

	//create a single basic listing
	app.post('/listings/create/basic', [
		urlencodedParser,
		auth.checkLoggedIn,
		owner_functions.checkListingCreateInfo,
		profile_functions.getAccountListings,
		owner_functions.createListing
	]);

	//create a single premium listing
	app.post('/listings/create/premium', [
		urlencodedParser,
		auth.checkLoggedIn,
		owner_functions.checkListingCreateInfo,
		owner_functions.checkListingCreatePrice,
		profile_functions.getAccountListings,
		owner_functions.createListing,
		stripe.createStripeCustomer,
		stripe.createStripeSubscription		//end here, and stripe webhooks will update the db
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
		stripe.createStripeSubscription,
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
		renter_functions.checkDomainAndAddToSearch,
		renter_functions.getVerifiedListing,
		renter_functions.renderListing
	]);

	//render a specific rental
	app.get('/listing/:domain_name/:rental_id', [
		auth.checkLoggedIn,
		checkDomainValid,
		checkDomainListed,
		renter_functions.checkRental,
		renter_functions.getVerifiedListing,
		renter_functions.getRental,
		renter_functions.renderListing
	]);

	//create a new rental
	app.post('/listing/:domain_name/rent', [
		urlencodedParser,
		checkDomainValid,
		checkDomainListed,
		renter_functions.getVerifiedListing,
		renter_functions.checkRentalAddress,
		renter_functions.checkRentalTimes,
		renter_functions.checkRentalPrice,
		renter_functions.createRental,
		renter_functions.getOwnerStripe,
		stripe.chargeMoney,
		renter_functions.toggleActivateRental
	]);

	//changing rental status
	app.post('/listing/:domain_name/:rental_id/status', [
		urlencodedParser,
		auth.checkLoggedIn,
		checkDomainValid,
		checkDomainListed,
		renter_functions.checkRental,
		renter_functions.getVerifiedListing,
		renter_functions.toggleActivateRental
	]);

	//adding time to an existing rental
	app.post('/listing/:domain_name/:rental_id/time', [
		urlencodedParser,
		auth.checkLoggedIn,
		checkDomainValid,
		checkDomainListed,
		renter_functions.checkRental,
		renter_functions.getVerifiedListing,
		renter_functions.checkRentalTimes,
		renter_functions.checkRentalPrice,
		renter_functions.editRentalTimes
	]);

}

//function to check validity of domain name
function checkDomainValid(req, res, next){
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
