//<editor-fold>-------------------------------DOMA LIB FUNCTIONS-------------------------------

var listing_model = require('../models/listing_model.js');
var account_model = require('../models/account_model.js');
var data_model = require('../models/data_model.js');

var Descriptions = require("../lib/descriptions.js");
var Categories = require("../lib/categories.js");
var Fonts = require("../lib/fonts.js");
var error = require('../lib/error.js');

//</editor-fold>

//<editor-fold>-------------------------------VARIABLES-------------------------------

var validator = require("validator");
var whois = require("whois");
var dns = require("dns");

var alexaData = require('alexa-traffic-rank');
var parser = require('parse-whois');
var moment = require('moment');

var request = require('request');
var fs = require('fs');
var path = require("path");
var safe_browse_key = "AIzaSyDjjsGtrO_4QwFDBA1cq9rCweeO4v3YLfs";

//contact for buy now requirements
var PNF = require('google-libphonenumber').PhoneNumberFormat;
var phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
var randomstring = require("randomstring");
var wNumb = require("wnumb");
var moneyFormat = wNumb({
  thousand: ',',
  prefix: '$',
  decimals: 0
});

//</editor-fold>

module.exports = {

  //<editor-fold>-------------------------------DELETE-------------------------------

  //delete session rental info if it exists
  deleteRentalInfo : function(req, res, next){
    if (req.session.rental_info && req.params.owner_hash_id != req.session.rental_info.owner_hash_id){
      console.log("F: Deleting any previous editable rental info...");
      delete req.session.proxy_edit;
    }
    if (req.session.rental_info && req.session.rental_info.domain_name != req.params.domain_name){
      console.log("F: Deleting any previous existing rental info...");
      delete req.session.rental_info;
    }
    next();
  },

  //delete pipe to DH session variable so we can redirect to DH.com now
  deletePipeToDH : function(req, res, next){
    if (typeof req.session.pipe_to_dh != "undefined"){
      console.log("F: Deleting the pipe to DH session variable...");
      delete req.session.pipe_to_dh;
    }
    next();
  },

  //</editor-fold>

  //<editor-fold>-------------------------------CREATE A NEW RENTAL-------------------------------

  //create a rental object for checking (for new)
  createNewRentalObject : function(req, res, next){
    req.session.new_rental_info = {
      domain_name : req.params.domain_name
    };

    next();
  },

  //check the rental info posted (for creating a new rental)
  checkRentalInfoNew : function(req, res, next){
    console.log("F: Checking posted rental info...");

    var address = addProtocol(req.body.address);
    var rental_type = parseFloat(req.body.rental_type);

    //check for address
    if (req.body.address && !validator.isURL(address, {protocols: ["http", "https"], require_protocol: true})){
      error.handler(req, res, "Invalid address!", "json");
    }
    //check for email if it was posted
    else if (!req.user && req.body.new_user_email && !validator.isEmail(req.body.new_user_email)){
      error.handler(req, res, "Invalid email!", "json");
    }
    //check for rental type
    else if (rental_type != 0 && rental_type != 1){
      error.handler(req, res, "Invalid rental type!", "json");
    }
    else {

      //create the new rental info db object
      var create_new_rental_info = function(){
        req.session.new_rental_info.rental_db_info = {
          date_created: new Date().getTime(),
          listing_id: req.session.listing_info.id,
          path: req.session.new_rental_info.path,
          type: rental_type,
          address: (req.body.address == "" || !req.body.address) ? "" : address    //empty address or not
        };
        req.session.new_rental_info.new_user_email = req.body.new_user_email;

        //if user is logged in, otherwise create a token for creation (and keep track of the email)
        if (req.user){
          req.session.new_rental_info.rental_db_info.account_id = req.user.id;
        }
        else {
          req.session.new_rental_info.rental_db_info.owner_hash_id = Math.random().toString(36).substr(5,5);
          req.session.new_rental_info.rental_db_info.owner_email = req.body.new_user_email;
        }
        next();
      }

      if (req.body.address){
        //check against google safe browsing
        googleSafeCheck(req, res, address, function () {
          console.log("F: Checking if its a valid HTTP address and that theres a response...");
          //check if its a valid HTTP address and that theres a response
          request(address, function (err, response, body) {
            if (!err) {
              create_new_rental_info();
            }
            else {
              error.handler(req, res, "There's something wrong with this address!", "json");
            }
          });
        });
      }
      else {
        create_new_rental_info();
      }
    }
  },

  //check times
  checkRentalTimes : function(req, res, next){
    console.log("F: Checking posted rental times...");

    var starttime = parseFloat(req.body.starttime);
    var endtime = parseFloat(req.body.endtime);
    var path = (req.session.new_rental_info.rental_db_info) ? req.session.new_rental_info.path : req.body.path;

    //no times posted
    if (!starttime || !endtime){
      error.handler(req, res, "Invalid dates! No times posted!", "json");
    }
    else {
      //check if its even a valid JS date
      var start_moment = moment(starttime);
      var end_moment = moment(endtime);

      //check if its a legit date
      if (!start_moment.isValid() || !end_moment.isValid()){
        error.handler(req, res, "Invalid dates!", "json");
      }

      //not divisible by hour blocks
      else if (end_moment.diff(start_moment) % 3600000 != 0){
        error.handler(req, res, "Invalid dates!", "json");
      }

      //start time in the past
      else if (start_moment.isBefore(moment().startOf("hour"))){
        error.handler(req, res, "Invalid start time!", "json");
      }

      //end date further than 1 year
      else if (end_moment.isAfter(moment().add(1, "year"))){
        error.handler(req, res, "Invalid end time!", "json");
      }

      //invalid time slot end
      else if (!end_moment.isSame(end_moment.subtract(1, "millisecond").endOf(req.session.listing_info.price_type).add(1, "millisecond"))){
        error.handler(req, res, "Invalid end time!", "json");
      }

      //invalid time slot start
      else if (moment().diff(moment().startOf(req.session.listing_info.price_type)) < 3600000 && !start_moment.isSame(start_moment.startOf(req.session.listing_info.price_type))){
        error.handler(req, res, "Invalid start time!", "json");
      }

      else {
        //check against the DB
        listing_model.crossCheckRentalTime(req.params.domain_name, path, starttime, endtime, function(result){
          if (result.state=="error"){error.handler(req, res, result.info, "json");}
          else {
            if (result.info.length > 0){
              error.handler(req, res, "Dates are unavailable!", "json");
            }
            //all good!
            else {
              req.session.new_rental_info.starttime = starttime;
              req.session.new_rental_info.endtime = endtime;
              req.session.new_rental_info.path = path;
              next();
            }
          }
        });
      }
    }
  },

  //calculate and check for the price
  checkRentalPrice : function(req, res, next){
    if (req.session.listing_info.price_rate != 0){
      console.log("F: Checking rental price...");
      var overlapped_time = anyFreeDayOverlap(req.body.starttime, req.body.endtime, req.session.listing_info.freetimes);
      var price = calculatePrice(req.body.starttime, req.body.endtime, overlapped_time, req.session.listing_info);

      //check for price
      if (price == "Not a valid price" || isNaN(price)){
        error.handler(req, res, "Invalid price!", "json");
      }
      else {
        req.session.new_rental_info.price = price;
        next();
      }
    }
    else {
      req.session.new_rental_info.price = 0;
      next();
    }
  },

  //get the stripe id of the listing owner if it exists
  getOwnerStripe : function(req, res, next){
    if (req.session.new_rental_info.price != 0){
      console.log("F: Getting all Stripe info for a listing...");

      //get the stripe id of the listing owner
      account_model.getStripeAndType(req.params.domain_name, function(result){
        if (result.state == "error"){error.handler(req, res, result.info, "json")}
        else {
          if (result.info[0].stripe_account){
            req.session.new_rental_info.owner_stripe_id = result.info[0].stripe_account;  //stripe id
          }
          next();
        }
      });
    }
    else {
      next();
    }
  },

  //time check was successful! redirect to checkout
  redirectToCheckout : function(req, res, next){
    console.log("F: Redirecting the user to the checkout page for final confirmation of rental...")
    res.send({
      state: "success"
    });
  },

  //renders the checkout page for creating a new rental
  renderCheckout : function(req, res, next){
    var domain_name = (typeof req.session.pipe_to_dh != "undefined") ? req.session.pipe_to_dh : req.params.domain_name;

    if (req.session.listing_info &&
        req.session.new_rental_info &&
        req.session.new_rental_info.domain_name.toLowerCase() == domain_name.toLowerCase() &&
        req.session.listing_info.domain_name.toLowerCase() == domain_name.toLowerCase()
      ){
      console.log("F: Rendering listing checkout page for renting...");

      res.render("listings/listing_checkout_rent.ejs", {
        user: req.user,
        listing_info: req.session.listing_info,
        new_rental_info : req.session.new_rental_info,
        node_env : process.env.NODE_ENV || "dev",
        compare: false
      });
    }
    else {
      console.log("F: Not checking out! Redirecting to listings page...");
      res.redirect("/listing/" + domain_name.toLowerCase());
    }
  },

  //create a new rental
  createRental : function(req, res, next){
    console.log("F: Creating a new rental...");

    //helper function, create a new rental
    newListingRental(req, res, req.session.new_rental_info.rental_db_info, function(rental_id){

      //format it with the new rental_id from above
      var starttime = req.session.new_rental_info.starttime;
      var endtime = req.session.new_rental_info.endtime;
      var new_rental_times = [rental_id, starttime, moment(endtime).diff(moment(starttime))];

      //helper function, create new rental times for the above new rental
      newRentalTimes(req, res, rental_id, [new_rental_times], function(){
        req.session.new_rental_info.rental_id = rental_id;
        next();
      });
    });
  },

  //activate the rental once its good
  toggleActivateRental : function(req, res, next){
    console.log("F: Toggling rental activation...");

    var rental_id = (req.session.new_rental_info) ? req.session.new_rental_info.rental_id : req.params.rental_id;
    var domain_name = req.params.domain_name;
    var owner_hash_id = (req.session.new_rental_info) ? req.session.new_rental_info.rental_db_info.owner_hash_id : false;

    listing_model.toggleActivateRental(rental_id, function(result){
      if (result.state != "success"){
        delete req.session.new_rental_info;
        error.handler(req, res, result.info);
      }
      else {
        if (req.user){
          delete req.user.rentals;
        }

        //update the session listing info rentals if we're creating a new rental
        if (req.session.listing_info.rentals && req.session.new_rental_info){
          req.session.listing_info.rentals.push(req.session.new_rental_info);
          req.session.listing_info.rentals = joinRentalTimes(req.session.listing_info.rentals);
        }

        next();
      }
    });
  },

  //rental was successful! (send new rental info)
  sendRentalSuccess : function(req, res, next){
    var rental_id = (req.session.new_rental_info) ? req.session.new_rental_info.rental_id : req.params.rental_id;
    var owner_hash_id = (req.session.new_rental_info.rental_db_info) ? req.session.new_rental_info.rental_db_info.owner_hash_id : false;
    delete req.session.new_rental_info;

    res.send({
      state: "success",
      rental_id: rental_id,
      owner_hash_id: owner_hash_id || false
    });
  },

  //</editor-fold>

  //<editor-fold>-------------------------------EDIT RENTAL-------------------------------

  //gets the rental/listing info
  getRental : function(req, res, next){
    console.log("F: Getting all rental info...");

    var rental_id = req.params.rental_id;

    //if its a number
    if ((parseFloat(rental_id) != rental_id >>> 0) && rental_id != "new"){
      error.handler(req, res, "Invalid rental!");
    }
    //get it otherwise
    else {
      listing_model.getRentalInfo(rental_id, function(result){
        if (result.state != "success"){error.handler(req, res, result.info);}
        //no rental exists
        else if (result.info.length == 0){
          error.handler(req, res, "Invalid rental!");
        }
        else {
          req.session.rental_info = result.info[0];
          next();
        }
      });
    }
  },

  //gets the rental times info
  getRentalRentalTimes : function(req, res, next){
    console.log("F: Getting all rental times for a rental...");

    var rental_id = req.params.rental_id;

    listing_model.getRentalRentalTimes(rental_id, function(result){
      if (result.state != "success"){error.handler(req, res, result.info);}
      else {
        req.session.rental_info.times = joinRentalTimes(result.info);
        next();
      }
    });
  },

  //create a rental object for checking (for edit)
  createRentalObject : function(req, res, next){
    req.session.rental_object = {
      db_object: {}
    };

    next();
  },

  //check domain name for rental
  checkRentalDomain : function(req, res, next){
    console.log("F: Checking if rental belongs to the correct domain...");
    var domain_name = req.params.domain_name;

    if (req.session.rental_info.domain_name.toLowerCase() != domain_name.toLowerCase()){
      error.handler(req, res, "Invalid domain name for rental!");
    }
    else {
      next();
    }
  },

  //check if rental belongs to account
  checkRentalOwner : function(req, res, next){
    console.log("F: Checking rental owner...");
    var owner_hash_id = req.params.owner_hash_id;
    //correct hash
    if (req.session.proxy_edit){
      next();
    }
    else if (req.params.owner_hash_id && req.params.owner_hash_id == req.session.rental_info.owner_hash_id){
      req.session.proxy_edit = true;
      next();
    }
    //incorrect owner!
    else if (req.user && req.session.rental_info.account_id != req.user.id){
      delete req.session.rental_info.owner_hash_id;
      req.session.proxy_edit = false;
      next();
    }
    //if hash exists in URL and its not the same, redirect to the normal rental
    else if (owner_hash_id && req.session.rental_info.owner_hash_id != owner_hash_id){
      delete req.session.rental_info.owner_hash_id;
      req.session.proxy_edit = false;
      next();
    }
    else {
      next();
    }
  },

  //check if domain belongs to account (for refunding a rental)
  checkDomainOwner : function(req, res, next){
    console.log("F: Checking domain owner...");

    listing_model.checkListingOwner(req.user.id, req.params.domain_name, function(result){
      //incorrect owner!
      if (result.state == "error" || result.info.length == 0){
        error.handler(req, res, "Invalid domain owner!");
      }
      else {
        next();
      }
    });
  },

  //check posted rental address or type (for editing rental address)
  checkRentalInfoEdit : function(req, res, next){
    console.log("F: Checking posted rental information...");

    var address = addProtocol(req.body.address);
    var rental_type = parseFloat(req.body.type);

    //check for address
    if (req.body.address && !validator.isURL(address, {protocols: ["http", "https"], require_protocol: true})){
      error.handler(req, res, "Invalid address!", "json");
    }
    //check for rental type
    else if (req.body.type && rental_type != 0 && rental_type != 1){
      error.handler(req, res, "Invalid rental type!", "json");
    }
    else {

      //edit the rental info db object
      var edit_rental_info_db = function(){
        //if type exists
        if (req.body.type){
          req.session.rental_object.db_object.type = req.body.type;
        }

        //if address exists
        if (req.body.address != "undefined"){
          req.session.rental_object.db_object.address = address;
        }
        else if (req.body.address == ""){
          req.session.rental_object.db_object.address = "";
        }

        next();
      }

      if (req.body.address){
        //check against google safe browsing
        googleSafeCheck(req, res, address, function(){
          //check if its a valid HTTP address and that theres a response
          request(address, function (err, response, body) {
            if (!err && response.statusCode == 200) {
              edit_rental_info_db();
            }
            else {
              error.handler(req, res, "Nothing displayed at that address!", "json");
            }
          });
        });
      }
      else {
        edit_rental_info_db();
      }
    }
  },

  //deactivate a rental
  deactivateRental : function(req, res, next){
    console.log("F: Deactivating rental...");
    req.session.rental_object.db_object.status = 0;
    next();
  },

  //updates the owner of a rental that has no owner (hash rental)
  updateRentalOwner : function(req, res, next){
    //if we're actually updating the owner of the rental
    if (req.user && req.params.owner_hash_id && req.params.owner_hash_id == req.session.rental_info.owner_hash_id){
      console.log("F: Updating the rental owner...");
      req.session.proxy_edit = true;
      delete req.session.rental_info.owner_hash_id;
      req.session.rental_object = {
        db_object : {
          account_id: req.user.id,
          owner_hash_id: null
        }
      }
      next();
    }
    //else delete the rental object to edit DB
    else {
      delete req.session.rental_object;
      next();
    }
  },

  //redirect to rental page after updating its owner
  redirectToRental: function(req, res, next){
    console.log("F: Redirecting to rental page...");

    delete req.session.rental_object.db_object;
    delete req.rental_info;
    res.redirect("/listing/" + req.params.domain_name + "/" + req.params.rental_id);
  },

  //check to make sure we should display edit overlay
  checkForPreview : function(req, res, next){
    console.log("F: Checking if preview is defined...");
    if (!req.session.rental_info){
      res.redirect("/");
    }
    else {
      //coming from /rentalpreview (endless loop)
      if (!req.session.rental_editted && req.header("Referer") && req.header("Referer").indexOf("rentalpreview") != -1){
        console.log("F: Something went wrong and triggered an endless loop!");
        res.render("proxy/proxy-error.ejs", {
          image: "",
          preview: req.session.proxy_edit,
          doma_rental_info : req.session.rental_info
        });
      }
      else {
        next();
      }
    }
  },

  //redirect to rental preview route
  redirectToPreview : function(req, res, next){
    console.log("F: Redirecting to rental preview...");
    res.redirect('/rentalpreview');
  },

  //render a rental edit page
  renderRental : function(req, res, next){
    console.log("F: Rendering rental...");

    //now rendering rental, delete any sensitive stuff
    if (!req.session.proxy_edit){
      delete req.session.rental_info.owner_hash_id;
      delete req.session.rental_info.owner_email;
    }
    delete req.session.rental_editted;

    //render the appropriate address
    if (req.session.rental_info.address && req.session.rental_info.type == 0){
      req.session.rented_info = req.session.rental_info;
      var address_request = request({
        url: addProtocol(req.session.rented_info.address),
        encoding: null
      }, function (err, response, body) {
        //not an image requested
        if (response.headers['content-type'].indexOf("image") == -1 && response.headers['content-type'].indexOf("pdf") == -1){
          console.log("F: Requested rental address was a website!");

          var index_path = path.resolve(process.cwd(), 'server', 'views', 'proxy', 'proxy-index.ejs');
          var preview_path = path.resolve(process.cwd(), 'server', 'views', 'proxy', 'proxy-preview.ejs');

          var proxy_index = fs.readFileSync(index_path);
          var proxy_preview = fs.readFileSync(preview_path);
          var rental_info_buffer = new Buffer("<script>var doma_rental_info = " + JSON.stringify(req.session.rental_info) + "</script>");
          var buffer_array = [body, proxy_index, proxy_preview, rental_info_buffer];

          //if authenticated to edit the rental preview
          if (req.session.proxy_edit){
            var edit_path = path.resolve(process.cwd(), 'server', 'views', 'proxy', 'proxy-edit.ejs');
            var proxy_preview = fs.readFileSync(edit_path);
            buffer_array.push(proxy_preview);
          }
          else {
            var noedit_path = path.resolve(process.cwd(), 'server', 'views', 'proxy', 'proxy-noedit.ejs');
            var proxy_nopreview = fs.readFileSync(noedit_path);
            buffer_array.push(proxy_nopreview);
          }

          if (!proxy_index || (req.session.proxy_edit && !proxy_preview) || (!req.session.proxy_edit && !proxy_nopreview)) {
            error.handler(req, res, "Invalid rental!");
          }
          else {
            res.set("content-type", response.headers["content-type"]);
            res.end(Buffer.concat(buffer_array));
          }
        }
        else {
          console.log("F: Requested rental address was an image/PDF!");

          res.render("proxy/proxy-image.ejs", {
            image: req.session.rental_info.address,
            content: response.headers['content-type'],
            edit: req.session.proxy_edit,
            preview: true,
            doma_rental_info : req.session.rental_info
          });
        }
      }).on('error', function(err){
        error.handler(req, res, "Invalid rental!");
      });
    }

    //render the blank template
    else {
      res.render("proxy/proxy-image.ejs", {
        image: "",
        edit: req.session.proxy_edit,
        preview: true,
        doma_rental_info : req.session.rental_info
      });
    }

  },

  //edit the rental (update the database)
  editRental : function(req, res, next){
    if (req.session.rental_object && req.session.rental_object.db_object){
      console.log("F: Updating rental...");

      listing_model.updateRental(req.params.rental_id, req.session.rental_object.db_object, function(result){
        if (result.state != "success"){error.handler(req, res, result.info, "json");}
        else {
          next();
        }
      });
    }
    else {
      next();
    }
  },

  //update the rental session object
  updateRentalObject : function(req, res, next){
    if (req.user){
      //update the user rentals object with anything thats changed
      updateUserRentalsObject(req.user.rentals, req.session.rental_object.db_object, req.params.rental_id);
    }
    else {
      //update the session rental info with anything that's changed
      for (x in req.session.rental_object.db_object){
        req.session.rental_info[x] = req.session.rental_object.db_object[x];
      }
    }
    req.session.rental_editted = true;
    delete req.session.rental_object;
    res.send({
      state: "success",
      rentals: (req.user) ? req.user.rentals : false
    });
  },

  //</editor-fold>

  //<editor-fold>-------------------------------DISPLAY LISTING-------------------------------

  //checks to make sure listing is still verified
  checkStillVerified : function(req, res, next){
    var domain_name = (typeof req.session.pipe_to_dh != "undefined") ? req.session.pipe_to_dh : req.params.domain_name;

    //ignore if unlisted
    if (req.session.listing_info.unlisted){
      next();
    }
    else {
      console.log("F: Checking to see if domain is still pointed to DomaHub...");

      dns.resolve(domain_name, "A", function (err, address, family) {
        //something went wrong in looking up DNS, just mark it inactive
        if (err){
          console.log("F: DNS error! Setting listing to inactive...");
          req.session.listing_info.status = 0;
          next();
        }
        else {
          var domain_ip = address;
          dns.resolve("domahub.com", "A", function (err, address, family) {
            //not pointed to DH anymore!
            if (!domain_ip || !address || domain_ip[0] != address[0] || domain_ip.length != 1){
              console.log("F: Listing is not pointed to DomaHub anymore! Reverting verification...");
              req.session.listing_info.status = 0;

              listing_model.updateListingsInfo(domain_name, {
                verified: null,
                status: 0
              }, function(result){

                //revert req.user.listings if req.user exists and is the owner of this domain
                if (req.user && req.user.listings && req.user.id == req.session.listing_info.owner_id){
                  delete getUserListingObj(req.user.listings, domain_name).verified;
                }

                getWhoIs(req, res, next, domain_name, true);
              });
            }

            //something went wrong in looking up DNS, just mark it inactive
            else if (err){
              console.log("F: DNS error! Setting listing to inactive...");
              req.session.listing_info.status = 0;
              next();
            }
            else {
              //if pending DNS changes, mark it active
              if (req.session.listing_info.status == 3){
                console.log("F: Listing is now pointed to DomaHub! Marking as active...");
                req.session.listing_info.status = 1;
                listing_model.updateListingsInfo(domain_name, {
                  status: 1
                }, function(result){
                  //change req.user.listings if req.user exists and is the owner of this domain
                  if (req.user && req.user.listings && req.user.id == req.session.listing_info.owner_id){
                    getUserListingObj(req.user.listings, domain_name).status = 1;
                  }
                  next();
                });
              }
              else {
                next();
              }

            }
          });
        }
      });
    }
  },

  //add to search database
  addToSearchHistory : function(req, res, next){
    //add to search only if not development
    if (process.env.NODE_ENV != "dev"){
      var domain_name = (typeof req.session.pipe_to_dh != "undefined") ? req.session.pipe_to_dh : req.params.domain_name;
      var account_id = (typeof req.user == "undefined") ? null : req.user.id;
      var now = new Date().getTime();
      var history_info = {
        account_id: account_id,      //who searched if who exists
        domain_name: domain_name.toLowerCase(),    //what they searched for
        timestamp: now,    //when they searched for it
        user_ip : getIP(req),
        referer : req.header("Referer") || req.headers.referer
      }

      //if it was a compare query
      if (req.query && req.query.compare == "true"){
        history_info.compare = true;
      }

      //what rental did it come from?
      if (req.query.camefrom && parseFloat(req.query.camefrom)){
        history_info.rental_id = req.query.camefrom;
        req.session.camefrom = req.query.camefrom;
      }

      console.log("F: Adding to search history...");
      data_model.newListingHistory(history_info, function(result){if (result.state == "error") {error.log(result, "Something went wrong with adding new history for listing.")}});  //async
      delete req.session.from_api;
    }
    next();
  },

  //clicked on check availability button
  addToAvailCheckHistory : function(req, res, next){
    //add to search only if not dev
    if (process.env.NODE_ENV != "dev"){
      var history_info = {
        account_id: (typeof req.user == "undefined") ? null : req.user.id,      //who searched if who exists
        domain_name: req.params.domain_name.toLowerCase(),                     //what they searched for
        timestamp: new Date().getTime(),                                      //when they searched for it
        user_ip : getIP(req),
        path: req.body.path,                                                     //what path did they want
        rental_id: req.session.camefrom || null                                   //what rental they came from
      }

      console.log("F: Adding to search history...");
      data_model.newCheckAvailHistory(history_info, function(result){if (result.state == "error") {error.log(result, "Something went wrong with adding new availability check history.")}});  //async
    }
    next();
  },

  //rendered checkout page, track it!!!
  addToRentalCheckoutHistory : function(req, res, next){
    //add to search only if not dev
    if (process.env.NODE_ENV != "dev"){
      var history_info = {
        account_id: (typeof req.user == "undefined") ? null : req.user.id,      //who searched if who exists
        domain_name: req.params.domain_name.toLowerCase(),                    //what they searched for
        timestamp: new Date().getTime(),                                      //when they searched for it
        user_ip : getIP(req),
        path: req.session.new_rental_info.path,                                 //what path did they want
        starttime: req.session.new_rental_info.starttime,                       //what start time
        endtime: req.session.new_rental_info.endtime,                           //what end time
        price: req.session.new_rental_info.price,                               //what price
        rental_id: req.session.camefrom || null                                 //what rental they came from
      }

      console.log("F: Adding to search history...");
      data_model.newCheckoutHistory(history_info, function(result){if (result.state == "error") {error.log(result, "Something went wrong with adding a new checkout history item.")}});  //async
    }
    next();
  },

  //checkout track
  addToCheckoutAction : function(req, res, next){
    var valid_ids = [
      'login-navbar',
      'step-header-log',
      'login-checkout',
      'guest-button',
      'new-user-email',
      'guest-submit',
      'email-skip',
      'step-header-site',
      'forward-choice',
      'link-choice',
      'build-choice',
      'address-forward-input',
      'forward-submit',
      'linkedin-example',
      'facebook-example',
      'instagram-example',
      'address-link-input',
      'link-submit',
      'imgur-example',
      'googleimages-example',
      'reddit-example',
      'address-build-input',
      'build-submit',
      'googlesites-example',
      'weebly-example',
      'squarespace-example',
      'wix-example',
      'shopify-example',
      'site-cancel',
      'step-header-payment',
      'back-to-address-button',
      'checkout-button',
      'rental-link-input',
      'rental-link-copy',
      'rental-preview-button',
      'edit-dates-path'
    ]

    //check to make sure the ids are legit
    if (valid_ids.indexOf(req.body.elem_id) == -1){
      console.log('Invalid tracker ID!')
      res.sendStatus(200);
    }
    //check to make sure domain is legit
    else if (req.params.domain_name != req.session.listing_info.domain_name){
      console.log('Invalid domain name!')
      res.sendStatus(200);
    }
    //okay add to DB
    else {
      var history_data = {
        domain_name : req.params.domain_name,
        timestamp: new Date().getTime(),
        rental_id: req.session.camefrom || null,                                //what rental they came from
        account_id: (typeof req.user == "undefined") ? null : req.user.id,      //who searched if who exists
        user_ip: getIP(req),
        elem_id: req.body.elem_id
      }

      data_model.newCheckoutAction(history_data, function(result){
        res.sendStatus(200);
      });
    }
  },

  //check if session listing_info exists and get listing info if it doesnt match with current domain_name
  checkSessionListingInfoPost : function(req, res, next){
    console.log("F: Checking if session listing info domain is same as posted domain...");
    var domain_name = (typeof req.session.pipe_to_dh != "undefined") ? req.session.pipe_to_dh : req.params.domain_name;

    if (req.session.listing_info && req.session.listing_info.domain_name.toLowerCase() == domain_name.toLowerCase()){
      next();
    }
    else {
      console.log("F: Not the correct domain! Getting new session listing info...");
      getVerifiedListing(req, res, domain_name, function(result){
        error.handler(req, res, "Something went wrong with this domain! Please refresh the page and try again.", "json");
      }, function(result){
        req.session.listing_info = result.info[0];
        next();
      });
    }
  },

  //gets the listing info if it is listed
  getListingInfo : function(req, res, next) {
    var domain_name = (typeof req.session.pipe_to_dh != "undefined") ? req.session.pipe_to_dh : req.params.domain_name;

    //skip listed check if we've already determined it's unlisted and got redirected to domahub from custom URL
    if (req.session.skip_listed_check == domain_name){
      console.log("F: Skipping database check for unlisted domain");
      var hostname = req.headers.host.replace(/^(https?:\/\/)?(www\.)?/,'');
      if (hostname != "domahub.com" && hostname != "localhost:8080" && hostname != "localhost"){
        delete req.session.skip_listed_check;
        req.session.skip_listed_check = domain_name;
        res.redirect("https://domahub.com/listing/" + hostname);
      }
      else {
        getWhoIs(req, res, next, domain_name, true);
      }
    }
    else {
      console.log("F: Checking if " + domain_name + " is listed on DomaHub...");

      getVerifiedListing(req, res, domain_name, function(result){
        //if unlisted and hostname isn't domahub, redirect to domahub
        var hostname = req.headers.host.replace(/^(https?:\/\/)?(www\.)?/,'');
        if (hostname != "domahub.com" && hostname != "localhost:8080" && hostname != "localhost"){
          req.session.skip_listed_check = domain_name;
          res.redirect("https://domahub.com/listing/" + hostname);
        }
        else {
          getWhoIs(req, res, next, domain_name, true);
        }
      }, function(result){
        //listed! go on with routes
        req.session.listing_info = result.info[0];
        getWhoIs(req, res, next, domain_name, false);
      });
    }
  },

  //gets the next year's events for calendar
  getListingTimes : function(req, res, next){
    console.log("F: Getting all time slot information for domain: " + req.params.domain_name + "...");

    //invalid path!
    if (req.body.path == undefined || (req.body.path != "" && !validator.isAlphanumeric(req.body.path))){
      error.handler(req, res, "Invalid path!", "json");
    }
    else {
      var one_year_later = moment().add(1, "year").add(1, "millisecond")._d.getTime();
      listing_model.getListingTimes(req.params.domain_name, req.body.path, one_year_later, function(result){
        if (result.state=="error"){error.handler(req, res, "Something went wrong with getting times!");}
        else {
          res.json({
            state : "success",
            times : result.info
          });
        }
      });
    }
  },

  //gets any free time periods for free rentals
  getListingFreeTimes : function(req, res, next){
    var domain_name = (typeof req.session.pipe_to_dh != "undefined") ? req.session.pipe_to_dh : req.params.domain_name;

    listing_model.getListingFreeTimes(domain_name, function(result){
      if (result.state =="success"){
        req.session.listing_info.freetimes = result.info;
      }
      next();
    });
  },

  //returns three listing belonging to same person
  getOtherListings : function(req, res, next){
    console.log("F: Finding other listings by same owner...");
    var owner_id = req.body.owner_id;
    var domain_name_exclude = req.body.domain_name_exclude;

    //make sure owner and domain exclude are legit
    if (validator.isFQDN(domain_name_exclude) && validator.isInt(owner_id)){
      listing_model.getTenRandomListingsByOwner(domain_name_exclude, owner_id, function(result){
        if (!result.info.length || result.state == "error"){
          res.send({
            state: "error"
          });
        }
        else {
          res.send({
            state: "success",
            listings: result.info
          });
        }
      });
    }
    else {
      res.send({
        state: "error"
      });
    }
  },

  //gets X ticker rows per call
  getListingTicker : function(req, res, next){
    console.log("F: Getting ticker data for " + req.params.domain_name + "...");

    //check to see that the posted old rental date is valid
    if (!moment(parseFloat(req.body.oldest_rental_date)).isValid()){
      error.handler(req, res, "Invalid last date for rental!", "json");
    }
    else if (!validator.isInt(req.body.max_count)){
      error.handler(req, res, "Invalid max count!", "json");
    }
    else {
      var max_count = parseFloat(req.body.max_count);

      //get all listing rentals from the DB
      listing_model.getListingRentals(req.params.domain_name, req.body.oldest_rental_date, max_count, function(result){
        if (result.state=="error"){error.handler(req, res, "Something went wrong getting rentals!", "json");}
        else if (result.info.length <= 0){
          res.send({
            loaded_rentals : []
          });
        }
        else {
          res.send({
            state: "success",
            loaded_rentals : result.info
          });
        }
      });
    }
  },

  //get the traffic of the listing
  getListingTraffic : function(req, res, next){
    console.log("F: Getting all traffic information for domain: " + req.params.domain_name + "...");

    data_model.getListingStats(req.params.domain_name, function(result){
      if (result.state=="error"){error.handler(req, res, "Invalid traffic!", 'json');}
      else {
        res.json({
          state : "success",
          traffic : result.info
        });
      }
    });
  },

  //get alexa traffic info
  getListingAlexa : function(req, res, next){
    console.log("F: Getting all Alexa information for domain: " + req.params.domain_name + "...");

    alexaData.AlexaWebData(req.params.domain_name, function(error, result) {
      if (error){error.handler(req, res, "Invalid Alexa!", 'json');}
      else {
        res.json({
          state : "success",
          alexa : result
        });
      }
    });
  },

  //redirect to the root domain if premium (prevent domain/listing/domain)
  redirectPremium : function(req, res, next){
    if (process.env.NODE_ENV != "dev" && req.session.listing_info.premium && req.path != "/"){
      console.log("F: Redirecting premium domain to root domain...");
      res.redirect('https://' + req.session.listing_info.domain_name);
    }
    else {
      next();
    }
  },

  //render a listing that is listed on domahub
  renderListing : function(req, res, next){
    console.log("F: Rendering listing...");

    res.render("listings/listing.ejs", {
      user: req.user,
      listing_info: req.session.listing_info,
      compare : (!req.session.listing_info.premium && req.query.compare == "true") ? true : false,
      fonts : Fonts.all()
    });
  },

  //</editor-fold>

  //<editor-fold-------------------------------RENTAL FORWARDING-------------------------------

  //catch future requests if rented (for dev environment and for rental preview)
  rentalForward : function(req, res, next){
    if (req.header("Referer") && req.header("Referer").indexOf("rentalpreview") != -1 && req.session.rented_info){
      var domain_url = parseDomain(req.session.rented_info.address);
      var protocol = url.parse(req.session.rented_info.address).protocol;

      console.log("F: Proxying future request for " + req.originalUrl + " along to " + protocol + "//www." + domain_url.domain + "." + domain_url.tld);
      req.pipe(request({
        url: protocol + "//www." + domain_url.domain + "." + domain_url.tld + req.originalUrl
      })).pipe(res);
    }
    //go next to 404
    else {
      next();
    }
  }

  //</editor-fold>

}

