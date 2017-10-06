var  account_model = require('../../models/account_model.js');
var  profile_functions = require('../profiles/profile_functions.js');

var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()
var urlencodedParser = bodyParser.urlencoded({ extended: true })

var request = require('request');
var validator = require('validator');
var qs = require('qs');

module.exports = function(app, db, auth, error, stripe){
  Account = new account_model(db);

  //<editor-fold>------------------------------------------------------------------------------------------RENTALS

  //myrentals pages
  // app.get([
  //   "/profile/myrentals",
  //   "/profile/myrentals/:page"
  // ], [
  //   auth.checkLoggedIn,
  //   profile_functions.getAccountRentals,
  //   profile_functions.renderMyRentals
  // ]);

  //myrentals multi delete
  // app.post("/profile/myrentals/delete", [
  //   urlencodedParser,
  //   auth.checkLoggedIn,
  //   profile_functions.getAccountRentals,
  //   profile_functions.checkPostedDeletionRows,
  //   profile_functions.deleteRentals
  // ]);

  //check if user is legit, get all listings, get all rentals
  app.get("/profile/dashboard", [
    auth.checkLoggedIn,
    profile_functions.getAccountListingsSearch,
    profile_functions.getAccountRentals,
    profile_functions.renderDashboard
  ]);

  // //inbox
  // app.get([
  //   "/profile/messages",
  //   "/profile/messages/:target_username"
  // ], [
  //   auth.checkLoggedIn,
  //   profile_functions.getAccountChats,
  //   profile_functions.renderInbox
  // ])

  //</editor-fold>

  //<editor-fold>------------------------------------------------------------------------------------------PROFILE

  //mylistings pages
  app.get([
    "/profile",
    "/profile/mylistings"
  ], [
    auth.checkLoggedIn,
    profile_functions.getAccountListings,
    stripe.getAccountInfo,
    stripe.getStripeSubscription,
    profile_functions.updateAccountSettingsGet,
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

  //mylistings multi verify
  app.post("/profile/mylistings/verify", [
    urlencodedParser,
    auth.checkLoggedIn,
    profile_functions.getAccountListings,
    stripe.getAccountInfo,
    profile_functions.checkPostedVerificationRows,
    profile_functions.verifyListings
  ]);

  //add a new card to user
  app.post("/profile/newcard", [
    urlencodedParser,
    auth.checkLoggedIn,
    stripe.createStripeCustomer,
    profile_functions.updateAccountSettingsPost
  ]);

  //update listing to premium
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

  //settings
  app.get("/profile/settings", [
    auth.checkLoggedIn,
    stripe.getAccountInfo,
    stripe.getTransfers,
    stripe.getStripeCustomer,
    stripe.getStripeSubscription,
    profile_functions.updateAccountSettingsGet,
    profile_functions.renderSettings
  ]);

  //redirect anything not caught above to /profile
  app.get("/profile*", profile_functions.redirectProfile);

  //</editor-fold>

  //<editor-fold>------------------------------------------------------------------------------------------ STRIPE MANAGED

  //post to change account settings
  app.post("/profile/settings", [
    urlencodedParser,
    auth.checkLoggedIn,
    auth.checkAccountSettings,
    profile_functions.updateAccountSettingsPost
  ]);

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
