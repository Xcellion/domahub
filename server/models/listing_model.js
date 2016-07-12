var sanitizeHtml = require('sanitize-html');

module.exports = listing_model;

function listing_model(database, Account){
	this.db = database;
	this.account = Account;
}

//--------------------------------------------------------------------------------------------------------------------------------

listing_model.prototype.getAllListings = function(callback){
	console.log("Attempting to get all listing info");
	this.db.query('SELECT \
					listings.*,\
					accounts.fullname,\
					accounts.email\
				FROM listings JOIN accounts ON listings.owner_id = accounts.id WHERE listings.price_type != 0', function(result, err){
		//listing info successfully retrieved
		if (!err){
			callback({
				state : "success",
				listings : result
			});
		}
	});
}

//sets info in database
listing_model.prototype.setInfo = function(database, info, special, callback){
	db_query = 'UPDATE ?? SET ?'
	if (special){
		db_query += special;
	}
	this.db.query(db_query, function(result, err){
		//information successfully set into db
		if (!err){
			callback({
				state: "success",
				info: result
			});
		}
		else {
			callback({
				state: "error",
				info: err
			});
		}
	}, [database, info]);
}

//inserts a set of information in database
listing_model.prototype.insertSetInfo = function(database, info, callback){
	console.log("Attempting to set info for database " + database);
	this.db.query('INSERT INTO ?? SET ?', function(result, err){
		//listing info was changed
		if (!err){
			callback({
				state: "success",
				insertId: result.insertId
			});
		}
		else {
			callback({
				state: "error",
				info: err
			});
		}
	}, [database, info]);
}

//inserts information in database
listing_model.prototype.insertInfo = function(database, keys, values, callback){
	console.log("Attempting to set info for database " + database);
	this.db.query('INSERT INTO ?? (??) VALUES ?', function(result, err){
		//listing info was changed
		if (!err){
			callback({
				state: "success",
				insertId: result.insertId
			});
		}
		else {
			callback({
				state : "error",
				info: err
			});
		}
	}, [database, keys, values]);
}

//deletes information in database
listing_model.prototype.deleteInfo = function(database, db_where, db_where_equal, callback){
	console.log("Attempting to delete info for database " + database);
	this.db.query('DELETE FROM ?? WHERE ?? = ?', function(result, err){
		//listing info was changed
		if (!err){
			callback({
				state: "success"
			});
		}
		else {
			callback({
				state: "error",
				info: err
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
	this.db.query(db_query, function(result, err){
		//listing info successfully retrieved
		if (!err){
			callback({
				state : "success",
				info : result
			});
		}
		else {
			callback({
				state: "error",
				info: err
			});
		}
	}, [database, db_where, db_where_equal]);
}

//--------------------------------------------------------------------------------------------------------------------------------

//gets all info for a listing
listing_model.prototype.getListingInfo = function(domain_name, callback){
	db_query = "SELECT \
					listings.*,\
					accounts.fullname,\
					accounts.email\
				FROM ?? JOIN accounts ON listings.owner_id = accounts.id WHERE ?? = ? ";

	console.log("Getting all listing information for " + domain_name);
	Listing.getInfo("listings", "domain_name", domain_name, db_query, function(result){
		if (result.state == "success" && result.info){
			listing_info = result.info[0];
			
			db_query = "SELECT \
							rentals.*, \
							accounts.fullname, \
							accounts.email \
						FROM ?? JOIN accounts ON rentals.account_id = accounts.id  WHERE ?? = ? AND rentals.date != '0000-00-00 00:00:00'"
			
			//get all rental info for that listing that is not default
			Listing.getInfo("rentals", "rentals.listing_id", result.info[0].id, db_query, function(result){
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
				description: "Invalid listing!"
			});
		}
	});
}

//gets listings files info
listing_model.prototype.getListingRental = function(domain_name, rental_id, callback){
	listing_model = this;
	
	//check for listing
	listing_model.getListingInfo(domain_name, function(result){
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
					
					//rental does not belong to this listing!
					else {
						callback({
							state: "error",
							description: "Invalid rental!"
						});
					}
				});

			}
			//otherwise get the current rental
			else {
				listing_model.sendCurrentRental(listing_id, listing_info, callback);
			}
		}
		//listing doesnt exist
		else {
			callback({
				state: "error",
				description: "Invalid listing!"
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
			var rentals = [{
				date: result.info[0].date,
				duration: result.info[0].duration
			}];
			
			//get the rental info for all rentals with same details
			listing_model.getInfo("rentals", "same_details", rental_id, false, function(result){
				if (result.state == "success"){
					for (var x in result.info){
						tempInfo = {
							date: result.info[x].date,
							duration: result.info[x].duration
						}
						rentals.push(tempInfo);
					}
					rental_info.rentals = rentals;
				
					listing_model.getInfo("rental_details", "rental_id", rental_id, false, function(result){
						if (result.state == "success"){
							callback({
								state: "success",
								listing_info: listing_info,
								rental_info: rental_info,
								rental_details: result.info
							});
						}
						//no details exist, send current one instead!
						else {
							listing_model.sendCurrentRental(listing_id, listing_info, function(result){
								callback({
									state: "success",
									listing_info: listing_info,
									rental_info: rental_info,
									rental_details: result.rental_details
								});
							});
						}
					});
				}
				else {
					callback({
						state: "error",
						description: "Invalid rental!"
					});
				}
			});
		}
		else {
			callback({
				state: "error",
				description: "Invalid rental!"
			});
		}
	});
}

//figures out the current rental
listing_model.prototype.sendCurrentRental = function (listing_id, listing_info, callback){
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
				if (result.info.length == 0){
					listing_model.sendDefaultRental(listing_id, listing_info, callback);
				}
				else if (result.state == "success"){
					callback({
						state: "success",
						listing_info: listing_info,
						rental_info: rented,
						rental_details: result.info
					});
				}
				else {
					listing_model.sendDefaultRental(listing_id, listing_info, callback);
				}
			});
		}
		//no rentals!
		else {
			listing_model.sendDefaultRental(listing_id, listing_info, callback);
		}
	});
}

