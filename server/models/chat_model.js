data_model = function(database){
	this.db = database;

	data_query = function(query, error_description, callback, params){
		database.query(query, function(result, err){
			if (err){ console.log(err)}
			callback({
				state : (!err) ? "success" : "error",
				info : (!err) ? result : error_description
			});
		}, params);
	}
}

module.exports = data_model;

//----------------------------------------------------------------------SETS----------------------------------------------------------

//creates a new chat message
data_model.prototype.newChatMessage = function(chat_info, callback){
	console.log("Adding new chat item for account #" + chat_info.sender_account_id + "...");
	query = "INSERT INTO chat_history \
			SET ? "
	listing_query(query, "Failed to add new chat item for account #" + chat_info.sender_account_id + "!", callback, chat_info);
}
