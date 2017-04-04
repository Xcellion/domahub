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
    app.get("/quantcast", quantcast);
    app.get("/createcodes/:number", [
        createSignupCodes
    ]);
}

//testing quantcast redirect
function quantcast(req, res, next){
    res.render("quant_redirect.ejs", {
        redirect_link: "https://fuck.com",
        redirect_name: "fuck.com"
    });
}

//testing alexa get
function alexa(req, res, next){
    if (req.params.domain_name){
        console.log("F: Getting Alexa traffic information for " + req.params.domain_name);
        var client = awis({
            key: "AKIAJVS3NZJHFWJ7QKKA",
            secret: "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"
        });

// UrlInfo - get information about pages and sites on the web - their traffic, content, and related sites
// TrafficHistory - get a history of traffic rank
// CategoryBrowse, CategoryListings - get lists of sites within a specific category ordered by traffic rank, or create a browseable directory of websites
// SitesLinkingIn - get a list of sites linking in to a specified site

        client({
            'Action': 'TrafficHistory',
            'Url': req.params.domain_name,
            'ResponseGroup': 'History'
            // 'ResponseGroup': 'RelatedLinks,Categories,Rank,RankByCountry,UsageStats,AdultContent,Speed,Language,OwnedDomains,LinksInCount,SiteData'
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
    var return_lazy = [];

    if (validator.isInt(req.params.number)){
        for (var x = 0; x < req.params.number; x++){
            var random_string = randomstring.generate(10);
            codes.push([random_string, 1]);
            return_lazy.push("https://domahub.com/signup/" + random_string);
        }
    }
    Account.createSignupCodes(codes, function(result){
        res.send(return_lazy.join("</br></br>"));
    });
}
