module.exports = account_model;

listing_model = require('../models/listing_model.js');

function account_model(database){
	this.db = database;
	listing = new listing_model(database);
}

//sets info in database
account_model.prototype.setInfo = function(info, special, callback){
	db_query = 'UPDATE accounts SET ?'
	if (special){
		db_query += special;
	}
	this.db.query(db_query, function(result, err){
		//listing info successfully retrieved
		if (!err){
			callback({
				state : "success",
				info : result
			});
		}
		else {
			callback({
				state: "error",
				info: err
			});
		}
	}, [info]);
}

//gets account database info
account_model.prototype.getInfo = function(db_where, db_where_equal, special, callback){
	db_query = 'SELECT * from accounts WHERE ?? = ?'
	if (special){
		db_query = special;
	}
	this.db.query(db_query, function(result, err){
		//listing info successfully retrieved
		if (!err){
			callback({
				state : "success",
				info : result
			});
		}
		else {
			callback({
				state: "error",
				info: err
			});
		}
	}, [db_where, db_where_equal]);
}

//gets all rentals belonging to an account
account_model.prototype.getRentalsAccount = function(account_id, callback){
	account_model = this;
	
	//check if account exists
	account_model.getInfo("id", account_id, false, function(result){
		if (result.state == "success"){
			//get all rentals for that account
			db_query = "SELECT * from ?? WHERE ?? = ? AND duration != 0";
						
			listing.getInfo("rentals", "account_id", account_id, db_query, function(result){
				if (result.state == "success"){
					callback({
						state: "success",
						rentals: result.info
					});
				}
				else {
					callback({
						state: "error",
						description: "Something went wrong with getting rentals for user"
					});
				}
			});
		}
		else {
			callback({
				state: "error",
				description: "Invalid user!"
			});
		}
	});
}