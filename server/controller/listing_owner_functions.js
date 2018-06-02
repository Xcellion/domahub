//<editor-fold>-------------------------------DOMA LIB FUNCTIONS-------------------------------

var listing_model = require('../models/listing_model.js');
var account_model = require('../models/account_model.js');
var data_model = require('../models/data_model.js');

var Categories = require("../lib/categories.js");
var Fonts = require("../lib/fonts.js");
var Currencies = require("../lib/currencies.js");
var Descriptions = require("../lib/descriptions.js");
var error = require('../lib/error.js');
var encryptor = require('../lib/encryptor.js');

//</editor-fold>

//<editor-fold>-------------------------------VARIABLES-------------------------------

var request = require("request");
var dns = require("dns");
//use google servers
dns.setServers([
  "8.8.4.4",
  "8.8.8.8"
]);
var validator = require("validator");

var whois = require("whois");
var parser = require('parse-whois');
var moment = require('moment');

var multer = require("multer");
var parseDomain = require("parse-domain");
var Q = require('q');
var qlimit = require("qlimit");
var fs = require('fs');

//registrar info
var namecheap_url = (process.env.NODE_ENV == "dev") ? "https://api.sandbox.namecheap.com/xml.response" : "https://api.namecheap.com/xml.response";
var namesilo_url = (process.env.NODE_ENV == "dev") ? "http://sandbox.namesilo.com/apibatch" : "https://www.namesilo.com/apibatch";
var parseString = require('xml2js').parseString;

//phone
var PNF = require('google-libphonenumber').PhoneNumberFormat;
var phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();

//</editor-fold>