//<editor-fold>-------------------------------RENTAL TIME HELPERS-------------------------------

//helper function to create new rental times
function newRentalTimes(req, res, rental_id, times, callback){
  listing_model.newRentalTimes(rental_id, times, function(result){
    if (result.state != "success"){error.handler(req, res, result.info, "json");}
    else {
      callback();
    }
  });
}

//helper function to join all rental times
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
      if (temp_times[y].rental_id == temp_times[x].rental_id && x != y && orig_start == compare_end){
        temp_times[y].duration = temp_times[y].duration + temp_times[x].duration;
        temp_times.splice(x, 1);
        break;
      }
    }
  }

  return temp_times;
}

//</editor-fold>

//<editor-fold>-------------------------------HELPER FUNCTIONS-------------------------------

//get a verified listing's details
function getVerifiedListing(req, res, domain_name, callback_error, callback_success){
  listing_model.getVerifiedListing(domain_name, function(result){
    if (result.state=="error"){error.handler(req, res, "Invalid listing!");}
    else if (result.state=="success" && result.info.length <= 0){
      console.log("F: " + domain_name + " is NOT listed on DomaHub...");
      callback_error(result);
    }
    else {
      console.log("F: " +domain_name + " is listed on DomaHub!");
      callback_success(result);
    }
  });
}

