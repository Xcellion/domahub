var account_model = require('../../models/account_model.js');
var profile_functions = require('../profiles/profile_functions.js');

var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()
var urlencodedParser = bodyParser.urlencoded({ extended: true })

module.exports = function(app, db, auth, error, stripe){
  Account = new account_model(db);

  //<editor-fold>-----------------------------------PROFILE-------------------------------------------------------

  //dashboard
  app.get("/profile/dashboard", [
    auth.checkLoggedIn,
    stripe.getAccountInfo,
    stripe.getStripeCustomer,
    stripe.getStripeSubscription,
    profile_functions.updateAccountSettingsGet,
    profile_functions.getAccountListings,
    profile_functions.renderDashboard
  ]);

  //mylistings pages
  app.get("/profile/mylistings", [
    auth.checkLoggedIn,
    profile_functions.getAccountListings,
    profile_functions.renderMyListings
  ]);

  //mylistings multi delete
  app.post("/profile/mylistings/delete", [
    urlencodedParser,
    auth.checkLoggedIn,
    profile_functions.getAccountListings,
    profile_functions.checkPostedDeletionRows,
    profile_functions.deleteListings
  ]);

  //mylistings multi offer
  app.post("/profile/mylistings/offers", [
    urlencodedParser,
    auth.checkLoggedIn,
    profile_functions.getAccountListings,
    profile_functions.getOffersMulti
  ]);

  //mylistings multi DNS records
  app.post("/profile/mylistings/dnsrecords", [
    urlencodedParser,
    auth.checkLoggedIn,
    profile_functions.getAccountListings,
    profile_functions.getDNSRecordsMulti
  ]);

  //mylistings multi verify
  app.post("/profile/mylistings/verify", [
    urlencodedParser,
    auth.checkLoggedIn,
    profile_functions.getAccountListings,
    profile_functions.checkPostedVerificationRows,
    profile_functions.verifyListings
  ]);

  //settings
  app.get("/profile/settings", [
    auth.checkLoggedIn,
    profile_functions.getAccountListings,
    stripe.getAccountInfo,
    stripe.getTransfers,
    stripe.getStripeCustomer,
    stripe.getStripeSubscription,
    profile_functions.updateAccountSettingsGet,
    profile_functions.renderSettings
  ]);

  //redirect upgrade premium to right link
  app.get([
    "/upgrade",
    "/premium"
  ], [
    auth.checkLoggedIn,
    function(req, res, next){
      res.redirect("/profile/settings#premium");
    }
  ]);

  //redirect anything not caught above to /profile
  app.get("/profile*", profile_functions.redirectProfile);

  //post to change account settings
  app.post("/profile/settings", [
    urlencodedParser,
    auth.checkLoggedIn,
    auth.checkAccountSettings,
    profile_functions.updateAccountSettingsPost
  ]);

  //</editor-fold>

  //<editor-fold>-----------------------------------PROMO CODES-------------------------------------------------------

  //get all existing referral promo codes for user
  app.post("/profile/getreferrals", [
    urlencodedParser,
    auth.checkLoggedIn,
    profile_functions.getReferralsFromUser,
  ]);

  //posting a new promo code
  app.post("/profile/promocode", [
    urlencodedParser,
    auth.checkLoggedIn,
    profile_functions.checkPromoCode,
    stripe.getExistingDiscount,
    profile_functions.checkExistingPromoCode,
    stripe.deletePromoCode,
    profile_functions.applyPromoCode,
    stripe.applyPromoCode,
  ]);

  //</editor-fold>

  //<editor-fold>-----------------------------------STRIPE-------------------------------------------------------

  //add a new card to user (stripe subscription)
  app.post("/profile/newcard", [
    urlencodedParser,
    auth.checkLoggedIn,
    stripe.createStripeCustomer,
    profile_functions.updateAccountSettingsPost
  ]);

  //upgrade account to premium
  app.post("/profile/upgrade", [
    urlencodedParser,
    auth.checkLoggedIn,
    profile_functions.getExistingCoupon,
    stripe.createStripeSubscription,
    profile_functions.updateAccountSettingsPost
  ]);

  //cancel renewal of premium
  app.post("/profile/downgrade", [
    urlencodedParser,
    auth.checkLoggedIn,
    stripe.cancelStripeSubscription
  ]);

  //transfer to bank
  app.post("/profile/transfer", [
    urlencodedParser,
    auth.checkLoggedIn,
    stripe.getAccountInfo,
    stripe.getTransfers,
    stripe.getStripeCustomer,
    stripe.getStripeSubscription,
    stripe.transferMoney
  ]);

  //post to create new stripe managed account or update address of old
  app.post("/profile/settings/payout/address", [
    urlencodedParser,
    auth.checkLoggedIn,
    stripe.checkPayoutAddress,
    stripe.createManagedAccount,
    profile_functions.updateAccountStripe
  ]);

  //post to update personal info of old stripe managed account
  app.post("/profile/settings/payout/personal", [
    urlencodedParser,
    auth.checkLoggedIn,
    stripe.checkManagedAccount,
    stripe.checkPayoutPersonal,
    stripe.updateStripePersonal,
    profile_functions.updateAccountStripe
  ]);

  //post to update personal info of existing stripe managed account
  app.post("/profile/settings/payout/personal", [
    urlencodedParser,
    auth.checkLoggedIn,
    stripe.checkManagedAccount,
    stripe.checkPayoutPersonal,
    stripe.updateStripePersonal
  ]);

  //post to update bank info of existing stripe managed account
  app.post("/profile/settings/payout/bank", [
    urlencodedParser,
    auth.checkLoggedIn,
    stripe.checkManagedAccount,
    stripe.checkPayoutBank,
    stripe.updateStripeBank
  ]);

  //</editor-fold>
}
