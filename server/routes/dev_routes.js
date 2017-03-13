var	account_model = require('../models/account_model.js');
var	listing_model = require('../models/listing_model.js');

var	validator = require('validator');
var	request = require('request');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: true })

var node_env = process.env.NODE_ENV || 'dev'; 	//dev or prod bool

module.exports = function(app, db, auth, error){
    Auth = auth;
    Account = new account_model(db);
    Listing = new listing_model(db);

    if (node_env == "dev"){
        //google safe browsing test
        app.get("/googlesafe", googleSafe);
    }

}

//testing google safe browsing
function googleSafe(){
    request({
        url: "https://safebrowsing.googleapis.com/v4/threatMatches:find?key=AIzaSyDjjsGtrO_4QwFDBA1cq9rCweeO4v3YLfs",
        method: "POST",
        body: {
            "client": {
                "clientId": "domahub",
                "clientVersion": "1.0"
            },
            "threatInfo": {
                "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
                "threatEntryTypes": ["URL"],
                "threatEntries": [
                    {"url": "www.hjaoopoa.top/admin.php?f=1.gif"}
                ]
            }
        },
        json: true
    }, function (err, response, body) {
        console.log(response.body);
    });
}
