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
		if (req.fileToolarge){
			error.handler(req, res, "File too large!");
		}
		else if (req.fileValidationError) {
			error.handler(req, res, "Wrong file type!");
		}
		else {
			var listings = [];
			var bad_listings = [];

		    function onNewRecord(record){
				//at least 2 records required -- domain name and description
				if (record.length < 2){
					bad_listings.push(record, "Incorrect format");
				}
				else if (!validator.isFQDN(record[0])){
					bad_listings.push(record, "Incorrect domain name");
				}
				else if (record[1].length = 0 || !record[1]){
					bad_listings.push(record, "Need a description");
				}
				else {
					listings.push(record);
				}
		    }

		    function onError(error){
				console.log(error);
		    	error.handler(req, res, "CSV parser error!");
		    }

		    parseCSVFile(req.file.path, onNewRecord, onError, next);
		}
	},

	//function to create the batch listings once done
	createListingBatch : function(req, res, next){
		//todo - create the good listings, send back list of bad listings
		res.send({
			listings: listings,
			bad_listings: bad_listings
		});
	},

	//function to change listing to active
	activateListing : function(req, res, next){
		account_id = req.user.id;
		domain_name = req.params.domain_name;
		activation_type = req.body.activation_type;

		//check if user id is legit
		if (parseFloat(account_id) != account_id >>> 0){
			error.handler(req, res, "Invalid user!");
		}
		//check if domain is legit
		else if (!validator.isFQDN(req.body.domain_name)){
			error.handler(req, res, "Invalid listing activation!");
		}
		else {

		}
	}

}
//----------------------------------------------------------------helper functions----------------------------------------------------------------

//helper function to parse the csv file
function parseCSVFile(sourceFilePath, onNewRecord, handleError, done){
    var source = fs.createReadStream(sourceFilePath);
    var parser = parse({
		skip_empty_lines: true
    });

    parser.on("readable", function(){
        var record;
        while (record = parser.read()) {
            onNewRecord(record);
        }
    });

    parser.on("error", function(error){
        handleError(error)
    });

    parser.on("end", function(){
        done();
    });

    source.pipe(parser);
}
