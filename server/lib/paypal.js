var paypal = require('paypal-rest-sdk');

paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': 'AQxXu39UrCOLWjAYaK0j6PeeHWp6b_oBrHfR4De0zjjjGBCHy4P3Y0YPFqf7l1degv3_2br4ob3NjBka',
  'client_secret': 'EI7BMUWzJKtQRBdVsuFt0kitsJa5iJivRC10Oq3Mx5M3R6SURLCllTpk-giRzf-4jAm4wspdgEPtJCSa'
});

var create_web_profile_json = {
	"name": "w3bbi Domain Rental",
	"presentation": {
		"brand_name": "w3bbi Domain Rental",
		"logo_image": "http://localhost:8080/images/test.png",
		"locale_code": "US"
	},
	"input_fields": {
		"allow_note": false,
		"no_shipping": 1,
		"address_override": 1
	},
	"flow_config": {
		"landing_page_type": "billing",
		"bank_txn_pending_url": "http://www.w3bbi.com"
	}
};

//check if web profile exists, create if it doesn't
paypal.webProfile.list(function (error, webProfiles) {
	var created = false; 
	if (error) {
		throw error;
	} else {
		for (var x = 0; x < webProfiles.length; x++){
			if (webProfiles[x].name == create_web_profile_json.name){
				created = true;
				return webProfiles[x].id;
			}
		};
		
		if (!created){		
			paypal.webProfile.create(create_web_profile_json, function (error, web_profile) {
				if (error) {
					console.log("Error with creating PayPal web profile! ", error.response.details);
					throw error;
				} else {
					console.log("Created PayPal web profile!");
					return web_profile.id;
				}
			});
		}
	}
});

paypal.webProfile.getId = function(callback){
	paypal.webProfile.list(function (error, webProfiles) {
		if (error) {
			callback(error);
		} else {
			for (var x = 0; x < webProfiles.length; x++){
				if (webProfiles[x].name == create_web_profile_json.name){
					callback(false, webProfiles[x].id);
				}
			};
		}
	});
} 

module.exports = paypal;