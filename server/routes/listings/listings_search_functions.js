var category_list = require("../../lib/categories.js").categories_back;
var price_rate_list = ["hour_price", "day_price", "week_price", "month_price"];

var validator = require("validator");

module.exports = {

	renderListingHub : function(req, res, next){
		res.render("listings/listing_hub.ejs", {
			user: req.user,
			categories_front: require("../../lib/categories.js").categories_front,
			categories_back: require("../../lib/categories.js").categories_back
		});
	},

	//returns a random listing by category
	getRandomListingByCategory : function(req, res, next){
		var category = req.params.category.toLowerCase();

		//if not a legit category
		if (category_list.indexOf(category) != -1){
			category = "%" + category + "%";
			Listing.getRandomListingByCategory(category, function(result){
				if (!result.info.length || result.state == "error"){
					res.redirect("/");
				}
				else {
					res.redirect("http://" + result.info[0].domain_name);
				}
			});
		}
		else {
			res.redirect("/");
		}
	},

	checkSearchParams : function(req, res, next){
		var posted_categories = (typeof req.body.categories == "string" && req.body.categories.length > 0) ? req.body.categories.toLowerCase().split(" ").filter(function(el) {return el.length != 0}) : [];
		var all_categories_exist = posted_categories.every(function(v,i) {
			return category_list.indexOf(v) !== -1;
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
			type: req.body.price_rate,
			min: req.body.min_price,
			max: req.body.max_price,
		}
		var filter_date = {
			start: isNaN(req.body.start_date) ? new Date().getTime() : req.body.start_date,
			end: isNaN(req.body.end_date) ? new Date().getTime() + 31556952000 : req.body.end_date,
		}

		//if start and end days are the same, add 1 days worth of milliseconds to end_date
		if (filter_date.start == filter_date.end){
			filter_date.end += 86400000;
		}

		//get all domains with domain_name, price_rate
		Listing.getListingByFilter(filter_name, filter_price, filter_date, function(result){
			if (result.state == "success" && result.info.length > 0){

				//concatenate all adjacent times
				var all_listings = joinRentalTimes(result.info);

				//create rental property objects
				all_listings = createRentalProp(all_listings);

				//check the availability
				all_listings = checkDateAvailability(filter_date.start, filter_date.end, all_listings);
				//check category
				var posted_categories = req.body.categories.toLowerCase().split(" ").filter(function(el) {return el.length != 0});
				console.log(posted_categories);
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
	}


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
function createRentalProp(listings){
	//iterate once across all results
	for (var x = 0; x < listings.length; x++){
		var temp_rentals = [];

		//iterate again to look for multiple dates and durations
		for (var y = 0; y < listings.length; y++){
			var temp_rental_obj = {};
			if (!listings[y].checked && listings[x]["domain_name"] == listings[y]["domain_name"]){
				temp_rental_obj.rental_id = listings[y].rental_id;
				temp_rental_obj.date = listings[y].date;
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

//function to check date availability
function checkDateAvailability(min_date, max_date, listings){
	//first loop through all listings
	for (var x = 0; x < listings.length; x++){
		delete listings[x].checked;
		var overlap = "";

		//then loop through all the rentals for that listing
		for (var y = 0; y < listings[x].rentals.length; y++){
			//if there is a complete overlap (existing start <= posted start && existing end >= posted end)
			if (listings[x].rentals[y].date <= min_date && listings[x].rentals[y].date + listings[x].rentals[y].duration >= max_date){
				overlap = "full";
			}
			//partial overlap (existing start < posted end && posted start < existing end)
			else if (listings[x].rentals[y].date < max_date && min_date < listings[x].rentals[y].date + listings[x].rentals[y].duration){
				overlap = (overlap == "" || overlap == "none") ? "partial" : overlap;
			}
			//no overlaps!
			else {
				overlap = (overlap == "") ? "none" : overlap;
			}
		}
		listings[x].overlap = overlap;
	}

	return listings;
}

//function to check for posted categories
function checkListingCategories(listing_categories, posted_categories){
	for (var i = 0; i < posted_categories.length; i++){
		if (listing_categories.indexOf(posted_categories[i]) === -1){
			return false;
		}
	}
	return true;
}

//function to loop through all listings and check if the categories are good
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