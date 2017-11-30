//<editor-fold>-------------------------------DOMA LIB FUNCTIONS-------------------------------

var account_model = require('../models/account_model.js');
var listing_model = require('../models/listing_model.js');
var data_model = require('../models/data_model.js');

var stripe = require('./stripe_functions.js');
var passport = require('../lib/passport.js').passport;

var Categories = require("../lib/categories.js");
var Fonts = require("../lib/fonts.js");
var error = require('../lib/error.js');
var encryptor = require('../lib/encryptor.js');

//</editor-fold>

//<editor-fold>-------------------------------VARIABLES-------------------------------

var Q = require('q');
var bcrypt = require("bcrypt-nodejs");
var whois = require("whois");
var parser = require('parse-whois');
var dns = require("dns");
var validator = require("validator");
var request = require("request");

//registrar info
var namecheap_url = (process.env.NODE_ENV == "dev") ? "https://api.sandbox.namecheap.com/xml.response" : "https://api.namecheap.com/xml.response";
var parseString = require('xml2js').parseString;

//</editor-fold>

module.exports = {

  //<editor-fold>-------------------------------------GET ACCOUNT INFO-------------------------------

  //gets all listings for a user
  getAccountListings : function(req, res, next){

    //moving to profile view, remove any existing listing session info
    delete req.session.listing_info;

    //if we dont already have the list of listings
    if (!req.user.listings){
      account_model.getAccountListings(req.user.id, function(result){

        if (result.state=="error"){error.handler(req, res, result.info);}
        else {
          req.user.listings = result.info;
          next();
        }
      });
    }
    else {
      next();
    }
  },

  //gets all registrars for a user
  getAccountRegistrars : function(req, res, next){

    //if we dont already have the list of registrars
    if (!req.user.registrars){
      account_model.getAccountRegistrars(req.user.id, function(result){
        if (result.state=="error"){error.handler(req, res, result.info);}
        else {
          updateUserRegistrar(req.user, result.info);
          next();
        }
      });
    }
    else {
      next();
    }
  },

  //</editor-fold>

  //<editor-fold>-------------------------------------MULTI-------------------------------

  //check that the requesting user owns the domain to be deleted
  checkPostedDeletionRows : function(req, res, next){
    console.log("F: Checking posted IDs for deletion...");
    var to_delete_formatted = [];
    var listing_or_rental = (req.path.indexOf("mylistings") != -1) ? req.user.listings : req.user.rentals;
    var listing_or_rental_id = (req.path.indexOf("mylistings") != -1) ? "id" : "rental_id";

    if (req.body.ids){
      for (var x = 0; x < req.body.ids.length; x++){
        for (var y = 0; y < listing_or_rental.length; y++){

          //check if user owns the listing / rental
          if (listing_or_rental[y][listing_or_rental_id] == req.body.ids[x]){
            //only if not currently rented or a rental
            if ((listing_or_rental_id == "id" && !listing_or_rental[y].rented) || listing_or_rental_id == "rental_id"){
              to_delete_formatted.push([listing_or_rental[y][listing_or_rental_id]]);
              break;
            }
          }
        }
      }
    }
    if (to_delete_formatted.length > 0){
      req.session.deletion_object = to_delete_formatted;
      next();
    }
    else {
      res.send({
        state: "error",
        message: "Nothing was deleted!"
      });
    }
  },

  //check that the requesting user owns the domain to be verified
  checkPostedVerificationRows : function(req, res, next){
    console.log("F: Checking posted IDs for verification...");
    var to_verify_formatted = [];
    var to_verify_promises = [];
    var unverified_listings = [];
    var verified_listings = [];

    //create the array of promises to lookup the IPs for all posted domains
    if (req.body.ids){
      for (var x = 0; x < req.body.ids.length; x++){
        for (var y = 0; y < req.user.listings.length; y++){
          //user object has the same listing id as the listing being verified
          if (req.user.listings[y].id == req.body.ids[x]){
            if (req.user.listings[y].verified != 1){
              to_verify_promises.push(getDomainIPPromise({
                domain_name : req.user.listings[y].domain_name,
                listing_id : req.user.listings[y].id
              }));
            }
            break;
          }
        }
      }
    }
    if (to_verify_promises.length > 0){
      console.log("F: Checking domain name IP addresses...");
      dns.resolve("domahub.com", "A", function (err, address, family) {
        if (err){
          error.log(err, "Failed to check DomaHub IP address.");
          res.send({
            state: "error",
            unverified_listings : req.body.ids
          });
        }
        else {
          var doma_ip = address[0];

          //wait for all promises to finish
          Q.allSettled(to_verify_promises)
          .then(function(results) {
            for (var x = 0; x < results.length; x++){
              if (results[x].state == "fulfilled"){
                if (doma_ip && results[x].value.address && doma_ip == results[x].value.address[0] && results[x].value.address.length == 1){
                  to_verify_formatted.push([results[x].value.listing_id, 1, 1]);
                  verified_listings.push(results[x].value.listing_id);
                }
                else {
                  unverified_listings.push(results[x].value.listing_id);
                }
              }
            }

            if (to_verify_formatted.length > 0){
              req.session.verification_object = {
                to_verify_formatted : to_verify_formatted,
                unverified_listings : unverified_listings,
                verified_listings : verified_listings
              }
              next();
            }
            else {
              res.send({
                state: "error",
                unverified_listings : unverified_listings
              });
            }
          });
        }
      });
    }
    else {
      error.handler(req, res, "Something went wrong in verifying your domains. Please refresh the page and try again!", "json");
    }
  },

  //multi-delete listings
  deleteListings : function(req, res, next){
    console.log("F: Deactivating listings...");
    listing_model.deleteListings(req.session.deletion_object, function(result){
      if (result.state == "success"){
        updateUserListingsObjectDelete(req.user.listings, req.session.deletion_object);
        delete req.session.deletion_object;
        res.send({
          state: "success",
          rows: req.user.listings
        });
      }
      else {
        error.handler(req, res, "Failed to delete listings! Please refresh the page and try again.", "json");
      }
    });
  },

  //multi-verify listings
  verifyListings : function(req, res, next){
    console.log("F: Updating verified listings...");
    listing_model.verifyListings(req.session.verification_object.to_verify_formatted, function(result){
      if (result.state == "success"){
        updateUserListingsObjectVerify(req.user.listings, req.session.verification_object.to_verify_formatted);
        var unverified_listings =  req.session.verification_object.unverified_listings;
        var verified_listings =  req.session.verification_object.verified_listings;
        delete req.session.verification_object;
        res.send({
          state: "success",
          listings: req.user.listings,
          unverified_listings: unverified_listings,
          verified_listings: verified_listings
        });
      }
      else {
        error.handler(req, res, "Failed to verify listings! Please check your DNS details and try again.", "json");
      }
    });
  },

  //get DNS settings for multiple domains
  getDNSRecordsMulti : function(req, res, next){
    console.log("F: Finding the existing DNS records for the posted domains...");

    var dns_record_promises = [];
    if (req.body.selected_listings){
      for (var x = 0; x < req.body.selected_listings.length; x++){
        for (var y = 0; y < req.user.listings.length; y++){
          //user object has the same listing id as the listing being verified
          if (req.user.listings[y].domain_name.toLowerCase() == req.body.selected_listings[x].domain_name.toLowerCase()
          && req.user.listings[y].id == req.body.selected_listings[x].id){
            if (req.user.listings[y].verified != 1){
              //add to list of promises
              dns_record_promises.push(getDomainDNSPromise({
                domain_name : req.user.listings[y].domain_name,
                id : req.user.listings[y].id
              }));
            }
            break;
          }
        }
      }
    }

    if (dns_record_promises.length == 0){
      error.handler(req, res, "Something went wrong with the domains you have selected! Please refresh the page and try again!", "json");
    }
    else {
      //wait for all promises to finish
      Q.allSettled(dns_record_promises)
      .then(function(results) {
        console.log("F: Finished looking up DNS records! Now parsing for info...");

        //update req.user.listings
        for (var x = 0; x < results.length; x++){
          if (results.state == "fulfilled"){
            var temp_listing_obj = getListingByID(req.user.listings, results[x].value.id);
            temp_listing_obj.whois = results[x].value.whois;
            temp_listing_obj.a_records = results[x].value.a_records;
          }
          else {
            var temp_listing_obj = getListingByID(req.user.listings, results[x].reason.listing_obj.id);
            temp_listing_obj.whois = false;
            temp_listing_obj.a_records = false;
          }
        }

        res.send({
          state: "success",
          listings: req.user.listings
        });
      });
    }
  },

  //gets all offers for multiple listings
  getOffersMulti : function(req, res, next){
    console.log("F: Finding the all verified offers for the posted domains...");

    var listing_ids = [];
    for (var x = 0; x < req.body.selected_listings.length; x++){
      for (var y = 0; y < req.user.listings.length; y++){
        //user object has the same listing id as the listing being verified
        if (req.user.listings[y].domain_name.toLowerCase() == req.body.selected_listings[x].domain_name.toLowerCase()
        && req.user.listings[y].id == req.body.selected_listings[x].id){
          listing_ids.push(req.body.selected_listings[x].id);
          break;
        }
      }
    }
    data_model.getOffersMulti(listing_ids, function(result){

      //update req.user.listings
      if (result.state == "success"){
        for (var x = 0 ; x < req.user.listings.length ; x++){
          req.user.listings[x].offers = [];
          for (var y = 0; y < result.info.length; y++){
            if (req.user.listings[x].id == result.info[y].listing_id){
              req.user.listings[x].offers.push(result.info[y]);
            }
          }
        }
      }

      res.send({
        state: "success",
        listings: req.user.listings
      });
    });
  },

  //</editor-fold>

  //<editor-fold>-------------------------------------UPDATE ACCOUNT-------------------------------

  //check account settings posted
  checkAccountSettings: function(req, res, next){
    console.log('F: Checking posted account settings...');

    //not a valid email
    if (req.body.new_email && !validator.isEmail(req.body.new_email)){
      error.handler(req, res, "Please provide a valid email address for your account!", "json");
    }
    //username too long
    else if (req.body.username && req.body.username.length > 70){
      error.handler(req, res, "The new username is too long!", "json");
    }
    //username too short
    else if (req.body.username && req.body.username.length < 3){
      error.handler(req, res, "The new username is too short!", "json");
    }
    //password is too long
    else if (req.body.new_password && 70 < req.body.password.length){
      error.handler(req, res, "The new password is too long!", "json");
    }
    //password is too short
    else if (req.body.new_password && req.body.password.length < 6){
      error.handler(req, res, "The new password is too short!", "json");
    }
    //check the pw
    else if (req.body.new_password){
      req.body.email = req.body.email || req.user.email;
      passport.authenticate('local-login', function(err, user, info){
        if (!user && info){
          error.handler(req, res, info.message, "json");
        }
        else {
          next();
        }
      })(req, res, next);
    }
    //paypal email
    else if (req.body.paypal_email && !validator.isEmail(req.body.paypal_email)){
      error.handler(req, res, "Please provide a valid PayPal email address!", "json");
    }
    else {
      next();
    }
  },

  //update account settings on a get
  updateAccountSettingsGet : function(req, res, next){

    //any changes from other routes (stripe upgrade)
    if (req.session.new_account_info){
      console.log('F: Updating account settings (GET)...');

      var new_account_info = {};
      for (var x in req.session.new_account_info){
        new_account_info[x] = req.session.new_account_info[x];
      }

      //remove old invalid stripe subscription ID
      //this function can be called from anonymous user (aka listing_info exists) or the account owner (aka listing_info doesnt exist)
      var owner_email = (req.session.listing_info) ? req.session.listing_info.owner_email : req.user.email;
      account_model.updateAccount(new_account_info, owner_email, function(result){
        if (result.state == "success" && !req.session.listing_info){
          for (var x in new_account_info){
            req.user[x] = new_account_info[x];
          }
        }
        delete req.session.new_account_info;
        next();
      });

    }
    else {
      next();
    }

  },

  //update account settings on a post
  updateAccountSettingsPost : function(req, res, next){
    console.log('F: Updating account settings (POST)...');

    var new_account_info = {};

    //any posted changes
    if (req.body.new_email){
      new_account_info.email = req.body.new_email.toLowerCase();
    }
    if (req.body.username){
      new_account_info.username = req.body.username.replace(/\s/g, '');
    }
    if (req.body.new_password){
      new_account_info.password = bcrypt.hashSync(req.body.new_password, null, null);
    }
    if (req.body.paypal_email){
      new_account_info.paypal_email = req.body.paypal_email.toLowerCase();
    }
    if (req.body.payoneer_email){
      new_account_info.payoneer_email = req.body.payoneer_email.toLowerCase();
    }

    //any changes from other routes (stripe upgrade)
    if (req.session.new_account_info){
      for (var x in req.session.new_account_info){
        new_account_info[x] = req.session.new_account_info[x];
      }
    }

    //update only if theres something to update
    if (!isEmptyObject(new_account_info)){
      account_model.updateAccount(new_account_info, req.user.email, function(result){
        if (result.state=="error"){
          if (result.errcode == "ER_DUP_ENTRY"){
            error.handler(req, res, "A user with that email/username already exists!", "json");
          }
          else {
            error.handler(req, res, result.info, "json");
          }
        }
        else {
          for (var x in new_account_info){
            req.user[x] = new_account_info[x];
          }
          res.json({
            state: "success",
            user: req.user
          });
        }
      });
    }
    else {
      res.json({
        state: "success",
        user: req.user
      });
    }

  },

  //</editor-fold>

  //<editor-fold>-------------------------------------UPDATE REGISTRAR-------------------------------

  //check if registrar info is properly formatted
  checkRegistrarInfo : function(req, res, next){
    console.log("F: Checking posted registrar information...");
    var valid_registrars = ["godaddy", "namecheap"];

    //not a valid registrar
    if (!req.body.registrar_name || valid_registrars.indexOf(req.body.registrar_name) == -1){
      error.handler(req, res, "You have selected an invalid registrar! Please select from the given choices.", "json");
    }
    else {
      switch (req.body.registrar_name){
        case "godaddy":
          if (!req.body.api_key){
            error.handler(req, res, "That's an invalid production API key! Please input a valid GoDaddy production API key.", "json");
          }
          else if (!validator.isInt(req.body.username)){
            error.handler(req, res, "That's an invalid customer number! Please input a valid GoDaddy customer number.", "json");
          }
          else if (!req.body.password){
            error.handler(req, res, "That's an invalid API key secret! Please input a valid GoDaddy product API key secret.", "json");
          }
          else {
            console.log("F: Validating posted registrar information with GoDaddy...");
            request({
              url: "https://api.godaddy.com/v1/domains",
              method: "GET",
              json: true,
              headers: {
                "X-Shopper-Id" : req.body.username,
                Authorization: "sso-key " + req.body.api_key + ":" + req.body.password
              }
            }, function(err, response, body){
              if (err) {
                error.log(err, "Failed to verify GoDaddy API via request.");
                error.handler(req, res, "Something went wrong in verifying your GoDaddy account. Please refresh the page and try again.", "json");
              }
              else {
                if (body["code"] == "INVALID_SHOPPER_ID" || body["code"] == "ERROR_INTERNAL"){
                  error.handler(req, res, "That's an invalid customer number! Please input a valid GoDaddy customer number.", "json");
                }
                else if (body["code"] == "UNABLE_TO_AUTHENTICATE"){
                  error.handler(req, res, "That's an invalid production API key and secret! Please input a valid GoDaddy production API key and secret.", "json");
                }
                else if (response.statusCode != 200){
                  error.handler(req, res, "Something went wrong in verifying your GoDaddy account. Please refresh the page and try again.", "json");
                }
                else {
                  //format for database insert
                  req.session.registrar_array = [
                    [
                      req.user.id,
                      req.body.registrar_name,
                      encryptor.encryptText(req.body.api_key),
                      encryptor.encryptText(req.body.username),
                      encryptor.encryptText(req.body.password)
                    ]
                  ];
                  next();
                }
              }
            });
          }
          break;
        case "namecheap":
          if (!req.body.api_key){
            error.handler(req, res, "That's an invalid API key! Please input a valid NameCheap API key.", "json");
          }
          else if (!req.body.username){
            error.handler(req, res, "That's an invalid username! Please input a valid NameCheap username.", "json");
          }
          else {
            console.log("F: Validating posted registrar information with NameCheap...");
            request({
              url: namecheap_url,
              method: "GET",
              qs : {
                ApiKey : req.body.api_key,
                ApiUser : req.body.username,
                UserName : req.body.username,
                ClientIp : req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress,
                Command : "namecheap.domains.getList",
              }
            }, function(err, response, body){
              if (err){
                error.log(err, "Failed to verify NameCheap API via request.");
                error.handler(req, res, "Something went wrong in verifying your NameCheap account. Please refresh the page and try again.", "json");
              }
              else {
                //parse the XML response from namecheap
                parseString(body, {trim: true}, function (err, result) {
                  if (err){
                    error.log(err, "Failed to parse XML response from NameCheap.");
                    error.handler(req, res, "Something went wrong in verifying your NameCheap account. Please refresh the page and try again.", "json");
                  }
                  else {
                    if (result.ApiResponse["$"].Status == "ERROR"){
                      error.handler(req, res, "That's an invalid API key or username! Please input a valid NameCheap API key or username.", "json");
                    }
                    else {
                      //format for database insert
                      req.session.registrar_array = [
                        [
                          req.user.id,
                          req.body.registrar_name,
                          encryptor.encryptText(req.body.api_key),
                          encryptor.encryptText(req.body.username),
                          null
                        ]
                      ];
                      next();
                    }
                  }
                });
              }
            });
          }
          break;
      }
    }
  },

  //update an accounts registrar information
  updateAccountRegistrar : function(req, res, next){
    console.log("F: Creating new or updating registrar API keys...");

    account_model.newRegistrar(req.session.registrar_array, function(result){
      delete req.session.registrar_array;
      if (result.state == "error") { error.handler(req, res, result.info, "json"); }
      else {
        updateUserRegistrar(req.user, [{ registrar_name : req.body.registrar_name } ]);
        res.send({
          state: "success",
          user: req.user
        });
      }
    });
  },

  //gets and decrypts all registrar API keys
  getRegistrarAPI : function(req, res, next){
    if (!req.user.registrars || req.user.registrars.length == 0){
      error.handler(req, res, "You don't have any registrars to look up! Please click a connect button to add specific registrars.", "json");
    }
    else {
      console.log("F: Getting all connected registrar API keys...");

      //get the registrar API keys
      account_model.getAccountRegistrars(req.user.id, function(result){
        if (result.state=="error"){ error.handler(req, res, result.info); }
        else {
          req.session.registrar_info = result.info;
          next();
        }
      });
    }
  },

  //get domain names via registrar api
  getRegistrarDomains : function(req, res, next){
    if (!req.session.registrar_info){
      error.handler(req, res, "You don't have any registrars to look up! Please click a connect button to add specific registrars.", "json");
    }
    else {
      console.log("F: Retrieving domain names list via registrar API keys...");

      //loop through and get domain names for each registrar
      var registrar_domain_promises = [];
      for (var x = 0 ; x < req.session.registrar_info.length ; x++){
        switch (req.session.registrar_info[x].registrar_name){
          case "godaddy":
            registrar_domain_promises.push(getDomainsGoDaddy(req.session.registrar_info[x]));
            break;
          case "namecheap":
            registrar_domain_promises.push(getDomainsNameCheap(req.session.registrar_info[x]));
            break;
        }
      }

      //wait for all promises to finish
      Q.allSettled(registrar_domain_promises)
        .then(function(results){
          console.log("F: Finished querying all registrars for domains!");
          var total_good_domains = [];
          var total_bad_domains = [];
          for (var y = 0; y < results.length ; y++){
            var non_existent_registrar_domains = [];
            if (results[y].state == "fulfilled"){
              var registrar_domains = results[y].value.domains;

              //check if we already have it listed
              for (var t = 0 ; t < registrar_domains.length ; t++){
                var already_exists = false;
                for (var s = 0 ; s < req.user.listings.length ; s++){
                  if (registrar_domains[t].domain_name.toLowerCase() == req.user.listings[s].domain_name.toLowerCase()){
                    already_exists = true;
                    break;
                  }
                }
                if (!already_exists){
                  non_existent_registrar_domains.push(registrar_domains[t]);
                }
              }

              //add to the registrar info variable (for listing create)
              for (var z = 0 ; z < req.session.registrar_info.length ; z++){
                if (req.session.registrar_info[z].registrar_name == results[y].value.registrar_name){
                  req.session.registrar_info[z].domains = non_existent_registrar_domains;
                }
              }
              total_good_domains = total_good_domains.concat(non_existent_registrar_domains);
            }
            else {
              total_bad_domains.push({
                reason : results[y].reason
              });
            }
          }

          res.send({
            state : "success",
            bad_listings : total_bad_domains,
            good_listings : total_good_domains
          });
        });
    }
  },

  //</editor-fold>

  //<editor-fold>-------------------------------------RENDERS-------------------------------

  renderDashboard : function(req, res, next){
    console.log("F: Rendering profile dashboard...");
    res.render("profile/profile_dashboard.ejs", {
      user: req.user,
      listings: req.user.listings
    });
  },

  renderMyListings: function(req, res){
    console.log("F: Rendering profile my listings...");
    res.render("profile/profile_mylistings.ejs", {
      user: req.user,
      listings: req.user.listings,
      categories: Categories.all(),
      fonts: Fonts.all()
    });
  },

  renderSettings: function(req, res){
    console.log("F: Rendering profile settings...");
    res.render("profile/profile_settings.ejs", {
      user: req.user,
      listings: req.user.listings
    });
  },

  //redirect to appropriate profile page
  redirectProfile : function(req, res, next){
    console.log("F: Redirecting to appropriate profile page...");
    if (req.path.indexOf("mylistings") != -1){
      res.redirect("/profile/mylistings");
    }
    else if (req.path.indexOf("settings") != -1){
      res.redirect("/profile/settings");
    }
    else {
      res.redirect("/profile/dashboard");
    }
  },

  //</editor-fold>

  //<editor-fold>-------------------------------------PROMO CODE-------------------------------

  //get all referrals for a user
  getCouponsAndReferralsForUser : function(req, res, next){
    console.log("F: Getting all referrals made by user...");
    account_model.getCouponsAndReferralsForUser(req.user.id, function(result){
      if (result.state == "success"){
        req.user.referrals = result.info;
      }
      else {
        req.user.referrals = [];
      }

      res.send({
        state : "success",
        user : req.user
      });
    });
  },

  //get any existing promo code to apply to a new stripe subscription
  getExistingCoupon : function(req, res, next){
    console.log("F: Getting any existing coupons for user...");

    account_model.getExistingPromoCodeByUser(req.user.id, function(result){
      if (result.state == "success" && result.info.length > 0 && result.info[0].code){
        req.user.existing_promo_code = result.info[0].code;
        req.user.existing_referer_id = result.info[0].referer_id;
      }
      next();
    });
  },

  //check if the promo code exists in our database
  checkPromoCode : function(req, res, next){
    console.log("F: Checking coupon code validity...");

    if (!req.body.code){
      error.handler(req, res, "That's an invalid promo code!", "json");
    }
    else {

      //check if code exists and is unused
      account_model.checkPromoCodeUnused(req.body.code, function(result){
        if (result.state == "success" && result.info.length > 0){
          console.log("F: Promo code exists!");
          req.user.promo_code = req.body.code;
          next();
        }

        //promo code doesnt exist, maybe it's a username (AKA referral)? (only if not already premium)
        else if (!req.user.stripe_subscription_id){

          //get the username ID so we can create a referral code
          account_model.getAccountIDByUsername(req.body.code, function(result){
            if (result.state == "success" && result.info.length > 0){
              console.log("F: Username exists!");
              var referer_id = result.info[0].id;

              //cant refer yourself
              if (referer_id == req.user.id){
                error.handler(req, res, "That's an invalid promo code!", "json");
              }
              else {
                //check if current user has an existing promo code referral (if not, create a coupon)
                account_model.checkExistingReferral(req.user.id, referer_id, function(result){
                  req.user.new_referer_id = referer_id;
                  if (result.state == "success" && result.info.length > 0){
                    error.handler(req, res, "That's an invalid promo code!", "json");
                  }
                  else {
                    console.log("F: User doesn't have any existing referrals! Creating coupon...");

                    //create 1 promo code, with referer_id, and 1 duration_in_months
                    stripe.createPromoCode("1", referer_id, "1", function(result){
                      req.user.promo_code = result[0];
                      next();
                    });
                  }
                });
              }
            }

            //no username ID exists by that code
            else {
              error.handler(req, res, "That's an invalid promo code!", "json");
            }
          });

        }

        //already premium, no referrals allowed
        else {
          error.handler(req, res, "That's an invalid promo code!", "json");
        }
      });
    }
  },

  //check if this user has an existing promo code
  checkExistingPromoCode : function(req, res, next){
    console.log("F: Checking for any existing promo code for the user in our database...");
    account_model.getExistingPromoCodeByUser(req.user.id, function(result){

      //exists! delete it and re-create a combined coupon
      if (result.state == "success" && result.info.length > 0 && result.info[0].code){
        var existing_coupon_code = result.info[0].code || 1;
        req.user.old_promos = [existing_coupon_code, req.user.promo_code];    //old promo codes to delete via stripe
        var existing_duration_in_months = result.info[0].duration_in_months;
        var existing_referer_id = result.info[0].referer_id || req.user.new_referer_id;
        delete req.user.new_referer_id;

        //delete newly made code
        account_model.deletePromoCode(req.user.promo_code, function(result){
          if (result.state == "success"){

            //delete old existing code
            account_model.deletePromoCode(existing_coupon_code, function(result){

              //subtract any existing times redeemed from stripe
              if (req.user.stripe_used_months){
                var duration_in_months = existing_duration_in_months - req.user.stripe_used_months + 1;
                delete req.user.stripe_used_months;
              }
              else {
                var duration_in_months = existing_duration_in_months + 1;
              }

              //recreate new code with new duration_in_months
              stripe.createPromoCode("1", existing_referer_id, duration_in_months, function(result){
                req.user.promo_code = result[0];
                next();
              });

            });

          }
          else {
            error.handler(req, res, "Something went wrong with the promo code! Please refresh the page and try again!", "json");
          }
        });
      }

      //nothing exists, just go next
      else {
        next();
      }
    });
  },

  //attach this user to the promo code
  applyPromoCode : function(req, res, next){
    console.log("F: Applying promo code to user in our database...");
    //continue to stripe if existing user
    if (req.user.stripe_subscription_id){
      next();
    }
    //if not yet premium, just update our database
    else {
      account_model.updatePromoCode(req.user.promo_code, { account_id : req.user.id }, function(result){
        if (result.state == "success"){
          delete req.user.promo_code;
          res.send({
            state: "success"
          });
        }
        else {
          error.handler(req, res, "Something went wrong with the promo code! Please refresh the page and try again!", "json");
        }
      });
    }
  },

  //</editor-fold>

}

