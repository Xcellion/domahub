listing_model = function(database){
	this.db = database;

	listing_query = function(query, error_description, callback, params){
		database.query(query, function(result, err){
			if (err){ console.log(err)}
			callback({
				state : (!err) ? "success" : "error",
				info : (!err) ? result : error_description
			});
		}, params);
	}
}

module.exports = listing_model;

//GET - 'SELECT * from ?? WHERE ?? = ?'
//UPDATE SET - 'UPDATE ?? SET ? WHERE ?? = ?'
//INSERT SET - 'INSERT INTO ?? SET ?'
//INSERT BULK - 'INSERT INTO ?? (??) VALUES ?'
//DELETE - 'DELETE FROM ?? WHERE ?? = ?'

//--------------------------------------------------------------------CHECKS------------------------------------------------------------

//check if a listing exists
listing_model.prototype.checkListing = function(domain_name, callback){
	console.log("Checking to see if " + domain_name + " is listed on domahub...");
	query = 'SELECT 1 AS "exist" FROM listings WHERE domain_name = ?'
	listing_query(query, "Listing does not exist!", callback, domain_name);
}

//check if an account owns a rental
listing_model.prototype.checkAccountRental = function(account_id, rental_id, callback){
	console.log("Checking to see if account #" + account_id + " owns rental #" + rental_id + "...");
	query = 'SELECT 1 AS "exist" FROM rentals WHERE account_id = ? AND rental_id = ?'
	listing_query(query, "Account does not own the rental!", callback, [account_id, rental_id]);
}

//check if an rental belongs to a specific listing
listing_model.prototype.checkListingRental = function(rental_id, domain_name, callback){
	console.log("Checking to see if rental #" + rental_id + " is listed under " + domain_name + "...");
	query = 'SELECT 1 AS "exist" FROM rentals INNER JOIN listings ON rentals.listing_id = listings.id WHERE rentals.rental_id = ? AND listings.domain_name = ?'
	listing_query(query, "Rental does not belong to this listing!", callback, [rental_id, domain_name]);
}

//checks to see if a rental is available at that time slot
listing_model.prototype.checkRentalTime = function(listing_id, user_times, callback){
	this.getListingRentalTimes(listing_id, function(result){
		var unavailable = [];		//array of all unavailable events
		var formatted = [];
		if (result.state == "success"){

			//loop through all posted rental times
			for (var y = 0; y < user_times.length; y++){
				var tempStart = new Date(user_times[y].start);
				var tempEnd = new Date(user_times[y].end);

				var user_offset = user_times[y].offset;
				var user_start = toUTC(tempStart, user_offset);
				var user_end = toUTC(tempEnd, user_offset);
				var user_duration = user_end - user_start;

				var totally_new = true;

				//cross reference with all existing times in the database
				if (result.info && result.info.length > 0){
					for (var x = 0; x < result.info.length; x++){
						var db_start = new Date(result.info[x].date + "Z");
						var db_duration = result.info[x].duration;
						var db_end = db_start.getTime() + db_duration;

						//check for any overlaps that prevent it from being created
						if (checkOverlap(user_start, user_duration, db_start, db_duration)){
							totally_new = false;
							unavailable.push(user_times[y]);
						}
					}
				}

				var tempValue = [];

				//totally available! format the time for DB entry
				if (totally_new){
					tempValue.push(
						user_start,
						user_duration
					);
					formatted.push(tempValue);
				}
			}

			//send back unavailable and formatted events
			callback({
				state: "success",
				unavailable: unavailable,
				formatted: formatted
			});
		}
		else {
			callback({
				state: "error",
				info: result.info
			});
		}
	});
}

//----------------------------------------------------------------------GETS----------------------------------------------------------

//gets all info for a listing including owner name and email
listing_model.prototype.getListing = function(domain_name, callback){
	console.log("Attempting to get all listing information for " + domain_name + "...");
	query = "SELECT \
				listings.*,\
				accounts.fullname,\
				accounts.email\
			FROM listings \
			JOIN accounts ON listings.owner_id = accounts.id \
			WHERE listings.domain_name = ? ";
	listing_query(query, "Failed to get listing info for " + domain_name + "!", callback, domain_name);
}

