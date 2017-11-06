//<editor-fold>-------------------------------DOMA LIB FUNCTIONS-------------------------------

var general_functions = require('../controller/general_functions.js');
var auth_functions = require('../controller/auth_functions.js');
var profile_functions = require('../controller/profile_functions.js');
var stripe_functions = require('../controller/stripe_functions.js');

//</editor-fold>

module.exports = function(app){

  //<editor-fold>-------------------------------DASHBOARD-------------------------------

  //dashboard
  app.get("/profile/dashboard", [
    auth_functions.checkLoggedIn,
    stripe_functions.getAccountInfo,
    stripe_functions.getStripeCustomer,
    stripe_functions.getStripeSubscription,
    profile_functions.updateAccountSettingsGet,
    profile_functions.getAccountListings,
    profile_functions.renderDashboard
  ]);

  //</editor-fold>

  //<editor-fold>-------------------------------MY LISTINGS-------------------------------

  //mylistings pages
  app.get("/profile/mylistings", [
    auth_functions.checkLoggedIn,
    profile_functions.getAccountListings,
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
    profile_functions.getDNSRecordsMulti
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
    stripe_functions.getAccountInfo,
    stripe_functions.getTransfers,
    stripe_functions.getStripeCustomer,
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

  //</editor-fold>

  //<editor-fold>-------------------------------PROMO CODES-------------------------------

  //get all existing referral promo codes for user
  app.post("/profile/getreferrals", [
    general_functions.urlencodedParser,
    auth_functions.checkLoggedIn,
    profile_functions.getReferralsFromUser,
  ]);

  //posting a new promo code
  app.post("/profile/promocode", [
    general_functions.urlencodedParser,
    auth_functions.checkLoggedIn,
    profile_functions.checkPromoCode,
    stripe_functions.getExistingDiscount,
    profile_functions.checkExistingPromoCode,
    stripe_functions.deletePromoCode,
    profile_functions.applyPromoCode,
    stripe_functions.applyPromoCode,
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

  //upgrade account to premium
  app.post("/profile/upgrade", [
    general_functions.urlencodedParser,
    auth_functions.checkLoggedIn,
    profile_functions.getExistingCoupon,
    stripe_functions.createStripeSubscription,
    profile_functions.updateAccountSettingsPost
  ]);

  //cancel renewal of premium
  app.post("/profile/downgrade", [
    general_functions.urlencodedParser,
    auth_functions.checkLoggedIn,
    stripe_functions.cancelStripeSubscription
  ]);

  //</editor-fold>

  //<editor-fold>-------------------------------STRIPE TRANSFER-------------------------------

  //transfer to bank
  app.post("/profile/transfer", [
    general_functions.urlencodedParser,
    auth_functions.checkLoggedIn,
    stripe_functions.getAccountInfo,
    stripe_functions.getTransfers,
    stripe_functions.getStripeCustomer,
    stripe_functions.getStripeSubscription,
    stripe_functions.transferMoney
  ]);

  //post to create new stripe managed account or update address of old
  app.post("/profile/settings/payout/address", [
    general_functions.urlencodedParser,
    auth_functions.checkLoggedIn,
    stripe_functions.checkPayoutAddress,
    stripe_functions.createManagedAccount,
    profile_functions.updateAccountStripe
  ]);

  //post to update personal info of old stripe managed account
  app.post("/profile/settings/payout/personal", [
    general_functions.urlencodedParser,
    auth_functions.checkLoggedIn,
    stripe_functions.checkManagedAccount,
    stripe_functions.checkPayoutPersonal,
    stripe_functions.updateStripePersonal,
    profile_functions.updateAccountStripe
  ]);

  //post to update personal info of existing stripe managed account
  app.post("/profile/settings/payout/personal", [
    general_functions.urlencodedParser,
    auth_functions.checkLoggedIn,
    stripe_functions.checkManagedAccount,
    stripe_functions.checkPayoutPersonal,
    stripe_functions.updateStripePersonal
  ]);

  //post to update bank info of existing stripe managed account
  app.post("/profile/settings/payout/bank", [
    general_functions.urlencodedParser,
    auth_functions.checkLoggedIn,
    stripe_functions.checkManagedAccount,
    stripe_functions.checkPayoutBank,
    stripe_functions.updateStripeBank
  ]);

  //</editor-fold>

  //<editor-fold>-------------------------------REDIRECT-------------------------------

  //redirect upgrade premium to right link
  app.get([
    "/premium"
  ], [
    function(req, res, next){
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
