//<editor-fold>-------------------------------DOMA LIB FUNCTIONS-------------------------------

var general_functions = require('../controller/general_functions.js');
var auth_functions = require('../controller/auth_functions.js');
var profile_functions = require('../controller/profile_functions.js');
var owner_functions = require('../controller/listing_owner_functions.js');
var stripe_functions = require('../controller/stripe_functions.js');

//</editor-fold>

module.exports = function(app){

  //<editor-fold>-------------------------------DASHBOARD-------------------------------

  //dashboard
  app.get("/profile/dashboard", [
    auth_functions.checkLoggedIn,
    stripe_functions.getStripeAccount,
    stripe_functions.getStripeTransactions,
    stripe_functions.getStripeCustomer,
    stripe_functions.getStripeSubscription,
    profile_functions.updateAccountSettingsGet,
    profile_functions.getAccountListings,
    profile_functions.authWithGoogle,
    profile_functions.renderDashboard
  ]);

  //</editor-fold>

  //<editor-fold>-------------------------------MY LISTINGS-------------------------------

  //mylistings pages
  app.get("/profile/mylistings", [
    auth_functions.checkLoggedIn,
    profile_functions.getAccountListings,
    stripe_functions.getStripeSubscription,
    profile_functions.renderMyListings
  ]);

  //mylistings refresh listings
  app.post("/profile/mylistings/refresh", [
    auth_functions.checkLoggedIn,
    function(req, res, next){
      delete req.user.listings;
      next();
    },
    profile_functions.getAccountListings,
    function(req, res, next){
      res.send({
        state: "success",
        listings: req.user.listings
      });
    }
  ]);

  //mylistings multi delete
  app.post("/profile/mylistings/delete", [
    general_functions.urlencodedParser,
    auth_functions.checkLoggedIn,
    profile_functions.getAccountListings,
    profile_functions.checkPostedDeletionRows,
    profile_functions.deleteListings
  ]);

  //mylistings multi offer
  app.post("/profile/mylistings/offers", [
    general_functions.urlencodedParser,
    auth_functions.checkLoggedIn,
    profile_functions.getAccountListings,
    profile_functions.getOffersMulti
  ]);

  //mylistings multi DNS records
  app.post("/profile/mylistings/dnsrecords", [
    general_functions.urlencodedParser,
    auth_functions.checkLoggedIn,
    profile_functions.getAccountListings,
    profile_functions.getDNSRecordsMulti,
    owner_functions.updateListingsRegistrarInfo
  ]);

  //mylistings multi verify
  app.post("/profile/mylistings/verify", [
    general_functions.urlencodedParser,
    auth_functions.checkLoggedIn,
    profile_functions.getAccountListings,
    profile_functions.checkPostedVerificationRows,
    profile_functions.verifyListings
  ]);

  //</editor-fold>

  //<editor-fold>-------------------------------ACCOUNT SETTINGS-------------------------------

  //settings
  app.get("/profile/settings", [
    auth_functions.checkLoggedIn,
    profile_functions.getAccountListings,
    profile_functions.getAccountRegistrars,
    stripe_functions.getStripeAccount,
    stripe_functions.getStripeTransactions,
    stripe_functions.getStripeCustomer,
    stripe_functions.getStripeCustomerInvoices,
    profile_functions.getUnredeemedPromoCodes,
    stripe_functions.getStripeCustomerNextInvoice,
    stripe_functions.getStripeSubscription,
    profile_functions.updateAccountSettingsGet,
    profile_functions.renderSettings
  ]);

  //post to change account settings
  app.post("/profile/settings", [
    general_functions.urlencodedParser,
    auth_functions.checkLoggedIn,
    profile_functions.checkAccountSettings,
    profile_functions.updateAccountSettingsPost
  ]);

  //get all existing transactions for user (sales / rentals)
  app.post("/profile/gettransactions", [
    general_functions.urlencodedParser,
    auth_functions.checkLoggedIn,
    stripe_functions.getStripeTransactions
  ]);

  //</editor-fold>

  //<editor-fold>-------------------------------REGISTRAR-------------------------------

  //post to update registrar
  app.post("/profile/registrar", [
    general_functions.urlencodedParser,
    auth_functions.checkLoggedIn,
    profile_functions.checkRegistrarInfo,
    profile_functions.updateAccountRegistrar
  ]);

  //lookup registrars and pull domain names
  app.post("/profile/registrar/lookup", [
    auth_functions.checkLoggedIn,
    profile_functions.getRegistrarAPI,
    profile_functions.getRegistrarDomains
  ]);

  //</editor-fold>

  //<editor-fold>-------------------------------PROMO CODES-------------------------------

  //get all existing referral promo codes for user
  app.post("/profile/getreferrals", [
    general_functions.urlencodedParser,
    auth_functions.checkLoggedIn,
    profile_functions.getCouponsAndReferralsForUser,
  ]);

  //posting a new promo code or referral
  app.post("/profile/promocode", [
    general_functions.urlencodedParser,
    auth_functions.checkLoggedIn,
    profile_functions.checkPromoCode,
    profile_functions.applyPromoCode
  ]);

  //</editor-fold>

  //<editor-fold>-------------------------------STRIPE SUBSCRIPTION-------------------------------

  //add a new card to user (stripe subscription)
  app.post("/profile/newcard", [
    general_functions.urlencodedParser,
    auth_functions.checkLoggedIn,
    stripe_functions.createStripeCustomer,
    profile_functions.updateAccountSettingsPost
  ]);

  //remove existing card for user (stripe customer)
  app.post("/profile/deletecard", [
    general_functions.urlencodedParser,
    auth_functions.checkLoggedIn,
    stripe_functions.deleteCustomerCard,
    stripe_functions.cancelStripeSubscription,
    profile_functions.getAccountListings
  ]);

  //upgrade account to premium
  app.post("/profile/upgrade", [
    general_functions.urlencodedParser,
    auth_functions.checkLoggedIn,
    stripe_functions.createStripeSubscription,
    stripe_functions.getStripeCustomerInvoices,
    profile_functions.getUnredeemedPromoCodes,
    stripe_functions.getStripeCustomerNextInvoice,
    profile_functions.updateAccountSettingsPost
  ]);

  //cancel premium
  app.post("/profile/downgrade", [
    general_functions.urlencodedParser,
    auth_functions.checkLoggedIn,
    stripe_functions.cancelStripeSubscription,
    profile_functions.getAccountListings
  ]);

  //</editor-fold>

  //<editor-fold>-------------------------------STRIPE TRANSFER-------------------------------

  //post to create new stripe managed account or update stripe managed account
  app.post("/profile/settings/payout", [
    general_functions.urlencodedParser,
    auth_functions.checkLoggedIn,
    stripe_functions.getStripeAccount,
    stripe_functions.checkPayoutPersonal,
    stripe_functions.checkPayoutAddress,
    stripe_functions.createStripeAccount,
    profile_functions.updateAccountSettingsPost
  ]);

  //post to create new stripe managed account or update stripe managed account
  app.post("/profile/settings/bank", [
    general_functions.urlencodedParser,
    auth_functions.checkLoggedIn,
    stripe_functions.getStripeAccount,
    stripe_functions.checkPayoutBank,
    stripe_functions.createStripeBank
  ]);

  //transfer to bank
  app.post("/profile/transfer", [
    general_functions.urlencodedParser,
    auth_functions.checkLoggedIn,
    stripe_functions.getStripeAccount,
    stripe_functions.getStripeTransactions,
    stripe_functions.getStripeCustomer,
    stripe_functions.getStripeSubscription,
    stripe_functions.transferMoney
  ]);

  //</editor-fold>

  //<editor-fold>-------------------------------REDIRECT-------------------------------

  //redirect upgrade premium to right link
  app.get([
    "/premium"
  ], [
    function(req, res, next){
      console.log("F: Redirecting to appropriate Premium link...");
      if (req.isAuthenticated()){
        res.redirect("/profile/settings#premium");
      }
      else {
        res.redirect("/features#pricing");
      }
    }
  ]);

  //redirect anything not caught above to /profile
  app.get("/profile*", profile_functions.redirectProfile);

  //</editor-fold>

}
