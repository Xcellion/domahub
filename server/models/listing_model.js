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
				state : "success",
				listings : result
			});
		}
	});
}

//sets information in database
listing_model.prototype.setInfo = function(database, info, callback){
	console.log("Attempting to set info for database " + database);
	this.db.query('INSERT INTO ?? SET ?', function(result){
		//listing info was changed
		if (result.affectedRows){
			callback({
				state : "success",
				insertId: result.insertId
			});
		}
		else {
			callback({
				state : "error"
			});
		}
	}, [database, info]);
}

//inserts information in database
listing_model.prototype.insertInfo = function(database, keys, values, callback){
	console.log("Attempting to set info for database " + database);
	this.db.query('INSERT INTO ?? (??) VALUES ?', function(result){
		//listing info was changed
		if (result.affectedRows){
			callback({
				state : "success",
				insertId: result.insertId
			});
		}
		else {
			callback({
				state : "error"
			});
		}
	}, [database, keys, values]);
}

//deletes information in database
listing_model.prototype.deleteInfo = function(database, db_where, db_where_equal, special, callback){
	console.log("Attempting to delete info for database " + database);
	this.db.query('DELETE FROM ?? WHERE ?? = ?', function(result){
		//listing info was changed
		if (result.length >= 0){
			callback({
				state : "success",
				insertId: result.insertId
			});
		}
		else {
			callback({
				state : "success"
			});
		}
	}, [database, db_where, db_where_equal]);
}

