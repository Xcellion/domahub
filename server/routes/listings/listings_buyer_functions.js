//<editor-fold>-------------------------------NODE REQUIREMENTS-------------------------------

var node_env = process.env.NODE_ENV || 'dev';   //dev or prod bool

var PNF = require('google-libphonenumber').PhoneNumberFormat;
var phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
var randomstring = require("randomstring");
var validator = require("validator");

var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');
var mailOptions = {
  auth: {
    api_key: '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'
  }
}
var mailer = nodemailer.createTransport(sgTransport(mailOptions));

var ejs = require('ejs');
var path = require("path");

var wNumb = require("wnumb");
var moneyFormat = wNumb({
  thousand: ',',
  prefix: '$',
  decimals: 0
});

//</editor-fold>

module.exports = {

  //<editor-fold>-------------------------------------OFFER FOR PURCHASE-------------------------------

  //function to check buy-now contact details
  checkContactInfo : function(req, res, next){
    console.log("F: Checking posted contact details for offer...");

    if (!req.body.contact_name){
      error.handler(req, res, "Please enter your name!", "json");
    }
    else if (!validator.isEmail(req.body.contact_email)){
      error.handler(req, res, "Please enter a valid email address!", "json");
    }
    else if (!req.body.contact_phone || !phoneUtil.isValidNumber(phoneUtil.parse(req.body.contact_phone), PNF.INTERNATIONAL)){
      error.handler(req, res, "Please enter a valid phone number!", "json");
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
      verification_code : randomstring.generate(10),
      name : req.body.contact_name,
      email : req.body.contact_email,
      phone : phoneUtil.format(phoneUtil.parse(req.body.contact_phone), PNF.INTERNATIONAL),
      offer : req.body.contact_offer,
      message : req.body.contact_message,
      bin : false
    }

    //recursive function to make sure verification code is unique
    newListingContactHistory(req, res, next, contact_details);
  },

  //send the verification email
  sendContactVerificationEmail : function(req, res, next){
    console.log("F: Sending email to offerer to verify email...");

    var email_contents_path = path.resolve(process.cwd(), 'server', 'views', 'email', 'offer_verify_email.ejs');

    //figure out luminance based on primary color
    getListingInfoLuminance(req.session.listing_info);

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
    var email_from = (req.session.listing_info.premium) ? "'" + req.session.listing_info.username + "'<" + req.session.listing_info.owner_email + ">" : '"DomaHub" <general@domahub.com>'

    //email options
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
    emailSomeone(req, res, email_contents_path, EJSVariables, emailDetails, "Something went wrong! Please refresh the page and try again.");
  },

  //okay! verify the contact history entry
  verifyContactHistory : function(req, res, next){
    console.log("F: Verifying offer email...");

    Data.verifyContactHistory(req.params.verification_code, req.params.domain_name, function(result){
      //asynchronously alert the owner!
      //get the listing owner contact information to email
      getListingOwnerContactInfo(req.params.domain_name, function(owner_result){
        getListingOffererContactInfoByCode(req.params.domain_name, req.params.verification_code, function(offerer_result){
          console.log("F: Emailing owner about new verified offer...");
          var email_contents_path = path.resolve(process.cwd(), 'server', 'views', 'email', 'offer_notify_owner.ejs');
          var offer_formatted = moneyFormat.to(parseFloat(offerer_result.offer))
          var EJSVariables = {
            domain_name: req.params.domain_name,
            owner_name: owner_result.username,
            offerer_name: offerer_result.name,
            offerer_email: offerer_result.email,
            offerer_phone: phoneUtil.format(phoneUtil.parse(offerer_result.phone), PNF.INTERNATIONAL),
            verification_code: req.params.verification_code,
            offer: offer_formatted,
            message: offerer_result.message
          }

          var emailDetails = {
            to: owner_result.email,
            from: '"DomaHub Domains" <general@domahub.com>',
            subject: 'You have a new ' + offer_formatted + ' offer for ' + req.params.domain_name + "!"
          };

          //email the owner
          emailSomeone(req, res, email_contents_path, EJSVariables, emailDetails, false);
        });
      });

      //render the redirect page to notify offerer that offer was successfully sent
      res.render("redirect", {
        redirect: "/listing/" + req.params.domain_name,
        message: "Your offer has been verified! \n Please wait for the owner to accept or reject your offer.",
        button: "Back to " + req.params.domain_name,
        auto_redirect: false,
        listing_info: req.session.listing_info
      });
    });
  },

  //function to render the accept or reject an offer page
  renderAcceptOrRejectOffer: function(req, res, next){
    console.log("Rendering accept or reject offer page...");

    var accepted = req.path.indexOf("/accept") != -1;

    Listing.getVerifiedListing(req.params.domain_name, function(listing_result){
      Data.getListingOffererContactInfoByID(req.params.domain_name, req.params.offer_id, function(offer_result){
        if (offer_result.state == "success" && offer_result.info[0] && !offer_result.info[0].accepted){
          res.render("listings/accept_or_reject.ejs", {
            accepted : accepted,
            offer_info : offer_result.info[0],
            listing_info : listing_result.info[0]
          });
        }
        else {
          res.redirect('/listing/' + req.params.domain_name);
        }
      });
    });

  },

  //function to check if already accepted an offer for a listing
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

  //function to accept or reject an offer
  acceptOrRejectOffer : function(req, res, next){
    console.log("F: Accepting or rejecting an offer...");
    var accepted = req.path.indexOf("/accept") != -1;
    var contact_item = {
      accepted : accepted,
      response : req.body.response || ""
    }

    //update the DB on accepted or rejected
    Data.acceptRejectOffer(contact_item, req.params.domain_name, req.params.offer_id, function(offer_result){
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
    console.log("F: Sending email to offerer to notify of accept/reject status...");

    getListingOffererContactInfoByID(req.params.domain_name, req.params.offer_id, function(offerer_result){
      var email_contents_path = path.resolve(process.cwd(), 'server', 'views', 'email', 'offer_notify_buyer.ejs');
      var listing_info = getUserListingObj(req.user.listings, req.params.domain_name);

      var accepted_text = (offerer_result.accepted) ? "accepted" : "rejected";
      var offer_formatted = moneyFormat.to(parseFloat(offerer_result.offer));
      var EJSVariables = {
        accepted: offerer_result.accepted,
        domain_name: req.params.domain_name,
        offerer_name: offerer_result.name,
        offerer_email: offerer_result.email,
        offerer_phone: phoneUtil.format(phoneUtil.parse(offerer_result.phone), PNF.INTERNATIONAL),
        offer: offer_formatted,
        message: offerer_result.message,
        response: offerer_result.response,
        premium: (req.user.stripe_subscription_id) ? true : false,
        listing_info: (listing_info) ? listing_info : false
      }

      //premium email from listing owner or from domahub
      var email_from = (req.user.stripe_subscription_id) ? "'" + req.user.username + "'<" + req.user.email + ">" : '"DomaHub" <general@domahub.com>'
      var emailDetails = {
        to: offerer_result.email,
        from: email_from,
        subject: 'Your ' + offer_formatted + ' offer for ' + req.params.domain_name + " was " + accepted_text + "!"
      };

      //email the offerer
      emailSomeone(req, res, email_contents_path, EJSVariables, emailDetails, false);
    });
  },

  //</editor-fold>

  //<editor-fold>-------------------------------------BUYING A LISTING CHECKOUT-------------------------------------

  redirectToCheckout : function(req, res, next){
    req.session.new_buying_info = {
      domain_name : req.params.domain_name,
      offerer_name : req.body.contact_name,
      offerer_email : req.body.contact_email,
      offerer_phone : phoneUtil.format(phoneUtil.parse(req.body.contact_phone), PNF.INTERNATIONAL),
      offer : req.body.contact_offer,
      message : req.body.contact_message
    };

    res.send({
      state: "success"
    });
  },

  //renders the checkout page for creating a new rental
  renderCheckout : function(req, res, next){
    if (req.session.new_buying_info && req.session.new_buying_info.domain_name == req.params.domain_name){
      console.log("F: Rendering listing checkout page...");

      res.render("listings/listing_checkout_buy.ejs", {
        user: req.user,
        message: Auth.messageReset(req),
        listing_info: req.session.listing_info,
        new_buying_info: req.session.new_buying_info,
        node_env : node_env || "dev"
      });
    }
    else {
      console.log("F: Not checking out! Redirecting to listings page...");

      res.redirect("/listing/" + req.params.domain_name);
    }
  },

  //</editor-fold>

  //<editor-fold>-------------------------------------BUY A LISTING-------------------------------------

  //create a record for this purchase
  createBuyContactRecord : function(req, res, next){
    console.log("F: Creating a new contact buy record...");

    req.session.new_buying_info.verification_code = randomstring.generate(10);

    var contact_details = {
      listing_id : req.session.listing_info.id,
      timestamp : new Date().getTime(),
      name : req.session.new_buying_info.offerer_name,
      email : req.session.new_buying_info.offerer_email,
      phone : req.session.new_buying_info.offerer_phone,
      message : req.session.new_buying_info.message,
      verification_code : req.session.new_buying_info.verification_code,
      bin : true
    }

    Data.newListingContactHistory(req.session.listing_info.domain_name, contact_details, function(result){
      if (result.state == "success"){
        next();
      }
      else {
        error.handler(req, res, "Something went wrong! Please refresh the page and try again.", "json");
      }
    });
  },

  //alert the owner that a new BIN came through
  alertOwnerBIN : function(req, res, next){
    console.log("F: Alerting the owner of a new BIN purchase!");

    //get the listing owner contact information to email
    var email_contents_path = path.resolve(process.cwd(), 'server', 'views', 'email', 'bin_notify_owner.ejs');
    var price_formatted = moneyFormat.to(parseFloat(req.session.listing_info.buy_price));
    var EJSVariables = {
      domain_name: req.session.listing_info.domain_name,
      owner_name: req.session.listing_info.username,
      buy_price: price_formatted,

      offerer_name: req.session.new_buying_info.offerer_name || "Somebody",
      offerer_email: req.session.new_buying_info.offerer_email || "Undisclosed",
      offerer_phone: req.session.new_buying_info.offerer_phone || "Undisclosed",
      message: req.session.new_buying_info.message || "No message."
    }
    var emailDetails = {
      to: req.session.listing_info.owner_email,
      from: '"DomaHub Domains" <general@domahub.com>',
      subject: 'Somebody just purchased ' + req.params.domain_name + " for " + price_formatted + "!"
    };

    //email the owner
    emailSomeone(req, res, email_contents_path, EJSVariables, emailDetails, false);

    next();
  },

  //alert the buyer of next steps
  alertBuyerNextSteps : function(req, res, next){
    console.log("F: Alerting the buyer of next steps!");

    //get the listing owner contact information to email
    var email_contents_path = path.resolve(process.cwd(), 'server', 'views', 'email', 'bin_notify_buyer.ejs');

    var price_formatted = moneyFormat.to(parseFloat(req.session.listing_info.buy_price));
    var EJSVariables = {
      domain_name: req.session.listing_info.domain_name,
      owner_name: req.session.listing_info.username,
      owner_email: req.session.listing_info.owner_email,
      buy_price: price_formatted,

      offerer_name: req.session.new_buying_info.offerer_name || "Somebody",
      offerer_email: req.session.new_buying_info.offerer_email || "Undisclosed",
      offerer_phone: req.session.new_buying_info.offerer_phone || "Undisclosed",
      message: req.session.new_buying_info.message || "No message.",

      verification_code : req.session.new_buying_info.verification_code,
    }
    var emailDetails = {
      to: req.session.new_buying_info.offerer_email,
      cc: "",
      from: '"DomaHub Domains" <general@domahub.com>',
      subject: 'Congratulations on your recent purchase of ' + req.params.domain_name + " for " + price_formatted + "!"
    };

    //email the owner
    emailSomeone(req, res, email_contents_path, EJSVariables, emailDetails, false);

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

    Data.checkContactVerified(req.params.domain_name, req.params.offer_id, function(result){
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

    Data.checkContactVerificationCode(req.params.domain_name, req.params.verification_code, function(result){
      if (result.state == "success" && result.info.length > 0){
        next();
      }
      else {
        res.redirect("/listing/" + req.params.domain_name);
      }
    });
  },

  //function to check verification code and render the verification page
  checkListingPurchaseVerificationCode : function(req, res, next){
    Listing.checkListingPurchaseVerificationCode(req.params.domain_name, req.params.verification_code, function(result){
      if (result.state == "success" && result.info.length > 0){
        next();
      }
      else {
        res.redirect("/listing/" + req.params.domain_name);
      }
    });
  },

  //function to render the transfer ownership verifcation page
  renderVerificationPage : function(req, res, next){
    res.render("listings/transfer_verify.ejs", {
      domain_name : req.params.domain_name,
      verification_code: req.params.verification_code
    });
  },

  //function to verify that ownership transferred
  verifyTransferOwnership : function(req, res, next){
    res.send({
      state: "success"
    });
  },

  //</editor-fold>

}

//<editor-fold>-------------------------------HELPERS-------------------------------

//helper function to get the email address of the listing owner to contact
function getListingOwnerContactInfo(domain_name, cb){
  Listing.getListingOwnerContactInfo(domain_name, function(result){
    if (result.state == "success" && result.info.length > 0){
      cb(result.info[0]);
    }
  });
}

//helper function to get the email address of the listing offerer to contact
function getListingOffererContactInfoByID(domain_name, verification_code, cb){
  Data.getListingOffererContactInfoByID(domain_name, verification_code, function(result){
    if (result.state == "success" && result.info.length > 0){
      cb(result.info[0]);
    }
  });
}

//helper function to get the email address of the listing offerer to contact
function getListingOffererContactInfoByCode(domain_name, verification_code, cb){
  Data.getListingOffererContactInfoByCode(domain_name, verification_code, function(result){
    if (result.state == "success" && result.info.length > 0){
      cb(result.info[0]);
    }
  });
}

//recursive helper function to make sure verification code for contact is unique
function newListingContactHistory(req, res, next, contact_details){
  Data.newListingContactHistory(req.session.listing_info.domain_name, contact_details, function(result){
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

//helper function to email someone
function emailSomeone(req, res, pathEJSTemplate, EJSVariables, emailDetails, errorMsg){
  console.log("F: Sending email!");

  //read the file and add appropriate variables
  ejs.renderFile(pathEJSTemplate, EJSVariables, null, function(err, html_str){
    if (err){
      console.log(err);
    }

    if (err && errorMsg){
      error.handler(req, res, errorMsg, "json");
    }
    else {
      emailDetails.html = html_str;

      //send email
      mailer.sendMail(emailDetails, function(err) {
        if (err){
          console.log(err);
        }

        if (errorMsg){
          if (err) {
            console.log(err);
            error.handler(req, res, errorMsg, "json");
          }
          else {
            res.send({
              state: "success"
            });
          }
        }
      });
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

//get the luminance based on listing info primary color (for email)
function getListingInfoLuminance(listing_info){
  listing_info.font_luminance = calculateLuminance(listing_info.primary_color);
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
