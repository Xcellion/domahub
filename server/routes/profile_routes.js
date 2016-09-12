var	account_model = require('../models/account_model.js');

var request = require('request');
var qs = require('qs');

module.exports = function(app, db, auth, e){
	Auth = auth;
	error = e;

	Account = new account_model(db);

	//function to check if logged in
	isLoggedIn = Auth.isLoggedIn;

	//profile page route
	profile_tab_routes = [
		"/profile/dashboard",
		"/profile/inbox",
		"/profile/mylistings",
		"/profile/myrentals",
		"/profile/settings"
	]

	//check if user is legit, get all listings, get all rentals, then renders the appropriate page
	app.get(profile_tab_routes, [
		isLoggedIn,
		getListingsAccount,
		getRentalsAccount,
		renderProfile
	]);

	//connect stripe
	app.get("/connectstripe", [
		isLoggedIn,
		connectStripe
	]);

	//connect stripe
	app.get("/redirect", function(req, res){
		res.render("redirect.ejs", {
			redirect: "/"
		})
	});

	//authorize stripe
	app.get("/authorizestripe", [
		isLoggedIn,
		authorizeStripe
	]);

	//redirect anything not caught above to /profile
	app.get("/profile*", function(req, res){ res.redirect("/profile/dashboard") });
}

//gets all listings for a user
function getListingsAccount(req, res, next){

	//if we dont already have the list of listings or if we need to refresh them
	if (!req.user.listings || req.user.refresh_listing){
		delete req.user.refresh_listing;
		account_id = req.user.id;

		Account.getListingsAccount(account_id, function(result){
			if (result.state=="error"){error.handler(req, res, result.info);}
			else {
				req.user.listings = result.info;
				next();
			}
		});
	}
	else {
		next();
	}
}

//gets all rentals for a user
function getRentalsAccount(req, res, next){

	//if we dont already have the list of rentals or if we need to refresh them
	if (!req.user.rentals || req.user.refresh_rental){
		delete req.user.refresh_rental;
		account_id = req.user.id;

		Account.getRentalsAccount(account_id, function(result){
			if (result.state=="error"){error.handler(req, res, result.info);}
			else {
				req.user.rentals = result.info;
				next();
			}
		});
	}
	else {
		next();
	}
}

//renders profile page
function renderProfile(req, res){
	account_id = req.user.id;

	ejs_name = req.path.slice(1, req.path.length).split("/").join("_") + ".ejs";

	res.render(ejs_name, {
		message: Auth.messageReset(req),
		user: req.user,
		listings: req.user.listings || false,
		rentals: req.user.rentals || false
	});
}

//authorize stripe
function authorizeStripe(req, res){
	// Redirect to Stripe /oauth/authorize endpoint
	res.redirect("https://connect.stripe.com/oauth/authorize" + "?" + qs.stringify({
		response_type: "code",
		scope: "read_write",
		state: "domahubrules",
		client_id: "ca_997O55c2IqFxXDmgI9B0WhmpPgoh28s3",
		stripe_user: {
			email: req.user.email
		}
	}));
}

//connect to stripe
function connectStripe(req, res){
	scope = req.query.scope;
	code = req.query.code;

	console.log(scope, code, req.query.error, req.query.error_description)

	//connection errored
	if (req.query.error){
		res.send(req.query.error_description);
	}
	else if (!scope && !code) {
		error.handler(req, res, "Invalid stripe token!");
	}
	else {
		request.post({
			url: 'https://connect.stripe.com/oauth/token',
			form: {
				grant_type: "authorization_code",
				client_id: "ca_997O55c2IqFxXDmgI9B0WhmpPgoh28s3",
				code: code,
				client_secret: "sk_test_PHd0TEZT5ytlF0qCNvmgAThp"
			}
		},
			function (err, response, body) {
				body = JSON.parse(body);

				//all good with stripe!
				if (!body.error && response.statusCode == 200 && body.access_token) {
					account_info = body;
					account_info.account_id = req.user.id;
					Account.newAccountStripe(account_info, function(result){
						if (result.state=="error"){error.handler(req, res, result.info);}
						else {

							//successfully connected, now update the type
							account_info = {
								type: 3
							}
							Account.updateAccount(account_info, req.user.email, function(result){
								if (result.state=="error"){error.handler(req, res, result.info);}
								else {
									res.render("redirect.ejs", {
										message: Auth.messageReset(req),
										redirect: "/profile"
									});
								}
							});
						}
					});
				}
				else {
					error.handler(req, res, "Invalid stripe token!");
				}
			}
		);
	}
}
