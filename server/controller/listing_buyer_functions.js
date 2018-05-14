//<editor-fold>-------------------------------DOMA LIB FUNCTIONS-------------------------------

var listing_model = require('../models/listing_model.js');
var data_model = require('../models/data_model.js');

var error = require('../lib/error.js');
var mailer = require('../lib/mailer.js');
var Currencies = require('../lib/currencies.js');

//</editor-fold>

//<editor-fold>-------------------------------VARIABLES-------------------------------

var PNF = require('google-libphonenumber').PhoneNumberFormat;
var phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
var randomstring = require("randomstring");
var validator = require("validator");

var ejs = require('ejs');
var path = require("path");
var moment = require('moment');

//</editor-fold>

module.exports = {

  //<editor-fold>-------------------------------------OFFER FOR PURCHASE-------------------------------

  //check buy-now contact details
  checkContactInfo : function(req, res, next){
    console.log("LBF: Checking posted contact details for offer...");

    //trying to BIN but it's not enabled for BIN
    if (req.path.indexOf("/buy") != -1 && (!req.session.listing_info.buy_price || req.session.listing_info.buy_price <= 0)){
      error.handler(req, res, "This domain is unavailable for buy it now! Please enter an offer and the owner will get back to you.", "json");
    }
    //no name
    else if (!req.body.contact_name){
      error.handler(req, res, "Please enter your name!", "json");
    }
    //invalid email
    else if (!validator.isEmail(req.body.contact_email)){
      error.handler(req, res, "Please enter a valid email address!", "json");
    }
    //invalid phone number
    else if (!req.body.contact_phone || !phoneUtil.isValidNumber(phoneUtil.parse(req.body.contact_phone), PNF.INTERNATIONAL)){
      error.handler(req, res, "Please enter a real phone number! Did you select the correct country for your phone number?", "json");
    }
    //if offer price is too low
    else if (req.body.contact_offer && !validator.isInt(req.body.contact_offer, { min: (req.session.listing_info.min_price / Currencies.multiplier(req.session.listing_info.default_currency )) })){
      error.handler(req, res, "This is an invalid offer price! Please enter an amount greater than " + Currencies.format(parseFloat(req.session.listing_info.min_price), req.session.listing_info.default_currency) + ".", "json");
    }
    else {
      next();
    }
  },

  //record the contact message (with verification code)
  createOfferContactRecord : function(req, res, next){
    console.log("LBF: Creating a new contact offer record...");

    var contact_details = {
      listing_id : req.session.listing_info.id,
      timestamp : new Date().getTime(),
      user_ip : getIP(req),
      verification_code : randomstring.generate(10),
      name : req.body.contact_name,
      email : req.body.contact_email,
      phone : phoneUtil.format(phoneUtil.parse(req.body.contact_phone), PNF.INTERNATIONAL),
      offer : req.body.contact_offer * Currencies.multiplier(req.session.listing_info.default_currency),
      offer_currency : req.session.listing_info.default_currency,
      message : req.body.contact_message
    }

    //recursive function to make sure verification code is unique
    newListingContactHistory(req, res, next, contact_details);
  },

  //send the verification email
  sendContactVerificationEmail : function(req, res, next){
    console.log("LBF: Sending email to offerer to verify email...");

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
      offer: Currencies.format(parseFloat(req.body.contact_offer) * Currencies.multiplier(req.session.listing_info.default_currency), req.session.listing_info.default_currency),
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
    console.log("LBF: Verifying offer email...");

    data_model.verifyContactHistory(req.params.verification_code, req.params.domain_name, function(result){

      //asynchronously alert the owner!
      //get the listing owner contact information to email
      getListingOwnerContactInfo(req.params.domain_name, function(owner_result){
        if (owner_result){
          getListingOffererContactInfoByCode(req.params.domain_name, req.params.verification_code, function(offer_result){
            if (offer_result){
              console.log("LBF: Emailing owner about new verified offer...");
              var offer_formatted = Currencies.format(parseFloat(offer_result.offer), offer_result.default_currency);

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
                  html: "There was a new offer for - " + req.params.domain_name + "<br />From - " + offer_result.name + "<br />Email - " + offer_result.email + "<br />Message - " + offer_result.message + "<br />Offer - " + offer_formatted
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
    console.log("LBF: Checking if listing has an existing accepted offer...");
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
    console.log("LBF: Accepting or rejecting an offer...");
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
        listings: req.user.listings
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
          console.log("LBF: Sending email to the buyer for transfer verification / next steps!");
          var pathEJSTemplate = path.resolve(process.cwd(), 'server', 'views', 'email', 'bin_notify_buyer.ejs');
          var price_formatted = Currencies.format(parseFloat(offer_result.offer), offer_result.default_currency);
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
          console.log("LBF: Sending email to offerer to notify of accept/reject status...");
          var pathEJSTemplate = path.resolve(process.cwd(), 'server', 'views', 'email', 'offer_notify_buyer.ejs');
          var listing_info = getUserListingObj(req.user.listings, req.params.domain_name);

          //figure out luminance based on primary color
          listing_info.font_luminance = calculateLuminance(listing_info.primary_color);

          var accepted_text = (offer_result.accepted) ? "accepted" : "rejected";
          var offer_formatted = Currencies.format(parseFloat(offer_result.offer), offer_result.default_currency);
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
      offer : req.session.listing_info.buy_price,
      default_currency : req.session.listing_info.default_currency,
      message : req.body.contact_message
    };

    res.send({
      state: "success"
    });
  },

  //check the posted offer to see if it was accepted
  checkOfferAccepted : function(req, res, next){
    console.log("LBF: Checking if offer has been accepted by the owner...");

    data_model.checkOfferAccepted(req.params.domain_name, req.params.offer_id, function(result){
      if (result.state == "success" && result.info.length > 0){
        next();
      }
      else {
        console.log("LBF: This offer hasn't been accepted!");
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
      console.log("LBF: Rendering listing checkout page for purchasing...");

      res.render("listings/listing_checkout_buy.ejs", {
        user: req.user,
        listing_info: req.session.listing_info,
        new_buying_info: req.session.new_buying_info,
        node_env : process.env.NODE_ENV,
        compare: false
      });
    }
    else {
      console.log("LBF: Not checking out! Redirecting to listings page...");
      res.redirect("/listing/" + domain_name.toLowerCase());
    }
  },

  //make sure that new_buying_info domain is correct as params
  checkBuyerObjectInfo : function(req, res, next){
    console.log("LRF: Checking if session listing info domain is same as buying domain...");
    var domain_name = (typeof req.session.pipe_to_dh != "undefined" && typeof req.params.domain_name == "undefined") ? req.session.pipe_to_dh : req.params.domain_name;

    if (req.session.listing_info && req.session.new_buying_info.domain_name.toLowerCase() == domain_name.toLowerCase()){
      next();
    }
    else {
      error.handler(req, res, "Something went wrong with the purchase! Please refresh the page and try again!", 'json');
    }
  },

  //</editor-fold>

  //<editor-fold>-------------------------------------BUY A LISTING-------------------------------------

  //create a record for this purchase
  createBuyContactRecord : function(req, res, next){

    var contact_details = {
      deposited : true
    };

    //payment ID
    if (req.session.new_buying_info.purchase_transaction_id){
      contact_details.transaction_id = req.session.new_buying_info.purchase_transaction_id;
    }

    //payment type
    if (req.session.new_buying_info.purchase_payment_type){
      contact_details.payment_type = req.session.new_buying_info.purchase_payment_type;
      contact_details.doma_fees = req.session.new_buying_info.purchase_doma_fees;
      contact_details.payment_fees = req.session.new_buying_info.purchase_payment_fees;
    }

    //if depositing money after accepting offer
    if (req.session.new_buying_info.id){
      console.log("LBF: Updating contact record with deposited...");

      //update the deadline to two weeks from now
      contact_details.deadline = moment().add(2, "week")._d.getTime()

      data_model.depositedOffer(contact_details, req.session.listing_info.domain_name, req.session.new_buying_info.id, function(result){
        if (result.state == "success"){
          next();
        }
        else {
          error.handler(req, res, "Something went wrong! Please refresh the page and try again.", "json");
        }
      });
    }
    //if BIN
    else {
      console.log("LBF: Creating a new contact BIN record...");

      //create a verification code so we can contact the buyer for next steps
      req.session.new_buying_info.verification_code = randomstring.generate(10);

      //new contact offer details
      contact_details.listing_id = req.session.listing_info.id;
      contact_details.timestamp = new Date().getTime();
      contact_details.user_ip = getIP(req);
      contact_details.name = req.session.new_buying_info.name;
      contact_details.email = req.session.new_buying_info.email;
      contact_details.phone = req.session.new_buying_info.phone;
      contact_details.message = req.session.new_buying_info.message;
      contact_details.offer = req.session.listing_info.buy_price;
      contact_details.verification_code = req.session.new_buying_info.verification_code;
      contact_details.verified = true;
      contact_details.accepted = true;
      contact_details.bin = true;

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
    console.log("LBF: Alerting the owner of a new BIN purchase!");

    //get the listing owner contact information to email
    var pathEJSTemplate = path.resolve(process.cwd(), 'server', 'views', 'email', 'bin_notify_owner.ejs');
    var price_formatted = Currencies.format(parseFloat((req.session.new_buying_info.id) ? req.session.new_buying_info.offer : req.session.listing_info.buy_price), req.session.listing_info.default_currency);
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
    console.log("LBF: Sending email to the buyer for transfer verification / next steps!");

    //get the listing owner contact information to email
    var pathEJSTemplate = path.resolve(process.cwd(), 'server', 'views', 'email', 'bin_notify_buyer.ejs');
    var price_formatted = Currencies.format(parseFloat((req.session.new_buying_info.id) ? req.session.new_buying_info.offer : req.session.listing_info.buy_price), req.session.listing_info.default_currency);

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
    var email_from = (req.session.listing_info.premium) ? "'" + req.session.listing_info.owner_username + "'<" + req.session.listing_info.owner_email + ">" : '"DomaHub" <general@domahub.com>'
    var emailDetails = {
      to: req.session.new_buying_info.email,
      from: email_from,
      subject: 'Congratulations on your recent purchase of ' + req.params.domain_name + " for " + price_formatted + "!"
    };

    //email the buyer of next steps
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

  //check the payment method of BIN
  checkPaymentType : function(req, res, next){
    console.log("LRF: Checking BIN payment type...");

    //if paying after offer accepted
    if (req.session.new_buying_info && req.session.new_buying_info.accepted == 1){
      next();
    }
    //not set for BIN
    else if (req.session.listing_info.buy_price <= 0 || !req.session.listing_info.buy_price){
      error.handler(req, res, "This domain is unavailable for buy it now! Please go back to the main page and create an offer for the owner.", "json");
    }
    //paying by stripe
    else if (req.body.payment_type == "stripe" && req.body.stripeToken){
      next();
    }
    //paying by paypal
    else if (req.body.payment_type == "paypal" && req.body.paymentID && req.body.payerID){
      next();
    }
    else {
      error.handler(req, res, "Something went wrong with your payment! Please refresh the page and try again.", "json");
    }
  },

  //check if the payment method of BIN was successful
  checkPaymentSuccessful : function(req, res, next){
    console.log("LRF: Checking BIN payment type...");

    //transaction ID was created in previous steps (either via stripe or paypal)
    if (req.session.new_buying_info.purchase_transaction_id){
      next();
    }
    else {
      error.handler(req, res, "Something went wrong with your payment! Please refresh the page and try again.", "json");
    }
  },

  //</editor-fold>

  //<editor-fold>-------------------------------------VERIFICATION OF TRANSFER-------------------------------------

  //check the posted verification code
  checkContactVerified : function(req, res, next){
    console.log("LBF: Checking if specified offer is verified...");

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
    console.log("LBF: Checking if verification code for offer is not yet verified...");

    data_model.checkContactVerificationCode(req.params.domain_name, req.params.verification_code, function(result){
      if (result.state == "success" && result.info.length > 0){
        next();
      }
      else {
        console.log("LBF: Invalid verification code for offer!");
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