//helper function to get a user's ip
function getIP(req){
  //nginx https proxy removes IP
  if (req.headers["x-real-ip"]){
    return req.headers["x-real-ip"];
  }
  else {
    return req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress;
  }
}

//helper function to create a new rental
function newListingRental(req, res, raw_info, callback){
  listing_model.newListingRental(req.session.listing_info.id, raw_info, function(result){
    if (result.state != "success"){error.handler(req, res, result.info, "json");}
    else {
      callback(result.info.insertId);
    }
  });
}

//helper function to check against google safe browsing
function googleSafeCheck(req, res, address, callback){
  console.log("F: Checking against Google Safe Browsing...");

  request({
    url: "https://safebrowsing.googleapis.com/v4/threatMatches:find?key=" + safe_browse_key,
    method: "POST",
    body: {
      "client": {
        "clientId": "domahub",
        "clientVersion": "1.0"
      },
      "threatInfo": {
        "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
        "threatEntryTypes": ["URL"],
        "threatEntries": [
          {"url": address}
        ]
      }
    },
    json: true
  }, function (err, response, body) {
    if (err || response.body.matches){
      error.handler(req, res, "Malicious address!", "json");
    }
    else {
      callback();
    }
  });
}

//helper function to run whois since domain isn't listed but is a real domain
function getWhoIs(req, res, next, domain_name, unlisted){
  whois.lookup(domain_name, function(err, data){
    //look up domain owner info
    var whoisObj = {};
    if (data){
      var array = parser.parseWhoIsData(data);
      for (var x = 0; x < array.length; x++){
        whoisObj[array[x].attribute.trim()] = array[x].value;
      }
    }

    //who is for unlisted only
    if (unlisted){
      var email = whoisObj["Registrant Email"] || whoisObj["Admin Email"] || whoisObj["Tech Email"] || "";
      var owner_name = whoisObj["Registrant Organization"] || whoisObj["Registrant Name"] || "Unknown";

      var listing_info = {
        domain_name: domain_name,
        email: email,
        username: owner_name,
        unlisted: true,
        date_registered: whoisObj["Creation Date"],
        date_updated: whoisObj["Updated Date"],
        registrar: whoisObj["Registrar"],
      }

      //development troubleshooting for whoisobj
      if (process.env.NODE_ENV == "dev"){
        listing_info.dev_whois = whoisObj;
      }

      //COMPARE TOOL VARIABLES
      //comparing, so make fake listing info
      if (req.query.compare == "true"){
        console.log("F: Rendering the comparison tool!");

        listing_info.username = "The Domain Master";
        listing_info.owner_id = "compare";
        listing_info.categories = Categories.randomFrontAsString();
        listing_info.date_created = new Date().getTime();
        listing_info.description = Descriptions.random();
        listing_info.description_footer = "The greatest domains in the industry.";
        listing_info.status = 1;
        listing_info.price_rate = Math.round(Math.random() * 250);
        listing_info.price_type = "day";
        listing_info.min_price = Math.ceil(Math.round(Math.random() * 10000)/1000)*1000;
        listing_info.buy_price = listing_info.min_price * 2;
        listing_info.rentable = 1;
        listing_info.primary_color = "#3CBC8D";
        listing_info.secondary_color = "#FF5722";
        listing_info.tertiary_color = "#2196F3";
        listing_info.font_color = "#000000";
        listing_info.font_name = "Rubik";
        listing_info.background_color = "#FFFFFF";
        listing_info.background_image = "";
        listing_info.logo = "";
        listing_info.domain_owner = 1;
        listing_info.domain_age = 1;
        listing_info.domain_list = 1;
        listing_info.domain_appraisal = 1;
        listing_info.social_sharing = 1;
        listing_info.traffic_module = 1;
        listing_info.traffic_graph = 1;
        listing_info.alexa_stats = 1;
        listing_info.history_module = 1;
        listing_info.info_module = 1;
      }

      //nobody owns it!
      else if (whoisObj["End Text"] && whoisObj["End Text"].indexOf("No match for domain ") != -1 && owner_name == "Unknown" && data){
        listing_info.available = true;
        listing_info.username = "Nobody yet!";
      }

      req.session.listing_info = listing_info;

      res.render("listings/listing.ejs", {
        user: req.user,
        listing_info: listing_info,
        compare : (req.query.compare == "true") ? true : false,
        fonts : Fonts.all()
      });
    }

    //domain is listed on DomaHub, we just need to get the registrar creation and last updated date
    else {
      //development troubleshooting for whoisobj
      if (process.env.NODE_ENV == "dev"){
        req.session.listing_info.dev_whois = whoisObj;
      }

      req.session.listing_info.date_updated = whoisObj["Updated Date"];
      req.session.listing_info.date_registered = whoisObj["Creation Date"];
      req.session.listing_info.registrar = whoisObj["Registrar"],

      next();
    }
  });
}