//gets all 'active' listing information including owner name and email
listing_model.prototype.getAllListings = function(callback){
	console.log("Attempting to get all listing info...");
	query = 'SELECT \
				listings.*,\
				accounts.fullname,\
				accounts.email\
			FROM listings \
			JOIN accounts ON listings.owner_id = accounts.id \
			WHERE listings.price_type != 0'
	listing_query(query, "Failed to get all listing info!", callback);
}

//gets all non-default rentals times and their owners for a specific listing
listing_model.prototype.getListingRentalsInfo = function(listing_id, callback){
	console.log("Attempting to get all existing rentals for listing #" + listing_id + "...");
	query = "SELECT \
				rentals.account_id, \
				rentals.rental_id, \
				rentals.listing_id, \
				rental_times.*, \
				accounts.fullname, \
				accounts.email \
			FROM rentals \
			INNER JOIN rental_times ON rentals.rental_id = rental_times.rental_id \
			INNER JOIN accounts ON rentals.account_id = accounts.id  \
			WHERE rentals.listing_id = ?"
	listing_query(query, "Failed to get all non-default rental info for listing #" + listing_id + "!", callback, listing_id);
}

//gets all rental info for a specific rental
listing_model.prototype.getRentalInfo = function(rental_id, callback){
	console.log("Attempting to get all rental info for rental #" + rental_id + "...");
	query = "SELECT * \
			FROM rentals \
			WHERE rental_id = ?"
	listing_query(query, "Failed to get all info for rental #" + rental_id + "!", callback, rental_id);
}

//get all rental information for the default rental
listing_model.prototype.getDefaultRental = function(listing_id, callback){
	console.log("Attempting to get all default rental info for listing #" + listing_id + "...");
	query = "SELECT * \
			FROM rentals \
			WHERE listing_id = ? \
			ORDER BY rental_id \
			ASC LIMIT 1";
	listing_query(query, "Failed to get default rental for listing #" + listing_id + "!", callback, listing_id);
}

//gets all rental information for the current rental
listing_model.prototype.getCurrentRental = function(domain_name, callback){
	console.log("Attempting to get current rental info for for domain " + domain_name + "...");
	query = "SELECT \
				rentals.*,\
				listings.domain_name,\
				listings.id,\
				rental_times.date,\
				rental_times.duration \
			FROM rentals \
			INNER JOIN listings \
			ON rentals.listing_id = listings.id \
			LEFT OUTER JOIN rental_times \
			ON rentals.rental_id = rental_times.rental_id \
			WHERE listings.domain_name = ? \
			ORDER BY rentals.rental_id ASC";
	listing_query(query, "Failed to get current rental info for domain " + domain_name + "!", function(result){
		if (result.state == "success" && result.info.length){
			var now = new Date();
			now = toUTC(now, now.getTimezoneOffset());
			var bool = true;

			//loop through to see if any overlap
			for (var x = 0; x < result.info.length; x++){
				event_date = result.info[x].date + "Z";
				var existingStart = new Date(event_date);

				if (now.getTime() < existingStart.getTime() + result.info[x].duration
				&& now.getTime() >= existingStart.getTime())
				{
					bool = false;
					callback({
						state: "success",
						rental_id: result.info[x].rental_id,
						info: result.info[x]
					})
					break;
				}
			}

			//none of them are active right now!
			if (bool){
				callback({
					state: "success",
					rental_id: false
				})
			}
		}

		//no rentals to loop through
		else if (result.state == "success" && result.info.length == 0){
			callback({
				state: "success",
				rental_id: false
			})
		}

		//some sort of error
		else {
			callback({
				state: "error",
				info: "Failed to get current rental for listing #"
			});
		}
	}, domain_name);
}

//gets all rental times for a specific rental
listing_model.prototype.getRentalTimes = function(rental_id, callback){
	console.log("Attempting to get rental times for rental #" + rental_id + "...");
	query = "SELECT \
				date, \
				duration \
			FROM rental_times \
			WHERE rental_id = ?"
	listing_query(query, "Failed to get rental times for rental #" + rental_id + "!", callback, rental_id);
}

