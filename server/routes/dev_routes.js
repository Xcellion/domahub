var	account_model = require('../models/account_model.js');
var	listing_model = require('../models/listing_model.js');

var	validator = require('validator');
var	request = require('request');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: true });
var dns = require("dns");

var randomstring = require("randomstring");

var awis = require('awis');

module.exports = function(app, db, auth, error){
    Auth = auth;
    Account = new account_model(db);
    Listing = new listing_model(db);

    app.get("/dnsrecords/:domain_name", dnsRecords);
    app.get("/alexa/:domain_name", alexa);
    app.get("/createcodes/:number", [
        createSignupCodes
    ]);
}

//testing alexa get
function alexa(req, res, next){
    if (req.params.domain_name){
        var client = awis({
            key: "AKIAJVS3NZJHFWJ7QKKA",
            secret: "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"
        });

        client({
            'Action': 'UrlInfo',
            'Url': req.params.domain_name,
            'ResponseGroup': 'Related,TrafficData,ContentData'
        }, function (err, data) {
            if(err) { console.log(err); return; }
            res.send(data);
        });
    }
    else {
        res.send("you need a domain name");
    }
}

//testing dns records look up
function dnsRecords(req, res, next){
    dns.resolve(req.params.domain_name, "A", function (err, address, family) {
        res.send(address);
    });
}

//function to create X sign up codes
function createSignupCodes(req, res, next){
    console.log("F: Creating " + req.params.number + " signup codes...");
    var codes = [];

    if (validator.isInt(req.params.number)){
        for (var x = 0; x < req.params.number; x++){
            codes.push([randomstring.generate(10), 1]);
        }
    }
    Account.createSignupCodes(codes, function(result){
        res.send(result);
    });
}
