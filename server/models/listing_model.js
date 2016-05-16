module.exports = game_model;

function game_model(database, Account){
	this.db = database;
	this.account = Account;
	this.columns = [
		"game_id",
		"account_id",
		"profession",
		"current_networth",
		"equipment",
		"highest_networth",
		"lowest_networth",
		"gamemaster_length",
		"money_given",
		"money_lost",
		"physical",
		"mental"
	]
}

//sets game database
game_model.prototype.set_game = function(game_id, game_info, callback){
	this.db.query('UPDATE games SET ? WHERE id = ?', function(result){
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
	}, [game_info, game_id]);
}

//gets game database info
game_model.prototype.get_game = function(game_id, game_info, callback){
	console.log("Attempting to retrieve " + game_info + " from Game " + game_id);
	this.db.query('SELECT ?? from games WHERE id = ?', function(result){
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
				"game_info" : result[0]
			});
		}
	}, [game_info, game_id]);
}

//set game_account_info database
game_model.prototype.set_game_account = function(game_id,  account_id, game_info, callback){
	this.db.query('UPDATE game_account_info SET ? WHERE game_id = ? AND account_id = ?', function(result){
		//game info was not changed
		if (result.length <= 0){
			callback({
				"state" : "error"
			});
		}
		//game info was updated
		else {
			callback({
				"state": "success"
			});
		}
	}, [game_info, game_id, account_id]);
}

//gets game_account_info entries
game_model.prototype.get_game_account = function(game_id, account_id, game_info, callback){
	console.log("Attempting to retrieve " + game_info + " from Game " + game_id);
	this.db.query('SELECT ?? FROM game_account_info WHERE game_id = ? AND account_id = ?', function(result){
		//game info could not be retrieved
		if (result.length <= 0){
			callback({
				"state" : "error"
			});
		}
		//game info successfully retrieved
		else {
			callback({
				"state": "success",
				"game_info": result[0]
			});
		}
	}, [game_info, game_id, account_id]);
}

//check if account is in game, and maybe join
game_model.prototype.check_account_in_game = function(aid, gid, callback, bool){
	game_model.get_game_account(gid, aid, game_model.columns, function(result){
		//account not in game, join?
		if (result.length <= 0){
		
			//yes join
			if (bool){
				var input = {
					game_id : gid,
					account_id : aid,
					equipment : "0,0,0,0,0,0"
				}
				game_model.set_game_account(gid, input, function(result){
					//account was not added to the game
					if (result.length <= 0){
						console.log("ERROR: Account was not added to the game");
						callback({
							"state": "error",
							"errorCode": 4,
							"description": "account was not added to the game"
						});
					}
					//account was added to the game
					else {
						console.log("Account " + aid + " added to Game " + gid);
						game_model.check_account_in_game(aid, gid, callback, false);
					}
				});
			}
			
			//no dont join
			else {
				console.log("ERROR: Account " + aid + " is not in Game " + gid);
				callback({
					"state": "error",
					"errorCode": 3,
					"description": "account not in game"
				});
			}
		}
		
		//account already in game
		else {
			callback({
				"state": "success",
				"game_info": result.game_info
			});
		}
	});
}

//creates a new game with account in it
game_model.prototype.create = function(account_id, callback){
	db = this.db;
	game_model = this;
	Account = this.account;

	//first check if account exists
	Account.get_account(account_id, ["id"], function(result, fields){
		if (result.state == "success"){
			var mysql_query = 'INSERT INTO games (date_created) VALUES (NOW())';

			//then create a new game
			console.log("Attempting to create a new game...");
			db.query(mysql_query, function(result){
				
				//game was not created 
				if (result.length <= 0){
					console.log("ERROR: Game was not created");
					callback({
						"state": "error",
						"errorCode": 5,
						"description": "game was not created"
					});
				}
				
				//game was created
				else {
					game_id = result.insertId
					console.log("Game " + game_id + " created");
					
					game_model.check_account_in_game(account_id, game_id, callback, true);
				}
			});
		}
		//account does not exist
		else {
			
		}
	});
};

//returns the gamemaster of a given game id
game_model.prototype.getGM = function(game_id, callback){
	db = this.db;
	game_model = this;
	Account = this.account;
	
	//check if game exists
	game_model.get_game(game_id, ["num_challenges", "gamemaster_id"], function(result){
		num_challenges = result.game_info.num_challenges;
		
		//then get account info
		Account.get_account(result.game_info.gamemaster_id, ["id", "name"], function(result){
			if (result.state == "success"){
				callback({
					"state": "success",
					"gamemaster_id": result.account_info.id,
					"gamemaster_name": result.account_info.name,
					"num_challenges": num_challenges
				});
			}
			//account does not exist
			else {
				
			}
		});
	});
}

//returns result.success and game_info
game_model.prototype.verify = function(game_id, account_id, callback, bool){
	game_model = this;
	Account = this.account;

	console.log("Verifying that " + account_id + " exists in game " + game_id);
	//first get account info
	Account.get_account(account_id, ["name"], function(result){
		if (result.state == "success"){
			name = result.account_info.name;
			
			//then get game info
			game_model.get_game(game_id, ["gamemaster_id", "num_challenges", "num_rules"], function(result){
				gamemaster_id = result.game_info.gamemaster_id;
				num_challenges = result.game_info.num_challenges;
				num_rules = result.game_info.num_rules;
				
				//then check if account exists in game
				game_model.check_account_in_game(account_id, game_id, function(result){
					if (result.state == "success"){
						console.log("Account " + account_id + " exists in Game " + game_id);
						callback({
							"state": "success",
							"game_info": result.game_info,
							"name": name,
							"gamemaster_id": gamemaster_id,
							"num_challenges": num_challenges,
							"num_rules": num_rules
						});
					}
					
					else {
						callback(result);
					}
				}, bool);
			});
		}
		
		//account does not exist
		else {
			
		}
	});
};

