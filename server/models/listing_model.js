module.exports = game_model;

function game_model(database, Account){
	this.db = database;
	this.account = Account;
}

//sets listings database
game_model.prototype.setListings = function(listing_id, listing_info, callback){
	console.log("Attempting to set info for listing #" + listing_id);
	this.db.query('UPDATE listings SET ? WHERE id = ?', function(result){
		//listing info was changed
		if (result.length >= 0){
			callback({
				"state" : "success"
			});
		}
	}, [listing_info, listing_id]);
}

//gets listings database info
game_model.prototype.getListingInfo = function(listing_id, listing_DB, callback){
	console.log("Attempting to get info for listing #" + listing_id);
	this.db.query('SELECT * from ?? WHERE id = ?', function(result){
		//listing info successfully retrieved
		if (result.length >= 0){
			callback({
				"state" : "success",
				"listing_info" : result[0]
			});
		}
	}, [listing_DB, listing_id]);
}