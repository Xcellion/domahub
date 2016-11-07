var	listing_model = require('../models/listing_model.js');

var node_env = process.env.NODE_ENV || 'dev'; 	//dev or prod bool
if (node_env == "dev"){
	var stripe = require("stripe")("sk_test_PHd0TEZT5ytlF0qCNvmgAThp");		//stripe API development key
}
else {
	var stripe = require("stripe")("sk_test_PHd0TEZT5ytlF0qCNvmgAThp");		//stripe API development key
	//var stripe = require("stripe")("sk_live_Nqq1WW2x9JmScHxNbnFlORoh");		//stripe API production key
}

var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();

module.exports = function(app, db){
	Listing = new listing_model(db);

	app.post('/stripe/webhook/arbitrary/woohoo', [
		jsonParser,
		stripeWebhookEventCatcher
	]);
}

//to catch all stripe web hook events
function stripeWebhookEventCatcher(req, res){
	if (node_env == "dev"){
		switchEvents(req.body, res)
	}
	else {
		//Verify the event by fetching it from Stripe
		stripe.events.retrieve(req.body.id, function(err, event) {
			switchEvents(event, res)
		});
	}
}

//helper function to switch between event types
function switchEvents(event, res){
	console.log(event);
	if (event){
		res.sendStatus(200);
		switch (event.type){
			case "customer.deleted":
				handleCustomerDelete(event);
				break;
			case "customer.subscription.deleted":
				handleSubscriptionCancel(event);
				break;
			case "invoice.payment_succeeded":
				handleSubscriptionPay(event);
				break;
			case "invoice.payment_failed":
				handleSubscriptionPayFail(event);
				break;
			default:
				console.log("Event from Stripe: " + event.type);
				break;
		}
	}
	else {
		res.sendStatus(404);
	}
}

//-------------------------------------------------------------------------------------------------------------------HANDLERS

//deleted a customer
function handleCustomerDelete(event){
	updateAccount(event.data.object, false);
}

//cancelled subscription (at period end, or immediate)
function handleSubscriptionCancel(event){
	updateListing(event.data.object, false);
}

//paid another month of subscription
function handleSubscriptionPay(event){
	retrieveSubscription(event.data.object.subscription, function(subscription){
		updateListing(subscription, true);
	});
}

//failed to pay for another month of subscription
function handleSubscriptionPayFail(event){
	retrieveSubscription(event.data.object.subscription, function(subscription){
		//todo, email user about failure
	});
}

//-------------------------------------------------------------------------------------------------------------------HELPER FUNCTIONS

//helper function to retrieve subscription
function retrieveSubscription(id, callback){
	if (id){
		stripe.subscriptions.retrieve(id, function(err, subscription) {
			if (err){
				console.log(err);
			}
			else {
				callback(subscription);
			}
		});
	}
}

//helper to renew or remove listing premium subscription on domahub db
function updateListing(subscription, bool, object){
	var domain_name = subscription.metadata.domain_name;
	var listing_id = subscription.metadata.listing_id;

	if (bool){
		var new_listing_info = {
			stripe_subscription_id : subscription.id,
			exp_date : subscription.current_period_end * 1000,		//stripe doesnt count the time, only days
			//minute_price: subscription.metadata.minute_price || 1,
			hour_price: subscription.metadata.hour_price || 1,
			day_price: subscription.metadata.day_price || 10,
			week_price: subscription.metadata.week_price || 25,
			month_price: subscription.metadata.month_price || 50
		}
		var console_msg = {
			success: "Premium status for listing #" + listing_id + " has been renewed/created!",
			error: "Something went wrong with renewing Premium status for listing #" + listing_id + "!"
		}
	}
	else {
		var new_listing_info = {
			stripe_subscription_id: "",
			exp_date: 0,
			expiring: false,
			//minute_price: 1,		//reset pricing
			hour_price: 1,
			day_price: 10,
			week_price: 25,
			month_price: 50
		}
		var console_msg = {
			success: "Premium status for listing #" + listing_id + " has expired after cancellation...",
			error: "Something went wrong with cancelling Premium status for listing #" + listing_id + "!"
		}
	}

	//update the domahub DB appropriately
	if (domain_name && listing_id){
		Listing.updateListing(domain_name, new_listing_info, function(result){
			if (result.state == "success"){
				console.log(console_msg.success);
			}
			else {
				console.log(console_msg.error);
			}
		});
	}
}

//helper to update or remove customer ID
function updateAccount(customer, bool){
	account_id = customer.metadata.account_id;

	if (bool){
		var new_account_info = {

		}
	}
	else {
		var new_account_info = {
			stripe_customer_id: ""
		}
		var console_msg = {
			success: "Stripe customer id for account #" + account_id + " has been deleted...",
			error: "Something went wrong with deleting the Stripe customer id for account #" + account_id + "!"
		}
	}

	if (account_id){
		//update the domahub DB appropriately
		Account.updateAccountStripeCustomerID(account_id, new_account_info, function(result){
			if (result.state == "success"){
				console.log(console_msg.success);
			}
			else {
				console.log(console_msg.error);
			}
		});
	}
}
