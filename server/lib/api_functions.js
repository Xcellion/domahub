var listing_model = require('../models/listing_model.js');
var account_model = require('../models/account_model.js');
var data_model = require('../models/data_model.js');

var search_functions = require("../routes/listings/listings_search_functions.js");
var renter_functions = require("../routes/listings/listings_renter_functions.js");
var stripe = require("../lib/stripe.js");

var validator = require("validator");
var request = require('request');
var url = require('url');
var fs = require('fs');
var path = require('path');
var node_env = process.env.NODE_ENV || 'dev';   //dev or prod bool

module.exports = function(app, db, e){
  error = e;
  Listing = new listing_model(db);
  Account = new account_model(db);
  Data = new data_model(db);

  app.all("*", [
    checkHost,
    renter_functions.getListingInfo,
    stripe.checkStripeSubscription,
    checkForBasicRedirect,
    renter_functions.addToSearchHistory,
    renter_functions.checkStillVerified,
    renter_functions.renderListing
  ]);
}

//function to check if the requested host is not for domahub
function checkHost(req, res, next){
  var domain_name = req.headers.host.replace(/^(https?:\/\/)?(www\.)?/,'');
  console.log(req.session.id);

  //if the cookie set by DH is the same as the requested host, proxy the request to the main server
  if (req.session.pipe_to_dh == domain_name && req.originalUrl != "/"){
    if (node_env == "dev"){
      next("route");
    }
    else {
      req.pipe(request({
        url: "https://domahub.com" + req.originalUrl
      })).pipe(res);
    }
  }
  else if (req.headers.host){

    //requested domahub! skip this route and go to next route
    if (domain_name == "www.w3bbi.com"
    || domain_name == "w3bbi.com"
    || domain_name == "www.domahub.com"
    || domain_name == "domahub.com"
    || domain_name == "localhost"
    || domain_name == "localhost:8080"
    || domain_name == "localhost:9090"){
      next("route");
    }

    //invalid domain host, redirect to domahub main page
    else if (!validator.isAscii(domain_name) || !validator.isFQDN(domain_name)){
      res.redirect("https://domahub.com");
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
    res.redirect("https://domahub.com");
  }
}

//send the current rental details and information for a listing
function getCurrentRental(req, res, domain_name, path, next){
  //requesting something besides main page, pipe the request
  if (req.session.rented_info && req.session.rented_info.path == path){
    console.log("AF: Proxying rental request for an existing session for " + domain_name + "!");
    searchAndDirect(req.session.rented_info, req, res);
  }
  else {
    console.log("AF: Attempting to check current rental status for " + domain_name + "!");
    Listing.getCurrentRental(domain_name, path, function(result){

      //not rented! check if it's premium to see if we should use domahub URL or custom URL
      if (result.state != "success" || result.info.length == 0){
        console.log("AF: Not rented! Redirecting to listing page...");
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
    console.log("AF: Premium domain! Display listing on custom URL...");
    req.session.pipe_to_dh = req.headers.host.replace(/^(https?:\/\/)?(www\.)?/,'');
    next();
  }

  //basic domain! redirect to /listings
  else {
    console.log("AF: Basic domain! Redirecting to DomaHub...");
    var path = req.originalUrl.substr(1, req.originalUrl.length);
    res.redirect("https://domahub.com/listing/" + req.session.listing_info.domain_name + "?wanted=" + path);
  }
}

//rented! add to search and decide where to proxy
function searchAndDirect(rental_info, req, res){
  console.log("AF: Currently rented!");

  //proxy the request
  if (rental_info.address){
    if (rental_info.type == 0){
      console.log("AF: Displaying content from " + rental_info.address + "...");
      req.session.rented_info = rental_info;
      requestProxy(req, res, rental_info);
    }
    else {
      console.log("AF: Forwarding website to " + rental_info.address + "...");
      res.redirect(rental_info.address);
    }
  }
  else {
    console.log("AF: No address associated with rental! Displaying default empty page...");
    var image_path = (node_env == "dev") ? path.resolve(process.cwd(), 'server', 'views', 'proxy', 'proxy-image.ejs') : path.resolve(process.cwd(), 'views', 'proxy', 'proxy-image.ejs');
    res.render(image_path, {
      image: "",
      edit: false,
      preview: false,
      doma_rental_info : rental_info
    });
  }
}

//function to proxy request
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
      console.log("AF: Requested rental address was an image/PDF!");
      var image_path = (node_env == "dev") ? path.resolve(process.cwd(), 'server', 'views', 'proxy', 'proxy-image.ejs') : path.resolve(process.cwd(), 'views', 'proxy', 'proxy-image.ejs');

      res.render(image_path, {
        image: rental_info.address,
        content: response.headers['content-type'],
        edit: false,
        preview: false,
        doma_rental_info : rental_info
      });
    }
    else {
      console.log("AF: Requested rental address was a website!");

      //pathes for the domahub overlay
      var index_path = (node_env == "dev") ? path.resolve(process.cwd(), 'server', 'views', 'proxy', 'proxy-index.ejs') : path.resolve(process.cwd(), 'views', 'proxy', 'proxy-index.ejs');
      var noedit_path = (node_env == "dev") ? path.resolve(process.cwd(), 'server', 'views', 'proxy', 'proxy-noedit.ejs') : path.resolve(process.cwd(), 'views', 'proxy', 'proxy-noedit.ejs');
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

//function to add http or https
function addProtocol(address){
  if (!validator.isURL(address, {
    protocols: ["http", "https"],
    require_protocol: true
  })){
    address = "http://" + address;
  }
  return address;
}
