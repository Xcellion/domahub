data_model = function(database){
	this.db = database;

	data_query = function(query, error_description, callback, params){
		database.query(query, function(result, err){
			if (err){
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

//----------------------------------------------------------------------SETS----------------------------------------------------------

//creates a new entry for a listing data row
data_model.prototype.newListingHistory = function(history_info, callback){
	console.log("DB: Adding new search history item for " + history_info.domain_name + "...");
	query = "INSERT INTO stats_search_history \
			SET ? "
	data_query(query, "Failed to add search history for " + history_info.domain_name + "!", callback, history_info);
}

//creates a new entry for a rental data row
data_model.prototype.newRentalHistory = function(history_info, callback){
	console.log("DB: Adding new rental history item for rental #" + history_info.rental_id + "...");
	query = "INSERT INTO stats_rental_history \
			SET ? "
	data_query(query, "Failed to add rental view history for rental #" + history_info.rental_id + "!", callback, history_info);
}

//creates new rental times for unavailable listings
//BULK INSERT NEEDS TRIPLE NESTED ARRAYS
data_model.prototype.newDesiredRentalTimes = function(domain_name, desired_times_info, callback){
	console.log("DB: Attempting to create new desired times for domain" + domain_name + "...");
	query = "INSERT INTO stats_desired_times (domain_name, timestamp, start_date, duration, account_id, user_ip) VALUES ? ";
	data_query(query, "Failed to add new desired times for domain" + domain_name + "!", callback, [desired_times_info]);
}

//gets the maximum and minimum prices for all domains
data_model.prototype.getMinMaxPrices = function(callback){
	console.log("DB: Attempting to get maximum and minimum prices for all domains...");
	query = "SELECT \
				MIN(hour_price) AS min_hour_price, \
				MAX(hour_price) AS max_hour_price, \
				MIN(day_price) AS min_day_price, \
				MAX(day_price) AS max_day_price, \
				MIN(week_price) AS min_week_price, \
				MAX(week_price) AS max_week_price, \
				MIN(month_price) AS min_month_price, \
				MAX(month_price) AS max_month_price \
			FROM `listings` \
			WHERE listings.status >= 1";
	data_query(query, "Failed to get maxmimum and minimum prices for all domains!", callback);
}
