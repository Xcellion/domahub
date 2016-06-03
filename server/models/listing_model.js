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
listing_model.prototype.getListingInfo = function(listing_DB, db_where, db_where_equal, special, callback){
	db_query = 'SELECT * from ?? WHERE ?? = ? '
	if (special){
		db_query += special;
	}
	this.db.query(db_query, function(result){
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
	
	this.getListingInfo("listings", "domain_name", domain_name, false, function(result){
		//domain exists!
		if (result.state == "success"){
			listing_id = result.listing_info[0].id;
			
			if (rental_id){
				listing_model.getListingInfo("rental_details", "rental_id", rental_id, false, function(result){
					if (result.state == "success"){
						callback({
							state: "success",
							listing_info: result.listing_info[0]
						});
					}
					else {
						callback({
							state: "error",
							description: "there is no rental info"
						});
					}
				});
			}
			//no rental ID provided, grab current one
			else {
				listing_model.getListingInfo("rentals", "listing_id", listing_id, "ORDER BY date DESC", function(result){
					var now = new Date();
					var date_array = result.listing_info[0].date.split(/[- :]/);
					var startDate = new Date(date_array[0], date_array[1]-1, date_array[2], date_array[3], date_array[4], date_array[5]);
					//still rented!
					if (startDate.getTime() + result.listing_info[0].duration > now.getTime()){
						callback({
							state: "success",
							listing_info: result.listing_info[0]
						});	
					}
					//last rental expired!
					else {
						callback({
							state: "success",
							listing_info: result.listing_info[result.listing_info.length-1]
						});	
					}
				});
			}
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