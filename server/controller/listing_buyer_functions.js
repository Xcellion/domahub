//<editor-fold>-------------------------------DOMA LIB FUNCTIONS-------------------------------

var listing_model = require('../models/listing_model.js');
var data_model = require('../models/data_model.js');

var error = require('../lib/error.js');
var mailer = require('../lib/mailer.js');

//</editor-fold>

//<editor-fold>-------------------------------VARIABLES-------------------------------

var PNF = require('google-libphonenumber').PhoneNumberFormat;
var phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
var randomstring = require("randomstring");
var validator = require("validator");

var ejs = require('ejs');
var path = require("path");
var moment = require('moment');

var wNumb = require("wnumb");
var moneyFormat = wNumb({
  thousand: ',',
  prefix: '$',
  decimals: 0
});

//</editor-fold>

module.exports = {

  //<editor-fold>-------------------------------------OFFER FOR PURCHASE-------------------------------

  //check buy-now contact details
  checkContactInfo : function(req, res, next){
    console.log("F: Checking posted contact details for offer...");

    if (!req.body.contact_name){
      error.handler(req, res, "Please enter your name!", "json");
    }
    else if (!validator.isEmail(req.body.contact_email)){
      error.handler(req, res, "Please enter a valid email address!", "json");
    }
    else if (!req.body.contact_phone || !phoneUtil.isValidNumber(phoneUtil.parse(req.body.contact_phone), PNF.INTERNATIONAL)){
      error.handler(req, res, "Please enter a real phone number! Did you select the correct country for your phone number?", "json");
    }
    //if offer price is too low
    else if (req.body.contact_offer && !validator.isInt(req.body.contact_offer, { min: req.session.listing_info.min_price })){
      error.handler(req, res, "This is an invalid offer price! Please enter an amount greater than " + moneyFormat.to(parseFloat(req.session.listing_info.min_price)) + ".", "json");
    }
    else if (!req.body.contact_message){
      error.handler(req, res, "A message to the owner greatly increases your chance of successfully purchasing this domain name! Please enter a short message for the owner.", "json");
    }
    else {
      next();
    }
  },

  //record the contact message (with verification code)
  createOfferContactRecord : function(req, res, next){
    console.log("F: Creating a new contact offer record...");

    var contact_details = {
      listing_id : req.session.listing_info.id,
      timestamp : new Date().getTime(),
      user_ip : getIP(req),
      verification_code : randomstring.generate(10),
      name : req.body.contact_name,
      email : req.body.contact_email,
      phone : phoneUtil.format(phoneUtil.parse(req.body.contact_phone), PNF.INTERNATIONAL),
      offer : req.body.contact_offer,
      message : req.body.contact_message
    }

    //recursive function to make sure verification code is unique
    newListingContactHistory(req, res, next, contact_details);
  },

  //send the verification email
  sendContactVerificationEmail : function(req, res, next){
    console.log("F: Sending email to offerer to verify email...");

    var pathEJSTemplate = path.resolve(process.cwd(), 'server', 'views', 'email', 'offer_verify_email.ejs');

    //figure out luminance based on primary color
    req.session.listing_info.font_luminance = calculateLuminance(req.session.listing_info.primary_color);

    var EJSVariables = {
      premium: req.session.listing_info.premium || false,
      domain_name: req.session.listing_info.domain_name,
      verification_code: req.session.contact_verification_code,
      offerer_name: req.body.contact_name,
      offerer_email: req.body.contact_email,
      offerer_phone: phoneUtil.format(phoneUtil.parse(req.body.contact_phone), PNF.INTERNATIONAL),
      offer: moneyFormat.to(parseFloat(req.body.contact_offer)),
      message: req.body.contact_message,
      listing_info: req.session.listing_info
    }

    delete req.session.contact_verification_code;

    //premium email from listing owner or from domahub
    var email_from = (req.session.listing_info.premium) ? "'" + req.session.listing_info.username + "'<" + req.session.listing_info.owner_email + ">" : '"DomaHub" <general@domahub.com>'
    var emailDetails = {
      to: req.body.contact_email,
      from: email_from,
      subject: "Hi, " + req.body.contact_name + '! Please verify your offer for ' + req.session.listing_info.domain_name,
    };

    //set premium options
    if (req.session.listing_info.premium){
      emailDetails.from = '"' + req.session.listing_info.domain_name + '" <' + req.session.listing_info.owner_email + '>';
    }

    //use helper function to email someone
    mailer.sendEJSMail(pathEJSTemplate, EJSVariables, emailDetails, function(state){
      if (state == "error"){
        error.handler(req, res, "Something went wrong! Please refresh the page and try again.", "json");
      }
      else {
        res.send({
          state: "success"
        });
      }
    });
  },

  //okay! verify the contact history entry
  verifyContactHistory : function(req, res, next){
    console.log("F: Verifying offer email...");

    data_model.verifyContactHistory(req.params.verification_code, req.params.domain_name, function(result){

      //asynchronously alert the owner!
      //get the listing owner contact information to email
      getListingOwnerContactInfo(req.params.domain_name, function(owner_result){
        if (owner_result){
          getListingOffererContactInfoByCode(req.params.domain_name, req.params.verification_code, function(offer_result){
            if (offer_result){
              console.log("F: Emailing owner about new verified offer...");
              var offer_formatted = moneyFormat.to(parseFloat(offer_result.offer));

              //email the owner
              mailer.sendEJSMail(path.resolve(process.cwd(), 'server', 'views', 'email', 'offer_notify_owner.ejs'), {
                domain_name: req.params.domain_name,
                owner_name: owner_result.username,
                offerer_name: offer_result.name,
                offerer_email: offer_result.email,
                offerer_phone: phoneUtil.format(phoneUtil.parse(offer_result.phone), PNF.INTERNATIONAL),
                verification_code: req.params.verification_code,
                offer: offer_formatted,
                message: offer_result.message
              }, {
                to: owner_result.email,
                from: '"DomaHub Domains" <general@domahub.com>',
                subject: 'You have a new ' + offer_formatted + ' offer for ' + req.params.domain_name + "!"
              }, false);

              //notify domahub
              if (process.env.NODE_ENV != "dev"){
                mailer.sendBasicMail({
                  to: "general@domahub.com",
                  from: 'general@domahub.com',
                  subject: "New verified offer for a listing on DomaHub!",
                  html: "There was a new offer for - " + req.params.domain_name + "<br />From - " + offer_result.name + "<br />Email - " + offer_result.email + "<br />Message - " + offer_result.message
                });
              }
            }
          });
        }
      });

      //render the redirect page to notify offerer that offer was successfully sent
      res.render("listings/offer_verify.ejs", {
        listing_info : req.session.listing_info,
        compare : false
      });
    });
  },

  //check if already accepted an offer for a listing
  checkAlreadyAccepted : function(req, res, next){
    console.log("F: Checking if listing has an existing accepted offer...");
    var listing_info = getUserListingObj(req.user.listings, req.params.domain_name);

    if (listing_info.accepted){
      error.handler(req, res, "already-accepted", "json");
    }
    else {
      next();
    }
  },

  //accept or reject an offer
  acceptOrRejectOffer : function(req, res, next){
    console.log("F: Accepting or rejecting an offer...");
    var accepted = req.path.indexOf("/accept") != -1;
    var contact_item = {
      accepted : accepted,
      response : req.body.response || ""
    }

    //update the DB on accepted or rejected
    data_model.acceptRejectOffer(contact_item, req.params.domain_name, req.params.offer_id, function(offer_result){
      var listing_info = getUserListingObj(req.user.listings, req.params.domain_name);
      //set accepted variable if accepted
      if (accepted){
        listing_info.accepted = 1;
      }
      //delete offers object so we refresh it
      delete listing_info.offers;

      res.json({
        state: offer_result.state,
        accepted: accepted
      });

      next();
    });
  },

  //asynchronously alert the offerer
  notifyOfferer : function(req, res, next){

    getListingOffererContactInfoByID(req.params.domain_name, req.params.offer_id, function(offer_result){
      if (offer_result){

        //send a transfer verify email
        if (offer_result.deposited){
          console.log("F: Sending email to the buyer for transfer verification / next steps!");
          var pathEJSTemplate = path.resolve(process.cwd(), 'server', 'views', 'email', 'bin_notify_buyer.ejs');
          var price_formatted = moneyFormat.to(parseFloat(offer_result.offer));
          listing_info = getUserListingObj(req.user.listings, req.params.domain_name);

          //figure out luminance based on primary color
          listing_info.font_luminance = calculateLuminance(listing_info.primary_color);

          var EJSVariables = {
            domain_name: req.params.domain_name,
            owner_name: req.user.username,
            owner_email: req.user.email,
            price: price_formatted,

            //for custom emails
            premium: (req.user.stripe_subscription_id) ? true : false,
            listing_info: listing_info,

            offerer_name: offer_result.name,
            offerer_email: offer_result.email,
            offerer_phone: offer_result.phone,
            message: offer_result.message,
            verification_code : offer_result.verification_code
          }

          //premium email from listing owner or from domahub
          var email_from = (req.user.stripe_subscription_id) ? "'" + req.user.username + "'<" + req.user.email + ">" : '"DomaHub" <general@domahub.com>'
          var emailDetails = {
            to: offer_result.email,
            from: email_from,
            subject: 'Congratulations on your recent purchase of ' + req.params.domain_name + " for " + price_formatted + "!"
          };
        }

        //send accept/reject email
        else {
          console.log("F: Sending email to offerer to notify of accept/reject status...");
          var pathEJSTemplate = path.resolve(process.cwd(), 'server', 'views', 'email', 'offer_notify_buyer.ejs');
          var listing_info = getUserListingObj(req.user.listings, req.params.domain_name);

          //figure out luminance based on primary color
          listing_info.font_luminance = calculateLuminance(listing_info.primary_color);

          var accepted_text = (offer_result.accepted) ? "accepted" : "rejected";
          var offer_formatted = moneyFormat.to(parseFloat(offer_result.offer));
          var EJSVariables = {
            accepted: offer_result.accepted,
            domain_name: req.params.domain_name,
            offer_id: offer_result.id,
            offerer_name: offer_result.name,
            offerer_email: offer_result.email,
            offerer_phone: phoneUtil.format(phoneUtil.parse(offer_result.phone), PNF.INTERNATIONAL),
            offer: offer_formatted,
            message: offer_result.message,
            response: offer_result.response,
            premium: (req.user.stripe_subscription_id) ? true : false,
            listing_info: (listing_info) ? listing_info : false
          }

          //premium email from listing owner or from domahub
          var email_from = (req.user.stripe_subscription_id) ? "'" + req.user.username + "'<" + req.user.email + ">" : '"DomaHub" <general@domahub.com>'
          var emailDetails = {
            to: offer_result.email,
            from: email_from,
            subject: 'Your ' + offer_formatted + ' offer for ' + req.params.domain_name + " was " + accepted_text + "!"
          };
        }

        //email the offerer
        mailer.sendEJSMail(pathEJSTemplate, EJSVariables, emailDetails, false);
      }
    });
  },

  //</editor-fold>

  //<editor-fold>-------------------------------------BUYING A LISTING CHECKOUT-------------------------------------

  redirectToCheckout : function(req, res, next){
    req.session.new_buying_info = {
      domain_name : req.params.domain_name,
      name : req.body.contact_name,
      email : req.body.contact_email,
      phone : phoneUtil.format(phoneUtil.parse(req.body.contact_phone), PNF.INTERNATIONAL),
      offer : req.body.contact_offer,
      message : req.body.contact_message
    };

    res.send({
      state: "success"
    });
  },

  //check the posted offer to see if it was accepted
  checkOfferAccepted : function(req, res, next){
    console.log("F: Checking if offer has been accepted by the owner...");

    data_model.checkOfferAccepted(req.params.domain_name, req.params.offer_id, function(result){
      if (result.state == "success" && result.info.length > 0){
        next();
      }
      else {
        console.log("F: This offer hasn't been accepted!");
        res.redirect("/listing/" + req.params.domain_name);
      }
    });
  },

  //gets the offer contact info so we can render the checkout page
  getContactInfo : function(req, res, next){
    getListingOffererContactInfoByID(req.params.domain_name, req.params.offer_id, function(offer_result){
      if (offer_result){
        req.session.new_buying_info = offer_result;
        req.session.new_buying_info.domain_name = req.params.domain_name;
        next();
      }
      else {
        res.redirect('/listing/' + req.params.domain_name);
      }
    });
  },

  //renders the checkout page for a new BIN
  renderCheckout : function(req, res, next){
    var domain_name = (typeof req.session.pipe_to_dh != "undefined") ? req.session.pipe_to_dh : req.params.domain_name;

    if (req.session.listing_info &&
        req.session.new_buying_info &&
        req.session.listing_info.domain_name.toLowerCase() == domain_name.toLowerCase() &&
        req.session.new_buying_info.domain_name.toLowerCase() == domain_name.toLowerCase()
      ){
      console.log("F: Rendering listing checkout page for purchasing...");

      res.render("listings/listing_checkout_buy.ejs", {
        user: req.user,
        listing_info: req.session.listing_info,
        new_buying_info: req.session.new_buying_info,
        node_env : process.env.NODE_ENV,
        compare: false
      });
    }
    else {
      console.log("F: Not checking out! Redirecting to listings page...");
      res.redirect("/listing/" + domain_name.toLowerCase());
    }
  },

  //</editor-fold>

  //<editor-fold>-------------------------------------BUY A LISTING-------------------------------------

  //create a record for this purchase
  createBuyContactRecord : function(req, res, next){
    if (req.session.new_buying_info.id){
      console.log("F: Updating contact record with deposited...");
      data_model.depositedOffer({
        deposited : true,
        deadline : moment().add(2, "week")._d.getTime()
      }, req.session.listing_info.domain_name, req.session.new_buying_info.id, function(result){
        if (result.state == "success"){
          next();
        }
        else {
          error.handler(req, res, "Something went wrong! Please refresh the page and try again.", "json");
        }
      });
    }
    else {
      console.log("F: Creating a new contact buy record...");
      req.session.new_buying_info.verification_code = randomstring.generate(10);
      var contact_details = {
        listing_id : req.session.listing_info.id,
        timestamp : new Date().getTime(),
        user_ip : getIP(req),
        name : req.session.new_buying_info.name,
        email : req.session.new_buying_info.email,
        phone : req.session.new_buying_info.phone,
        message : req.session.new_buying_info.message,
        verification_code : req.session.new_buying_info.verification_code,
        bin : true
      }

      data_model.newListingContactHistory(req.session.listing_info.domain_name, contact_details, function(result){
        if (result.state == "success"){
          next();
        }
        else {
          error.handler(req, res, "Something went wrong! Please refresh the page and try again.", "json");
        }
      });
    }
  },

  //alert the owner that a new BIN came through
  alertOwnerBIN : function(req, res, next){
    console.log("F: Alerting the owner of a new BIN purchase!");

    //get the listing owner contact information to email
    var pathEJSTemplate = path.resolve(process.cwd(), 'server', 'views', 'email', 'bin_notify_owner.ejs');
    var price_formatted = moneyFormat.to(parseFloat((req.session.new_buying_info.id) ? req.session.new_buying_info.offer : req.session.listing_info.buy_price));
    var EJSVariables = {
      domain_name: req.session.listing_info.domain_name,
      owner_name: req.session.listing_info.username,
      price: price_formatted,
      offerer_name: req.session.new_buying_info.name,
      offerer_email: req.session.new_buying_info.email,
      offerer_phone: req.session.new_buying_info.phone,
      message: req.session.new_buying_info.message
    }
    var emailDetails = {
      to: req.session.listing_info.owner_email,
      from: '"DomaHub Domains" <general@domahub.com>',
      subject: 'Somebody just purchased ' + req.params.domain_name + " for " + price_formatted + "!"
    };

    //email the owner
    mailer.sendEJSMail(pathEJSTemplate, EJSVariables, emailDetails, false);

    next();
  },

  //alert the buyer of next steps
  alertBuyerNextSteps : function(req, res, next){
    console.log("F: Sending email to the buyer for transfer verification / next steps!");

    //get the listing owner contact information to email
    var pathEJSTemplate = path.resolve(process.cwd(), 'server', 'views', 'email', 'bin_notify_buyer.ejs');
    var price_formatted = moneyFormat.to(parseFloat((req.session.new_buying_info.id) ? req.session.new_buying_info.offer : req.session.listing_info.buy_price));

    //figure out luminance based on primary color
    req.session.listing_info.font_luminance = calculateLuminance(req.session.listing_info.primary_color);

    var EJSVariables = {
      domain_name: req.session.listing_info.domain_name,
      owner_name: req.session.listing_info.username,
      owner_email: req.session.listing_info.owner_email,
      price: price_formatted,

      //for custom emails
      premium: req.session.listing_info.premium,
      listing_info: req.session.listing_info,

      offerer_name: req.session.new_buying_info.name,
      offerer_email: req.session.new_buying_info.email,
      offerer_phone: req.session.new_buying_info.phone,
      message: req.session.new_buying_info.message,
      verification_code : req.session.new_buying_info.verification_code,
    }

    //premium email from listing owner or from domahub
    var email_from = (req.user.stripe_subscription_id) ? "'" + req.user.username + "'<" + req.user.email + ">" : '"DomaHub" <general@domahub.com>'
    var emailDetails = {
      to: req.session.new_buying_info.email,
      from: email_from,
      subject: 'Congratulations on your recent purchase of ' + req.params.domain_name + " for " + price_formatted + "!"
    };

    //email the owner
    mailer.sendEJSMail(pathEJSTemplate, EJSVariables, emailDetails, false);

    next();
  },

  //delete the BIN info
  deleteBINInfo : function(req, res, next){
    delete req.session.new_buying_info;
    next();
  },

  //set status to 0
  disableListing : function(req, res, next){
    req.session.new_listing_info = {
      status : 0
    }

    next();
  },

  //</editor-fold>

  //<editor-fold>-------------------------------------VERIFICATION OF TRANSFER-------------------------------------

  //check the posted verification code
  checkContactVerified : function(req, res, next){
    console.log("F: Checking if specified offer is verified...");

    data_model.checkContactVerified(req.params.domain_name, req.params.offer_id, function(result){
      if (result.state == "success" && result.info.length > 0){
        next();
      }
      else {
        error.handler(req, res, "This is an invalid or unverified offer!", "json");
      }
    });
  },

  //check the posted verification code
  checkContactVerificationCode : function(req, res, next){
    console.log("F: Checking if verification code for offer is not yet verified...");

    data_model.checkContactVerificationCode(req.params.domain_name, req.params.verification_code, function(result){
      if (result.state == "success" && result.info.length > 0){
        next();
      }
      else {
        console.log("F: Invalid verification code for offer!");
        res.redirect("/listing/" + req.params.domain_name);
      }
    });
  },

  //check verification code and render the verification page
  checkListingPurchaseVerificationCode : function(req, res, next){
    listing_model.checkListingPurchaseVerificationCode(req.params.domain_name, req.params.verification_code, function(result){
      if (result.state == "success" && result.info.length > 0){
        next();
      }
      else {
        res.redirect("/listing/" + req.params.domain_name);
      }
    });
  },

  //render the transfer ownership verifcation page
  renderVerificationPage : function(req, res, next){
    getListingOffererContactInfoByCode(req.params.domain_name, req.params.verification_code, function(offer_result){
      res.render("listings/transfer_verify.ejs", {
        listing_info: req.session.listing_info,
        offer_info: offer_result,
        compare: false
      });
    });
  },

  //verify that ownership transferred
  verifyTransferOwnership : function(req, res, next){
    res.send({
      state: "success"
    });
  },

  //</editor-fold>

}