module.exports = {

  //<editor-fold>-------------------------------RENDERS-------------------------------

  //display the create listing choice page
  renderCreateListing : function(req, res, next){
    res.render("listings/listing_create.ejs", {
      user: req.user
    });
  },

  //display the create multiple listing page
  renderCreateListingMultiple : function(req, res, next){
    res.render("listings/listing_create_multiple.ejs", {
      user: req.user
    });
  },

  //</editor-fold>

  //<editor-fold>-------------------------------GETS------------------------------

  //gets all statistics for a specific domain
  getListingStats : function(req, res, next){
    console.log("LOF: Finding the all verified statistics for " + req.params.domain_name + "...");
    var listing_obj = getUserListingObjByName(req.user.listings, req.params.domain_name);
    data_model.getListingStats(req.params.domain_name, function(result){

      //set server side stats
      if (result.state == "success"){
        listing_obj.stats = result.info;
      }
      else {
        listing_obj.stats = false;
      }

      res.send({
        state: "success",
        listings: req.user.listings
      });
    });
  },

  //</editor-fold>

  //<editor-fold>-------------------------------CREATE------------------------------

    //<editor-fold>-------------------------------CHECKS (CREATE)------------------------------

    //check all posted domain names
    checkPostedDomainNames : function(req, res, next){
      console.log("LOF: Checking all posted domain names...");
      var posted_domain_names = req.body.domain_names;

      if ((posted_domain_names.length + req.user.listings.length > 100) && !req.user.stripe_subscription_id){
        error.handler(req, res, "max-domains-reached", "json");
      }
      else if (!posted_domain_names || posted_domain_names.length <= 0){
        error.handler(req, res, "You can't create listings without any domain names!", "json");
      }
      else if (posted_domain_names.length > 100){
        error.handler(req, res, "You can only create up to 100 domain listings at a time!", "json");
      }
      else {
        //loop through and check all posted domain names
        var bad_listings = [];
        var good_listings = [];
        var domains_sofar = [];
        for (var x = 0; x < posted_domain_names.length; x++){
          var bad_reasons = checkPostedDomainName(req.user, domains_sofar, posted_domain_names[x], false, false);

          //some were messed up
          if (bad_reasons.length > 0){
            bad_listings.push({
              domain_name: posted_domain_names[x],
              reasons: bad_reasons
            });
          }
          else {
            domains_sofar.push(posted_domain_names[x]);
            good_listings.push({
              domain_name: posted_domain_names[x]
            });
          }
        }

        res.send({
          state : "success",
          bad_listings : bad_listings,
          good_listings : good_listings
        });
      }
    },

    //check all posted listing info
    checkPostedListingInfoForCreate : function(req, res, next){
      console.log("LOF: Checking all posted listing info...");

      var posted_domain_names = req.body.domains;
      var bad_listings = [];
      var domains_sofar = [];
      var date_now = new Date().getTime();
      var db_object = [];
      var default_currency = (req.user.default_currency) ? req.user.default_currency : "usd";

      //loop through and check all posted domain names
      for (var x = 0; x < posted_domain_names.length; x++){
        var bad_reasons = checkPostedDomainName(req.user, domains_sofar, posted_domain_names[x].domain_name, posted_domain_names[x].min_price, posted_domain_names[x].buy_price);

        //this one is messed up for some reason(s)
        if (bad_reasons.length > 0){
          bad_listings.push({
            reasons: bad_reasons,
            domain_name : posted_domain_names[x].domain_name
          });
        }
        //all good! format the db array
        else {
          domains_sofar.push(posted_domain_names[x].domain_name);

          //format the object for DB insert
          db_object.push([
            req.user.id,
            date_now,
            (req.user.stripe_subscription_id) ? posted_domain_names[x].domain_name : posted_domain_names[x].domain_name.toLowerCase(),
            null,    //registrar_id, changes later if we're using a registrar to auto update DNS
            parseFloat(posted_domain_names[x].min_price) || 0,
            parseFloat(posted_domain_names[x].buy_price) || 0,
            Descriptions.random(),    //random default description
            default_currency,         //user default currency
            null,
            null,
            null
          ]);
        }
      }

      if (bad_listings.length > 0){
        res.send({
          bad_listings: bad_listings
        });
      }
      else {
        //create an object for the session
        req.session.new_listings = {
          db_object : db_object,
          good_listings : [],
          bad_listings : [],
          check_dns_promises : []
        }
        next();
      }
    },

    //</editor-fold>

    //<editor-fold>-------------------------------EXECUTE (CREATE)------------------------------

    //if creating via registrar tool, set the DNS to point to domahub
    setDNSViaRegistrar : function(req, res, next){
      if (req.session.registrar_info){
        console.log("LOF: Using registrar APIs to automatically verify listings!");
        var registrar_domain_promises = [];

        //loop through all registrars
        for (var x = 0 ; x < req.session.registrar_info.length ; x++){

          //loop through all domains in registrar gotten via API
          var registrar_info = req.session.registrar_info[x];
          if (registrar_info.domains){
            for (var y = 0 ; y < registrar_info.domains.length ; y++){
              var registrar_domain_name = registrar_info.domains[y].domain_name;

              //if domain name is being created on domahub (not all domains in registrar)
              for (var z = 0 ; z < req.session.new_listings.db_object.length ; z++){
                if (req.session.new_listings.db_object[z][2].toLowerCase() == registrar_domain_name.toLowerCase()){
                  //change registrar_id to registrar_id in DB object
                  req.session.new_listings.db_object[z][3] = registrar_info.id;

                  //create promise to set DNS via API
                  switch (req.session.registrar_info[x].registrar_name){
                    case "godaddy":
                      registrar_domain_promises.push(set_dns_godaddy_promise(registrar_info, registrar_domain_name));
                      break;
                    case "namecheap":
                      registrar_domain_promises.push(set_dns_namecheap_promise(registrar_info, registrar_domain_name));
                      break;
                    case "namesilo":
                      registrar_domain_promises.push(set_dns_namesilo_promise(registrar_info, registrar_domain_name));
                      break;
                  }
                  break;
                }
              }
            }
          }
        }

        //all DNS registrars added!
        var limit = qlimit(1);     //limit parallel promises (throttle)
        Q.allSettled(registrar_domain_promises.map(limit(function(item, index, collection){
          return registrar_domain_promises[index]();
        }))).then(function(results) {
          console.log("LOF: Finished querying " + registrar_domain_promises.length + " registrars for setting domain DNS!");
          for (var y = 0; y < results.length ; y++){
            //successfully changed DNS!
            if (results[y].state == "fulfilled"){
              req.session.new_listings.good_listings.push({
                domain_name : results[y].value.domain_name,
                reasons : results[y].value.reasons
              });
            }
            //if there was an error, then add it to bad reasons
            else {
              req.session.new_listings.bad_listings.push({
                domain_name : results[y].reason.domain_name,
                reasons : results[y].reason.reasons
              });
            }
          }
          delete req.session.registrar_info;

          next();
        });
      }

      //not using registrar tool! go next to manual creation
      else {
        next();
      }
    },

    //find out the registrar expiration date and set it (if it exists)
    setDNSExpiration : function(req, res, next){
      console.log("LOF: Attempting to find out domain expiration dates for new listings...");

      var whois_promises = [];
      for (var x = 0 ; x < req.session.new_listings.db_object.length ; x++){
        whois_promises.push(check_whois_promise(req.session.new_listings.db_object[x][2].toLowerCase(), x));
      }

      //all whois data received!
      var limit = qlimit(1);     //limit parallel promises (throttle)
      Q.allSettled(whois_promises.map(limit(function(item, index, collection){
        return whois_promises[index]();
      }))).then(function(results) {
        console.log("LOF: Finished looking up domain expiration dates!");
        for (var y = 0 ; y < results.length ; y++){
          if (results[y].state == "fulfilled"){
            var registrar_exp_date = moment(results[y].value.whois["Registrar Registration Expiration Date"], "YYYY-MM-DDTHH:mm Z");
            var registrar_create_date = moment(results[y].value.whois["Creation Date"], "YYYY-MM-DDTHH:mm Z");

            req.session.new_listings.db_object[results[y].value.index][8] = (registrar_exp_date.isValid()) ? registrar_exp_date.valueOf() : null;
            req.session.new_listings.db_object[results[y].value.index][9] = (registrar_create_date.isValid()) ? registrar_create_date.valueOf() : null;
            req.session.new_listings.db_object[results[y].value.index][10] = results[y].value.whois["Registrar"];
          }
        }
        next();
      });
    },

    //create listings
    createListings : function(req, res, next){
      console.log("LOF: Attempting to create listings...");

      listing_model.newListings(req.session.new_listings.db_object, function(result){
        if (result.state=="error"){error.handler(req, res, result.info, "json");}
        else {
          //figure out what was created
          account_model.getAccountListings(req.user.id, function(result){
            if (result.state=="error"){error.handler(req, res, result.info, "json");}
            else {
              //get the insert IDs and domain names of newly inserted listings
              var newly_inserted_listings = findNewlyMadeListings(req.user.listings, result.info);
              var inserted_ids = newly_inserted_listings.inserted_ids;        //insert ids of all inserted domains
              var inserted_domains = newly_inserted_listings.inserted_domains;    //domain names of all inserted domains
              var inserted_listings = newly_inserted_listings.inserted_listings;             //object of all inserted listings

              //check what was created
              checkForCreatedListings(
                req.session.new_listings,
                inserted_domains,
                inserted_ids
              );

              //some DNS changes were made! check them now to see if we should auto-verify some listings
              if (req.session.new_listings.check_dns_promises.length > 0){
                var check_dns_promises = req.session.new_listings.check_dns_promises

                //all DNS changes checked!
                var limit = qlimit(5);     //limit parallel promises (throttle)
                Q.allSettled(check_dns_promises.map(limit(function(item, index, collection){
                  return check_dns_promises[index]();
                }))).then(function(results) {
                  console.log("LOF: Finished checking DNS changes for newly created domains!");

                  //remove from the inserted_ids list
                  var pending_dns_ids = [];
                  var verified_ids = [];
                  for (var x = 0; x < results.length; x++){

                    //should we remove from the array of to be verified reverted?
                    var index_of_dns_to_remove = false;
                    var dns_changed_domain_id = ((results[x].state == "fulfilled") ? results[x].value[0] : results[x].reason[0]);
                    for (var y = 0 ; y < inserted_ids.length ; y++){
                      if (inserted_ids[y][0] == dns_changed_domain_id){
                        index_of_dns_to_remove = y;
                      }
                    }
                    if (Number.isInteger(index_of_dns_to_remove)) {
                      inserted_ids.splice(index_of_dns_to_remove, 1);
                    }

                    //DNS changes are propagated already so insert into an array of legit verified domains (status = 1)
                    if (results[x].state == "fulfilled"){
                      verified_ids.push(results[x].value.toString());
                    }
                    //insert into array of pending DNS domains (status = 3)
                    else {
                      pending_dns_ids.push(results[x].reason.toString());
                    }
                  }

                  //object wrapper for the various IDs
                  var various_ids = {
                    verified_ids : verified_ids,
                    pending_dns_ids : pending_dns_ids,
                    inserted_ids : inserted_ids
                  }

                  //waterfall to make verified / pending DNS updates to the listings
                  Q.fcall(verified_dns_promise, various_ids)      //function to call, and the parameter
                  .then(pending_dns_promise, pending_dns_promise)   //function on success, function on error
                  .done(function(various_ids){
                    //after updating status to 3 for some (if not all)
                    //see if we inserted anything and revert to unverified if necessary
                    checkInsertedIDs(req, res, various_ids.inserted_ids);
                  }, function(err){
                    //on error if updating status to 3 failed for some (if not all)
                    //see if we inserted anything and revert to unverified if necessary
                    checkInsertedIDs(req, res, various_ids.inserted_ids);
                  });
                });
              }
              else {
                //see if we inserted anything and revert to unverified if necessary
                checkInsertedIDs(req, res, inserted_ids);
              }
            }
          });
        }
      });
    },

    //promises for editing DNS (used in verifying automatically after listing creation)
    set_dns_godaddy_promise : set_dns_godaddy_promise,
    set_dns_namecheap_promise : set_dns_namecheap_promise,
    set_dns_namesilo_promise : set_dns_namesilo_promise,

    //promises for checking if above DNS settings were successful and editing listing info accordingly
    check_domain_dns_promise : check_domain_dns_promise,
    pending_dns_promise : pending_dns_promise,
    verified_dns_promise : verified_dns_promise,

    //</editor-fold>

  //</editor-fold>

  //<editor-fold>-------------------------------UPDATE/DELETE------------------------------

    //<editor-fold>-------------------------------CHECKS (UPDATE LISTINGS)------------------------------

    //create a new listing info object to make changes to
    createNewListingInfoObj : function(req, res, next){
      req.session.new_listing_info = {};
      next();
    },

    //check if posted selected IDs are numbers
    checkSelectedIDs : function(req, res, next){
      console.log("LOF: Checking posted domain IDs...");
      var selected_ids = (req.body.selected_ids) ? req.body.selected_ids.split(",") : false;
      if (!selected_ids || selected_ids.length <= 0){
        error.handler(req, res, "You have selected invalid domains! Please refresh the page and try again!", "json");
      }
      else {
        var all_good = true;
        for (var x = 0 ; x < selected_ids.length ; x++){
          if (!validator.isInt(selected_ids[x], { min : 1 , allow_leading_zeroes : true})){
            all_good = false;
            break;
          }
        }
        if (!all_good){
          error.handler(req, res, "You have selected invalid domains! Please refresh the page and try again!", "json");
        }
        else {
          next();
        }
      }
    },

    //check the size of the image uploaded
    checkImageUploadSize : function(req, res, next){
      var premium = req.user.stripe_subscription_id;
      var upload_path = (process.env.NODE_ENV == "dev") ? "./uploads/images" : '/var/www/w3bbi/uploads/images';
      var storage = multer.diskStorage({
        destination: function (req, file, cb) {
          cb(null, upload_path);
        },
        filename: function (req, file, cb) {
          var filename_postfix = (req.params.domain_name) ? "_" + req.params.domain_name + "_" + req.user.username : "_" + req.user.username;
          cb(null, Date.now() + filename_postfix);
        }
      });

      var upload_img = multer({
        storage: storage,
        limits: { fileSize: 1000000 },

        //to check for file type
        fileFilter: function (req, file, cb) {
          console.log("LOF: " + req.user.username + " is uploading an image file for parsing...");

          var allowedMimeTypes = [
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif"
          ];

          if (allowedMimeTypes.indexOf(file.mimetype) <= -1) {
            cb(new Error('FILE_TYPE_WRONG'));
          }
          else if (!premium){
            cb(new Error('NOT_PREMIUM'));
          }
          else {
            cb(null, true);
          }
        }
      }).fields([{ name: 'background_image', maxCount: 1 }, { name: 'logo', maxCount: 1 }]);

      upload_img(req, res, function(err){
        if (err){
          if (err.code == "LIMIT_FILE_SIZE"){
            error.handler(req, res, 'File is bigger than 1 MB!', "json");
          }
          else if (err.message == "FILE_TYPE_WRONG"){
            error.handler(req, res, 'Wrong file type!', "json");
          }
          else if (err.message == "NOT_PREMIUM"){
            error.handler(req, res, "not-premium", "json");
          }
          else {
            error.log(err, "Something went wrong with an image upload");
            error.handler(req, res, 'Something went wrong with the upload!', "json");
          }
        }
        else if (!err) {
          next();
        }
      });
    },

    //check the user image and upload to imgur
    checkListingImage : function(req, res, next){
      if (req.files && (req.files.background_image || req.files.logo) && !req.body.background_image_link && !req.body.logo_image_link){

        //custom image upload promise function
        var q_function = function(formData){
          return Q.Promise(function(resolve, reject, notify){
            console.log("LOF: " + req.user.username + " is uploading image(s) to Imgur...");
            request.post({
              url: "https://imgur-apiv3.p.mashape.com/3/image",
              headers: {
                'X-Mashape-Key' : (process.env.NODE_ENV == "dev") ? "72Ivh0ASpImsh02oTqa4gJe0fD3Dp1iZagojsn1Yt1hWAaIzX3" : "50g8uuI5B8msh59fdwSi39VMkEtup1dIOJRjsnDe8wNJKmzMls",
                'Authorization' : 'Client-ID e67be8dd932733c'
              },
              json : true,
              formData: formData
            }, function (err, response, body) {
              if (!err && body.success){
                resolve({
                  imgur_link: body.data.link,
                  image_type: formData.image_type
                });
              }
              else {
                reject(err);
              }
            });
          })
        }

        //create the array of promises
        var promises = [];
        for (var x in req.files){
          var promise = q_function({
            title : req.files[x][0].filename,
            image : fs.createReadStream(req.files[x][0].path),
            image_type : req.files[x][0].fieldname
          });
          promises.push(promise);
        }

        //wait for all promises to finish
        Q.allSettled(promises)
        .then(function(results) {

          //figure out which promises failed / passed
          for (var y = 0; y < results.length; y++){
            if (results[y].state == "fulfilled"){
              req.session.new_listing_info[results[y].value.image_type] = results[y].value.imgur_link;
            }
          }

          next();
        });
      }
      else {
        //removing existing image(s) intentionally
        if (req.body.background_image == "" || req.body.background_image_link == ""){
          req.session.new_listing_info.background_image = null;
        }
        if (req.body.logo == "" || req.body.logo_image_link == ""){
          req.session.new_listing_info.logo = null;
        }
        next();
      }
    },

    //check for verified, ownership, and purchased for multi listing edit
    checkPostedListingInfoMulti : function(req, res, next){
      console.log("LOF: Checking listings for ownership, verification, or sold...");

      var selected_ids = (req.body.selected_ids) ? req.body.selected_ids.split(",") : false;
      var owned_domains = 0;
      var verified_domains = 0;
      var accepted_domains = 0;
      var deposited_domains = 0;
      var transferred_domains = 0;

      //loop through and check
      for (var x = 0 ; x < req.user.listings.length ; x++){
        //check ownership
        for (var y = 0 ; y < selected_ids.length ; y++){
          if (parseFloat(selected_ids[y]) == req.user.listings[x].id){
            owned_domains++;

            if (req.user.listings[x].verified == 1){
              verified_domains++;
            }

            if (req.user.listings[x].accepted == 1){
              accepted_domains++;
            }

            if (req.user.listings[x].deposited == 1){
              deposited_domains++;
            }

            if (req.user.listings[x].transferred == 1){
              transferred_domains++;
            }

            break;
          }
        }
      }

      //all good!
      var error_message_plural = (req.body.selected_ids.length == 1) ? "this domain" : "some or all of these domains";
      error_message_plural += "! Please select different listings to edit!";
      if (owned_domains != selected_ids.length){
        error.handler(req, res, "ownership-error", "json");
      }
      else if (verified_domains != selected_ids.length){
        error.handler(req, res, "verification-error", "json");
      }
      else if (accepted_domains != 0){
        error.handler(req, res, "accepted-error", "json");
      }
      else if (deposited_domains != 0){
        error.handler(req, res, "deposited-error", "json");
      }
      else if (transferred_domains != 0){
        error.handler(req, res, "transferred-error", "json");
      }
      else {
        next();
      }
    },

    //check that the listing is verified
    checkListingVerified : function(req, res, next){
      console.log("LOF: Checking if listing is a verified listing...");
      if (getUserListingObjByName(req.user.listings, req.params.domain_name).verified != 1){
        error.handler(req, res, "Please verify that you own this domain!", "json");
      }
      else {
        next();
      }
    },

    //check that the user owns the listing
    checkListingOwnerPost : function(req, res, next){
      console.log("LOF: Checking if current user is the owner...");
      if (getUserListingObjByName(req.user.listings, req.params.domain_name).owner_id != req.user.id){
        error.handler(req, res, "You do not own this domain! Please refresh the page and try again!", "json");
      }
      else {
        next();
      }
    },

    //check that the user owns the listing
    checkListingOwnerGet : function(req, res, next){
      console.log("LOF: Checking if current user is listing owner...");
      listing_model.checkListingOwner(req.user.id, req.params.domain_name, function(result){
        if (result.state == "error" || result.info.length <= 0){
          res.redirect("/listing/" + req.params.domain_name);
        }
        else {
          next();
        }
      });
    },

    //check if listing has been purchased
    checkListingPurchased : function(req, res, next){
      console.log("LOF: Checking if the listing was already purchased or accepted...");
      var listing_obj = getUserListingObjByName(req.user.listings, req.params.domain_name);
      if (listing_obj.accepted){
        error.handler(req, res, "You have already accepted an offer for this domain! Please wait for the offerer to complete the payment process.", "json");
      }
      else if (listing_obj.deposited){
        error.handler(req, res, "This listing has already been purchased! Please complete the ownership transfer to the new owner.", "json");
      }
      else {
        next();
      }
    },

    //check the posted status change of a listing
    checkListingStatus : function(req, res, next){
      console.log("LOF: Checking posted listing status...");

      var status = parseFloat(req.body.status);

      //if status exists and is not 1 or 0
      if (req.body.status && status != 1 && status != 0){
        error.handler(req, res, "Invalid listing status!", "json");
      }
      //check to see if its currently rented
      else if (req.body.status == 0){
        console.log("LOF: Checking to see if domain(s) are currently rented...");
        var domain_names = (req.path == "/listings/multiupdate") ? req.body.selected_ids.split(",") : [req.params.domain_name];

        listing_model.checkCurrentlyRented(domain_names, function(result){
          if (result.state != "success" || result.info.length > 0){
            error.handler(req, res, "This listing is currently being rented! Please wait until the rental is over before changing the status.", "json");
          }
          else {
            next();
          }
        });
      }
      //check to see if its still pointed to domahub
      else if (req.body.status == 1){
        var domain_names = (req.path == "/listings/multiupdate") ? req.body.selected_ids.split(",") : [req.params.domain_name];

        //custom promise creation, get ip address of domain
        var q_function_ip = function(listing_obj){
          return Q.Promise(function(resolve, reject, notify){
            dns.resolve(listing_obj.domain_name, "A", function(err, address, family){
              if (err) {
                reject({
                  err: err,
                  domain_name : listing_obj.domain_name,
                  listing_id : listing_obj.id,
                  status : listing_obj.status,
                });
              }
              else {
                resolve({
                  address : address,
                  domain_name : listing_obj.domain_name,
                  listing_id : listing_obj.id,
                  status : listing_obj.status,
                });
              }
            });
          })
        }

        //build array of IP verification promises
        var to_verify_promises = [];
        if (req.path == "/listings/multiupdate"){
          for (var x = 0; x < domain_names.length; x++){
            to_verify_promises.push(q_function_ip(getUserListingObjByID(req.user.listings, domain_names[x])));
          }
        }
        else {
          to_verify_promises.push(q_function_ip(getUserListingObjByName(req.user.listings, req.params.domain_name)));
        }

        if (to_verify_promises.length > 0){
          console.log("LOF: Checking to see if domain(s) are still pointed to DomaHub...");

          dns.resolve("domahub.com", "A", function (err, address, family) {
            var doma_ip = address[0];

            //wait for all promises to finish
            Q.allSettled(to_verify_promises)
             .then(function(results) {
               var still_pointing = [];
               var not_pointing = [];
               var still_pending = [];

               //figure out if any failed, push to new promise array
               for (var x = 0; x < results.length; x++){
                 if (results[x].state == "fulfilled"){
                   if (doma_ip && results[x].value.address && doma_ip == results[x].value.address[0] && results[x].value.address.length == 1){
                     still_pointing.push(x);
                   }
                   else if (results[x].value.status != 3){
                     not_pointing.push(results[x].value.listing_id.toString());
                   }
                   else {
                     still_pending.push(results[x].value.listing_id.toString());
                   }
                 }
                 else if (results[x].reason.status != 3){
                   not_pointing.push(results[x].reason.listing_id.toString());
                 }
                 else {
                   still_pending.push(results[x].reason.listing_id.toString());
                 }
               }

               //some of the domains aren't pointing anymore
               if (not_pointing.length > 0){
                 console.log("LOF: Some domain(s) are not pointing to DomaHub! Reverting...");
                 //update not pointing domains
                 listing_model.updateListingsInfo(not_pointing, {
                   verified : null,
                   status : 0
                 }, function(result){
                   if (result.state == "error") { error.handler(req, res, result.info, "json"); }
                   else {
                     //for the next function
                     req.session.new_listing_info = {
                       verified : null,
                       status : 0
                     }
                     updateUserListingsObject(req, res, domain_names);
                     res.send({
                       state: "error",
                       message : "verification-error",
                       listings: req.user.listings
                     });
                   }
                 });
               }
               //some domains are still pending changes
               else if (still_pending.length > 0){
                 error.handler(req, res, "dns-pending", "json");
               }
               //all good
               else {
                 next();
               }
             });
          });
        }
        else {
          res.send({
            state: "error",
            message : "verification-error",
            listings: req.user.listings
          });
        }
      }
      else {
        next();
      }
    },

    //check and reformat new listings details excluding image
    checkListingPremiumDetails : function(req, res, next){
      //premium design checks
      if (req.user.stripe_subscription_id){
        console.log("LOF: Checking posted premium listing details...");

        var selected_ids = (req.body.selected_ids) ? req.body.selected_ids.split(",") : false;

        //left side
        var show_registrar = parseFloat(req.body.show_registrar);
        var show_registration_date = parseFloat(req.body.show_registration_date);
        var show_categories = parseFloat(req.body.show_categories);
        var show_social_sharing = parseFloat(req.body.show_social_sharing);

        //appraisal links
        var show_godaddy_appraisal = parseFloat(req.body.show_godaddy_appraisal);
        var show_domainindex_appraisal = parseFloat(req.body.show_domainindex_appraisal);
        var show_freevaluator_appraisal = parseFloat(req.body.show_freevaluator_appraisal);
        var show_estibot_appraisal = parseFloat(req.body.show_estibot_appraisal);

        //right side
        var show_placeholder = parseFloat(req.body.show_placeholder);
        var show_traffic_graph = parseFloat(req.body.show_traffic_graph);
        var show_alexa_stats = parseFloat(req.body.show_alexa_stats);
        var show_history_ticker = parseFloat(req.body.show_history_ticker);
        var show_domain_list = parseFloat(req.body.show_domain_list);

        //hub stuff
        var hub = parseFloat(req.body.hub);
        var hub_email = parseFloat(req.body.hub_email);
        var hub_phone = req.body.hub_phone;
        if (req.body.hub_phone || hub_phone != ""){
          try {
            hub_phone = phoneUtil.format(phoneUtil.parse(req.body.hub_phone), PNF.INTERNATIONAL)
          }
          catch(err){
            hub_phone = false;
          }
        }
        var hub_layout_type = parseFloat(req.body.hub_layout_type);
        var hub_listing_ids = (req.body.hub_listing_ids) ? req.body.hub_listing_ids.split(",") : ["false"];
        var hub_listing_ids_all_good = true;
        for (var x = 0 ; x < hub_listing_ids.length ; x++){
          if (!validator.isInt(hub_listing_ids[x])){
            hub_listing_ids_all_good = false;
            break;
          }
        }

        //invalid footer description
        if (req.body.description_footer && (req.body.description_footer.length < 0 || req.body.description_footer.length > 75)){
          error.handler(req, res, "The footer description cannot be more than 75 characters!", "json");
        }
        //invalid footer link
        else if (req.body.description_footer_link && !validator.isURL(req.body.description_footer_link)){
          error.handler(req, res, "That's an invalid footer URL! Please enter a different URL and try again!", "json");
        }
        //invalid domain capitalization
        else if (req.body.domain_name && req.body.domain_name.toLowerCase() != getUserListingObjByName(req.user.listings, req.params.domain_name).domain_name.toLowerCase()){
          error.handler(req, res, "That's an invalid domain name capitalization. Please try again!", "json");
        }
        //invalid primary color
        else if (req.body.primary_color && !validator.isHexColor(req.body.primary_color)){
          error.handler(req, res, "That's an invalid primary color! Please choose a different color and try again!", "json");
        }
        //invalid secondary color
        else if (req.body.secondary_color && !validator.isHexColor(req.body.secondary_color)){
          error.handler(req, res, "That's an invalid secondary color! Please choose a different color and try again!", "json");
        }
        //invalid tertiary color
        else if (req.body.tertiary_color && !validator.isHexColor(req.body.tertiary_color)){
          error.handler(req, res, "That's an invalid tertiary color! Please choose a different color and try again!", "json");
        }
        //invalid font color
        else if (req.body.font_color && !validator.isHexColor(req.body.font_color)){
          error.handler(req, res, "That's an invalid text color! Please choose a different color and try again!", "json");
        }
        //invalid font name
        else if (req.body.font_name && Fonts.all().indexOf(req.body.font_name) == -1){
          error.handler(req, res, "That's an invalid font name! Please choose a different font and try again!", "json");
        }
        //invalid background color
        else if (req.body.background_color && !validator.isHexColor(req.body.background_color)){
          error.handler(req, res, "That's an invalid background color! Please choose a different color and try again!", "json");
        }
        //invalid footer background color
        else if (req.body.footer_background_color && !validator.isHexColor(req.body.footer_background_color)){
          error.handler(req, res, "That's an invalid footer background color! Please choose a different color and try again!", "json");
        }
        //invalid footer font color
        else if (req.body.footer_color && !validator.isHexColor(req.body.footer_color)){
          error.handler(req, res, "That's an invalid footer text color! Please choose a different color and try again!", "json");
        }
        //invalid background link
        else if (req.body.background_image_link && !validator.isURL(req.body.background_image_link)){
          error.handler(req, res, "That's an invalid background URL! Please enter a different URL and try again!", "json");
        }
        //invalid logo link
        else if (req.body.logo_image_link && !validator.isURL(req.body.logo_image_link)){
          error.handler(req, res, "That's an invalid logo URL! Please enter a different URL and try again!", "json");
        }
        //invalid domain owner
        else if (req.body.show_registrar && (show_registrar != 0 && show_registrar != 1)){
          error.handler(req, res, "That's an invalid domain owner selection! Please refresh the page and try again!", "json");
        }
        //invalid domain age
        else if (req.body.show_registration_date && (show_registration_date != 0 && show_registration_date != 1)){
          error.handler(req, res, "That's an invalid domain age selection! Please refresh the page and try again!", "json");
        }
        //invalid domain list
        else if (req.body.show_domain_list && (show_domain_list != 0 && show_domain_list != 1)){
          error.handler(req, res, "That's an invalid domain list selection! Please refresh the page and try again!", "json");
        }
        //invalid domain show categories
        else if (req.body.show_categories && (show_categories != 0 && show_categories != 1)){
          error.handler(req, res, "That's an invalid show categories selection! Please refresh the page and try again!", "json");
        }
        //invalid domain appraisal
        else if (req.body.show_godaddy_appraisal && (show_godaddy_appraisal != 0 && show_godaddy_appraisal != 1)){
          error.handler(req, res, "That's an invalid GoDaddy appraisal selection! Please refresh the page and try again!", "json");
        }
        //invalid domain appraisal
        else if (req.body.show_domainindex_appraisal && (show_domainindex_appraisal != 0 && show_domainindex_appraisal != 1)){
          error.handler(req, res, "That's an invalid Domain Index appraisal selection! Please refresh the page and try again!", "json");
        }
        //invalid domain appraisal
        else if (req.body.show_freevaluator_appraisal && (show_freevaluator_appraisal != 0 && show_freevaluator_appraisal != 1)){
          error.handler(req, res, "That's an invalid Free Valuator appraisal selection! Please refresh the page and try again!", "json");
        }
        //invalid domain appraisal
        else if (req.body.show_estibot_appraisal && (show_estibot_appraisal != 0 && show_estibot_appraisal != 1)){
          error.handler(req, res, "That's an invalid EstiBot appraisal selection! Please refresh the page and try again!", "json");
        }
        //invalid social sharing
        else if (req.body.show_social_sharing && (show_social_sharing != 0 && show_social_sharing != 1)){
          error.handler(req, res, "That's an invalid social sharing selection! Please refresh the page and try again!", "json");
        }
        //invalid traffic graph module
        else if (req.body.show_traffic_graph && (show_traffic_graph != 0 && show_traffic_graph != 1)){
          error.handler(req, res, "That's an invalid traffic graph selection! Please refresh the page and try again!", "json");
        }
        //invalid Alexa stats module
        else if (req.body.show_alexa_stats && (show_alexa_stats != 0 && show_alexa_stats != 1)){
          error.handler(req, res, "That's an invalid Alexa stats selection! Please refresh the page and try again!", "json");
        }
        //invalid history module
        else if (req.body.show_history_ticker && (show_history_ticker != 0 && show_history_ticker != 1)){
          error.handler(req, res, "That's an invalid history tab selection! Please refresh the page and try again!", "json");
        }
        //invalid placeholder
        else if (req.body.show_placeholder && (show_placeholder != 0 && show_placeholder != 1)){
          error.handler(req, res, "That's an invalid placeholder selection! Please refresh the page and try again!", "json");
        }
        //invalid hub
        else if (req.body.hub && (hub != 0 && hub != 1)){
          error.handler(req, res, "That's an invalid hub selection! Please refresh the page and try again!", "json");
        }
        //invalid hub title
        else if (req.body.hub_title && (req.body.hub_title.length < 0 || req.body.hub_title.length > 75)){
          error.handler(req, res, "The listing hub name cannot be more than 75 characters!", "json");
        }
        //invalid hub email selection
        else if (req.body.hub_email && (hub_email != 0 && hub_email != 1)){
          error.handler(req, res, "That's an invalid hub email selection! Please refresh the page and try again!", "json");
        }
        //invalid hub phone
        else if (req.body.hub_phone && req.body.hub_phone != "" && !hub_phone){
          error.handler(req, res, "That's an invalid phone number! Please enter a valid phone number and try again!", "json");
        }
        //invalid hub layout count
        else if (req.body.hub_layout_count && !validator.isInt(req.body.hub_layout_count)){
          error.handler(req, res, "That's an invalid amount of domains! Please enter a valid number and try again!", "json");
        }
        //invalid hub layout
        else if (req.body.hub_layout_type && hub_layout_type != 0 && hub_layout_type != 1){
          error.handler(req, res, "That's an invalid layout type! Please refresh the page and try again!", "json");
        }
        //invalid hub ranking order
        else if (req.body.hub_listing_ids && !hub_listing_ids_all_good){
          error.handler(req, res, "That's an invalid domain list order! Please refresh the page and try again!", "json");
        }
        //hub ranking order when multiple hubs selected
        else if (req.body.hub_listing_ids && (!selected_ids || selected_ids.length > 1)){
          error.handler(req, res, "You cannot edit the domain list order for multiple hubs at the same time! Please go back and select a single hub to edit!", "json");
        }
        //all good!
        else {

          //set the new listing info
          if (!req.session.new_listing_info) {
            req.session.new_listing_info = {};
          }

          //info
          req.session.new_listing_info.description_footer = req.body.description_footer;
          req.session.new_listing_info.description_footer_link = req.body.description_footer_link;
          req.session.new_listing_info.domain_name = req.body.domain_name;

          //design
          req.session.new_listing_info.primary_color = req.body.primary_color;
          req.session.new_listing_info.secondary_color = req.body.secondary_color;
          req.session.new_listing_info.tertiary_color = req.body.tertiary_color;
          req.session.new_listing_info.font_name = req.body.font_name;
          req.session.new_listing_info.font_color = req.body.font_color;
          req.session.new_listing_info.background_color = req.body.background_color;
          req.session.new_listing_info.footer_color = req.body.footer_color;
          req.session.new_listing_info.footer_background_color = req.body.footer_background_color;

          //left side
          req.session.new_listing_info.show_registrar = show_registrar;
          req.session.new_listing_info.show_registration_date = show_registration_date;
          req.session.new_listing_info.show_categories = show_categories;
          req.session.new_listing_info.show_social_sharing = show_social_sharing;

          //appraisal
          req.session.new_listing_info.show_godaddy_appraisal = show_godaddy_appraisal;
          req.session.new_listing_info.show_domainindex_appraisal = show_domainindex_appraisal;
          req.session.new_listing_info.show_freevaluator_appraisal = show_freevaluator_appraisal;
          req.session.new_listing_info.show_estibot_appraisal = show_estibot_appraisal;

          //right side
          req.session.new_listing_info.show_placeholder = show_placeholder;
          req.session.new_listing_info.show_traffic_graph = show_traffic_graph;
          req.session.new_listing_info.show_alexa_stats = show_alexa_stats;
          req.session.new_listing_info.show_history_ticker = show_history_ticker;
          req.session.new_listing_info.show_domain_list = show_domain_list;

          //hub
          req.session.new_listing_info.hub = hub;
          req.session.new_listing_info.hub_title = req.body.hub_title;
          req.session.new_listing_info.hub_email = hub_email;
          req.session.new_listing_info.hub_phone = hub_phone;
          req.session.new_listing_info.hub_layout_count = parseFloat(req.body.hub_layout_count);
          req.session.new_listing_info.hub_layout_type = hub_layout_type;

          //posted a URL for background image, not upload
          if (req.body.background_image_link){
            req.session.new_listing_info.background_image = req.body.background_image_link;
          }

          //posted a URL for background image, not upload
          if (req.body.logo_image_link){
            req.session.new_listing_info.logo = req.body.logo_image_link;
          }

          next();
        }
      }
      else {
        //not premium but tried to do premium updates
        if (
          req.body.domain_name ||
          req.body.description_footer ||
          req.body.description_footer_link ||
          req.body.primary_color ||
          req.body.secondary_color ||
          req.body.tertiary_color ||
          req.body.font_name ||
          req.body.font_color ||
          req.body.background_color ||
          req.body.footer_background_color ||
          req.body.footer_color ||
          req.body.background_image_link ||
          req.body.logo_image_link ||
          req.body.show_registrar ||
          req.body.show_registration_date ||
          req.body.show_domain_list ||
          req.body.show_categories ||
          req.body.show_godaddy_appraisal ||
          req.body.show_domainindex_appraisal ||
          req.body.show_freevaluator_appraisal ||
          req.body.show_estibot_appraisal ||
          req.body.show_social_sharing ||
          req.body.show_traffic_graph ||
          req.body.show_alexa_stats ||
          req.body.show_history_ticker ||
          req.body.placeholder ||
          req.body.hub ||
          req.body.hub_title ||
          req.body.hub_email ||
          req.body.hub_phone ||
          req.body.hub_layout_count ||
          req.body.hub_layout_type ||
          req.body.hub_listing_ids
        ){
          error.handler(req, res, "not-premium", "json");
        }
        else {
          next();
        }
      }
    },

    //check and reformat new listings details excluding image
    checkListingDetails : function(req, res, next){
      console.log("LOF: Checking posted listing details...");

      var status = parseFloat(req.body.status);

      //registrar info
      var registrar_cost = parseFloat(req.body.registrar_cost);
      var date_expire = moment(req.body.date_expire);
      var date_registered = moment(req.body.date_registered);

      //rentable?
      var rentable = parseFloat(req.body.rentable);

      //example paths
      var paths = (req.body.paths) ? req.body.paths.replace(/\s/g, "").toLowerCase().split(",") : [];
      var paths_clean = [];
      //loop through the paths posted
      for (var x = 0; x < paths.length; x++){
        //if its alphanumeric
        if (validator.isAlphanumeric(paths[x])){
          paths_clean.push(paths[x]);
        }
      }
      paths_clean = paths_clean.join(",");

      var categories = (req.body.categories) ? req.body.categories.replace(/\s/g, " ").toLowerCase().split(" ").sort() : [];
      var categories_clean = [];
      //loop through the categories posted
      for (var x = 0; x < categories.length; x++){
        //if it exists in our list
        if (Categories.existsBack(categories[x])){
          categories_clean.push(categories[x]);
        }
      }
      categories_clean = categories_clean.join(" ");

      //registrar contact details
      var registrar_admin_phone = req.body.registrar_admin_phone;
      if (req.body.registrar_admin_phone || registrar_admin_phone != ""){
        try {
          registrar_admin_phone = phoneUtil.format(phoneUtil.parse(req.body.registrar_admin_phone), PNF.INTERNATIONAL)
        }
        catch(err){
          registrar_admin_phone = false;
        }
      }
      var registrar_registrant_phone = req.body.registrar_registrant_phone;
      if (req.body.registrar_registrant_phone || registrar_registrant_phone != ""){
        try {
          registrar_registrant_phone = phoneUtil.format(phoneUtil.parse(req.body.registrar_registrant_phone), PNF.INTERNATIONAL)
        }
        catch(err){
          registrar_registrant_phone = false;
        }
      }
      var registrar_tech_phone = req.body.registrar_tech_phone;
      if (req.body.registrar_tech_phone || registrar_tech_phone != ""){
        try {
          registrar_tech_phone = phoneUtil.format(phoneUtil.parse(req.body.registrar_tech_phone), PNF.INTERNATIONAL)
        }
        catch(err){
          registrar_tech_phone = false;
        }
      }

      //invalid short description
      if (req.body.description_hook && (req.body.description_hook.length < 0 || req.body.description_hook.length > 75)){
        error.handler(req, res, "That's an invalid listing description!", "json");
      }
      //no paths
      else if (req.body.paths && paths_clean.length == 0){
        error.handler(req, res, "You have entered invalid example pathes! Please try again.", "json");
      }
      //invalid categories
      else if (req.body.categories && categories_clean.length == 0){
        error.handler(req, res, "You have selected invalid categories! Please try again.", "json");
      }
      //invalid default currency
      else if (req.body.default_currency && (!req.user.currencies || !req.user.currencies.payment_currencies || req.user.currencies.payment_currencies.indexOf(req.body.default_currency) == -1)){
        error.handler(req, res, "You have selected an invalid currency! Please provide a valid default currency!", "json");
      }
      //invalid price type
      else if (req.body.price_type && ["month", "week", "day"].indexOf(price_type) == -1){
        error.handler(req, res, "You have selected an invalid rental price type! Please try again.", "json");
      }
      else if (req.body.price_rate && !validator.isInt(req.body.price_rate, {allow_leading_zeroes : true})){
        error.handler(req, res, "The rental price must be a whole number! Please try a different price.", "json");
      }
      else if (req.body.buy_price && !validator.isInt(req.body.buy_price, {allow_leading_zeroes : true}) && req.body.buy_price != 0){
        error.handler(req, res, "The buy it now price must be a whole number! Please try a different price.", "json");
      }
      else if (req.body.min_price && !validator.isInt(req.body.min_price, {allow_leading_zeroes : true}) && req.body.min_price != 0){
        error.handler(req, res, "The minimum price must be a whole number! Please try a different price.", "json");
      }
      else if (req.body.registrar_name && (req.body.registrar_name.length <= 0 || req.body.registrar_name.length > 100)){
        error.handler(req, res, "You have entered an invalid registrar name! Please try something else.", "json");
      }
      else if (req.body.date_expire != "" && !date_expire.isValid()){
        error.handler(req, res, "You have entered an invalid expiration date! Please try a different date.", "json");
      }
      else if (req.body.date_registered != "" && !date_registered.isValid()){
        error.handler(req, res, "You have entered an invalid registration date! Please try a different date.", "json");
      }
      else if (req.body.registrar_cost && !validator.isFloat(req.body.registrar_cost)){
        error.handler(req, res, "You have entered an invalid annual renewal cost! Please try a different price.", "json");
      }
      else if (req.body.registrar_cost_currency && (!req.user.currencies || !req.user.currencies.payment_currencies || req.user.currencies.payment_currencies.indexOf(req.body.registrar_cost_currency) == -1)){
        error.handler(req, res, "You have selected an invalid currency for your registrar renewal costs! Please provide a valid currency!", "json");
      }
      else if (rentable && rentable != 1 && rentable != 0){
        error.handler(req, res, "You have selected an invalid option! Please refresh the page and try again!", "json");
      }
      //registrar contact information
      else if (req.body.registrar_admin_name && (req.body.registrar_admin_name.length < 0 || req.body.registrar_admin_name.length > 100)){
        error.handler(req, res, "That's an invalid registrar administrator name!", "json");
      }
      else if (req.body.registrar_admin_org && (req.body.registrar_admin_org.length < 0 || req.body.registrar_admin_org.length > 100)){
        error.handler(req, res, "That's an invalid registrar administrator organization!", "json");
      }
      else if (req.body.registrar_admin_email && !validator.isEmail(req.body.registrar_admin_email)){
        error.handler(req, res, "That's an invalid registrar administrator email!", "json");
      }
      else if (req.body.registrar_admin_address && (req.body.registrar_admin_address.length < 0 || req.body.registrar_admin_address.length > 200)){
        error.handler(req, res, "That's an invalid registrar administrator address!", "json");
      }
      else if (req.body.registrar_admin_phone && !registrar_admin_phone){
        error.handler(req, res, "That's an invalid registrar administrator phone number!", "json");
      }
      else if (req.body.registrar_registrant_name && (req.body.registrar_registrant_name.length < 0 || req.body.registrar_registrant_name.length > 100)){
        error.handler(req, res, "That's an invalid registrar registrant name!", "json");
      }
      else if (req.body.registrar_registrant_org && (req.body.registrar_registrant_org.length < 0 || req.body.registrar_registrant_org.length > 100)){
        error.handler(req, res, "That's an invalid registrar registrant organization!", "json");
      }
      else if (req.body.registrar_registrant_email && !validator.isEmail(req.body.registrar_registrant_email)){
        error.handler(req, res, "That's an invalid registrar registrant email!", "json");
      }
      else if (req.body.registrar_registrant_address && (req.body.registrar_registrant_address.length < 0 || req.body.registrar_registrant_address.length > 200)){
        error.handler(req, res, "That's an invalid registrar registrant address!", "json");
      }
      else if (req.body.registrar_registrant_phone && !registrar_registrant_phone){
        error.handler(req, res, "That's an invalid registrar registrant phone number!", "json");
      }
      else if (req.body.registrar_tech_name && (req.body.registrar_tech_name.length < 0 || req.body.registrar_tech_name.length > 100)){
        error.handler(req, res, "That's an invalid registrar tech name!", "json");
      }
      else if (req.body.registrar_tech_org && (req.body.registrar_tech_org.length < 0 || req.body.registrar_tech_org.length > 100)){
        error.handler(req, res, "That's an invalid registrar tech organization!", "json");
      }
      else if (req.body.registrar_tech_email && !validator.isEmail(req.body.registrar_tech_email)){
        error.handler(req, res, "That's an invalid registrar tech email!", "json");
      }
      else if (req.body.registrar_tech_address && (req.body.registrar_tech_address.length < 0 || req.body.registrar_tech_address.length > 200)){
        error.handler(req, res, "That's an invalid registrar tech address!", "json");
      }
      else if (req.body.registrar_tech_phone && !registrar_tech_phone){
        error.handler(req, res, "That's an invalid registrar tech phone number!", "json");
      }
      else {
        if (!req.session.new_listing_info) {
          req.session.new_listing_info = {};
        }

        //description
        req.session.new_listing_info.status = status;
        req.session.new_listing_info.description = req.body.description;
        req.session.new_listing_info.description_hook = req.body.description_hook;
        req.session.new_listing_info.categories = (categories_clean == "") ? null : categories_clean;

        //pricing (multiply by currency multiplier)
        req.session.new_listing_info.default_currency = req.body.default_currency;
        req.session.new_listing_info.buy_price = (req.body.buy_price == "" || req.body.buy_price == 0) ? 0 : req.body.buy_price * req.session.new_listing_info.default_currency_multiplier;
        req.session.new_listing_info.min_price = (req.body.min_price == "" || req.body.min_price == 0) ? 0 : req.body.min_price * req.session.new_listing_info.default_currency_multiplier;
        req.session.new_listing_info.price_type = req.body.price_type;
        req.session.new_listing_info.price_rate = req.body.price_rate * req.session.new_listing_info.default_currency_multiplier;

        //rent
        req.session.new_listing_info.rentable = rentable;
        req.session.new_listing_info.paths = (paths_clean == "") ? null : paths_clean;

        //dates
        req.session.new_listing_info.date_expire = (req.body.date_expire == "" || !date_expire.isValid()) ? null : date_expire.valueOf();
        req.session.new_listing_info.date_registered = (req.body.date_registered == "" || !date_registered.isValid()) ? null : date_registered.valueOf();

        //registrar (multiply cost by currency multiplier)
        req.session.new_listing_info.registrar_name = req.body.registrar_name;
        req.session.new_listing_info.registrar_cost = (req.body.registrar_cost == "") ? 0 : registrar_cost * req.session.new_listing_info.default_registrar_currency_multiplier;
        req.session.new_listing_info.registrar_cost_currency = req.body.registrar_cost_currency;

        //registrar contact administrator details
        req.session.new_listing_info.registrar_admin_name = req.body.registrar_admin_name;
        req.session.new_listing_info.registrar_admin_org = req.body.registrar_admin_org;
        req.session.new_listing_info.registrar_admin_email = req.body.registrar_admin_email;
        req.session.new_listing_info.registrar_admin_address = req.body.registrar_admin_address;
        req.session.new_listing_info.registrar_admin_phone = req.body.registrar_admin_phone;

        //registrar contact registrant details
        req.session.new_listing_info.registrar_registrant_name = req.body.registrar_registrant_name;
        req.session.new_listing_info.registrar_registrant_org = req.body.registrar_registrant_org;
        req.session.new_listing_info.registrar_registrant_email = req.body.registrar_registrant_email;
        req.session.new_listing_info.registrar_registrant_address = req.body.registrar_registrant_address;
        req.session.new_listing_info.registrar_registrant_phone = req.body.registrar_registrant_phone;

        //registrar contact tech details
        req.session.new_listing_info.registrar_tech_name = req.body.registrar_tech_name;
        req.session.new_listing_info.registrar_tech_org = req.body.registrar_tech_org;
        req.session.new_listing_info.registrar_tech_email = req.body.registrar_tech_email;
        req.session.new_listing_info.registrar_tech_address = req.body.registrar_tech_address;
        req.session.new_listing_info.registrar_tech_phone = req.body.registrar_tech_phone;

        //delete anything that wasnt posted (except if its "", in which case it was intentional deletion)
        for (var x in req.session.new_listing_info){
          if (!req.body[x] && req.body[x] != "" && x != "background_image" && x != "logo"){
            delete req.session.new_listing_info[x];
          }
        }

        next();
      }
    },

    //prevent multi-edit of single-only details (capitalization)
    checkListingMultiDetails : function(req, res, next){
      console.log("LOF: Checking posted listing multi details...");

      //can't edit capitalization for multi
      if (req.body.domain_name) {
        error.handler(req, res, "You cannot edit capitalization for multiple domains. Please select a single domain to edit.", "json");
      }
      else {
        next();
      }
    },

    //check currency and make sure they are all same
    checkListingCurrencyDetails : function(req, res, next){
      console.log("LOF: Checking posted listing currency details...");

      //multiple listings edit
      var selected_ids = (req.body.selected_ids) ? req.body.selected_ids.split(",") : false;
      if (selected_ids){

        var selected_listings = req.user.listings.filter(function(elem){
          return selected_ids.indexOf(String(elem.id)) != -1;
        });

        //check if currencies of all listings are not the same
        var currencies_same = selected_listings[0].default_currency;
        var registrar_currencies_same = selected_listings[0].registrar_cost_currency;
        for (var x = 0 ; x < selected_listings.length ; x++){
          if (selected_listings[x].default_currency != currencies_same){
            currencies_same = false;
          }
          if (selected_listings[x].registrar_cost_currency != registrar_currencies_same){
            registrar_currencies_same = false;
          }
        }

      }
      //single listing edit
      else {
        var current_listing_info = getUserListingObjByName(req.user.listings, req.params.domain_name)
        var currencies_same = current_listing_info.default_currency;
        var registrar_currencies_same = current_listing_info.registrar_cost_currency;
      }

      if (!currencies_same &&                                                      //current default currencies are different
        !req.body.default_currency &&                                              //not changing currency with this call
        (req.body.min_price || req.body.buy_price || req.body.price_rate)          //trying to change a price
      ){
        error.handler(req, res, "You cannot edit pricing for multiple listings with differing default currencies. Please change the default currency as well.", "json");
      }
      else if (!registrar_currencies_same &&          //current default currencies are different
        !req.body.registrar_cost_currency &&          //not changing currency with this call
        req.body.registrar_cost                       //trying to change a price
      ){
        error.handler(req, res, "You cannot edit the registrar renewal cost for multiple listings with differing currencies. Please change the currency of the registrar renewal cost as well.", "json");
      }
      else {

        //multiplier for listing default currency
        var default_currency = (req.body.default_currency) ? req.body.default_currency : ((currencies_same) ? currencies_same : "USD");
        req.session.new_listing_info.default_currency_multiplier = Currencies.multiplier(default_currency);

        //multiplier for listing registrar currency
        var default_registrar_currency = (req.body.registrar_cost_currency) ? req.body.registrar_cost_currency : ((registrar_currencies_same) ? registrar_currencies_same : "USD");
        req.session.new_listing_info.default_registrar_currency_multiplier = Currencies.multiplier(default_registrar_currency);
        next();
      }
    },

    //</editor-fold>

    //<editor-fold>-------------------------------EXECUTE------------------------------

    //update a listing
    updateListingsInfo: function(req, res, next){

      //check if we're changing anything
      if (Object.keys(req.session.new_listing_info).length === 0 && req.session.new_listing_info.constructor === Object){
        error.handler(req, res, "nothing-changed", "json");
      }
      else {
        console.log("LOF: Updating domain details...");
        var domain_names = (req.path == "/listings/multiupdate") ? req.body.selected_ids.split(",") : [req.params.domain_name];

        listing_model.updateListingsInfo(domain_names, req.session.new_listing_info, function(result){
          if (result.state=="error"){ error.handler(req, res, result.info, "json"); }
          else {
            updateUserListingsObject(req, res, domain_names);
            res.json({
              state: "success",
              listings: (req.user) ? req.user.listings : false
            });
          }
        });
      }
    },

    //update a listing's registrar info
    updateListingsRegistrarInfo: function(req, res, next){
      console.log("LOF: Updating domain registrar details...");
      listing_model.updateListingsRegistrarInfo(req.session.new_listing_info, function(result){
        if (result.state=="error"){ error.handler(req, res, result.info, "json"); }
        else {
          var no_whois = req.session.no_whois || 0;
          var nothing_changed = req.session.nothing_changed || 0;
          delete req.session.new_listing_info;
          delete req.session.no_whois;
          delete req.session.nothing_changed;
          res.json({
            state: "success",
            listings: req.user.listings,
            no_whois : no_whois,
            nothing_changed : nothing_changed
          });
        }
      });
    },

    //delete a listing
    deleteListing: function(req, res, next){
      var listing_info = getUserListingObjByName(req.user.listings, req.params.domain_name);
      listing_model.deleteListing(listing_info.id, function(result){
        if (result.state=="error"){error.handler(req, res, result.info, "json")}
        else {
          deleteUserListingsObject(req, res, req.params.domain_name);
          res.json({
            state: "success",
            listings: req.user.listings
          });
        }
      });
    },

    //verify ownership of a listing
    verifyListing: function(req, res, next){
      console.log("LOF: Attempting to verify this listing...");

      var domain_name = req.params.domain_name;
      dns.resolve(domain_name, "A", function (err, address, family) {
        var domain_ip = address;
        dns.resolve("domahub.com", "A", function (err, address, family) {
          if (domain_ip && address && domain_ip[0] == address[0] && domain_ip.length == 1){
            req.session.new_listing_info = {
              domain_name: domain_name,
              verified: 1,
              status: 1
            }

            next();
          }
          else {
            res.json({
              state: "error"
            });
          }
        });
      });
    },

    //remove all listings from an ex-hub
    removeListingHubListings : function(req, res, next){
      if (parseFloat(req.body.hub) == 0){
        console.log("LOF: Attempting to remove all listings from ex-hub...");
        var selected_ids = req.body.selected_ids.split(",");
        listing_model.deleteHubGroupings(selected_ids, function(result){
          if (result.state != "success"){
            error.handler(req, res, "Something went wrong! Please refresh the page and try again.", "json");
          }
          else {

            //update backend listing obj
            for (var x = 0; x < req.user.listings.length; x++){
              for (var y = 0 ; y < selected_ids.length ; y++){
                if (req.user.listings[x].id == parseFloat(selected_ids[y])){
                  delete req.user.listings[x].hub_listing_ids;
                  break;
                }
              }
            }

            next();
          }
        });
      }
      else {
        next();
      }
    },

    //update a listing hub's listing_id ranks
    updateListingHubRanks : function(req, res, next){

      //if we're updating hub ranks
      if (req.body.hub_listing_ids && req.body.hub_listing_ids.split(",") && req.body.hub_listing_ids.split(",").length > 1){
        console.log("LOF: Attempting to update listing hub ranks...");
        var formatted_hub_deletions = [req.body.selected_ids.split(",")];
        listing_model.deleteHubGroupings(formatted_hub_deletions, function(result){
          if (result.state != "success"){
            error.handler(req, res, "Something went wrong! Please refresh the page and re-add your listings to their respective hubs.", "json");
          }
          else {
            //listing_id, listing_hub_id, rank
            var formatted_hub_additions = req.body.hub_listing_ids.split(",").map(function(elem, i){
              return [elem, req.body.selected_ids, i];
            });

            listing_model.addListingHubGrouping(formatted_hub_additions, function(result){
              if (result.state != "success"){
                error.handler(req, res, "Something went wrong! Please refresh the page and re-add your listings to their respective hubs.", "json");
              }
              else {
                //update object
                var current_listing_info = getUserListingObjByName(req.user.listings, req.params.domain_name);
                current_listing_info.hub_listing_ids = req.body.hub_listing_ids;
                next();
              }
            });
          }
        });
      }
      else {
        next();
      }
    },

    //</editor-fold>

  //</editor-fold>

  //<editor-fold>-------------------------------EXPENSES------------------------------

  //check expense info if it's legit
  checkExpenseDetails : function(req, res, next){
    console.log("LOF: Checking posted domain expense details...");

    if (!req.body.expense_name || req.body.expense_name.length > 100){
      error.handler(req, res, "That's an invalid name for a domain expense! Please enter something else and try again.", "json");
    }
    else if (!req.body.expense_date || !moment(req.body.expense_date).isValid()){
      error.handler(req, res, "That's an invalid date for a domain expense! Please enter something else and try again.", "json");
    }
    else if (!req.body.expense_cost || !validator.isFloat(req.body.expense_cost)){
      error.handler(req, res, "That's an invalid cost for a domain expense! Please enter something else and try again.", "json");
    }
    //invalid default currency
    else if (req.body.default_currency && (!req.user.currencies || !req.user.currencies.payment_currencies || req.user.currencies.payment_currencies.indexOf(req.body.default_currency) == -1)){
      error.handler(req, res, "That's an invalid default currency for a domain expense! Please select something else and try again.", "json");
    }
    else {
      next();
    }
  },

  //check expense IDs to make sure they are legit
  checkExpenseIDs : function(req, res, next){
    console.log("LOF: Checking posted domain expense IDs...");

    //check if all posted expense ids are legit
    var expense_ids_check = (req.body.expense_ids && Array.isArray(req.body.expense_ids)) ? req.body.expense_ids.every(function(item){
      return Number.isInteger(parseInt(item));
    }) : false;

    if (!req.body.expense_ids || !expense_ids_check){
      error.handler(req, res, "That's an invalid domain expense! Please refresh the page and try again.", "json");
    }
    else {
      next();
    }
  },

  //get any existing domain expenses
  getDomainExpenses : function(req, res, next){
    console.log("LOF: Getting existing domain expense details...");
    var selected_ids = req.body.selected_ids.split(",");
    listing_model.getDomainExpenses(selected_ids, function(result){
      if (result.state == "success"){
        var current_listing = false;
        for (var x = 0 ; x < result.info.length ; x++){
          var result_expense = result.info[x];
          var temp_expense_obj = {
            id : result_expense.id,
            expense_name : result_expense.expense_name,
            expense_date : result_expense.expense_date,
            expense_currency : result_expense.expense_currency,
            expense_cost : result_expense.expense_cost
          }
          if (!current_listing || current_listing.id != result_expense.listing_id){
            current_listing = getUserListingObjByID(req.user.listings, result_expense.listing_id);
            current_listing.expenses = [temp_expense_obj];
          }
          else {
            current_listing.expenses.push(temp_expense_obj);
          }
        }

        //nothing found! set to empty
        if (result.info.length == 0){
          for (var x = 0 ; x < selected_ids.length ; x++){
            getUserListingObjByID(req.user.listings, selected_ids[x]).expenses = [];
          }
        }

        //get new transactions
        if (req.user.transactions){
          delete req.user.transactions;
        }

        res.send({
          state : "success",
          listings : req.user.listings
        });
      }
      else {
        error.handler(req, res, result.info, "json");
      }
    });
  },

  //create a new domain expense
  createDomainExpense : function(req, res, next){
    console.log("LOF: Creating a new domain expense...");
    var domain_expenses = [];
    var selected_ids = req.body.selected_ids.split(",");
    var new_expense_obj = {
      expense_name : req.body.expense_name,
      expense_currency : req.body.expense_currency,
      expense_cost : parseFloat(req.body.expense_cost) * Currencies.multiplier(req.body.expense_currency),
      expense_date : moment(req.body.expense_date).valueOf()
    }

    //for all selected ids
    for (var x = 0 ; x < selected_ids.length ; x++){
      domain_expenses.push([
        selected_ids[x],
        new_expense_obj.expense_name,
        new_expense_obj.expense_currency,
        new_expense_obj.expense_cost,
        new_expense_obj.expense_date
      ]);
    }

    listing_model.newDomainExpenses(domain_expenses, function(result){
      if (result.state == "success"){
        //after creation, get expenses again
        if (req.user.transactions){
          delete req.user.transactions;
        }
        next();
      }
      else {
        error.handler(req, res, result.info, "json");
      }
    });
  },

  //delete an existing domain expense
  deleteDomainExpense : function(req, res, next){
    console.log("LOF: Deleting an existing domain expense...");
    listing_model.deleteDomainExpenses(req.body.expense_ids, function(result){
      if (result.state == "success"){

        //delete all existing expenses in listing objs
        var selected_ids = req.body.selected_ids.split(",");
        for (var x = 0 ; x < selected_ids.length ; x++){
          getUserListingObjByID(req.user.listings, selected_ids[x]).expenses = [];
        }

        //after deletion, get expenses again
        next();
      }
      else {
        error.handler(req, res, result.info, "json");
      }
    });
  },

  //</editor-fold>

}