//<editor-fold>-------------------------------------VERIFICATION HELPERS (promises)-------------------------------

//promise function to look up the existing DNS records for a domain name
function getDomainDNSPromise(listing_obj){
  return Q.Promise(function(resolve, reject, notify){
    console.log("F: Now looking up DNS records for " + listing_obj.domain_name + "...");
    whois.lookup(listing_obj.domain_name, function(err, data){
      if (err){
        error.log(err, "Failed to look up DNS records.");
        reject({
          info : err,
          listing_obj : listing_obj
        });
      }
      else {
        var whoisObj = {};
        var array = parser.parseWhoIsData(data);
        for (var x = 0; x < array.length; x++){
          whoisObj[array[x].attribute.trim()] = array[x].value;
        }
        listing_obj.whois = whoisObj;

        //look up any existing DNS A Records
        dns.resolve(listing_obj.domain_name, "A", function(err, addresses){
          if (err){
            error.log(err, "Failed to look up DNS records");
            reject({
              info : err,
              listing_obj : listing_obj
            });
          }
          else {
            listing_obj.a_records = addresses || false;
            resolve(listing_obj);
          }
        });
      }
    });
  });
}

//custom promise creation, get ip address of domain
function getDomainIPPromise(listing_obj){
  return Q.Promise(function(resolve, reject, notify){
    dns.resolve(listing_obj.domain_name, "A", function(err, address, family){
      if (err) {
        error.log(err, "Failed to look up DNS records");
        reject(err);
      }
      else {
        resolve({
          domain_name : listing_obj.domain_name,
          listing_id : listing_obj.listing_id,
          address : address
        });
      }
    });
  })
}

