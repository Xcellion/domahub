
//helper function to make cookie
function bake_cookie(name, value) {
	//var cookie = [name, '=', JSON.stringify(value), '; domain=.', window.location.host.toString(), '; path=/;'].join('');
	var cookie = [name, '=', JSON.stringify(value), '; path=/;'].join('');
	document.cookie = cookie;
}

//helper function to read a cookie
function read_cookie(name) {
	var result = document.cookie.match(new RegExp(name + '=([^;]+)'));
	result && (result = JSON.parse(result[1]));
	return result;
}

//helper function to delete a cookie
function delete_cookie(name) {
	//document.cookie = [name, '=; expires=Thu, 01-Jan-1970 00:00:01 GMT; path=/; domain=.', window.location.host.toString()].join('');
	document.cookie = [name, '=; expires=Thu, 01-Jan-1970 00:00:01 GMT', '; path=/;'].join('');
}