//<editor-fold>-------------------------------HELPERS------------------------------

//helper function to update req.user.listings after updating a listing
function updateUserListingsObject(req, res, domain_names){
  if (req.user){
    for (var x = 0; x < req.user.listings.length; x++){
      for (var y = 0 ; y < domain_names.length ; y++){
        //matches ID (multiple)
        if (req.user.listings[x].id == parseFloat(domain_names[y])){
          req.user.listings[x] = Object.assign({}, req.user.listings[x], req.session.new_listing_info);
          break;
        }

        //matches domain name (singular)
        else if (req.user.listings[x].domain_name.toLowerCase() == domain_names[y].toLowerCase()){
          req.user.listings[x] = Object.assign({}, req.user.listings[x], req.session.new_listing_info);
          break;
        }
      }
    }

    delete req.session.new_listing_info;
  }
}

//helper function to update req.user.listings after deleting a listing
function deleteUserListingsObject(req, res, domain_name){
  if (req.user){
    for (var x = 0; x < req.user.listings.length; x++){
      if (req.user.listings[x].domain_name.toLowerCase() == domain_name.toLowerCase()){
        req.user.listings.splice(x, 1);
        break;
      }
    }
  }
}

//helper function to get the req.user listings object for a specific domain
function getUserListingObjByName(listings, domain_name){
  for (var x = 0; x < listings.length; x++){
    if (listings[x].domain_name.toLowerCase() == domain_name.toLowerCase()){
      return listings[x];
    }
  }
}