//<editor-fold>-------------------------------HELPERS-------------------------------

//helper function to get a user's ip
function getIP(req){
  if (process.env.NODE_ENV == "dev"){
    return null;
  }
  else {
    //nginx https proxy removes IP
    if (req.headers["x-real-ip"]){
      return req.headers["x-real-ip"];
    }
    else {
      return req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
    }
  }
}

//helper function to get the email address of the listing owner to contact
function getListingOwnerContactInfo(domain_name, cb){
  listing_model.getListingOwnerContactInfo(domain_name, function(result){
    if (result.state == "success" && result.info.length > 0){
      cb(result.info[0]);
    }
    else {
      cb(false);
    }
  });
}

//helper function to get the email address of the listing offerer to contact
function getListingOffererContactInfoByID(domain_name, offer_id, cb){
  data_model.getListingOffererContactInfoByID(domain_name, offer_id, function(result){
    if (result.state == "success" && result.info.length > 0){
      cb(result.info[0]);
    }
    else {
      cb(false);
    }
  });
}

//helper function to get the email address of the listing offerer to contact
function getListingOffererContactInfoByCode(domain_name, verification_code, cb){
  data_model.getListingOffererContactInfoByCode(domain_name, verification_code, function(result){
    if (result.state == "success" && result.info.length > 0){
      cb(result.info[0]);
    }
    else {
      cb(false);
    }
  });
}

