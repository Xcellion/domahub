module.exports = listing_model;

function listing_model(database, Account){
	this.db = database;
	this.account = Account;
}

listing_model.prototype.getAllListings = function(callback){
	console.log("Attempting to get all listing info");
	this.db.query('SELECT \
					listings.date_created,\
					listings.domain_name,\
					listings.price_type,\
					listings.set_price,\
					listings.owner_id,\
					accounts.fullname,\
					accounts.email\
				FROM listings JOIN accounts ON listings.owner_id = accounts.id', function(result){
		//listing info successfully retrieved
		if (result.length >= 0){
			callback({
				"state" : "success",
				"listings" : result
			});
		}
	});
}


//sets listings database
listing_model.prototype.setListings = function(listing_id, listing_info, callback){
	console.log("Attempting to set info for listing #" + listing_id);
	this.db.query('UPDATE listings SET ? WHERE id = ?', function(result){
		//listing info was changed
		if (result.length >= 0){
			callback({
				"state" : "success"
			});
		}
	}, [listing_info, listing_id]);
}

//gets listings database info
listing_model.prototype.getListingInfo = function(listing_id, listing_DB, callback){
	console.log("Attempting to get info for listing #" + listing_id);
	this.db.query('SELECT * from ?? WHERE id = ?', function(result){
		//listing info successfully retrieved
		if (result.length >= 0){
			callback({
				"state" : "success",
				"listing_info" : result[0]
			});
		}
	}, [listing_DB, listing_id]);
}