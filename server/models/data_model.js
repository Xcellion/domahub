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
	query = "INSERT INTO search_history \
			SET ? "
	data_query(query, "Failed to add search history for " + history_info.domain_name + "!", callback, history_info);
}
