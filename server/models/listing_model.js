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
listing_model.prototype.setListings = function(listing_id, info, callback){
	console.log("Attempting to set info for listing #" + listing_id);
	this.db.query('UPDATE listings SET ? WHERE id = ?', function(result){
		//listing info was changed
		if (result.length >= 0){
			callback({
				"state" : "success"
			});
		}
	}, [info, listing_id]);
}

//gets listings database info
listing_model.prototype.getInfo = function(listing_DB, db_where, db_where_equal, special, callback){
	db_query = 'SELECT * from ?? WHERE ?? = ?'
	if (special){
		db_query += special;
	}
	this.db.query(db_query, function(result){
		//listing info successfully retrieved
		if (result.length > 0){
			callback({
				"state" : "success",
				"info" : result
			});
		}
		else {
			callback({
				"state": "error",
				"info": result
			});
		}
	}, [listing_DB, db_where, db_where_equal]);
}

//gets listings files info
listing_model.prototype.getListingRental = function(domain_name, callback){
	listing_model = this;
	
	this.getInfo("listings", "domain_name", domain_name, false, function(result){
		//domain exists!
		if (result.state == "success"){
			listing_id = result.info[0].id;

			listing_model.getInfo("rentals", "listing_id", listing_id, " ORDER BY date DESC LIMIT 1", function(result){
				var now = new Date();
				var rental_info = result.info[0];
				var startDateJS = new Date(rental_info.date);
				var type = rental_info.type;
				
				//is the rental the main rental? (for when multiple rentals use the same details)
				if (result.info[0].same_details != null){
					var latest_rental = result.info[0].same_details 
				}
				else {
					var latest_rental = result.info[0].rental_id;
				}

				//not yet time!
				if (startDateJS.getTime() > now.getTime()){
					listing_model.sendDefaultRental(listing_id, callback);
				}
				//rented!
				else if (startDateJS.getTime() + result.info[0].duration > now.getTime()){
					listing_model.getInfo("rental_details", "rental_id", latest_rental, false, function(result){
						if (result.state == "success"){
							callback({
								state: "success",
								rental_info: rental_info,
								rental_details: result.info
							});
						}
						else {
							listing_model.sendDefaultRental(listing_id, callback);
						}
					});
				}
				//last rental expired!
				else {
					listing_model.sendDefaultRental(listing_id, callback);
				}
			});
		}
		//domain does not exist
		else {
			callback({
				state : "error",
				description : "Domain does not exist"
			});
		}
	})
}

listing_model.prototype.getRental = function(rental_id, callback){
	listing_model = this;

	listing_model.getInfo("rentals", "rental_id", rental_id, false, function(result){
		if (result.state == "success"){
			rental_info = result.info[0];
			
			listing_model.getInfo("rental_details", "rental_id", rental_id, false, function(result){
				if (result.state == "success"){
					callback({
						state: "success",
						rental_info: rental_info,
						rental_details: result.info
					});
				}
				else {
					callback({
						state: "error",
						description: "Rental details dont exist!"
					});
				}
			});
		}
		else {
			callback({
				state: "error",
				description: "Rental doesnt exist!"
			});
		}
	});
}

//assumes listing exists
listing_model.prototype.sendDefaultRental = function(listing_id, callback){
	listing_model = this;

	listing_model.getInfo("rentals", "listing_id", listing_id, " ORDER BY rental_id ASC", function(result){
		//success!
		if (result.state == "success"){
			default_rental = result.info[0].rental_id;
			var rental_info = result.info[0]
			listing_model.getInfo("rental_details", "rental_id", default_rental, false, function(result){
				if (result.state == "success"){
					callback({
						state: "success",
						rental_info: rental_info,
						rental_details: result.info
					});
				}
				else {
					callback({
						state: "error",
						description: "There is no rental info!"
					});
				}
			});
		}
		else {
			callback({
				state: "error",
				description: "Default rental could not be found!"
			});
		}
	});
}

//checks to see if a rental is available at that time slot, and then rents it
listing_model.prototype.newRental = function(listing, events, user_id, callback){
	listing_model = this;
	var eventStates = [];

	//get all rentals for the listing
	listing_model.getInfo("rentals", "listing_id", listing, false, function(result){	
		if (result.info.length){
			//loop through all existing events in the database
			for (var x = 0; x < result.info.length; x++){
				//if not any of the default ones
				if (result.info[x].date != "0000-00-00 00:00:00" || result.info[x].duration != 0){
					//cross reference with all events posted
					for (var y = 0; y < events.length; y++){
						var date = events[y].start;
						var duration = events[y].end - events[y].start;

						var tempListing = result.info[x];
						var tempDateX = new Date(tempListing.date);
						var tempDateY = toUTC(date);
						
						if (!isNaN(tempDateX) && !isNaN(tempDateY)){
							//check if it overlaps
							if (checkSchedule(tempDateX, tempListing.duration, tempDateY, duration)){
								eventStates.push({
									id: events[y]._id,
									availability : false
								});
							}
							else {
								eventStates.push({
									id: events[y]._id,
									availability : true
								});
							}
						}
					}
				}
			}
			
			//send the availability of all events posted
			if (eventStates.length){
				callback({
					state: "success",
					eventStates: eventStates
				});
			}
		}
		
		//no rentals exist for that listing!
		else {
			callback({
				state: "error",
				description: "There is no rental info!"
			});
		}
	});
}

//helper function to check if dates overlap
function checkSchedule(dateX, durationX, dateY, durationY){
	return (dateX.getTime() <= dateY.getTime() + durationY) && (dateY.getTime() <= dateX.getTime() + durationX);
}

//helper function to change a date to UTC
function toUTC(date){
	date = new Date(date);
	return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),  date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
}