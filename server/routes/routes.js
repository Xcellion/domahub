module.exports = function(app, db, auth, error, proxy){
	require('./api/api.js')(app, db, error, proxy);					// API for all domains listed on w3bbi
	require('./accounts.js')(app, db, auth, error); 				// For authentication, account creation, log in, log out
	require('./companyinfo.js')(app, db, auth, error); 				// For all company related views located in footer
	require('./listings/listings.js')(app, db, auth, error); 		// For website listings
	require('./profiles.js')(app, db, auth, error); 				// For individual user profiles
	require('./sellers.js')(app, db, auth, error); 					// Sellers information page
}