//helper function to get the req.user listings object for a specific listing id
function getUserListingObjByID(listings, id){
  for (var x = 0; x < listings.length; x++){
    if (listings[x].id == parseFloat(id)){
      return listings[x];
    }
  }
}

//</editor-fold>

//<editor-fold>-------------------------------LISTING CREATE HELPERS------------------------------

//check to see if domain name is legit
function checkPostedDomainName(user, domains_sofar, domain_name, min_price, buy_price){
  var bad_reasons = [];
  var parsed_domain = parseDomain(domain_name);

  //check domain
  if (parsed_domain == null || !validator.isFQDN(domain_name) || !validator.isAscii(domain_name)){
    bad_reasons.push("Invalid domain name!");
  }
  //subdomains are not allowed
  if (parsed_domain != null){
    if (parsed_domain.subdomain != ""){
      bad_reasons.push("No sub-domains!");
    }
  }
  //check for duplicates among valid FQDN domains
  if (domains_sofar.indexOf(domain_name) != -1){
    bad_reasons.push("Duplicate domain name!");
  }
  //check price rate
  if (min_price && !validator.isInt(min_price, { min : 0, allow_leading_zeroes : true })){
    bad_reasons.push("Invalid min. price!");
  }
  //check price rate
  if (buy_price && !validator.isInt(buy_price, { min : 0, allow_leading_zeroes : true })){
    bad_reasons.push("Invalid BIN price!");
  }
  //domain is too long
  if (domain_name.length > 100){
    bad_reasons.push("Domain name is too long!");
  }
  //too many domains (domains so far has 1 less right here, so needs to be >= maximum)
  if (!user.stripe_subscription_id && domains_sofar.length + user.listings.length >= 100){
    bad_reasons.push("Upgrade to a Premium account to create more listings!");
  }

  return bad_reasons;
}

