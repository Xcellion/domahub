var	account_model = require('../models/account_model.js');
var	listing_model = require('../models/listing_model.js');

var qs = require('qs');
var request = require('request');

var node_env = process.env.NODE_ENV || 'dev'; 	//dev or prod bool
var stripe_key = (node_env == "dev") ? "sk_test_PHd0TEZT5ytlF0qCNvmgAThp" : "sk_live_Nqq1WW2x9JmScHxNbnFlORoh";
var stripe = require("stripe")(stripe_key);

var database, error;

module.exports = {

	//constructor
	init: function(db, e){
		database = db;
		error = e;

		Account = new account_model(db);
		Listing = new listing_model(db);
	},

	//check that the stripe customer is legit and has a good payment card
	createStripeCustomer : function(req, res, next){
		if (req.user.stripe_customer_id){

			//cross reference with stripe
			stripe.customers.retrieve(req.user.stripe_customer_id, function(err, customer) {
				if (err){
					newStripecustomer(req, res, next);
				}
				else {
					req.user.customer_subscriptions = customer.subscriptions;

					//update the customer default card
					stripe.customers.update(req.user.stripe_customer_id, {
						source: req.body.stripeToken
					}, function(err, customer) {
						if (err){stripeErrorHandler(req, res, err)}
						else {
							next();
						}
					});
				}
			});
		}

		//no customer exists, create a new stripe customer
		else {
			newStripecustomer(req, res, next);
		}
	},

	//function to create a monthly subscription for a listing
	createSingleStripeSubscription : function(req, res, next){
		var domain_name = req.params.domain_name || req.body.domain_name;
		var listing_info = getUserListingObj(req.user.listings, domain_name);

		//if subscription id exists in our database
		if (listing_info && listing_info.stripe_subscription_id){

			//check it against stripe
			stripe.subscriptions.retrieve(listing_info.stripe_subscription_id, function(err, subscription) {
				if (err){stripeErrorHandler(req, res, err)}
				else {
					//subscription was cancelled, re-subscribe
					if (subscription.cancel_at_period_end){
						stripe.subscriptions.update(listing_info.stripe_subscription_id, function(err, subscription) {
							if (err){stripeErrorHandler(req, res, err)}
							else {
								req.new_listing_info = {
									expiring: false
								}
								next();
							}
						});
					}

					//subscription is still active, all gucci
					else {
						error.handler(req, res, "This listing is already a Premium listing!", "json");
					}
				}
			});
		}
		else {
			stripe.subscriptions.create({
				customer: req.user.stripe_customer_id,
				plan: "premium",
				metadata: {
					"domain_name" : domain_name,
					"listing_id" : listing_info.id,
					//"minute_price": req.body.minute_price || 1,
					"hour_price": req.body.hour_price || 1,
					"day_price": req.body.day_price || 10,
					"week_price": req.body.week_price || 25,
					"month_price": req.body.month_price || 50
				}
			}, function(err, subscription) {
				if (err){stripeErrorHandler(req, res, err)}
				else {
					stripeSubscriptionHandler(subscription, req, res, listing_info);
				}
			});
		}
	},

	//function to create multiple monthly subscriptions
	createMultipleStripeSubscriptions : function(req, res, next){

		//create a metadata of domain names to update exp date on via webhook
		var price_types = [];
		for (var x = 0; x < req.body.domains.length; x++){
			if (req.body.domains[x].premium){
				price_types.push(req.body.domains[x].price_type);
			}
		}
		price_types = price_types.join(" ");

		//create multiple premium subscriptions
		stripe.subscriptions.create({
			customer: req.user.stripe_customer_id,
			plan: "premium",
			quantity: req.session.new_listings.premium_count,
			metadata: {
				"price_types" : price_types,
				"inserted_ids" : req.session.inserted_ids.join(" ")
			}
		}, function(err, subscription) {
			if (err){stripeErrorHandler(req, res, err)}
			else {
				res.send({
					good_listings: req.session.good_listings,
					bad_listings: req.session.bad_listings
				});
			}
		});
	},

	//check that stripe subscription exists
	cancelStripeSubscription : function(req, res, next){
		var listing_info = getUserListingObj(req.user.listings, req.params.domain_name);

		//if subscription id exists in our database
		if (listing_info && listing_info.stripe_subscription_id){
			stripe.subscriptions.del(listing_info.stripe_subscription_id, { at_period_end: true }, function(err, confirmation) {
				if (err){stripeErrorHandler(req, res, err)}
				else {
					req.new_listing_info = {
						expiring: true
					}
					next();
				}
			});
		}
		else {
			error.handler(req, res, "This isn't a Premium listing!", "json")
		}
	},

	//function to pay for a rental via stripe
	chargeMoney : function(req, res, next){
		if (req.body.stripeToken){
			var owner_stripe_id = req.session.new_rental_info.owner_stripe_id;
			var total_price = req.session.new_rental_info.price * 100;		//USD in cents

			//doma fee if the listing is basic (aka premium hasn't expired)
			var doma_fees = (req.session.new_rental_info.premium) ? 0 : Math.round(total_price * 0.15);
			var stripe_fees = Math.round(total_price * 0.029) + 30;

			var stripeOptions = {
				amount: total_price,
				currency: "usd",
				source: req.body.stripeToken,
				description: "Rental for " + req.params.domain_name,
				destination: owner_stripe_id,
				application_fee: stripe_fees + doma_fees
			}

			//something went wrong with the price
			if (isNaN(total_price) || isNaN(total_price) || isNaN(total_price)){
				error.handler(req, res, "Invalid pricing!", 'json');
			}
			else {
				//charge the end user, transfer to the owner, take doma fees if its a basic listing
				stripe.charges.create(stripeOptions, function(err, charge) {
					if (err) {
						console.log(err);
						error.handler(req, res, "Invalid price!", "json");
					}
					else {
						console.log("Payment processed! " + owner_stripe_id + " has been paid $" + ((total_price - stripe_fees - doma_fees)/100).toFixed(2) + " with $" + (doma_fees/100).toFixed(2) + " in Doma fees and $" + (stripe_fees/100).toFixed(2) + " in Stripe fees.")
						next();
					}
				});
			}

		}

		//if stripetoken doesnt exist
		else {
			stripeErrorHandler(req, res, {message: "Invalid Stripe token! Please log out and try again."});
		}
	},

	//authorize stripe
	authorizeStripe : function(req, res){
		// Redirect to Stripe /oauth/authorize endpoint
		res.redirect("https://connect.stripe.com/oauth/authorize" + "?" + qs.stringify({
			response_type: "code",
			scope: "read_write",
			state: "domahubrules",
			client_id: "ca_997O55c2IqFxXDmgI9B0WhmpPgoh28s3",
			stripe_user: {
				email: req.user.email,
				physical_product: false,
				product_description: "DomaHub domain rentals."
			}
		}));
	},

	//deauthorize stripe
	deauthorizeStripe : function(req, res){
		if (req.user.stripe_user_id){
			request.post({
				url: 'https://connect.stripe.com/oauth/deauthorize',
				form: {
					client_id: "ca_997O55c2IqFxXDmgI9B0WhmpPgoh28s3",
					stripe_user_id: req.user.stripe_user_id,
					client_secret: stripe_key
				}
			},
				function (err, response, body) {
					body = JSON.parse(body);

					//all good with stripe!
					if (!body.error && response.statusCode == 200 && body.stripe_user_id == req.user.stripe_user_id) {
						var account_info = {
							stripe_user_id: null,
							type: 1
						}
						Account.updateAccount(account_info, req.user.email, function(result){
							if (result.state=="error"){error.handler(req, res, result.info);}
							else {
								req.user.stripe_user_id = null;
								req.user.type = 1;
								res.send({
									state: "success"
								})
							}
						});
					}
					else {
						error.handler(req, res, "Invalid stripe token!", "json");
					}
				}
			);
		}

		//isnt authorized
		else {
			error.handler(req, res, "Invalid stripe token!", "json");
		}
	},

	//connect to stripe and get the stripe account info to store on our db
	connectStripe : function(req, res){
		scope = req.query.scope;
		code = req.query.code;

		//connection errored
		if (req.query.error || !scope || !code || req.query.state != "domahubrules") {
			error.handler(req, res, "Invalid stripe token!");
		}
		else {
			request.post({
				url: 'https://connect.stripe.com/oauth/token',
				form: {
					grant_type: "authorization_code",
					client_id: "ca_997O55c2IqFxXDmgI9B0WhmpPgoh28s3",
					code: code,
					client_secret: stripe_key
				}
			},
				function (err, response, body) {
					body = JSON.parse(body);

					//all good with stripe!
					if (!body.error && response.statusCode == 200 && body.access_token) {
						var account_info = {
							stripe_user_id: body.stripe_user_id,
							type: 2
						}
						Account.updateAccount(account_info, req.user.email, function(result){
							if (result.state=="error"){error.handler(req, res, result.info);}
							else {
								req.user.stripe_user_id = body.stripe_user_id;
								req.user.type = 2;
								res.render("redirect.ejs", {
									redirect: "/profile"
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

}

//helper function to create a new stripe customer
function newStripecustomer(req, res, next){
	stripe.customers.create({
		source: req.body.stripeToken,
		email: req.user.email,
		metadata: {
			"account_id" : req.user.id,
			"stripe_user_id" : req.user.stripe_user_id
		}
	}, function(err, customer) {
		if (err){stripeErrorHandler(req, res, err)}
		else {

			//update the customer id in the DB
			var new_stripe_cus = {
				stripe_customer_id: customer.id
			}
			Account.updateAccount(new_stripe_cus, req.user.email, function(result){
				if (result.state=="error"){error.handler(req, res, result.info, "json")}
				else {
					req.user.stripe_customer_id = customer.id;
					req.user.customer_subscriptions = customer.subscriptions;

					next();
				}
			});
		}
	});
}

//helper function for handling stripe errors
function stripeErrorHandler(req, res, err){
	console.log(err);
	switch (err.message){
		case ("Your card was declined!"):
		case ("Your card's expiration year is invalid."):
			error.handler(req, res, err.message, "json");
			break;
		default:
			error.handler(req, res, "Something went wrong with the payment!", "json");
			break;
	}
}

//helper function to handle successful stripe subscriptions
function stripeSubscriptionHandler(subscription, req, res, listing_info){
	listing_info.stripe_subscription_id = subscription.id;
	listing_info.exp_date = subscription.current_period_end * 1000		//stripe doesnt count the time, only days
	res.json({
		state: "success",
		listings: req.user.listings,
		new_exp_date: listing_info.exp_date
	});
}

//helper function to get the req.user listings object for a specific domain
function getUserListingObj(listings, domain_name){
	for (var x = 0; x < listings.length; x++){
		if (listings[x].domain_name.toLowerCase() == domain_name.toLowerCase()){
			return listings[x];
		}
	}
}
