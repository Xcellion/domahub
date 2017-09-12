//<editor-fold>-------------------------------VARIABLES-------------------------------

var account_model = require('../models/account_model.js');
var listing_model = require('../models/listing_model.js');

var Q = require('q');
var qs = require('qs');
var request = require('request');

var node_env = process.env.NODE_ENV || 'dev';   //dev or prod bool
var stripe_key = (node_env == "dev") ? "sk_test_PHd0TEZT5ytlF0qCNvmgAThp" : "sk_live_Nqq1WW2x9JmScHxNbnFlORoh";
var stripe = require("stripe")(stripe_key);
var validator = require("validator");

var wNumb = require("wnumb");
var moneyFormat = wNumb({
  thousand: ',',
  prefix: '$',
  decimals: 2
});

var database, error;

//</editor-fold>

module.exports = {

  //constructor
  init: function(db, e){
    database = db;
    error = e;

    Account = new account_model(db);
    Listing = new listing_model(db);
  },

  //<editor-fold>-------------------------------STRIPE MANAGED-------------------------------

  //gets the stripe managed account info
  getAccountInfo : function(req, res, next){
    if (req.user.stripe_account && !req.user.stripe_info){
      console.log('SF: Retrieving existing Stripe managed account information...');
      stripe.accounts.retrieve(req.user.stripe_account, function(err, account) {
        if (!err){
          updateUserStripeInfo(req.user, account);
          if (node_env == "dev"){
            req.user.dev_stripe_info = account;
          }

          if (req.user.stripe_customer_id){
            console.log('SF: Retrieving existing Stripe customer information...');

            stripe.customers.retrieve(req.user.stripe_customer_id, function(err, customer) {
              if (!err){
                updateUserStripeInfo(req.user, customer);
                next();
              }
              else {
                console.log(err.message);
                next();
              }
            });
          }
          else {
            next();
          }
        }
        else {
          console.log(err.message);
          next();
        }
      });
    }
    else {
      next();
    }
  },

  //function to get all charges made to account
  getTransfers : function(req, res, next){
    if (req.user.stripe_account){
      console.log('SF: Retrieving all Stripe transactions...');
      stripe.charges.list({
        transfer_group: req.user.id,
        expand: ["data.balance_transaction"]    //when the balance is available for transfer / withrdrawal
      }, function(err, charges) {
        if (err) { console.log(err.message); }
        if (node_env == "dev"){
          req.user.dev_charges = charges;
        }
        updateUserStripeCharges(req.user, charges.data);

        // for test data on pagination
        // req.user.stripe_charges = [];
        // for (var x = 0; x < 100; x++){
        //   req.user.stripe_charges.push({
        //     amount: Math.round(Math.random()* 100),
        //     created: new Date().getTime(),
        //     currency: "usd",
        //     amount_refunded : 0,
        //     domain_name : "fuckyoutest.com"
        //   })
        // }

        next();
      });
    }
    else {
      next();
    }
  },

  //function to transfer money to a stripe connected account
  transferMoney : function(req, res, next){
    if (req.user.type != 2 || !req.user.stripe_account || !req.user.stripe_info){
      error.handler(req, res, "No bank account to charge!", "json");
    }
    else if (!req.user.stripe_charges){
      error.handler(req, res, "Invalid charges!", "json");
    }
    else {
      var total_transfer = 0;
      var time_now = new Date().getTime();
      for (var x = 0; x < req.user.stripe_charges.length; x++){

        //only if it's a rental (and not refunded) or if it's a sale thats already transferred and if balance is available now
        if (req.user.stripe_charges[x].available_on * 1000 < time_now && (req.user.stripe_charges[x].rental_id && req.user.stripe_charges[x].amount_refunded == 0) || req.user.stripe_charges[x].pending_transfer == "false"){
          var doma_fees = (typeof req.user.stripe_charges[x].doma_fees != undefined) ? parseFloat(req.user.stripe_charges[x].doma_fees) : getDomaFees(req.user.stripe_charges[x].amount);
          var stripe_fees = (typeof req.user.stripe_charges[x].stripe_fees != undefined) ? parseFloat(req.user.stripe_charges[x].stripe_fees) : getStripeFees(req.user.stripe_charges[x].amount);
          total_transfer += req.user.stripe_charges[x].amount - doma_fees - stripe_fees;
          req.user.stripe_charges[x].transferred = true;
        }
      }

      //if it's a legit number
      if (total_transfer > 0 && Number.isInteger(total_transfer)){
        console.log("SF: Attempting to transfer " + moneyFormat.to(total_transfer/100) + "...");

        //transfer the money to their stripe account
        stripe.transfers.create({
          amount: total_transfer,
          currency: "usd",
          destination: req.user.stripe_account,
          transfer_group: "bank_transfer_" + req.user.id
        }, function(err, transfer) {
          if (!err){
            res.send({
              state : "success",
              user : req.user
            });
          }
          else {
            console.log(err);
            error.handler(req, res, "Something went wrong with the bank transfer! Please refresh the page and try again.", "json");
          }
        });
      }
      else {
        error.handler(req, res, "You have no available funds to transfer to your bank!", "json");
      }

    }
  },

  //function to get stripe managed account info
  checkManagedAccount : function(req, res, next){
    if (!req.user.stripe_account){
      error.handler(req, res, "Please first enter your payout address!", "json");
    }
    else {
      next();
    }
  },

  //function to check posted info for address
  checkPayoutAddress : function(req, res, next){
    console.log('SF: Checking posted Stripe managed account address information...');
    var country_codes = [
      "AU",    //Australia
      "US",    //United States
      "CA",    //Canada
      "AT",    //Austria
      "DK",    //Denmark
      "BE",    //Belgium
      "FI",    //Finland
      "DE",    //Germany
      "FR",    //France
      "HK",    //Hong Kong
      "IE",    //Ireland
      "IT",    //Italy
      "JP",    //Japan
      "LU",    //Luxembourg
      "NO",    //Norway
      "NL",    //Netherlands
      "SG",    //Singapore
      "NZ",    //New Zealand
      "ES",    //Spain
      "PT",    //Portugal
      "SE",    //Sweden
      "CH",    //Switzerland
      "GB",    //United Kingdom
      "BR",    //Brazil
      "MX"    //Mexico
    ];

    if (country_codes.indexOf(req.body.country) == -1){
      error.handler(req, res, "Invalid country!", "json");
    }
    else if (!req.body.addressline1){
      error.handler(req, res, "Invalid address!", "json");
    }
    else if (!req.body.city){
      error.handler(req, res, "Invalid city!", "json");
    }
    else if (!req.body.state && req.body.country == "US"){
      error.handler(req, res, "Invalid state!", "json");
    }
    else if (!req.body.zip){
      error.handler(req, res, "Invalid postal code!", "json");
    }
    else {
      next();
    }
  },

  //function to check posted info for personal
  checkPayoutPersonal : function(req, res, next){
    console.log('SF: Checking posted Stripe managed account personal information...');

    if (!req.body.first_name){
      error.handler(req, res, "Invalid first name!", "json");
    }
    else if (!req.body.last_name){
      error.handler(req, res, "Invalid last name!", "json");
    }
    else if (!req.body.birthday_year || !validator.isInt(req.body.birthday_year, { min: 1900 })){
      error.handler(req, res, "Invalid birthday year!", "json");
    }
    else if (!req.body.birthday_month || !validator.isInt(req.body.birthday_month, { min: 1, max: 12 })){
      error.handler(req, res, "Invalid birthday month!", "json");
    }
    else if (!req.body.birthday_day || !validator.isInt(req.body.birthday_day, { min: 1, max: 31 })){
      error.handler(req, res, "Invalid birthday date!", "json");
    }
    else {
      next();
    }
  },

  //function to check posted info for bank info
  checkPayoutBank : function(req, res, next){
    console.log('SF: Checking posted Stripe managed account bank information...');

    if (!req.body.stripe_token){
      error.handler(req, res, "Invalid bank information!", "json");
    }
    else {
      next();
    }
  },

  //function to create a new managed account with stripe
  createManagedAccount : function(req, res, next){
    if (req.user.stripe_account && req.user.stripe_info.country == req.body.country){
      console.log('SF: Updating existing Stripe managed account address...');
      stripe.accounts.update(req.user.stripe_account, {
        "legal_entity": {
          "address": {
            "city": req.body.city,
            "country": req.body.country,
            "line1": req.body.addressline1,
            "line2": req.body.addressline2,
            "postal_code": req.body.zip,
            "state": req.body.state
          }
        },
        "transfer_schedule": {
          "interval": "manual"
        }
      }, function(err, result){
        if (result){
          updateUserStripeInfo(req.user, result);
          res.json({
            state: "success",
            user: req.user
          });
        }
        else {
          console.log(err.message);
          error.handler(req, res, "Failed to update your account!", "json");
        }
      });
    }
    else {
      console.log('SF: Creating a new Stripe managed account...');
      stripe.accounts.create({
        country: req.body.country,
        email: req.user.email,
        legal_entity: {
          "address": {
            "city": req.body.city,
            "country": req.body.country,
            "line1": req.body.addressline1,
            "line2": req.body.addressline2,
            "postal_code": req.body.zip,
            "state": req.body.state
          },
        },
        "transfer_schedule": {
          "interval": "manual"
        },
        managed: true
      }, function(err, result){
        if (result){
          req.session.stripe_results = result;
          updateUserStripeInfo(req.user, result);
          next();
        }
        else {
          console.log(err.message);
          error.handler(req, res, err.message, "json");
        }
      });
    }
  },

  //function to update managed account personal info
  updateStripePersonal : function(req, res, next){
    console.log('SF: Updating existing Stripe managed account personal information...');
    stripe.accounts.update(req.user.stripe_account, {
      legal_entity: {
        "first_name": req.body.first_name,
        "last_name": req.body.last_name,
        "dob" : {
          "day" : req.body.birthday_day,
          "month" : req.body.birthday_month,
          "year" : req.body.birthday_year
        }
      }
    }, function(err, result){
      if (result){
        updateUserStripeInfo(req.user, result);
        res.json({
          state: "success",
          user: req.user
        });
      }
      else {
        console.log(err.message);
        error.handler(req, res, "Failed to update your account!", "json");
      }
    });
  },

  //function to update managed account bank info
  updateStripeBank : function(req, res, next){
    console.log('SF: Updating existing Stripe managed account bank information...');

    stripe.accounts.update(req.user.stripe_account, {
      external_account: req.body.stripe_token,
      legal_entity: {
        "type" : req.body.account_type
      },
      "tos_acceptance" : {
        date: Math.floor(Date.now() / 1000),
        ip: req.connection.remoteAddress
      }
    }, function(err, result){
      if (result){
        updateUserStripeInfo(req.user, result);
        res.json({
          state: "success",
          user: req.user
        });
      }
      else {
        console.log(err.message);
        error.handler(req, res, "Failed to update your account!", "json");
      }
    });
  },

  //</editor-fold>

  //<editor-fold>-------------------------------STRIPE CHARGES (payments for rental + bin)-------------------------------

  //function to pay for a rental via stripe
  chargeMoneyRent : function(req, res, next){

    if (req.session.new_rental_info.price != 0){
      if (req.body.stripeToken){
        var total_price = Math.round(req.session.new_rental_info.price * 100);    //USD in cents

        //doma fee if the account owner is basic (aka premium hasn't expired)
        var doma_fees = (req.session.listing_info.premium) ? 0 : getDomaFees(total_price);
        var stripe_fees = getStripeFees(total_price);

        var stripeOptions = {
          amount: total_price,
          currency: "usd",
          source: req.body.stripeToken,
          description: "Rental for " + req.params.domain_name,
          transfer_group : req.session.listing_info.owner_id,
          metadata: {
            "domain_name" : req.params.domain_name,
            "renter_name" : (req.user) ? req.user.username : "Guest",
            "rental_id" : req.session.new_rental_info.rental_id,
            "doma_fees" : doma_fees,
            "stripe_fees" : stripe_fees
          }
        }

        //something went wrong with the price
        if (isNaN(total_price) || isNaN(total_price) || isNaN(total_price)){
          error.handler(req, res, "Invalid price!", 'json');
        }
        else {
          console.log("SF: Charging money via Stripe...");

          //charge the end user, transfer to the owner, take doma fees if its a basic listing
          stripe.charges.create(stripeOptions, function(err, charge) {
            if (err) {
              console.log(err.message);
              error.handler(req, res, "Invalid price!", "json");
            }
            else {
              console.log("Payment processed! Customer paid " + moneyFormat.to((total_price - stripe_fees - doma_fees)/100) + " with " +  moneyFormat.to(doma_fees/100) + " in Doma fees and " + moneyFormat.to(stripe_fees/100) + " in Stripe fees.");
              next();
            }
          });
        }

      }

      //if stripetoken doesnt exist
      else {
        stripeErrorHandler(req, res, {message: "Invalid Stripe token! Please log out and try again."});
      }
    }
    else {
      next();
    }
  },

  //function to pay for a listing via stripe
  chargeMoneyBuy : function(req, res, next){
    if (!req.body.stripeToken){
      stripeErrorHandler(req, res, {message: "Something went wrong with your payment! Please refresh the page and try again."});
    }
    else {

      //BIN or buying acter accepting an offer
      var price_of_listing = (req.session.new_buying_info.id) ? req.session.new_buying_info.offer : req.session.listing_info.buy_price;
      var total_price = Math.round(price_of_listing * 100);    //USD in cents

      //doma fee if the account owner is basic (aka premium hasn't expired)
      var doma_fees = (req.session.listing_info.premium) ? 0 : getDomaFees(total_price);
      var stripe_fees = getStripeFees(total_price);

      //something went wrong with the price
      if (isNaN(total_price)){
        error.handler(req, res, "Something went wrong with the payment! Please refresh the page and try again.", 'json');
      }
      else {
        console.log("SF: Charging money via Stripe...");

        var stripeOptions = {
          amount: total_price,
          currency: "usd",
          source: req.body.stripeToken,
          description: "Purchasing " + req.params.domain_name,
          transfer_group : req.session.listing_info.owner_id,
          metadata: {
            "domain_name" : req.params.domain_name,
            "owner_id" : req.session.listing_info.owner_id,
            "listing_id" : req.session.listing_info.id,
            "offer_id" : req.session.new_buying_info.offer_id,
            "buyer_name" : req.session.new_buying_info.name,
            "buyer_email" : req.session.new_buying_info.email,
            "buyer_phone" : req.session.new_buying_info.phone,
            "doma_fees" : doma_fees,
            "stripe_fees" : stripe_fees,
            "pending_transfer" : true
          }
        }

        //charge the end user, transfer to the owner, take doma fees if its a basic listing
        stripe.charges.create(stripeOptions, function(err, charge) {
          if (err) {
            console.log(err.message);
            error.handler(req, res, "Invalid price!", "json");
          }
          else {
            console.log("Payment processed! Received " + moneyFormat.to(total_price/100));
            next();
          }
        });
      }

    }
  },

  //function to refund a rental
  refundRental : function(req, res, next){
    if (req.body.stripe_id){
      console.log("SF: Refunding with Stripe...");
      stripe.refunds.create({
        charge: req.body.stripe_id
      }, function(err, refund) {
        if (!err){
          next();
        }
        else {
          console.log(err.message);
          stripeErrorHandler(req, res, {message: "Invalid Stripe charge!"});
        }
      });
    }
    else {
      error.handler(req, res, "There was an error in refunding this rental. Please refresh the page and try again!");
    }
  },

  //</editor-fold>

  //<editor-fold>-------------------------------STRIPE SUBSCRIPTIONS-------------------------------

  //check if stripe subscription is still valid
  checkStripeSubscription : function(req, res, next){
    var domain_name = (req.session.api_domain) ? req.session.api_domain : req.params.domain_name;
    var listing_info = (req.session.listing_info) ? req.session.listing_info : getUserListingObj(req.user.listings, domain_name);

    //if subscription id exists in our database
    if (listing_info && listing_info.stripe_subscription_id){
      console.log("SF: Checking if Stripe subscription for account is still active...");

      //check it against stripe
      stripe.subscriptions.retrieve(listing_info.stripe_subscription_id, function(err, subscription) {
        if (req.session.listing_info){
          delete req.session.listing_info.stripe_subscription_id;
        }
        if (!err && subscription && subscription.status == "active"){
          console.log("SF: Premium is still active!");
          listing_info.premium = true;
        }
        else if (node_env != "dev"){
          //delete it from our database if it's wrong
          console.log("SF: Premium is NOT active!");
          req.session.new_account_info = {
            stripe_subscription_id : null
          }
          listing_info.premium = false;
        }
        //TEST ONLY -- CHANGE AS NEEDED
        else if (node_env == "dev") {
          console.log("SF: Using live Stripe key in test mode!");
          listing_info.premium = true;
        }
        next();
      });
    }
    else {
      //only set it to basic if we havent already checked and premium is set
      if (typeof listing_info.premium == "undefined"){
        listing_info.premium = false;
      }
      next();
    }
  },

  //check if stripe subscription is still valid (for the owner)
  checkStripeSubscriptionUser : function(req, res, next){
    var domain_name = (req.session.api_domain) ? req.session.api_domain : req.params.domain_name;
    var listing_info = (req.session.listing_info) ? req.session.listing_info : getUserListingObj(req.user.listings, domain_name);

    //if subscription id exists in our database
    if (req.user.stripe_subscription_id){
      console.log("SF: Checking if Stripe subscription for account is still active...");

      //check it against stripe
      stripe.subscriptions.retrieve(req.user.stripe_subscription_id, function(err, subscription) {
        if (err || !subscription){
          //delete it from our database if it's wrong
          if (node_env != "dev"){
            console.log("SF: Premium is NOT active!");
            req.session.new_account_info = {
              stripe_subscription_id : null
            }
          }
        }
        next();
      });
    }
    else {
      next();
    }
  },

  //get stripe customer info
  getStripeCustomer : function(req, res, next){
    //if subscription id exists in our database
    if (req.user.stripe_customer_id){
      console.log("SF: Getting Stripe customer information for an account...");

      //check it against stripe
      stripe.customers.retrieve(req.user.stripe_customer_id, function(err, customer) {
        if ((customer && customer.deleted) || (err && !customer) && node_env != "dev"){
          console.log("SF: Not a real Stripe customer! Updating our database appropriately...");

          //update our DH database to remove stripe_customer_id
          req.session.new_account_info = {
            stripe_customer_id : null
          }
          next();
        }

        //using live mode subscription key in test mode
        else if (customer) {
          console.log("SF: Legit Stripe customer!");

          //customer last4 cc # for premium payments
          if (customer.sources && customer.sources.total_count > 0){
            req.user.premium_cc_brand = customer.sources.data[0].brand;
            req.user.premium_cc_last4 = customer.sources.data[0].last4;
          }
          next();
        }
        //TEST ONLY -- CHANGE AS NEEDED
        else if (node_env == "dev"){
          console.log("SF: Using live Stripe key in test mode!");
          next();
        }
      });
    }
    else {
      next();
    }
  },

  //get stripe subscription info
  getStripeSubscription : function(req, res, next){

    //if subscription id exists in our database
    if (req.user.stripe_subscription_id){
      console.log("SF: Getting Stripe subscription information for an account...");

      //check it against stripe
      stripe.subscriptions.retrieve(req.user.stripe_subscription_id, function(err, subscription) {
        if (err && !subscription && node_env != "dev"){
          console.log("SF: Not a real Stripe subscription! Updating our database appropriately...");

          //update our DH database to remove stripe_subscription_id
          req.session.new_account_info = {
            stripe_subscription_id : null
          }
          next();
        }

        //legit subscription!
        else if (subscription) {
          console.log("SF: Legit Stripe subscription!");
          req.user.premium_exp_date = subscription.current_period_end;
          req.user.premium_expiring = subscription.cancel_at_period_end;
          next();
        }

        //using live mode subscription key in test mode
        else if (node_env == "dev"){
          console.log("SF: Using live Stripe key in test mode!");
          req.user.premium_exp_date = (new Date().getTime() + 2592000000) / 1000;
          req.user.premium_expiring = false;
          next();
        }
      });
    }
    else {
      next();
    }
  },

  //check that the stripe customer is legit and has a good payment card
  createStripeCustomer : function(req, res, next){
    if (!req.body.stripeToken && !req.user.stripe_customer_id){
      error.handler(req, res, "Something went wrong with the payment! Please refresh the page and try again!", "json");
    }
    else if (req.user.stripe_customer_id){
      //cross reference with stripe
      stripe.customers.retrieve(req.user.stripe_customer_id, function(err, customer) {
        //our db is outdated, customer doesnt exist
        if (err){
          newStripeCustomer(req, res, next);
        }
        else {
          //update the customer default credit card
          if (req.body.stripeToken && typeof req.body.stripeToken == "string"){
            console.log("SF: Trying to update an existing Stripe customer default credit card...");

            stripe.customers.update(req.user.stripe_customer_id, {
              source: req.body.stripeToken
            }, function(err, customer) {
              if (err){
                stripeErrorHandler(req, res, err);
              }
              else {
                //customer last4 cc # for premium payments
                if (customer.sources && customer.sources.total_count > 0){
                  req.user.premium_cc_brand = customer.sources.data[0].brand;
                  req.user.premium_cc_last4 = customer.sources.data[0].last4;
                }
                next();
              }
            });
          }
          else {
            next();
          }
        }
      });
    }

    //no customer exists, create a new stripe customer
    else {
      newStripeCustomer(req, res, next);
    }
  },

  //function to create a monthly subscription for a listing
  createStripeSubscription : function(req, res, next){
    if (!req.body.stripeToken && !req.user.stripe_customer_id){
      error.handler(req, res, "Something went wrong with the payment! Please refresh the page and try again!", "json");
    }
    //if subscription id exists in our database
    else if (req.user.stripe_subscription_id){

      //check it against stripe
      stripe.subscriptions.retrieve(req.user.stripe_subscription_id, function(err, subscription) {

        //our db is outdated, subscription doesnt exist
        if (err){
          newStripeSubscription(req, res, next);
        }
        else {
          //subscription was cancelled, re-subscribe
          if (subscription.cancel_at_period_end){
            console.log("SF: Renewing existing Stripe subscription...");

            stripe.subscriptions.update(req.user.stripe_subscription_id, {
              plan: "premium_account"
            }, function(err, subscription) {
              if (err){stripeErrorHandler(req, res, err)}
              else {
                req.user.premium_exp_date = subscription.current_period_end;
                req.user.premium_expiring = subscription.cancel_at_period_end;
                next();
              }
            });
          }
          //subscription is still active, all gucci
          else {
            res.json({
              state: "success",
              user: req.user
            });
          }
        }
      });
    }
    else {
      newStripeSubscription(req, res, next);
    }
  },

  // //function to create multiple monthly subscriptions
  // createStripeSubscriptions : function(req, res, next){
  //   console.log("SF: Trying to create multiple Stripe subscriptions...");
  //
  //   //create the array of promises
  //   var promises = [];
  //   for (var x = 0; x < req.session.new_listings.premium_obj.inserted_ids.length; x++){
  //     var promise = stripe.subscriptions.create({
  //       customer: req.user.stripe_customer_id,
  //       plan: "premium",
  //       metadata: {
  //         insert_id : req.session.new_listings.premium_obj.inserted_ids[x],
  //         index : req.session.new_listings.premium_obj.indexes[x]
  //       }
  //     });
  //     promises.push(promise);
  //   }
  //
  //   //wait for all promises to finish
  //   Q.allSettled(promises)
  //   .then(function(results) {
  //     var premium_db_query_success = [];
  //     var premium_db_query_failed = [];
  //
  //     //figure out which promises passed
  //     for (var y = 0; y < results.length; y++){
  //       if (results[y].state == "fulfilled"){
  //         var subscription = results[y].value;
  //
  //         //create the formatted db query to update premium ID
  //         premium_db_query_success.push([
  //                                       subscription.metadata.insert_id,
  //                                       subscription.id
  //         ]);
  //
  //         //add to good listings
  //         req.session.new_listings.good_listings.push({
  //           index: subscription.metadata.index
  //         });
  //       }
  //     }
  //
  //     req.session.new_listings.premium_obj.db_success_obj = premium_db_query_success;
  //     next();
  //
  //   });
  // },

  //check that stripe subscription exists
  cancelStripeSubscription : function(req, res, next){
    //if subscription id exists in our database
    if (req.user.stripe_subscription_id){
      console.log("SF: Cancelling an existing Stripe subscription...");

      stripe.subscriptions.del(req.user.stripe_subscription_id, { at_period_end: true }, function(err, confirmation) {
        if (err){stripeErrorHandler(req, res, err)}
        else {
          req.user.premium_exp_date = confirmation.current_period_end;
          req.user.premium_expiring = confirmation.cancel_at_period_end;
          res.json({
            state: "success",
            user: req.user
          });
        }
      });
    }
    else {
      error.handler(req, res, "You don't have a Premium account to cancel!", "json")
    }
  }

  //</editor-fold>

}

