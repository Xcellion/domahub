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
			case "invoice.payment_succeeded":
				handleSubscriptionPay(event);
				break;
			case "invoice.payment_failed":
				handleSubscriptionPayFail(event);
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

//deleted a customer
function handleCustomerDelete(event){
	updateAccountStripeCustomerID(event.data.object, false);
}

//cancelled subscription (at period end, or immediate)
function handleSubscriptionCancel(event){
	updateListingsBasic(event.data.object);
}

//paid another month of subscription
function handleSubscriptionPay(event){
	retrieveSubscription(event.data.object.subscription, function(subscription){
		updateListingsPremium(subscription);
	});
}

//failed to pay for another month of subscription
function handleSubscriptionPayFail(event){
	retrieveSubscription(event.data.object.subscription, function(subscription){
		//todo, email user about failure
	});
}

//failed to pay for another month of subscription
function handleAccountDeauthorized(event){
	updateAccountStripeUserID(event.user_id);
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

//helper function to upgrade to premium bulk
function updateListingsPremium(subscription){
	var inserted_ids = subscription.metadata.inserted_ids;

	//multi-premium
	if (inserted_ids){

		//create the DB query
		var formatted_db_query = [];
		for (var x = 0; x < inserted_ids.length; x++){
			var temp_row = [];
			temp_row.push(
				inserted_ids[x],
				subscription.id,
				subscription.current_period_end * 1000
			);
			formatted_db_query.push(temp_row);
		}

		//update the domahub DB appropriately
		Listing.updateListingsPremium(formatted_db_query, function(result){
			if (result.state == "success"){
				console.log("Premium status for " + formatted_db_query.length + " listings has been renewed/created!");
			}
			else {
				console.log("Something went wrong with renewing " + formatted_db_query.length + " Premium statuses!");
			}
		});
	}
}

//helper to renew or remove listing premium subscription on domahub db
function updateListingsBasic(subscription, bool, object){

	var price_types = subscription.metadata.price_types;
	var inserted_ids = subscription.metadata.inserted_ids;

	//multi-premium
	if (inserted_ids.length == price_types.length){

		//create the DB query
		var formatted_db_query = [];
		for (var x = 0; x < inserted_ids.length; x++){
			var temp_row = [];

			//revert to basic prices only
			var temp_rate = (price_types[x] == "month") ? 25 : 10;
			price_types[x] = (price_types[x] == "month") ? "month" : "week";

			temp_row.push(
				inserted_ids[x],		//listing id
				price_types[x],			//price type (make sure its month or week)
				temp_rate,				//25 or 10
				"",						//remove stripe subscription id
				0,						//remove exp date
				false					//its not "expiring", but "expired"
			);
			formatted_db_query.push(temp_row);
		}

		//update the domahub DB appropriately
		Listing.updateListingsBasic(formatted_db_query, function(result){
			if (result.state == "success"){
				console.log("Premium status for " + formatted_db_query.length + " listings have expired after cancellation...");
			}
			else {
				console.log("Something went wrong with cancelling " + formatted_db_query.length + " Premium statuses!");
			}
		});
	}
}

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
function updateAccountStripeUserID(stripe_user_id){
	if (user_id){
		//update the domahub DB appropriately
		Account.updateAccountStripeUserID(stripe_user_id, {stripe_user_id : null}, function(result){
			if (result.state == "success"){
				console.log("Stripe user" + stripe_user_id + " has revoked access...");
			}
			else {
				console.log("Something went wrong with Stripe user" + stripe_user_id + " revoking access...");
			}
		});
	}
}
