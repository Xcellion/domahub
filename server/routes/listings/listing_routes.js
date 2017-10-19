var listing_model = require('../../models/listing_model.js');
var data_model = require('../../models/data_model.js');

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

  //<editor-fold>-------------------------------OWNER RELATED-------------------------------

  //render listing create
  app.get('/listings/create', [
    auth.checkLoggedIn,
    stripe.getAccountInfo,
    owner_functions.renderCreateListing
  ]);

  //multi update of listings details
  app.post("/listings/multiupdate", [
    auth.checkLoggedIn,
    urlencodedParser,
    owner_functions.checkImageUploadSize,
    checkSelectedIDs,
    profile_functions.getAccountListings,
    owner_functions.checkPostedListingInfoMulti,
    stripe.checkStripeSubscriptionUser,
    profile_functions.updateAccountSettingsGet,
    owner_functions.checkListingImage,
    owner_functions.checkListingStatus,
    owner_functions.checkListingPremiumDetails,
    owner_functions.checkListingDetails,
    owner_functions.updateListingsInfo
  ]);

  //check all posted textarea domains to render table
  app.post("/listings/create/table", [
    urlencodedParser,
    auth.checkLoggedIn,
    profile_functions.getAccountListings,    //to find out if we've reached max listings count for basic
    owner_functions.checkPostedDomainNames
  ]);

  //create new domains from table
  app.post("/listings/create", [
    urlencodedParser,
    auth.checkLoggedIn,
    profile_functions.getAccountListings,    //to find out which listings were not created in multi-create
    owner_functions.checkPostedListingInfoForCreate,
    owner_functions.createListings
  ]);

  //redirect all /create to proper /create
  app.get('/listings/create*', function(req, res){
    res.redirect("/listings/create");
  });

  //get offers for a verified domain
  app.post('/listing/:domain_name/getoffers', [
    auth.checkLoggedIn,
    urlencodedParser,
    checkDomainValid,
    checkDomainListed,
    profile_functions.getAccountListings,
    owner_functions.checkListingOwnerPost,
    owner_functions.getListingOffers
  ]);

  //get stats for a verified domain
  app.post('/listing/:domain_name/getstats', [
    auth.checkLoggedIn,
    urlencodedParser,
    checkDomainValid,
    checkDomainListed,
    profile_functions.getAccountListings,
    owner_functions.checkListingOwnerPost,
    owner_functions.getListingStats
  ]);

  //update listing information
  app.post('/listing/:domain_name/update', [
    auth.checkLoggedIn,
    urlencodedParser,
    checkDomainValid,
    checkDomainListed,
    profile_functions.getAccountListings,
    owner_functions.checkListingOwnerPost,
    owner_functions.checkListingVerified,
    owner_functions.checkListingPurchased,
    stripe.checkStripeSubscriptionUser,
    profile_functions.updateAccountSettingsGet,
    owner_functions.checkImageUploadSize,
    owner_functions.checkListingImage,
    owner_functions.checkListingStatus,
    owner_functions.checkListingPremiumDetails,
    owner_functions.checkListingDetails,
    owner_functions.checkListingModules,
    owner_functions.updateListingsInfo
  ]);

  //</editor-fold>

  //<editor-fold>-------------------------------BUYING RELATED-------------------------------

  //create a new offer history item
  app.post("/listing/:domain_name/contact/offer", [
    urlencodedParser,
    checkDomainValid,
    checkDomainListed,
    renter_functions.checkSessionListingInfoPost,
    buyer_functions.checkContactInfo,
    stripe.checkStripeSubscription,
    profile_functions.updateAccountSettingsGet,
    buyer_functions.createOfferContactRecord,
    buyer_functions.sendContactVerificationEmail
  ]);

  //verify a offer history item email
  app.get("/listing/:domain_name/contact/:verification_code", [
    urlencodedParser,
    checkDomainValid,
    buyer_functions.checkContactVerificationCode,
    renter_functions.getListingInfo,
    stripe.checkStripeSubscription,
    profile_functions.updateAccountSettingsGet,
    buyer_functions.verifyContactHistory
  ]);

  //render the accept or reject an offer page (deprecated, keep this redirect for now though)
  app.get(["/listing/:domain_name/contact/:offer_id/accept",
    "/listing/:domain_name/contact/:offer_id/reject"], [
    function(req, res, next){
      res.redirect("/profile/mylistings?listing=" + req.params.domain_name + "&tab=offers");
    }
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
    buyer_functions.checkAlreadyAccepted,
    buyer_functions.checkContactVerified,
    buyer_functions.acceptOrRejectOffer,
    buyer_functions.notifyOfferer
  ]);

  //resend an email for accept or transfer verify
  app.post(["/listing/:domain_name/contact/:offer_id/resend"], [
    auth.checkLoggedIn,
    urlencodedParser,
    checkDomainValid,
    checkDomainListed,
    profile_functions.getAccountListings,
    owner_functions.checkListingOwnerPost,
    sendOkay,
    buyer_functions.notifyOfferer
  ]);

  //render verify transfer ownership page
  app.get("/listing/:domain_name/bin/:verification_code", [
    checkDomainValid,
    checkDomainListed,
    buyer_functions.checkListingPurchaseVerificationCode,
    renter_functions.getListingInfo,
    stripe.checkStripeSubscription,
    profile_functions.updateAccountSettingsGet,
    buyer_functions.renderVerificationPage
  ]);

  //verify transfer ownership
  app.post("/listing/:domain_name/bin/:verification_code", [
    checkDomainValid,
    checkDomainListed,
    buyer_functions.checkListingPurchaseVerificationCode,
    buyer_functions.verifyTransferOwnership
  ]);

  //send offerer buy link post acceptance
  app.get("/listing/:domain_name/contact/:offer_id/bin", [
    urlencodedParser,
    checkDomainValid,
    buyer_functions.checkOfferAccepted,
    renter_functions.getListingInfo,
    stripe.checkStripeSubscription,
    profile_functions.updateAccountSettingsGet,
    buyer_functions.getContactInfo,
    buyer_functions.renderCheckout
  ]);

  //buy a listing
  app.post('/listing/:domain_name/buy', [
    urlencodedParser,
    checkDomainValid,
    checkDomainListed,
    renter_functions.checkSessionListingInfoPost,
    stripe.checkStripeSubscription,
    profile_functions.updateAccountSettingsGet,
    stripe.chargeMoneyBuy,
    buyer_functions.createBuyContactRecord,
    buyer_functions.alertOwnerBIN,
    buyer_functions.alertBuyerNextSteps,
    buyer_functions.deleteBINInfo,
    buyer_functions.disableListing,
    owner_functions.updateListingsInfo
  ]);

  //new buy it now
  app.post("/listing/:domain_name/contact/buy", [
    urlencodedParser,
    checkDomainValid,
    renter_functions.checkSessionListingInfoPost,
    buyer_functions.checkContactInfo,
    stripe.checkStripeSubscription,
    profile_functions.updateAccountSettingsGet,
    buyer_functions.redirectToCheckout
  ]);

  //render BIN checkout page
  app.get('/listing/:domain_name/checkout/buy', [
    buyer_functions.renderCheckout
  ]);

  //</editor-fold>

  //<editor-fold>-------------------------------RENTAL RELATED-------------------------------

  //domahub easter egg page
  app.get(['/listing/domahub.com', '/listing/w3bbi.com'], function(req, res){
    res.redirect("/");
  });

  //render specific listing page
  app.get('/listing/:domain_name', [
    checkDomainValid,
    renter_functions.addToSearchHistory,
    renter_functions.getListingInfo,
    renter_functions.checkStillVerified,
    stripe.checkStripeSubscription,
    profile_functions.updateAccountSettingsGet,
    // renter_functions.getListingFreeTimes,
    renter_functions.redirectPremium,
    renter_functions.renderListing
  ]);

  //get a domain's ticker information
  app.post("/listing/:domain_name/ticker", [
    urlencodedParser,
    renter_functions.getListingTicker
  ]);

  //get a domain's traffic
  app.post("/listing/:domain_name/traffic", [
    urlencodedParser,
    renter_functions.getListingTraffic
  ]);

  //get a domain's alexa information
  app.post("/listing/:domain_name/alexa", [
    urlencodedParser,
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
    stripe.checkStripeSubscription,
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
    stripe.checkStripeSubscription,
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

  //</editor-fold>

}

//<editor-fold>-------------------------------HELPERS-------------------------------

//function to check dev or not
function ifNotDev(req, res, next){
  if (node_env != "dev"){
    next();
  }
  else {
    res.sendStatus(200);
  }
}

//function to send okay
function sendOkay(req, res, next){
  res.send({
    state: "success"
  });

  next();
}

//function to check validity of domain name
function checkDomainValid(req, res, next){
  console.log("F: Checking domain FQDN validity...");
  var domain_name = req.params.domain_name || req.body["domain-name"];
  if (!validator.isAscii(domain_name) || !validator.isFQDN(domain_name)){
    error.handler(req, res, "Invalid domain name!");
  }

  //redirect to lowercase URL of listing
  else if (req.params.domain_name != req.params.domain_name.toLowerCase()){
    res.redirect(req.originalUrl.replace(req.params.domain_name, req.params.domain_name.toLowerCase()));
  }

  //redirect www. inside of a domain name
  else if (req.params.domain_name.indexOf("www.") != -1){
    res.redirect(req.originalUrl.replace("www.", ""));
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

//function to check if posted selected IDs are numbers
function checkSelectedIDs(req, res, next){
  console.log("F: Checking posted domain IDs...");
  var selected_ids = (req.body.selected_ids) ? req.body.selected_ids.split(",") : false;
  if (!selected_ids){
    error.handler(req, res, "You have selected invalid domains! Please refresh the page and try again!", "json");
  }
  else if (selected_ids.length <= 0){
    error.handler(req, res, "You have selected invalid domains! Please refresh the page and try again!", "json");
  }
  else {
    var all_good = true;
    for (var x = 0 ; x < selected_ids.length ; x++){
      if (!validator.isInt(selected_ids[x], { min : 1 })){
        all_good = false;
        break;
      }
    }
    if (!all_good){
      error.handler(req, res, "You have selected invalid domains! Please refresh the page and try again!", "json");
    }
    else {
      next();
    }
  }
}

//</editor-fold>
