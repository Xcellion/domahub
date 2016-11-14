listing_model = function(database){
	this.db = database;

	listing_query = function(query, error_description, callback, params){
		database.query(query, function(result, err){
			if (err){
				if (err.code == "ER_DUP_ENTRY"){
					callback({
						state : "error",
						info : "A listing with this name already exists!",
						errcode : err.code
					});
				}
				else {
					callback({
						state : "error",
						info : error_description,
						errcode : err.code
					});
				}
			}
			else {
				callback({
					state : "success",
					info : result
				});
			}
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

//check if an account owns a listing
listing_model.prototype.checkListingOwner = function(account_id, domain_name, callback){
	console.log("Checking to see if account #" + account_id + " owns domain " + domain_name + "...");
	query = 'SELECT 1 AS "exist" FROM listings WHERE owner_id = ? AND domain_name = ?'
	listing_query(query, "Account does not own the domain" + domain_name + "!", callback, [account_id, domain_name]);
}

//check if an rental belongs to a specific listing
listing_model.prototype.checkListingRental = function(rental_id, domain_name, callback){
	console.log("Checking to see if rental #" + rental_id + " is listed under " + domain_name + "...");
	query = 'SELECT 1 AS "exist" FROM rentals INNER JOIN listings ON rentals.listing_id = listings.id WHERE rentals.rental_id = ? AND listings.domain_name = ?'
	listing_query(query, "Rental does not belong to this listing!", callback, [rental_id, domain_name]);
}

//----------------------------------------------------------------------GETS----------------------------------------------------------

//gets all info for an active listing including owner name and email
listing_model.prototype.getVerifiedListing = function(domain_name, callback){
	console.log("Attempting to get active listing information for " + domain_name + "...");
	query = "SELECT \
				listings.*,\
				accounts.username,\
				accounts.profile_pic,\
				accounts.date_created AS user_created,\
				accounts.email\
			FROM listings \
			JOIN accounts ON listings.owner_id = accounts.id \
			WHERE listings.domain_name = ? AND listings.verified = 1";
	listing_query(query, "Failed to get active listing info for " + domain_name + "!", callback, domain_name);
}

//gets all 'active' listing information including owner name and email
listing_model.prototype.getAllListings = function(callback){
	console.log("Attempting to get all listing info...");
	query = 'SELECT \
				listings.*,\
				accounts.username,\
				accounts.email\
			FROM listings \
			JOIN accounts ON listings.owner_id = accounts.id \
			WHERE listings.status = 1 \
			AND listings.verified = 1'
	listing_query(query, "Failed to get all listing info!", callback);
}

//gets all rentals times and their owners for a specific listing
listing_model.prototype.getListingRentalsInfo = function(listing_id, callback){
	console.log("Attempting to get all existing active rentals for listing #" + listing_id + "...");
	query = "SELECT \
				rentals.account_id, \
				rentals.rental_id, \
				rentals.listing_id, \
				rental_times.date, \
				rental_times.duration, \
				accounts.username, \
				accounts.email \
			FROM rentals \
			INNER JOIN rental_times ON rentals.rental_id = rental_times.rental_id \
			INNER JOIN accounts ON rentals.account_id = accounts.id \
			WHERE rentals.listing_id = ? \
			AND rentals.active = 1 \
			ORDER BY rental_times.date ASC "
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
			LEFT JOIN listings \
			ON rentals.listing_id = listings.id \
			LEFT OUTER JOIN rental_times \
			ON rentals.rental_id = rental_times.rental_id \
			WHERE listings.domain_name = ? \
			AND (UNIX_TIMESTAMP(NOW()) * 1000) BETWEEN rental_times.date AND rental_times.date + rental_times.duration \
			AND listings.status = 1 \
			AND listings.verified = 1\
			AND rentals.active = 1";
	listing_query(query, "Failed to get current rental info for domain " + domain_name + "!", callback, domain_name);
}

//gets all rental times for a specific rental
listing_model.prototype.getRentalTimes = function(rental_id, callback){
	console.log("Attempting to get rental times for rental #" + rental_id + "...");
	query = "SELECT \
				date, \
				duration \
			FROM rental_times \
			WHERE rental_id = ?\
			ORDER BY date ASC"
	listing_query(query, "Failed to get rental times for rental #" + rental_id + "!", callback, rental_id);
}

//gets all rental times for a specific listing to cross check against a new rental (see checkRentalTime)
listing_model.prototype.getListingRentalTimes = function(listing_id, callback){
	console.log("Attempting to get rental times for listing #" + listing_id + "...");
	query = "SELECT \
				rental_times.* \
			FROM rental_times \
			INNER JOIN rentals ON rentals.rental_id = rental_times.rental_id \
			WHERE rentals.listing_id = ? \
			AND rentals.active = 1 \
			ORDER BY rental_times.date ASC "
	listing_query(query, "Failed to get rental times for listing #" + listing_id + "!", callback, listing_id);
}

//gets all rental times for a specific listing to cross check against a new rental (see checkRentalTime)
listing_model.prototype.getRandomListingByCategory = function(category, callback){
	console.log("Attempting to get a random listing with category: " + category + "...");
	query = "SELECT \
				listings.domain_name \
			FROM listings \
			WHERE categories LIKE ? \
			ORDER BY RAND() LIMIT 1"
	listing_query(query, "Failed to get a random listing with category: " + category + "!", callback, category);
}

//gets all active listings with X category, X domain name, X price -- and all active rentals/rental_times for them
listing_model.prototype.getListingByFilter = function(filter_name, filter_price, filter_date, callback){
	console.log("Attempting to search for a listing...");
	query = "SELECT \
				listings.domain_name, \
				listings.hour_price, \
				listings.day_price, \
				listings.week_price, \
				listings.month_price, \
				listings.categories, \
				rentals.rental_id, \
				rental_times.date, \
				rental_times.duration \
			FROM listings \
			LEFT JOIN rentals \
				ON rentals.listing_id = listings.id \
			LEFT JOIN rental_times \
				ON rental_times.rental_id = rentals.rental_id \
			WHERE listings.status = 1 \
			AND listings.verified = 1 \
			AND rentals.active >= 1 \
			AND listings.domain_name LIKE ? \
			AND listings." + filter_price.type + " BETWEEN ? AND ? \
			ORDER BY listings.id ASC, rentals.rental_id ASC, rental_times.date DESC";
	listing_query(query, "Failed to search for listing!", callback, [
		filter_name,
		filter_price.min,
		filter_price.max
	]);
}

//gets a handful of random listings for the search page
listing_model.prototype.getRandomListings = function(callback){
	console.log("Attempting to get 10 random listings...");
	query = "SELECT \
				listings.domain_name, \
				listings.hour_price, \
				listings.day_price, \
				listings.week_price, \
				listings.month_price, \
				listings.categories \
			FROM listings \
			WHERE listings.status = 1 \
			AND listings.verified = 1 \
			ORDER BY rand() \
			LIMIT 10";
	listing_query(query, "Failed to get 10 random listings!", callback);
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
	query = "INSERT IGNORE INTO listings ( \
				domain_name, \
				description, \
				owner_id, \
				verified \
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
	console.log("Attempting to create new rental times for rental #" + rental_id + "...");
	query = "INSERT INTO rental_times (rental_id, date, duration, id) VALUES ? ON DUPLICATE KEY UPDATE \
		rental_id = VALUES(rental_id), \
		date = VALUES(date), \
		duration = VALUES(duration), \
		id = VALUES(id)"
	listing_query(query, "Failed to add new rental times for rental #" + rental_id + "!", callback, [rental_times]);
}

//----------------------------------------------------------------------UPDATE----------------------------------------------------------

//updates listing info
listing_model.prototype.updateListing = function(domain_name, listing_info, callback){
	console.log("Attempting to update domain " + domain_name + "...");
	query = "UPDATE listings \
			SET ? \
			WHERE domain_name = ?"
	listing_query(query, "Failed to update domain " + domain_name + "!", callback, [listing_info, domain_name]);
}

//updates multiple listings, needs to be all created without error, or else cant figure out insert IDs
listing_model.prototype.updateListingsVerified = function(listing_ids, callback){
	console.log("Attempting to revert verified status for bulk domain creation...");
	query = "INSERT INTO listings \
				(id) \
			VALUES ? \
			ON DUPLICATE KEY UPDATE verified=null"
	listing_query(query, "Failed to revert verified status for bulk domain creation!", callback, [listing_ids]);
}

//updates rental info
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

//toggles the rental active or inactive
listing_model.prototype.toggleActivateRental = function(rental_id, callback){
	console.log("Attempting to toggle activation on rental #" + rental_id + "...");
	query = "UPDATE rentals \
			SET active = !active \
			WHERE rental_id = ?"
	listing_query(query, "Failed to toggle activation on rental #" + rental_id + "!", callback, rental_id);
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

//helper function to change a date to UTC
function toUTC(date, offset){
	date = new Date(date - (offset * 60 * 1000));
	return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),  date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
}
