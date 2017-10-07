//<editor-fold>----------------------------------------------------------------------VARIABLES

var Categories = require("../../lib/categories.js");
var Fonts = require("../../lib/fonts.js");
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var urlencodedParser = bodyParser.urlencoded({ extended: false });

var Q = require('q');
var bcrypt = require("bcrypt-nodejs");
var whois = require("whois");
var parser = require('parse-whois');
var dns = require("dns");
var stripe = require('../../lib/stripe.js');

//</editor-fold>

module.exports = {

  //<editor-fold>----------------------------------------------------------------------GET ACCOUNT INFO

  //gets all listings for a user
  getAccountListings : function(req, res, next){

    //moving to profile view, remove any existing listing session info
    delete req.session.listing_info;

    //if we dont already have the list of listings
    if (!req.user.listings){
      Account.getAccountListings(req.user.id, function(result){

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

  //gets all rentals for a user
  getAccountRentals : function(req, res, next){

    //if we dont already have the list of rentals or if we need to refresh them
    if (!req.user.rentals){
      account_id = req.user.id;

      Account.getAccountRentals(account_id, function(result){
        if (result.state=="error"){error.handler(req, res, result.info);}
        else {
          //combine any adjacent rental times
          var all_rentals = joinRentalTimes(result.info);
          req.user.rentals = createRentalProp(all_rentals);
          next();
        }
      });
    }
    else {
      next();
    }
  },

  //gets all chats for a user
  getAccountChats: function(req, res, next){
    //if we dont already have the list of chats or if we need to refresh them
    if (!req.user.convo_list){
      account_id = req.user.id;

      Account.getAccountChats(account_id, function(result){
        if (result.state=="error"){error.handler(req, res, result.info);}
        else {
          req.user.convo_list = result.info;
          next();
        }
      });
    }
    else {
      next();
    }
  },

  //</editor-fold>

  //<editor-fold>----------------------------------------------------------------------MULTI

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
        var doma_ip = address;

        //wait for all promises to finish
        Q.allSettled(to_verify_promises)
         .then(function(results) {
           for (var x = 0; x < results.length; x++){
             if (results[x].state == "fulfilled"){
               if (results[x].value.address == doma_ip){
                 //format the db query
                 var mark_active_if_stripe = (req.user.stripe_info && req.user.stripe_info.charges_enabled) ? 1 : 0;
                 to_verify_formatted.push([results[x].value.listing_id, 1, mark_active_if_stripe]);
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

  // //multi-delete rentals
  // deleteRentals : function(req, res, next){
  //   console.log("F: Deleting rentals...");
  //   Listing.deleteRentals(req.session.deletion_object, function(result){
  //     if (result.state == "success"){
  //       updateUserRentalsObject(req.user.rentals, req.session.deletion_object);
  //       delete req.session.deletion_object;
  //       res.send({
  //         state: "success",
  //         rows: req.user.rentals
  //       });
  //     }
  //     else {
  //       res.send({state: "error"});
  //     }
  //   });
  // },

  //multi-delete listings
  deleteListings : function(req, res, next){
    console.log("F: Deactivating listings...");
    Listing.deleteListings(req.session.deletion_object, function(result){
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
    Listing.verifyListings(req.session.verification_object.to_verify_formatted, function(result){
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

  //</editor-fold>

  //<editor-fold>----------------------------------------------------------------------UPDATE ACCOUNT

  //function to update account settings on a get
  updateAccountSettingsGet : function(req, res, next){

    //any changes from other routes (stripe upgrade)
    if (req.session.new_account_info){
      console.log('F: Updating account settings...');

      var new_account_info = {};
      for (var x in req.session.new_account_info){
        new_account_info[x] = req.session.new_account_info[x];
      }

      //remove old invalid stripe subscription ID
      //this function can be called from anonymous user (aka listing_info exists) or the account owner (aka listing_info doesnt exist)
      var owner_email = (req.session.listing_info) ? req.session.listing_info.owner_email : req.user.email;
      Account.updateAccount(new_account_info, owner_email, function(result){
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

  //function to update account settings on a post
  updateAccountSettingsPost : function(req, res, next){
    console.log('F: Updating account settings...');

    var new_account_info = {};

    //any posted changes
    if (req.body.new_email){
      new_account_info.email = req.body.new_email;
    }
    if (req.body.username){
      new_account_info.username = req.body.username;
    }
    if (req.body.new_password){
      new_account_info.password = bcrypt.hashSync(req.body.new_password, null, null);
    }
    if (req.body.paypal_email){
      new_account_info.paypal_email = req.body.paypal_email;
    }

    //any changes from other routes (stripe upgrade)
    if (req.session.new_account_info){
      for (var x in req.session.new_account_info){
        new_account_info[x] = req.session.new_account_info[x];
      }
    }

    //update only if theres something to update
    if (!isEmptyObject(new_account_info)){
      Account.updateAccount(new_account_info, req.user.email, function(result){
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

  //function to update for managed stripe
  updateAccountStripe : function(req, res, next){
    console.log('F: Updating account Stripe settings...');

    Account.updateAccount({
      stripe_account : req.session.stripe_results.id,
      stripe_secret : req.session.stripe_results.keys.secret,
      stripe_public : req.session.stripe_results.keys.publishable,
      type: 2
    }, req.user.email, function(result){
      if (result.state=="error"){
        error.handler(req, res, result.info, "json");
      }
      else {
        req.user.stripe_account = req.session.stripe_results.id;
        delete req.session.stripe_results;
        res.json({
          state: "success",
          user: req.user
        });
      }
    });
  },

  //</editor-fold>

  //<editor-fold>----------------------------------------------------------------------RENDERS

  renderDashboard : function(req, res, next){
    res.render("profile/profile_dashboard.ejs", {
      message: Auth.messageReset(req),
      user: req.user,
      listings: req.user.listings,
      listings_search: req.user.listings_search
    });
  },

  renderMyListings: function(req, res){
    res.render("profile/profile_mylistings.ejs", {
      message: Auth.messageReset(req),
      user: req.user,
      listings: req.user.listings || false,
      categories: Categories.all(),
      fonts: Fonts.all()
    });
  },

  renderSettings: function(req, res){
    res.render("profile/profile_settings.ejs", {
      message: Auth.messageReset(req),
      user: req.user
    });
  },

  //function to redirect to appropriate profile page
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

  //<editor-fold>----------------------------------------------------------------------PROMO CODE

  //get any existing promo code to apply to a new stripe subscription
  getExistingCoupon : function(req, res, next){
    Account.getExistingPromoCodeByUser(req.user.id, function(result){
      if (result.state == "success" && result.info.length > 0 && result.info[0].code){
        req.user.existing_promo_code = result.info[0].code;
        req.user.existing_referer_id = result.info[0].referer_id;
      }
      next();
    });
  },

  //check if the promo code exists in our database
  checkPromoCode : function(req, res, next){
    if (!req.body.code){
      error.handler(req, res, "Invalid promo code!", "json");
    }
    else {

      //check if code exists and is unused
      Account.checkPromoCodeUnused(req.body.code, function(result){
        if (result.state == "success" && result.info.length > 0){
          console.log("F: Promo code exists!");
          req.user.promo_code = req.body.code;
          next();
        }

        //promo code doesnt exist, maybe it's a username (AKA referral)? (only if not already premium)
        else if (!req.user.stripe_subscription_id){

          //get the username ID so we can create a referral code
          Account.getAccountIDByUsername(req.body.code, function(result){
            if (result.state == "success" && result.info.length > 0){
              console.log("F: Username exists!");
              var referer_id = result.info[0].id;

              //cant refer yourself
              if (referer_id == req.user.id){
                error.handler(req, res, "Invalid promo code!", "json");
              }
              else {
                //check if current user has an existing promo code referral (if not, create a coupon)
                Account.checkExistingReferral(req.user.id, referer_id, function(result){
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
    Account.getExistingPromoCodeByUser(req.user.id, function(result){

      //exists! delete it and re-create a combined coupon
      if (result.state == "success" && result.info.length > 0 && result.info[0].code){
        var existing_coupon_code = result.info[0].code || 1;
        req.user.old_promos = [existing_coupon_code, req.user.promo_code];    //old promo codes to delete via stripe
        var existing_duration_in_months = result.info[0].duration_in_months;
        var existing_referer_id = result.info[0].referer_id || req.user.new_referer_id;
        delete req.user.new_referer_id;

        //delete newly made code
        Account.deletePromoCode(req.user.promo_code, function(result){
          if (result.state == "success"){

            //delete old existing code
            Account.deletePromoCode(existing_coupon_code, function(result){

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
      Account.updatePromoCode(req.user.promo_code, { account_id : req.user.id }, function(result){
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

//<editor-fold>----------------------------------------------------------------------HELPERS

//function to join all rental times
function joinRentalTimes(rental_times){
  var temp_times = rental_times.slice(0);

    //loop once
    for (var x = temp_times.length - 1; x >= 0; x--){
        var orig_start = temp_times[x].date;
        var orig_end = orig_start + temp_times[x].duration;

        //loop twice to check with all others
        for (var y = temp_times.length - 1; y >= 0; y--){
            var compare_start = temp_times[y].date;
            var compare_end = compare_start + temp_times[y].duration;

            //touches bottom
            if (x != y && orig_start == compare_end && temp_times[x].rental_id == temp_times[y].rental_id){
        temp_times[y].duration = temp_times[y].duration + temp_times[x].duration;
                temp_times.splice(x, 1);
            }
        }
    }

  return temp_times;
}

//function to create rental properties inside listing info
function createRentalProp(all_rentals){
  //iterate once across all results
  for (var x = 0; x < all_rentals.length; x++){
    var temp_dates = [];
    var temp_durations = [];

    //iterate again to look for multiple dates and durations
    for (var y = 0; y < all_rentals.length; y++){
      if (!all_rentals[y].checked && all_rentals[x]["rental_id"] == all_rentals[y]["rental_id"]){
        temp_dates.push(all_rentals[y].date);
        temp_durations.push(all_rentals[y].duration);
        all_rentals[y].checked = true;
      }
    }

    //combine dates into a property
    all_rentals[x].date = temp_dates;
    all_rentals[x].duration = temp_durations;
  }

  //remove empty date entries
  all_rentals = all_rentals.filter(function(value, index, array){
    return value.date.length;
  });

  return all_rentals;
}

//helper function to update req.user.rentals after deleting
function updateUserRentalsObject(user_rentals, to_delete_formatted){
  for (var x = user_rentals.length - 1; x >= 0; x--){
    for (var y = 0; y < to_delete_formatted.length; y++){
      if (user_rentals[x].rental_id == to_delete_formatted[y][0]){
        user_rentals.splice(x, 1);
        break;
      }
    }
  }
}

//helper function to update req.user.rentals after deleting
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

//helper function to update req.user.rentals after deleting
function updateUserListingsObjectVerify(user_listings, to_verify_formatted){
  for (var x = user_listings.length - 1; x >= 0; x--){
    for (var y = 0; y < to_verify_formatted.length; y++){
      if (user_listings[x].id == to_verify_formatted[y][0]){
        user_listings[x].verified = 1;    //set it to verified;
        user_listings[x].status = to_verify_formatted[y][2];    //if user is good with stripe, then set it to active
        break;
      }
    }
  }
}

//helper to check for empty object
function isEmptyObject(obj) {
  return !Object.keys(obj).length;
}

//</editor-fold>
