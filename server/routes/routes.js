// set up paths
module.exports = function(app, db, auth, error){
	require('./companyinfo.js')(app, db, auth, error); // For all company related views located in footer
	require('./accounts.js')(app, db, auth, error); // For authentication, account creation, log in, log out
	require('./profiles.js')(app, db, auth, error); // For individual user profiles
	require('./listings.js')(app, db, auth, error); // For website listings
	require('./rentals.js')(app, db, auth, error); //
}
