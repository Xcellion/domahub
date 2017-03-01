var	listing_model = require('../models/listing_model.js');

var node_env = process.env.NODE_ENV || 'dev'; 	//dev or prod bool
var stripe_key = (node_env == "dev") ? "sk_test_PHd0TEZT5ytlF0qCNvmgAThp" : "sk_live_Nqq1WW2x9JmScHxNbnFlORoh";
var stripe = require("stripe")(stripe_key);

var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();

module.exports = function(app, db){
	Listing = new listing_model(db);

	app.post('/stripe/webhook', [
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
	if (event){
		res.sendStatus(200);
		console.log("Event from Stripe: " + event.type);
		switch (event.type){
			case "customer.deleted":
				handleCustomerDelete(event);
				break;
			case "customer.subscription.deleted":
				handleSubscriptionCancel(event);
				break;
			case "account.application.deauthorized":
				handleAccountDeauthorized(event);
				break;
			default:
				break;
		}
	}
	else {
		res.sendStatus(404);
	}
}

//-------------------------------------------------------------------------------------------------------------------HANDLERS

//failed to pay for another month of subscription
function handleAccountDeauthorized(event){
	updateAccountStripeUserID(event.user_id);
}

//deleted a customer
function handleCustomerDelete(event){
	updateAccountStripeCustomerID(event.data.object, false);
}

//cancelled subscription (at period end, or immediate)
function handleSubscriptionCancel(event){
	updateListingBasic(event.data.object);
}

//-------------------------------------------------------------------------------------------------------------------HELPER FUNCTIONS

//helper to update or remove customer ID
function updateAccountStripeCustomerID(customer, bool){
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
		Account.updateAccount(account_id, new_account_info, function(result){
			if (result.state == "success"){
				console.log(console_msg.success);
			}
			else {
				console.log(console_msg.error);
			}
		});
	}
}

//customer revoking access to domahub
function updateAccountStripeUserID(stripe_account){
	if (user_id){
		//update the domahub DB appropriately
		Account.updateAccountStripeUserID(stripe_account, {stripe_account : null}, function(result){
			if (result.state == "success"){
				console.log("Stripe user" + stripe_account + " has revoked access...");
			}
			else {
				console.log("Something went wrong with Stripe user" + stripe_account + " revoking access...");
			}
		});
	}
}

//helper to renew or remove listing premium subscription on domahub db
function updateListingBasic(subscription){
	var listing_id = subscription.metadata.insert_id;

	var new_listing_info = [[
		listing_id,
		"month",
		25,
		"",
		0,
		false
	]]

	//update the domahub DB appropriately
	if (listing_id){
		Listing.updateListingsBasic(new_listing_info, function(result){
			if (result.state == "success"){
				console.log("Reverting listing #" + listing_id + " to basic...");
			}
			else {
				console.log("Something went wrong with renewing Premium status for listing #" + listing_id + "!");
			}
		});
	}
}
