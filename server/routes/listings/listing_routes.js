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

module.exports = function(app, db, auth, e, stripe){
	Listing = new listing_model(db);
	Data = new data_model(db);

	error = e;
	checkLoggedIn = auth.checkLoggedIn;

	//-------------------------------------------------------------------------------------------------------------------- DESIRED TIMES

	app.post("/listing/:domain_name/timeswanted", [
		urlencodedParser,
		checkDomainValid,
		checkDomainNotListed,	//make sure the domain isnt listed on doma
		stats_functions.checkRentalTimes,
		stats_functions.newDesiredTimes
	]);

	//-------------------------------------------------------------------------------------------------------------------- SEARCH LISTINGS

	//initiate the two types of listing routes
	owner_functions.init(e, Listing);
	renter_functions.init(e, Listing);

	//get a random listing with specific category
	app.get("/listing/random/:category", [
		search_functions.getRandomListingByCategory
	]);

	//search for a listing with specific filters
	app.post("/testing", [
		urlencodedParser,
		search_functions.checkSearchParams,
		search_functions.getListingBySearchParams
	]);

	//-------------------------------------------------------------------------------------------------------------------- OWNER RELATED

	//render create listing page
	app.get('/listing/create', [
		checkLoggedIn,
		owner_functions.checkAccountListingPriv,
		owner_functions.renderCreateListing
	]);

	//render create listing page
	app.get('/listing/create/batch', [
		checkLoggedIn,
		owner_functions.checkAccountListingPriv,
		owner_functions.renderCreateListingBatch
	]);

	//redirect all /create to proper /create
	app.get('/listing/create*', function(req, res){
		console.log('s')
		res.redirect("/listing/create");
	})

	//create a single basic listing
	app.post('/listing/create/basic', [
		urlencodedParser,
		checkLoggedIn,
		owner_functions.checkAccountListingPriv,
		owner_functions.checkListingCreateInfo,
		profile_functions.getAccountListings,
		owner_functions.createListing
	]);

	//create a single premium listing
	app.post('/listing/create/premium', [
		urlencodedParser,
		checkLoggedIn,
		owner_functions.checkAccountListingPriv,
		owner_functions.checkListingCreateInfo,
		owner_functions.checkListingCreatePrice,
		profile_functions.getAccountListings,
		owner_functions.createListing,
		stripe.getStripeInfo,
		stripe.createStripeCustomer,
		stripe.createStripeSubscription		//end here, and stripe webhooks will update the db
	]);

	//create multiple listings
	app.post('/listing/create/batch', [
		checkLoggedIn,
		profile_functions.getAccountListings,
		owner_functions.checkAccountListingPriv,
		owner_functions.checkCSVUploadSize,
		owner_functions.checkListingBatch,
		owner_functions.createListingBatch
	]);

	//verify that someone changed their DNS to point to domahub
	app.get('/listing/:domain_name/verify', [
		checkLoggedIn,
		owner_functions.checkAccountListingPriv,
		checkDomainValid,
		checkDomainListed,
		owner_functions.checkListingOwner,
		owner_functions.verifyListing,
		owner_functions.updateListing
	]);

	//update listing information
	app.post('/listing/:domain_name/update', [
		checkLoggedIn,
		owner_functions.checkAccountListingPriv,
		checkDomainValid,
		checkDomainListed,
		profile_functions.getAccountListings,
		owner_functions.checkListingOwner,
		owner_functions.checkListingVerified,
		owner_functions.checkImageUploadSize,
		owner_functions.checkListingImage,
		owner_functions.checkListingDetails,
		owner_functions.checkListingPriceType,
		owner_functions.checkListingExisting,
		owner_functions.updateListing
	]);

	//update listing to premium
	app.post('/listing/:domain_name/upgrade', [
		urlencodedParser,
		checkLoggedIn,
		owner_functions.checkAccountListingPriv,
		checkDomainValid,
		checkDomainListed,
		profile_functions.getAccountListings,
		owner_functions.checkListingOwner,
		owner_functions.checkListingVerified,
		stripe.getStripeInfo,
		stripe.createStripeCustomer,
		stripe.createStripeSubscription,
		owner_functions.updateListing	//only if we're renewing a subscription
	]);

	//degrade listing to basic
	app.post('/listing/:domain_name/downgrade', [
		checkLoggedIn,
		owner_functions.checkAccountListingPriv,
		checkDomainValid,
		checkDomainListed,
		profile_functions.getAccountListings,
		owner_functions.checkListingOwner,
		owner_functions.checkListingVerified,
		stripe.cancelStripeSubscription,
		owner_functions.updateListing
	]);

	//-------------------------------------------------------------------------------------------------------------------- RENTAL RELATED

	//render the listing page hub
	app.get('/listings', [
		renter_functions.renderListingHub
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
		renter_functions.checkDomainAndAddToSearch,
		renter_functions.getActiveListing,
		renter_functions.renderListing
	]);

	//render a specific rental
	app.get('/listing/:domain_name/:rental_id', [
		checkLoggedIn,
		checkDomainValid,
		checkDomainListed,
		renter_functions.checkRental,
		renter_functions.getActiveListing,
		renter_functions.getRental,
		renter_functions.renderListing
	]);

	//create a new rental
	app.post('/listing/:domain_name/rent', [
		urlencodedParser,
		checkLoggedIn,
		checkDomainValid,
		checkDomainListed,
		renter_functions.getActiveListing,
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
		checkLoggedIn,
		checkDomainValid,
		checkDomainListed,
		renter_functions.checkRental,
		renter_functions.getActiveListing,
		renter_functions.toggleActivateRental
	]);

	//adding time to an existing rental
	app.post('/listing/:domain_name/:rental_id/time', [
		urlencodedParser,
		checkLoggedIn,
		checkDomainValid,
		checkDomainListed,
		renter_functions.checkRental,
		renter_functions.getActiveListing,
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
