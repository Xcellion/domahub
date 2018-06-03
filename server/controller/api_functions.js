//<editor-fold>-------------------------------DOMA LIB FUNCTIONS-------------------------------

var listing_model = require('../models/listing_model.js');

var search_functions = require("./listing_general_functions.js");
var renter_functions = require("./listing_renter_functions.js");
var stripe_functions = require("./stripe_functions.js");

//</editor-fold>

//<editor-fold>-------------------------------VARIABLES-------------------------------

var validator = require("validator");
var request = require('request');
var url = require('url');
var fs = require('fs');
var path = require('path');

//</editor-fold>

module.exports = function(app){
  app.all("*", [
    checkHost,
    renter_functions.getListingInfo,
    stripe_functions.checkStripeSubscriptionForUser,
    checkForBasicRedirect,
    renter_functions.addToSearchHistory,
    renter_functions.checkStillVerified,
    renter_functions.renderListing
  ]);
}

//<editor-fold>------------------------------------------FUNCTIONS---------------------------------------

//check if the requested host is not for domahub
function checkHost(req, res, next){
  if (req.headers.host){
    var domain_name = req.headers.host.replace(/^(https?:\/\/)?(www\.)?/,'').toLowerCase();
  }
  else {
    var domain_name = "domahub.com";
  }
  if (req.session.pipe_to_dh == domain_name && req.originalUrl.indexOf("/listing") != -1){
    console.log("APF: Forwarding to the next route...");
    next("route");
  }
  else if (req.headers.host){

    //requested w3bbi, redirect to domahub
    if (domain_name == "www.w3bbi.com"
    || domain_name == "w3bbi.com"){
      res.redirect("https://domahub.com" + req.originalUrl);
    }

    //requested domahub! skip this route and go to next route
    else if (domain_name == "www.domahub.com"
    || domain_name == "domahub.com"
    || domain_name == "localhost"
    || domain_name == "localhost:8080"
    || domain_name == "localhost:9090"){
      next("route");
    }

    //invalid domain host, redirect to domahub main page
    else if (!validator.isAscii(domain_name) || !validator.isFQDN(domain_name)){
      res.redirect("https://domahub.com" + req.originalUrl);
    }

    //requested a different host, check if rented
    else {
      var path = req.originalUrl.substr(1, req.originalUrl.length);
      delete req.session.pipe_to_dh;
      getCurrentRental(req, res, domain_name, path, next);
    }
  }

  //no host header, just redirect to domahub
  else {
    res.redirect("https://domahub.com" + req.originalUrl);
  }
}

//send the current rental details and information for a listing
function getCurrentRental(req, res, domain_name, path, next){
  //requesting something besides main page, pipe the request
  if (req.session.rented_info && req.session.rented_info.path == path){
    console.log("APF: Proxying rental request for an existing session for " + domain_name + "!");
    searchAndDirect(req.session.rented_info, req, res);
  }
  else {
    console.log("APF: Attempting to check current rental status for " + domain_name + "!");
    listing_model.getCurrentRental(domain_name, path, function(result){

      //not rented! check if it's premium to see if we should use domahub URL or custom URL
      if (result.state != "success" || result.info.length == 0){
        console.log("APF: Not rented! Redirecting to listing page...");
        delete req.session.rented_info;

        //used to replace req.params domain name variable since there is none coming from API
        req.session.pipe_to_dh = domain_name;
        next();
      }
      //rented! add it to rental stats
      else {
        search_functions.newRentalHistory(result.info[0].rental_id, req);
        searchAndDirect(result.info[0], req, res);
      }
    });
  }

}

//not rented! send to domahub/listings or its own URL if it's premium
function checkForBasicRedirect(req, res, next){

  //premium! go ahead and display listings on this URL
  if (req.session.listing_info && req.session.listing_info.premium){
    console.log("APF: Premium domain! Display listing on custom URL...");

    //if its a hub and has listings query
    if (req.session.listing_info.hub == 1 && req.query.listings){
      req.session.pipe_to_dh = req.headers.host.replace(/^(https?:\/\/)?(www\.)?/,'');
      next();
    }
    //redirect to base path if it's requesting something weird, or if there is no query for listings (listing hub)
    else if (req.originalUrl != "/" || req.originalUrl == "/listing/" + req.session.listing_info.domain_name){
      res.redirect("/");
    }
    else {
      req.session.pipe_to_dh = req.headers.host.replace(/^(https?:\/\/)?(www\.)?/,'');
      next();
    }
  }

  //basic domain! redirect to /listings
  else {
    console.log("APF: Basic domain! Redirecting to DomaHub...");
    var path = req.originalUrl.substr(1, req.originalUrl.length);
    res.redirect("https://domahub.com/listing/" + req.session.listing_info.domain_name + "?wanted=" + path);
  }
}

//rented! add to search and decide where to proxy
function searchAndDirect(rental_info, req, res){
  console.log("APF: Currently rented!");

  //proxy the request
  if (rental_info.address){
    if (rental_info.type == 0){
      console.log("APF: Displaying content from " + rental_info.address + "...");
      req.session.rented_info = rental_info;
      requestProxy(req, res, rental_info);
    }
    else {
      console.log("APF: Forwarding website to " + rental_info.address + "...");
      res.redirect(rental_info.address);
    }
  }
  else {
    console.log("APF: No address associated with rental! Displaying default empty page...");
    var image_path = path.resolve(process.cwd(), 'server', 'views', 'proxy', 'proxy-image.ejs');
    res.render(image_path, {
      image: "",
      edit: false,
      preview: false,
      doma_rental_info : rental_info
    });
  }
}

//proxy request
function requestProxy(req, res, rental_info){
  //now rendering rental, delete any sensitive stuff
  if (!req.session.proxy_edit){
    delete rental_info.owner_hash_id;
    delete rental_info.owner_email;
  }
  request({
    url: addProtocol(rental_info.address),
    encoding: null
  }, function (err, response, body) {
    //an image/PDF was requested
    if (response.headers['content-type'].indexOf("image") != -1 || response.headers['content-type'].indexOf("pdf") != -1){
      console.log("APF: Requested rental address was an image/PDF!");
      var image_path = path.resolve(process.cwd(), 'server', 'views', 'proxy', 'proxy-image.ejs');

      res.render(image_path, {
        image: rental_info.address,
        content: response.headers['content-type'],
        edit: false,
        preview: false,
        doma_rental_info : rental_info
      });
    }
    else {
      console.log("APF: Requested rental address was a website!");

      //pathes for the domahub overlay
      var index_path = path.resolve(process.cwd(), 'server', 'views', 'proxy', 'proxy-index.ejs');
      var noedit_path = path.resolve(process.cwd(), 'server', 'views', 'proxy', 'proxy-noedit.ejs');
      var rental_info_buffer = new Buffer("<script>var doma_rental_info = " + JSON.stringify(rental_info) + "</script>");

      var proxy_index = fs.readFileSync(index_path);
      var proxy_noedit = fs.readFileSync(noedit_path);
      var buffer_array = [body, rental_info_buffer, proxy_index, proxy_noedit];
      res.end(Buffer.concat(buffer_array));
    }
  }).on('error', function(err){
    res.redirect("https://domahub.com/listing/" + rental_info.domain_name);
  });
}

//</editor-fold>

//<editor-fold>------------------------------------------HELPERS---------------------------------------

//add http or https
function addProtocol(address){
  if (!validator.isURL(address, {
    protocols: ["http", "https"],
    require_protocol: true
  })){
    address = "http://" + address;
  }
  return address;
}

//</editor-fold>
