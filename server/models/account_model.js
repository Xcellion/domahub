account_model = function(database){
	this.db = database;

	account_query = function(query, error_description, callback, params){
		database.query(query, function(result, err){
			if (err){ console.log(err)}
			callback({
				state : (!err) ? "success" : "error",
				info : (!err) ? result : error_description
			});
		}, params);
	}
}

module.exports = account_model;

//GET - 'SELECT * from ?? WHERE ?? = ?'
//UPDATE SET - 'UPDATE ?? SET ? WHERE ?? = ?'
//INSERT SET - 'INSERT INTO ?? SET ?'
//INSERT BULK - 'INSERT INTO ?? (??) VALUES ?'
//DELETE - 'DELETE FROM ?? WHERE ?? = ?'

//--------------------------------------------------------------------CHECKS------------------------------------------------------------

//check if an account exists
account_model.prototype.checkAccount = function(email, callback){
	console.log("Checking to see if account with email " + email + " exists on w3bbi...");
	query = 'SELECT 1 AS "exist" FROM accounts WHERE email = ?'
	account_query(query, "Account does not exist!", callback, email);
}

//----------------------------------------------------------------------GETS----------------------------------------------------------

//gets all account info
account_model.prototype.getAccount = function(email, callback){
	console.log("Attempting to get all account information for email: " + email + "...");
	query = "SELECT * FROM accounts WHERE email = ?"
	account_query(query, "Failed to get all account information for email: " + email + "!", callback, email);
}

//gets account by token
account_model.prototype.getAccountByToken = function(token, callback){
	console.log("Attempting to get account information for token: " + token + "...");
	query = "SELECT email, token, token_exp FROM accounts WHERE token = ?"
	account_query(query, "Failed to get account information for token: " + token + "!", callback, token);
}

//gets all listing info belonging to specific account
account_model.prototype.getListingsAccount = function(account_id, callback){
	console.log("Attempting to get all listings belonging to account " + account_id + "...");
	query = "SELECT \
				listings.*\
			FROM listings \
			WHERE owner_id = ? ";
	account_query(query, "Failed to get all listings belonging to account " + account_id + "!", callback, account_id);
}

//gets all rental info belonging to specific account
account_model.prototype.getRentalsAccount = function(account_id, callback){
	console.log("Attempting to get all rentals belonging to account " + account_id + "...");
	query = "SELECT \
				rentals.*,\
				rental_times.*,\
				listings.id,\
				listings.domain_name\
			FROM rentals \
			JOIN rental_times ON rentals.rental_id = rental_times.rental_id \
			JOIN listings ON listings.id = rentals.listing_id \
			WHERE rentals.account_id = ? ";
	account_query(query, "Failed to get all rentals belonging to account " + account_id + "!", callback, account_id);
}

//----------------------------------------------------------------------SETS----------------------------------------------------------

//creates a new account
account_model.prototype.newAccount = function(account_info, callback){
	console.log("Creating a new account for email: " + account_info.email + "...");
	query = "INSERT INTO accounts \
			SET ? "
	listing_query(query, "Failed to create a new account for email: " + account_info.email + "!", callback, account_info);
}

//----------------------------------------------------------------------UPDATE----------------------------------------------------------

//updates a new account
account_model.prototype.updateAccount = function(account_info, email, callback){
	console.log("Updating account with email: " + email + "...");
	query = "UPDATE accounts \
			SET ? \
			WHERE email = ?"
	listing_query(query, "Failed to update account with email: " + email + "!", callback, [account_info, email]);
}
