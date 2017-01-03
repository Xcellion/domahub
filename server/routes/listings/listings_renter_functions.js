var validator = require("validator");
var whois = require("whois");
var parser = require('parse-whois');

var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');
var mailOptions = {
    auth: {
        api_key: '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'
    }
}
var mailer = nodemailer.createTransport(sgTransport(mailOptions));
var alexaData = require('alexa-traffic-rank');
var moment = require('moment');
var request = require('request');
var fs = require('fs');

module.exports = {
	//check domain name for rental
	checkRentalDomain : function(req, res, next){
		console.log("F: Checking if belongs to the correct domain...");
		var domain_name = req.params.domain_name;

		if (req.session.rental_info.domain_name != domain_name){
			error.handler(req, res, "Invalid domain name for rental!");
		}
		else {
			next();
		}
	},

    //check if rental belongs to account
    checkRentalOwner : function(req, res, next){
        console.log("F: Checking rental owner...");

        //incorrect owner!
        if (req.session.rental_info.account_id != req.user.id){
            error.handler(req, res, "Invalid rental owner!");
        }
        else {
            next();
        }
    },

	//check the rental info posted
	checkRentalInfo : function(req, res, next){
		console.log("F: Checking posted rental info...");

		var address = addProtocol(req.body.address);

		//check for address
		if (!validator.isIP(address) && !validator.isURL(address, {protocols: ["http", "https"], require_protocol: true})){
			error.handler(req, res, "Invalid address!", "json");
		}
		//check for email if it was posted
		else if (!req.user && req.body.new_user_email && !validator.isEmail(req.body.new_user_email)){
			error.handler(req, res, "Invalid email!", "json");
		}
		else {
            //check if its a valid HTTP address and that theres a response
            request(address, function (error, response, body) {
                //all good
                if (!error && response.statusCode == 200) {
                    req.session.new_rental_info = {
                        rental_db_info : {
                            listing_id: req.session.listing_info.id,
                            address: address
                        },
                        new_user_email : req.body.new_user_email
                    };

                    //if user is logged in, otherwise create a token for creation
                    if (req.user){
                        req.session.new_rental_info.rental_db_info.account_id = req.user.id;
                    }
                    else {
                        req.session.new_rental_info.rental_db_info.owner_hash_id = Math.random().toString(36).substr(5,5);
                    }
                    next();
                }
                else {
                    error.handler(req, res, "Invalid address!", "json");
                }
            });

		}
	},

    //check posted rental address
    checkPostedRentalAddress : function(req, res, next){
        //check for address
        if (typeof req.body.address != "undefined"){
            var address = addProtocol(req.body.address);
            console.log("F: Checking posted rental address...");
            if (!validator.isIP(address) && !validator.isURL(address, {protocols: ["http", "https"], require_protocol: true})){
                error.handler(req, res, "Invalid address!", "json");
            }
            else {
                req.session.rental_object.db_object.address = address;
                next();
            }
        }
        else {
            next();
        }
    },

    //check posted rental status
    checkPostedRentalStatus : function(req, res, next){
        var status = req.body.status;

        //check for status
        if (typeof status != "undefined"){
            console.log("F: Checking posted rental status...");
            if (status != "1" && status != "0"){
                error.handler(req, res, "Invalid status!", "json");
            }
            else {
                req.session.rental_object.db_object.status = status;
                next();
            }
        }
        else {
            next();
        }
    },

    //create a rental object for checking
    createRentalObject : function(req, res, next){
        req.session.rental_object = {
            db_object: {}
        };

        next();
    },

	//check times
	checkRentalTimes : function(req, res, next){
		console.log("F: Checking posted rental times...");

		var times = req.body.events;

		//no times posted
		if (!times || times.length <= 0){
			error.handler(req, res, "Invalid dates!", "json");
		}
		else {
			//check if its even a valid JS date
			var invalid_times = [];
			var time_now = (new Date()).getTime();
			for (var x = 0; x < times.length; x++){
				var start_num = parseFloat(times[x].start);
				var end_num = parseFloat(times[x].end);
				var temp_start = new Date(start_num);
				var temp_end = new Date(end_num);

                //check if its a legit date
				if (isNaN(temp_start) || isNaN(temp_end) || start_num <= time_now || end_num <= time_now){
                    invalid_times.push(times[x]);
				}

                //not divisible by hour blocks
                else if (moment(end_num).diff(moment(start_num)) % 3600000 != 0){
                    invalid_times.push(times[x]);
                }

                //start time in the past
                else if (moment(start_num).isBefore(moment())){
                    invalid_times.push(times[x]);
                }

                //end date further than 1 year
                else if (moment(end_num).isAfter(moment().add(1, "year"))){
                    invalid_times.push(times[x]);
                }

                //invalid time slot end
                else if (!moment(end_num).isSame(moment(end_num).subtract(1, "millisecond").endOf(req.session.listing_info.price_type).add(1, "millisecond"))){
                    invalid_times.push(times[x]);
                }

                //invalid time slot start
                else if (moment(start_num).diff(moment()) > 3600000 && !moment(start_num).isSame(moment(start_num).startOf(req.session.listing_info.price_type))){
                    invalid_times.push(times[x]);
                }

			}

			//send back any that were unavailable
			if (invalid_times.length > 0){
				res.send({unavailable : invalid_times})
			}

			else {
				//helper function, check against the DB for any unavailable times
				getListingRentalTimes(req, res, req.session.listing_info, function(){
					crossCheckRentalTime(req.session.listing_info.rentals, times, function(unavailable_times, available_times){
						//send back any that were unavailable
						if (unavailable_times.length > 0){
							res.send({unavailable : unavailable_times})
						}
						//all checks are good!
						else {
							if (!req.session.new_rental_info){
								req.session.new_rental_info = {
									new_rental_times : available_times
								}
							}
							else {
								req.session.new_rental_info.new_rental_times = available_times;
							}
							next();
						}
					});
				});

			}
		}
	},

	//calculate and check for the price
	checkRentalPrice : function(req, res, next){
		console.log("F: Checking rental price...");

		var price = calculatePrice(req.body.events, req.session.listing_info);

		//check for price
		if (!price){
			error.handler(req, res, "Invalid price!", "json");
		}
		else {
			req.session.new_rental_info.price = price;
			next();
		}
	},

	//check if listing is a valid domain name and add it to the search history
	checkDomainListedAndAddToSearch : function(req, res, next){
		console.log("F: Checking if domain is listed on DomaHub...");

		var domain_name = req.params.domain_name;

		Listing.checkListing(domain_name, function(result){

            var listing_result = result;
            var user_ip = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;

            //add to search history if its not localhost
            if (user_ip != "::1" && user_ip != "::ffff:127.0.0.1" && user_ip != "127.0.0.1"){
                var account_id = (typeof req.user == "undefined") ? null : req.user.id;
                var now = new Date().getTime();
                var history_info = {
                    account_id: account_id,			//who searched if who exists
                    domain_name: domain_name.toLowerCase(),		//what they searched for
                    timestamp: now,		//when they searched for it
                    user_ip : user_ip
                }
                console.log("F: Adding to search history...");

                Data.newSearchHistory(history_info, function(result){});	//async
            }

            //doesnt exist, render the whois EJS
            if (!listing_result.info.length || listing_result.state == "error"){
                renderWhoIs(req, res, domain_name);
            }
            else {
                next();     //exists! handle the rest of the route
            }
		});
	},

	//gets the listing info and all rental info/times belonging to it for a verified and active listing
	getVerifiedListing : function(req, res, next) {
		console.log("F: Getting all listing info for the verified listing...");

		Listing.getVerifiedListing(req.params.domain_name, function(result){
			if (result.state=="error"){error.handler(req, res, "Invalid listing!");}
			else if (result.state == "success" && result.info.length == 0){
				error.handler(req, res, "Invalid listing!");
			}
			else {
				getListingRentalTimes(req, res, result.info[0], function(){

                    //get alexa traffic info
                    alexaData.AlexaWebData(req.params.domain_name, function(error, result) {
                        req.session.listing_info.alexa = result;
                        next();
                    });

				});
			}
		});
	},

	//gets the rental/listing info
	getRental : function(req, res, next){
		console.log("F: Getting all rental info...");

		var rental_id = req.params.rental_id;
		var owner_hash_id = req.params.owner_hash_id;

		//if its a number
		if ((parseFloat(rental_id) != rental_id >>> 0) && rental_id != "new"){
			error.handler(req, res, "Invalid rental!");
		}
		//get it otherwise
		else if (!req.session.rental_info || (req.session.rental_info.rental_id != rental_id)){
			Listing.getRentalInfo(rental_id, function(result){
				if (result.state != "success"){error.handler(req, res, result.info);}
                //no rental exists
                else if (result.info.length == 0){
                    error.handler(req, res, "Invalid rental!");
                }
				else {
					req.session.rental_info = result.info[0];
                    //if hash exists in URL and its the same as DB, we're good
                    if (typeof owner_hash_id != "undefined"){
                        if (req.session.rental_info.owner_hash_id == owner_hash_id){
                            req.session.message = "Please create an account to edit this rental!";
                            next();
                        }
                        else {
                            res.redirect('/listing/' + req.params.domain_name + "/" + req.params.rental_id);
                        }
                    }
                    else {
                        next();
                    }
				}
			});
		}
		//if already got the info from previous session
		else {
            //if hash exists in URL and its the same as DB, we're good
            if (typeof owner_hash_id != "undefined"){
                if (req.session.rental_info.owner_hash_id == owner_hash_id){
                    req.session.message = "Please create an account to edit this rental!";
                    next();
                }
                else {
                    res.redirect('/listing/' + req.params.domain_name + "/" + req.params.rental_id);
                }
            }
            else {
                next();
            }
		}
	},

	//gets the rental times info
	getRentalRentalTimes : function(req, res, next){
		console.log("F: Getting all rental times for a rental...");

		var rental_id = req.params.rental_id;

		Listing.getRentalRentalTimes(rental_id, function(result){
			if (result.state != "success"){error.handler(req, res, result.info);}
			else {
				req.session.rental_info.times = joinRentalTimes(result.info);
				next();
			}
		});
	},

    getListingRentalTimes : function(req, res, next){
        console.log("F: Sending all listing times...");

		res.send({
			listing_info: req.session.listing_info
		});
    },

	//get the stripe id of the listing owner and if listing is premium/basic
	getOwnerStripe : function(req, res, next){
		console.log("F: Getting all Stripe info for a listing...");

		//get the stripe id of the listing owner
		Account.getStripeAndType(req.params.domain_name, function(result){
			if (result.state == "error"){error.handler(req, res, result.info);}
			else {
				if (!result.info[0].stripe_user_id){
					error.handler(req, res, "Invalid stripe user account!", "json");
				}
				else {
					req.session.new_rental_info.owner_stripe_id = result.info[0].stripe_user_id;	//stripe id

					//premium or basic listing expiration date
					if (result.info[0].exp_date != 0 && result.info[0].exp_date > (new Date).getTime()){
						req.session.new_rental_info.premium = true;
					}

					next();
				}
			}
		});
	},

	//delete session rental info if it exists
	deleteRentalInfo : function(req, res, next){
		console.log("F: Deleting any previous existing rental info...");

		if (req.session.rental_info){
			delete req.session.rental_info;
		}
		if (req.session.new_rental_info){
			delete req.session.new_rental_info;
		}
        if (req.session.rented){
            delete req.session.rented;
        }
        if (req.session.rented_headers){
            delete req.session.rented_headers;
        }
		next();
	},

	//render a listing that is listed on domahub
	renderListing : function(req, res, next){
		console.log("F: Rendering listing...");

		res.render("listings/listing.ejs", {
			user: req.user,
			message: Auth.messageReset(req),
			listing_info: req.session.listing_info
		});
	},

    //redirect to rental preview route
	redirectToPreview : function(req, res, next){
		console.log("F: Redirecting to rental preview...");
        res.redirect('/rentalpreview');
	},

    checkForPreview : function(req, res, next){
        console.log("F: Checking if preview is defined...");
        if (!req.session.rental_info){
            res.redirect("/profile/myrentals");
        }
        else {
            next();
        }
    },

    //render a rental edit page
    renderRental : function(req, res, next){
        console.log("F: Rendering rental...");
        req.session.rented = req.session.rental_info.address;
        var address_request = request({
            url: addProtocol(req.session.rented),
            encoding: null
        }, function (err, response, body) {
            //not an image requested
            if (response.headers['content-type'].indexOf("image") == -1){
                fs.readFile('./server/views/proxy-index.ejs', function (err, html) {
                    if (err) {error.handler(req, res, "Invalid rental!");}
                    else {
                        res.set("content-type", response.headers["content-type"]);
                        res.end(Buffer.concat([body, html]));
                    }
                });
            }
            else {
                res.render("proxy-image.ejs", {
                    image: req.session.rental_info.address,
                    domain_name: req.params.domain_name
                });
            }
        }).on('error', function(err){
            error.handler(req, res, "Invalid rental!");
        });
    },

	//create a new rental
	createRental : function(req, res, next){
		console.log("F: Creating a new rental...");

		//helper function, create a new rental
		newListingRental(req, res, req.session.new_rental_info.rental_db_info, function(rental_id){

			//format it with the new rental_id from above
			formatNewRentalTimes(rental_id, req.session.new_rental_info.new_rental_times);

			//helper function, create new rental times for the above new rental
			newRentalTimes(req, res, rental_id, req.session.new_rental_info.new_rental_times, function(){
				req.session.new_rental_info.rental_id = rental_id;
				next();
			});
		});
	},

	//add times to rental
	editRentalTimes : function(req, res, next){
		console.log("F: Adding times to an existing rental...");
		var rental_id = req.params.rental_id;

		//format times if it exists
		formatNewRentalTimes(rental_id, req.session.new_rental_info.new_rental_times);

		newRentalTimes(req, res, rental_id, req.session.new_rental_info.new_rental_times, function(){
            delete req.session.new_rental_info;
			delete req.user.rentals;
            next();
		});
	},

	//email the link to the posted email
	emailToRegister : function(req, res, next){
		var owner_hash_id = req.session.new_rental_info.rental_db_info.owner_hash_id;
		var new_user_email = req.session.new_rental_info.new_user_email || req.body.new_user_email;

		if (!req.user && owner_hash_id && new_user_email){
			console.log("F: Emailing registration link to new rental owner...");

			var email = {
				to: req.session.new_rental_info.new_user_email,
				from: 'noreply@domahub.com',
				subject: "Your DomaHub Rental Link",
				text: 'Here is a link to your recent rental of a DomaHub Domain.\n\n' +
					  'You may use the following link to create a account that will be associated with this rental.\n\n' +
					  'https://domahub.com/listing' + req.params.domain_name + req.session.new_rental_info.rental_id + "/" + owner_hash_id + '\n\n'
			};

			//send email of edit link
			mailer.sendMail(email, function(err) {
				if (err) {
					console.log(err)
				}
				next();
			});
		}
		else {
			next();
		}
	},

	//activate the rental once its good
	toggleActivateRental : function(req, res, next){
		console.log("F: Toggling rental activation...");

		var rental_id = (req.session.new_rental_info) ? req.session.new_rental_info.rental_id : req.params.rental_id;
		var domain_name = req.params.domain_name;
		var owner_hash_id = (req.session.new_rental_info) ? req.session.new_rental_info.rental_db_info.owner_hash_id : false;

		Listing.toggleActivateRental(rental_id, function(result){
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

	//updates the owner of a rental that has no owner (hash rental)
	updateRentalOwner : function(req, res, next){
		console.log("F: Updating the rental owner...");
		req.session.rental_object = {
            db_object : {
    			account_id: req.user.id,
    			owner_hash_id: null
    		}
        }
        next();
	},

    updateRentalObject : function(req, res, next){
        updateUserRentalsObject(req.user.rentals, req.session.rental_object.db_object, req.params.rental_id);
        delete req.session.rental_object.db_object;
        res.send({
            state: "success",
            rentals: req.user.rentals
        });
    },

    //edit the rental
    editRental : function(req, res, next){
        console.log("F: Updating rental...");

        updateRental(req, res, req.session.rental_object.db_object, function(){
            next();
        });
    },

    //redirect to rental page after updating its owner
    redirectRental: function(req, res, next){
        console.log("F: Redirecting to rental page...");

        delete req.session.rental_object.db_object;
        delete req.rental_info;
        res.redirect("/listing/" + req.params.domain_name + "/" + req.params.rental_id);
    },

    sendRentalSuccess : function(req, res, next){
        var rental_id = (req.session.new_rental_info) ? req.session.new_rental_info.rental_id : req.params.rental_id;
		var owner_hash_id = (req.session.new_rental_info) ? req.session.new_rental_info.rental_db_info.owner_hash_id : false;
        delete req.session.new_rental_info;

        res.send({
            state: "success",
            rental_id: rental_id,
            owner_hash_id: owner_hash_id || false,
            rentals: (req.user) ? req.user.rentals : false
        });
    }

}

//----------------------------------------------------------------helper functions----------------------------------------------------------------

//helper function to create a new rental
function newListingRental(req, res, raw_info, callback){
	Listing.newListingRental(req.session.listing_info.id, raw_info, function(result){
		if (result.state != "success"){error.handler(req, res, result.info, "json");}
		else {
			callback(result.info.insertId);
		}
	});
}

//helper function to update rental info
function updateRental(req, res, raw_info, callback){
	Listing.updateRental(req.params.rental_id, raw_info, function(result){
		if (result.state != "success"){error.handler(req, res, result.info, "json");}
		else {
			callback();
		}
	});
}

//----------------------------------------------------------------RENTAL TIME HELPERS----------------------------------------------------------------

//helper function to format new rental times
function formatNewRentalTimes(rental_id, times){
	if (times){
		//add the rental id to the formatted
		for (var x in times){
			times[x].unshift(rental_id);
			times[x].push("");
		}
	}
}

//helper function to create new rental times
function newRentalTimes(req, res, rental_id, times, callback){
	Listing.newRentalTimes(rental_id, times, function(result){
		if (result.state != "success"){error.handler(req, res, result.info, "json");}
		else {
			callback();
		}
	});
}

//helper function to get existing rental times
function getListingRentalTimes(req, res, listing_info, callback){
	Listing.getListingRentalsInfo(listing_info.id, function(result){
		if (result.state=="error"){error.handler(req, res, result.info);}
		else {
            //remove some sensitive info
            delete listing_info.stripe_subscription_id;

            //stripe not connected, make sure the listing doesnt accept new rentals
            if (listing_info.stripe_connected == 0){
                listing_info.status = 0;
            }

			listing_info.rentals = joinRentalTimes(result.info);
			req.session.listing_info = listing_info;
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
            if (x != y && orig_start == compare_end){
				temp_times[y].duration = temp_times[y].duration + temp_times[x].duration;
                temp_times.splice(x, 1);
            }
        }
    }

	return temp_times;
}

//helper function to check database for availability
function crossCheckRentalTime(existing_times, new_times, callback){
	var unavailable = [];		//array of all unavailable events
	var available = [];

	//loop through all posted rental times
	for (var y = 0; y < new_times.length; y++){
		var user_start = parseFloat(new_times[y].start);
		var user_duration = parseFloat(new_times[y].end) - user_start;

		var totally_new = true;

		//cross reference with all existing times
		for (var x = 0; x < existing_times.length; x++){
			//check for any overlaps that prevent it from being created
			if (checkOverlap(user_start, user_duration, parseFloat(existing_times[x].date), parseFloat(existing_times[x].duration))){
				totally_new = false;
				unavailable.push(new_times[y]);
			}
		}

		var tempValue = [];

		//totally available! format the time for DB entry
		if (totally_new){
			tempValue.push(
				user_start,
				user_duration
			);
			available.push(tempValue);
		}
	}

	//send back unavailable and formatted events
	callback(unavailable, available);
}

//helper function to check if dates overlap
function checkOverlap(dateX, durationX, dateY, durationY){
	return ((dateX < dateY + durationY) && (dateY < dateX + durationX));
}

//helper function to run whois since domain isn't listed but is a real domain
function renderWhoIs(req, res, domain_name){
	whois.lookup(domain_name, function(err, data){
		//look up domain owner info
		var whoisObj = {};
        if (data){
            var array = parser.parseWhoIsData(data);
            for (var x = 0; x < array.length; x++){
                whoisObj[array[x].attribute] = array[x].value;
            }
        }

		var email = whoisObj["Registrant Email"] || whoisObj["Admin Email"] || whoisObj["Tech Email"] || "";
		var owner_name = whoisObj["Registrant Organization"] || whoisObj["Registrant Name"] || "Nobody";
		var description = "This domain is currently unavailable for rent at domahub. ";

		var options = {
			user: req.user,
			listing_info: {
				domain_name: domain_name,
				email: email,
				username: owner_name,
				description: description
			}
		}

		//nobody owns it!
		if (owner_name == "Nobody" && data){
			options.listing_info.available = true;
		}

        //get alexa traffic info
        alexaData.AlexaWebData(req.params.domain_name, function(error, result) {
            if (!error){
                options.listing_info.alexa = result;
            }
            res.render("listings/listing_unlisted.ejs", options);
        });
	});
}

//---------------------------------------------------------------------------------------------------------------------------------

//helper function to add http or https
function addProtocol(address){
	if (!validator.isURL(address, {
		protocols: ["http", "https"],
		require_protocol: true
	})){
		address = "http://" + address;
	}
	return address;
}

//helper function to divide number
function divided(num, den){
    return Math[num > 0 ? 'floor' : 'ceil'](num / den);
}

//helper function to get price of events
function calculatePrice(times, listing_info){
	if (times && listing_info){
		var totalPrice = 0;

		for (var x = 0; x < times.length; x++){
            //get total number of price type units
            var tempPrice = moment.duration(moment(parseFloat(times[x].end)).diff(moment(parseFloat(times[x].start))));
            if (listing_info.price_type == "month"){
                tempPrice = tempPrice.asDays() / 30;
            }
            else {
                tempPrice = tempPrice.as(listing_info.price_type);
                tempPrice = Number(Math.round(tempPrice+'e2')+'e-2');
            }

            totalPrice += tempPrice;
		}

		return totalPrice * listing_info.price_rate;
	}
	else {return false;}
}

//----------------------------------------------------------------helper functions for user obj----------------------------------------------------------------

//helper function to update req.user.rentals after changing to active
function updateUserRentalsObject(rentals, rental_obj, rental_id){
	for (var x = 0; x < rentals.length; x++){
		if (rentals[x].rental_id == rental_id){
			for (y in rental_obj){
                rentals[x][y] = rental_obj[y];
            }
			break;
		}
	}
}

//helper function to get the req.user listings object for a specific domain
function getUserRentalObj(rentals, domain_name){
	for (var x = 0; x < rentals.length; x++){
		if (rentals[x].domain_name.toLowerCase() == domain_name.toLowerCase()){
			return rentals[x];
		}
	}
}
