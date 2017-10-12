var  listing_model = require('../models/listing_model.js');

var node_env = process.env.NODE_ENV || 'dev';   //dev or prod bool
var stripe_key = (node_env == "dev") ? "sk_test_PHd0TEZT5ytlF0qCNvmgAThp" : "sk_live_Nqq1WW2x9JmScHxNbnFlORoh";
var stripe = require("stripe")(stripe_key);

var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: true })

module.exports = function(app, db){
  app.post('/stripe/webhook', [
    jsonParser,
    stripeWebhookEventCatcher
  ]);
}

//-------------------------------------------------------------------------------------------------------------------WEBHOOK LISTENER

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
      // case "customer.deleted":
      //   handleCustomerDelete(event);
      //   break;
      // case "customer.subscription.deleted":
      //   handleSubscriptionCancel(event);
      //   break;
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
  updateAccountStripe(event.user_id);
}

//-------------------------------------------------------------------------------------------------------------------HELPER FUNCTIONS

//customer revoking access to domahub
function updateAccountStripe(stripe_account){
  if (stripe_account){
    //update the domahub DB appropriately
    Account.updateAccountStripe({
      stripe_account : null,
      stripe_secret : null,
      stripe_public : null,
      type: 1
    }, stripe_account, function(result){
      if (result.state=="error"){
        console.log("Something went wrong with Stripe user" + stripe_account + " revoking access...");
      }
      else {
        console.log("Stripe user " + stripe_account + " has revoked access...");
      }
    });
  }
}