//gets all rental times for a specific listing
listing_model.prototype.getListingRentalTimes = function(listing_id, callback){
	console.log("Attempting to get rental times for listing #" + listing_id + "...");
	query = "SELECT \
				rental_times.* \
			FROM rental_times \
			INNER JOIN rentals ON rentals.rental_id = rental_times.rental_id \
			WHERE rentals.listing_id = ?"
	listing_query(query, "Failed to get rental times for listing #" + listing_id + "!", callback, listing_id);
}

//----------------------------------------------------------------------SETS----------------------------------------------------------

//creates a new listing
listing_model.prototype.newListing = function(listing_info, callback){
	console.log("Attempting to create a new listing: " + listing_info.domain_name + "...");
	query = "INSERT INTO listings \
			SET ? "
	listing_query(query, "Failed to create a new listing: " + listing_info.domain_name + "!", callback, listing_info);
}

//creates multiple new listings
//BULK INSERT NEEDS TRIPLE NESTED ARRAYS
listing_model.prototype.newListings = function(listing_info_array, callback){
	console.log("Attempting to create " + listing_info_array.length + " new listings...");
	query = "INSERT INTO listings ( \
				domain_name, \
				description, \
				minute_price, \
				hour_price, \
				day_price, \
				week_price, \
				month_price, \
				background_image, \
				buy_link, \
				owner_id, \
				set_price \
			)\
			 VALUES ? "
	listing_query(query, "Failed to create " + listing_info_array.length + " new listings!", callback, [listing_info_array]);
}

//creates a new rental under a listing
listing_model.prototype.newListingRental = function(listing_id, rental_info, callback){
	console.log("Attempting to create a new rental for listing #" + listing_id + "...");
	query = "INSERT INTO rentals \
			SET ? "
	listing_query(query, "Failed to add a new rental for listing #" + listing_id + "!", callback, rental_info);
}

//creates new rental times for a specific rental
//BULK INSERT NEEDS TRIPLE NESTED ARRAYS
listing_model.prototype.newRentalTimes = function(rental_id, rental_times, callback){
	console.log("Attempting to create a new rental times for rental #" + rental_id + "...");
	query = "INSERT INTO rental_times (rental_id, date, duration, id) VALUES ? ON DUPLICATE KEY UPDATE \
		rental_id = VALUES(rental_id), \
		date = VALUES(date), \
		duration = VALUES(duration), \
		id = VALUES(id)"
	listing_query(query, "Failed to add new rental times for rental #" + rental_id + "!", callback, [rental_times]);
}

//----------------------------------------------------------------------UPDATE----------------------------------------------------------

//updates a rental info
listing_model.prototype.updateRental = function(rental_id, rental_info, callback){
	console.log("Attempting to update rental #" + rental_id + "...");
	query = "UPDATE rentals \
			SET ? \
			WHERE rental_id = ?"
	listing_query(query, "Failed to update rental #" + rental_id + "!", callback, [rental_info, rental_id]);
}

//updates rental times if for the same rental
listing_model.prototype.updateRentalTime = function(new_rental_times, callback){
	console.log("Attempting to update rental time #" + rental_time_id + "...");
	query = "UPDATE rental_times \
			SET duration = ? \
			WHERE id = ?"
	listing_query(query, "Failed to update rental #" + rental_id + "!", callback, new_rental_times);
}

//----------------------------------------------------------------------DELETE----------------------------------------------------------

//deletes a specific rental
listing_model.prototype.deleteRental = function(rental_id, callback){
	console.log("Attempting to delete rental #" + rental_id + "...");
	query = "DELETE FROM rentals \
			WHERE rental_id = ? "
	listing_query(query, "Failed to delete rental #" + rental_id + "!", callback, rental_id);
}

//----------------------------------------------------------------------HELPER----------------------------------------------------------

//helper function to check if dates overlap
function checkOverlap(dateX, durationX, dateY, durationY){
	return ((dateX.getTime() < dateY.getTime() + durationY) && (dateY.getTime() < dateX.getTime() + durationX));
}

//helper function to change a date to UTC
function toUTC(date, offset){
	date = new Date(date - (offset * 60 * 1000));
	return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),  date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
}
