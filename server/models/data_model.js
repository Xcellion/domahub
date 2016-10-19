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

//creates a new listing
data_model.prototype.newSearchHistory = function(history_info, callback){
	console.log("Adding new search history item for " + history_info.domain_name + "...");
	query = "INSERT INTO stats_search_history \
			SET ? "
	data_query(query, "Failed to add search history for " + history_info.domain_name + "!", callback, history_info);
}

//creates new rental times for unavailable listings
//BULK INSERT NEEDS TRIPLE NESTED ARRAYS
data_model.prototype.newDesiredRentalTimes = function(domain_name, desired_times_info, callback){
	console.log("Attempting to create new desired times for domain" + domain_name + "...");
	query = "INSERT INTO stats_desired_times (domain_name, date_now, start_date, duration, account_id, user_ip) VALUES ? ";
	data_query(query, "Failed to add new desired times for domain" + domain_name + "!", callback, [desired_times_info]);
}
