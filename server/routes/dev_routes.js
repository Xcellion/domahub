var	account_model = require('../models/account_model.js');
var	listing_model = require('../models/listing_model.js');

var	validator = require('validator');
var	request = require('request');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: true });
var dns = require("dns");

module.exports = function(app, db, auth, error){
    Auth = auth;
    Account = new account_model(db);
    Listing = new listing_model(db);

    //google safe browsing test
    app.get("/googlesafe", googleSafe);
    app.get("/dnsrecords", dnsRecords)
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

//testing dns records look up
function dnsRecords(){
    dns.resolve("unverifieddomain.com", "A", function(err, addresses){
        console.log(err);
    });
}
