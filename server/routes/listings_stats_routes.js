var	listing_model = require('../models/listing_model.js');

module.exports = {

	init : function(e, l){
		error = e;
		Listing = l;
	},

	//function to check times
	checkRentalTimes : function(req, res, next){
		var times = req.body.events;

		//no times posted
		if (!times || times.length <= 0){
			error.handler(req, res, "Invalid dates!", "json");
		}
		else {
			//check if its even a valid JS date
			valid_times = [];
			for (var x = 0; x < times.length; x++){
				temp_start = new Date(times[x].start);
				temp_end = new Date(times[x].end);
				if (!isNaN(temp_start) && !isNaN(temp_end)){
					valid_times.push(times[x]);
				}
			}

			if (valid_times.length > 0){
				req.session.stat_info.times = valid_times;
				next();
			}
			else {
				res.send({
					state:"error",
					message:"None of the times were valid!"
				});
			}
		}
	},

	newWantedTimes : function(req, res, next){

	}

}
