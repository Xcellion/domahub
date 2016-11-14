var request = require("request");
var dns = require("dns");
var validator = require("validator");
var sanitize = require("sanitize-html");

var multer = require("multer");
var parse = require("csv-parse");
var fs = require('fs')

var node_env = process.env.NODE_ENV || 'dev'; 	//dev or prod bool
if (node_env == "dev"){
	var stripe = require("stripe")("sk_test_PHd0TEZT5ytlF0qCNvmgAThp");		//stripe API development key
}
else {
	var stripe = require("stripe")("sk_live_Nqq1WW2x9JmScHxNbnFlORoh");		//stripe API production key
}

module.exports = {
	//function to display the create listing choice page
	renderCreateListingChoice : function(req, res, next){
		res.render("listings/listing_create_choice.ejs", {
			user: req.user,
			message: Auth.messageReset(req)
		});
	},

	//function to display the create single listing page
	renderCreateListingSingle : function(req, res, next){
		res.render("listings/listing_create_single.ejs", {
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

	//function to format the listing info when creating a new listing
	checkListingCreateInfo : function(req, res, next){
		var domain_name = req.body.domain_name;
		var description = req.body.description;
		var categories = req.body.categories;

		var background_image = req.body.background_image;
		var buy_link = req.body.buy_link;

		//check the posted info
		if (!description){
			error.handler(req, res, "description", "json");
		}
		else if (!validator.isFQDN(req.body.domain_name)){
			error.handler(req, res, "domain", "json");
		}
		else if (!categories || categories.split(",").length == 0){
			error.handler(req, res, "category", "json");
		}
		// else if (buy_link && !validator.isURL(buy_link, { protocols: ["http", "https"]})){
		// 	error.handler(req, res, "buy", "json");
		// }
		// else if (background_image && !validator.isURL(background_image, { protocols: ["http", "https"]})){
		// 	error.handler(req, res, "background", "json");
		// }

		else {
			next();
		}
	},

	//function to check the pricing of a premium listing
	checkListingCreatePrice : function(req, res, next){
		var stripeToken = req.body.stripeToken;

		//var minute_price = req.body.minute_price || 1;
		var hour_price = parseFloat(req.body.hour_price) || 1;
		var day_price = parseFloat(req.body.day_price) || 10;
		var week_price = parseFloat(req.body.week_price) || 25;
		var month_price = parseFloat(req.body.month_price) || 50;

		//check posted data
		if (!stripeToken){
			error.handler(req, res, "stripe", "json");
		}
		// else if (parseFloat(minute_price) != minute_price >>> 0){
		// 	error.handler(req, res, "minute", "json");
		// }
		else if (hour_price != hour_price >>> 0 || hour_price <= 0){
			error.handler(req, res, "hour", "json");
		}
		else if (day_price != day_price >>> 0 || day_price <= 0){
			error.handler(req, res, "day", "json");
		}
		else if (week_price != week_price >>> 0 || week_price <= 0){
			error.handler(req, res, "week", "json");
		}
		else if (month_price != month_price >>> 0 || month_price <= 0){
			error.handler(req, res, "month", "json");
		}
		else {
			next();
		}
	},

	//function to check if the user can create new listings
	checkAccountListingPriv : function(req, res, next){
		next();
	},

	//function to check the format of the batch CSV file
	checkListingBatch : function(req, res, next){
		onError = function(req, res){
			error.handler(req, res, "CSV parser error!");
		}

		//loop through and parse the CSV file, check every entry and format it correctly
	    parseCSVFile(req.file.path, onError, function(bad_listings, good_listings, domains_sofar){
			if (bad_listings.length > 0){
				res.send({
					state: "error",
					bad_listings: bad_listings,
					good_listings: good_listings,
					all_listings: domains_sofar
				});
			}
			else {
				//need to add owner id, verified, and date created
				for (var x = 0; x < good_listings.length; x++){
					good_listings[x].push("" + req.user.id + "", 1, new Date().getTime());
				}
				req.session.good_listings = good_listings;
				next();
			}
		});
	},

	//function to check the size of the CSV file uploaded
	checkCSVUploadSize : function(req, res, next){
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
			limits: { fileSize: 50000 },
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
					error.handler(req, res, 'File is too big!', "json");
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
		var storage = multer.diskStorage({
			destination: function (req, file, cb) {
				cb(null, './uploads/images');
			},
			filename: function (req, file, cb) {
				cb(null, Date.now() + "_" + req.params.domain_name + "_" + req.user.username);
			}
		});

		var upload_img = multer({
			storage: storage,
			limits: { fileSize: 2500000 },

			//to check for file type
			fileFilter: function (req, file, cb) {
				console.log(req.user.username + " is uploading an image file for parsing...");

				var allowedMimeTypes = [
					"image/jpeg",
					"image/jpg",
					"image/png",
					"image/gif"
				];

				if (allowedMimeTypes.indexOf(file.mimetype) <= -1) {
					cb(new Error('FILE_TYPE_WRONG'));
				}
				else {
					cb(null, true);
				}
			}
		}).single("background_image");

		upload_img(req, res, function(err){
			if (err){
				if (err.code == "LIMIT_FILE_SIZE"){
					error.handler(req, res, 'File is too big!', "json");
				}
				else if (err.message == "FILE_TYPE_WRONG"){
					error.handler(req, res, 'Wrong file type!', "json");
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
		if (req.file){
			var formData = {
				title: req.file.filename,
				image: fs.createReadStream("./uploads/images/" + req.file.filename)
			}

			console.log(req.user.username + " is uploading an image to Imgur...");
			request.post({
				url: "https://imgur-apiv3.p.mashape.com/3/image",
				headers: {
					'X-Mashape-Key' : "72Ivh0ASpImsh02oTqa4gJe0fD3Dp1iZagojsn1Yt1hWAaIzX3",
					'Authorization' : 'Client-ID 730e9e6f4471d64'
				},
				formData: formData
			}, function (error, response, body) {
				if (!error){
					req.new_listing_info = {
						background_image : JSON.parse(body).data.link
					};
					next();
				}
				else {
					console.log(error);
					error.handler(req, res, 'Something went wrong with the upload!', "json");
				}
			});
		}
		//removing image
		else if (req.body.background_image == ""){
			req.new_listing_info = {
				background_image : null
			};
			next();
		}
		else {
			next();
		}
	},

	//function to check that the listing is verified
	checkListingVerified : function(req, res, next){
		if (!req.listing_info){
			req.listing_info = getUserListingObj(req.user.listings, req.params.domain_name);
		}

		if (req.listing_info.status == 0){
			error.handler(req, res, "Please verify that you own this domain!", "json");
		}
		else {
			next();
		}
	},

	//function to check that the user owns the listing
	checkListingOwner : function(req, res, next){
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

	//function to check the posted status change of a listing
	checkListingStatus : function(req, res, next){
		var status = parseFloat(req.body.status);
		var domain_name = req.params.domain_name;

		//if status exists and is not 1 or 0
		if (req.body.status && status != 1 && status != 0){
			error.handler(req, res, "Invalid listing status!", "json");
		}
		else if (req.body.status){
			//check to see if its currently rented
			Listing.getCurrentRental(domain_name, function(result){
				if (result.state != "success" || result.info.length == 0){
					next();
				}
				else {
					error.handler(req, res, "This listing is currently being rented!", "json");
				}
			});
		}
		else {
			next();
		}
	},

	//function to check and reformat new listings details
	checkListingDetails : function(req, res, next){
		var status = parseFloat(req.body.status);
		var buy_link = req.body.buy_link;
        var description = sanitize(req.body.description);
        var hour_price = parseFloat(req.body.hour_price);
        var day_price = parseFloat(req.body.day_price);
        var week_price = parseFloat(req.body.week_price);
        var month_price = parseFloat(req.body.month_price);
        var categories = (req.body.categories) ? sanitize(req.body.categories.replace(/\s\s+/g, ' ').toLowerCase()) : "";

		//if buy_link exists and is not a valid url
		if (req.body.buy_link && !validator.isURL(buy_link, { protocols: ["http", "https"]})){
			error.handler(req, res, "Invalid listing purchase link!", "json");
		}
		//if description exists and is not a valid url
		else if (req.body.description && description.length == 0){
			error.handler(req, res, "Invalid listing description!", "json");
		}
		//if prices exist but are not legit
		else if (req.body.hour_price && (hour_price != hour_price >>> 0) && hour_price <= 0 ||
				 req.body.day_price && (day_price != day_price >>> 0) && day_price <= 0 ||
				 req.body.week_price && (week_price != week_price >>> 0) && week_price <= 0 ||
				 req.body.month_price && (month_price != month_price >>> 0) && month_price <= 0){
			error.handler(req, res, "Invalid listing prices!", "json");
		}
		//if categories exist but less than 1 total
		else if (req.body.categories && categories.length <= 0){
			error.handler(req, res, "You need at least 1 category!", "json");
		}
		else {
			if (!req.new_listing_info) {
				req.new_listing_info = {};
			}
			req.new_listing_info.status = status;
			req.new_listing_info.buy_link = buy_link;
			req.new_listing_info.description = description;
			req.new_listing_info.hour_price = hour_price;
			req.new_listing_info.day_price = day_price;
			req.new_listing_info.week_price = week_price;
			req.new_listing_info.month_price = month_price;
			req.new_listing_info.categories = categories;

			//delete anything that doesnt exist
			for (var x in req.new_listing_info){
				if (!req.body[x] && x != "background_image"){
					delete req.new_listing_info[x];
				}
			}
			next();
		}
	},

	//function to make sure that if they're changing the pricing, that they can change it
	checkListingPriceType : function(req, res, next){
		if (req.new_listing_info.hour_price || req.new_listing_info.day_price || req.new_listing_info.week_price || req.new_listing_info.month_price){
			var listing_info = getUserListingObj(req.user.listings, req.params.domain_name);

			//the listing is still premium, all good to edit!
			if (listing_info.exp_date >= new Date().getTime()){
				next();
			}
			else {
				error.handler(req, res, "You cannot change the pricing for this listing!", "json");
			}
		}
		else {
			next();
		}
	},

	//function to make sure that its different from the existing listing info
	checkListingExisting : function(req, res, next){
		var listing_info = getUserListingObj(req.user.listings, req.params.domain_name)

		for (var x in req.new_listing_info){
			if (req.new_listing_info[x] == listing_info[x]){
				delete req.new_listing_info[x];
			}
		}

		if (Object.keys(req.new_listing_info).length === 0 && req.new_listing_info.constructor === Object){
			error.handler(req, res, "Invalid listing information!", "json");
		}
		//only go next if the object has anything
		else {
			next();
		}
	},

	//function to create a new listing
	createListing : function(req, res, next){
		var listing_info = {
			domain_name : req.body.domain_name,
			description: req.body.description,
			categories: (req.body.categories.indexOf("null") != -1) ? null : req.body.categories,
			owner_id: req.user.id,
			verified: 1,		//create a verified domain to check for existing
			status: 0,
			date_created: (new Date()).getTime()
		}

		Listing.newListing(listing_info, function(result){
			if (result.state=="error"){error.handler(req, res, result.info, "json");}
			else {
				listing_info.id = result.info.insertId;

				//revert verified if its a legit domain
				Listing.updateListing(req.body.domain_name, {verified: null}, function(result){
					if (result.state=="error"){error.handler(req, res, result.info, "json")}
					else {
						//add to the server side users listings object
						listing_info.verified = null;
						req.user.listings.push(listing_info);

						//if premium, go next to handle stripe stuff
						if (req.body.stripeToken){
							next();
						}
						//if its basic, send success
						else {
							res.send({
								state: "success",
								listing_info: listing_info,
								message: "Successfully added a new listing!"
							});
						}
					}
				});
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
						state: "error",
						bad_listings: formatted_listings
					});
				}
				else {
					//figure out what was created
					Account.getAccountListings(req.user.id, function(result){
						if (result.state=="error"){error.handler(req, res, result.info, "json");}
						else {
							//get the insert IDs of newly inserted listings
							var newly_inserted_listings = findNewlyMadeListings(req.user.listings, result.info);
							var inserted_ids = newly_inserted_listings.inserted_ids;
							var inserted_domains = newly_inserted_listings.inserted_domains;

							//figure out what wasnt created
							var listings_result = findUncreatedListings(formatted_listings, inserted_domains);
							var bad_listings = listings_result.bad_listings;
							var good_listings = listings_result.good_listings;

							//revert the newly made listings verified to null
							Listing.updateListingsVerified(inserted_ids, function(result){
								delete req.session.good_listings;
								res.send({
									state: "error",
									bad_listings: bad_listings || false,
									good_listings: good_listings
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
		domain_name = req.params.domain_name;
		Listing.updateListing(domain_name, req.new_listing_info, function(result){
			if (result.state=="error"){error.handler(req, res, result.info, "json")}
			else {
				var background_image = req.new_listing_info.background_image || false;
				updateUserListingsObject(req, res, domain_name);
				res.json({
					state: "success",
					listings: req.user.listings,
					new_background_image : background_image
				});
			}
		});
	},

	//function to verify ownership of a listing
	verifyListing: function(req, res, next){
		domain_name = req.params.domain_name;
		dns.lookup(domain_name, function (err, address, family) {
			if (err){error.handler(req, res, "DNS error!")};

			domain_ip = address;
			dns.lookup("domahub.com", function (err, address, family) {
				if (domain_ip == address){
					req.new_listing_info = {
						domain_name: domain_name,
						verified: 1,
						status: 0
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
	}
}
//----------------------------------------------------------------helper functions----------------------------------------------------------------

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
	// 	//invalid URL for background image
	// 	if (record[2] && !validator.isURL(record[2], { protocols: ["http", "https"]})){
	// 		record_check.state = "error";
	// 		record_check.reasons.push("Invalid background image URL");
	// 	}
	//
	// 	//invalid buy link
	// 	if (record[3] && !validator.isURL(record[3], { protocols: ["http", "https"]})){
	// 		record_check.state = "error";
	// 		record_check.reasons.push("Invalid buy link URL");
	// 	}
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
        done(bad_listings, good_listings, domains_sofar);
    });

    source.pipe(parser);
}

//helper function to update req.user.listings after updating a listing
function updateUserListingsObject(req, res, domain_name){
	for (var x = 0; x < req.user.listings.length; x++){
		if (req.user.listings[x].domain_name.toLowerCase() == domain_name.toLowerCase()){
			req.user.listings[x] = Object.assign({}, req.user.listings[x], req.new_listing_info);
			delete req.new_listing_info;
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

//helper function to check existing req.user listings and compare with any newly made ones to find the insert ID and domain name
function findNewlyMadeListings(user_listings, new_listings){
	var inserted_ids = [];
	var inserted_domains = [];

	//find the insert ids of the newly inserted listings
	for (var x = 0; x < new_listings.length; x++){
		var exists = false;
		for (var y = 0; y < user_listings.length; y++){
			if (new_listings[x].id == user_listings[y].id){
				exists = true;
				break;
			}
		}

		if (!exists){
			inserted_ids.push([new_listings[x].id]);
			inserted_domains.push(new_listings[x].domain_name);
		}
	}

	return {
		inserted_ids : inserted_ids,
		inserted_domains : inserted_domains
	};
}

//helper function to see if any listings failed
function findUncreatedListings(posted_listings, new_listings){
	var bad_listings = [];
	var good_listings = [];

	//loop through all posted listings
	for (var x = 0; x < posted_listings.length; x++){

		//figure out if this posted listing was created or not
		var was_created = false;
		for (var y = 0; y < new_listings.length; y++){
			if (posted_listings[x][0] == new_listings[y]){
				was_created = true;
				break;
			}
		}

		//wasnt created cuz it was a duplicate
		if (!was_created){
			bad_listings.push({
				data: [posted_listings[x][0], posted_listings[x][1]],
				reasons: ["Duplicate domain name!"]
			});
		}
		else {
			good_listings.push([posted_listings[x][0], posted_listings[x][1]]);
		}
	}

	return {
		bad_listings: bad_listings,
		good_listings : good_listings
	};
}
