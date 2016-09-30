module.exports = function(app, db, auth, error){
	require('./main_routes.js')(app, auth); 						// for all main page links
	require('./auth_routes.js')(app, auth); 						// for authentication, account creation, log in, log out
	require('./listing_routes.js')(app, db, auth, error); 			// for website listings
	require('./profile_routes.js')(app, db, auth, error); 			// for individual user profiles
	require('./chat_routes.js')(app, db, auth, error); 				// for messaging
}
