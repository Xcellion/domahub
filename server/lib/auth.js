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

		// used to serialize the user for the session
		passport.serializeUser(function(user, done) {
			done(null, user.id);
		});

		// used to deserialize the user
		passport.deserializeUser(function(id, done) {
			db.query("SELECT id, fullname, email, date_created, date_accessed, admin, buyer_seller FROM accounts WHERE id = ?", function(rows, err){
				if (err){
					done(err, null);
				}
				else{
					done(null, rows[0]);
				}
			}, id);
		});

		//post to create a new account
		passport.use('local-signup', new LocalStrategy({
				usernameField: 'email',
				passReqToCallback : true // allows us to pass back the entire request to the callback
			},
			function(req, email, password, done) { // callback with email and password from our form
				db.query("SELECT id, fullname, email, date_created, date_accessed, admin, buyer_seller FROM accounts WHERE email = ?", function(rows, err){
					if (err){
						done(err, null);
					}
					else if (rows.length) {
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

		//post to check login
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
	isLoggedIn: isLoggedIn,
	messageReset: messageReset,
	logout: logout,
	signup: signup,
	signupPost: signupPost,
	loginPost: loginPost
}

//make sure user is logged in before doing anything
function isLoggedIn(req, res, next) {
	var route = req.path;

	//if user is authenticated in the session, carry on
	if (req.isAuthenticated()){
		res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
		res.header('Expires', '-1');
		res.header('Pragma', 'no-cache');
		console.log("Authenticated!");
		return next();
	}
	else {
		switch (req.method){
			case ("POST"):
				error.handler(req, res, "Invalid username / password!", "json");
				break;
			default:
				//redirect them back to the listing page with message
				if (route == "/listing/:domain_name/:rental_id"){
					error.handler(req, res, "Invalid user!");
				}
				else if (route.split("/").indexOf("profile") != -1){
					req.session.redirectBack = route;
					res.render("login.ejs", {message: messageReset(req)});
				}
				//redirect to the default login page
				else {
					res.render("login.ejs", {message: messageReset(req)});
				}
				break;
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
	if (req.isAuthenticated()){
		console.log("Logging out");
		req.logout();
	}
	if (req.header("Referer")){
		redirectTo = (req.header("Referer").split("/").indexOf("listing") != -1) ? req.header("Referer") : "/";
	}
	else {
		redirectTo = "/";
	}
	res.redirect(redirectTo);
};

//sign up for a new account
function signup(req, res){
	if (req.header("Referer").split("/").indexOf("listing") != -1){
		req.session.redirectBack = req.header("Referer");
	}
	res.render("signup.ejs", { message: messageReset(req)});
};

//function to login
function loginPost(req, res, next){
	//if coming from a listing, redirect to listing. otherwise redirect to profile
	redirectTo = (req.header("Referer").split("/").indexOf("listing") != -1) ? req.header("Referer") : "/profile/dashboard";
	redirectURL = req.session.redirectBack ? req.session.redirectBack : redirectTo;
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
					delete req.session.redirectBack;
					return res.redirect(redirectURL);
				}
			});
		}
	})(req, res, next);
};

//function to sign up for a new account
function signupPost(req, res, next){
	//if coming from a listing, redirect to listing. otherwise redirect to profile
	redirectTo = (req.header("Referer").split("/").indexOf("listing") != -1) ? req.header("Referer") : "/profile/dashboard";
	redirectURL = req.session.redirectBack ? req.session.redirectBack : redirectTo;
	passport.authenticate('local-signup', {
		successRedirect : '/', // redirect to main page
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
	}, function(err, user, info){
		if (!user && info){
			error.handler(req, res, info.message);
		}
		else {
			req.logIn(user, function(err) {
				if (err) {
					error.handler(req, res, "Signup error!");
				}
				else {
					delete req.session.redirectBack;
					return res.redirect(redirectURL);
				}
			});
		}
	})(req, res, next);
};
