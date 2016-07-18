// set up paths
module.exports = function(app, db, auth, error){
	require('./accounts.js')(app, db, auth, error);
	require('./profiles.js')(app, db, auth, error);
	require('./listings.js')(app, db, auth, error);
	require('./rentals.js')(app, db, auth, error);
}