//assuming the listing exists, send the default rental
listing_model.prototype.sendDefaultRental = function(listing_id, listing_info, callback){
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
						listing_info: listing_info,
						rental_info: rental_info,
						rental_details: result.info
					});
				}
				else {
					callback({
						state: "error",
						description: "Invalid rental!"
					});
				}
			});
		}
		else {
			callback({
				state: "error",
				description: "Invalid rental!"
			});
		}
	});
}

//checks to see if a rental is available at that time slot
listing_model.prototype.checkRentalTime = function(domain_name, events, user_id, callback){
	listing_model = this;
	var eventStates = [];

	//get listing info first
	listing_model.getInfo("listings", "domain_name", domain_name, false, function(result){
		if (result.state == "success"){
			listing_info = result.info[0];
			
			db_query = "SELECT * from ?? WHERE ?? = ? AND duration != 0";
			
			//get all rentals for the listing
			listing_model.getInfo("rentals", "listing_id", listing_info.id, db_query, function(result){			
				if (result.state == "success"){
					//array of all unavailable events
					var unavailable = [];

					//loop through all posted events
					for (var y = 0; y < events.length; y++){
						var availability = true;

						//posted date
						var user_start = new Date(events[y].start);
						var user_offset = events[y].offset;
						var user_end = new Date(events[y].end);
						var user_duration = user_end - user_start;
										
						//cross reference with all existing events in the database
						for (var x = 0; x < result.info.length; x++){
							
							//make sure we dont check the default ones
							if (result.info[x].date != "0000-00-00 00:00:00"){
					
								//existing db date, already in UTC
								var db_utc = new Date(result.info[x].date + " UTC");
								var db_duration = result.info[x].duration;
								
								//UTC magic
								var user_utc = toUTC(user_start, user_offset);
														
								//check if legit dates
								if (!isNaN(db_utc) && !isNaN(user_utc)){
									//check if its available
									if (checkOverlap(user_utc, user_duration, db_utc, db_duration)){
										availability = false;
										unavailable.push(events[y])
										break;
									}
								}
							}
						}
						
						events[y].availability = availability;
						eventStates.push(events[y]);
					}
					
					//send the availability of all events posted
					if (eventStates.length){
						callback({
							state: "success",
							eventStates: eventStates,
							listing_id: listing_info.id,
							listing_info: listing_info,
							unavailable: unavailable
						});
					}
				}
				
				//no rentals exist for that listing!
				else {
					callback({
						state: "error",
						description: "Invalid rental!"
					});
				}
			});
		}
		//listing doesnt exist
		else {
			callback({
				state: "error",
				description: "Invalid listing!"
			});
		}
	})
	
}

