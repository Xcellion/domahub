// set up paths
module.exports = function(app, db, passport, io){
	require('./account.js')(app, db, passport);
	require('./listings.js')(app, db, passport);
}