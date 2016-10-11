//var node_env = process.env.NODE_ENV || 'dev'; 	//dev or prod bool
var node_env = 'dev';
if (node_env == "dev"){
	var stripe = require("stripe")("sk_test_PHd0TEZT5ytlF0qCNvmgAThp");		//stripe API development key
}
else {
	var stripe = require("stripe")("sk_live_Nqq1WW2x9JmScHxNbnFlORoh");		//stripe API production key
}

var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()
var urlencodedParser = bodyParser.urlencoded({ extended: false })

module.exports = function(app){
	app.post('/stripe/webhook/arbitrary/woohoo', [
		urlencodedParser,
		stripeWebhookEventCatcher
	]);
}

//to catch all stripe web hook events
function stripeWebhookEventCatcher(req, res){
	console.log(req.body);
	var event_json = JSON.parse(req.body);
	console.log(event_json);

	//Verify the event by fetching it from Stripe
	stripe.events.retrieve(event_json.id, function(err, event) {
		// Do something with event
		res.send(200);
	});
}
