

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
	console.log("Checking to see if " + domain_name + " is listed on w3bbi...");
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
				listings.*,\
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
		if (result.state == "success"){
			var now = new Date();
			now = toUTC(now, now.getTimezoneOffset());
			var rented_id = 0;

			//loop through to see if any overlap
			for (var x = 0; x < result.info.length; x++){
				event_date = result.info[x].date + " UTC";
				var existingStart = new Date(event_date);

				if (now.getTime() < existingStart.getTime() + result.info[x].duration
				&& now.getTime() >= existingStart.getTime())
				{
					rented_id = x;
					break;
				}
			};
			callback({
				state: "success",
				rental_id: result.info[rented_id].rental_id,
				info: result.info[rented_id]
			})
		}
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
				rental_times.date, \
				rental_times.duration \
			FROM rental_times \
			INNER JOIN rentals ON rentals.rental_id = rental_times.rental_id \
			WHERE rentals.listing_id = ?"
	listing_query(query, "Failed to get rental times for listing #" + listing_id + "!", callback, listing_id);
}

//function to get any time split rentals
listing_model.prototype.getRentalDetails = function(rental_id, callback){
	console.log("Attempting to get rental details for rental #" + rental_id + "...");
	query = "SELECT \
				main_text, \
				main_font, \
				main_color, \
				middle_text, \
				middle_font, \
				middle_color, \
				location \
			FROM rental_details \
			WHERE rental_id = ?"
	listing_query(query, "Failed to get rental details for rental #" + rental_id + "!", callback, rental_id);
}

//checks to see if a rental is available at that time slot
listing_model.prototype.checkRentalTime = function(listing_id, user_times, callback){
	this.getListingRentalTimes(listing_id, function(result){
		var unavailable = [];		//array of all unavailable events
		var formatted = [];
		if (result.state == "success"){

			//loop through all posted rental times
			for (var y = 0; y < user_times.length; y++){
				var availability = true;
				var user_offset = user_times[y].offset;

				var tempStart = new Date(user_times[y].start);
				var user_start = toUTC(tempStart, user_offset);

				var tempEnd = new Date(user_times[y].end);
				var user_end = toUTC(tempEnd, user_offset);

				var user_duration = user_end - user_start;

				//cross reference with all existing times in the database
				if (result.info || result.info.length > 0){
					for (var x = 0; x < result.info.length; x++){
						//existing db date, already in UTC
						var db_utc = new Date(result.info[x].date + " UTC");
						var db_duration = result.info[x].duration;

						//check for any overlaps
						if (checkOverlap(user_start, user_duration, db_utc, db_duration)){
							availability = false;
							unavailable.push(user_times[y])
							break;		//break loop through existing rental times because this user posted one already overlaps
						}
					}
				}

				//available! format the time for DB entry
				if (availability){
					var tempValue = [];
					tempValue.push(user_start);
					tempValue.push(user_duration);
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

//----------------------------------------------------------------------SETS----------------------------------------------------------

//creates a new rental under a listing
listing_model.prototype.newListingRental = function(listing_id, rental_info, callback){
	console.log("Attempting to create a new rental for listing #" + listing_id + "...");
	query = "INSERT INTO rentals \
			SET ? "
	listing_query(query, "Failed to add a new rental for listing #" + listing_id + "!", callback, rental_info);
}

//creates new rental times for a specific rental
listing_model.prototype.newRentalTimes = function(rental_id, rental_times, callback){
	console.log("Attempting to create a new rental times for rental #" + rental_id + "...");
	query = "INSERT INTO rental_times (rental_id, date, duration) VALUES ? "
	listing_query(query, "Failed to add new rental times for rental #" + rental_id + "!", callback, [rental_times]);
}

//creates new rental details for a specific rental
listing_model.prototype.newRentalDetails = function(rental_id, rental_details, callback){
	console.log("Attempting to create a new rental details for rental #" + rental_id + "...");
	query = "INSERT INTO rental_details \
				(rental_id \
				, main_text \
				, main_color \
				, main_font \
				, middle_text \
				, middle_color \
				, middle_font \
				, location \
			) \
			VALUES ? "
	listing_query(query, "Failed to add new rental details for rental #" + rental_id + "!", callback, [rental_details]);
}

//----------------------------------------------------------------------UPDATE----------------------------------------------------------

//updates a rental info
listing_model.prototype.updateListingRental = function(rental_id, rental_info, callback){
	console.log("Attempting to update rental #" + rental_id + "...");
	query = "UPDATE rentals \
			SET ? \
			WHERE rental_id = ?"
	listing_query(query, "Failed to update rental #" + rental_id + "!", callback, [rental_info, rental_id]);
}

//updates rental times if for the same rental
listing_model.prototype.updateRentalTimes = function(rental_id, rental_times, callback){

}

//----------------------------------------------------------------------DELETE----------------------------------------------------------

//deletes a specific rental
listing_model.prototype.deleteRental = function(rental_id, callback){
	console.log("Attempting to delete rental #" + rental_id + "...");
	query = "DELETE FROM rentals \
			WHERE rental_id = ? "
	listing_query(query, "Failed to delete rental #" + rental_id + "!", callback, rental_id);
}

//deletes a specific rentals details
listing_model.prototype.deleteRentalDetails = function(rental_id, callback){
	console.log("Attempting to delete details for rental #" + rental_id + "...");
	query = "DELETE FROM rental_details \
			WHERE rental_id = ? "
	listing_query(query, "Failed to delete details for rental #" + rental_id + "!", callback, rental_id);
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
