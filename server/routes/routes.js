module.exports = function(app, db, auth, error, stripe){
	require('./main_routes.js')(app, db, auth, error); 						// for all main page links
	require('./auth_routes.js')(app, auth); 								// for authentication, account creation, log in, log out
	require('./listing_routes.js')(app, db, auth, error, stripe); 			// for website listings
	require('./profile_routes.js')(app, db, auth, error, stripe); 			// for individual user profiles
	require('./chat_routes.js')(app, db, auth, error); 						// for messaging
	require('./stripe_routes.js')(app, db, stripe); 						// for stripe web hooks
}
