var	account_model = require('../models/account_model.js');
var	listing_model = require('../models/listing_model.js');

var	validator = require('validator');
var	request = require('request');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: true });
var dns = require("dns");

var randomstring = require("randomstring");

module.exports = function(app, db, auth, error){
    Auth = auth;
    Account = new account_model(db);
    Listing = new listing_model(db);

    app.get("/dnsrecords/:domain_name", dnsRecords);
    app.get("/createcodes/:number", [
        createSignupCodes
    ]);
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
