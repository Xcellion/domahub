var listing_model = require('../../models/listing_model.js');
var data_model = require('../../models/data_model.js');

var search_functions = require("../listings/listings_search_functions.js");
var renter_functions = require("../listings/listings_renter_functions.js");
var buyer_functions = require("../listings/listings_buyer_functions.js");
var owner_functions = require("../listings/listings_owner_functions.js");
var profile_functions = require("../profiles/profile_functions.js");
var general_functions = require("../general_functions.js");

var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: true });

var validator = require("validator");
var node_env = process.env.NODE_ENV || 'dev';   //dev or prod bool

module.exports = function(app, db, auth, error, stripe){
  Listing = new listing_model(db);
  Data = new data_model(db);

  //render listing hub
  // app.get("/listings", [
  //   search_functions.renderListingHub
  // ]);

  //get more listings for the listings hub
  app.post("/listings", [
    urlencodedParser,
    search_functions.getMoreListings
  ]);

  //<editor-fold>-------------------------------SEARCH LISTINGS-------------------------------

  //get a random listing with specific category
  app.get("/listing/random/:category", [
    search_functions.getRandomListingByCategory
  ]);

  //get a random listing with specific category
  app.post("/listing/related", [
    urlencodedParser,
    search_functions.getRelatedListings
  ]);

  //get random listings belonging to specific owner
  app.post("/listing/otherowner", [
    urlencodedParser,
    search_functions.getOtherListings
  ]);

  // //search for a listing with specific filters
  // app.post("/listing/search", [
  //   urlencodedParser,
  //   search_functions.checkSearchParams,
  //   search_functions.getListingBySearchParams
  // ]);

  //</editor-fold>

  //<editor-fold>-------------------------------OWNER RELATED-------------------------------

  //render listing create
  app.get('/listings/create', [
    auth.checkLoggedIn,
    stripe.getAccountInfo,
    owner_functions.renderCreateListing
  ]);

  // //render create listing multiple
  // app.get('/listings/create/multiple', [
  //   auth.checkLoggedIn,
  //   owner_functions.renderCreateListingMultiple
  // ]);

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
    profile_functions.getAccountListings,    //to find out which listings were not created in multi-create
    owner_functions.createListings,
    stripe.createStripeCustomer,
    stripe.createStripeSubscriptions,
    owner_functions.updateListingPremium
  ]);

  //redirect all /create to proper /create
  app.get('/listings/create*', function(req, res){
    res.redirect("/listings/create");
  });

  //create multiple listings
  // app.post('/listings/create/multiple', [
  //   auth.checkLoggedIn,
  //   profile_functions.getAccountListings,
  //   owner_functions.checkCSVUploadSize,
  //   owner_functions.checkListingBatch,
  //   owner_functions.createListingBatch
  // ]);

  //verify that someone changed their DNS to point to domahub
  app.post('/listing/:domain_name/verify', [
    auth.checkLoggedIn,
    checkDomainValid,
    checkDomainListed,
    stripe.getAccountInfo,
    profile_functions.getAccountListings,
    owner_functions.checkListingOwnerPost,
    owner_functions.verifyListing,
    owner_functions.updateListing
  ]);

  //get the whois and DNS records for an unverified domain
  app.post('/listing/:domain_name/unverifiedInfo', [
    auth.checkLoggedIn,
    checkDomainValid,
    checkDomainListed,
    profile_functions.getAccountListings,
    owner_functions.checkListingOwnerPost,
    owner_functions.getDNSRecordAndWhois
  ]);

  //get offers for a verified domain
  app.post('/listing/:domain_name/getoffers', [
    auth.checkLoggedIn,
    checkDomainValid,
    checkDomainListed,
    profile_functions.getAccountListings,
    owner_functions.checkListingOwnerPost,
    owner_functions.getListingOffers
  ]);

  // //to delete a listing
  // app.post('/listing/:domain_name/delete', [
  //   auth.checkLoggedIn,
  //   checkDomainValid,
  //   checkDomainListed,
  //   owner_functions.checkListingOwnerPost,
  //   owner_functions.deleteListing
  // ]);

  //update listing information
  app.post('/listing/:domain_name/update', [
    auth.checkLoggedIn,
    checkDomainValid,
    checkDomainListed,
    profile_functions.getAccountListings,
    owner_functions.checkListingOwnerPost,
    owner_functions.checkListingVerified,
    owner_functions.checkListingPurchased,
    stripe.checkStripeSubscription,
    owner_functions.checkImageUploadSize,
    owner_functions.checkListingImage,
    owner_functions.checkListingStatus,
    owner_functions.checkListingPremiumDetails,
    owner_functions.checkListingDetails,
    owner_functions.checkListingExisting,
    owner_functions.updateListing
  ]);

  //get a listing's stripe info
  app.get('/listing/:domain_name/stripeinfo', [
    auth.checkLoggedIn,
    checkDomainValid,
    checkDomainListed,
    profile_functions.getAccountListings,
    owner_functions.checkListingOwnerPost,
    owner_functions.checkListingVerified,
    stripe.getStripeSubscription,
    owner_functions.updateListing
  ]);

  //update listing to premium
  app.post('/listing/:domain_name/upgrade', [
    urlencodedParser,
    auth.checkLoggedIn,
    checkDomainValid,
    checkDomainListed,
    profile_functions.getAccountListings,
    owner_functions.checkListingOwnerPost,
    owner_functions.checkListingVerified,
    stripe.createStripeCustomer,
    stripe.createStripeSubscription,
    owner_functions.updateListing
  ]);

  //degrade listing to basic
  app.post('/listing/:domain_name/downgrade', [
    auth.checkLoggedIn,
    checkDomainValid,
    checkDomainListed,
    profile_functions.getAccountListings,
    owner_functions.checkListingOwnerPost,
    owner_functions.checkListingVerified,
    stripe.cancelStripeSubscription
  ]);

  //</editor-fold>

  //<editor-fold>-------------------------------BUYING RELATED-------------------------------

  //verify a offer history item email
  app.get("/listing/:domain_name/contact/:verification_code", [
    urlencodedParser,
    checkDomainValid,
    buyer_functions.checkContactVerificationCode,
    renter_functions.verifyContactHistory
  ]);

  //render the accept or reject an offer page
  app.get(["/listing/:domain_name/contact/:offer_id/accept",
  "/listing/:domain_name/contact/:offer_id/reject"], [
    auth.checkLoggedIn,
    urlencodedParser,
    checkDomainValid,
    checkDomainListed,
    owner_functions.checkListingOwnerGet,
    buyer_functions.checkContactVerified,
    buyer_functions.renderAcceptOrRejectOffer
  ]);

  //accept or reject an offer
  app.post(["/listing/:domain_name/contact/:offer_id/accept",
  "/listing/:domain_name/contact/:offer_id/reject"], [
    auth.checkLoggedIn,
    urlencodedParser,
    checkDomainValid,
    checkDomainListed,
    profile_functions.getAccountListings,
    owner_functions.checkListingOwnerPost,
    buyer_functions.checkContactVerified,
    buyer_functions.acceptOrRejectOffer,
    renter_functions.notifyOfferer
  ]);

  //create a new offer history item
  app.post("/listing/:domain_name/contact/offer", [
    urlencodedParser,
    checkDomainValid,
    checkDomainListed,
    renter_functions.checkSessionListingInfoPost,
    renter_functions.checkContactInfo,
    stripe.checkStripeSubscription,
    renter_functions.createOfferContactRecord,
    renter_functions.sendContactVerificationEmail
  ]);

  //render verify transfer ownership page
  app.get("/listing/:domain_name/bin/:verification_code", [
    checkDomainValid,
    checkDomainListed,
    buyer_functions.checkListingPurchaseVerificationCode,
    buyer_functions.renderVerificationPage
  ]);

  //verify transfer ownership
  app.post("/listing/:domain_name/bin/:verification_code", [
    checkDomainValid,
    checkDomainListed,
    buyer_functions.checkListingPurchaseVerificationCode,
    buyer_functions.verifyTransferOwnership
  ]);

  //new buy it now
  app.post("/listing/:domain_name/contact/buy", [
    urlencodedParser,
    checkDomainValid,
    renter_functions.checkSessionListingInfoPost,
    renter_functions.checkContactInfo,
    stripe.checkStripeSubscription,
    buyer_functions.redirectToCheckout
  ]);

  //render BIN checkout page
  app.get('/listing/:domain_name/checkout/buy', [
    buyer_functions.renderCheckout
  ]);

  //buy a listing
  app.post('/listing/:domain_name/buy', [
    urlencodedParser,
    checkDomainValid,
    checkDomainListed,
    renter_functions.checkSessionListingInfoPost,
    stripe.checkStripeSubscription,
    stripe.chargeMoneyBuy,
    buyer_functions.createBuyContactRecord,
    buyer_functions.alertOwnerBIN,
    buyer_functions.alertBuyerNextSteps,
    buyer_functions.deleteBINInfo,
    buyer_functions.disableListing,
    owner_functions.updateListing
  ]);

  //</editor-fold>

  //<editor-fold>-------------------------------RENTAL RELATED-------------------------------

  //domahub easter egg page
  // app.get(['/listing/domahub.com', '/listing/w3bbi.com'], function(req, res){
  //   res.render("listings/listing_w3bbi.ejs", {
  //     user: req.user,
  //     message: Auth.messageReset(req)
  //   });
  // });

  //render specific listing page
  app.get('/listing/:domain_name', [
    checkDomainValid,
    renter_functions.addToSearchHistory,
    renter_functions.getListingInfo,
    renter_functions.checkStillVerified,
    stripe.checkStripeSubscription,
    // renter_functions.getListingFreeTimes,
    renter_functions.renderListing
  ]);

  //get a domain's ticker information
  app.post("/listing/:domain_name/ticker", [
    urlencodedParser,
    renter_functions.getListingTicker
  ]);

  //get a domain's traffic
  app.post("/listing/:domain_name/traffic", [
    renter_functions.getListingTraffic
  ]);

  //get a domain's alexa information
  app.post("/listing/:domain_name/alexa", [
    renter_functions.getListingAlexa
  ]);

  //get listing info / times
  app.post('/listing/:domain_name/times', [
    urlencodedParser,
    renter_functions.addToAvailCheckHistory,
    renter_functions.getListingTimes
  ]);

  //render rental checkout page
  app.get('/listing/:domain_name/checkout/rent', [
    renter_functions.renderCheckout
  ]);

  //track checkout behavior
  app.post("/listing/:domain_name/checkouttrack", [
    ifNotDev,
    urlencodedParser,
    renter_functions.addToCheckoutAction
  ]);

  //redirect to the checkout page after validating times / path
  app.post('/listing/:domain_name/checkoutrent', [
    urlencodedParser,
    checkDomainValid,
    checkDomainListed,
    // renter_functions.deletePipeToDH,
    renter_functions.checkSessionListingInfoPost,
    renter_functions.getListingFreeTimes,
    renter_functions.createNewRentalObject,
    renter_functions.checkRentalTimes,
    renter_functions.checkRentalPrice,
    renter_functions.addToRentalCheckoutHistory,
    renter_functions.redirectToCheckout
  ]);

  //create a new rental
  app.post('/listing/:domain_name/rent', [
    urlencodedParser,
    checkDomainValid,
    checkDomainListed,
    renter_functions.checkSessionListingInfoPost,
    renter_functions.getListingFreeTimes,
    renter_functions.checkRentalInfoNew,
    renter_functions.checkRentalTimes,
    renter_functions.checkRentalPrice,
    renter_functions.createRental,
    renter_functions.getOwnerStripe,
    stripe.chargeMoneyRent,
    renter_functions.emailToRegister,
    renter_functions.toggleActivateRental,
    renter_functions.sendRentalSuccess
  ]);

  //associate a user with a hash rental
  app.get(['/listing/:domain_name/:rental_id/:owner_hash_id',
  '/listing/:domain_name/:rental_id'], [
    checkDomainValid,
    checkDomainListed,
    renter_functions.deleteRentalInfo,
    renter_functions.getRental,
    renter_functions.checkRentalOwner,
    renter_functions.checkRentalDomain,
    renter_functions.getRentalRentalTimes,
    renter_functions.createRentalObject,
    renter_functions.updateRentalOwner,
    renter_functions.editRental,
    renter_functions.redirectToPreview
  ]);

  //render rental page
  app.get('/rentalpreview', [
    renter_functions.checkForPreview,
    renter_functions.renderRental
  ]);

  //changing rental information
  app.post('/listing/:domain_name/:rental_id/edit', [
    urlencodedParser,
    checkDomainValid,
    checkDomainListed,
    renter_functions.getRental,
    renter_functions.checkRentalDomain,
    renter_functions.checkRentalOwner,
    renter_functions.createRentalObject,
    renter_functions.checkRentalInfoEdit,
    renter_functions.editRental,
    renter_functions.updateRentalObject
  ]);

  //delete a rental
  app.post('/listing/:domain_name/:rental_id/delete', [
    urlencodedParser,
    auth.checkLoggedIn,
    checkDomainValid,
    checkDomainListed,
    renter_functions.getRental,
    renter_functions.checkRentalDomain,
    renter_functions.checkRentalOwner,
    renter_functions.createRentalObject,
    renter_functions.deactivateRental,
    renter_functions.editRental,
    renter_functions.updateRentalObject
  ]);

  //delete a rental
  app.post('/listing/:domain_name/:rental_id/refund', [
    urlencodedParser,
    auth.checkLoggedIn,
    checkDomainValid,
    checkDomainListed,
    renter_functions.getRental,
    renter_functions.checkRentalDomain,
    renter_functions.checkDomainOwner,
    stripe.refundRental,
    renter_functions.createRentalObject,
    renter_functions.deactivateRental,
    renter_functions.editRental,
    general_functions.sendSuccess
  ]);

  //</editor-fold>

}

//function to check dev or not
function ifNotDev(req, res, next){
  if (node_env != "dev"){
    next();
  }
  else {
    res.sendStatus(200);
  }
}

//function to check validity of domain name
function checkDomainValid(req, res, next){
  console.log("F: Checking domain FQDN validity...");

  var domain_name = req.params.domain_name || req.body["domain-name"];
  if (!validator.isAscii(domain_name) || !validator.isFQDN(domain_name)){
    error.handler(req, res, "Invalid domain name!");
  }
  else if (req.params.domain_name != req.params.domain_name.toLowerCase()){
    res.redirect(req.originalUrl.toLowerCase());
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
