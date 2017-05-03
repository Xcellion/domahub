data_model = function(database){
	this.db = database;

	data_query = function(query, error_description, callback, params){
		database.query(query, function(result, err){
			if (err){
				console.log(err);
				callback({
					state : "error",
					info : error_description,
					errcode : err.code
				});
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

module.exports = data_model;

//----------------------------------------------------------------------GETS----------------------------------------------------------

//gets all listing traffic grouped by month
data_model.prototype.getListingTraffic = function(domain_name, callback){
	console.log("DB: Attempting to get traffic for domain: " + domain_name + "...");
	query = "SELECT \
    		2592000000 * (stats_search_history.timestamp div 2592000000) as 'from', \
    		2592000000 * (stats_search_history.timestamp div 2592000000) + 2629746000 as 'to', \
    		COUNT(*) as views \
			FROM stats_search_history \
		WHERE domain_name = ? \
		GROUP BY stats_search_history.timestamp div 2592000000"
	data_query(query, "Failed to get traffic for domain: " + domain_name + "!", callback, domain_name);
}

//gets all views for a specific listing's rentals
data_model.prototype.getRentalTraffic = function(domain_name, callback){
	console.log("DB: Attempting to get rental traffic for domain: " + domain_name + "...");
	query = 'SELECT \
				stats_rental_history.rental_id, \
				min_timestamp.min_ts, \
				max_timestamp.max_ts, \
				rental_times.date, \
				rental_times.duration, \
				rentals.path, \
				rentals.date_created, \
				count(stats_rental_history.timestamp) AS views \
			FROM stats_rental_history \
			INNER JOIN rentals \
				ON stats_rental_history.rental_id = rentals.rental_id \
			INNER JOIN rental_times \
				ON rental_times.rental_id = rentals.rental_id \
			INNER JOIN listings \
				ON listings.id = rentals.listing_id \
			INNER JOIN ( \
				SELECT rental_id, MIN( TIMESTAMP ) AS min_ts \
				FROM  stats_rental_history \
				GROUP BY rental_id \
			) AS min_timestamp \
				ON min_timestamp.rental_id = stats_rental_history.rental_id \
			INNER JOIN ( \
				SELECT rental_id, MAX( TIMESTAMP ) AS max_ts \
				FROM  stats_rental_history \
				GROUP BY rental_id \
			) AS max_timestamp \
				ON max_timestamp.rental_id = stats_rental_history.rental_id \
			WHERE listings.domain_name = ? \
			GROUP BY stats_rental_history.rental_id \
			ORDER BY rentals.rental_id DESC '
	listing_query(query, "Failed to get rental traffic for " + domain_name + "!", callback, domain_name);
}

//gets all views for a specific listing that came from a rental
data_model.prototype.getListingRentalTraffic = function(domain_name, callback){
	console.log("DB: Attempting to get listing traffic for domain: " + domain_name + " that came from rentals...");
	query = 'SELECT \
				stats_search_history.rental_id, \
				count(stats_search_history.timestamp) AS views \
			FROM stats_search_history \
			WHERE stats_search_history.domain_name = ? \
			AND stats_search_history.rental_id IS NOT NULL \
			GROUP BY stats_search_history.rental_id \
			ORDER BY stats_search_history.rental_id DESC '
	listing_query(query, "Failed to get listing traffic for " + domain_name + "!", callback, domain_name);
}

//gets all availability check history for a specific listing
data_model.prototype.getAvailCheckHistory = function(domain_name, callback){
	console.log("DB: Attempting to get avail check history for domain: " + domain_name + "...");
	query = 'SELECT \
				stats_availcheck_history.* \
			FROM stats_availcheck_history \
			WHERE stats_availcheck_history.domain_name = ? \
			ORDER BY timestamp DESC '
	listing_query(query, "Failed to get avail check history for " + domain_name + "!", callback, domain_name);
}

//gets all availability check history for a specific listing
data_model.prototype.getCheckoutHistory = function(domain_name, callback){
	console.log("DB: Attempting to get checkout history for domain: " + domain_name + "...");
	query = 'SELECT \
				stats_checkout_history.rental_id, \
				stats_checkout_history.timestamp, \
				stats_checkout_history.path, \
				stats_checkout_history.starttime, \
				stats_checkout_history.endtime \
			FROM stats_checkout_history \
			WHERE stats_checkout_history.domain_name = ? \
			ORDER BY timestamp DESC '
	listing_query(query, "Failed to get checkout history for " + domain_name + "!", callback, domain_name);
}


//----------------------------------------------------------------------SETS----------------------------------------------------------

//creates a new entry for a listing data row
data_model.prototype.newListingHistory = function(history_info, callback){
	console.log("DB: Adding new search history item for " + history_info.domain_name + "...");
	query = "INSERT INTO stats_search_history \
			SET ? "
	data_query(query, "Failed to add search history for " + history_info.domain_name + "!", callback, history_info);
}

//creates a new entry for a rental history data row
data_model.prototype.newRentalHistory = function(history_info, callback){
	console.log("DB: Adding new rental history item for rental #" + history_info.rental_id + "...");
	query = "INSERT INTO stats_rental_history \
			SET ? "
	data_query(query, "Failed to add rental view history for rental #" + history_info.rental_id + "!", callback, history_info);
}

//creates a new entry for a checked availability history data row
data_model.prototype.newCheckAvailHistory = function(history_info, callback){
	console.log("DB: Adding new availability check history item for domain: " + history_info.domain_name + "...");
	query = "INSERT INTO stats_availcheck_history \
			SET ? "
	data_query(query, "Failed to add availability check history item for domain:" + history_info.domain_name + "!", callback, history_info);
}

//creates a new entry for a checkout history data row
data_model.prototype.newCheckoutHistory = function(history_info, callback){
	console.log("DB: Adding new checkout history item for domain: " + history_info.domain_name + "...");
	query = "INSERT INTO stats_checkout_history \
			SET ? "
	data_query(query, "Failed to add checkout check history item for domain:" + history_info.domain_name + "!", callback, history_info);
}

//creates a new entry for a checkout action data row
data_model.prototype.newCheckoutAction = function(history_info, callback){
	console.log("DB: Adding new checkout action item for domain: " + history_info.domain_name + "...");
	query = "INSERT INTO stats_checkout_actions \
			SET ? "
	data_query(query, "Failed to add checkout check action item for domain:" + history_info.domain_name + "!", callback, history_info);
}

// //creates new rental times for unavailable listings
// //BULK INSERT NEEDS TRIPLE NESTED ARRAYS
// data_model.prototype.newDesiredRentalTimes = function(domain_name, desired_times_info, callback){
// 	console.log("DB: Attempting to create new desired times for domain" + domain_name + "...");
// 	query = "INSERT INTO stats_desired_times (domain_name, timestamp, start_date, duration, account_id, user_ip) VALUES ? ";
// 	data_query(query, "Failed to add new desired times for domain" + domain_name + "!", callback, [desired_times_info]);
// }
//
// //gets the maximum and minimum prices for all domains
// data_model.prototype.getMinMaxPrices = function(callback){
// 	console.log("DB: Attempting to get maximum and minimum prices for all domains...");
// 	query = "SELECT \
// 				MIN(hour_price) AS min_hour_price, \
// 				MAX(hour_price) AS max_hour_price, \
// 				MIN(day_price) AS min_day_price, \
// 				MAX(day_price) AS max_day_price, \
// 				MIN(week_price) AS min_week_price, \
// 				MAX(week_price) AS max_week_price, \
// 				MIN(month_price) AS min_month_price, \
// 				MAX(month_price) AS max_month_price \
// 			FROM `listings` \
// 			WHERE listings.status >= 1";
// 	data_query(query, "Failed to get maxmimum and minimum prices for all domains!", callback);
// }
