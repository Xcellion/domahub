//function to join all rental times
function joinRentalTimes(rental_times){
	var temp_times = rental_times.slice(0);

    //loop once
    for (var x = temp_times.length - 1; x >= 0; x--){
        var orig_start = new Date(temp_times[x].date);
        var orig_end = new Date(orig_start.getTime() + temp_times[x].duration);

        //loop twice to check with all others
        for (var y = temp_times.length - 1; y >= 0; y--){
            var compare_start = new Date(temp_times[y].date);
            var compare_end = new Date(compare_start.getTime() + temp_times[y].duration);

            //touches bottom
            if (x != y && orig_start.getTime() == compare_end.getTime()){
				temp_times[y].duration = temp_times[y].duration + temp_times[x].duration;
                temp_times.splice(x, 1);
            }
        }
    }

	return temp_times;
}