//helper function to check existing req.user listings and compare with new user listings object
function findNewlyMadeListings(before_user_listings, after_user_listings){
  var inserted_ids = [];
  var inserted_domains = [];
  var inserted_listings = [];

  //find the insert ids of the newly inserted listings
  for (var x = 0; x < after_user_listings.length; x++){
    var exists = false;
    for (var y = 0; y < before_user_listings.length; y++){
      if (after_user_listings[x].id == before_user_listings[y].id){
        exists = true;
        break;
      }
    }

    if (!exists){
      inserted_ids.push([after_user_listings[x].id]);
      inserted_domains.push(after_user_listings[x].domain_name);
      inserted_listings.push(after_user_listings[x]);
    }
  }

  return {
    inserted_ids : inserted_ids,
    inserted_domains : inserted_domains,
    inserted_listings : inserted_listings
  };
}

//see what domains were successfully created (to check for duplicates with other owners)
function checkForCreatedListings(new_listings, inserted_domains, inserted_ids){
  console.log("LOF: Checking successfully created listings...");

  var formatted_listings = new_listings.db_object;
  var bad_listings = new_listings.bad_listings;
  var good_listings = new_listings.good_listings;
  var check_dns_promises = [];

  //loop through all formatted listings
  for (var x = 0; x < formatted_listings.length; x++){

    //figure out if this formatted listing was inserted or not
    var was_created = false;
    for (var y = 0; y < inserted_domains.length; y++){
      //was created! (aka didnt already exist by some other owner)
      if (formatted_listings[x][2] == inserted_domains[y]){
        was_created = true;
        var good_reasons_exist = false;
        var inserted_id = inserted_ids[y];    //corresponding insert ID for the inserted domain

        //check if good listings object exists for this domain (aka DNS settings updated via registrar)
        for (var z = 0 ; z < good_listings.length ; z++){
          if (good_listings[z].domain_name == formatted_listings[x][2]){
            good_reasons_exist = true;
            good_listings[z].reasons.unshift("Successfully created listing!");
            check_dns_promises.push(check_domain_dns_promise(good_listings[z].domain_name, inserted_id));
            break;
          }
        }

        //good listings object doesnt already exist for this domain
        if (!good_reasons_exist){
          good_listings.push({
            domain_name : formatted_listings[x][2],
            reasons: ["Successfully created listing!"]
          });
        }

        break;
      }
    }

    //wasnt created cuz it was already existing (owned by some other user)
    if (!was_created){

      //check if bad listings object exists for this domain
      var bad_reasons_exist = false;
      for (var z = 0 ; z < bad_listings.length ; z++){
        if (bad_listings[z].domain_name == formatted_listings[x][2]){
          bad_reasons_exist = true;
          bad_listings[z].reasons.push(["This domain name already exists!"]);
          break;
        }
      }

      //bad listings object doesnt already exist for this domain
      if (!bad_reasons_exist){
        bad_listings.push({
          domain_name : formatted_listings[x][2],
          reasons: ["This domain name already exists!"]
        });
      }
    }
  }

  new_listings.good_listings = good_listings;
  new_listings.check_dns_promises = check_dns_promises;
}

