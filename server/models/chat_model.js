chat_model = function(database){
	this.db = database;

	chat_query = function(query, error_description, callback, params){
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

module.exports = chat_model;

//----------------------------------------------------------------------GETS----------------------------------------------------------

//gets all chats with a specific person
chat_model.prototype.getChats = function(account_id_1, account_id_2, length, callback){
	console.log("Attempting to get all chat info for accounts #" + account_id_1 + " and #" + account_id_2 + "...");
	query = "SELECT \
				chat_history.* \
			FROM chat_history \
			JOIN accounts \
				ON ( \
					(accounts.id = chat_history.receiver_account_id AND chat_history.sender_account_id = ? AND chat_history.receiver_account_id = ?) \
					OR \
					(accounts.id = chat_history.sender_account_id AND chat_history.sender_account_id = ? AND chat_history.receiver_account_id = ?) \
				) \
			ORDER BY timestamp DESC \
			LIMIT ?, 20"
	chat_query(query, "Failed to get all chat info for accounts #" + account_id_1 + " and #" + account_id_2 + "!", callback, [
		account_id_1,
		account_id_2,
		account_id_2,
		account_id_1,
		length
	]);
}

//----------------------------------------------------------------------SETS----------------------------------------------------------

//creates a new chat message
chat_model.prototype.newChatMessage = function(chat_info, callback){
	console.log("Adding new chat item for account #" + chat_info.sender_account_id + "...");
	query = "INSERT INTO chat_history \
			SET ? "
	chat_query(query, "Failed to add new chat item for account #" + chat_info.sender_account_id + "!", callback, chat_info);
}
