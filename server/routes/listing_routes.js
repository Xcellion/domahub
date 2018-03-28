//<editor-fold>-------------------------------DOMA LIB FUNCTIONS-------------------------------

var general_functions = require('../controller/general_functions.js');
var auth_functions = require('../controller/auth_functions.js');
var renter_functions = require("../controller/listing_renter_functions.js");
var buyer_functions = require("../controller/listing_buyer_functions.js");
var owner_functions = require("../controller/listing_owner_functions.js");
var listing_general_functions = require("../controller/listing_general_functions.js");
var profile_functions = require("../controller/profile_functions.js");
var stripe_functions = require("../controller/stripe_functions.js");
var paypal_functions = require("../controller/paypal_functions.js");

//</editor-fold>>

module.exports = function(app){

  //<editor-fold>-------------------------------OWNER RELATED-------------------------------

    //<editor-fold>-------------------------------LISTING CREATE-------------------------------

    //render listing create
    app.get('/listings/create', [
      auth_functions.checkLoggedIn,
      profile_functions.getAccountListings,
      profile_functions.getAccountRegistrars,
      stripe_functions.getStripeAccount,
      stripe_functions.getStripeCustomer,
      stripe_functions.getStripeSubscription,
      profile_functions.updateAccountSettingsPassthrough,
      owner_functions.renderCreateListing
    ]);

    //check all posted textarea domains to render table
    app.post("/listings/create/table", [
      general_functions.urlencodedParser,
      auth_functions.checkLoggedIn,
      profile_functions.getAccountListings,    //to find out if we've reached max listings count for basic
      owner_functions.checkPostedDomainNames
    ]);

    //create new domains from table
    app.post("/listings/create", [
      general_functions.urlencodedParser,
      auth_functions.checkLoggedIn,
      profile_functions.getAccountListings,    //to find out which listings were not created in multi-create
      owner_functions.checkPostedListingInfoForCreate,
      owner_functions.setDNSViaRegistrar,
      owner_functions.setDNSExpiration,
      owner_functions.createListings
    ]);

    //redirect all /create to proper /create
    app.get('/listings/create*', function(req, res){
      res.redirect("/listings/create");
    });

    //</editor-fold>

    //<editor-fold>-------------------------------LISTING UPDATE-------------------------------

    //update listing information (single)
    app.post('/listing/:domain_name/update', [
      auth_functions.checkLoggedIn,
      general_functions.urlencodedParser,
      listing_general_functions.checkDomainValid,
      listing_general_functions.checkDomainListed,
      profile_functions.getAccountListings,
      owner_functions.checkListingOwnerPost,
      owner_functions.checkListingVerified,
      owner_functions.checkListingPurchased,
      stripe_functions.checkStripeSubscriptionForOwner,
      profile_functions.updateAccountSettingsPassthrough,
      owner_functions.checkImageUploadSize,
      owner_functions.checkListingImage,
      owner_functions.checkListingStatus,
      owner_functions.checkListingPremiumDetails,
      owner_functions.checkListingDetails,
      owner_functions.updateListingHubRanks,
      owner_functions.updateListingsInfo
    ]);

    //multi update of listings details
    app.post("/listings/multiupdate", [
      auth_functions.checkLoggedIn,
      general_functions.urlencodedParser,
      owner_functions.checkImageUploadSize,
      owner_functions.checkSelectedIDs,
      profile_functions.getAccountListings,
      owner_functions.checkPostedListingInfoMulti,
      stripe_functions.checkStripeSubscriptionForOwner,
      profile_functions.updateAccountSettingsPassthrough,
      owner_functions.checkListingImage,
      owner_functions.checkListingStatus,
      owner_functions.checkListingPremiumDetails,
      owner_functions.checkListingDetails,
      owner_functions.updateListingsInfo
    ]);

    //<editor-fold>-------------------------------DOMAIN EXPENSES-------------------------------

    //get any existing expenses
    app.post("/listings/getexpenses", [
      auth_functions.checkLoggedIn,
      general_functions.urlencodedParser,
      owner_functions.checkSelectedIDs,
      profile_functions.getAccountListings,
      owner_functions.getDomainExpenses
    ]);

    //create new expense
    app.post("/listings/newexpenses", [
      auth_functions.checkLoggedIn,
      general_functions.urlencodedParser,
      owner_functions.checkSelectedIDs,
      profile_functions.getAccountListings,
      owner_functions.checkExpenseDetails,
      owner_functions.createDomainExpense,
      owner_functions.getDomainExpenses
    ]);

    //edit an existing expense
    app.post("/listings/editexpenses", [
      auth_functions.checkLoggedIn,
      general_functions.urlencodedParser,
      owner_functions.checkSelectedIDs,
      profile_functions.getAccountListings,
      owner_functions.checkExpenseIDs,
      owner_functions.deleteDomainExpense,
      owner_functions.checkExpenseDetails,
      owner_functions.createDomainExpense,
      owner_functions.getDomainExpenses
    ]);

    //delete an existing expense
    app.post("/listings/deleteexpenses", [
      auth_functions.checkLoggedIn,
      general_functions.urlencodedParser,
      owner_functions.checkSelectedIDs,
      profile_functions.getAccountListings,
      owner_functions.checkExpenseIDs,
      owner_functions.deleteDomainExpense,
      owner_functions.getDomainExpenses
    ]);

    //</editor-fold>

    //</editor-fold>

    //<editor-fold>-------------------------------LISTING STATISTICS-------------------------------

    //get stats for a verified domain
    // app.post('/listing/:domain_name/getstats', [
    //   auth_functions.checkLoggedIn,
    //   general_functions.urlencodedParser,
    //   listing_general_functions.checkDomainValid,
    //   listing_general_functions.checkDomainListed,
    //   profile_functions.getAccountListings,
    //   owner_functions.checkListingOwnerPost,
    //   owner_functions.getListingStats
    // ]);

    //</editor-fold>

  //</editor-fold>

  //<editor-fold>-------------------------------BUYING RELATED-------------------------------

    //<editor-fold>-------------------------------CREATE / VERIFY OFFER-------------------------------

    //create a new offer history item
    app.post("/listing/:domain_name/contact/offer", [
      general_functions.urlencodedParser,
      listing_general_functions.checkDomainValid,
      listing_general_functions.checkDomainListed,
      renter_functions.checkSessionListingInfoPost,
      buyer_functions.checkContactInfo,
      stripe_functions.checkStripeSubscriptionForUser,
      profile_functions.updateAccountSettingsPassthrough,
      buyer_functions.createOfferContactRecord,
      buyer_functions.sendContactVerificationEmail
    ]);

    //verify a offer history item email
    app.get("/listing/:domain_name/contact/:verification_code", [
      general_functions.urlencodedParser,
      listing_general_functions.checkDomainValid,
      buyer_functions.checkContactVerificationCode,
      renter_functions.getListingInfo,
      stripe_functions.checkStripeSubscriptionForUser,
      profile_functions.updateAccountSettingsPassthrough,
      buyer_functions.verifyContactHistory
    ]);

    //</editor-fold>

    //<editor-fold>-------------------------------ACCEPT / TRANSFER-------------------------------

    //accept or reject an offer
    app.post(["/listing/:domain_name/contact/:offer_id/accept",
      "/listing/:domain_name/contact/:offer_id/reject"], [
      auth_functions.checkLoggedIn,
      general_functions.urlencodedParser,
      listing_general_functions.checkDomainValid,
      listing_general_functions.checkDomainListed,
      profile_functions.getAccountListings,
      owner_functions.checkListingOwnerPost,
      buyer_functions.checkAlreadyAccepted,
      buyer_functions.checkContactVerified,
      buyer_functions.acceptOrRejectOffer,
      buyer_functions.notifyOfferer
    ]);

    //send offerer buy link post acceptance
    app.get("/listing/:domain_name/contact/:offer_id/bin", [
      general_functions.urlencodedParser,
      listing_general_functions.checkDomainValid,
      buyer_functions.checkOfferAccepted,
      renter_functions.getListingInfo,
      stripe_functions.checkStripeSubscriptionForUser,
      profile_functions.updateAccountSettingsPassthrough,
      buyer_functions.getContactInfo,
      buyer_functions.renderCheckout
    ]);

    //resend an email for accept or transfer verify
    app.post(["/listing/:domain_name/contact/:offer_id/resend"], [
      auth_functions.checkLoggedIn,
      general_functions.urlencodedParser,
      listing_general_functions.checkDomainValid,
      listing_general_functions.checkDomainListed,
      profile_functions.getAccountListings,
      owner_functions.checkListingOwnerPost,
      general_functions.sendSuccessNext,
      buyer_functions.notifyOfferer
    ]);

    //render verify transfer ownership page
    app.get("/listing/:domain_name/bin/:verification_code", [
      listing_general_functions.checkDomainValid,
      listing_general_functions.checkDomainListed,
      buyer_functions.checkListingPurchaseVerificationCode,
      renter_functions.getListingInfo,
      stripe_functions.checkStripeSubscriptionForUser,
      profile_functions.updateAccountSettingsPassthrough,
      buyer_functions.renderVerificationPage
    ]);

    //verify transfer ownership
    app.post("/listing/:domain_name/bin/:verification_code", [
      listing_general_functions.checkDomainValid,
      listing_general_functions.checkDomainListed,
      buyer_functions.checkListingPurchaseVerificationCode,
      buyer_functions.verifyTransferOwnership
    ]);

    //</editor-fold>

    //<editor-fold>-------------------------------BUY-------------------------------

    //buy a listing
    app.post('/listing/:domain_name/buy', [
      general_functions.urlencodedParser,
      listing_general_functions.checkDomainValid,
      listing_general_functions.checkDomainListed,
      renter_functions.checkSessionListingInfoPost,
      renter_functions.checkListingRented,
      stripe_functions.checkStripeSubscriptionForUser,
      profile_functions.updateAccountSettingsPassthrough,
      buyer_functions.checkPaymentType,
      stripe_functions.chargeMoneyBuy,
      paypal_functions.chargeMoneyBuy,
      buyer_functions.createBuyContactRecord,
      buyer_functions.alertOwnerBIN,
      buyer_functions.alertBuyerNextSteps,
      buyer_functions.deleteBINInfo,
      buyer_functions.disableListing,
      owner_functions.updateListingsInfo
    ]);

    //new buy it now (render the BIN checkout page)
    app.post("/listing/:domain_name/contact/buy", [
      general_functions.urlencodedParser,
      listing_general_functions.checkDomainValid,
      renter_functions.checkSessionListingInfoPost,
      renter_functions.checkListingRented,
      buyer_functions.checkContactInfo,
      stripe_functions.checkStripeSubscriptionForUser,
      profile_functions.updateAccountSettingsPassthrough,
      buyer_functions.redirectToCheckout
    ]);

    //render BIN checkout page
    app.get('/listing/:domain_name/checkout/buy', [
      buyer_functions.renderCheckout
    ]);

    //create a paypal payment ID for BIN domain
    app.post('/listing/:domain_name/buy/paypalID', [
      general_functions.urlencodedParser,
      renter_functions.checkSessionListingInfoPost,
      renter_functions.checkListingRented,
      stripe_functions.checkStripeSubscriptionForUser,
      profile_functions.updateAccountSettingsPassthrough,
      paypal_functions.createPaymentIDBuy
    ]);

    //</editor-fold>

  //</editor-fold>

  //<editor-fold>-------------------------------RENTAL RELATED-------------------------------

    //<editor-fold>-------------------------------LISTING PAGE-------------------------------

    //domahub easter egg page
    app.get(['/listing/domahub.com', '/listing/w3bbi.com'], function(req, res){
      res.redirect("/");
    });

    //render specific listing page
    app.get('/listing/:domain_name', [
      listing_general_functions.checkDomainValid,
      renter_functions.addToSearchHistory,
      renter_functions.getListingInfo,
      renter_functions.checkStillVerified,
      stripe_functions.checkStripeSubscriptionForUser,
      profile_functions.updateAccountSettingsPassthrough,
      // renter_functions.getListingFreeTimes,
      renter_functions.redirectPremium,
      renter_functions.renderListing
    ]);

    //get random listings belonging to specific owner
    app.post("/listing/otherowner", [
      general_functions.urlencodedParser,
      renter_functions.getOtherListings
    ]);

    //get a domain's ticker information
    app.post("/listing/:domain_name/ticker", [
      general_functions.urlencodedParser,
      renter_functions.getListingTicker
    ]);

    //get a domain's traffic
    app.post("/listing/:domain_name/traffic", [
      general_functions.urlencodedParser,
      renter_functions.getListingTraffic
    ]);

    //get a domain's alexa information
    app.post("/listing/:domain_name/alexa", [
      general_functions.urlencodedParser,
      renter_functions.getListingAlexa
    ]);

    //get listing info / times
    app.post('/listing/:domain_name/times', [
      general_functions.urlencodedParser,
      renter_functions.addToAvailCheckHistory,
      renter_functions.getListingTimes
    ]);

    //</editor-fold>

    //<editor-fold>-------------------------------RENTAL CHECKOUT-------------------------------

    //render rental checkout page
    app.get('/listing/:domain_name/checkout/rent', [
      renter_functions.renderCheckout
    ]);

    //track checkout behavior
    app.post("/listing/:domain_name/checkouttrack", [
      general_functions.ifNotDev,
      general_functions.urlencodedParser,
      renter_functions.addToCheckoutAction
    ]);

    //redirect to the checkout page after validating times / path
    app.post('/listing/:domain_name/checkoutrent', [
      general_functions.urlencodedParser,
      listing_general_functions.checkDomainValid,
      listing_general_functions.checkDomainListed,
      // renter_functions.deletePipeToDH,
      renter_functions.checkSessionListingInfoPost,
      stripe_functions.checkStripeSubscriptionForUser,
      // renter_functions.getListingFreeTimes,
      renter_functions.createNewRentalObject,
      renter_functions.checkRentalTimes,
      renter_functions.checkRentalPrice,
      renter_functions.addToRentalCheckoutHistory,
      renter_functions.redirectToCheckout
    ]);

    //create a paypal payment ID for rental domain
    app.post('/listing/:domain_name/rent/paypalID', [
      general_functions.urlencodedParser,
      renter_functions.checkSessionListingInfoPost,
      stripe_functions.checkStripeSubscriptionForUser,
      profile_functions.updateAccountSettingsPassthrough,
      paypal_functions.createPaymentIDRent
    ]);

    //</editor-fold>

    //<editor-fold>-------------------------------CREATE RENTAL-------------------------------

    //create a new rental
    app.post('/listing/:domain_name/rent', [
      general_functions.urlencodedParser,
      listing_general_functions.checkDomainValid,
      listing_general_functions.checkDomainListed,
      renter_functions.checkSessionListingInfoPost,
      stripe_functions.checkStripeSubscriptionForUser,
      profile_functions.updateAccountSettingsPassthrough,
      // renter_functions.getListingFreeTimes,
      renter_functions.checkRentalInfoNew,
      renter_functions.checkRentalTimes,
      renter_functions.checkRentalPrice,
      renter_functions.createRental,
      renter_functions.getOwnerStripe,
      renter_functions.checkPaymentType,
      stripe_functions.chargeMoneyRent,
      paypal_functions.chargeMoneyRent,
      renter_functions.markActiveAndPaidRental,
      renter_functions.sendRentalSuccess
    ]);

    //associate a user with a hash rental
    app.get(['/listing/:domain_name/:rental_id/:owner_hash_id',
    '/listing/:domain_name/:rental_id'], [
      listing_general_functions.checkDomainValid,
      listing_general_functions.checkDomainListed,
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

    //</editor-fold>

    //<editor-fold>-------------------------------EDIT RENTAL-------------------------------

    //render rental page
    app.get('/rentalpreview', [
      renter_functions.checkForPreview,
      renter_functions.renderRental
    ]);

    //refund a rental
    app.post('/listing/:domain_name/:rental_id/refund', [
      general_functions.urlencodedParser,
      listing_general_functions.checkDomainValid,
      listing_general_functions.checkDomainListed,
      owner_functions.checkListingOwnerPost,
      renter_functions.getRental,
      renter_functions.checkRentalDomain,
      renter_functions.checkRentalPaymentID,
      renter_functions.createRentalObject,
      stripe_functions.refundRental,
      paypal_functions.refundRental,
      renter_functions.editRental,
      renter_functions.updateRentalObject
    ]);

    //changing rental information
    app.post('/listing/:domain_name/:rental_id/edit', [
      general_functions.urlencodedParser,
      listing_general_functions.checkDomainValid,
      listing_general_functions.checkDomainListed,
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
      general_functions.urlencodedParser,
      auth_functions.checkLoggedIn,
      listing_general_functions.checkDomainValid,
      listing_general_functions.checkDomainListed,
      renter_functions.getRental,
      renter_functions.checkRentalDomain,
      renter_functions.checkRentalOwner,
      renter_functions.createRentalObject,
      renter_functions.deactivateRental,
      renter_functions.editRental,
      renter_functions.updateRentalObject
    ]);

    //</editor-fold>

  //</editor-fold>

}
