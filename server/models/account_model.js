module.exports = account_model;

function account_model(database){
	this.db = database;
}

//sets info in database
account_model.prototype.setInfo = function(info, special, callback){
	db_query = 'UPDATE accounts SET ?'
	if (special){
		db_query += special;
	}
	this.db.query(db_query, function(result){
		//listing info successfully retrieved
		if (result.affectedRows){
			callback({
				state : "success",
				info : result
			});
		}
		else {
			callback({
				state: "error",
				info: result
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
	this.db.query(db_query, function(result){
		//listing info successfully retrieved
		if (result.length > 0){
			callback({
				state : "success",
				info : result
			});
		}
		else {
			callback({
				state: "error",
				info: result
			});
		}
	}, [db_where, db_where_equal]);
}