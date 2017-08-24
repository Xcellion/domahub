var Categories = require("../../lib/categories.js");
var Fonts = require("../../lib/fonts.js");
var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()
var urlencodedParser = bodyParser.urlencoded({ extended: false })

var Q = require('q');
var whois = require("whois");
var parser = require('parse-whois');
var dns = require("dns");

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

          //redirect if not going to mylistings aka logging in for first time
          if (req.method == "GET" && req.path.indexOf("mylistings") == -1){
            //no listings, redirect to listings create
            if (req.user.listings.length == 0){
              res.redirect("/listings/create");
            }
            //has listings, redirect to mylistings
            else {
              res.redirect("/profile/mylistings");
            }
          }
          else {
            next();
          }
        }
      });
    }
    else {
      next();
    }
  },

  //gets all listings search history for a user
  getAccountListingsSearch : function(req, res, next){
    Account.getAccountListingsSearch(req.user.id, function(result){
      if (result.state=="error"){
        req.user.listings_search = false;
        next();
      }
      else {
        var temp_listings = [];
        var temp_obj = {};

        //format the results
        for (var x = 0; x < result.info.length; x++){
          if (!temp_obj || temp_obj.domain_name != result.info[x].domain_name){
            temp_obj = {
              domain_name : result.info[x].domain_name,
              count : [result.info[x].count],
              months_away : [result.info[x].months_away]
            }
            temp_listings.push(temp_obj);
          }
          else {
            temp_obj.months_away.push(result.info[x].months_away);
            temp_obj.count.push(result.info[x].count);
          }
        }

        req.user.listings_search = temp_listings;
        next();
      }
    });
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
        dns.lookup(listing_obj.domain_name, function(err, address, family){
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
              }))
            }
            break;
          }
        }
      }
    }
    if (to_verify_promises.length > 0){
      console.log("F: Checking domain name IP addresses...");

      dns.lookup("domahub.com", function (err, address, family) {
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

  renderDashboard : function(req, res){
    res.render("profile/profile_dashboard", {
      message: Auth.messageReset(req),
      user: req.user,
      rentals: req.user.rentals || false,
      listings_search: req.user.listings_search || false
    });
  },

  renderInbox: function(req, res){
    res.render("profile/profile_inbox", {
      message: Auth.messageReset(req),
      user: req.user,
      convo_list: req.user.convo_list || false
    });
  },

  renderMyListings: function(req, res){
    res.render("profile/profile_mylistings", {
      message: Auth.messageReset(req),
      user: req.user,
      listings: req.user.listings || false,
      categories: Categories.all(),
      fonts: Fonts.all()
    });
  },

  renderMyRentals : function(req, res){
    res.render("profile/profile_myrentals", {
      message: Auth.messageReset(req),
      user: req.user,
      rentals: req.user.rentals || false
    });
  },

  renderSettings: function(req, res){
    res.render("profile/profile_settings", {
      message: Auth.messageReset(req),
      user: req.user
    });
  },

  //function to redirect to appropriate profile page
  redirectProfile : function(req, res, next){
    path = req.path;
    // if (path.includes("dashboard")){
    //   res.redirect("/profile/dashboard");
    // }
    // else if (path.includes("inbox")){
    //   res.redirect("/profile/messages");
    // }
    if (path.includes("mylistings")){
      res.redirect("/profile/mylistings");
    }
    else if (path.includes("myrentals")){
      res.redirect("/profile/myrentals");
    }
    else {
      res.redirect("/profile/settings");
    }
  }

  //</editor-fold>

}

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