//helper function to add http or https
function addProtocol(address){
  if (address){
    if (!validator.isURL(address, {
      protocols: ["http", "https"],
      require_protocol: true
    })){
      address = "http://" + address;
    }
    return address;
  }
  else {
    return "";
  }
}

//helper function to get price of events
function calculatePrice(starttime, endtime, overlapped_time, listing_info){
  if (starttime && endtime && listing_info){
    var temp_start = moment(parseFloat(starttime));
    var temp_end = moment(parseFloat(endtime));

    //calculate the price
    var totalPrice = moment.duration(temp_end.diff(temp_start));
    totalPrice.subtract(overlapped_time);
    if (listing_info.price_type == "month"){
      totalPrice = totalPrice.asDays() / 30;
    }
    else {
      totalPrice = totalPrice.as(listing_info.price_type);
      totalPrice = Number(Math.round(totalPrice+'e2')+'e-2');
    }
    return totalPrice * listing_info.price_rate;
  }
  else {return "Not a valid price";}
}

//figure out if the start and end dates overlap any free periods
function anyFreeDayOverlap(starttime, endtime, freetimes){
  if (freetimes && freetimes.length > 0){
    var starttime = moment(parseFloat(starttime));
    var endtime = moment(parseFloat(endtime));

    var overlap_time = 0;
    for (var x = 0; x < freetimes.length; x++){
      var freetime_start = moment(freetimes[x].date);
      var freetime_end = moment(freetimes[x].date + freetimes[x].duration);

      //there is overlap
      if (starttime.isBefore(freetime_end) && endtime.isAfter(freetime_start)){
        //completely covered by free time
        if (starttime.isSameOrAfter(freetime_start) && endtime.isSameOrBefore(freetime_end)){
          overlap_time += endtime.diff(starttime);
        }
        //completely covers free time
        else if (freetime_start.isSameOrAfter(starttime) && freetime_end.isSameOrBefore(endtime)){
          overlap_time += freetime_end.diff(freetime_start);
        }
        //overlap partially in the end of wanted time
        else if (starttime.isSameOrBefore(freetime_start) && endtime.isSameOrBefore(freetime_end)){
          overlap_time += endtime.diff(freetime_start);
        }
        //overlap partially at the beginning of wanted time
        else {
          overlap_time += freetime_end.diff(starttime);
        }
      }
    }
    return overlap_time;
  }
  else {
    return 0;
  }
}

//helper function to update req.user.rentals after changing to active
function updateUserRentalsObject(user_rentals, db_rentals, rental_id){
  for (var x = user_rentals.length - 1; x >= 0; x--){
    if (user_rentals[x].rental_id == rental_id){

      //delete rental
      if (db_rentals.status == 0){
        user_rentals.splice(x, 1);
      }
      //copy changed settings
      else {
        for (y in db_rentals){
          user_rentals[x][y] = db_rentals[y];
        }
      }
      break;
    }
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

//</editor-fold>
