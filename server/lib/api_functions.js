var listing_model = require('../models/listing_model.js');
var account_model = require('../models/account_model.js');
var data_model = require('../models/data_model.js');

var search_functions = require("../routes/listings/listings_search_functions.js");
var renter_functions = require("../routes/listings/listings_renter_functions.js");

var validator = require("validator");
var node_env = process.env.NODE_ENV || 'dev';   //dev or prod bool
var stripe = require('../lib/stripe.js');

module.exports = function(app, db, e){
  error = e;
  Listing = new listing_model(db);

  app.use("*", [
    checkHost,
    checkListed,
    stripe.checkStripeSubscription,
    sendOkayToNginx
  ]);
}

//function to check if the requested host is not for domahub
function checkHost(req, res, next){
  if (req.headers.host){
    var domain_name = req.headers.host.replace(/^(https?:\/\/)?(www\.)?/,'');

    if (domain_name == "www.w3bbi.com"
    || domain_name == "w3bbi.com"
    || domain_name == "www.domahub.com"
    || domain_name == "domahub.com"
    || domain_name == "localhost"
    || domain_name == "localhost:8080"
    || domain_name == "localhost:9090"){
      error.handler(req, res, "Requested DomaHub!", "api");
    }
    else if (!validator.isAscii(domain_name) || !validator.isFQDN(domain_name)){
      error.handler(req, res, "Invalid domain name!", "apiP");
    }
    else {
      next();
    }
  }
  else {
    error.handler(req, res, "Requested DomaHub!", "api");
  }
}

//send the current rental details and information for a listing
function checkListed(req, res, next){
  var domain_name = req.headers.host.replace(/^(https?:\/\/)?(www\.)?/,'');
  
  console.log("F: Attempting to check premium status for " + domain_name + "!");
  Listing.checkListingStripe(domain_name, function(result){
    //premium! check stripe now to see if it's an active subscription
    if (result.state == "success" && result.info.length > 0){
      req.session.listing_info = result.info[0];
      next();
    }
    //not premium! send 404 to NGINX to not bother with SSL
    else {
      res.sendStatus(404);
    }
  });
}

//stripe subscription is active! send ok to NGINX
function sendOkayToNginx(req, res, next){
  res.sendStatus(200);
}
