var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt-nodejs');

module.exports = function(passport, db){
	db.connect();

	// used to serialize the user for the session
	passport.serializeUser(function(user, done) {
		done(null, user.id);
	});

	// used to deserialize the user
	passport.deserializeUser(function(id, done) {
		db.query("SELECT * FROM accounts WHERE id = ?", function(rows, err){
			if (!rows.length){
				done(err, null);
			}
			else{
				done(null, rows[0]);
			}
		}, id);
	});
	
	passport.use('local-signup', new LocalStrategy({
			usernameField: 'email',
			passReqToCallback : true // allows us to pass back the entire request to the callback
		},
		function(req, email, password, done) { // callback with email and password from our form
			db.query("SELECT * FROM accounts WHERE email = ?", function(rows){
				if (rows.length) {
					console.log('User exists');
					return done(null, false, {message: 'User exists!'});
				}
				else {
					var mysql_query = "INSERT INTO accounts SET ?"
					db.query(mysql_query, function(rows, err){
						rows.id = rows.insertId;
						return done(null, rows);
					}, {
						email: email,
						fullname: req.body.fullname,
						password: bcrypt.hashSync(password, null, null),
						date_created: new Date(),
						date_accessed: new Date()
					});
				}
			}, email);
		})
	);
	
	passport.use('local-login', new LocalStrategy({
			usernameField: 'email',
			passReqToCallback : true // allows us to pass back the entire request to the callback
		},
		function(req, email, password, done) { // callback with email and password from our form
			db.query("SELECT * FROM accounts WHERE email = ?", function(rows){
				if (!rows.length) {
					return done(null, false, {message: 'Invalid user!'});
				}

				// if the user is found but the password is wrong
				if (!bcrypt.compareSync(password, rows[0].password)){
					return done(null, false, {message: 'Invalid password!'});
				}
				
				// all is well, return successful user
				else {
					db.query("UPDATE accounts SET ? WHERE email = ?", function(result){
						if (result){
							return done(null, rows[0]);
						}
						else {
							console.log(result);
							console.log("Failed to update last accessed date!");
						}
					}, [{ date_accessed : new Date()}, email]);
				}
			}, email);
		})
	);
};