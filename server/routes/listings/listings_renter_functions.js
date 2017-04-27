var validator = require("validator");
var whois = require("whois");
var dns = require("dns");

var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');
var mailOptions = {
    auth: {
        api_key: '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'
    }
}
var mailer = nodemailer.createTransport(sgTransport(mailOptions));

var alexaData = require('alexa-traffic-rank');
var parser = require('parse-whois');
var moment = require('moment');

var request = require('request');
var fs = require('fs');
var path = require("path");
var parseDomain = require("parse-domain");
var safe_browse_key = "AIzaSyDjjsGtrO_4QwFDBA1cq9rCweeO4v3YLfs";

var webshot = require("webshot");
var url = require("url");

var node_env = process.env.NODE_ENV || 'dev'; 	//dev or prod bool

module.exports = {

    //delete session rental info if it exists
    deleteRentalInfo : function(req, res, next){
        console.log("F: Deleting any previous existing rental info...");

        if (req.session.rental_info){
            delete req.session.rental_info;
        }
        if (req.session.new_rental_info){
            delete req.session.new_rental_info;
        }
        if (req.session.rented_info){
            delete req.session.rented_info;
        }
        if (req.session.proxy_edit){
            delete req.session.proxy_edit;
        }
        next();
    },

    //<editor-fold>-------------------------------CREATE A NEW RENTAL-------------------------------

    //create a rental object for checking (for new)
    createNewRentalObject : function(req, res, next){
        req.session.new_rental_info = {
            domain_name : req.params.domain_name
        };

        next();
    },

    //check the rental info posted (for creating a new rental)
    checkRentalInfo : function(req, res, next){
        console.log("F: Checking posted rental info...");

        var address = addProtocol(req.body.address);
        var rental_type = parseFloat(req.body.rental_type);

        //check for address
        if (req.body.address && !validator.isURL(address, {protocols: ["http", "https"], require_protocol: true})){
            error.handler(req, res, "Invalid address!", "json");
        }
        //check for email if it was posted
        else if (!req.user && req.body.new_user_email && !validator.isEmail(req.body.new_user_email)){
            error.handler(req, res, "Invalid email!", "json");
        }
        //check for rental type
        else if (rental_type != 0 && rental_type != 1){
            error.handler(req, res, "Invalid rental type!", "json");
        }
        else {
            console.log("F: Checking against Google Safe Browsing...");

            //check against google safe browsing
            request({
                url: "https://safebrowsing.googleapis.com/v4/threatMatches:find?key=" + safe_browse_key,
                method: "POST",
                body: {
                    "client": {
                        "clientId": "domahub",
                        "clientVersion": "1.0"
                    },
                    "threatInfo": {
                        "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
                        "threatEntryTypes": ["URL"],
                        "threatEntries": [
                            {"url": address}
                        ]
                    }
                },
                json: true
            }, function (err, response, body) {
                if (err || response.body.matches){
                    error.handler(req, res, "Malicious address!", "json");
                }
                else {

                    //function to create the new rental info db object
                    var create_new_rental_info = function(){
                        req.session.new_rental_info = {
                            rental_db_info : {
                                listing_id: req.session.listing_info.id,
                                path: req.session.new_rental_info.path,
                                type: rental_type,
                                address: (req.body.address == "" || !req.body.address) ? "" : address    //empty address or not
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

                    if (req.body.address){
                        //check if its a valid HTTP address and that theres a response
                        request(address, function (err, response, body) {
                            if (!err && response.statusCode == 200) {
                                create_new_rental_info();
                            }
                            else {
                                error.handler(req, res, "Nothing displayed at that address!", "json");
                            }
                        });
                    }
                    else {
                        create_new_rental_info();
                    }
                }
            });
        }
    },

    //check times
    checkRentalTimes : function(req, res, next){
        console.log("F: Checking posted rental times...");

        var starttime = parseFloat(req.body.starttime);
        var endtime = parseFloat(req.body.endtime);
        var path = (req.session.new_rental_info.path) ? req.session.new_rental_info.path : req.body.path;

        //no times posted
        if (!starttime || !endtime){
            error.handler(req, res, "Invalid dates! No times posted!", "json");
        }
        else {
            //check if its even a valid JS date
            var start_moment = moment(starttime);
            var end_moment = moment(endtime);

            //check if its a legit date
            if (!start_moment.isValid() || !end_moment.isValid()){
                error.handler(req, res, "Invalid dates! Not valid dates!", "json");
            }

            //not divisible by hour blocks
            else if (end_moment.diff(start_moment) % 3600000 != 0){
                error.handler(req, res, "Not divisible by hour blocks!", "json");
            }

            //start time in the past
            else if (start_moment.isBefore(moment().startOf("hour"))){
                error.handler(req, res, "Start time in the past!", "json");
            }

            //end date further than 1 year
            else if (end_moment.isAfter(moment().add(1, "year"))){
                error.handler(req, res, "End time further than 1 year from now!", "json");
            }

            //invalid time slot end
            else if (!end_moment.isSame(end_moment.subtract(1, "millisecond").endOf(req.session.listing_info.price_type).add(1, "millisecond"))){
                error.handler(req, res, "Invalid end time!", "json");
            }

            //invalid time slot start
            else if (moment().diff(moment().startOf(req.session.listing_info.price_type)) < 3600000 && !start_moment.isSame(start_moment.startOf(req.session.listing_info.price_type))){
                error.handler(req, res, "Invalid start time!", "json");
            }

            else {
                //check against the DB
                Listing.crossCheckRentalTime(req.params.domain_name, path, starttime, endtime, function(result){
                    if (result.state=="error"){error.handler(req, res, result.info, "json");}
                    else {
                        if (result.info.length > 0){
                            error.handler(req, res, "Dates are unavailable!", "json");
                        }
                        //all good!
                        else {
                            req.session.new_rental_info.starttime = starttime;
                            req.session.new_rental_info.endtime = endtime;
                            req.session.new_rental_info.path = path;
                            next();
                        }
                    }
                });
            }
        }
    },

    //calculate and check for the price
    checkRentalPrice : function(req, res, next){
        if (req.session.listing_info.price_rate != 0){
            console.log("F: Checking rental price...");
            var price = calculatePrice(req.body.starttime, req.body.endtime, req.session.listing_info);

            //check for price
            if (!price){
                error.handler(req, res, "Invalid price!", "json");
            }
            else {
                req.session.new_rental_info.price = price;
                next();
            }
        }
        else {
            next();
        }
    },

    //get the stripe id of the listing owner
    getOwnerStripe : function(req, res, next){
        if (req.session.listing_info.price_rate != 0){
            console.log("F: Getting all Stripe info for a listing...");

            //get the stripe id of the listing owner
            Account.getStripeAndType(req.params.domain_name, function(result){
                if (result.state == "error"){error.handler(req, res, result.info);}
                else {
                    if (!result.info[0].stripe_account){
                        error.handler(req, res, "Invalid stripe user account!", "json");
                    }
                    else {
                        req.session.new_rental_info.owner_stripe_id = result.info[0].stripe_account;	//stripe id
                        next();
                    }
                }
            });
        }
        else {
            next();
        }
    },

    //renders the checkout page for creating a new rental
    renderCheckout : function(req, res, next){
        if (req.session.new_rental_info && req.session.new_rental_info.domain_name == req.params.domain_name){
            console.log("F: Rendering listing checkout page...");

            res.render("listings/listing_checkout.ejs", {
                user: req.user,
                message: Auth.messageReset(req),
                listing_info: req.session.listing_info,
                new_rental_info : req.session.new_rental_info
            });
        }
        else {
            console.log("F: Not checking out! Redirecting to listings page...");

            res.redirect("/listing/" + req.params.domain_name);
        }
    },

    //create a new rental
    createRental : function(req, res, next){
        console.log("F: Creating a new rental...");

        //helper function, create a new rental
        newListingRental(req, res, req.session.new_rental_info.rental_db_info, function(rental_id){

            //format it with the new rental_id from above
            var starttime = req.session.new_rental_info.starttime;
            var endtime = req.session.new_rental_info.endtime;
            var new_rental_times = [rental_id, starttime, moment(endtime).diff(moment(starttime))];

            //helper function, create new rental times for the above new rental
            newRentalTimes(req, res, rental_id, [new_rental_times], function(){
                req.session.new_rental_info.rental_id = rental_id;
                next();
            });
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
                'https://domahub.com/listing' + req.params.domain_name + "/" + req.session.new_rental_info.rental_id + "/" + owner_hash_id + '\n\n'
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

    //rental was successful! (send new rental info)
    sendRentalSuccess : function(req, res, next){
        var rental_id = (req.session.new_rental_info) ? req.session.new_rental_info.rental_id : req.params.rental_id;
        var owner_hash_id = (req.session.new_rental_info.rental_db_info) ? req.session.new_rental_info.rental_db_info.owner_hash_id : false;
        delete req.session.new_rental_info;

        res.send({
            state: "success",
            rental_id: rental_id,
            owner_hash_id: owner_hash_id || false
        });
    },

    //</editor-fold>

    //<editor-fold>-------------------------------EDIT RENTAL-------------------------------

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

    //create a rental object for checking (for edit)
    createRentalObject : function(req, res, next){
        req.session.rental_object = {
            db_object: {}
        };

        next();
    },

    //check domain name for rental
    checkRentalDomain : function(req, res, next){
        console.log("F: Checking if rental belongs to the correct domain...");
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

    //check if domain belongs to account (for refunding a rental)
    checkDomainOwner : function(req, res, next){
        console.log("F: Checking domain owner...");

        Listing.checkListingOwner(req.user.id, req.params.domain_name, function(result){
            //incorrect owner!
            if (result.state == "error" || result.info.length == 0){
                error.handler(req, res, "Invalid domain owner!");
            }
            else {
                next();
            }
        });
    },

    //check posted rental address (for editing rental address)
    checkPostedRentalAddress : function(req, res, next){
        if (typeof req.body.address != "undefined"){
            console.log("F: Checking posted rental address...");
            var address = addProtocol(req.body.address);
            if (req.body.address != "" && !validator.isIP(address) && !validator.isURL(address, {protocols: ["http", "https"], require_protocol: true})){
                error.handler(req, res, "Invalid address!", "json");
            }
            //set to nothing
            else if (req.body.address == ""){
                req.session.rental_object.db_object.address = (req.body.address == "") ? "" : address;
                next();
            }
            else {
                var parsed_url = parseDomain(address);

                if (parsed_url == null){
                    error.handler(req, res, "Invalid address!", "json");
                }
                else {
                    //make sure theres something there listening
                    whois.lookup(parsed_url.domain + "." + parsed_url.tld, function(err, data){
                        if (err || !data){error.handler(req, res, "Invalid address!", "json");}
                        else {
                            var whoisObj = {};
                            if (data){
                                var array = parser.parseWhoIsData(data);
                                for (var x = 0; x < array.length; x++){
                                    whoisObj[array[x].attribute] = array[x].value;
                                }
                            }

                            if (whoisObj["Domain Name"]){
                                req.session.rental_object.db_object.address = (req.body.address == "") ? "" : address;
                                next();
                            }
                            else {
                                error.handler(req, res, "There's nothing to display on that page!", "json");
                            }
                        }
                    });
                }
            }
        }
        else {
            next();
        }
    },

    //function to deactivate a rental
    deactivateRental : function(req, res, next){
        console.log("F: Deactivating rental...");
        req.session.rental_object.db_object.status = 0;
        next();
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

    //redirect to rental page after updating its owner
    redirectRental: function(req, res, next){
        console.log("F: Redirecting to rental page...");

        delete req.session.rental_object.db_object;
        delete req.rental_info;
        res.redirect("/listing/" + req.params.domain_name + "/" + req.params.rental_id);
    },

    //check to make sure we should display edit overlay
    checkForPreview : function(req, res, next){
        console.log("F: Checking if preview is defined...");
        if (!req.session.rental_info){
            res.redirect("/");
        }
        else {
            //check if we should display the preview edit menu
            if (req.user && req.user.id == req.session.rental_info.account_id){
                req.session.proxy_edit = true;
            }
            else {
                req.session.proxy_edit = false;
            }

            //coming from /rentalpreview (endless loop)
            if (req.header("Referer") && req.header("Referer").indexOf("rentalpreview") != -1){
                console.log("F: Something went wrong and triggered an endless loop!");
                res.render("proxy/proxy-error.ejs", {
                    image: "",
                    preview: req.session.proxy_edit,
                    doma_rental_info : req.session.rental_info
                });
            }
            else {
                next();
            }
        }
    },

    //redirect to rental preview route
    redirectToPreview : function(req, res, next){
        console.log("F: Redirecting to rental preview...");
        res.redirect('/rentalpreview');
    },

    //render a rental edit page
    renderRental : function(req, res, next){
        console.log("F: Rendering rental...");

        //render the appropriate address
        if (req.session.rental_info.address && req.session.rental_info.type == 0){
            req.session.rented_info = req.session.rental_info;
            var address_request = request({
                url: addProtocol(req.session.rented_info.address),
                encoding: null
            }, function (err, response, body) {
                //not an image requested
                if (response.headers['content-type'].indexOf("image") == -1 && response.headers['content-type'].indexOf("pdf") == -1){
                    console.log("F: Requested rental address was a website!");

                    var index_path = (node_env == "dev") ? path.resolve(process.cwd(), 'server', 'views', 'proxy', 'proxy-index.ejs') : path.resolve(process.cwd(), 'views', 'proxy', 'proxy-index.ejs');
                    var preview_path = (node_env == "dev") ? path.resolve(process.cwd(), 'server', 'views', 'proxy', 'proxy-preview.ejs') : path.resolve(process.cwd(), 'views', 'proxy', 'proxy-preview.ejs');

                    var proxy_index = fs.readFileSync(index_path);
                    var proxy_preview = fs.readFileSync(preview_path);
                    var rental_info_buffer = new Buffer("<script>var doma_rental_info = " + JSON.stringify(req.session.rental_info) + "</script>");
                    var buffer_array = [body, proxy_index, proxy_preview, rental_info_buffer];

                    //if authenticated to edit the rental preview
                    if (req.session.proxy_edit){
                        var edit_path = (node_env == "dev") ? path.resolve(process.cwd(), 'server', 'views', 'proxy', 'proxy-edit.ejs') : path.resolve(process.cwd(), 'views', 'proxy', 'proxy-edit.ejs');
                        var proxy_preview = fs.readFileSync(edit_path);
                        buffer_array.push(proxy_preview);
                    }
                    else {
                        var noedit_path = (node_env == "dev") ? path.resolve(process.cwd(), 'server', 'views', 'proxy', 'proxy-noedit.ejs') : path.resolve(process.cwd(), 'views', 'proxy', 'proxy-noedit.ejs');
                        var proxy_nopreview = fs.readFileSync(noedit_path);
                        buffer_array.push(proxy_nopreview);
                    }

                    if (!proxy_index || (req.session.proxy_edit && !proxy_preview) || (!req.session.proxy_edit && !proxy_nopreview)) {
                        error.handler(req, res, "Invalid rental!");
                    }
                    else {
                        res.set("content-type", response.headers["content-type"]);
                        res.end(Buffer.concat(buffer_array));
                    }
                }
                else {
                    console.log("F: Requested rental address was an image/PDF!");

                    res.render("proxy/proxy-image.ejs", {
                        image: req.session.rental_info.address,
                        content: response.headers['content-type'],
                        edit: req.session.proxy_edit,
                        preview: true,
                        doma_rental_info : req.session.rental_info
                    });
                }
            }).on('error', function(err){
                error.handler(req, res, "Invalid rental!");
            });
        }

        //render the blank template
        else {
            res.render("proxy/proxy-image.ejs", {
                image: "",
                edit: req.session.proxy_edit,
                preview: true,
                doma_rental_info : req.session.rental_info
            });
        }

    },

    //edit the rental (update the database)
    editRental : function(req, res, next){
        console.log("F: Updating rental...");

        updateRental(req, res, req.session.rental_object.db_object, function(){
            next();
        });
    },

    //update the rental session object
    updateRentalObject : function(req, res, next){
        updateUserRentalsObject(req.user.rentals, req.session.rental_object.db_object, req.params.rental_id);
        delete req.session.rental_object.db_object;
        res.send({
            state: "success",
            rentals: req.user.rentals
        });
    },

    //</editor-fold>

    //<editor-fold>-------------------------------DISPLAY LISTING-------------------------------

    //checks to make sure listing is still verified
	checkStillVerified : function(req, res, next){
        //ignore if unlisted
        if (req.session.listing_info.unlisted){
            next();
        }
        else {
            console.log("F: Checking to see if domain is still pointed to DomaHub...");

            dns.resolve(req.params.domain_name, "A", function (err, address, family) {
                if (!err){
                    var domain_ip = address;
                    dns.lookup("domahub.com", function (err, address, family) {
                        if (domain_ip != address && domain_ip.length != 1){
                            console.log("F: Listing is not pointed to DomaHub anymore! Reverting verification...");
                            Listing.updateListing(req.params.domain_name, {
                                verified: null,
                                status: 0
                            }, function(result){
                                getWhoIs(req, res, next);
                            });
                        }
                        else {
                            next();
                        }
                    });
                }
                else {
                    error.handler(req, res, "DNS error!");
                }
            });
        }
	},

    //add to search database
    addToSearch : function(req, res, next){
        //add to search only if we went directly to listing
        if (!req.session.from_api && node_env != "dev"){
            var user_ip = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress;

            //nginx https proxy removes IP
            if (req.headers["x-real-ip"]){
                user_ip = req.headers["x-real-ip"];
            }

            var account_id = (typeof req.user == "undefined") ? null : req.user.id;
            var now = new Date().getTime();
            var history_info = {
                account_id: account_id,			//who searched if who exists
                domain_name: req.params.domain_name.toLowerCase(),		//what they searched for
                timestamp: now,		//when they searched for it
                user_ip : user_ip
            }

            console.log("F: Adding to search history...");
            Data.newListingHistory(history_info, function(result){if (result.state == "error") {console.log(result)}});	//async
            delete req.session.from_api;
        }
        next();
    },

    //gets the listing info if it is listed
    getListingInfo : function(req, res, next) {
        console.log("F: Checking if " + req.params.domain_name + " is listed on DomaHub...");

        Listing.getVerifiedListing(req.params.domain_name, function(result){
            if (result.state=="error"){error.handler(req, res, "Invalid listing!");}
            else if (result.state=="success" && result.info.length <= 0){
                console.log("F: " + req.params.domain_name + " is NOT listed on DomaHub.");

                getWhoIs(req, res, next);
            }
            else {
                console.log("F: " + req.params.domain_name + " is listed on DomaHub!");

                req.session.listing_info = result.info[0];
                next();
            }
        });
    },

    //gets the next year's events for calendar
    getListingTimes : function(req, res, next){
        console.log("F: Getting all time slot information for domain: " + req.params.domain_name + "...");

        //invalid path!
        if (req.body.path != "" && !validator.isAlphanumeric(req.body.path)){
            error.handler(req, res, "Invalid path!", "json");
        }
        else {
            var one_year_later = moment().add(1, "year").add(1, "millisecond")._d.getTime();
            Listing.getListingTimes(req.params.domain_name, req.body.path, one_year_later, function(result){
                if (result.state=="error"){error.handler(req, res, "Something went wrong with getting times!");}
                else {
                    res.json({
                        state : "success",
                        times : result.info
                    });
                }
            });
        }
    },

    //gets X ticker rows per call
    getListingTicker : function(req, res, next){
        console.log("F: Getting ticker data for " + req.params.domain_name + "...");

        //check to see that the posted old rental date is valid
        if (!moment(parseFloat(req.body.oldest_rental_date)).isValid()){
            error.handler(req, res, "Invalid last date for rental!", "json");
        }
        else if (!validator.isInt(req.body.max_count)){
            error.handler(req, res, "Invalid max count!", "json");
        }
        else {
            var max_count = parseFloat(req.body.max_count);

            Listing.getListingRentals(req.params.domain_name, req.body.oldest_rental_date, max_count, function(result){
                if (result.state=="error"){error.handler(req, res, "Something went wrong getting rentals!", "json");}
                else if (result.info.length <= 0){
                    res.send({
                        loaded_rentals : []
                    });
                }
                else {
                    res.send({
                        state: "success",
                        loaded_rentals : result.info
                    });
                }
            });
        }
    },

    //get the traffic of the listing
    getListingTraffic : function(req, res, next){
        console.log("F: Getting all traffic information for domain: " + req.params.domain_name + "...");

        Data.getListingTraffic(req.params.domain_name, function(result){
            if (result.state=="error"){error.handler(req, res, "Invalid traffic!", 'json');}
            else {
                res.json({
                    state : "success",
                    traffic : result.info
                });
            }
        });
    },

    //get alexa traffic info
    getListingAlexa : function(req, res, next){
        console.log("F: Getting all Alexa information for domain: " + req.params.domain_name + "...");

        alexaData.AlexaWebData(req.params.domain_name, function(error, result) {
            if (error){error.handler(req, res, "Invalid Alexa!", 'json');}
            else {
                res.json({
                    state : "success",
                    alexa : result
                });
            }
        });
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

    //render screenshot of a rental, only if coming from a listing page
    renderRentalScreenshot : function(req, res, next){
        var screenshot_address = addProtocol(req.query.rental_address);
        var originating_hostname = (req.header("Referer")) ? url.parse(req.header("Referer")).hostname : "";

        //if we're originating from domahub or localhost
        if (originating_hostname.indexOf("domahub") != -1 || node_env == "dev"){
            if (screenshot_address && validator.isURL(screenshot_address)){
                console.log('F: Capturing screenshot of rental ...');
                var screenshot_options = {
                    quality: 1,
                    renderDelay: 50,
                    screenSize: {},
                    streamType: "jpeg",
                    shotSize: {
                        width: "window",
                        height: "window"
                    },
                    userAgent: 'Mozilla/5.0 (iPhone; U; CPU iPhone OS 3_2 like Mac OS X; en-us) AppleWebKit/531.21.20 (KHTML, like Gecko) Mobile/7B298g'
                }

                if (node_env != "dev"){
                    screenshot_options.phantomPath = "/var/www/w3bbi/phantomjs/bin/phantomjs"
                }

                //queries for screensize
                if (req.query.width && validator.isInt(req.query.width)){
                    screenshot_options.screenSize.width = parseInt(req.query.width);
                }
                if (req.query.height && validator.isInt(req.query.height)){
                    screenshot_options.screenSize.height = parseInt(req.query.height);
                }

                webshot(screenshot_address, screenshot_options, function(err, renderStream) {
                    if (err) {
                        console.log('F: Screenshot of ' + screenshot_address + ' not found!');
                        res.sendStatus(404);
                    }
                    else {
                        renderStream.pipe(res);
                    }
                });
            }
            else {
                console.log('F: Screenshot of ' + screenshot_address + ' not found!');
                res.sendStatus(404);
            }
        }
        //redirect to domahub home page
        else {
            res.redirect("/");
        }

    },

    //time check was successful! redirect to checkout
    redirectToCheckout : function(req, res, next){
        res.send({
            state: "success"
        });
    },

    //</editor-fold>

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

//helper function to create new rental times
function newRentalTimes(req, res, rental_id, times, callback){
    Listing.newRentalTimes(rental_id, times, function(result){
        if (result.state != "success"){error.handler(req, res, result.info, "json");}
        else {
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
            if (temp_times[y].rental_id == temp_times[x].rental_id && x != y && orig_start == compare_end){
                temp_times[y].duration = temp_times[y].duration + temp_times[x].duration;
                temp_times.splice(x, 1);
                break;
            }
        }
    }

    return temp_times;
}

//---------------------------------------------------------------------------------------------------------------------------------

//helper function to run whois since domain isn't listed but is a real domain
function getWhoIs(req, res, next){
    whois.lookup(req.params.domain_name, function(err, data){
        //look up domain owner info
        var whoisObj = {};
        if (data){
            var array = parser.parseWhoIsData(data);
            for (var x = 0; x < array.length; x++){
                whoisObj[array[x].attribute] = array[x].value;
            }
        }

        if (whoisObj["End Text"]){
            console.log("WHOIS Query limit exceeded!");
        }

        var email = whoisObj["Registrant Email"] || whoisObj["Admin Email"] || whoisObj["Tech Email"] || "";
        var owner_name = whoisObj["Registrant Organization"] || whoisObj["Registrant Name"] || "Someone out there";

        var listing_info = {
            domain_name: req.params.domain_name,
            email: email,
            username: owner_name,
            unlisted: true
        }

        //nobody owns it!
        if (!whoisObj["End Text"] && owner_name == "Nobody" && data && whoisObj.source != "IANA"){
            listing_info.available = true;
            listing_info.username = "Nobody yet!";
        }

        req.session.listing_info = listing_info;
        next();
    });
}

//helper function to add http or https
function addProtocol(address){
    if (address){
        if (!validator.isURL(address, {
            protocols: ["http", "https"],
            require_protocol: true
        })){
            address = "http://" + address;
        }
        return address;
    }
    else {
        return "";
    }
}

//helper function to get price of events
function calculatePrice(starttime, endtime, listing_info){
    if (starttime && endtime && listing_info){
        var temp_start = moment(parseFloat(starttime));
        var temp_end = moment(parseFloat(endtime));

		//calculate the price
        var totalPrice = moment.duration(temp_end.diff(temp_start));
        if (listing_info.price_type == "month"){
            totalPrice = totalPrice.asDays() / 30;
        }
        else {
            totalPrice = totalPrice.as(listing_info.price_type);
            totalPrice = Number(Math.round(totalPrice+'e2')+'e-2');
        }
        return totalPrice * listing_info.price_rate;
    }
    else {return false;}
}

//----------------------------------------------------------------helper functions for user obj----------------------------------------------------------------

//helper function to update req.user.rentals after changing to active
function updateUserRentalsObject(user_rentals, db_rentals, rental_id){
    for (var x = user_rentals.length - 1; x >= 0; x--){
        if (user_rentals[x].rental_id == rental_id){

            //delete rental
            if (db_rentals.status == 0){
                user_rentals.splice(x, 1);
            }
            //copy changed settings
            else {
                for (y in db_rentals){
                    user_rentals[x][y] = db_rentals[y];
                }
            }
            break;
        }
    }
}
