var	account_model = require('../models/account_model.js');
var	listing_model = require('../models/listing_model.js');

var Q = require('q');
var qs = require('qs');
var request = require('request');

var node_env = process.env.NODE_ENV || 'dev'; 	//dev or prod bool
var stripe_key = (node_env == "dev") ? "sk_test_PHd0TEZT5ytlF0qCNvmgAThp" : "sk_live_Nqq1WW2x9JmScHxNbnFlORoh";
var stripe = require("stripe")(stripe_key);
var validator = require("validator");

var database, error;

module.exports = {

	//constructor
	init: function(db, e){
		database = db;
		error = e;

		Account = new account_model(db);
		Listing = new listing_model(db);
	},

	//------------------------------------------------------------------------------------------ STRIPE MANAGED

	//gets the stripe managed account info
	getAccountInfo : function(req, res, next){
		if (req.user.stripe_account){
			console.log('F: Retrieving existing Stripe managed account information...');
			stripe.accounts.retrieve(req.user.stripe_account, function(err, account) {
				if (!err){
					updateUserStripeInfo(req.user, account);
					if (node_env == "dev"){
						req.user.dev_stripe_info = account;
					}
					next();
				}
				else {
					console.log(err.message);
					next();
				}
			});
		}
		else {
			next();
		}
	},

	//function to get all charges made to account
	getTransactions : function(req, res, next){
		if (req.user.stripe_account){
			console.log('F: Retrieving all Stripe transactions...');
			stripe.charges.list({
				destination: req.user.stripe_account
			}, function(err, charges) {
				if (err) { console.log(err.message); }
				if (node_env == "dev"){
					req.user.dev_charges = charges;
				}
				updateUserStripeCharges(req.user, charges.data);
				next();
			});
		}
		else {
			next();
		}
	},

	checkManagedAccount : function(req, res, next){
		if (!req.user.stripe_account){
			error.handler(req, res, "Please first enter your payout address!", "json");
		}
		else {
			next();
		}
	},

	//function to check posted info for address
	checkPayoutAddress : function(req, res, next){
		console.log('F: Checking posted Stripe managed account address information...');
		var country_codes = [
			"AU",		//Australia
			"US",		//United States
			"CA",		//Canada
			"AT",		//Austria
			"DK",		//Denmark
			"BE",		//Belgium
			"FI",		//Finland
			"DE",		//Germany
			"FR",		//France
			"HK",		//Hong Kong
			"IE",		//Ireland
			"IT",		//Italy
			"JP",		//Japan
			"LU",		//Luxembourg
			"NO",		//Norway
			"NL",		//Netherlands
			"SG",		//Singapore
			"NZ",		//New Zealand
			"ES",		//Spain
			"PT",		//Portugal
			"SE",		//Sweden
			"CH",		//Switzerland
			"GB",		//United Kingdom
			"BR",		//Brazil
			"MX"		//Mexico
		];

		if (country_codes.indexOf(req.body.country) == -1){
			error.handler(req, res, "Invalid country!", "json");
		}
		else if (!req.body.addressline1){
			error.handler(req, res, "Invalid address!", "json");
		}
		else if (!req.body.city){
			error.handler(req, res, "Invalid city!", "json");
		}
		else if (!req.body.state && req.body.country == "US"){
			error.handler(req, res, "Invalid state!", "json");
		}
		else if (!req.body.zip){
			error.handler(req, res, "Invalid postal code!", "json");
		}
		else {
			next();
		}
	},

	//function to check posted info for personal
	checkPayoutPersonal : function(req, res, next){
		console.log('F: Checking posted Stripe managed account personal information...');

		if (!req.body.first_name){
			error.handler(req, res, "Invalid first name!", "json");
		}
		else if (!req.body.last_name){
			error.handler(req, res, "Invalid last name!", "json");
		}
		else if (!req.body.birthday_year || !validator.isInt(req.body.birthday_year, { min: 1900 })){
			error.handler(req, res, "Invalid birthday year!", "json");
		}
		else if (!req.body.birthday_month || !validator.isInt(req.body.birthday_month, { min: 1, max: 12 })){
			error.handler(req, res, "Invalid birthday month!", "json");
		}
		else if (!req.body.birthday_day || !validator.isInt(req.body.birthday_day, { min: 1, max: 31 })){
			error.handler(req, res, "Invalid birthday date!", "json");
		}
		else {
			next();
		}
	},

	//function to check posted info for bank info
	checkPayoutBank : function(req, res, next){
		console.log('F: Checking posted Stripe managed account bank information...');

		if (!req.body.stripe_token){
			error.handler(req, res, "Invalid bank information!", "json");
		}
		else {
			next();
		}
	},

	//function to create a new managed account with stripe
	createManagedAccount : function(req, res, next){
		if (req.user.stripe_account){
			console.log('F: Updating existing Stripe managed account address...');
			stripe.accounts.update(req.user.stripe_account, {
				"legal_entity": {
					"address": {
						"city": req.body.city,
						"country": req.body.country,
						"line1": req.body.addressline1,
						"line2": req.body.addressline2,
						"postal_code": req.body.zip,
						"state": req.body.state
					}
				},
				"transfer_schedule": {
					"interval": "manual"
				}
			}, function(err, result){
				if (result){
					updateUserStripeInfo(req.user, result);
					res.json({
	                    state: "success",
	                    user: req.user
	                });
				}
				else {
					console.log(err.message);
					error.handler(req, res, "Failed to update your account!", "json");
				}
			});
		}
		else {
			console.log('F: Creating a new Stripe managed account...');
			stripe.accounts.create({
				country: req.body.country,
				email: req.user.email,
				legal_entity: {
					"address": {
						"city": req.body.city,
						"country": req.body.country,
						"line1": req.body.addressline1,
						"line2": req.body.addressline2,
						"postal_code": req.body.zip,
						"state": req.body.state
					},
				},
				"transfer_schedule": {
					"interval": "manual"
				},
				managed: true
			}, function(err, result){
				if (result){
					req.session.stripe_results = result;
					updateUserStripeInfo(req.user, result);
					next();
				}
				else {
					console.log(err.message);
					error.handler(req, res, err.message, "json");
				}
			});
		}
	},

	//function to update managed account personal info
	updateStripePersonal : function(req, res, next){
		console.log('F: Updating existing Stripe managed account personal information...');
		stripe.accounts.update(req.user.stripe_account, {
			legal_entity: {
				"first_name": req.body.first_name,
				"last_name": req.body.last_name,
				"dob" : {
					"day" : req.body.birthday_day,
					"month" : req.body.birthday_month,
					"year" : req.body.birthday_year
				}
			}
		}, function(err, result){
			if (result){
				updateUserStripeInfo(req.user, result);
				res.json({
                    state: "success",
                    user: req.user
                });
			}
			else {
				console.log(err.message);
				error.handler(req, res, "Failed to update your account!", "json");
			}
		});
	},

	//function to update managed account bank info
	updateStripeBank : function(req, res, next){
		console.log('F: Updating existing Stripe managed account bank information...');

		stripe.accounts.update(req.user.stripe_account, {
			external_account: req.body.stripe_token,
			legal_entity: {
				"type" : req.body.account_type
			},
			"tos_acceptance" : {
				date: Math.floor(Date.now() / 1000),
				ip: req.connection.remoteAddress
			}
		}, function(err, result){
			if (result){
				res.json({
                    state: "success",
                    user: req.user
                });
			}
			else {
				console.log(err.message);
				error.handler(req, res, "Failed to update your account!", "json");
			}
		});
	},

	//------------------------------------------------------------------------------------------ STRIPE PAYMENTS

	//function to pay for a rental via stripe
	chargeMoney : function(req, res, next){
		if (req.session.new_rental_info.price != 0){
			if (req.body.stripeToken){
				var owner_stripe_id = req.session.new_rental_info.owner_stripe_id;
				var total_price = Math.round(req.session.new_rental_info.price * 100);		//USD in cents

				//doma fee if the listing is basic (aka premium hasn't expired)
				var doma_fees = Math.round(total_price * 0.18);
				var stripe_fees = Math.round(total_price * 0.029) + 30;

				var stripeOptions = {
					amount: total_price,
					currency: "usd",
					source: req.body.stripeToken,
					description: "Rental for " + req.params.domain_name,
					destination: owner_stripe_id,
					application_fee: stripe_fees + doma_fees,
					metadata: {
						"domain_name" : req.params.domain_name,
						"renter_name" : (req.user) ? req.user.username : "Guest",
						"rental_id" : req.session.new_rental_info.rental_id
					}
				}

				//something went wrong with the price
				if (isNaN(total_price) || isNaN(total_price) || isNaN(total_price)){
					error.handler(req, res, "Invalid price!", 'json');
				}
				else {
					//charge the end user, transfer to the owner, take doma fees if its a basic listing
					stripe.charges.create(stripeOptions, function(err, charge) {
						if (err) {
							console.log(err.message);
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
		}
		else {
			next();
		}
	},

	//function to refund a rental
	refundRental : function(req, res, next){
		console.log("F: Refunding with Stripe...");
		if (req.body.stripe_id){
			stripe.refunds.create({
				charge: req.body.stripe_id
			}, function(err, refund) {
				if (!err){
					next();
				}
				else {
					res.send({
						state: "error",
						message: err.message
					});
				}
			});
		}
		else {
			res.send({
				state: "error",
				message: "Invalid charge!"
			});
		}
	},

	//------------------------------------------------------------------------------------------ STRIPE STANDALONE

	// //authorize stripe
	// authorizeStripe : function(req, res){
	// 	var client_id = (node_env == "dev") ? "ca_997O55c2IqFxXDmgI9B0WhmpPgoh28s3" : "ca_997OlLjHwTzo6hMT8VGbot4OF6l3v1V0";
	//
	// 	// Redirect to Stripe /oauth/authorize endpoint
	// 	res.redirect("https://connect.stripe.com/oauth/authorize" + "?" + qs.stringify({
	// 		response_type: "code",
	// 		scope: "read_write",
	// 		state: "domahubrules",
	// 		client_id: client_id,
	// 		stripe_user: {
	// 			email: req.user.email,
	// 			physical_product: false,
	// 			product_description: "DomaHub domain rentals."
	// 		}
	// 	}));
	// },
	//
	// //deauthorize stripe
	// deauthorizeStripe : function(req, res){
	// 	if (req.user.stripe_account){
	// 		request.post({
	// 			url: 'https://connect.stripe.com/oauth/deauthorize',
	// 			form: {
	// 				client_id: "ca_997O55c2IqFxXDmgI9B0WhmpPgoh28s3",
	// 				stripe_account: req.user.stripe_account,
	// 				client_secret: stripe_key
	// 			}
	// 		},
	// 			function (err, response, body) {
	// 				body = JSON.parse(body);
	//
	// 				//all good with stripe!
	// 				if (!body.error && response.statusCode == 200 && body.stripe_account == req.user.stripe_account) {
	// 					var account_info = {
	// 						stripe_account: null,
	// 						type: 1
	// 					}
	// 					Account.updateAccount(account_info, req.user.email, function(result){
	// 						if (result.state=="error"){error.handler(req, res, result.info);}
	// 						else {
	// 							req.user.stripe_account = null;
	// 							req.user.type = 1;
	// 							res.send({
	// 								state: "success"
	// 							})
	// 						}
	// 					});
	// 				}
	// 				else {
	// 					error.handler(req, res, "Invalid stripe token!", "json");
	// 				}
	// 			}
	// 		);
	// 	}
	//
	// 	//isnt authorized
	// 	else {
	// 		error.handler(req, res, "Invalid stripe token!", "json");
	// 	}
	// },
	//
	// //connect to stripe and get the stripe account info to store on our db
	// connectStripe : function(req, res){
	// 	scope = req.query.scope;
	// 	code = req.query.code;
	//
	// 	//connection errored
	// 	if (req.query.error || !scope || !code || req.query.state != "domahubrules") {
	// 		error.handler(req, res, "Invalid stripe token!");
	// 	}
	// 	else {
	// 		var client_id = (node_env == "dev") ? "ca_997O55c2IqFxXDmgI9B0WhmpPgoh28s3" : "ca_997OlLjHwTzo6hMT8VGbot4OF6l3v1V0";
	//
	// 		request.post({
	// 			url: 'https://connect.stripe.com/oauth/token',
	// 			form: {
	// 				grant_type: "authorization_code",
	// 				client_id: client_id,
	// 				code: code,
	// 				client_secret: stripe_key
	// 			}
	// 		},
	// 			function (err, response, body) {
	// 				body = JSON.parse(body);
	//
	// 				//all good with stripe!
	// 				if (!body.error && response.statusCode == 200 && body.access_token) {
	// 					var account_info = {
	// 						stripe_account: body.stripe_account,
	// 						type: 2
	// 					}
	// 					Account.updateAccount(account_info, req.user.email, function(result){
	// 						if (result.state=="error"){error.handler(req, res, result.info);}
	// 						else {
	// 							req.user.stripe_account = body.stripe_account;
	// 							req.user.type = 2;
	// 							res.render("redirect.ejs", {
	// 								redirect: "/profile"
	// 							});
	// 						}
	// 					});
	// 				}
	// 				else {
	// 					error.handler(req, res, "Invalid stripe token!");
	// 				}
	// 			}
	// 		);
	// 	}
	// },

	//------------------------------------------------------------------------------------------ STRIPE SUBSCRIPTIONS (deprecated)

	// //check that the stripe customer is legit and has a good payment card
	// createStripeCustomer : function(req, res, next){
	// 	if (req.user.stripe_customer_id){
	// 		console.log("SF: Trying to update an existing Stripe customer...");
	//
	// 		//cross reference with stripe
	// 		stripe.customers.retrieve(req.user.stripe_customer_id, function(err, customer) {
	// 			if (err){
	// 				newStripecustomer(req, res, next);
	// 			}
	// 			else {
	// 				req.user.customer_subscriptions = customer.subscriptions;
	//
	// 				//update the customer default card
	// 				stripe.customers.update(req.user.stripe_customer_id, {
	// 					source: req.body.stripeToken
	// 				}, function(err, customer) {
	// 					if (err){
	// 						revertPremiumListings(req, res, err);
	// 					}
	// 					else {
	// 						next();
	// 					}
	// 				});
	// 			}
	// 		});
	// 	}
	//
	// 	//no customer exists, create a new stripe customer
	// 	else {
	// 		console.log("SF: Trying to create a new Stripe customer...");
	// 		newStripecustomer(req, res, next);
	// 	}
	// },
	//
	// //function to create a monthly subscription for a listing
	// createSingleStripeSubscription : function(req, res, next){
	// 	var domain_name = req.params.domain_name || req.body.domain_name;
	// 	var listing_info = getUserListingObj(req.user.listings, domain_name);
	//
	// 	//if subscription id exists in our database
	// 	if (listing_info && listing_info.stripe_subscription_id){
	//
	// 		//check it against stripe
	// 		stripe.subscriptions.retrieve(listing_info.stripe_subscription_id, function(err, subscription) {
	// 			if (err){stripeErrorHandler(req, res, err)}
	// 			else {
	// 				//subscription was cancelled, re-subscribe
	// 				if (subscription.cancel_at_period_end){
	// 					stripe.subscriptions.update(listing_info.stripe_subscription_id, function(err, subscription) {
	// 						if (err){stripeErrorHandler(req, res, err)}
	// 						else {
	// 							req.new_listing_info = {
	// 								stripe_subscription_id : subscription.id,
	// 								exp_date : subscription.current_period_end * 1000,
	// 								expiring: false
	// 							}
	// 							next();
	// 						}
	// 					});
	// 				}
	//
	// 				//subscription is still active, all gucci
	// 				else {
	// 					error.handler(req, res, "This listing is already a Premium listing!", "json");
	// 				}
	// 			}
	// 		});
	// 	}
	// 	else {
	// 		stripe.subscriptions.create({
	// 			customer: req.user.stripe_customer_id,
	// 			plan: "premium",
	// 			metadata: {
	// 				"insert_id" : listing_info.id
	// 			}
	// 		}, function(err, subscription) {
	// 			if (err){stripeErrorHandler(req, res, err)}
	// 			else {
	// 				req.new_listing_info = {
	// 					stripe_subscription_id : subscription.id,
	// 					exp_date : subscription.current_period_end * 1000,
	// 					expiring: false
	// 				}
	// 				next();
	// 			}
	// 		});
	// 	}
	// },
	//
	// //function to create multiple monthly subscriptions
	// createStripeSubscriptions : function(req, res, next){
	// 	console.log("SF: Trying to create or update a Stripe subscription...");
	//
	// 	newStripeSubscription(req, res, next);
	// },
	//
	// //check that stripe subscription exists
	// cancelStripeSubscription : function(req, res, next){
	// 	var listing_info = getUserListingObj(req.user.listings, req.params.domain_name);
	//
	// 	//if subscription id exists in our database
	// 	if (listing_info && listing_info.stripe_subscription_id){
	// 		stripe.subscriptions.del(listing_info.stripe_subscription_id, { at_period_end: true }, function(err, confirmation) {
	// 			if (err){stripeErrorHandler(req, res, err)}
	// 			else {
	//
	// 				//set expiring flag
	// 				req.new_listing_info = {
	// 					expiring: true
	// 				}
	// 				next();
	// 			}
	// 		});
	// 	}
	// 	else {
	// 		error.handler(req, res, "This isn't a Premium listing!", "json")
	// 	}
	// }

}

//function to update req.user with stripe info
function updateUserStripeInfo(user, stripe_results){
	user.stripe_info = {
		country : stripe_results.legal_entity.address.country || "",
		addressline1 : stripe_results.legal_entity.address.line1 || "",
		addressline2 : stripe_results.legal_entity.address.line2 || "",
		city : stripe_results.legal_entity.address.city || "",
		state : stripe_results.legal_entity.address.state || "",
		zip : stripe_results.legal_entity.address.postal_code || "",
		birthday_year : stripe_results.legal_entity.dob.year || "",
		birthday_month : stripe_results.legal_entity.dob.month || "",
		birthday_day : stripe_results.legal_entity.dob.day || "",
		first_name : stripe_results.legal_entity.first_name || "",
		last_name : stripe_results.legal_entity.last_name || "",
		account_type : stripe_results.legal_entity.type || "",
		transfers_enabled : stripe_results.transfers_enabled,
		charges_enabled : stripe_results.charges_enabled
	}
	if (stripe_results.external_accounts.total_count > 0){
		user.stripe_info.object = stripe_results.external_accounts.data[0].object || "";
		user.stripe_info.currency = stripe_results.external_accounts.data[0].currency.toUpperCase() || "";
		user.stripe_info.bank_name = stripe_results.external_accounts.data[0].bank_name || "";
		user.stripe_info.account_holder_name = stripe_results.external_accounts.data[0].account_holder_name || "";
		user.stripe_info.account_number = stripe_results.external_accounts.data[0].last4 || "";
		user.stripe_info.account_routing = stripe_results.external_accounts.data[0].routing_number || "";
	}
}

//function to update req.user with stripe charges
function updateUserStripeCharges(user, stripe_charges){
	var temp_charges = [];
	for (var x = 0; x < stripe_charges.length; x++){
		var temp_charge = {
			amount: stripe_charges[x].amount,
			amount_refunded: stripe_charges[x].amount_refunded,
			created: stripe_charges[x].created,
			currency: stripe_charges[x].currency,
			description: stripe_charges[x].description,
			id: stripe_charges[x].id
		}
		if (stripe_charges[x].metadata){
			temp_charge.rental_id = stripe_charges[x].metadata.rental_id;
			temp_charge.renter_name = stripe_charges[x].metadata.renter_name;
			temp_charge.domain_name = stripe_charges[x].metadata.domain_name;
		}
		temp_charges.push(temp_charge);
	}
	user.stripe_charges = temp_charges;
}

// //helper function to create a new stripe customer
// function newStripecustomer(req, res, next){
// 	stripe.customers.create({
// 		source: req.body.stripeToken,
// 		email: req.user.email,
// 		metadata: {
// 			"account_id" : req.user.id,
// 			"stripe_account" : req.user.stripe_account
// 		}
// 	}, function(err, customer) {
// 		if (err){
// 			revertPremiumListings(req, res, err);
// 		}
// 		else {
//
// 			//update the customer id in the DB
// 			var new_stripe_cus = {
// 				stripe_customer_id: customer.id
// 			}
// 			Account.updateAccount(new_stripe_cus, req.user.email, function(result){
// 				if (result.state=="error"){error.handler(req, res, result.info, "json")}
// 				else {
// 					req.user.stripe_customer_id = customer.id;
// 					req.user.customer_subscriptions = customer.subscriptions;
//
// 					next();
// 				}
// 			});
// 		}
// 	});
// }
//
// //helper function to create a new stripe subscription
// function newStripeSubscription(req, res, next){
//
// 	//create the array of promises
// 	var promises = [];
// 	for (var x = 0; x < req.session.new_listings.premium_obj.inserted_ids.length; x++){
// 		var promise = stripe.subscriptions.create({
// 			customer: req.user.stripe_customer_id,
// 			plan: "premium",
// 			metadata: {
// 				insert_id : req.session.new_listings.premium_obj.inserted_ids[x],
// 				index : req.session.new_listings.premium_obj.indexes[x]
// 			}
// 		});
// 		promises.push(promise);
// 	}
//
// 	//wait for all promises to finish
// 	Q.allSettled(promises)
// 	 .then(function(results) {
// 		var premium_db_query_success = [];
// 		var premium_db_query_failed = [];
//
// 		//figure out which promises failed / passed
// 		for (var y = 0; y < results.length; y++){
// 			if (results[y].state == "fulfilled"){
// 				var subscription = results[y].value;
// 				//create the formatted db query to update premium ID
// 				premium_db_query_success.push([
// 					subscription.metadata.insert_id,
// 					subscription.id,
// 					subscription.current_period_end * 1000
// 				]);
//
// 				//add to good listings
// 				req.session.new_listings.good_listings.push({
// 					index: subscription.metadata.index
// 				});
// 			}
// 			else {
// 				//revert pricing for failed premium listings
// 				premium_db_query_failed.push([
// 					req.session.new_listings.premium_obj.inserted_ids[y],			//insert id
// 					"month",														//price type
// 					25,																//price rate
// 					"",																//subscription id
// 					0,																//exp date
// 					false															//expiring
// 				]);
//
// 				//add to bad listings
// 				req.session.new_listings.bad_listings.push({
// 					index: req.session.new_listings.premium_obj.indexes[y],
// 					reasons: [
// 						"Premium upgrade failed! Your card was not charged for this domain."
// 					]
// 				});
// 			}
// 		}
//
// 		req.session.new_listings.premium_obj.db_success_obj = premium_db_query_success;
// 		req.session.new_listings.premium_obj.db_failed_obj = premium_db_query_failed;
// 		next();
//
// 	});
//
// }
//
// //helper function to handle unsuccessful stripe card, revert premium
// function revertPremiumListings(req, res, err){
// 	if (req.path == "/listings/create"){
// 		var premium_db_query_failed = [];
//
// 		for (var x = 0; x < req.session.new_listings.premium_obj.inserted_ids.length; x++){
// 			premium_db_query_failed.push([
// 				req.session.new_listings.premium_obj.inserted_ids[x],			//insert id
// 				"month",														//price type
// 				25,																//price rate
// 				"",																//subscription id
// 				0,																//exp date
// 				false															//expiring
// 			]);
//
// 			//add to bad listings
// 			req.session.new_listings.bad_listings.push({
// 				index: req.session.new_listings.premium_obj.indexes[x],
// 				reasons: [
// 					"Premium purchase error! This domain was created as a basic domain instead."
// 				]
// 			});
// 		}
//
// 		//revert pricing for failed premium listings
// 		if (premium_db_query_failed.length > 0){
// 			Listing.updateListingsBasic(premium_db_query_failed, function(result){
// 			});
// 			res.send({
// 				bad_listings: req.session.new_listings.bad_listings,
// 				good_listings: req.session.new_listings.good_listings
// 			});
// 			delete req.session.new_listings;
// 		}
// 	}
// 	else {
// 		stripeErrorHandler(req, res, err);
// 	}
// }

//helper function for handling stripe errors
function stripeErrorHandler(req, res, err){
	console.log(err.message);
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

//helper function to get the req.user listings object for a specific domain
function getUserListingObj(listings, domain_name){
	for (var x = 0; x < listings.length; x++){
		if (listings[x].domain_name.toLowerCase() == domain_name.toLowerCase()){
			return listings[x];
		}
	}
}
