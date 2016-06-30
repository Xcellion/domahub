// set up paths
module.exports = function(app, db, auth, error){
	require('./account.js')(app, db, auth, error);
	require('./listings.js')(app, db, auth, error);
}