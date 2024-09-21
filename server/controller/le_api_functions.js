//#region -------------------------------DOMA LIB FUNCTIONS-------------------------------

var listing_model = require('../models/listing_model.js');

var stripe_functions = require("../controller/stripe_functions.js");


//#endregion

//#region -------------------------------VARIABLES-------------------------------

var validator = require("validator");

//#endregion

//Lets Encrypt server for custom SSL on demand for all domains listed at DomaHub
module.exports = function(app){
  app.use("*", [
    checkHost,
    checkListed,
    stripe_functions.checkStripeSubscriptionForUser,
    sendOkayToNginx
  ]);
}

//#region -------------------------------FUNCTIONS-------------------------------

//check for hostname
function checkHost(req, res, next){
  if (req.headers.host){
    var domain_name = req.headers.host.replace(/^(https?:\/\/)?(www\.)?/,'');

    //requested domahub, dont need SSL
    if (domain_name == "www.w3bbi.com"
    || domain_name == "w3bbi.com"
    || domain_name == "www.domahub.com"
    || domain_name == "domahub.com"
    || domain_name == "localhost"
    || domain_name == "localhost:8080"
    || domain_name == "localhost:9090"){
      res.sendStatus(404);
    }
    //not a legit domain name, dont need SSL
    else if (!validator.isAscii(domain_name) || !validator.isFQDN(domain_name)){
      res.sendStatus(404);
    }
    else {
      next();
    }
  }
  //not a legit domain name, dont need SSL
  else {
    res.sendStatus(404);
  }
}

//send the current rental details and information for a listing
function checkListed(req, res, next){
  console.log("LEF: Attempting to check premium status for " + domain_name + "!");
  var domain_name = req.headers.host.replace(/^(https?:\/\/)?(www\.)?/,'');

  listing_model.checkListingStripe(domain_name, function(result){
    //premium! check stripe now to see if it's an active subscription
    if (result.state == "success" && result.info.length > 0){
      req.session.listing_info = result.info[0];
      next();
    }
    //not premium! send 404 to NGINX to not bother with SSL
    else {
      console.log("LEF: " + domain_name + " is not a Premium domain!...");
      res.sendStatus(404);
    }
  });
}

//stripe subscription is active! send ok to NGINX for new SSL certificate
function sendOkayToNginx(req, res, next){
  var domain_name = req.headers.host.replace(/^(https?:\/\/)?(www\.)?/,'');

  if (req.session.listing_info.premium){
    console.log("LEF: " + domain_name + " is a Premium domain! Getting new SSL certificate...");
    res.sendStatus(200);
  }
  else {
    console.log("LEF: " + domain_name + " is not a Premium domain!...");
    res.sendStatus(404);
  }
}

//#endregion