//recursive helper function to make sure verification code for contact is unique
function newListingContactHistory(req, res, next, contact_details){
  data_model.newListingContactHistory(req.session.listing_info.domain_name, contact_details, function(result){
    //recursion check here
    if (result.state == "error" && result.errcode == "ER_DUP_ENTRY"){
      contact_details.verification_code = randomstring.generate(10);
      newListingContactHistory(req, res, next, contact_details)
    }
    else if (result.state == "success"){
      req.session.contact_verification_code = contact_details.verification_code;
      next();
    }
    else {
      error.handler(req, res, "Something went wrong! Please refresh the page and try again.", "json");
    }
  });
}

//helper function to get the req.user listings object for a specific domain
function getUserListingObj(listings, domain_name){
  for (var x = 0; x < listings.length; x++){
    if (listings[x].domain_name.toLowerCase() == domain_name.toLowerCase()){
      return listings[x];
    }
  }
}

//return white or black text based on luminance
function calculateLuminance(rgb) {
  var hexValue = rgb.replace(/[^0-9A-Fa-f]/, '');
  var r,g,b;
  if (hexValue.length === 3) {
    hexValue = hexValue[0] + hexValue[0] + hexValue[1] + hexValue[1] + hexValue[2] + hexValue[2];
  }
  if (hexValue.length !== 6) {
    return 0;
  }
  r = parseInt(hexValue.substring(0,2), 16) / 255;
  g = parseInt(hexValue.substring(2,4), 16) / 255;
  b = parseInt(hexValue.substring(4,6), 16) / 255;

  // calculate the overall luminance of the color
  var luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

  if (luminance > 0.8) {
    return "#222";
  }
  else {
    return "#fff";
  }
}

//</editor-fold>