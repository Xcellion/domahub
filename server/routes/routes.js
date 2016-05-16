// set up paths
module.exports = function(app, db, passport, io){
	require('./admin.js')(app, db);
	require('./account.js')(app, db, passport);
}