//rent it now!
listing_model.prototype.newRental = function(domain_name, user_id, new_rental_info, new_rentals, rental_details, callback){
	listing_model = this;
	var error = false;
	
	//first double check that the time is available
	listing_model.checkRentalTime(domain_name, new_rentals, user_id, function(result){		
		if (result.state == "success" && result.unavailable.length == 0){
			var tempStart = new Date(new_rentals[0].start);
			var tempEnd = new Date(new_rentals[0].end);
			var start = toUTC(tempStart, new_rentals[0].offset);
			var end = toUTC(tempEnd, new_rentals[0].offset);
			var insert = {
				account_id: user_id,
				listing_id: result.listing_id,
				type: new_rental_info.type,
				date: start,
				duration: end - start
			};
			
			var editing = new_rental_info.old_rental_info ? true : false;
			
			insert.same_details = editing ? new_rental_info.old_rental_info.rental_id : undefined;
			
			//try to create a new rental
			listing_model.insertSetInfo("rentals", insert, function(result){
				//the rental id of the newly created rental
				insertId = editing ? new_rental_info.old_rental_info.rental_id : result.insertId;
				
				//rental succeeded
				if (result.state == "success"){
					//events are split across multiple times
					if (new_rentals.length > 1){
						var keys = ["account_id", "listing_id", "same_details", "type", "date", "duration"];
						var values = [];
						
						for (var x = 1; x < new_rentals.length; x++){
							var tempValue = [];
							var tempStart = new Date(new_rentals[x].start);
							var tempEnd = new Date(new_rentals[x].end);
							var start = toUTC(tempStart, new_rentals[x].offset);
							var end = toUTC(tempEnd, new_rentals[x].offset);
							var duration = end - start;
							
							tempValue.push(insert.account_id);
							tempValue.push(insert.listing_id);
							tempValue.push(insertId);
							tempValue.push(insert.type);
							tempValue.push(start);
							tempValue.push(duration);
							values.push(tempValue);
						}
												
						listing_model.insertInfo("rentals", keys, values, function(result){
							if (result.state == "success"){
								listing_model.newRentalDetails(insertId, rental_details, editing, callback);
							}
							else {
								listing_model.callbackError(insertId, "Something wrong with multiple rentals!", callback)
							}
						});
					}
					//only 1 time slot
					else {
						listing_model.newRentalDetails(insertId, rental_details, editing, callback);
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
listing_model.prototype.newRentalDetails = function(rental_id, rental_details, editing, callback){
	listing_model = this;

	var keys = ["rental_id", "text_key", "text_value"];
	var values = [];
	
	if (rental_details && !editing){
		for (var x = 0; x < rental_details.length; x++){
			var tempValue = [];
			tempValue.push(rental_id);
			for (var y in rental_details[x]){
				if (rental_details[x][y] == "css"){
					tempValue.push("css");
					tempValue.push("body {background:url(" + sanitizeHtml(rental_details[x][1]) + ") no-repeat center bottom fixed; }");
					break;
				}
				else {
					//make sure to sanitize the HTML
					tempValue.push(sanitizeHtml(rental_details[x][y]));
				}
			}
			
			values.push(tempValue);
		}
		
		//insert the rental details!
		listing_model.insertInfo("rental_details", keys, values, function(result){
			if (result.state == "success"){
				callback({
					state: "success",
					rental_id: rental_id
				});
			}
			else {
				callback({
					state: "error",
					description: "Invalid rental details!"
				});
			}
		});
	}
	else {
		console.log("No rental details to insert!");
		callback({
			state: "success",
			rental_id: rental_id
		});
	}
}

//function to delete existing rental details and add new ones
listing_model.prototype.setRentalDetails = function(rental_id, rental_info, rental_details, callback){
	listing_model = this;
	
	listing_model.getInfo("rentals", "rental_id", rental_id, false, function(result){
		//rental exists!
		if (result.state == "success"){
			var special = " WHERE rental_id = " + rental_id;

			if (rental_info.same_details == "0" || rental_info.same_details == ""){
				rental_info.same_details = null;
			}
			
			delete rental_info.listing_info;
			delete rental_info.rentals;
			
			if (rental_info.rentals){
				domain_name = rental_info.listing_info.domain_name;
				user_id = rental_info.account_id;
				rental_info.same_details = rental_info.rental_id;
			
				listing_model.newRental(domain_name, user_id, rental_info, rental_info.rentals, false, function(result){
					//delete all existing rental data and replace				
					listing_model.deleteInfo("rental_details", "rental_id", rental_id, function(result){
						if (result.state == "success"){
							listing_model.newRentalDetails(rental_id, rental_details, true, callback);
						}
						else {
							callback({
								state: "error",
								description: "Rental detail deletion error!"
							});
						}
					});
				});
			}
			else {
				
			}
		}
		else {
			callback({
				state: "error",
				description: "Invalid rental!"
			});
		}		
	});
}

//function to delete last insert and callback error
listing_model.prototype.callbackError = function(insertId, error, callback){
	listing_model.deleteInfo("rentals", "rental_id", insertId, function(result){
		callback({
			state: "error",
			description: error
		});
	});
}

//helper function to check if dates overlap
function checkOverlap(dateX, durationX, dateY, durationY){
	return ((dateX.getTime() < dateY.getTime() + durationY) && (dateY.getTime() < dateX.getTime() + durationX));
}

//helper function to change a date to UTC
function toUTC(date, offset){
	date = new Date(date - (offset * 60 * 1000));
	return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),  date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
}