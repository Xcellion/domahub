account_model = function(database){
	this.db = database;

	account_query = function(query, error_description, callback, params){
		database.query(query, function(result, err){
			if (err){
				console.log(err);
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

module.exports = account_model;

//GET - 'SELECT * from ?? WHERE ?? = ?'
//UPDATE SET - 'UPDATE ?? SET ? WHERE ?? = ?'
//INSERT SET - 'INSERT INTO ?? SET ?'
//INSERT BULK - 'INSERT INTO ?? (??) VALUES ?'
//DELETE - 'DELETE FROM ?? WHERE ?? = ?'

//<editor-fold>-------------------------------CHECK-------------------------------

//check if an account email exists
account_model.prototype.checkAccountEmail = function(email, callback){
	console.log("DB: Checking to see if account with email " + email + " exists on DomaHub...");
	query = 'SELECT 1 AS "exist" FROM accounts WHERE email = ?'
	account_query(query, "Account does not exist!", callback, email);
}

//check if an account username exists
account_model.prototype.checkAccountUsername = function(username, callback){
	console.log("DB: Checking to see if account with username " + username + " exists on DomaHub...");
	query = 'SELECT 1 AS "exist" FROM accounts WHERE username = ?'
	account_query(query, "Account does not exist!", callback, username);
}

//check if a signup code exists
account_model.prototype.checkSignupCode = function(code, callback){
	console.log("DB: Checking to see if sign-up code " + code + " exists...");
	query = 'SELECT 1 AS "exist" FROM signup_codes WHERE code = ?'
	account_query(query, "Code does not exist!", callback, code);
}

//</editor-fold>

//<editor-fold>-------------------------------GETS-------------------------------

//gets all account info
account_model.prototype.getAccount = function(email, username, callback){
	if (email){
		console.log("DB: Attempting to get all account information for email: " + email + "...");
	}
	else {
		console.log("DB: Attempting to get all account information for username " + username + "...");
	}
	query = "SELECT * FROM accounts WHERE email = ? OR username = ?"
	account_query(query, "Failed to get all account information for email: " + email + "!", callback, [email, username]);
}

//gets all account info
account_model.prototype.getAccountByUsername = function(username, callback){
	console.log("DB: Attempting to get all account information for username: " + username + "...");
	query = "SELECT * FROM accounts WHERE username = ?"
	account_query(query, "Failed to get all account information for username: " + username + "!", callback, username);
}

//gets account by token
account_model.prototype.getAccountByToken = function(token, callback){
	console.log("DB: Attempting to get account information for token: " + token + "...");
	query = "SELECT email, token, token_exp FROM accounts WHERE token = ?"
	account_query(query, "Failed to get account information for token: " + token + "!", callback, token);
}

//gets all listing info belonging to specific account
account_model.prototype.getAccountListings = function(account_id, callback){
	console.log("DB: Attempting to get all listings belonging to account " + account_id + "...");
	query = "SELECT \
				listings.*, \
				rented_table.rented \
			FROM listings \
			LEFT JOIN \
				(SELECT DISTINCT\
					listings.id AS listing_id, \
					rentals.rental_id IS NOT NULL AS rented \
				FROM rental_times \
				INNER JOIN rentals \
					ON rental_times.rental_id = rentals.rental_id \
				INNER JOIN listings \
					ON listings.id = rentals.listing_id \
				WHERE (UNIX_TIMESTAMP(NOW())*1000) BETWEEN rental_times.date AND rental_times.date + rental_times.duration \
			) as rented_table \
			ON rented_table.listing_id = listings.id \
			WHERE owner_id = ? \
			AND listings.deleted IS NULL \
			ORDER BY listings.id ASC";
	account_query(query, "Failed to get all listings belonging to account " + account_id + "!", callback, account_id);
}

//gets all listing search info belonging to specific account
account_model.prototype.getAccountListingsSearch = function(account_id, callback){
	console.log("DB: Attempting to get search history for listings belonging to account " + account_id + "...");
	query = "SELECT \
				(UNIX_TIMESTAMP(NOW()) DIV 2592000 - IFNULL(timestamp DIV 2592000000, 0)) AS months_away, \
				COUNT(stats_search_history.timestamp) as count, \
				listings.domain_name \
			FROM listings \
			LEFT JOIN stats_search_history \
				ON listings.domain_name = stats_search_history.domain_name \
			WHERE listings.owner_id = ? \
			AND listings.deleted IS NULL \
			GROUP BY listings.domain_name, timestamp DIV 2592000000 \
			ORDER BY listings.domain_name ASC, months_away DESC";
	account_query(query, "Failed to get  search history for listings belonging to account " + account_id + "!", callback, account_id);
}

//gets all rental info belonging to specific account
account_model.prototype.getAccountRentals = function(account_id, callback){
	console.log("DB: Attempting to get all rentals belonging to account " + account_id + "...");
	query = "SELECT \
				rentals.*,\
				rental_times.date,\
				rental_times.duration,\
				listings.id,\
				listings.domain_name\
			FROM rentals \
			JOIN rental_times ON rentals.rental_id = rental_times.rental_id \
			JOIN listings ON listings.id = rentals.listing_id \
			WHERE rentals.account_id = ? \
			AND rentals.status = 1 \
			ORDER BY listings.domain_name ASC, rentals.rental_id DESC, rental_times.date ASC";
	account_query(query, "Failed to get all rentals belonging to account " + account_id + "!", callback, account_id);
}

//gets all chats for an account
account_model.prototype.getAccountChats = function(account_id, callback){
	console.log("DB: Attempting to get all chat info for account #" + account_id + "...");
	query = "SELECT \
				chat_history.message, \
				chat_history.seen, \
				max_date.timestamp, \
				max_date.username, \
				max_date.id \
			FROM chat_history \
			INNER JOIN ( \
				SELECT  \
					 MAX(chat_history.id) as max_id, \
					 MAX(chat_history.timestamp) as timestamp, \
					 accounts.username, \
					 accounts.id \
			 	FROM chat_history  \
				JOIN accounts \
				ON (  \
					(accounts.id = chat_history.sender_account_id AND chat_history.receiver_account_id = ?)  \
					OR  \
					(accounts.id = chat_history.receiver_account_id AND chat_history.sender_account_id = ?)  \
				) \
				GROUP BY accounts.email \
			) max_date \
			ON chat_history.timestamp = max_date.timestamp AND chat_history.id = max_date.max_id \
			ORDER BY chat_history.timestamp DESC"
	account_query(query, "Failed to get all chat info for account #" + account_id + "!", callback, [account_id, account_id]);
}

//gets the stripe ID and listing type of a listing owner
account_model.prototype.getStripeAndType = function(domain_name, callback){
	console.log("DB: Attempting to get the Stripe ID of the owner of: " + domain_name + "...");
	query = "SELECT \
				accounts.stripe_account \
			FROM accounts \
			JOIN listings ON listings.owner_id = accounts.id \
			WHERE listings.domain_name = ? ";
	account_query(query, "Failed to get the Stripe ID of the owner of: " + domain_name + "!", callback, domain_name);
}

//</editor-fold>

//<editor-fold>-------------------------------SETS-------------------------------

//creates a new account
account_model.prototype.newAccount = function(account_info, callback){
	console.log("DB: Creating a new account for email: " + account_info.email + "...");
	query = "INSERT INTO accounts \
			SET ? "
	account_query(query, "Failed to create a new account for email: " + account_info.email + "!", callback, account_info);
}

//uses a sign up code
account_model.prototype.useSignupCode = function(signup_code, code_obj, callback){
	console.log("DB: Using signup code: " + signup_code + "...");
	query = "UPDATE signup_codes \
			SET ? \
			WHERE code = ?"
	account_query(query, "Failed to use signup code: " + signup_code + "!", callback, [code_obj, signup_code]);
}

//creates new sign up codes
account_model.prototype.createSignupCodes = function(codes, callback){
	console.log("DB: Creating signup codes...");
	query = "INSERT IGNORE INTO signup_codes (\
				code, \
				referer_id \
			)\
			VALUES ? \
			ON DUPLICATE KEY UPDATE \
				code = MD5(NOW())"
	account_query(query, "Failed to create signup codes!", callback, [codes]);
}

//</editor-fold>

//<editor-fold>-------------------------------UPDATES-------------------------------

//updates a new account
account_model.prototype.updateAccount = function(account_info, email, callback){
	if (!account_info.date_accessed){
		console.log("DB: Updating account with email: " + email + "...");
	}
	query = "UPDATE accounts \
			SET ? \
			WHERE email = ?"
	account_query(query, "Failed to update account!", callback, [account_info, email]);
}

//updates specific stripe account (for deletion)
account_model.prototype.updateAccountStripe = function(account_info, stripe_account, callback){
	console.log("DB: Updating account with Stripe account id: " + stripe_account + "...");
	query = "UPDATE accounts \
			SET ? \
			WHERE stripe_account = ?"
	account_query(query, "Failed to update account with Stripe account id: " + stripe_account + "!", callback, [account_info, stripe_account]);
}
