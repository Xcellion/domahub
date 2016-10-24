var	account_model = require('../../models/account_model.js');
var	profile_functions = require('../profiles/profile_functions.js');

var node_env = process.env.NODE_ENV || 'dev'; 	//dev or prod bool
var stripe_key = (node_env == "dev") ? "sk_test_PHd0TEZT5ytlF0qCNvmgAThp" : "sk_live_Nqq1WW2x9JmScHxNbnFlORoh";

var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()
var urlencodedParser = bodyParser.urlencoded({ extended: false })

var request = require('request');
var validator = require('validator');
var qs = require('qs');

module.exports = function(app, db, auth, e, stripe){
	Auth = auth;
	error = e;

	Account = new account_model(db);
	checkLoggedIn = Auth.checkLoggedIn;

	//redirect profile to dashboard
	app.get("/profile", function(req, res){ res.redirect("/profile/dashboard") });

	//mylistings pages
	app.get([
		"/profile/mylistings",
		"/profile/mylistings/:page"
	], [
		profile_functions.checkPageNum,
		checkLoggedIn,
		profile_functions.getAccountListings,
		profile_functions.renderMyListings
	]);

	//myrentals pages
	app.get([
		"/profile/myrentals",
		"/profile/myrentals/:page"
	], [
		profile_functions.checkPageNum,
		checkLoggedIn,
		profile_functions.getAccountRentals,
		profile_functions.renderMyRentals
	]);

	//check if user is legit, get all listings, get all rentals
	app.get("/profile/dashboard", [
		checkLoggedIn,
		profile_functions.getAccountListings,
		profile_functions.getAccountRentals,
		profile_functions.renderDashboard
	]);

	//inbox
	app.get([
		"/profile/inbox",
		"/profile/inbox/:target_username"
	], [
		checkLoggedIn,
		profile_functions.getAccountChats,
		profile_functions.renderInbox
	])

	//settings
	app.get("/profile/settings", [
		checkLoggedIn,
		profile_functions.renderSettings
	])

	//connect stripe
	app.get("/connectstripe", [
		checkLoggedIn,
		stripe.connectStripe
	]);

	//temporary to test /redirect page
	app.get("/redirect", function(req, res){
		res.render("redirect.ejs", {
			redirect: "/"
		})
	});

	//authorize stripe
	app.get("/authorizestripe", [
		checkLoggedIn,
		stripe.authorizeStripe
	]);

	//redirect anything not caught above to /profile
	app.get("/profile*", profile_functions.redirectProfile);

	//post to change account settings
	app.post("/profile/settings", [
		urlencodedParser,
		checkLoggedIn,
		Auth.checkAccountSettings,
		Auth.updateAccountSettings
	]);
}
