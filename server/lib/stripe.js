var	account_model = require('../models/account_model.js');
var	listing_model = require('../models/listing_model.js');

var Q = require('q');
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
			console.log("SF: Trying to update an existing Stripe customer...");

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
						if (err){
							revertPremiumListings(req, res, err);
						}
						else {
							next();
						}
					});
				}
			});
		}

		//no customer exists, create a new stripe customer
		else {
			console.log("SF: Trying to create a new Stripe customer...");
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
									stripe_subscription_id : subscription.id,
									exp_date : subscription.current_period_end * 1000,
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
					"insert_id" : listing_info.id
				}
			}, function(err, subscription) {
				if (err){stripeErrorHandler(req, res, err)}
				else {
					req.new_listing_info = {
						stripe_subscription_id : subscription.id,
						exp_date : subscription.current_period_end * 1000,
						expiring: false
					}
					next();
				}
			});
		}
	},

	//function to create multiple monthly subscriptions
	createStripeSubscriptions : function(req, res, next){
		console.log("SF: Trying to create or update a Stripe subscription...");

		newStripeSubscription(req, res, next);
	},

	//check that stripe subscription exists
	cancelStripeSubscription : function(req, res, next){
		var listing_info = getUserListingObj(req.user.listings, req.params.domain_name);

		//if subscription id exists in our database
		if (listing_info && listing_info.stripe_subscription_id){
			stripe.subscriptions.del(listing_info.stripe_subscription_id, { at_period_end: true }, function(err, confirmation) {
				if (err){stripeErrorHandler(req, res, err)}
				else {

					//set expiring flag
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
			var total_price = Math.round(req.session.new_rental_info.price * 100);		//USD in cents

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
		var client_id = (node_env == "dev") ? "ca_997O55c2IqFxXDmgI9B0WhmpPgoh28s3" : "ca_997OlLjHwTzo6hMT8VGbot4OF6l3v1V0";

		// Redirect to Stripe /oauth/authorize endpoint
		res.redirect("https://connect.stripe.com/oauth/authorize" + "?" + qs.stringify({
			response_type: "code",
			scope: "read_write",
			state: "domahubrules",
			client_id: client_id,
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
			var client_id = (node_env == "dev") ? "ca_997O55c2IqFxXDmgI9B0WhmpPgoh28s3" : "ca_997OlLjHwTzo6hMT8VGbot4OF6l3v1V0";

			request.post({
				url: 'https://connect.stripe.com/oauth/token',
				form: {
					grant_type: "authorization_code",
					client_id: client_id,
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
		if (err){
			revertPremiumListings(req, res, err);
		}
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

//helper function to create a new stripe subscription
function newStripeSubscription(req, res, next){

	//create the array of promises
	var promises = [];
	for (var x = 0; x < req.session.new_listings.premium_obj.inserted_ids.length; x++){
		var promise = stripe.subscriptions.create({
			customer: req.user.stripe_customer_id,
			plan: "premium",
			metadata: {
				insert_id : req.session.new_listings.premium_obj.inserted_ids[x],
				index : req.session.new_listings.premium_obj.indexes[x]
			}
		});
		promises.push(promise);
	}

	//wait for all promises to finish
	Q.allSettled(promises)
	 .then(function(results) {
		var premium_db_query_success = [];
		var premium_db_query_failed = [];

		//figure out which promises failed / passed
		for (var y = 0; y < results.length; y++){
			if (results[y].state == "fulfilled"){
				var subscription = results[y].value;
				//create the formatted db query to update premium ID
				premium_db_query_success.push([
					subscription.metadata.insert_id,
					subscription.id,
					subscription.current_period_end * 1000
				]);

				//add to good listings
				req.session.new_listings.good_listings.push({
					index: subscription.metadata.index
				});
			}
			else {
				//revert pricing for failed premium listings
				premium_db_query_failed.push([
					req.session.new_listings.premium_obj.inserted_ids[y],			//insert id
					"month",														//price type
					25,																//price rate
					"",																//subscription id
					0,																//exp date
					false															//expiring
				]);

				//add to bad listings
				req.session.new_listings.bad_listings.push({
					index: req.session.new_listings.premium_obj.indexes[y],
					reasons: [
						"Premium upgrade failed! Your card was not charged for this domain."
					]
				});
			}
		}

		req.session.new_listings.premium_obj.db_success_obj = premium_db_query_success;
		req.session.new_listings.premium_obj.db_failed_obj = premium_db_query_failed;
		next();

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

//helper function to handle unsuccessful stripe card, revert premium
function revertPremiumListings(req, res, err){
	if (req.path == "/listings/create"){
		var premium_db_query_failed = [];

		for (var x = 0; x < req.session.new_listings.premium_obj.inserted_ids.length; x++){
			premium_db_query_failed.push([
				req.session.new_listings.premium_obj.inserted_ids[x],			//insert id
				"month",														//price type
				25,																//price rate
				"",																//subscription id
				0,																//exp date
				false															//expiring
			]);

			//add to bad listings
			req.session.new_listings.bad_listings.push({
				index: req.session.new_listings.premium_obj.indexes[x],
				reasons: [
					"Premium purchase error! This domain was created as a basic domain instead."
				]
			});
		}

		//revert pricing for failed premium listings
		if (premium_db_query_failed.length > 0){
			Listing.updateListingsBasic(premium_db_query_failed, function(result){
			});
			res.send({
				bad_listings: req.session.new_listings.bad_listings,
				good_listings: req.session.new_listings.good_listings
			});
			delete req.session.new_listings;
		}
	}
	else {
		stripeErrorHandler(req, res, err);
	}
}

//helper function to get the req.user listings object for a specific domain
function getUserListingObj(listings, domain_name){
	for (var x = 0; x < listings.length; x++){
		if (listings[x].domain_name.toLowerCase() == domain_name.toLowerCase()){
			return listings[x];
		}
	}
}
