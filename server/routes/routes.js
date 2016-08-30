module.exports = function(app, db, auth, error){
	require('./api/api.js')(app, db, error);					// API for all domains listed on w3bbi
	require('./main_routes.js')(app, auth); 				// for all main page links

	require('./auth_routes.js')(app, auth); 						// For authentication, account creation, log in, log out
	require('./listing_routes.js')(app, db, auth, error); 	// For website listings
	require('./profile_routes.js')(app, db, auth, error); 			// For individual user profiles
}
