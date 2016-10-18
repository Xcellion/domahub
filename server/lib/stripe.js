var	account_model = require('../models/account_model.js');
var	listing_model = require('../models/listing_model.js');

var node_env = process.env.NODE_ENV || 'dev'; 	//dev or prod bool
if (node_env == "dev"){
	var stripe = require("stripe")("sk_test_PHd0TEZT5ytlF0qCNvmgAThp");		//stripe API development key
}
else {
	var stripe = require("stripe")("sk_live_Nqq1WW2x9JmScHxNbnFlORoh");		//stripe API production key
}

var database, error;

module.exports = {

	//constructor
	init: function(db, e){
		database = db;
		error = e;

		Account = new account_model(db);
		Listing = new listing_model(db);
	},

	//check if stripe info is attached to the user obj, get it if it isnt
	getStripeInfo : function(req, res, next){
		if (!req.user.stripe_info){
			Account.getStripeInfo(req.user.id, function(result){
				if (result.state == "error" || result.info.length == 0){
					res.render("stripeconnect.ejs");
				}
				else {
					req.user.stripe_info = result.info[0];
					next();
				}
			});
		}
		else {
			next();
		}
	},

	//check that the stripe customer is legit and has a good payment card
	createStripeCustomer : function(req, res, next){
		if (req.user.stripe_info.stripe_customer_id){

			//cross reference with stripe
			stripe.customers.retrieve(req.user.stripe_info.stripe_customer_id, function(err, customer) {
				if (err){stripeErrorHandler(req, res, err)}
				else {
					req.user.stripe_info.customer_subscriptions = customer.subscriptions;

					//update the customer default card
					stripe.customers.update(req.user.stripe_info.stripe_customer_id, {
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
			if (req.body.stripeEmail == req.user.email){
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
						Account.updateAccountStripeCustomerID(req.user.id, new_stripe_cus, function(result){
							if (result.state=="error"){error.handler(req, res, result.info, "json")}
							else {
								req.user.stripe_info.stripe_customer_id = customer.id;
								req.user.stripe_info.customer_subscriptions = customer.subscriptions;

								next();
							}
						});
					}
				});
			}
			else {
				error.handler(req, res, "Please use the same email for payments as your Domahub account!", "json");
			}
		}
	},

	//function to create a monthly subscription for a listing
	createStripeSubscription : function(req, res, next){
		var listing_info = getUserListingObj(req.user.listings, req.params.domain_name);

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
				customer: req.user.stripe_info.stripe_customer_id,
				plan: "premium",
				metadata: {
					"domain_name" : req.params.domain_name,
					"listing_id" : listing_info.id
				}
			}, function(err, subscription) {
				if (err){stripeErrorHandler(req, res, err)}
				else {
					stripeSubscriptionHandler(subscription, req, res, listing_info);
				}
			});
		}
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
			//application fee if the listing is basic (aka premium hasn't expired)
			var application_fee = (req.session.new_rental_info.listing_exp_date < (new Date).getTime()) ? total_price / 10 : 0;
			var customer_pays = total_price - application_fee;

			var stripeOptions = {
				amount: customer_pays, // amount in cents
				currency: "usd",
				source: req.body.stripeToken,
				description: "Rental for " + req.params.domain_name
			}

			//application fee if the listing is basic
			if (application_fee > 0){
				stripeOptions.application_fee = application_fee;
			}

			//charge the end user, transfer to the owner, take 10% if its a basic listing
			stripe.charges.create(stripeOptions, {
				stripe_account: owner_stripe_id
			}, function(err, charge) {
				if (err) {
					console.log(err);
					error.handler(req, res, "Invalid price!");
				}
				else {
					console.log("Payment processed! " + owner_stripe_id + " has been paid " + customer_pays + " with " + application_fee + " in Doma fees.")
					next();
				}
			});
		}

		//if stripetoken doesnt exist
		else {
			stripeErrorHandler(req, res, {message: "Invalid Stripe token! Please log out and try again."});
		}
	}

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
