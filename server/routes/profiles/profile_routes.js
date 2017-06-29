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

  //mylistings pages
  app.get([
    "/profile",
    "/profile/mylistings"
  ], [
    auth.checkLoggedIn,
    profile_functions.getAccountListings,
    stripe.getAccountInfo,
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

  //myrentals pages
  app.get([
    "/profile/myrentals",
    "/profile/myrentals/:page"
  ], [
    auth.checkLoggedIn,
    profile_functions.getAccountRentals,
    profile_functions.renderMyRentals
  ]);

  //myrentals multi delete
  app.post("/profile/myrentals/delete", [
    urlencodedParser,
    auth.checkLoggedIn,
    profile_functions.getAccountRentals,
    profile_functions.checkPostedDeletionRows,
    profile_functions.deleteRentals
  ]);

  // //check if user is legit, get all listings, get all rentals
  // app.get("/profile/dashboard", [
  //   auth.checkLoggedIn,
  //   profile_functions.getAccountListingsSearch,
  //   profile_functions.getAccountRentals,
  //   profile_functions.renderDashboard
  // ]);

  // //inbox
  // app.get([
  //   "/profile/messages",
  //   "/profile/messages/:target_username"
  // ], [
  //   auth.checkLoggedIn,
  //   profile_functions.getAccountChats,
  //   profile_functions.renderInbox
  // ])

  //settings
  app.get("/profile/settings", [
    auth.checkLoggedIn,
    stripe.getAccountInfo,
    stripe.getTransfers,
    profile_functions.renderSettings
  ]);

  //temporary to test /redirect page
  app.get("/redirect", function(req, res){
    res.render("redirect.ejs", {
      redirect: "/"
    });
  });

  //redirect anything not caught above to /profile
  app.get("/profile*", profile_functions.redirectProfile);

  //------------------------------------------------------------------------------------------ STRIPE MANAGED

  //post to change account settings
  app.post("/profile/settings", [
    urlencodedParser,
    auth.checkLoggedIn,
    auth.checkAccountSettings,
    auth.updateAccountSettings
  ]);

  //post to create new stripe managed account or update address of old
  app.post("/profile/settings/payout/address", [
    urlencodedParser,
    auth.checkLoggedIn,
    stripe.checkPayoutAddress,
    stripe.createManagedAccount,
    auth.updateAccountStripe
  ]);

  //post to update personal info of old stripe managed account
  app.post("/profile/settings/payout/personal", [
    urlencodedParser,
    auth.checkLoggedIn,
    stripe.checkManagedAccount,
    stripe.checkPayoutPersonal,
    stripe.updateStripePersonal,
    auth.updateAccountStripe
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

  //------------------------------------------------------------------------------------------ STRIPE STANDALONE (deprecated)

  //connect stripe
  // app.get("/connectstripe", [
  //   auth.checkLoggedIn,
  //   stripe.connectStripe
  // ]);

  //authorize stripe
  // app.get("/authorizestripe", [
  //   auth.checkLoggedIn,
  //   stripe.authorizeStripe
  // ]);

  //deauthorize stripe
  // app.post("/deauthorizestripe", [
  //   auth.checkLoggedIn,
  //   stripe.deauthorizeStripe
  // ]);
}
