var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()
var urlencodedParser = bodyParser.urlencoded({ extended: false })

var Q = require('q');
var whois = require("whois");
var parser = require('parse-whois');
var dns = require("dns");

module.exports = {
	//gets all listings for a user
	getAccountListings : function(req, res, next){

		//if we dont already have the list of listings
		if (!req.user.listings){
			Account.getAccountListings(req.user.id, function(result){
				if (result.state=="error"){error.handler(req, res, result.info);}
				else {
					req.user.listings = result.info;

					var whois_promises = [];

					//custom promise creation, get whois data about a unverified domain
					var q_function = function(listing_obj){
						return Q.Promise(function(resolve, reject, notify){
							whois.lookup(listing_obj.domain_name, function(err, data){
								if (err) {reject(err)}
								else {
									var whoisObj = {};
									var array = parser.parseWhoIsData(data);
									for (var x = 0; x < array.length; x++){
										whoisObj[array[x].attribute] = array[x].value;
									}
									listing_obj.whois = whoisObj;
									resolve(whoisObj)
								}
							});
						})
					}

					//figure out domain registrar of unverified domains
					for (var x = 0; x < req.user.listings.length; x++){
						if (!req.user.listings[x].verified){

							//add to promises
							var promise = q_function(req.user.listings[x]);
							whois_promises.push(promise);
						}
					}

					//wait for all promises
					Q.allSettled(whois_promises)
					 .then(function(results) {
						 next();
					 });

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

	//check page number
	checkPageNum: function(req, res, next){
		page = req.params.page;
		if (!page || ((parseFloat(page) >>> 0) && (Number.isInteger(parseFloat(page))) && (parseFloat(page) > 0))){
			next();
		}
		else {
			var new_path = req.path.includes("listing") ? "/profile/mylistings" : "/profile/myrentals"
			res.redirect(new_path);
		}
	},

	//----------------------------------------------------------------------RENTAL----------------------------------------------------------

	checkPostedDeletionRows : function(req, res, next){
		console.log("F: Checking posted IDs for deletion...");
		var to_delete_formatted = [];
		var listing_or_rental = (req.path.indexOf("mylistings") != -1) ? req.user.listings : req.user.rentals;
		var listing_or_rental_id = (req.path.indexOf("mylistings") != -1) ? "id" : "rental_id";
		var listing_or_rental_bool = req.path.indexOf("mylistings") != -1;

		if (req.body.ids){
			for (var x = 0; x < req.body.ids.length; x++){
				for (var y = 0; y < listing_or_rental.length; y++){
					if (listing_or_rental[y][listing_or_rental_id] == req.body.ids[x]){
						if (!listing_or_rental_bool || (listing_or_rental_bool && listing_or_rental[y].verified && listing_or_rental[y].status == 1)){
							to_delete_formatted.push([listing_or_rental[y][listing_or_rental_id], 0]);
						}
						break;
					}
				}
			}
		}
		if (to_delete_formatted.length > 0){
			req.session.deletion_object = to_delete_formatted;
			next();
		}
		else {
			res.send({state: "error"});
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
								 to_verify_formatted.push([results[x].value.listing_id, 1]);
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

	//multi-delete rentals
	deleteRentals : function(req, res, next){
		console.log("F: Deleting rentals...");
		Listing.deleteRentals(req.session.deletion_object, function(result){
			if (result.state == "success"){
				updateUserRentalsObject(req.user.rentals, req.session.deletion_object);
				delete req.session.deletion_object;
				res.send({
					state: "success",
					rows: req.user.rentals
				});
			}
			else {
				res.send({state: "error"});
			}
		});
	},

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
					rows: req.user.listings,
					unverified_listings: unverified_listings,
					verified_listings: verified_listings
				});
			}
			else {
				res.send({state: "error"});
			}
		});
	},

	//----------------------------------------------------------------------RENDERS----------------------------------------------------------

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
			listings: req.user.listings || false
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
		// 	res.redirect("/profile/dashboard");
		// }
		// else if (path.includes("inbox")){
		// 	res.redirect("/profile/messages");
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
				user_listings[x].status = 0;
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
				user_listings[x].verified = 1;
				break;
			}
		}
	}
}