//<editor-fold>-------------------------------HELPERS-------------------------------

//function to update req.user with stripe info
function updateUserStripeInfo(user, stripe_results){
  if (!user.stripe_info){
    user.stripe_info = {}
  }

  //managed stripe account details for getting paid
  if (stripe_results && stripe_results.legal_entity && stripe_results.legal_entity.address && stripe_results.legal_entity.dob){
    user.stripe_info.country = stripe_results.legal_entity.address.country || "";
    user.stripe_info.addressline1 = stripe_results.legal_entity.address.line1 || "";
    user.stripe_info.addressline2 = stripe_results.legal_entity.address.line2 || "";
    user.stripe_info.city = stripe_results.legal_entity.address.city || "";
    user.stripe_info.state = stripe_results.legal_entity.address.state || "";
    user.stripe_info.zip = stripe_results.legal_entity.address.postal_code || "";
    user.stripe_info.birthday_year = stripe_results.legal_entity.dob.year || "";
    user.stripe_info.birthday_month = stripe_results.legal_entity.dob.month || "";
    user.stripe_info.birthday_day = stripe_results.legal_entity.dob.day || "";
    user.stripe_info.first_name = stripe_results.legal_entity.first_name || "";
    user.stripe_info.last_name = stripe_results.legal_entity.last_name || "";
    user.stripe_info.account_type = stripe_results.legal_entity.type || "";
    user.stripe_info.transfers_enabled = stripe_results.transfers_enabled;
    user.stripe_info.charges_enabled = stripe_results.charges_enabled;
  }

  //bank account details
  if (stripe_results && stripe_results.external_accounts && stripe_results.external_accounts.total_count > 0){
    user.stripe_info.bank_country = stripe_results.external_accounts.data[0].country || "",
    user.stripe_info.object = stripe_results.external_accounts.data[0].object || "";
    user.stripe_info.currency = stripe_results.external_accounts.data[0].currency.toUpperCase() || "";
    user.stripe_info.bank_name = stripe_results.external_accounts.data[0].bank_name || "";
    user.stripe_info.account_holder_name = stripe_results.external_accounts.data[0].account_holder_name || "";
    user.stripe_info.account_number = stripe_results.external_accounts.data[0].last4 || "";
    user.stripe_info.account_routing = stripe_results.external_accounts.data[0].routing_number || "";
  }
}