//check the inserted IDs and revert verification if necessary
function checkInsertedIDs(req, res, inserted_ids){
  console.log("LOF: Checking if we should revert verification status...");

  //delete user object listings so we can get a refreshed unverified version
  delete req.user.listings;
  var temp_new_listings = req.session.new_listings;
  delete req.session.new_listings;

  //nothing created
  if (inserted_ids.length == 0){
    res.send({
      bad_listings: temp_new_listings.bad_listings,
      good_listings: temp_new_listings.good_listings
    });
  }
  //revert the newly made listings verified to null
  else {
    listing_model.updateListingsVerified(inserted_ids, function(result){
      if (result.state == "success"){
        res.send({
          bad_listings: temp_new_listings.bad_listings,
          good_listings: temp_new_listings.good_listings
        });
      }
      else {
        error.handler(req, res, result.info, "json");
      }
    });
  }
}

  //<editor-fold>-------------------------------LISTING CREATE HELPERS (promises)------------------------------

  //promise function for verified DNS status change
  function verified_dns_promise(various_ids){
    var verified_dns_promise = Q.defer();
    if (various_ids.verified_ids.length > 0){
      console.log("LOF: Now setting status for successful DNS changes...");
      listing_model.updateListingsInfo(various_ids.verified_ids, {
        status : 1,
        verified : 1
      }, function(result){
        if (result.state == "error"){
          verified_dns_promise.reject({
            info : result.info,
            various_ids : various_ids
          });
        }
        else {
          verified_dns_promise.resolve(various_ids);
        }
      });
    }
    else {
      verified_dns_promise.resolve(various_ids);
    }
    return verified_dns_promise.promise;
  }

  //promise function for pending DNS status change
  function pending_dns_promise(various_ids){
    var pending_dns_promise = Q.defer();

    //if we error and have to wrap this object in a error obj
    var various_ids = (various_ids.info) ? various_ids.various_ids : various_ids;

    if (various_ids.pending_dns_ids.length > 0){
      console.log("LOF: Now setting status to pending DNS changes...");
      listing_model.updateListingsInfo(various_ids.pending_dns_ids, {
        status : 3,
        verified : 1
      }, function(result){
        if (result.state == "error"){
          pending_dns_promise.reject({
            info : result.info,
            various_ids : various_ids
          });
        }
        else {
          pending_dns_promise.resolve(various_ids);
        }
      });
    }
    else {
      pending_dns_promise.resolve(various_ids);
    }
    return pending_dns_promise.promise;
  }

  //returns a promise to figure out domain name whois
  function check_whois_promise(domain_name, index){
    return function(){
      return Q.Promise(function(resolve, reject, notify){
      console.log("LOF: Looking up WHOIS info for domain - " + domain_name + "...");

      //look up whois info
      whois.lookup(domain_name, function(err, data){
        if (err){
          error.log(err, "Failed to lookup WHOIS information for domain " + domain_name);
          reject(false);
        }
        else {
          var whoisObj = {};
          var array = parser.parseWhoIsData(data);
          for (var x = 0; x < array.length; x++){
            whoisObj[array[x].attribute.trim()] = array[x].value;
          }

          //only if the WHOIS object is legit
          if (whoisObj["Registrar"]){
            resolve({
              whois : whoisObj,
              index : index
            });
          }
          else {
            reject(false);
          }
        }
      });
    });
    }
  }

  //check a domain name to see if the DNS changes are good yet
  function check_domain_dns_promise(domain_name, inserted_id){
    return function (){
      console.log("LOF: Checking to see if domain is still pointed to DomaHub...");
      return Q.Promise(function(resolve, reject, notify){
        dns.resolve(domain_name, "A", function (err, address, family) {
          var domain_ip = address;
          dns.resolve("domahub.com", "A", function (err, address, family) {
            var doma_ip = address;
            if (err || !domain_ip || !address || domain_ip[0] != address[0] || domain_ip.length != 1){
              reject(inserted_id);
            }
            else {
              resolve(inserted_id);
            }
          });
        });
      });
    }
  }

  //</editor-fold>

