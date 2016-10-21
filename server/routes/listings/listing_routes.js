var	listing_model = require('../../models/listing_model.js');
var	data_model = require('../../models/data_model.js');
var listings_renter = require("../listings/listings_renter_routes");
var listings_owner = require("../listings/listings_owner_routes");
var listings_stats = require("../listings/listings_stats_routes");

var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()
var urlencodedParser = bodyParser.urlencoded({ extended: true })

var validator = require("validator");

module.exports = function(app, db, auth, e, stripe){
	Listing = new listing_model(db);
	Data = new data_model(db);

	error = e;
	checkLoggedIn = auth.checkLoggedIn;

	//initiate the two types of listing routes
	listings_owner.init(e, Listing);
	listings_renter.init(e, Listing);

	//get a random listing with specific category
	app.get("/listing/random/:category", [
		getRandomListingByCategory
	]);

	//-------------------------------------------------------------------------------------------------------------------- OWNER RELATED

	//render create listing page
	app.get('/listing/create', [
		checkLoggedIn,
		listings_owner.checkAccountListingPriv,
		listings_owner.renderCreateListing
	]);

	//render create listing page
	app.get('/listing/create/batch', [
		checkLoggedIn,
		listings_owner.checkAccountListingPriv,
		listings_owner.renderCreateListingBatch
	]);

	//redirect all /create to proper /create
	app.get('/listing/create*', function(req, res){
		res.redirect("/listing/create");
	})

	//create a single basic listing
	app.post('/listing/create/basic', [
		urlencodedParser,
		checkLoggedIn,
		listings_owner.checkAccountListingPriv,
		listings_owner.checkListingCreate,
		listings_owner.createListing
	]);

	//create a single premium listing
	app.post('/listing/create/premium', [
		urlencodedParser,
		checkLoggedIn,
		listings_owner.checkAccountListingPriv,
		listings_owner.checkListingCreate,
		listings_owner.createListing
	]);

	//create multiple listings
	app.post('/listing/create/batch', [
		checkLoggedIn,
		listings_owner.checkAccountListingPriv,
		listings_owner.checkCSVUploadSize,
		listings_owner.checkListingBatch,
		listings_owner.createListingBatch
	]);

	//verify that someone changed their DNS to point to domahub
	app.get('/listing/:domain_name/verify', [
		checkLoggedIn,
		listings_owner.checkAccountListingPriv,
		checkDomainValid,
		checkDomainListed,
		listings_owner.checkListingOwner,
		listings_owner.verifyListing,
		listings_owner.updateListing
	]);

	//update listing information
	app.post('/listing/:domain_name/update', [
		checkLoggedIn,
		listings_owner.checkAccountListingPriv,
		checkDomainValid,
		checkDomainListed,
		listings_owner.checkListingOwner,
		listings_owner.checkListingVerified,
		listings_owner.checkImageUploadSize,
		listings_owner.checkListingImage,
		listings_owner.checkListingDetails,
		listings_owner.checkListingPriceType,
		listings_owner.checkListingExisting,
		listings_owner.updateListing
	]);

	//update listing to premium
	app.post('/listing/:domain_name/upgrade', [
		urlencodedParser,
		checkLoggedIn,
		listings_owner.checkAccountListingPriv,
		checkDomainValid,
		checkDomainListed,
		listings_owner.checkListingOwner,
		listings_owner.checkListingVerified,
		stripe.getStripeInfo,
		stripe.createStripeCustomer,
		stripe.createStripeSubscription,
		listings_owner.updateListing	//only if we're renewing a subscription
	]);

	//degrade listing to basic
	app.post('/listing/:domain_name/downgrade', [
		checkLoggedIn,
		listings_owner.checkAccountListingPriv,
		checkDomainValid,
		checkDomainListed,
		listings_owner.checkListingOwner,
		listings_owner.checkListingVerified,
		stripe.cancelStripeSubscription,
		listings_owner.updateListing
	]);

	//-------------------------------------------------------------------------------------------------------------------- DESIRED TIMES

	app.post("/listing/:domain_name/timeswanted", [
		urlencodedParser,
		checkDomainValid,
		checkDomainNotListed,	//make sure the domain isnt listed on doma
		listings_stats.checkRentalTimes,
		listings_stats.newDesiredTimes
	]);

	//-------------------------------------------------------------------------------------------------------------------- RENTAL RELATED

	//render the listing page hub
	app.get('/listings', [
		listings_renter.renderListingHub
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
		listings_renter.getActiveListing,
		listings_renter.renderListing
	]);

	//render a specific rental
	app.get('/listing/:domain_name/:rental_id', [
		checkLoggedIn,
		checkDomainValid,
		checkDomainListed,
		listings_renter.checkRental,
		listings_renter.getActiveListing,
		listings_renter.getRental,
		listings_renter.renderListing
	]);

	//create a new rental
	app.post('/listing/:domain_name/rent', [
		urlencodedParser,
		checkLoggedIn,
		checkDomainValid,
		checkDomainListed,
		listings_renter.getActiveListing,
		listings_renter.checkRentalAddress,
		listings_renter.checkRentalTimes,
		listings_renter.checkRentalPrice,
		listings_renter.createRental,
		listings_renter.getOwnerStripe,
		stripe.chargeMoney,
		listings_renter.toggleActivateRental
	]);

	//editing an existing rental
	app.post('/listing/:domain_name/:rental_id', [
		urlencodedParser,
		checkLoggedIn,
		checkDomainValid,
		checkDomainListed,
		listings_renter.checkRental,
		listings_renter.getActiveListing,
		listings_renter.checkRentalAddress,
		listings_renter.checkRentalTimes,
		listings_renter.checkRentalPrice,
		listings_renter.editRental
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

//returns a random listing by category
function getRandomListingByCategory(req, res, next){
	var category = req.params.category.toLowerCase();

	//if not a legit category
	var category_list = ["ecard", "personal", "startup", "business", "event", "promotion", "holiday", "industry"];
	if (category_list.indexOf(category) != -1){
		category = "%" + category + "%";
		Listing.getRandomListingByCategory(category, function(result){
			if (!result.info.length || result.state == "error"){
				res.redirect("/");
			}
			else {
				res.redirect("http://" + result.info[0].domain_name);
			}
		});
	}
	else {
		res.redirect("/");
	}
}
