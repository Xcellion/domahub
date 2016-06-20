// set up paths
module.exports = function(app, db, passport, io){
	var auth = require('./auth.js').auth(db, passport);
	var auth = require('./auth.js');
	require('./account.js')(app, db, auth);
	require('./listings.js')(app, db, auth);
}