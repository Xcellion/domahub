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
		db_query = special;
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

//gets all info for a listing
listing_model.prototype.getListingAccount = function(domain_name, callback){
	db_query = "SELECT \
					listings.date_created,\
					listings.domain_name,\
					listings.price_type,\
					listings.set_price,\
					listings.id,\
					accounts.fullname,\
					accounts.email\
				FROM ?? JOIN accounts ON listings.owner_id = accounts.id WHERE ?? = ? ";

	console.log("Getting all listing information and details for " + domain_name);
	Listing.getInfo("listings", "domain_name", domain_name, db_query, function(result){
		if (result.state == "success" && result.info){
			listing_info = result.info[0];
			
			//get all rental info for that listing that is not default
			Listing.getInfo("rentals", "listing_id", result.info[0].id, 'SELECT * from ?? WHERE ?? = ? AND date != "0000-00-00 00:00:00"', function(result){
				if (result.state == "success"){
					listing_info.rentals = result.info;
				}
				else {
					//no existing rentals!
					if (result.info.length == 0){
						listing_info.rentals = [];
					}
				}
				callback({
					state: "success",
					listing_info: listing_info
				});
			});
		}
		//listing doesnt exist
		else {
			callback({
				state: "error",
				description: "Listing doesn't exist!"
			});
		}
	});
}

//gets listings files info
listing_model.prototype.getListingRental = function(domain_name, rental_id, callback){
	listing_model = this;
	
	listing_model.getListingAccount(domain_name, function(result){
		//domain exists!
		if (result.state == "success"){
			listing_id = result.listing_info.id;
			listing_info = result.listing_info;
			
			//if rental id is specified
			if (rental_id){
			
				//check if that rental id belongs to this listing
				listing_model.getInfo("rentals", "listing_id", listing_id, false, function(result){
					rentals = result.info;
					rental_in_listing = false;
				
					for (var x = 0; x < rentals.length; x++){
						if (rentals[x].rental_id == rental_id){
							rental_in_listing = true;
							break;
						}
					}
					
					if (rental_in_listing){
						listing_model.getRental(rental_id, listing_info, callback);
					}
					else {
						callback({
							state: "error",
							description: "Rental does not belong to this domain!"
						});
					}
				});

			}
			//otherwise get the current rental
			else {
				listing_model.sendCurrentRental(listing_id, callback);
			}
		}
		else {
			callback({
				state: "error",
				description: "Listing does not exist!"
			});
		}
	});
}

//gets all information and any details about the rental
listing_model.prototype.getRental = function(rental_id, listing_info, callback){
	listing_model = this;

	listing_model.getInfo("rentals", "rental_id", rental_id, false, function(result){
		if (result.state == "success"){
			rental_info = result.info[0];
			
			listing_model.getInfo("rental_details", "rental_id", rental_id, false, function(result){
				if (result.state == "success"){
					callback({
						state: "success",
						listing_info: listing_info,
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

//figures out the current rental
listing_model.prototype.sendCurrentRental = function (listing_id, callback){
	listing_model = this;
	
	listing_model.getInfo("rentals", "listing_id", listing_id, "SELECT * from ?? WHERE ?? = ? ORDER BY date DESC LIMIT 1", function(result){
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

//assumes listing exists
listing_model.prototype.sendDefaultRental = function(listing_id, callback){
	listing_model = this;

	listing_model.getInfo("rentals", "listing_id", listing_id, "SELECT * from ?? WHERE ?? = ? ORDER BY rental_id ASC", function(result){
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
listing_model.prototype.newRental = function(domain_name, events, user_id, callback){
	listing_model = this;
	var eventStates = [];
	
	db_query = "SELECT * from ?? INNER JOIN listings ON rentals.listing_id = listings.id WHERE ?? = ? "

	//get all rentals for the listing
	listing_model.getInfo("rentals", "listings.domain_name", domain_name, db_query, function(result){
		if (result.state == "success"){
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
							var eventState = {
								id: events[y]._id,
								start: date,
								end: events[y].end
							};
							//check if it overlaps
							if (checkSchedule(tempDateX, tempListing.duration, tempDateY, duration)){
								eventState.availability = false;
								eventStates.push(eventState);
							}
							else {
								eventState.availability = true;
								eventStates.push(eventState);
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