//</editor-fold>

//<editor-fold>-------------------------------REGISTRAR DNS HELPERS------------------------------

//returns a promise to set DNS for godaddy domains
function set_dns_godaddy_promise(registrar_info, registrar_domain_name, listing_id){
  return function(){
    return Q.Promise(function(resolve, reject, notify){
    console.log("LOF: Setting DNS for GoDaddy domain - " + registrar_domain_name + "...");

    //A record change
    request({
      url: "https://api.godaddy.com/v1/domains/" + registrar_domain_name + "/records/A",
      method: "PUT",
      timeout: 10000,
      json : true,
      body : [
        {
          name : "@",
          data : "208.68.37.82"
        }
      ],
      headers: {
        "X-Shopper-Id" : encryptor.decryptText(registrar_info.username),
        Authorization : "sso-key " + encryptor.decryptText(registrar_info.api_key) + ":" + encryptor.decryptText(registrar_info.password)
      }
    }, function(err, response, body){
      if (err || response.statusCode != 200){
        if (err){
          error.log(err, "Failed to set DNS A record via GoDaddy.");
        }
        reject({
          domain_name : registrar_domain_name,
          reasons : ["Failed to connect to GoDaddy! Please verify ownership manually."],
          listing_id : listing_id
        });
      }
      else {
        //CNAME record change
        request({
          url: "https://api.godaddy.com/v1/domains/" + registrar_domain_name + "/records/CNAME",
          method: "PUT",
          json : true,
          body : [
            {
              name : "www",
              data : "@"
            }
          ],
          headers: {
            "X-Shopper-Id" : encryptor.decryptText(registrar_info.username),
            Authorization : "sso-key " + encryptor.decryptText(registrar_info.api_key) + ":" + encryptor.decryptText(registrar_info.password)
          }
        }, function(err, response, body){
          if (err || response.statusCode != 200){
            if (err){
              error.log(err, "Failed to set DNS CNAME record via GoDaddy.");
            }
            reject({
              domain_name : registrar_domain_name,
              reasons : ["Failed to connect to GoDaddy! Please verify ownership manually."],
              listing_id : listing_id
            });
          }
          else {
            resolve({
              domain_name : registrar_domain_name,
              reasons : ["Successfully set DNS records via registrar!"],
              listing_id : listing_id
            });
          }
        });
      }
    });

  });
  }
}

