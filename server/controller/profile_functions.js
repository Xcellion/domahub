//<editor-fold>-------------------------------DOMA LIB FUNCTIONS-------------------------------

var account_model = require('../models/account_model.js');
var listing_model = require('../models/listing_model.js');
var data_model = require('../models/data_model.js');

var stripe = require('./stripe_functions.js');
var passport = require('../lib/passport.js').passport;

var Categories = require("../lib/categories.js");
var Fonts = require("../lib/fonts.js");
var error = require('../lib/error.js');

//</editor-fold>

//<editor-fold>-------------------------------VARIABLES-------------------------------

var Q = require('q');
var bcrypt = require("bcrypt-nodejs");
var whois = require("whois");
var parser = require('parse-whois');
var dns = require("dns");
var validator = require("validator");

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

    //custom promise creation, get ip address of domain
    var q_function = function(listing_obj){
      return Q.Promise(function(resolve, reject, notify){
        dns.resolve(listing_obj.domain_name, "A", function(err, address, family){
          if (err) {reject(err)}
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

    if (req.body.ids){
      for (var x = 0; x < req.body.ids.length; x++){
        for (var y = 0; y < req.user.listings.length; y++){
          //user object has the same listing id as the listing being verified
          if (req.user.listings[y].id == req.body.ids[x]){
            if (req.user.listings[y].verified != 1){
              //add to list of promises
              to_verify_promises.push(q_function({
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
      });
    }
    else {
      res.send({state: "error"});
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
        res.send({state: "error"});
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
        res.send({state: "error"});
      }
    });
  },

  //get DNS settings for multiple domains
  getDNSRecordsMulti : function(req, res, next){
    console.log("F: Finding the existing DNS records for the posted domains...");

    var dns_record_promises = [];

    //custom promise creation
    var q_function = function(listing_obj){
      return Q.Promise(function(resolve, reject, notify){
        // console.log("Now looking up " + listing_obj.domain_name);
        whois.lookup(listing_obj.domain_name, function(err, data){
          var whoisObj = {};
          if (data){
            var array = parser.parseWhoIsData(data);
            for (var x = 0; x < array.length; x++){
              whoisObj[array[x].attribute.trim()] = array[x].value;
            }
          }
          listing_obj.whois = whoisObj;

          //look up any existing DNS A Records
          dns.resolve(listing_obj.domain_name, "A", function(err, addresses){
            listing_obj.a_records = addresses || false;
            // console.log("Finished looking up " + listing_obj.domain_name);
            resolve(listing_obj);
          });
        });
      });
    }

    if (req.body.selected_listings){
      for (var x = 0; x < req.body.selected_listings.length; x++){
        for (var y = 0; y < req.user.listings.length; y++){
          //user object has the same listing id as the listing being verified
          if (req.user.listings[y].domain_name.toLowerCase() == req.body.selected_listings[x].domain_name.toLowerCase()
          && req.user.listings[y].id == req.body.selected_listings[x].id){
            if (req.user.listings[y].verified != 1){
              //add to list of promises
              dns_record_promises.push(q_function({
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
          var temp_listing_obj = getListingByID(req.user.listings, results[x].value.id);
          temp_listing_obj.whois = results[x].value.whois;
          temp_listing_obj.a_records = results[x].value.a_records;
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
      error.handler(req, res, "Invalid promo code!", "json");
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
                error.handler(req, res, "Invalid promo code!", "json");
              }
              else {
                //check if current user has an existing promo code referral (if not, create a coupon)
                account_model.checkExistingReferral(req.user.id, referer_id, function(result){
                  req.user.new_referer_id = referer_id;
                  if (result.state == "success" && result.info.length > 0){
                    error.handler(req, res, "Invalid promo code!", "json");
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
              error.handler(req, res, "Invalid promo code!", "json");
            }
          });

        }

        //already premium, no referrals allowed
        else {
          error.handler(req, res, "Invalid promo code!", "json");
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

//</editor-fold>
