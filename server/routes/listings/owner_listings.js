var crypto = require('crypto');

var request = require("request");
var dns = require("dns");
var url = require("url");
var val_url = require("valid-url");

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

var	listing_model = require('../../models/listing_model.js');

module.exports = {

	init : function(e, l){
		error = e;
		Listing = l;
	},

	//listing page to search for domain name availability
	getSearchListing : function(req, res, next){
		res.render("search_listings");
	},

	//search for a specific domain name
	postSearchListing : function(req, res, next){
		domain_name = url.parse(addhttp(req.body.domain_name)).host;

		if (!val_url.isUri(addhttp(domain_name))){
			error.handler(req, res, "Invalid domain name!");
		}
		else{
			Listing.checkListing(domain_name, function(result){
				if (result.state == "success" && !result.info.length){
					request({
						url: 'https://api.ote-godaddy.com/v1/domains/available?domain='+ domain_name + '&checkType=FAST&forTransfer=false',
						headers: {
							"Authorization": "sso-key VUxKSUdS_77eVNvivVEXKyjCTTUweLk:77eYkfS7McHYHvcAv9fZdN",
						}
					}, function (error, response, body) {
						if (!error && response.statusCode == 200) {
							res.json(JSON.parse(body));
						}
						else {
							console.log(error, response);
						}
					})
				}
				else {
					res.json({
						state: "success"
					})
				}
			});
		}
	},

	//function to display the create listing page
	createListingPage : function(req, res, next){
		res.render("listing_create.ejs", {
			message: Auth.messageReset(req),
			user: req.user,
		});
	},

	getActivateHash : function(req, res, next){
		account_id = req.user.id;
		domain_name = req.params.domain_name;

		if (!req.header("Referer") || req.header("Referer").split("/").pop() == "activate"){
			error.handler(req, res, "Cannot activate through URL!");
		}
		//check if user id is legit
		else if (parseFloat(account_id) != account_id >>> 0){
			error.handler(req, res, "Invalid user!");
		}
		//check if domain is legit
		else if (!val_url.isUri(addhttp(domain_name))){
			console.log(domain_name, addhttp(domain_name), val_url.isUri(addhttp(domain_name)))
			error.handler(req, res, "Invalid listing activation!");
		}
		else {
			Listing.getInfo("listings", "domain_name", domain_name, false, function(result){
				if (result.state == "success"){
					var hash = crypto.createHash('md5').update('"' + result.info[0].date_created + result.info[0].id + result.info[0].owner_id + '"').digest('hex');
					res.send(hash);
				}
				else {
					error.handler(req, res, "Invalid listing!");
				}
			})
		}
	},

	//function to create a new listing
	createListing : function(req, res, next){
		account_id = req.user.id;
		domain_name = url.parse(addhttp(req.body.domain_name)).host;
		description = req.body.description;

		//check if user id is legit
		if (parseFloat(account_id) != account_id >>> 0){
			error.handler(req, res, "Invalid user!");
		}
		else if (!description){
			error.handler(req, res, "Invalid domain description!");
		}
		else if (!val_url.isUri(addhttp(req.body.domain_name))){
			error.handler(req, res, "Invalid domain name!");
		}
		else {
			info = {
				domain_name : domain_name,
				description: req.body.description,
				owner_id: account_id,
				price_type: 0
			}

			Listing.insertSetInfo("listings", info, function(result){
				if (result.state == "success") {

					Listing.getInfo("listings", "id", result.insertId, false, function(result){
						//create hash based on listing date created, listing id, and owner id
						hash = crypto.createHash('md5').update('"' + result.info.date_created + result.info.id + result.info.owner_id + '"').digest('hex');

						res.json({
							state: "success",
							listing_info: {
								domain_name: domain_name,
								id: result.insertId,
								hash: hash,
								owner_id: account_id,
								price_type: 0
							},
							message: "Successfully added a new listing!"
						})
					})
				}
				else {
					error.handler(req, res, "Listing already exists!", "json");
				}
			})
		}
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

	//function to handle batch listing creation
	createBatchListing : function(req, res, next){
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
				if (record.length != 2){
					bad_listings.push(record, "Incorrect format");
				}
				else if (!val_url.isWebUri(addhttp(record[0]))){
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

		    function done(linesRead){
				//todo - create the good listings, send back list of bad listings
		        res.send({
					listings: listings,
					bad_listings: bad_listings
				});
		    }

		    parseCSVFile(req.file.path, onNewRecord, onError, done);
		}
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
		else if (!val_url.isUri(addhttp(domain_name))){
			console.log(domain_name, addhttp(domain_name), val_url.isUri(addhttp(domain_name)))
			error.handler(req, res, "Invalid listing activation!");
		}
		else {
			var activate = false;
			Listing.getInfo("listings", "domain_name", domain_name, false, function(result){
				if (result.state == "success"){
					var hash = crypto.createHash('md5').update('"' + result.info.date_created + result.info.id + result.info.owner_id + '"').digest('hex');
				}
				else {
					error.handler(req, res, "Invalid listing!");
				}
			})

			switch (activation_type){

				//using a DNS txt record to prove ownership
				case ("txt"):
					dns.resolveTxt(domain_name, function(err, values){
						if (err){
							console.log(err);
						}
						else {
							for (var x = 0; x < values.length; x++){
								if (values[x][0] == hash){
									activate = true;
									break;
								}
							}
						}
					})
					break;

				//using a custom html file to prove ownership
				case ("html"):
					break;

				//using a custom meta file in the main index page of the website to prove ownership
				case ("meta"):
					break;

				//utilizing a custom header in the htaccess file to prove ownership
				case ("htaccess"):
					request({
						url: addhttp(domain_name)
					}, function (error, response, body) {
						if (!error && response.statusCode == 200) {
							if (response.headers.w3bbi == hash){
								activate = true;
							}
						}
						else {
							console.log(error, response);
						}
					})
					break;

				default:
					error.handler(req, res, "Invalid activation type!");
					break;
			}
		}
	}

}
//----------------------------------------------------------------helper functions----------------------------------------------------------------

//helper function to add http protocol to a url if it doesnt have it
function addhttp(url) {
    if (!/^(?:f|ht)tps?\:\/\//.test(url)) {
        url = "http://" + url;
    }
    return url;
}

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