//</editor-fold>

//<editor-fold>-------------------------------------REGISTRAR HELPERS (promises)-------------------------------

//get godaddy list of domains
function getDomainsGoDaddy(registrar_info){
  //custom promise creation, get list of domains from registrar
  return Q.Promise(function(resolve, reject, notify){
    console.log("F: Getting list of GoDaddy domains...");
    request({
      url: "https://api.godaddy.com/v1/domains",
      method: "GET",
      json : true,
      headers: {
        "X-Shopper-Id" : encryptor.decryptText(registrar_info.username),
        Authorization : "sso-key " + encryptor.decryptText(registrar_info.api_key) + ":" + encryptor.decryptText(registrar_info.password)
      }
    }, function(err, response, body){
      if (err){
        error.log(err, "Failed to verify GoDaddy account via request.");
        reject("Something went wrong in verifying your GoDaddy account.");
      }
      else if (body["code"] == "INVALID_SHOPPER_ID" || body["code"] == "ERROR_INTERNAL"){
        reject("Invalid customer number.");
      }
      else if (body["code"] == "UNABLE_TO_AUTHENTICATE"){
        reject("Invalid production API key or secret.");
      }
      else if (response.statusCode != 200){
        reject("Something went wrong in verifying your GoDaddy account.");
      }
      //domain list exists! check them
      else {
        var good_domains = [];
        for (var x = 0 ; x < body.length ; x++){
          if (body[x].status == "ACTIVE"){
            good_domains.push({
              domain_name : body[x].domain
            });
          }
        }
        resolve({
          domains : good_domains,
          registrar_name : registrar_info.registrar_name
        });
      }
    });
  });
}

