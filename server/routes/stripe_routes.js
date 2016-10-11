var	listing_model = require('../models/listing_model.js');

var node_env = process.env.NODE_ENV || 'dev'; 	//dev or prod bool
if (node_env == "dev"){
	var stripe = require("stripe")("sk_test_PHd0TEZT5ytlF0qCNvmgAThp");		//stripe API development key
}
else {
	var stripe = require("stripe")("sk_test_PHd0TEZT5ytlF0qCNvmgAThp");		//stripe API production key
}

module.exports = function(app, db, auth, e){
	Listing = new listing_model(db);
	error = e;

	//create multiple listings
	app.post('/stripe/webhook/arbitrary/woohoo', [
		function(request, response){
			var event_json = JSON.parse(request.body);
			console.log(event_json);
			
			//Verify the event by fetching it from Stripe
			stripe.events.retrieve(event_json.id, function(err, event) {
				// Do something with event
				response.send(200);
			});
		}
	]);

}
