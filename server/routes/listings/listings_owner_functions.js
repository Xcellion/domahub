var node_env = process.env.NODE_ENV || 'dev';   //dev or prod bool
var Categories = require("../../lib/categories.js");
var default_descriptions = require("../../lib/default_descriptions.js");

var request = require("request");
var dns = require("dns");
var validator = require("validator");

var whois = require("whois");
var parser = require('parse-whois');

var multer = require("multer");
var parse = require("csv-parse");
var Q = require('q');
var fs = require('fs');

module.exports = {

  //<editor-fold>-------------------------------RENDERS-------------------------------

  //function to display the create listing choice page
  renderCreateListing : function(req, res, next){
    res.render("listings/listing_create.ejs", {
      user: req.user,
      message: Auth.messageReset(req)
    });
  },

  //function to display the create multiple listing page
  renderCreateListingMultiple : function(req, res, next){
    res.render("listings/listing_create_multiple.ejs", {
      user: req.user,
      message: Auth.messageReset(req)
    });
  },

  //</editor-fold>

  //<editor-fold>-------------------------------CHECKS------------------------------

  //function to check all posted domain names
  checkPostedDomains : function(req, res, next){
    console.log("F: Checking all posted domain names...");
    var domain_names = req.body.domain_names;

    if (!domain_names || domain_names.length <= 0){
      error.handler(req, res, "domain_names", "json");
    }
    else {
      //loop through and check all posted domain names
      var bad_listings = [];
      var good_listings = [];
      var domains_sofar = [];
      for (var x = 0; x < domain_names.length; x++){
        if (!validator.isFQDN(domain_names[x])){
          bad_listings.push({
            domain_name: domain_names[x],
            reasons: [
              "Invalid domain name!"
            ]
          });
        }
        else if (domains_sofar.indexOf(domain_names[x]) != -1){
          bad_listings.push({
            domain_name: domain_names[x],
            reasons: [
              "Duplicate domain name!"
            ]
          });
        }
        else {
          domains_sofar.push(domain_names[x]);
          good_listings.push({
            index: x,
            domain_name: domain_names[x]
          });
        }
      }

      res.send({
        bad_listings : bad_listings,
        good_listings : good_listings
      });
    }
  },

  //function to check all posted listing info
  checkPostedListingInfoForCreate : function(req, res, next){
    console.log("F: Checking all posted listing info...");

    var posted_domains = req.body.domains;

    var bad_listings = [];
    var domains_sofar = [];
    var date_now = new Date().getTime();
    var db_object = [];

    //object to keep track of premium domains
    var premium_obj = {
      count : 0,
      indexes : [],
      domain_names : []
    };

    for (var x = 0; x < posted_domains.length; x++){
      var bad_reasons = [];

      //check domain
      if (!validator.isFQDN(posted_domains[x].domain_name) || !validator.isAscii(posted_domains[x].domain_name)){
        bad_reasons.push("Invalid domain name!");
      }
      //check for duplicates among valid FQDN domains
      if (domains_sofar.indexOf(posted_domains[x].domain_name) != -1){
        bad_reasons.push("Duplicate domain name!");
      }
      //check price rate
      if (!validator.isInt(posted_domains[x].buy_price, {min: 0}) && posted_domains[x].buy_price != ""){
        bad_reasons.push("Invalid price!");
      }
      //domain is too long
      if (posted_domains[x].domain_name.length > 100){
        bad_reasons.push("Domain name is too long!");
      }

      //some were messed up
      if (bad_reasons.length > 0){
        bad_listings.push({
          index: x,
          reasons: bad_reasons
        });
      }
      //all good! format the db array
      else {
        //update the premium object if its premium
        if (posted_domains[x].premium == "true"){
          premium_obj.count++;
          premium_obj.domain_names.push([posted_domains[x].domain_name]);
        }
        domains_sofar.push(posted_domains[x].domain_name);

        //format the object for DB insert
        db_object.push([
          req.user.id,
          date_now,
          posted_domains[x].domain_name.toLowerCase(),
          posted_domains[x].buy_price,
          default_descriptions.random()    //random default description
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
        premium_obj : premium_obj,
        db_object : db_object,
        good_listings : [],
        bad_listings : bad_listings
      }
      next();
    }
  },

  //function to send back how many premium domains
  checkPostedPremium : function(req, res, next){
    console.log("F: Checking for any Premium listings...");
    if (req.session.new_listings.premium_obj.count > 0){

      //posting new card, go next
      if (req.body.stripeToken && typeof req.body.stripeToken == "string"){
        next();
      }

      //card already on file, go next
      else if (req.user.stripe_info && req.user.stripe_info.premium_cc_last4){
        next();
      }
      else {
        res.send({
          state: "error",
          message: "There were no valid payment methods! Please add a valid payment method.",
          premium_count : req.session.new_listings.premium_obj.count
        });
      }
    }
    else {
      next();
    }
  },

  //function to check the format of the batch CSV file
  checkListingBatch : function(req, res, next){
    onError = function(req, res){
      error.handler(req, res, "CSV parser error!");
    }

    //loop through and parse the CSV file, check every entry and format it correctly
      parseCSVFile(req.file.path, onError, function(bad_listings, good_listings){

      //none were good
      if (good_listings.length == 0){
        res.send({
          bad_listings: bad_listings,
          good_listings: false
        });
      }
      else {
        //need to add owner id, verified, and date created
        for (var x = 0; x < good_listings.length; x++){
          good_listings[x].push("" + req.user.id + "", 1, new Date().getTime());
        }
        req.session.good_listings = good_listings;
        req.session.bad_listings = bad_listings;
        next();
      }
    });
  },

  //function to check the size of the CSV file uploaded
  checkCSVUploadSize : function(req, res, next){
    var upload_path = (node_env == "dev") ? "./uploads/csv" : '/var/www/w3bbi/uploads/csv';
    var storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, './uploads/csv');
      },
      filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + req.user.username + "-" + file.fieldname);
      }
    });

    var upload = multer({
      storage: storage,
      limits: { fileSize: 1000000 },
      fileFilter: function (req, file, cb) {
        var allowedMimeTypes = [
          "text/csv",
          "application/csv",
          "application/excel",
          "application/vnd.ms-excel",
          "application/vnd.msexcel",
          "text/comma-separated-values"
        ];

        if (allowedMimeTypes.indexOf(file.mimetype) <= -1) {
          cb(new Error('FILE_TYPE_WRONG'));
        }
        else {
          cb(null, true);
        }
      }
    }).single("csv");

    console.log(req.user.username + " is uploading a CSV file for parsing...");

    upload(req, res, function(err){
      if (err){
        if (err.code == "LIMIT_FILE_SIZE"){
          error.handler(req, res, 'File is bigger than 1 MB!', "json");
        }
        else if (err.message == "FILE_TYPE_WRONG"){
          error.handler(req, res, 'Wrong file type!', "json");
        }
        else {
          error.handler(req, res, 'Something went wrong with the upload!', "json");
        }
      }
      else if (!err && req.file) {
        next();
      }
    });
  },

  //function to check the size of the image uploaded
  checkImageUploadSize : function(req, res, next){
    var premium = getUserListingObj(req.user.listings, req.params.domain_name).premium;
    var upload_path = (node_env == "dev") ? "./uploads/images" : '/var/www/w3bbi/uploads/images';
    var storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, upload_path);
      },
      filename: function (req, file, cb) {
        cb(null, Date.now() + "_" + req.params.domain_name + "_" + req.user.username);
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
          error.handler(req, res, "This listing is not a premium listing!", "json");
        }
        else {
          console.log(err);
          error.handler(req, res, 'Something went wrong with the upload!', "json");
        }
      }
      else if (!err) {
        next();
      }
    });
  },

  //function to check the user image and upload to imgur
  checkListingImage : function(req, res, next){
    if (req.files && (req.files.background_image || req.files.logo)){

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
        next();
      });
    }
    else {
      req.session.new_listing_info = {};

      //removing existing image(s) intentionally
      if (req.body.background_image == ""){
        req.session.new_listing_info.background_image = null;
      }
      if (req.body.logo == ""){
        req.session.new_listing_info.logo = null;
      }
      next();
    }
  },

  //function to check that the listing is verified
  checkListingVerified : function(req, res, next){
    console.log("F: Checking if listing is a verified listing...");

    if (!req.listing_info){
      req.listing_info = getUserListingObj(req.user.listings, req.params.domain_name);
    }

    if (req.listing_info.verified != 1){
      error.handler(req, res, "Please verify that you own this domain!", "json");
    }
    else {
      next();
    }
  },

  //function to check that the user owns the listing
  checkListingOwnerPost : function(req, res, next){
    console.log("F: Checking if current user is listing owner...");

    if (!req.listing_info){
      req.listing_info = getUserListingObj(req.user.listings, req.params.domain_name);
    }

    if (req.listing_info.owner_id != req.user.id){
      error.handler(req, res, "You do not own this domain!", "json");
    }
    else {
      next();
    }
  },

  //function to check that the user owns the listing
  checkListingOwnerGet : function(req, res, next){
    console.log("F: Checking if current user is listing owner...");

    Listing.checkListingOwner(req.user.id, req.params.domain_name, function(result){
      if (result.state == "error" || result.info.length <= 0){
        res.redirect("/listing/" + req.params.domain_name);
      }
      else {
        next();
      }
    });
  },

  //function to check if listing has been purchased
  checkListingPurchased : function(req, res, next){
    if (getUserListingObj(req.user.listings, req.params.domain_name).accepted){
      error.handler(req, res, "This listing has already been purchased! Please complete the ownership transfer to the new owner.", "json");
    }
    else {
      next();
    }
  },

  //function to check the posted status change of a listing
  checkListingStatus : function(req, res, next){
    console.log("F: Checking posted listing status...");

    var status = parseFloat(req.body.status);

    //if status exists and is not 1 or 0
    if (req.body.status && status != 1 && status != 0){
      error.handler(req, res, "Invalid listing status!", "json");
    }
    else if (req.body.status){
      //check to see if its currently rented
      Listing.checkCurrentlyRented(req.params.domain_name, function(result){
        if (result.state != "success" || result.info.length > 0){
          error.handler(req, res, "This listing is currently being rented!", "json");
        }
        else {
          next();
        }
      });
    }
    else {
      next();
    }
  },

  //function to check and reformat new listings details excluding image
  checkListingPremiumDetails : function(req, res, next){
    //premium design checks
    if (getUserListingObj(req.user.listings, req.params.domain_name).premium){
      console.log("F: Checking posted premium listing details...");

      var history_module = parseFloat(req.body.history_module);
      var traffic_module = parseFloat(req.body.traffic_module);
      var info_module = parseFloat(req.body.info_module);

      //invalid primary color
      if (req.body.primary_color && !validator.isHexColor(req.body.primary_color)){
        error.handler(req, res, "Invalid primary color!", "json");
      }
      //invalid secondary color
      else if (req.body.secondary_color && !validator.isHexColor(req.body.secondary_color)){
        error.handler(req, res, "Invalid secondary color!", "json");
      }
      //invalid tertiary color
      else if (req.body.tertiary_color && !validator.isHexColor(req.body.tertiary_color)){
        error.handler(req, res, "Invalid tertiary color!", "json");
      }
      //invalid font color
      else if (req.body.font_color && !validator.isHexColor(req.body.font_color)){
        error.handler(req, res, "Invalid font color!", "json");
      }
      //invalid background color
      else if (req.body.background_color && !validator.isHexColor(req.body.background_color)){
        error.handler(req, res, "Invalid background color!", "json");
      }
      //invalid history module
      else if (req.body.history_module && (history_module != 0 && history_module != 1)){
        error.handler(req, res, "Invalid history module selection!", "json");
      }
      //invalid traffic module
      else if (req.body.traffic_module && (traffic_module != 0 && traffic_module != 1)){
        error.handler(req, res, "Invalid traffic module selection!", "json");
      }
      //invalid info module
      else if (req.body.info_module && (info_module != 0 && info_module != 1)){
        error.handler(req, res, "Invalid info module selection!", "json");
      }
      //all good!
      else {

        //set the new listing info
        if (!req.session.new_listing_info) {
          req.session.new_listing_info = {};
        }
        req.session.new_listing_info.primary_color = req.body.primary_color;
        req.session.new_listing_info.secondary_color = req.body.secondary_color;
        req.session.new_listing_info.tertiary_color = req.body.tertiary_color;
        req.session.new_listing_info.font_name = req.body.font_name;
        req.session.new_listing_info.font_color = req.body.font_color;
        req.session.new_listing_info.background_color = req.body.background_color;
        req.session.new_listing_info.history_module = history_module;
        req.session.new_listing_info.traffic_module = traffic_module;
        req.session.new_listing_info.info_module = info_module;

        next();
      }
    }
    else {
      //not premium but tried to do premium updates
      if (req.body.primary_color ||
        req.body.secondary_color ||
        req.body.tertiary_color ||
        req.body.font_name ||
        req.body.font_color
      ){
        error.handler(req, res, "This listing is not a premium listing!", "json");
      }
      else {
        next();
      }
    }
  },

  //function to check and reformat new listings details excluding image
  checkListingDetails : function(req, res, next){
    console.log("F: Checking posted listing details...");

    var listing_info = getUserListingObj(req.user.listings, req.params.domain_name);

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

    //no description
    if (req.body.description && description.length == 0){
      error.handler(req, res, "Invalid listing description!", "json");
    }
    //no short description
    else if (req.body.description_hook && description_hook.length == 0){
      error.handler(req, res, "Invalid short listing description!", "json");
    }
    //no paths
    else if (req.body.paths && paths.length == 0){
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
      var listing_info = getUserListingObj(req.user.listings, req.params.domain_name);

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

  //function to make sure that its different from the existing listing info
  checkListingExisting : function(req, res, next){
    console.log("F: Checking if listing details are being changed...");

    if (!req.listing_info){
      req.listing_info = getUserListingObj(req.user.listings, req.params.domain_name);
    }

    for (var x in req.session.new_listing_info){
      if (req.session.new_listing_info[x] == req.listing_info[x]){
        delete req.session.new_listing_info[x];
      }
    }

    //if nothing is being changed
    if (Object.keys(req.session.new_listing_info).length === 0 && req.session.new_listing_info.constructor === Object){
      error.handler(req, res, "nothing-changed", "json");
    }
    //only go next if the object has anything
    else {
      next();
    }
  },

  //</editor-fold>

  //<editor-fold>-------------------------------GETS------------------------------

  //gets unverified A Record and domain who is info
  getDNSRecordAndWhois : function(req, res, next){
    console.log("F: Finding the existing A Record and WHOIS information for " + req.params.domain_name + "...");

    listing_obj = getUserListingObj(req.user.listings, req.params.domain_name);
    whois.lookup(listing_obj.domain_name, function(err, data){
      var whoisObj = {};
      if (!err){
        var array = parser.parseWhoIsData(data);
        for (var x = 0; x < array.length; x++){
          whoisObj[array[x].attribute] = array[x].value;
        }
      }
      listing_obj.whois = whoisObj;

      //look up any existing DNS A Records
      dns.resolve(listing_obj.domain_name, "A", function(err, addresses){
        listing_obj.a_records = addresses || false;
        res.send({
          state: "success",
          listing: listing_obj
        });
      });
    });

  },

  //gets all offers for a specific domain
  getListingOffers : function(req, res, next){
    console.log("F: Finding the all verified offers for " + req.params.domain_name + "...");
    var listing_obj = getUserListingObj(req.user.listings, req.params.domain_name);
    Data.getListingOffers(req.params.domain_name, function(result){
      if (result.state == "success"){
        listing_obj.offers = result.info;
        res.send({
          state: "success",
          listings: req.user.listings
        });
      }
      else {
        res.send({
          state: "success",
          listings: req.user.listings
        });
      }
    });

  },

  //</editor-fold>

  //<editor-fold>-------------------------------CREATES/UPDATES------------------------------

  //function to create the batch listings once done
  createListings : function(req, res, next){
    console.log("F: Creating listings to check for any existing...");

    var db_object = req.session.new_listings.db_object;
    Listing.newListings(db_object, function(result){
      if (result.state=="error"){error.handler(req, res, result.info, "json");}
      else {
        var affectedRows = result.info.affectedRows;
        //nothing created
        if (affectedRows == 0){
          sortListings(req.session.new_listings, db_object, []);
          res.send({
            bad_listings: req.session.new_listings.bad_listings,
            good_listings: false
          });
        }
        else {
          //figure out what was created
          Account.getAccountListings(req.user.id, function(result){
            if (result.state=="error"){error.handler(req, res, result.info, "json");}
            else {
              //get the insert IDs and domain names of newly inserted listings
              var newly_inserted_listings = findNewlyMadeListings(req.user.listings, result.info);
              var inserted_ids = newly_inserted_listings.inserted_ids        //insert ids of all inserted domains
              var inserted_domains = newly_inserted_listings.inserted_domains    //domain names of all inserted domains

              //sort all the listings
              sortListings(
                req.session.new_listings,                  //session listing object
                db_object,                          //db object used to insert
                inserted_domains,                      //domain names of all inserted domains
                req.session.new_listings.premium_obj.domain_names,      //domain names of premium listings
                inserted_ids
              );

              req.session.new_listings.inserted_ids = inserted_ids;
              req.session.new_listings.inserted_domains = inserted_domains;

              //revert the newly made listings verified to null
              Listing.updateListingsVerified(inserted_ids, function(result){
                delete req.user.listings;

                //done here for basic or move on to payment for premium
                if (req.session.new_listings.premium_obj.count > 0){
                  next();
                }
                else {
                  res.send({
                    bad_listings: req.session.new_listings.bad_listings,
                    good_listings: req.session.new_listings.good_listings
                  });
                }
              });
            }
          });
        }
      }
    });
  },

  //function to create the batch listings once done
  createListingBatch : function(req, res, next){
    var formatted_listings = req.session.good_listings;
    Listing.newListings(formatted_listings, function(result){
      if (result.state=="error"){error.handler(req, res, result.info, "json");}
      //all created
      else {
        var affectedRows = result.info.affectedRows;
        //nothing created
        if (affectedRows == 0){
          res.send({
            bad_listings: findUncreatedListings(formatted_listings, [], req.session.bad_listings).bad_listings,
            good_listings: false
          });
        }
        else {
          //figure out what was created
          Account.getAccountListings(req.user.id, function(result){
            if (result.state=="error"){error.handler(req, res, result.info, "json");}
            else {
              //get the insert IDs and domain names of newly inserted listings
              var newly_inserted_listings = findNewlyMadeListings(req.user.listings, result.info);
              var inserted_ids = newly_inserted_listings.inserted_ids;
              var inserted_domains = newly_inserted_listings.inserted_domains;

              //figure out what wasnt created and what was
              var listings_result = findUncreatedListings(formatted_listings, inserted_domains, req.session.bad_listings);
              var bad_listings = listings_result.bad_listings;
              var good_listings = listings_result.good_listings;

              //revert the newly made listings verified to null
              Listing.updateListingsVerified(inserted_ids, function(result){
                delete req.session.good_listings;
                delete req.session.bad_listings;

                res.send({
                  bad_listings: bad_listings || false,
                  good_listings: good_listings || false
                });
              });
            }
          });
        }
      }
    });
  },

  //function to update a listing
  updateListing: function(req, res, next){
    if (req.session.new_listing_info){
      console.log("F: Updating domain details...")
      var domain_name = req.params.domain_name;
      Listing.updateListing(domain_name, req.session.new_listing_info, function(result){
        if (result.state=="error"){error.handler(req, res, result.info, "json")}
        else {
          var background_image = req.session.new_listing_info.background_image || false;
          var logo = req.session.new_listing_info.logo || false;
          updateUserListingsObject(req, res, domain_name);
          res.json({
            state: "success",
            user: (req.user) ? req.user : false,
            listings: (req.user) ? req.user.listings : false,
            new_background_image : background_image,
            new_logo : logo
          });
        }
      });
    }
    else {
      res.json({
        state: "success",
        listings: (req.user) ? req.user.listings : false
      });
    }
  },

  //function to delet a listing
  deleteListing: function(req, res, next){
    var listing_info = getUserListingObj(req.user.listings, req.params.domain_name);
    Listing.deleteListing(listing_info.id, function(result){
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

  //function to update to premium since stripe stuff worked
  updateListingPremium : function(req, res, next){
    console.log("F: Updating Premium listings...");

    //update the domahub DB appropriately
    if (req.session.new_listings.premium_obj.db_success_obj.length > 0){
      Listing.updateListingsPremium(req.session.new_listings.premium_obj.db_success_obj, function(result){
        res.send({
          bad_listings: req.session.new_listings.bad_listings,
          good_listings: req.session.new_listings.good_listings
        });
        delete req.session.new_listings;
      });
    }
    else {
      res.send({
        bad_listings: req.session.new_listings.bad_listings,
        good_listings: req.session.new_listings.good_listings
      });
      delete req.session.new_listings;
    }

    //no need to revert to basic
    // if (req.session.new_listings.premium_obj.db_failed_obj.length > 0){
    //   Listing.updateListingsBasic(req.session.new_listings.premium_obj.db_failed_obj, function(result){
    //   });
    // }

  },

  //function to verify ownership of a listing
  verifyListing: function(req, res, next){
    console.log("F: Attempting to verify this listing...");

    var domain_name = req.params.domain_name;
    dns.resolve(domain_name, "A", function (err, address, family) {
      var domain_ip = address;
      dns.lookup("domahub.com", function (err, address, family) {
        if (domain_ip && address && (domain_ip == address || domain_ip[0] == address) && domain_ip.length == 1){
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

}
//<editor-fold>-------------------------------HELPERS------------------------------

//checks each row of the CSV file
function checkCSVRow(record, domains_sofar){
  var record_check = {
    state: "success",
    reasons: []
  }

  //at least 2 records required -- domain name and description
  if (record.length < 2){
    record_check.state = "error";
    record_check.reasons.push("Missing required columns!");
  }

  //too many fields
  if (record.length > 2){
    record_check.state = "error";
    record_check.reasons.push("Too many columns!");
  }

  //not a domain name
  if (!validator.isFQDN(record[0]) || !record[0]){
    record_check.state = "error";
    record_check.reasons.push("Incorrect domain name!");
  }

  //if domain name already exists
  if (domains_sofar && domains_sofar.indexOf(record[0]) != -1){
    record_check.state = "error";
    record_check.reasons.push("Duplicate domain name!");
  }

  //no description
  if (record[1].length = 0 || !record[1] || record[1].replace(/\s/g, '') == ""){
    record_check.state = "error";
    record_check.reasons.push("Invalid description");
  }
  //
  // //optionals were supplied
  // if (record.length > 2){
  //   //invalid URL for background image
  //   if (record[2] && !validator.isURL(record[2], { protocols: ["http", "https"]})){
  //     record_check.state = "error";
  //     record_check.reasons.push("Invalid background image URL");
  //   }
  //
  //   //invalid buy link
  //   if (record[3] && !validator.isURL(record[3], { protocols: ["http", "https"]})){
  //     record_check.state = "error";
  //     record_check.reasons.push("Invalid buy link URL");
  //   }
  //
  // }

  return record_check;
}

//helper function to parse the csv file
function parseCSVFile(sourceFilePath, errorHandler, done){
  var bad_listings = [];
  var good_listings = [];
  var domains_sofar = [];
  var row = 0;

    var source = fs.createReadStream(sourceFilePath);
    var parser = parse({
    skip_empty_lines: true
    });

    parser.on("readable", function(){
        var record;

    //loop through all rows
        while (record = parser.read()) {
      record_check = checkCSVRow(record, domains_sofar);
      domains_sofar.push(record[0]);
      row++;

      //check if the row is legit
            if (record_check.state == "error"){
        bad_listing = {
          row: row,
          data : record,
          reasons: record_check.reasons
        }
        bad_listings.push(bad_listing);
      }
      else {
        good_listings.push(record);
      }
        }
    });

    parser.on("error", function(error){
    console.log(error);
    errorHandler();
    });

  //pass it back to create session variables
    parser.on("end", function(){
        done(bad_listings, good_listings);
    });

    source.pipe(parser);
}

//helper function to update req.user.listings after updating a listing
function updateUserListingsObject(req, res, domain_name){
  if (req.user){
    for (var x = 0; x < req.user.listings.length; x++){
      if (req.user.listings[x].domain_name.toLowerCase() == domain_name.toLowerCase()){
        req.user.listings[x] = Object.assign({}, req.user.listings[x], req.session.new_listing_info);
        delete req.session.new_listing_info;
        break;
      }
    }
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
function getUserListingObj(listings, domain_name){
  for (var x = 0; x < listings.length; x++){
    if (listings[x].domain_name.toLowerCase() == domain_name.toLowerCase()){
      return listings[x];
    }
  }
}

//helper function to check existing req.user listings and compare with any newly made ones to find the insert ID and domain name
function findNewlyMadeListings(user_listings, inserted_listings){
  var inserted_ids = [];
  var inserted_domains = [];

  //find the insert ids of the newly inserted listings
  for (var x = 0; x < inserted_listings.length; x++){
    var exists = false;
    for (var y = 0; y < user_listings.length; y++){
      if (inserted_listings[x].id == user_listings[y].id){
        exists = true;
        break;
      }
    }

    if (!exists){
      inserted_ids.push([inserted_listings[x].id]);
      inserted_domains.push(inserted_listings[x].domain_name);
    }
  }

  return {
    inserted_ids : inserted_ids,
    inserted_domains : inserted_domains
  };
}

//helper function to see if any listings failed
function findUncreatedListings(posted_listings, new_listings, existing_bad_listings){
  var bad_listings = (existing_bad_listings) ? existing_bad_listings : [];
  var good_listings = [];

  //loop through all posted listings
  for (var x = 0; x < posted_listings.length; x++){

    //figure out if this posted listing was created or not
    var was_created = false;
    for (var y = 0; y < new_listings.length; y++){
      if (posted_listings[x][2] == new_listings[y]){
        was_created = true;
        break;
      }
    }

    //wasnt created cuz it was a duplicate
    if (!was_created){
      bad_listings.push({
        data: [posted_listings[x][2]],
        reasons: ["Duplicate domain name!"]
      });
    }
    else {
      good_listings.push([posted_listings[x][2]]);
    }
  }

  return {
    bad_listings: bad_listings,
    good_listings : good_listings
  };
}

//helper function to see if any listings failed, figure out any premium domains
function sortListings(new_listings, formatted_listings, inserted_domains, premium_domains, inserted_ids){
  var bad_listings = new_listings.bad_listings;
  var good_listings = [];
  var premium_inserted_ids = [];
  var premium_indexes = [];

  //loop through all formatted listings
  for (var x = 0; x < formatted_listings.length; x++){

    //figure out if this formatted listing was inserted or not
    var was_created = false;
    for (var y = 0; y < inserted_domains.length; y++){
      //if domain name of formatted input is same as domain name of result
      if (formatted_listings[x][2] == inserted_domains[y]){
        //was created!
        was_created = true;

        //find the insert ids of the inserted premium domains
        if (premium_domains.length > 0){
          var not_premium = true;
          for (var z = 0; z < premium_domains.length; z++){

            //if premium domain name is same as inserted domain name
            if (premium_domains[z] == inserted_domains[y]){
              premium_inserted_ids.push(inserted_ids[y][0]);
              premium_indexes.push(x);
              not_premium = false;
              break;
            }
          }

          //this was a basic listing (premium and basic submitted)
          if (not_premium){
            good_listings.push({
              index: x
            });
          }
        }

        //this was a basic listing (no premium submitted)
        else {
          good_listings.push({
            index: x
          });
        }

        break;
      }
    }

    //wasnt created cuz it was already existing
    if (!was_created){
      bad_listings.push({
        index: x,
        reasons: ["This domain name already exists!"]
      });
    }
  }

  new_listings.good_listings = good_listings;
  new_listings.premium_obj.inserted_ids = premium_inserted_ids;
  new_listings.premium_obj.indexes = premium_indexes;
}

//</editor-fold>
