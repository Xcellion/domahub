//<editor-fold>-------------------------------DOMA LIB FUNCTIONS-------------------------------

var listing_model = require('../models/listing_model.js');
var account_model = require('../models/account_model.js');
var data_model = require('../models/data_model.js');

var Categories = require("../lib/categories.js");
var Fonts = require("../lib/fonts.js");
var Descriptions = require("../lib/descriptions.js");
var error = require('../lib/error.js');
var encryptor = require('../lib/encryptor.js');

//</editor-fold>

//<editor-fold>-------------------------------VARIABLES-------------------------------

var request = require("request");
var dns = require("dns");
var validator = require("validator");

var whois = require("whois");
var parser = require('parse-whois');

var multer = require("multer");
var parse = require("csv-parse");
var parseDomain = require("parse-domain");
var Q = require('q');
var fs = require('fs');

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
    console.log("F: Finding the all verified statistics for " + req.params.domain_name + "...");
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
      console.log("F: Checking all posted domain names...");
      var posted_domain_names = req.body.domain_names;

      if (posted_domain_names.length + req.user.listings.length > 100 && !req.user.stripe_subscription_id){
        error.handler(req, res, "max-domains-reached", "json");
      }
      else if (!posted_domain_names || posted_domain_names.length <= 0){
        error.handler(req, res, "You can't create listings without any domain names!", "json");
      }
      else if (posted_domain_names.length > 500){
        error.handler(req, res, "You can only create up to 500 domains at a time!", "json");
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
      console.log("F: Checking all posted listing info...");

      var posted_domain_names = req.body.domains;
      var bad_listings = [];
      var domains_sofar = [];
      var date_now = new Date().getTime();
      var db_object = [];

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
            parseFloat(posted_domain_names[x].min_price) || 0,
            parseFloat(posted_domain_names[x].buy_price) || 0,
            Descriptions.random()    //random default description
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
        console.log("F: Using registrar APIs to automatically verify listings!");
        var registrar_domain_promises = [];

        //add to the registrar info variable (for listing create)
        for (var x = 0 ; x < req.session.registrar_info.length ; x++){
          switch (req.session.registrar_info[x].registrar_name){
            case "godaddy":
              registrar_domain_promises = registrar_domain_promises.concat(setDNSGoDaddy(req.session.registrar_info[x], req.session.new_listings));
              break;
            case "namecheap":
              registrar_domain_promises.push(setDNSNameCheap(req.session.registrar_info[x]));
              break;
          }
        }

        //wait for all promises to finish
        Q.allSettled(registrar_domain_promises)
         .then(function(results) {
           console.log("F: Finished querying all registrars for domains!");

           for (var y = 0; y < results.length ; y++){
             //if there was an error, then add it to bad reasons
             if (results[y].state != "fulfilled"){
               req.session.new_listings.bad_listings.push({
                 domain_name : results[y].reason.domain_name,
                 reasons : results[y].reason.reasons
               });
             }
             //successfully changed DNS!
             else {
               req.session.new_listings.good_listings.push({
                 domain_name : results[y].value.domain_name,
                 reasons : results[y].value.reasons
               });
             }
           }

           next();
         });
      }

      //not using registrar tool! go next to manual creation
      else {
        next();
      }
    },

    //create listings
    createListings : function(req, res, next){
      console.log("F: Attempting to create listings...");

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
                Q.allSettled(req.session.new_listings.check_dns_promises)
                 .then(function(results) {
                   console.log("F: Finished checking DNS changes for newly created domains!");

                   //remove from the inserted_ids list
                   var pending_dns_ids = [];
                   var verified_ids = [];
                   for (var x = 0; x < results.length; x++){
                     if (results[x].state == "fulfilled"){
                       var index_of_dns_fail = inserted_ids.indexOf(results[x].value);
                       if (index_of_dns_fail > -1) {
                         inserted_ids.splice(index_of_dns_fail, 1);
                       }
                       //insert into an array of legit verified domains
                       verified_ids.push(results[x].value.toString());
                     }
                     else {
                       //insert into array of unverified domains (pending DNS propogation)
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
                   Q.fcall(verified_dns_function, various_ids)      //function to call, and the parameter
                    .then(pending_dns_function, pending_dns_function)   //function on success, function on error
                    .done(function(various_ids){
                     //see if we inserted anything and revert to unverified if necessary
                     checkInsertedIDs(req, res, various_ids.inserted_ids);
                   }, function(err){
                     error.handler(req, res, err.info, "json");
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

    //</editor-fold>

  //</editor-fold>

  //<editor-fold>-------------------------------UPDATE/DELETE------------------------------

    //<editor-fold>-------------------------------CHECKS (UPDATE LISTINGS)------------------------------

    //check if posted selected IDs are numbers
    checkSelectedIDs : function(req, res, next){
      console.log("F: Checking posted domain IDs...");
      var selected_ids = (req.body.selected_ids) ? req.body.selected_ids.split(",") : false;
      if (!selected_ids || selected_ids.length <= 0){
        error.handler(req, res, "You have selected invalid domains! Please refresh the page and try again!", "json");
      }
      else {
        var all_good = true;
        for (var x = 0 ; x < selected_ids.length ; x++){
          if (!validator.isInt(selected_ids[x], { min : 1 })){
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
          console.log("F: " + req.user.username + " is uploading an image file for parsing...");

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
            error.log(err, "something went wrong with an image upload");
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
            console.log("F: " + req.user.username + " is uploading image(s) to Imgur...");
            request.post({
              url: "https://imgur-apiv3.p.mashape.com/3/image",
              headers: {
                'X-Mashape-Key' : "72Ivh0ASpImsh02oTqa4gJe0fD3Dp1iZagojsn1Yt1hWAaIzX3",
                'Authorization' : 'Client-ID 730e9e6f4471d64'
              },
              formData: formData
            }, function (err, response, body) {
              if (!err){
                resolve({
                  imgur_link: JSON.parse(body).data.link.replace("http", "https"),
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
          req.session.new_listing_info = {};
          //figure out which promises failed / passed
          for (var y = 0; y < results.length; y++){
            if (results[y].state == "fulfilled"){
              req.session.new_listing_info[results[y].value.image_type] = results[y].value.imgur_link;
            }
          }

          //removing existing image(s) intentionally
          if (req.body.background_image == "" || req.body.background_image_link == ""){
            req.session.new_listing_info.background_image = null;
          }
          if (req.body.logo == "" || req.body.logo_image_link == ""){
            req.session.new_listing_info.logo = null;
          }
          next();
        });
      }
      else {
        req.session.new_listing_info = {};

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
      console.log("F: Checking listings for ownership, verification, or sold...");

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
      console.log("F: Checking if listing is a verified listing...");
      if (getUserListingObjByName(req.user.listings, req.params.domain_name).verified != 1){
        error.handler(req, res, "Please verify that you own this domain!", "json");
      }
      else {
        next();
      }
    },

    //check that the user owns the listing
    checkListingOwnerPost : function(req, res, next){
      console.log("F: Checking if current user is the owner...");
      if (getUserListingObjByName(req.user.listings, req.params.domain_name).owner_id != req.user.id){
        error.handler(req, res, "You do not own this domain! Please refresh the page and try again!", "json");
      }
      else {
        next();
      }
    },

    //check that the user owns the listing
    checkListingOwnerGet : function(req, res, next){
      console.log("F: Checking if current user is listing owner...");
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
      console.log("F: Checking if the listing was already purchased or accepted...");
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
      console.log("F: Checking posted listing status...");

      var status = parseFloat(req.body.status);

      //if status exists and is not 1 or 0
      if (req.body.status && status != 1 && status != 0){
        error.handler(req, res, "Invalid listing status!", "json");
      }
      //check to see if its currently rented
      else if (req.body.status == 0){
        console.log("F: Checking to see if domain(s) are currently rented...");
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
                  listing_id : listing_obj.id
                });
              }
              else {
                resolve({
                  address : address,
                  domain_name : listing_obj.domain_name,
                  listing_id : listing_obj.id
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
          console.log("F: Checking to see if domain(s) are still pointed to DomaHub...");

          dns.resolve("domahub.com", "A", function (err, address, family) {
            var doma_ip = address[0];

            //wait for all promises to finish
            Q.allSettled(to_verify_promises)
             .then(function(results) {
               var still_pointing = [];
               var not_pointing = [];

               //figure out if any failed, push to new promise array
               for (var x = 0; x < results.length; x++){
                 if (results[x].state == "fulfilled"){
                   if (doma_ip && results[x].value.address && doma_ip == results[x].value.address[0] && results[x].value.address.length == 1){
                     still_pointing.push(x);
                   }
                   else {
                     not_pointing.push(results[x].value.listing_id.toString());
                   }
                 }
                 else {
                   not_pointing.push(results[x].reason.listing_id.toString());
                 }
               }

               //some of the domains aren't pointing anymore
               if (not_pointing.length > 0){
                 console.log("F: Some domain(s) are not pointing to DomaHub! Reverting...");
                 //update not pointing domains
                 listing_model.updateListingsInfo(not_pointing, {
                   verified: null,
                   status: 0
                 }, function(result){
                   if (result.state == "error") { error.handler(req, res, result.info, "json"); }
                   else {
                     //for the next function
                     req.session.new_listing_info = {
                       verified: null,
                       status: 0
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
        console.log("F: Checking posted premium listing details...");

        //info module bools
        var info_module = parseFloat(req.body.info_module);
        var domain_owner = parseFloat(req.body.domain_owner);
        var domain_age = parseFloat(req.body.domain_age);
        var domain_list = parseFloat(req.body.domain_list);
        var domain_appraisal = parseFloat(req.body.domain_appraisal);
        var social_sharing = parseFloat(req.body.social_sharing);

        //traffic module bools
        var traffic_module = parseFloat(req.body.traffic_module);
        var traffic_graph = parseFloat(req.body.traffic_graph);
        var alexa_stats = parseFloat(req.body.alexa_stats);

        var history_module = parseFloat(req.body.history_module);

        //invalid footer description
        if (req.body.description_footer && (req.body.description_footer.length < 0 || req.body.description_footer.length > 75)){
          error.handler(req, res, "The footer description cannot be more than 75 characters!", "json");
        }
        //invalid domain capitalization
        else if (req.body.domain_name && req.body.domain_name.toLowerCase() != getUserListingObjByName(req.user.listings, req.params.domain_name).domain_name.toLowerCase()){
          error.handler(req, res, "That's an invalid domain name capitalization. Please try again!", "json");
        }
        //invalid primary color
        else if (req.body.primary_color && !validator.isHexColor(req.body.primary_color)){
          error.handler(req, res, "Invalid primary color! Please choose a different color!", "json");
        }
        //invalid secondary color
        else if (req.body.secondary_color && !validator.isHexColor(req.body.secondary_color)){
          error.handler(req, res, "Invalid secondary color! Please choose a different color!", "json");
        }
        //invalid tertiary color
        else if (req.body.tertiary_color && !validator.isHexColor(req.body.tertiary_color)){
          error.handler(req, res, "Invalid tertiary color! Please choose a different color!", "json");
        }
        //invalid font color
        else if (req.body.font_color && !validator.isHexColor(req.body.font_color)){
          error.handler(req, res, "Invalid font color! Please choose a different color!", "json");
        }
        //invalid font name
        else if (req.body.font_name && Fonts.all().indexOf(req.body.font_name) == -1){
          error.handler(req, res, "Invalid font name! Please choose a different font!", "json");
        }
        //invalid background color
        else if (req.body.background_color && !validator.isHexColor(req.body.background_color)){
          error.handler(req, res, "Invalid background color! Please choose a different color!", "json");
        }
        //invalid background link
        else if (req.body.background_image_link && !validator.isURL(req.body.background_image_link)){
          error.handler(req, res, "Invalid background URL! Please enter a different URL!", "json");
        }
        //invalid logo link
        else if (req.body.logo_image_link && !validator.isURL(req.body.logo_image_link)){
          error.handler(req, res, "Invalid logo URL! Please enter a different URL!", "json");
        }
        //invalid domain owner
        else if (req.body.domain_owner && (domain_owner != 0 && domain_owner != 1)){
          error.handler(req, res, "Invalid domain owner selection! Please refresh the page and try again!", "json");
        }
        //invalid domain age
        else if (req.body.domain_age && (domain_age != 0 && domain_age != 1)){
          error.handler(req, res, "Invalid domain age selection! Please refresh the page and try again!", "json");
        }
        //invalid domain list
        else if (req.body.domain_list && (domain_list != 0 && domain_list != 1)){
          error.handler(req, res, "Invalid domain list selection! Please refresh the page and try again!", "json");
        }
        //invalid domain appraisal
        else if (req.body.domain_appraisal && (domain_appraisal != 0 && domain_appraisal != 1)){
          error.handler(req, res, "Invalid domain appraisal selection! Please refresh the page and try again!", "json");
        }
        //invalid social sharing
        else if (req.body.social_sharing && (social_sharing != 0 && social_sharing != 1)){
          error.handler(req, res, "Invalid social sharing selection! Please refresh the page and try again!", "json");
        }
        //invalid traffic module
        else if (req.body.traffic_module && (traffic_module != 0 && traffic_module != 1)){
          error.handler(req, res, "Invalid traffic module selection! Please refresh the page and try again!", "json");
        }
        //invalid traffic graph module
        else if (req.body.traffic_graph && (traffic_graph != 0 && traffic_graph != 1)){
          error.handler(req, res, "Invalid traffic graph selection! Please refresh the page and try again!", "json");
        }
        //invalid Alexa stats module
        else if (req.body.alexa_stats && (alexa_stats != 0 && alexa_stats != 1)){
          error.handler(req, res, "Invalid Alexa stats selection! Please refresh the page and try again!", "json");
        }
        //invalid history module
        else if (req.body.history_module && (history_module != 0 && history_module != 1)){
          error.handler(req, res, "Invalid history module selection! Please refresh the page and try again!", "json");
        }
        //invalid info module
        else if (req.body.info_module && (info_module != 0 && info_module != 1)){
          error.handler(req, res, "Invalid info module selection! Please refresh the page and try again!", "json");
        }
        //all good!
        else {

          //set the new listing info
          if (!req.session.new_listing_info) {
            req.session.new_listing_info = {};
          }

          //info
          req.session.new_listing_info.description_footer = req.body.description_footer;
          req.session.new_listing_info.domain_name = req.body.domain_name;

          //design
          req.session.new_listing_info.primary_color = req.body.primary_color;
          req.session.new_listing_info.secondary_color = req.body.secondary_color;
          req.session.new_listing_info.tertiary_color = req.body.tertiary_color;
          req.session.new_listing_info.font_name = req.body.font_name;
          req.session.new_listing_info.font_color = req.body.font_color;
          req.session.new_listing_info.background_color = req.body.background_color;

          //info module
          req.session.new_listing_info.info_module = info_module;
          req.session.new_listing_info.domain_owner = domain_owner;
          req.session.new_listing_info.domain_age = domain_age;
          req.session.new_listing_info.domain_list = domain_list;
          req.session.new_listing_info.domain_appraisal = domain_appraisal;
          req.session.new_listing_info.social_sharing = social_sharing;

          //traffic module
          req.session.new_listing_info.traffic_module = traffic_module;
          req.session.new_listing_info.traffic_graph = traffic_graph;
          req.session.new_listing_info.alexa_stats = alexa_stats;

          req.session.new_listing_info.history_module = history_module;

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
        if (req.body.primary_color ||
          req.body.secondary_color ||
          req.body.tertiary_color ||
          req.body.font_name ||
          req.body.font_color ||
          req.body.background_color ||
          req.body.background_image_link ||
          req.body.logo_image_link ||
          req.body.info_module ||
          req.body.domain_owner ||
          req.body.domain_age ||
          req.body.domain_list ||
          req.body.domain_appraisal ||
          req.body.social_sharing ||
          req.body.traffic_module ||
          req.body.traffic_graph ||
          req.body.alexa_stats ||
          req.body.history_module ||
          req.body.domain_name ||
          req.body.description_footer
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
      console.log("F: Checking posted listing details...");

      var status = parseFloat(req.body.status);
      var description = req.body.description;
      var description_hook = req.body.description_hook;

      //prices
      var price_rate = req.body.price_rate;
      var price_type = req.body.price_type;
      var buy_price = req.body.buy_price;
      var min_price = req.body.min_price;

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

      //invalid short description
      if (req.body.description_hook && (description_hook.length < 0 || description_hook.length > 75)){
        error.handler(req, res, "Invalid short listing description!", "json");
      }
      //no paths
      else if (req.body.paths && paths_clean.length == 0){
        error.handler(req, res, "Invalid example pathes!", "json");
      }
      //invalid categories
      else if (req.body.categories && categories_clean.length == 0){
        error.handler(req, res, "Invalid categories!", "json");
      }
      //invalid price type
      else if (req.body.price_type && ["month", "week", "day"].indexOf(price_type) == -1){
        error.handler(req, res, "Invalid rental price type!", "json");
      }
      else if (req.body.price_rate && !validator.isInt(price_rate)){
        error.handler(req, res, "Rental price must be a whole number!", "json");
      }
      else if (req.body.buy_price && !validator.isInt(buy_price) && buy_price != 0){
        error.handler(req, res, "The buy it now price must be a whole number!", "json");
      }
      else if (req.body.min_price && !validator.isInt(min_price) && min_price != 0){
        error.handler(req, res, "The minimum price must be a whole number!", "json");
      }
      else if (rentable && rentable != 1 && rentable != 0){
        error.handler(req, res, "Invalid option! Please refresh the page and try again!", "json");
      }
      else {
        if (!req.session.new_listing_info) {
          req.session.new_listing_info = {};
        }
        req.session.new_listing_info.status = status;
        req.session.new_listing_info.description = description;
        req.session.new_listing_info.description_hook = description_hook;
        req.session.new_listing_info.price_type = price_type;
        req.session.new_listing_info.price_rate = price_rate;
        req.session.new_listing_info.buy_price = (buy_price == "" || buy_price == 0) ? "" : buy_price;
        req.session.new_listing_info.min_price = (min_price == "" || min_price == 0) ? "" : min_price;
        req.session.new_listing_info.categories = (categories_clean == "") ? null : categories_clean;
        req.session.new_listing_info.paths = (paths_clean == "") ? null : paths_clean;
        req.session.new_listing_info.rentable = rentable;

        //delete anything that wasnt posted (except if its "", in which case it was intentional deletion)
        for (var x in req.session.new_listing_info){
          if (!req.body[x] && req.body[x] != "" && x != "background_image" && x != "logo"){
            delete req.session.new_listing_info[x];
          }
        }
        next();
      }
    },

    //turn off specific modules if it's contents are all hidden (and vice versa)
    checkListingModules : function(req, res, next){
      console.log("F: Checking if we should turn off specific modules if contents are empty...");
      var current_listing_info = getUserListingObjByName(req.user.listings, req.params.domain_name);

      //info module
      if ((req.session.new_listing_info.domain_owner == 0 || (!req.body.domain_owner && current_listing_info.domain_owner == 0)) &&
          (req.session.new_listing_info.domain_age == 0 || (!req.body.domain_age && current_listing_info.domain_age == 0)) &&
          (req.session.new_listing_info.domain_list == 0 || (!req.body.domain_list && current_listing_info.domain_list == 0)) &&
          (req.session.new_listing_info.domain_appraisal == 0 || (!req.body.domain_appraisal && current_listing_info.domain_appraisal == 0)) &&
          (req.session.new_listing_info.social_sharing == 0 || (!req.body.social_sharing && current_listing_info.social_sharing == 0)) &&
          (req.session.new_listing_info.categories == "" || (!req.body.categories && current_listing_info.categories == ""))
      ){
        req.session.new_listing_info.info_module = 0;
      }
      else {
        req.session.new_listing_info.info_module = 1;
      }

      //traffic module
      if ((req.session.new_listing_info.traffic_graph == 0 || (!req.body.traffic_graph && current_listing_info.traffic_graph == 0)) &&
          (req.session.new_listing_info.alexa_stats == 0 || (!req.body.alexa_stats && current_listing_info.alexa_stats == 0))
      ){
        req.session.new_listing_info.traffic_module = 0;
      }
      else {
        req.session.new_listing_info.traffic_module = 1;
      }

      next();
    },

    //</editor-fold>

    //<editor-fold>-------------------------------EXECUTE------------------------------

    //update a listing
    updateListingsInfo: function(req, res, next){

      //check if we're changing anything
      if (Object.keys(req.session.new_listing_info).length === 0 && req.session.new_listing_info.constructor === Object){
        res.json({
          state: "success",
          listings: (req.user) ? req.user.listings : false
        });
      }
      else {
        console.log("F: Updating domain details...");
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
      console.log("F: Attempting to verify this listing...");

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

    //</editor-fold>

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
  if (min_price && !validator.isInt(min_price, {min: 0})){
    bad_reasons.push("Invalid min. price!");
  }
  //check price rate
  if (buy_price && !validator.isInt(buy_price, {min: 0})){
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
  console.log("F: Checking successfully created listings...");

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
            check_dns_promises.push(checkDomainDNS(good_listings[z].domain_name, inserted_id));
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
  console.log("F: Checking if we should revert verification status...");

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

//promise function for verified DNS status change
function verified_dns_function(various_ids){
  var verified_dns_promise = Q.defer();
  if (various_ids.verified_ids.length > 0){
    console.log("F: Now setting status for successful DNS changes...");
    listing_model.updateListingsInfo(various_ids.verified_ids, {
      status : 0,
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
function pending_dns_function(various_ids){
  var pending_dns_promise = Q.defer();

  //if we error and have to wrap this object in a error obj
  var various_ids = (various_ids.info) ? various_ids.various_ids : various_ids;

  if (various_ids.pending_dns_ids.length > 0){
    console.log("F: Now setting status to pending DNS changes...");
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

//</editor-fold>

//<editor-fold>-------------------------------REGISTRAR DNS HELPERS------------------------------

//returns an array of promises to set DNS for godaddy domains
function setDNSGoDaddy(registrar_info, new_listings){
  var temp_promises = [];

  //loop through all domains and build a custom promise function to set DNS for each
  for (var x = 0 ; x < registrar_info.domains.length ; x++){

    //if domain name is being created on domahub (not all domains in registrar)
    for (var y = 0 ; y < new_listings.db_object.length ; y++){
      if (new_listings.db_object[y][2].toLowerCase() == registrar_info.domains[x].domain_name.toLowerCase()){
        var temp_promise = Q.Promise(function(resolve, reject, notify){
          console.log("F: Setting DNS for GoDaddy domain - " + registrar_info.domains[x].domain_name + "...");
          var domain_name = registrar_info.domains[x].domain_name.toLowerCase();

          //A record change
          request({
            url: "https://api.godaddy.com/v1/domains/" + domain_name + "/records/A",
            method: "PUT",
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
              reject({
                domain_name : domain_name,
                reasons : ["Failed to connect to GoDaddy! Please verify ownership manually."]
              });
            }
            else {

              //CNAME record change
              request({
                url: "https://api.godaddy.com/v1/domains/" + domain_name + "/records/CNAME",
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
                  reject({
                    domain_name : domain_name,
                    reasons : ["Failed to connect to GoDaddy! Please verify ownership manually."]
                  });
                }
                else {
                  resolve({
                    domain_name : domain_name,
                    reasons : ["Successfully set DNS records via registrar!"]
                  });
                }
              });
            }
          });

        });

        temp_promises.push(temp_promise);
        break;
      }
    }
  }

  return temp_promises;
}

//returns an array of promises to set DNS for namecheap domains
function setDNSNameCheap(registrar_info){

}

//check a domain name to see if the DNS changes are good yet
function checkDomainDNS(domain_name, inserted_id){
  console.log("F: Checking to see if domain is still pointed to DomaHub...");
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

//</editor-fold>