//function to update req.user with stripe charges
function updateUserStripeCharges(user, charges){
  var temp_charges = [];
  for (var x = 0; x < charges.length; x++){
    var temp_transfer = {
      charge_id : charges[x].id,
      amount : charges[x].amount,
      created : charges[x].created,
      currency : charges[x].currency,
      amount_refunded : charges[x].amount_refunded,
      domain_name : (charges[x].metadata) ? charges[x].metadata.domain_name : "",
      stripe_fees : (charges[x].metadata) ? charges[x].metadata.stripe_fees : "",
      doma_fees : (charges[x].metadata) ? charges[x].metadata.doma_fees : "",
      pending_transfer : (charges[x].metadata) ? charges[x].metadata.pending_transfer : "",
      available_on : (charges[x].balance_transaction && charges[x].balance_transaction.available_on) ? charges[x].balance_transaction.available_on : false,
    }

    //if the charge is a rental
    if (charges[x].metadata && charges[x].metadata.rental_id){
      temp_transfer.rental_id = charges[x].metadata.rental_id;
      temp_transfer.renter_name = charges[x].metadata.renter_name;
    }
    temp_charges.push(temp_transfer);
  }
  user.stripe_charges = temp_charges;
}

//helper function to create a new stripe customer
function newStripeCustomer(req, res, next){
  console.log("SF: Trying to create a new Stripe customer...");

  stripe.customers.create({
    source: req.body.stripeToken,
    email: req.user.email,
    metadata: {
      "account_id" : req.user.id,
      "username" : req.user.username,
      "stripe_account" : req.user.stripe_account
    }
  }, function(err, customer) {
    if (err){
      stripeErrorHandler(req, res, err);
    }
    else {
      //customer last4 cc # for premium payments
      if (customer.sources && customer.sources.total_count > 0){
        req.user.premium_cc_brand = customer.sources.data[0].brand;
        req.user.premium_cc_last4 = customer.sources.data[0].last4;
      }

      //update the customer id in the DB
      req.session.new_account_info = {
        stripe_customer_id: customer.id
      }
      next();
    }
  });
}

