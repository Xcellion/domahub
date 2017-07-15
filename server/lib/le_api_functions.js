var listing_model = require('../models/listing_model.js');
var validator = require("validator");
var node_env = process.env.NODE_ENV || 'dev';   //dev or prod bool
var stripe = require('../lib/stripe.js');

module.exports = function(app, db){
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
      res.sendStatus(404);
    }
    else if (!validator.isAscii(domain_name) || !validator.isFQDN(domain_name)){
      res.sendStatus(404);
    }
    else {
      next();
    }
  }
  else {
    res.sendStatus(404);
  }
}

//send the current rental details and information for a listing
function checkListed(req, res, next){
  var domain_name = req.headers.host.replace(/^(https?:\/\/)?(www\.)?/,'');

  console.log("LEF: Attempting to check premium status for " + domain_name + "!");
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

//stripe subscription is active! send ok to NGINX for new SSL certificate
function sendOkayToNginx(req, res, next){
  console.log("LEF: " + domain_name + " is a Premium domain! Getting new SSL certificate...");
  res.sendStatus(200);
}
