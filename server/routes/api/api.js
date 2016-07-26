var	account_model = require('../../models/account_model.js'),
	listing_model = require('../../models/listing_model.js');

module.exports = function(app, db, auth, e){
	Auth = auth;
	error = e;

	Account = new account_model(db);
	Listing = new listing_model(db);

	app.get("*", checkHost);
}

//function to check if the requested host is not for w3bbi
function checkHost(req, res, next){
    domain_name = getHostName(req.headers.host);

	if (domain_name != "www.w3bbi.com" && domain_name != "w3bbi.com" && domain_name != "localhost"){
        req.session.api = true;

        Listing.getListingInfo(domain_name, function(result){
            if (result.state == "success"){
                Listing.sendCurrentRental(result.listing_info.id, result.listing_info, function(result){
                    if (result.state == "success"){
                        res.render("reset.ejs", {
                            listing_info: result.listing_info,
                            rental_info: result.rental_info,
                            rental_details: result.rental_details
                        });
                    }
                    else {
                        //todo error, send a custom w3bbi error
                    }
                });
            }

            //listing doesnt exist, drop the connection
            else {
                res.end();
            }
        });
    }
    else {
        next();
    }
}

//helper function to remove http://www
function getHostName(url) {
    var match = url.match(/:\/\/(www[0-9]?\.)?(.[^/:]+)/i);
    if (match != null && match.length > 2 && typeof match[2] === 'string' && match[2].length > 0) {
    return match[2];
    }
    else {
        return null;
    }
}