//helper function to create a new stripe customer
function newStripeSubscription(req, res, next){
  console.log("SF: Creating a new Stripe subscription...");

  stripe.subscriptions.create({
    customer: req.user.stripe_customer_id,
    plan: "premium_account",
    metadata: {
      "account_id" : req.user.id,
      "username" : req.user.username
    }
  }, function(err, subscription) {
    if (err){stripeErrorHandler(req, res, err)}
    else {
      req.user.premium_exp_date = subscription.current_period_end;
      req.user.premium_expiring = subscription.cancel_at_period_end;

      //update our database with new stripe customer ID
      req.session.new_account_info = {
        stripe_subscription_id : subscription.id
      }
      next();
    }
  });
}

//helper function for handling stripe errors
function stripeErrorHandler(req, res, err){
  console.log(err.message);
  switch (err.message){
    case ("Your card was declined!"):
    case ("Your card's expiration year is invalid."):
    error.handler(req, res, err.message, "json");
    break;
    default:
    error.handler(req, res, "Something went wrong with the payment!", "json");
    break;
  }
}

//helper function to get the req.user listings object for a specific domain
function getUserListingObj(listings, domain_name){
  for (var x = 0; x < listings.length; x++){
    if (listings[x].domain_name.toLowerCase() == domain_name.toLowerCase()){
      return listings[x];
    }
  }
}

//function to get the doma fees
function getDomaFees(amount){
  return Math.round(amount * 0.1);
}

//function to get the stripe fees
function getStripeFees(amount){
  return Math.round(amount * 0.029) + 30;
}

//</editor-fold>
