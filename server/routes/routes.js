// set up paths
module.exports = function(app, db, passport, io){
	var auth = require('./auth.js').auth(db, passport);
	var auth = require('./auth.js');
	var error = require('./error.js');
	require('./account.js')(app, db, auth, error);
	require('./listings.js')(app, db, auth, error);
}