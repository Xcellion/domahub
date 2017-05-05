listing_model = function(database){
	this.db = database;

	listing_query = function(query, error_description, callback, params){
		database.query(query, function(result, err){
			if (err){
				console.log(err);
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

//<editor-fold>-------------------------------CHECKS-------------------------------

//check if a listing exists
listing_model.prototype.checkListing = function(domain_name, callback){
	console.log("DB: Checking to see if " + domain_name + " is listed on DomaHub...");
	query = 'SELECT 1 AS "exist" FROM listings WHERE domain_name = ? AND listings.deleted IS NULL'
	listing_query(query, "Listing does not exist!", callback, domain_name);
}

//check if an account owns a listing
listing_model.prototype.checkListingOwner = function(account_id, domain_name, callback){
	console.log("DB: Checking to see if account #" + account_id + " owns domain " + domain_name + "...");
	query = 'SELECT 1 AS "exist" FROM listings WHERE owner_id = ? AND domain_name = ? AND listings.deleted IS NULL'
	listing_query(query, "Account does not own the domain" + domain_name + "!", callback, [account_id, domain_name]);
}

//check if an account owns a listing
listing_model.prototype.crossCheckRentalTime = function(domain_name, path, starttime, endtime, callback){
	console.log("DB: Checking times for " + domain_name + "/" + path + "...");
	query = 'SELECT 1 AS "exist" \
			FROM rentals \
			INNER JOIN rental_times \
				ON rentals.rental_id = rental_times.rental_id \
			INNER JOIN listings \
				ON listings.id = rentals.listing_id \
			WHERE \
				listings.domain_name = ? AND \
				rentals.path = ? AND \
				rentals.status = 1 AND \
				listings.deleted IS NULL AND ((\
				? < rental_times.date + rental_times.duration) AND ( \
				? > rental_times.date))'
	listing_query(query, "Failed to check times for " + domain_name + "/" + path + "!", callback, [domain_name, path, starttime, endtime, starttime, endtime]);
}

//</editor-fold>

//<editor-fold>-------------------------------GETS-------------------------------

//gets all info for an active listing including owner name and email
listing_model.prototype.getVerifiedListing = function(domain_name, callback){
	console.log("DB: Attempting to get active listing information for " + domain_name + "...");
	query = "SELECT \
				listings.*,\
				accounts.username,\
				!ISNULL(accounts.stripe_account) AS stripe_connected,\
				accounts.date_created AS user_created,\
				accounts.email\
			FROM listings \
			JOIN accounts ON listings.owner_id = accounts.id \
			WHERE listings.domain_name = ? \
			AND listings.verified = 1 \
			AND listings.deleted IS NULL";
	listing_query(query, "Failed to get active listing info for " + domain_name + "!", callback, domain_name);
}

//gets all 'active' listing information including owner name and email
listing_model.prototype.getAllListings = function(callback){
	console.log("DB: Attempting to get all listing info...");
	query = 'SELECT \
				listings.*,\
				accounts.username,\
				accounts.email\
			FROM listings \
			JOIN accounts ON listings.owner_id = accounts.id \
			WHERE listings.status = 1 \
			AND listings.verified = 1 \
			AND listings.deleted IS NULL'
	listing_query(query, "Failed to get all listing info!", callback);
}

//gets X number of rentals at a time
listing_model.prototype.getListingRentals = function(domain_name, oldest_rental_date, count, callback){
	console.log("DB: Attempting to get " + count + " rentals for domain: " + domain_name + " after " + oldest_rental_date + "...");
	query = "SELECT \
				rentals.address, \
				rentals.rental_id, \
				rentals.type, \
				rentals.path, \
				rental_times.date, \
				rental_times.duration, \
				accounts.username, \
				IFNULL(rental_s.views, 0) as views \
			FROM rentals \
			INNER JOIN rental_times ON rentals.rental_id = rental_times.rental_id \
			LEFT JOIN accounts ON rentals.account_id = accounts.id \
			LEFT JOIN listings ON rentals.listing_id = listings.id \
			LEFT OUTER JOIN ( \
				SELECT rental_id, COUNT(rental_id) AS views FROM stats_rental_history GROUP BY rental_id \
			) AS rental_s \
			ON rental_s.rental_id = rentals.rental_id \
			WHERE listings.domain_name = ? \
			AND rentals.status = 1 \
			AND rental_times.date < ? \
			ORDER BY rental_times.date DESC \
			LIMIT ?"
	listing_query(query, "Failed to get all existing active rentals for domain: " + domain_name + "!", callback, [domain_name, oldest_rental_date, count]);
}

//gets all rental times for a specific listing and path
listing_model.prototype.getListingTimes = function(domain_name, path, max_date, callback){
	console.log("DB: Attempting to get times for domain: " + domain_name + "...");
	query = "SELECT \
				rental_times.date, \
				rental_times.duration \
			FROM rental_times \
			INNER JOIN rentals ON rentals.rental_id = rental_times.rental_id \
			INNER JOIN listings ON rentals.listing_id = listings.id \
			WHERE listings.domain_name = ? \
			AND listings.status = 1 \
			AND rentals.path = ? \
			AND rentals.status = 1 \
			AND rental_times.date <= ? \
			AND rental_times.date + rental_times.duration >= (UNIX_TIMESTAMP(NOW()) * 1000) \
			ORDER BY rental_times.date ASC "
	listing_query(query, "Failed to get times for domain: " + domain_name + "!", callback, [domain_name, path, max_date]);
}


//gets all free rental times for a specific listing
listing_model.prototype.getListingFreeTimes = function(domain_name, callback){
	console.log("DB: Attempting to get free times for domain: " + domain_name + "...");
	query = "SELECT \
				listing_free_times.date, \
				listing_free_times.duration \
			FROM listing_free_times \
			INNER JOIN listings ON listing_free_times.listing_id = listings.id \
			WHERE listings.domain_name = ? \
			AND listings.status = 1 \
			AND listing_free_times.date + listing_free_times.duration >= UNIX_TIMESTAMP() * 1000 \
			ORDER BY listing_free_times.date ASC "
	listing_query(query, "Failed to get free times for domain: " + domain_name + "!", callback, domain_name);
}

//gets all rental info for a specific rental
listing_model.prototype.getRentalInfo = function(rental_id, callback){
	console.log("DB: Attempting to get all rental info for rental #" + rental_id + "...");
	query = "SELECT \
				rentals.*, \
				listings.domain_name \
			FROM rentals \
			INNER JOIN listings \
				ON listings.id = rentals.listing_id \
			WHERE rental_id = ?"
	listing_query(query, "Failed to get all info for rental #" + rental_id + "!", callback, rental_id);
}

//gets all rental information for the current rental
listing_model.prototype.getCurrentRental = function(domain_name, path, callback){
	console.log("DB: Attempting to get current rental info for for domain " + domain_name + "...");
	query = "SELECT \
				rentals.*,\
				listings.domain_name,\
				listings.description_hook,\
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
			AND rentals.path = ? \
			AND listings.status = 1 \
			AND listings.verified = 1 \
			AND listings.deleted IS NULL \
			AND rentals.status = 1";
	listing_query(query, "Failed to get current rental info for domain " + domain_name + "!", callback, [domain_name, path]);
}

//gets all rental times for a specific rental
listing_model.prototype.getRentalRentalTimes = function(rental_id, callback){
	console.log("DB: Attempting to get rental times for rental #" + rental_id + "...");
	query = "SELECT \
				rental_id, \
				date, \
				duration \
			FROM rental_times \
			WHERE rental_id = ?\
			ORDER BY date ASC"
	listing_query(query, "Failed to get rental times for rental #" + rental_id + "!", callback, rental_id);
}

//gets all rental times for a specific listing to cross check against a new rental (see checkRentalTime)
listing_model.prototype.getRandomListingByCategory = function(category, callback){
	console.log("DB: Attempting to get a random listing with category: " + category + "...");
	query = "SELECT \
				listings.domain_name \
			FROM listings \
			WHERE categories LIKE ? \
			ORDER BY RAND() LIMIT 1"
	listing_query(query, "Failed to get a random listing with category: " + category + "!", callback, category);
}

//gets 3 random listings
listing_model.prototype.getThreeRandomListings = function(domain_name_exclude, callback){
	console.log("DB: Attempting to get 3 random listings...");
	query = "SELECT \
				listings.domain_name, \
				listings.background_image, \
				listings.price_type, \
				listings.price_rate \
			FROM listings \
			WHERE listings.domain_name != ? \
			AND listings.status = 1 \
			AND listings.verified = 1 \
			AND listings.deleted IS NULL \
			AND listings.categories NOT LIKE '%adult%' \
			ORDER BY RAND() \
			LIMIT 3"
	listing_query(query, "Failed to get related 3 random listings!", callback, domain_name_exclude);
}

//gets 3 random listings by the same owner
listing_model.prototype.getThreeRandomListingsByOwner = function(domain_name_exclude, owner_id, callback){
	console.log("DB: Attempting to get 5 random listings by the same owner...");
	query = "SELECT \
				listings.domain_name, \
				listings.background_image, \
				listings.price_type, \
				listings.price_rate \
			FROM listings \
			WHERE listings.domain_name != ? \
			AND listings.owner_id = ? \
			AND listings.status = 1 \
			AND listings.verified = 1 \
			AND listings.deleted IS NULL \
			AND listings.categories NOT LIKE '%adult%' \
			ORDER BY RAND() \
			LIMIT 5"
	listing_query(query, "Failed to get 5 other random listings by the same owner!", callback, [domain_name_exclude, owner_id]);
}

//gets listings related to specific categories
listing_model.prototype.getRelatedListings = function(categories, domain_name_exclude, callback){
	console.log("DB: Attempting to get related listings with categories: " + categories + "...");
	query = "SELECT \
				listings.domain_name, \
				listings.background_image, \
				listings.price_type, \
				listings.price_rate \
			FROM listings \
			WHERE categories REGEXP ? \
			AND listings.domain_name != ? \
			AND listings.status = 1 \
			AND listings.verified = 1 \
			AND listings.deleted IS NULL \
			ORDER BY RAND() \
			LIMIT 3"
	listing_query(query, "Failed to get related listings with categories: " + categories + "!", callback, [categories, domain_name_exclude]);
}

//gets all active listings with X category, X domain name, X price -- and all active rentals/rental_times for them
listing_model.prototype.getListingByFilter = function(filter_name, filter_price, filter_date, callback){
	console.log("DB: Attempting to search for a listing...");
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
			AND listings.deleted IS NULL \
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
	console.log("DB: Attempting to get 10 random listings...");
	query = "SELECT \
				listings.domain_name, \
				listings.hour_price, \
				listings.day_price, \
				listings.week_price, \
				listings.month_price, \
				listings.categories \
			FROM listings \
			INNER JOIN accounts \
				ON accounts.id = listings.owner_id \
			WHERE listings.status = 1 \
			AND listings.verified = 1 \
			AND listings.deleted IS NULL \
			AND accounts.stripe_account IS NOT NULL \
			ORDER BY rand() \
			LIMIT 10";
	listing_query(query, "Failed to get 10 random listings!", callback);
}

//</editor-fold>

//<editor-fold>-------------------------------SETS-------------------------------

//creates a new listing
listing_model.prototype.newListing = function(listing_info, callback){
	console.log("DB: Attempting to create a new listing: " + listing_info.domain_name + "...");
	query = "INSERT INTO listings \
			SET ? "
	listing_query(query, "Failed to create a new listing: " + listing_info.domain_name + "!", callback, listing_info);
}

//creates multiple new listings
//BULK INSERT NEEDS TRIPLE NESTED ARRAYS
listing_model.prototype.newListings = function(listing_info_array, callback){
	console.log("DB: Attempting to create " + listing_info_array.length + " new listings...");
	query = "INSERT IGNORE INTO listings ( \
				owner_id, \
				date_created, \
				domain_name, \
				price_type, \
				price_rate, \
				description \
			)\
			 VALUES ? \
			 ON DUPLICATE KEY UPDATE \
			 deleted = CASE WHEN owner_id = VALUES(owner_id) \
				 THEN NULL ELSE deleted END \
			 ,price_type = CASE WHEN owner_id = VALUES(owner_id) \
				 THEN VALUES(price_type) ELSE price_type END \
			 ,price_rate = CASE WHEN owner_id = VALUES(owner_id) \
				 THEN VALUES(price_rate) ELSE price_rate END \
			 ,description = CASE WHEN owner_id = VALUES(owner_id) \
				 THEN VALUES(description) ELSE description END \
			 ,date_created = CASE WHEN owner_id = VALUES(owner_id) \
				 THEN VALUES(date_created) ELSE date_created END "
	listing_query(query, "Failed to create " + listing_info_array.length + " new listings!", callback, [listing_info_array]);
}

//creates a new rental under a listing
listing_model.prototype.newListingRental = function(listing_id, rental_info, callback){
	console.log("DB: Attempting to create a new rental for listing #" + listing_id + "...");
	query = "INSERT INTO rentals \
			SET ? "
	listing_query(query, "Failed to add a new rental for listing #" + listing_id + "!", callback, rental_info);
}

//creates new rental times for a specific rental
//BULK INSERT NEEDS TRIPLE NESTED ARRAYS
listing_model.prototype.newRentalTimes = function(rental_id, rental_times, callback){
	console.log("DB: Attempting to create new rental times for rental #" + rental_id + "...");
	query = "INSERT INTO rental_times (rental_id, date, duration) VALUES ? ON DUPLICATE KEY UPDATE \
		rental_id = VALUES(rental_id), \
		date = VALUES(date), \
		duration = VALUES(duration)"
	listing_query(query, "Failed to add new rental times for rental #" + rental_id + "!", callback, [rental_times]);
}

//</editor-fold>

//<editor-fold>-------------------------------UPDATE-------------------------------

//updates listing info
listing_model.prototype.updateListing = function(domain_name, listing_info, callback){
	console.log("DB: Attempting to update domain " + domain_name + "...");
	query = "UPDATE listings \
			SET ? \
			WHERE domain_name = ?"
	listing_query(query, "Failed to update domain " + domain_name + "!", callback, [listing_info, domain_name]);
}

//updates bulk listings to premium
//BULK INSERT NEEDS TRIPLE NESTED ARRAYS
listing_model.prototype.updateListingsPremium = function(listing_info_array, callback){
	console.log("DB: Attempting to upgrade " + listing_info_array.length + " listings to Premium...");
	query = "INSERT INTO listings ( \
				id, \
				stripe_subscription_id, \
				exp_date \
			)\
			 VALUES ? \
			 ON DUPLICATE KEY UPDATE \
				 id = VALUES(id), \
				 stripe_subscription_id = VALUES(stripe_subscription_id), \
				 exp_date = VALUES(exp_date) "
	listing_query(query, "Failed to upgrade " + listing_info_array.length + " listings to Premium!", callback, [listing_info_array]);
}

//reverts bulk listings to basic
//BULK INSERT NEEDS TRIPLE NESTED ARRAYS
listing_model.prototype.updateListingsBasic = function(listing_info_array, callback){
	console.log("DB: Attempting to revert " + listing_info_array.length + " listings to Basic...");
	query = "INSERT INTO listings ( \
				id, \
				price_type, \
				price_rate, \
				stripe_subscription_id, \
				exp_date, \
				expiring \
			)\
			 VALUES ? \
			 ON DUPLICATE KEY UPDATE \
				 id = VALUES(id), \
				 price_type = VALUES(price_type), \
				 price_rate = VALUES(price_rate), \
				 stripe_subscription_id = VALUES(stripe_subscription_id), \
				 exp_date = VALUES(exp_date), \
				 expiring = VALUES(expiring) "
	listing_query(query, "Failed to revert " + listing_info_array.length + " listings to Basic!", callback, [listing_info_array]);
}

//updates multiple listings, needs to be all created without error, or else cant figure out insert IDs
listing_model.prototype.updateListingsVerified = function(listing_ids, callback){
	console.log("DB: Attempting to revert verified status for bulk domain creation...");
	query = "INSERT INTO listings \
				(id) \
			VALUES ? \
			ON DUPLICATE KEY UPDATE verified = NULL"
	listing_query(query, "Failed to revert verified status for bulk domain creation!", callback, [listing_ids]);
}

//verifies multiple listings
//BULK INSERT NEEDS TRIPLE NESTED ARRAYS
listing_model.prototype.verifyListings = function(listings_to_verify, callback){
	console.log("DB: Attempting to verify " + listings_to_verify.length + " listings...");
	query = "INSERT INTO listings ( \
		id, \
		verified, \
		status \
	)\
	VALUES ? \
	ON DUPLICATE KEY UPDATE \
	id = VALUES(id), \
	verified = VALUES(verified), \
	status = VALUES(status) "
	listing_query(query, "Failed to deactivate " + listings_to_verify.length + " listings!", callback, [listings_to_verify]);
}

//updates rental info
listing_model.prototype.updateRental = function(rental_id, rental_info, callback){
	console.log("DB: Attempting to update rental #" + rental_id + "...");
	query = "UPDATE rentals \
			SET ? \
			WHERE rental_id = ?"
	listing_query(query, "Failed to update rental #" + rental_id + "!", callback, [rental_info, rental_id]);
}

//updates rental times if for the same rental
listing_model.prototype.updateRentalTime = function(new_rental_times, callback){
	console.log("DB: Attempting to update rental time #" + rental_time_id + "...");
	query = "UPDATE rental_times \
			SET duration = ? \
			WHERE id = ?"
	listing_query(query, "Failed to update rental #" + rental_id + "!", callback, new_rental_times);
}

//toggles the rental active or inactive
listing_model.prototype.toggleActivateRental = function(rental_id, callback){
	console.log("DB: Attempting to toggle activation on rental #" + rental_id + "...");
	query = "UPDATE rentals \
			SET status = !status \
			WHERE rental_id = ?"
	listing_query(query, "Failed to toggle activation on rental #" + rental_id + "!", callback, rental_id);
}

//</editor-fold>

//<editor-fold>-------------------------------DELETE-------------------------------

//deletes a specific rental
listing_model.prototype.deleteRental = function(rental_id, callback){
	console.log("DB: Attempting to de-activate rental #" + rental_id + "...");
	query = "UPDATE rentals \
			SET status = 0 \
			WHERE rental_id = ? "
	listing_query(query, "Failed to de-activate rental #" + rental_id + "!", callback, rental_id);
}

//sets multiple rentals to inactive
//BULK INSERT NEEDS TRIPLE NESTED ARRAYS
listing_model.prototype.deleteRentals = function(rentals_to_delete, callback){
	console.log("DB: Attempting to delete " + rentals_to_delete.length + " rentals...");
	query = "INSERT INTO rentals ( \
		rental_id \
	)\
	VALUES ? \
	ON DUPLICATE KEY UPDATE \
		status = 0"
	listing_query(query, "Failed to delete " + rentals_to_delete.length + " rentals!", callback, [rentals_to_delete]);
}

//deletes a specific listing
listing_model.prototype.deleteListing = function(listing_id, callback){
	console.log("DB: Attempting to delete listing #" + listing_id + "...");
	query = "UPDATE listings \
			SET deleted = 1 \
			WHERE id = ? "
	listing_query(query, "Failed to delete listing #" + listing_id + "!", callback, listing_id);
}

//sets multiple listings to inactive
//BULK INSERT NEEDS TRIPLE NESTED ARRAYS
listing_model.prototype.deleteListings = function(listings_to_delete, callback){
	console.log("DB: Attempting to deactivate " + listings_to_delete.length + " listings...");
	query = "INSERT INTO listings ( \
		id \
	)\
	VALUES ? \
	ON DUPLICATE KEY UPDATE \
		deleted = 1, \
		status = NULL "
	listing_query(query, "Failed to deactivate " + listings_to_delete.length + " listings!", callback, [listings_to_delete]);
}

//</editor-fold>

//<editor-fold>-------------------------------HELPER-------------------------------

//helper function to change a date to UTC
function toUTC(date, offset){
	date = new Date(date - (offset * 60 * 1000));
	return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(),  date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
}
