var database,
	passport,
	error;
	
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt-nodejs');

module.exports = {
	
	//constructor
	auth: function(db, pp, e){
		database = db;
		passport = pp;
		error = e;		
		
		database.connect();
		
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
						return done(null, false, {message: 'User exists!'});
					}
					else {
						var mysql_query = "INSERT INTO accounts SET ?";
						var now = new Date();
						var now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());

						db.query(mysql_query, function(rows, err){
							rows.id = rows.insertId;
							return done(null, rows);
						}, {
							email: email,
							fullname: req.body.fullname,
							password: bcrypt.hashSync(password, null, null),
							date_created: now_utc,
							date_accessed: now_utc
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
						var now = new Date();
						var now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());

						db.query("UPDATE accounts SET ? WHERE email = ?", function(result){
							if (result){
								return done(null, rows[0]);
							}
							else {
								console.log("Failed to update last accessed date!");
								console.log(result);
							}
						}, [{ date_accessed : now_utc}, email]);
					}
				}, email);
			})
		);
		
	},
	
	//helper functions related to authentication
	messageReset: messageReset,
	isLoggedIn: isLoggedIn,
	logout: logout,
	signup: signup,
	signupPost: signupPost,
	loginPost: loginPost
}

//make sure user is logged in before doing anything
function isLoggedIn(req, res, next) {
	var route = req.route.path;
	
	//if user is authenticated in the session, carry on
	if (req.isAuthenticated()){
		delete req.user.password;
		console.log("Authenticated!");
		return next();
	}
	else {
		console.log("Not logged in!");
		//redirect them back to the listing page with message
		if (route == "/listing/:domain_name/:rental_id"){
			error.handler(req, res, "Invalid user!");
		}
		//redirect to the default login page
		else {
			req.session.redirectTo = req.header('Referer');
			res.render("login.ejs");
		}
	}
}

//resets message
function messageReset(req){
	var message = req.session.message;
	delete req.session.message;
	return message;
}

//log out of the session
function logout(req, res) {
	console.log("Logging out");
	req.logout();
	res.redirect('/');
};

//sign up for a new account
function signup(req, res){
	res.render("signup.ejs", { message: req.session.message});
};

//function to login 
function loginPost(req, res, next){
	//redirect to referrer or main page
	redirectURL = req.path == "/login" ? "/" : req.header("Referer");
	passport.authenticate('local-login', function(err, user, info){
		if (!user && info){
			error.handler(req, res, info.message);
		}
		else {
			req.logIn(user, function(err) {
				if (err) {
					error.handler(req, res, "Login error!");
				}
				else {
					return res.redirect(redirectURL);
				}
			});
		}
	})(req, res, next);
};

//function to sign up for a new account
function signupPost(req, res, next){
	redirectURL = req.path == "/signup" ? "/" : req.header("Referer");
	passport.authenticate('local-signup', {
		successRedirect : '/', // redirect to main page
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
	}, function(err, user, info){
		if (!user){
			return res.redirect('/signup');
		}
		req.logIn(user, function(err) {
			if (err) {
				error.handler(req, res, "Signup error!");
			}
			else {
				return res.redirect(redirectURL);
			}
		});
	})(req, res, next);
};