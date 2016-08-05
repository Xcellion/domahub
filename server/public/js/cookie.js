//helper function to store local events as a cookie
function storeCookies(type){
	if (type == "local_events"){
		local_events = $('#calendar').fullCalendar('clientEvents', filterMine);
		cookie = [];
		for (var x = 0; x < local_events.length; x++){
			temp_event = {
				title: local_events[x].title,
				start: local_events[x].start,
				end: local_events[x].end,
				color: local_events[x].color,
				newevent: true
			}
			cookie.push(temp_event);
		}
	}
	else if (type == "type"){
		cookie = parseFloat($("input[type='radio'][name='type']:checked").val());
	}
	else if (type == "rental_info"){
		cookie = rental_info;
	}

	if (read_cookie(type)){
		delete_cookie(type);
	}
	bake_cookie(type, cookie);
	bake_cookie("domain_name", listing_info.domain_name);
}

//helper function to make cookie
function bake_cookie(name, value) {
	var cookie = [name, '=', JSON.stringify(value), '; path=/;'].join('');
	document.cookie = cookie;
}

//helper function to read a cookie
function read_cookie(name) {
	var result = document.cookie.match(new RegExp(name + '=([^;]+)'));
	result && (result = JSON.parse(result[1]));
	return result;
}

//helper function to delete all cookies
function delete_cookies(){
	delete_cookie("local_events");
	delete_cookie("type");
	delete_cookie("rental_info");
}

//helper function to delete a cookie
function delete_cookie(name) {
	//document.cookie = [name, '=; expires=Thu, 01-Jan-1970 00:00:01 GMT; path=/; domain=.', window.location.host.toString()].join('');
	document.cookie = [name, '=; expires=Thu, 01-Jan-1970 00:00:01 GMT', '; path=/;'].join('');
}