//verify game shit, then get the GM info to attach to game_info
game_model.prototype.join = function(game_id, account_id, callback, bool){
	db = this.db;
	game_model = this;
	
	game_model.verify(game_id, account_id, function(result){
		if (result.state == "success"){
			game_info = result.game_info;
			game_info.num_challenges = result.num_challenges;
			game_info.num_rules = result.num_rules;
			
			game_model.getGM(game_id, function(result){
				if (result.state == "success"){
					game_info.gamemaster_id = result.gamemaster_id;
					game_info.gamemaster_name = result.gamemaster_name;
					
					callback({
						"state": "success",
						"game_info": game_info
					});
				}
				else {
					callback(result);
				}
			});
		}
		else {
			callback(result);
		}

	}, true);
}

//change money
game_model.prototype.setMoney = function(game_id, account_id, callback, money){
	db = this.db;
	game_model = this;
	
	//check if the account/game_info is legit
	game_model.verify(game_id, account_id, function(result, fields){
		if (result.state == "success"){
			game_info = result.game_info;
				
			account_id = game_info.account_id;
			game_id = game_info.game_id;
			
			var input = {
				current_networth : money
			}
			
			if (money > game_info.highest_networth){
				input.highest_networth = money;
			}
			else if (money < game_info.lowest_networth){
				input.lowest_networth = money;
			}
		
			//then change money
			console.log("Attempting to change money for Player " + account_id + " in Game " + game_id);
			game_model.set_game_account(game_id, account_id, input, function(result){
				
				//money was not changed
				if (result.state == "success"){
					console.log("Money for Player " + account_id + " in Game " + game_id + " successfully updated!");
					callback({
						"state": "success",
						"room" : game_id,
						"new_amount": money
					});
				}
				
				//money was updated
				else {

					console.log("ERROR: Money was not updated");
					callback({
						"state": "error",
						"errorCode": 5,
						"description": "money was not updated"
					});
				}
			});
		}
		
		//verification failed, something's wrong
		else {
			
		}
	}, false);
};

//change the gamemaster
game_model.prototype.setGM = function(game_id, account_id, callback){
	//check if the account/game_info is legit
	game_model.verify(game_id, account_id, function(result, fields){
		if (result.state == "success"){
			old_gm_id = result.gamemaster_id;
			var game_info = {
				gamemaster_id : account_id
			}
			
			//change GM
			game_model.set_game(game_id, game_info, function(result){
				callback({
					"state": "success",
					"room" : game_id,
					"new_gm": account_id,
					"old_gm": old_gm_id
				});
			});
		}
		
		//verification failed, something's wrong
		else {
			
		}
	}, false);
};

//equip something
game_model.prototype.equip = function(game_id, account_id, equip, callback){
	db = this.db;
	game_model = this;
	
	//check if the account/game_info is legit
	game_model.verify(game_id, account_id, function(result, fields){
		if (result.state == "success"){
			if (equip.split(',').length == 6){
				var input = {
					equipment : equip
				}
				
				game_model.set_game_account(game_id, account_id, input, function(result){
					
					//gamemaster was not changed
					if (result.length <= 0){
						console.log("ERROR: Equipment was not updated");
						callback({
							"state": "error",
							"errorCode": 8,
							"description": "equipment was not updated"
						});
					}
					
					//gamemaster was updated
					else {
						console.log("Equipment for Player " + account_id + " in Game " + game_id + " has changed to " + equip);
						callback({
							"state": "success",
							"equipment" : equip
						});
					}
				});
			}
			else {
				console.log("Equipment length is not 6");
				callback({
					"state": "error",
					"description": "equipment length is not 6"
				});
			}
		}
		
		//verification failed, something's wrong
		else {
			
		}
	}, false);
}

//heal / hurt mental / physical health, amount = new amount to be
game_model.prototype.health = function(game_id, account_id, amount, physical, callback){
	db = this.db;
	game_model = this;
	
	//check if the account/game_info is legit
	game_model.verify(game_id, account_id, function(result, fields){
		if (result.state == "success"){
			var type;
			
			if (physical){
				type = "Physical"
				var input = {
					physical : amount
				}
			}
			else {
				type = "Mental"
				var input = {
					mental : amount
				}
			}
			
			game_model.set_game_account(game_id, account_id, input, function(result){
				
				//gamemaster was not changed
				if (result.length <= 0){
					console.log("ERROR: " + type + " health was not updated");
					callback({
						"state": "error",
						"errorCode": 11,
						"description": type + " health was not updated"
					});
				}
				
				//gamemaster was updated
				else {
					console.log(type + " health for Player " + account_id + " changed in Game " + game_id + " to " + amount);
					callback({
						"state": "success",
						"new_amount" : amount
					});
				}
			});
		}
		
		//verification failed, something's wrong
		else {
			
		}
	}, false);
}