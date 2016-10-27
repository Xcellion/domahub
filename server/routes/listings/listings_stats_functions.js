module.exports = {
	//function to check times
	checkRentalTimes : function(req, res, next){
		var times = req.body.events;

		//no times posted
		if (!times || times.length <= 0){
			error.handler(req, res, "Invalid dates!", "json");
		}
		else {
			var desired_times_info = [];
			var user_id = (req.user) ? req.user.id : null;
			var user_ip = req.headers['x-forwarded-for'] ||
					     req.connection.remoteAddress ||
					     req.socket.remoteAddress ||
					     req.connection.socket.remoteAddress;

			for (var x = 0; x < times.length; x++){
				var temp_start = new Date(parseFloat(times[x].start));
				var temp_end = new Date(parseFloat(times[x].end));

				//check if its even a valid JS date
				if (!isNaN(temp_start) && !isNaN(temp_end)){
					var temp_obj = [req.params.domain_name.toLowerCase(), new Date().getTime()];
					temp_obj.push(times[x].start, times[x].end - times[x].start, user_id, user_ip);
					desired_times_info.push(temp_obj);
				}
			}

			//checks are gucci
			if (desired_times_info.length > 0){
				req.session.desired_times_info = desired_times_info;
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

	//function to keep track of possible desired rental times for unlisted unavailable domains
	newDesiredTimes : function(req, res, next){
		var user_ip = req.headers['x-forwarded-for'] ||
					 req.connection.remoteAddress ||
					 req.socket.remoteAddress ||
					 req.connection.socket.remoteAddress;

		//add to db if its not localhost
		if (user_ip != "::1"){
			Data.newDesiredRentalTimes(req.params.domain_name, req.session.desired_times_info, function(result){
				delete req.session.desired_times_info;
				res.send({
					state: "success"
				});
			});
		}
		else {
			console.log(req.session.desired_times_info);
			delete req.session.desired_times_info;
			res.send({
				state: "success"
			});
		}
	}

}
