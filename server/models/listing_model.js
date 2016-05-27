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
listing_model.prototype.getListingInfo = function(db_where, db_where_equal, listing_DB, callback){
	this.db.query('SELECT * from ?? WHERE ?? = ?', function(result){
		//listing info successfully retrieved
		if (result.length > 0){
			callback({
				"state" : "success",
				"listing_info" : result
			});
		}
		else {
			callback({
				"state": "error",
				"description": result
			});
		}
	}, [listing_DB, db_where, db_where_equal]);
}

//gets listings files info
listing_model.prototype.getListingText = function(domain_name, rental_id, callback){
	listing_model = this;
	
	this.getListingInfo("domain_name", domain_name, "listings", function(result){
		//domain exists!
		if (result.state == "success"){
			listing_id = result.listing_info.id;
			
			console.log("Attempting to get rental info for listing #" + listing_id + " with rental id #" + rental_id);
			listing_model.getListingInfo("rental_id", rental_id, "rental_details", function(result){
				if (result.state == "success"){
					callback(result);
				}
				else {
					callback({
						state: "error",
						description: "there is no rental info"
					});
				}
			});
		}
		//domain does not exist
		else {
			callback({
				state : "error",
				description : "domain does not exist"
			});
		}
	})
}