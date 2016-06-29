// set up paths
module.exports = function(app, db, passport, io){
	var error = require('./error.js');
	var auth = require('./auth.js').auth(db, passport, error);
	var auth = require('./auth.js');
	require('./account.js')(app, db, auth, error);
	require('./listings.js')(app, db, auth, error);
}