//returns a promise to set DNS for namecheap domains
function set_dns_namecheap_promise(registrar_info, registrar_domain_name, listing_id){
  return function(){
    return Q.Promise(function(resolve, reject, notify){
    console.log("LOF: Setting DNS for Namecheap domain - " + registrar_domain_name + "...");
    var username = encryptor.decryptText(registrar_info.username)
    var domain_name_split = registrar_domain_name.split(".");

    //A record change
    request({
      url: namecheap_url,
      method: "POST",
      timeout: 10000,
      qs : {
        ApiKey : encryptor.decryptText(registrar_info.api_key),
        ApiUser : username,
        UserName : username,
        ClientIp : "208.68.37.82",
        Command : "namecheap.domains.dns.setHosts",
        SLD : domain_name_split[0],
        TLD : domain_name_split[1],
        HostName1 : "@",
        RecordType1 : "A",
        Address1 : "208.68.37.82",
        HostName2 : "www",
        RecordType2 : "CNAME",
        Address2 : registrar_domain_name
      }
    }, function(err, response, body){
      if (err){
        error.log(err, "Failed to request Namecheap API while deleting DNS record of domain " + registrar_domain_name);
        reject({
          domain_name : registrar_domain_name,
          reasons : ["Failed to connect to Namecheap! Please verify ownership manually."],
          listing_id : listing_id
        });
      }
      else {
        parseString(body, {trim: true}, function (err, result) {
          if (err){
            error.log(body, "Failed to parse XML response from Namecheap while trying to delete DNS record of domain " + registrar_domain_name);
            reject({
              domain_name : registrar_domain_name,
              reasons : ["Failed to connect to Namecheap! Please verify ownership manually."],
              listing_id : listing_id
            });
          }
          else if (!result || !result.ApiResponse || !result.ApiResponse.$ || !result.ApiResponse.CommandResponse || result.ApiResponse.$.Status != "OK"){
            error.log(err, "Failed to set DNS records via Namecheap.");
            if (result && result.ApiResponse.Errors[0]){
              error.log(err, "Failed to set DNS records via Namecheap." + JSON.stringify(result.ApiResponse.Errors));
            }
            else {
              error.log(err, "Failed to set DNS records via Namecheap.");
            }
            reject({
              domain_name : registrar_domain_name,
              reasons : ["Failed to connect to Namecheap! Please verify ownership manually."],
              listing_id : listing_id
            });
          }
          else {
            resolve({
              domain_name : registrar_domain_name,
              reasons : ["Successfully set DNS records via registrar!"],
              listing_id : listing_id
            });
          }
        });
      }
    });

  });
  }
}

//returns a promise to set DNS for namesilo domains
function set_dns_namesilo_promise(registrar_info, registrar_domain_name, listing_id){
  return function(){
    return Q.Promise(function(resolve, reject, notify){
      console.log("LOF: Setting DNS for NameSilo domain - " + registrar_domain_name + "...");
      var namesilo_api_key = encryptor.decryptText(registrar_info.api_key);

      //get existing DNS records
      request({
        url: namesilo_url + "/dnsListRecords",
        method: "GET",
        timeout: 10000,
        qs : {
          version : 1,
          type : "xml",
          key : namesilo_api_key,
          domain : registrar_domain_name
        }
      }, function(err, response, body){
        if (err){
          error.log(err, "Failed to request NameSilo API while getting existing DNS records of domain " + registrar_domain_name);
          reject({
            domain_name : registrar_domain_name,
            reasons : ["Failed to connect to NameSilo! Please verify ownership manually."],
            listing_id : listing_id
          });
        }
        else {
          parseString(body, {
            trim: true,
            explicitRoot : false,
            explicitArray : false,
          }, function (err, result) {
            if (err){
              error.log(body, "Failed to parse XML response from NameSilo while getting existing DNS records of domain " + registrar_domain_name);
              reject({
                domain_name : registrar_domain_name,
                reasons : ["Failed to connect to NameSilo! Please verify ownership manually."],
                listing_id : listing_id
              });
            }
            else {
              if (!result || !result.reply || result.reply.code != "300"){
                error.log(err, "Failed to get existing DNS records of domain from NameSilo.");
                reject({
                  domain_name : registrar_domain_name,
                  reasons : ["Failed to connect to NameSilo! Please verify ownership manually."],
                  listing_id : listing_id
                });
              }
              //got the list of DNS records
              else {
                var delete_dns_promises = [];
                var existing_legit_records = 0;
                console.log("LOF: Checking for DNS records to delete for NameSilo domain - " + registrar_domain_name + "...");

                //check if the existing DNS records are good or should we delete
                if (result.reply.resource_record){
                  for (var x = 0 ; x < result.reply.resource_record.length ; x++){
                    //is not legit, let's delete it
                    if (
                      !(result.reply.resource_record[x].type == "A" && result.reply.resource_record[x].value == "208.68.37.82") &&
                      !(result.reply.resource_record[x].type == "CNAME" && result.reply.resource_record[x].host == ("www." + result.reply.resource_record[x].value))
                    ) {
                      delete_dns_promises.push(delete_dns_record_namesilo_promise(namesilo_api_key, registrar_domain_name, result.reply.resource_record[x].record_id));
                    }
                    else {
                      existing_legit_records++;
                    }
                  }
                }

                //deleted all DNS records
                var limit = qlimit(1);     //limit parallel promises (throttle)
                Q.allSettled(delete_dns_promises.map(limit(function(item, index, collection){
                  return delete_dns_promises[index]();
                }))).then(function(results) {
                  console.log("LOF: Checked existing DNS records for NameSilo domain - " + registrar_domain_name + "...");

                  //check if everything deleted successfully
                  var deleted_all_dns_records = true;
                  for (var x = 0 ; x < results.length ; x++){
                    if (results[x].state != "fulfilled"){
                      error.log(results[x].reason, "Something went wrong with deleting a DNS record for NameSilo domain - " + registrar_domain_name);
                      deleted_all_dns_records = false;    //something went wrong with deleting DNS records, mark reasons appropriately
                      break;
                    }
                  }

                  //if both records are not there
                  if (existing_legit_records < 2){
                    //add A record
                    addDNSRecordNameSilo(namesilo_api_key, registrar_domain_name, "A", "", "208.68.37.82", reject, function(){
                      //add CNAME record
                      addDNSRecordNameSilo(namesilo_api_key, registrar_domain_name, "CNAME", "www", registrar_domain_name, reject, function(){
                        resolve({
                          domain_name : registrar_domain_name,
                          reasons : [((!deleted_all_dns_records) ? "Failed to connect to NameSilo! Please verify ownership manually." : "Successfully set DNS records via registrar!")],
                          listing_id : listing_id
                        });
                      });
                    });
                  }
                  //both records exist already
                  else {
                    resolve({
                      domain_name : registrar_domain_name,
                      reasons : ["Successfully set DNS records via registrar!"],
                      listing_id : listing_id
                    });
                  }
                });
              }
            }
          });
        }
      });
    });
  }
}

//return a promise to delete a single DNS record on namesilo
function delete_dns_record_namesilo_promise(namesilo_api_key, registrar_domain_name, record_id){
  return function(){
    return Q.Promise(function(resolve, reject, notify){
    console.log("LOF: Deleting DNS record for NameSilo domain - " + registrar_domain_name + "...");

    //delete an existing DNS record
    request({
      url: namesilo_url + "/dnsDeleteRecord",
      method: "GET",
      timeout: 10000,
      qs : {
        version : 1,
        type : "xml",
        key : namesilo_api_key,
        domain : registrar_domain_name,
        rrid : record_id
      }
    }, function(err, response, body){
      if (err){
        error.log(err, "Failed to request NameSilo API while deleting DNS record of domain " + registrar_domain_name);
        reject("Failed to request to delete DNS record");
      }
      else {
        parseString(body, {
          trim: true,
          explicitRoot : false,
          explicitArray : false,
        }, function (err, result) {
          if (err){
            error.log(body, "Failed to parse XML response from NameSilo while trying to delete DNS record of domain " + registrar_domain_name);
            reject(body);
          }
          else if (!result || !result.reply || result.reply.code != "300"){
            reject("Failed to connect to NameSilo!");
          }
          else {
            resolve();
          }
        });
      }
    });
  });
  }
}

//add an A record for namesilo
function addDNSRecordNameSilo(namesilo_api_key, registrar_domain_name, rrtype, rrhost, rrvalue, reject, cb){
  console.log("LOF: Adding DNS record for NameSilo domain - " + registrar_domain_name + "...");

  //add A record for domahub
  request({
    url: namesilo_url + "/dnsAddRecord",
    method: "GET",
    timeout: 10000,
    qs : {
      version : 1,
      type : "xml",
      key : namesilo_api_key,
      domain : registrar_domain_name,
      rrtype : rrtype,
      rrhost : rrhost,
      rrvalue : rrvalue
    }
  }, function(err, response, body){
    if (err){
      error.log(err, "Failed to request NameSilo API while adding A record for domain " + registrar_domain_name);
      reject({
        domain_name : registrar_domain_name,
        reasons : ["Failed to connect to NameSilo! Please verify ownership manually."]
      });
    }
    else {
      parseString(body, {
        trim: true,
        explicitRoot : false,
        explicitArray : false,
      }, function (err, result) {
        if (err || !result){
          error.log(body, "Failed to parse XML response from NameSilo while adding A record for domain " + registrar_domain_name);
          reject({
            domain_name : registrar_domain_name,
            reasons : ["Failed to connect to NameSilo! Please verify ownership manually."]
          });
        }
        //already exists
        else if (result.reply && result.reply.code == "280" && result.reply.detail && result.reply.detail.indexOf("already exists") != -1){
          cb();
        }
        //successfully added
        else {
          cb();
        }
      });
    }
  });
}

//</editor-fold>