//get namecheap list of domains
function getDomainsNameCheap(registrar_info){

}

//</editor-fold>

//<editor-fold>-------------------------------------HELPERS-------------------------------

//helper function to update req.user.listings after deleting
function updateUserListingsObjectDelete(user_listings, to_delete_formatted){
  for (var x = user_listings.length - 1; x >= 0; x--){
    for (var y = 0; y < to_delete_formatted.length; y++){
      if (user_listings[x].id == to_delete_formatted[y][0]){
        user_listings.splice(x, 1);
        break;
      }
    }
  }
}

//helper function to update req.user.listings after verifying
function updateUserListingsObjectVerify(user_listings, to_verify_formatted){
  for (var x = user_listings.length - 1; x >= 0; x--){
    for (var y = 0; y < to_verify_formatted.length; y++){
      if (user_listings[x].id == to_verify_formatted[y][0]){
        user_listings[x].verified = 1;    //set it to verified;
        user_listings[x].status = 1;      //set it to active
        break;
      }
    }
  }
}

//helper function to get listing by ID
function getListingByID(listings, id){
  for (var x = 0 ; x < listings.length ; x++){
    if (listings[x].id == id){
      return listings[x];
    }
  }
}

//helper to check for empty object
function isEmptyObject(obj) {
  return !Object.keys(obj).length;
}

//update the user object with registrar details
function updateUserRegistrar(user, registrars){
  if (!user.registrars){
    user.registrars = [];
  }
  for (var x = 0 ; x < registrars.length ; x++){
    user.registrars.push({
      id : registrars[x].id,
      name : registrars[x].registrar_name
    });
  }
}

//</editor-fold>
