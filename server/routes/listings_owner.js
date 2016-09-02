var	listing_model = require('../models/listing_model.js');

var request = require("request");
var dns = require("dns");
var url = require("url");
var validator = require("validator");

var multer = require("multer");
var parse = require("csv-parse");
var fs = require('fs')

var upload = multer({
	dest:'./uploads',
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
			req.fileValidationError = 'Wrong file type!';
			return cb(null, false, new Error('Wrong file type'));
		}
		cb(null, true);
	}
}).single("csv");

module.exports = {

	init : function(e, l){
		error = e;
		Listing = l;
	},

	//function to display the create listing page
	renderCreateListing : function(req, res, next){
		res.render("listing_create.ejs", {
			message: Auth.messageReset(req),
			user: req.user,
		});
	},

	//function to format the listing info
	checkListingCreate : function(req, res, next){
		domain_name = req.body.domain_name;
		description = req.body.description;

		minute_price = req.body.minute_price || 1;
		hour_price = req.body.hour_price || 1;
		day_price = req.body.day_price || 10;
		week_price = req.body.week_price || 25;
		month_price = req.body.month_price || 50;

		background_image = req.body.background_image || null;
		buy_link = req.body.buy_link || null;

		if (!description){
			error.handler(req, res, "Invalid domain description!");
		}
		else if (!validator.isFQDN(req.body.domain_name)){
			error.handler(req, res, "Invalid domain name!");
		}
		else if ((parseFloat(minute_price) != minute_price >>> 0) ||
				(parseFloat(hour_price) != hour_price >>> 0) ||
				(parseFloat(day_price) != day_price >>> 0) ||
				(parseFloat(week_price) != week_price >>> 0) ||
				(parseFloat(month_price) != month_price >>> 0)){
			error.handler(req, res, "Invalid price!");
		}
		else {
			next();
		}
	},

	//function to create a new listing
	createListing : function(req, res, next){
		listing_info = {
			domain_name : req.body.domain_name,
			description: req.body.description,
			owner_id: req.user.id,
			price_type: 0
		}

		Listing.newListing(listing_info, function(result){
			if (result.state=="error"){error.handler(req, res, result.info);}
			else {
				req.user.refresh_listing = true;		//to refresh the user object's list of listings
				res.send({
					state: "success",
					listing_info: {
						domain_name: domain_name,
						id: result.info.insertId,
						owner_id: req.user.id,
						price_type: 0
					},
					message: "Successfully added a new listing!"
				})
			}
		})
	},

	uploadSizeCheck : function(req, res, next){
		upload(req, res, function(err){
			if (err){
				error.handler(req, res, "File too large!");
			}
			else {
				next();
			}
		});
	},

	//function to check the format of the batch CSV file
	checkListingBatch : function(req, res, next){
		if (!req.file){
			error.handler(req, res, "No file!");
		}
		else if (req.fileToolarge){
			error.handler(req, res, "File too large!");
		}
		else if (req.fileValidationError) {
			error.handler(req, res, "Wrong file type!");
		}
		else {

			onError = function(req, res){
				error.handler(req, res, "CSV parser error!");
			}

		    parseCSVFile(req.file.path, onError, function(bad_listings, good_listings){
				if (bad_listings.length > 0){
					res.send({
						state: "error",
						bad_listings: bad_listings,
						good_listings: good_listings
					})
				}
				else {
					req.session.good_listings = good_listings;
					next();
				}
			});
		}
	},

	//function to create the batch listings once done
	createListingBatch : function(req, res, next){
		console.log('ww');
		req.user.refresh_listing = true;

		//todo - create the good listings, send back list of bad listings
		// res.send({
		// 	listings: listings,
		// 	bad_listings: bad_listings
		// });
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
		record_check.reasons.push("Incorrect format");
	}

	//not a domain name
	if (!validator.isFQDN(record[0])){
		record_check.state = "error";
		record_check.reasons.push("Incorrect domain name");
	}

	//if domain name already exists
	if (domains_sofar && domains_sofar.indexOf(record[0]) != -1){
		record_check.state = "error";
		record_check.reasons.push("Duplicate domain name");
	}

	//no description
	if (record[1].length = 0 || !record[1]){
		record_check.state = "error";
		record_check.reasons.push("Invalid description");
	}

	//optionals were supplied
	if (record.length > 2){
		//invalid price
		if ((record[2] && !validator.isInt(record[2])) ||
			(record[3] && !validator.isInt(record[3])) ||
			(record[4] && !validator.isInt(record[4])) ||
			(record[5] && !validator.isInt(record[5])) ||
			(record[6] && !validator.isInt(record[6]))){
			record_check.state = "error";
			record_check.reasons.push("Invalid price");
		}

		//invalid URL for background image
		if (record[7] && !validator.isURL(record[7], { protocols: ["http", "https"]})){
			record_check.state = "error";
			record_check.reasons.push("Invalid background image URL");
		}

		//invalid buy link
		if (record[8] && !validator.isURL(record[8], { protocols: ["http", "https"]})){
			record_check.state = "error";
			record_check.reasons.push("Invalid buy link URL");
		}

	}

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
				good_listing = {
					row: row,
					data: record
				}
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
