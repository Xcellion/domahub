module.exports = function(app, db, auth, error){
	require('./api/api.js')(app, db, error);					// API for all domains listed on w3bbi
	require('./accounts.js')(app, db, auth, error); 				// For authentication, account creation, log in, log out
	require('./listings/listings.js')(app, db, auth, error); 		// For website listings
	require('./profiles.js')(app, db, auth, error); 				// For individual user profiles
	require('./sellers.js')(app, db, auth, error); 					// Sellers information page
	require('./careers.js')(app, db, auth, error); 			// Careers page
	require('./company.js')(app, db, auth, error);  // For all company related views located in footer
	require('./contact.js')(app, db, auth, error); 			// Contact Us page
	require('./sellers.js')(app, db, auth, error); 			// Sellers information page
	require('./tos.js')(app, db, auth, error); 					// Terms of Service
	require('./privacy.js')(app, db, auth, error); 			// Privacy Policy
}
