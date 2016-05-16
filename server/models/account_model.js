module.exports = account_model;

function account_model(database){
	this.db = database;
}

//sets game database
account_model.prototype.set_account = function(account_id, account_info, callback){
	console.log("Updating " + account_info + " for Account " + account_id);
	this.db.query('UPDATE accounts SET ? WHERE id = ?', function(result){
		//game info was not changed
		if (result.length <= 0){
			callback({
				"state" : "error"
			});
		}
		
		//game info was updated
		else {
			callback({
				"state" : "success"
			});
		}
	}, [account_info, account_id]);
}

//gets game database info
account_model.prototype.get_account = function(account_id, account_info, callback){
	console.log("Attempting to retrieve " + account_info + " for account " + account_id);
	this.db.query('SELECT ?? from accounts WHERE id = ?', function(result){
		//game info could not be retrieved
		if (result.length <= 0){
			callback({
				"state" : "error"
			});
		}
		//game info successfully retrieved
		else {
			callback({
				"state" : "success",
				"account_info" : result[0]
			});
		}
	}, [account_info, account_id]);
}


//returns all game info from all games of an existing account
account_model.prototype.get_game_account = function(account_id, callback) {
	var db = this.db;
	
	//first check if account exists
	this.get_account(account_id, ["id", "name"], function(result, fields){
		var mysql_query = 'SELECT game_id, current_networth, highest_networth, lowest_networth, gamemaster_length, money_given, money_lost FROM game_account_info WHERE account_id = ?';
	
		db.query(mysql_query, function(result, fields){
			//game info was found
			if (result.length >= 0){
				console.log("Found all game info for account " + account_id);
				callback({
					"state": "success",
					"info": result
				});
			}
			//game info was not found
			else {
				console.log("ERROR: Game info cannot be found");
				callback({
					"state": "error",
					"errorCode": 7,
					"description": "game info cannot be found"
				});
			}
		}, account_id);
	});
};