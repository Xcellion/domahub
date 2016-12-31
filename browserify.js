var	request = require('browser-request');

request({
	url: address
}, function (err, response, body) {
	console.log(response);
	console.log(body);
	console.log(err);
});