//gets listings database info
listing_model.prototype.getInfo = function(database, db_where, db_where_equal, special, callback){
	db_query = 'SELECT * from ?? WHERE ?? = ?'
	if (special){
		db_query = special;
	}
	this.db.query(db_query, function(result){
		//listing info successfully retrieved
		if (result.length > 0){
			callback({
				state : "success",
				info : result
			});
		}
		else {
			callback({
				state: "error",
				info: result
			});
		}
	}, [database, db_where, db_where_equal]);
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
	
	listing_model.getInfo("rentals", "listing_id", listing_id, "SELECT * from ?? WHERE ?? = ? AND duration != 0", function(result){
		var now = new Date();
		now = toUTC(now, now.getTimezoneOffset());
		var rented = false;
		
		//loop through to see if any overlap
		for (var x = 0; x < result.info.length; x++){
			event_date = result.info[x].date + " UTC";
			var existingStart = new Date(event_date);

			if (now.getTime() < existingStart.getTime() + result.info[x].duration
				&& now.getTime() >= existingStart.getTime())
			{
				rented = result.info[x];
				break;
			}
		};
		
		//rented!
		if (rented){
				
			//is the rental the main rental? (for when multiple rentals use the same details)
			if (rented.same_details != null){
				var latest_rental = rented.same_details;
			}
			else {
				var latest_rental = rented.rental_id;
			}
		
			listing_model.getInfo("rental_details", "rental_id", latest_rental, false, function(result){
				if (result.state == "success"){
					callback({
						state: "success",
						rental_info: rented,
						rental_details: result.info
					});
				}
				else {
					listing_model.sendDefaultRental(listing_id, callback);
				}
			});
		}
		//no rentals!
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

//checks to see if a rental is available at that time slot
listing_model.prototype.checkRentalTime = function(domain_name, events, user_id, callback){
	listing_model = this;
	var eventStates = [];

	db_query = "SELECT * from ?? INNER JOIN listings ON rentals.listing_id = listings.id WHERE ?? = ? AND duration != 0"

	//get all rentals for the listing
	listing_model.getInfo("rentals", "listings.domain_name", domain_name, db_query, function(result){
		listing_id = result.info[0].listing_id;
		if (result.state == "success"){
			//loop through all posted events
			for (var y = 0; y < events.length; y++){
				var availability = true;
				var date = events[y].start;
				var offset = events[y].offset;
				var duration = events[y].end - events[y].start;
				
				//cross reference with all existing events in the database
				for (var x = 0; x < result.info.length; x++){
					
					//make sure we dont check the default ones
					if (result.info[x].date != "0000-00-00 00:00:00"){
					
						//UTC magic
						var tempListing = result.info[x].date;
						var tempDate = new Date(result.info[x].date);
						var tempOffset = tempDate.getTimezoneOffset();
						var tempDateX = toUTC(tempDate, tempOffset);
						var tempDateY = toUTC(date, offset);
						
						//check if legit dates
						if (!isNaN(tempDateX) && !isNaN(tempDateY)){
						
							//check if it overlaps
							if (checkSchedule(tempDateX, tempListing.duration, tempDateY, duration)){
								availability = false;
								break;
							}
						}
					}
				}
				var eventState = {
					id: events[y]._id,
					offset: offset,
					availability: availability,
					start: date,
					end: events[y].end
				};
				eventStates.push(eventState);
			}
			
			//send the availability of all events posted
			if (eventStates.length){
				callback({
					state: "success",
					eventStates: eventStates,
					listing_id: listing_id
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

//rent it now!
listing_model.prototype.newRental = function(domain_name, user_id, rental_data, events, callback){
	listing_model = this;
	var error = false;

	//first double check that the time is available
	listing_model.checkRentalTime(domain_name, events, user_id, function(result){
		var start = toUTC(events[0].start, events[0].offset);
		var end = toUTC(events[0].end, events[0].offset);
		
		if (result.state == "success"){
			var insert = {
				account_id: user_id,
				listing_id: result.listing_id,
				type: rental_data.type,
				date: start,
				duration: end - start
			};
			
			//try to create a new rental
			listing_model.setInfo("rentals", insert, function(result){
				insertId = result.insertId;
				
				//rental succeeded
				if (result.state == "success"){
					//events are split across multiple times
					if (events.length > 1){
						var keys = ["account_id", "listing_id", "same_details", "type", "date", "duration"];
						var values = [];
						
						for (var x = 1; x < events.length; x++){
							var tempValue = [];
							
							var tempStart = toUTC(events[x].start, events[x].offset);
							var tempDuration = toUTC(events[x].end, events[x].offset) - tempStart;
							
							tempValue.push(insert.account_id);
							tempValue.push(insert.listing_id);
							tempValue.push(insertId);
							tempValue.push(insert.type);
							tempValue.push(tempStart);
							tempValue.push(tempDuration);
							values.push(tempValue);
						}
						
						listing_model.insertInfo("rentals", keys, values, function(result){
							if (result.state == "success"){
								listing_model.newRentalDetails(insertId, rental_data, callback);
							}
							else {
								listing_model.callbackError(insertId, "Something wrong with multiple rentals!", callback)
							}
						});
					}
					//only 1 time slot
					else {
						listing_model.newRentalDetails(insertId, rental_data, callback);
					}
				}
				//rental failed, delete what was just inserted
				else {
					listing_model.callbackError(insertId, "Something wrong with rental!", callback)
				}
			});
		}
		else {
			callback({
				state: "error",
				description: "Events overlap!"
			});
		}
	});
}

//function to add rental details
listing_model.prototype.newRentalDetails = function(rental_id, rental_data, callback){
	listing_model = this;
	
	switch (parseFloat(rental_data.type)){
		//custom page
		case 0:
			break;
		//simple redirect
		case 1:
			var keys = ["rental_id", "text_key", "text_value"];
			var values = [];
			for (var x = 0; x < rental_data.rental_details.length; x++){
				var tempValue = [];
				tempValue.push(rental_id);
				tempValue.push(rental_data.rental_details[x].rental_key);
				tempValue.push(rental_data.rental_details[x].rental_value);
				
				values.push(tempValue);
			}
						
			listing_model.insertInfo("rental_details", keys, values, function(result){
				if (result.state == "success"){
					callback({
						state: "success"
					});
				}
				else {
					callback({
						state: "error",
						description: "Something wrong with rental details!"
					});
				}
			});
			break;
	}
}

//function to delete last insert and callback error
listing_model.prototype.callbackError = function(insertId, error, callback){
	listing_model.deleteInfo("rentals", "rental_id", insertId, false, function(result){
		callback({
			state: "error",
			description: error
		});
	});
}

//helper function to check if dates overlap
function checkSchedule(dateX, durationX, dateY, durationY){
	return ((dateX.getTime() <= dateY.getTime() + durationY) && (dateY.getTime() <= dateX.getTime() + durationX));
}

//helper function to change a date to UTC
function toUTC(date, offset){
	date = new Date(date - (offset * 60 * 1000));
	return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),  date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
}