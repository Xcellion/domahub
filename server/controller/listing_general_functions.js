//<editor-fold>-------------------------------DOMA LIB FUNCTIONS-------------------------------

var listing_model = require('../models/listing_model.js');
var data_model = require('../models/data_model.js');

var Categories = require("../lib/categories.js");
var price_rate_list = ["hour_price", "day_price", "week_price", "month_price", "none"];
var error = require('../lib/error.js');

//</editor-fold>

//<editor-fold>-------------------------------VARIABLES-------------------------------

var validator = require("validator");

//</editor-fold>

module.exports = {

  //check validity of domain name
  checkDomainValid : function(req, res, next){
    console.log("LGF: Checking domain FQDN validity...");
    var domain_name = req.params.domain_name || req.body["domain-name"];
    if (!validator.isFQDN(domain_name) || !validator.isAscii(domain_name)){
      error.handler(req, res, "Invalid domain name!");
    }

    //redirect to lowercase URL of listing
    else if (req.params.domain_name != req.params.domain_name.toLowerCase()){
      res.redirect(307, req.originalUrl.replace(req.params.domain_name, req.params.domain_name.toLowerCase()));
    }

    //redirect www. inside of a domain name
    else if (req.params.domain_name.indexOf("www.") != -1){
      res.redirect(307, req.originalUrl.replace("www.", ""));
    }

    else {
      next();
    }
  },

  //check if listing is listed on domahub
  checkDomainListed : function(req, res, next){
    console.log("LGF: Checking if domain is listed...");
    var domain_name = req.params.domain_name || req.body["domain-name"];
    listing_model.checkListing(domain_name, function(result){
      if (!result.info.length || result.state == "error"){
        error.handler(req, res, "Invalid domain name!");
      }
      else {
        next();
      }
    });
  },

  //check if listing is NOT listed on domahub
  checkDomainNotListed : function(req, res, next){
    console.log("LGF: Checking if domain is NOT listed...");
    var domain_name = req.params.domain_name || req.body["domain-name"];
    listing_model.checkListing(domain_name, function(result){
      if (!result.info.length || result.state == "error"){
        next();
      }
      else {
        error.handler(req, res, "Invalid domain name!");
      }
    });
  },

  //render the listing hub with 10 random active listings
  renderListingHub : function(req, res, next){
    res.render("listings/listing_hub.ejs", {
      user: req.user,
      categories_front: Categories.front(),
      categories_back: Categories.back()
    });
  },

  //get more listings
  getMoreListings : function(req, res, next){
    if (req.body.listing_count == undefined || !validator.isInt(req.body.listing_count)){
      error.handler(req, res, "Not a valid count!", "json");
    }
    else {
      var search_term = "%" + req.body.search_term + "%";
      listing_model.getRandomListings(search_term, parseFloat(req.body.listing_count), function(result){
        res.send({
          state: result.state,
          listings: result.info,
          search_term: req.body.search_term
        });
      });
    }
  },

  //returns a random listing by category
  getRandomListingByCategory : function(req, res, next){
    console.log("LGF: Finding a random listing based on category...");
    var category = req.params.category.toLowerCase();

    //make sure the category is legit
    if (Categories.existsBack(category)){
      category = "%" + category + "%";
      listing_model.getRandomListingByCategory(category, function(result){
        if (!result.info.length || result.state == "error"){
          res.redirect("/");
        }
        else {
          res.redirect("/listing/" + result.info[0].domain_name);
        }
      });
    }
    //if not a legit category
    else {
      res.redirect("/");
    }
  },

  //returns three related listing by category
  getRelatedListings : function(req, res, next){
    console.log("LGF: Finding related listings...");
    var categories = req.body.categories.split(" ");
    var domain_name_exclude = req.body.domain_name_exclude;

    var categories_clean = [];
    for (var x = 0; x < categories.length; x++){
      if (Categories.existsBack(categories[x])){
        categories_clean.push(categories[x]);
      }
    }

    //make sure the domain it's coming from is legit first
    if (validator.isFQDN(domain_name_exclude)){

      if (categories_clean.length == 0){
        listing_model.getThreeRandomListings(domain_name_exclude, function(result){
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
        categories_clean = categories_clean.join("|");
        listing_model.getRelatedListings(categories_clean, domain_name_exclude, function(result){
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
    }
  },

  //check the posted search parameters
  checkSearchParams : function(req, res, next){
    var posted_categories = (typeof req.body.categories == "string" && req.body.categories.length > 0) ? req.body.categories.toLowerCase().split(" ").filter(function(el) {return el.length != 0}) : [];
    var all_categories_exist = posted_categories.every(function(v) {
      return Categories.existsBack(v);
    });

    //if the domain is invalid even after adding ".com"
    if (!validator.isFQDN(req.body.domain_name) && !validator.isFQDN(req.body.domain_name + ".com") && req.body.domain_name != ""){
      error.handler(req, res, "Invalid domain_name!", "json");
    }
    //if categories arent in the global list
    else if (!all_categories_exist){
      error.handler(req, res, "Invalid categories!", "json");
    }
    //if price_rate isnt in the global list
    else if (price_rate_list.indexOf(req.body.price_rate) == -1){
      error.handler(req, res, "Invalid price type!", "json");
    }
    //if start and end days are the same, add 1 days worth of milliseconds to end_date
    else if (new Date(req.body.start_date) > new Date(req.body.end_date)){
      error.handler(req, res, "Invalid dates!", "json");
    }
    else {
      next();
    }
  },

  getListingBySearchParams : function(req, res, next){
    var filter_name = "%" + req.body.domain_name + "%";
    var filter_price = {
      type: (req.body.price_rate == "none") ? "hour_price" : req.body.price_rate,
      min: (req.body.price_rate == "none") ? 0 : req.body.min_price.replace(/\D/g,''),
      max: (req.body.price_rate == "none") ? 10000000 : req.body.max_price.replace(/\D/g,'')
    }
    var filter_date = {
      start: isNaN(req.body.start_date) ? new Date().getTime() : req.body.start_date,      //if nothing specified, today
      end: isNaN(req.body.end_date) ? new Date().getTime() + 31556952000 : req.body.end_date    //if nothing specified, one year from today
    }

    //if start and end days are the same, add 1 days worth of milliseconds to end_date
    if (filter_date.start == filter_date.end){
      filter_date.end += 86400000;
    }

    //get all domains with domain_name, price_rate
    listing_model.getListingByFilter(filter_name, filter_price, filter_date, function(result){
      if (result.state == "success" && result.info.length > 0){

        //concatenate all adjacent times
        var all_listings = joinRentalTimes(result.info);

        //create rental property objects
        all_listings = createRentalProp(all_listings);

        //check the availability
        all_listings = checkDateAvailability(filter_date.start, filter_date.end, all_listings);

        //check category
        var posted_categories = req.body.categories.toLowerCase().split(" ").filter(function(el) {return el.length != 0});
        all_listings = checkAllListingCategories(all_listings, posted_categories)

        res.send({
          state: "success",
          listings: all_listings
        });
      }
      //nothing found
      else if (result.state == "success" && result.info.length == 0){
        res.send({
          state: "success",
          listings: []
        });
      }
      else {
        res.send({
          state: "error"
        })
      }
    });
  },

  //new view for a specific rental
  newRentalHistory : function(rental_id, req){
    var user_ip = req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress;

    //nginx https proxy removes IP
    if (req.headers["x-real-ip"]){
      user_ip = req.headers["x-real-ip"];
    }

    //add to search history if its not development
    if (process.env.NODE_ENV != "dev"){
      var history_info = {
        rental_id: rental_id,                          //what rental they went to
        account_id: (typeof req.user == "undefined") ? null : req.user.id,    //who searched if who exists
        timestamp: new Date().getTime(),                    //when they searched for it
        referer: req.header("Referer") || req.headers.referer,                    //when they searched for it
        user_ip : user_ip                            //their ip address
      }
      console.log("LGF: Adding to rental view stats...");

      data_model.newRentalHistory(history_info, function(result){if (result.state == "error") {console.log(result)}});          //async
    }
  }

}

//<editor-fold>-------------------------------HELPER-------------------------------

//join all rental times
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

//create rental properties inside listing info
function createRentalProp(listings){
  //iterate once across all results
  for (var x = 0; x < listings.length; x++){
    var temp_rentals = [];

    //iterate again to look for multiple dates and durations
    for (var y = 0; y < listings.length; y++){
      var temp_rental_obj = {};
      if (!listings[y].active && !listings[y].checked && listings[x]["domain_name"] == listings[y]["domain_name"]){
        temp_rental_obj.rental_id = listings[y].rental_id;
        temp_rental_obj.date = listings[y].date;
        temp_rental_obj.date = listings[y].active;
        temp_rental_obj.duration = listings[y].duration;
        listings[y].checked = true;
        temp_rentals.push(temp_rental_obj);
      }
    }

    //combine dates into a property
    listings[x].rentals = temp_rentals;
  }

  //remove empty date entries
  listings = listings.filter(function(value, index, array){
    delete value.rental_id;
    delete value.date;
    delete value.duration;
    return value.rentals.length;
  });

  return listings;
}

//check date availability
function checkDateAvailability(min_date, max_date, listings){
  //first loop through all listings
  for (var x = 0; x < listings.length; x++){
    delete listings[x].checked;
    var overlap = "";

    //then loop through all the rentals for that listing
    for (var y = 0; y < listings[x].rentals.length; y++){
      //if there is a complete overlap (existing start <= posted start && existing end >= posted end)
      if (listings[x].rentals[y].date <= min_date && listings[x].rentals[y].date + listings[x].rentals[y].duration >= max_date){
        overlap = "Unavailable";
      }
      //partial overlap (existing start < posted end && posted start < existing end)
      else if (listings[x].rentals[y].date < max_date && min_date < listings[x].rentals[y].date + listings[x].rentals[y].duration){
        overlap = (overlap == "" || overlap == "Available") ? "Partially Available" : overlap;
      }
      //no overlaps!
      else {
        overlap = (overlap == "") ? "Available" : overlap;
      }
    }
    listings[x].overlap = overlap;
  }

  return listings;
}

//check for posted categories
function checkListingCategories(listing_categories, posted_categories){
  for (var i = 0; i < posted_categories.length; i++){
    if (listing_categories.indexOf(posted_categories[i]) === -1){
      return false;
    }
  }
  return true;
}

//loop through all listings and check if the categories are good
function checkAllListingCategories(listings, posted_categories){
  var temp_listings = [];
  for (var x = 0; x < listings.length; x++){
    var categories = listings[x].categories.split(" ").filter(function(el) {return el.length != 0});
    if (checkListingCategories(categories, posted_categories)){
      temp_listings.push(listings[x]);
    }
  }

  return temp_listings;
}

//</editor-fold>
