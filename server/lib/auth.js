var	account_model = require('../models/account_model.js');

var database,
	passport,
	error;

var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt-nodejs');
var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');
var validator = require("validator");
var crypto = require("crypto");

var options = {
    auth: {
        api_key: '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'
    }
}
var mailer = nodemailer.createTransport(sgTransport(options));

module.exports = {

	//constructor
	auth: function(db, pp, e){
		database = db;
		passport = pp;
		error = e;

		Account = new account_model(db);

		// used to serialize the user for the session
		passport.serializeUser(function(user, done) {
			delete user.password;
			done(null, user);
		});

		// called every subsequent request. should we re-get user data?
		passport.deserializeUser(function(user, done) {

			//if we need to refresh the user, refresh the user.
			if (user.refresh){
				delete user.refresh;
				Account.getAccount(user.email, function(result){
					if (result.state=="error"){
						done(err, null);
					}
					else {
						done(null, result.info[0]);
					}
				});
			}
			else {
				done(null, user);
			}
		});

		//post to create a new account
		passport.use('local-signup', new LocalStrategy({
				usernameField: 'email',
				passReqToCallback : true // allows us to pass back the entire request to the callback
			},
			function(req, email, password, done) {

				//check if account already exists
				Account.getAccount(email, function(result){
					if (result.state=="error"){ done(result.info, null); }

					//account exists
					else if (result.info.length){
						return done(null, false, {message: 'User exists!'});
					}

					//account doesnt exist
					else {
						var now = new Date();
						var now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());

						var account_info = {
							email: email,
							fullname: req.body.fullname,
							password: bcrypt.hashSync(password, null, null),
							date_created: now_utc,
							date_accessed: now_utc
						}

						//create the new account
						Account.newAccount(account_info, function(result){
							if (result.state=="error"){ done(result.info, null); }
							else {
								account_info.id = result.info.insertId;
								account_info.type = 0;
								return done(null, account_info);
							}
						});
					}
				});
			})
		);

		//post to check login
		passport.use('local-login', new LocalStrategy({
				usernameField: 'email',
				passReqToCallback : true // allows us to pass back the entire request to the callback
			},
			function(req, email, password, done) {
				Account.getAccount(email, function(result){
					if (result.state=="error"){
						done(err, null);
					}

					//account doesnt exists
					else if (!result.info.length){
						return done(null, false, {message: 'Invalid user!'});
					}

				 	// if the user is found but the password is wrong
					else if (!bcrypt.compareSync(password, result.info[0].password)){
						return done(null, false, {message: 'Invalid password!'});
					}

					else {
						user = result.info[0];
						var now = new Date();
						var now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
						var account_info = {
							date_accessed : now_utc
						};

						//update account last accessed
						Account.updateAccount(account_info, email, function(result){
							if (result.state=="error"){ done(result.info, null); }
							else {
								return done(null, user);
							}
						});
					}
				});
			})
		);

	},

	//helper functions related to authentication
	isLoggedIn: isLoggedIn,
	isNotLoggedIn : isNotLoggedIn,
	messageReset: messageReset,

	//account related route functions
	logout: logout,
	signup: signup,
	forgot: forgot,
	reset: reset,

	signupPost: signupPost,
	loginPost: loginPost,
	forgotPost: forgotPost,
	resetPost: resetPost
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

//function to make sure user is NOT logged in
function isNotLoggedIn(req, res, next) {
	if (req.isAuthenticated()){
		res.redirect("/");		//if user is authenticated in the session redirect to main page
	}
	else {
		next();
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
		console.log(req.user.email + " is logging out.");
		delete req.session.mylistings;
		delete req.session.myrentals;
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
	if (req.header("Referer") && req.header("Referer").split("/").indexOf("listing") != -1){
		req.session.redirectBack = req.header("Referer");
	}
	res.render("signup.ejs", { message: messageReset(req)});
};

//forgot my password
function forgot(req, res){
	res.render("pw_forgot.ejs", {message: messageReset(req)});
}

//function to check token for resetting password
function reset(req, res){
	res.render("pw_reset.ejs", {message: messageReset(req)});
}

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

//function to change password
function forgotPost(req, res, next){
	email = req.body.email;

	if (!validator.isEmail(email)){
		error.handler(req, res, "Invalid email!", "json");
	}
	else {

		//generate token to email to user
		crypto.randomBytes(20, function(err, buf) {
			var forgot_token = buf.toString('hex');
			var now = new Date(new Date().getTime() + 3600000); 	// 1 hour buffer
			var forgot_exp = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());

			var account_info = {
				forgot_token : forgot_token,
				forgot_exp : forgot_exp
			};

			//update account with token and expiration
			Account.updateAccount(account_info, email, function(result){
				if (result.state=="error"){error.handler(req, res, result.info);}
				else {
					var email = {
						to: req.body.email,
						from: 'theITguy@w3bbi.com',
						subject: 'Forgot your password for w3bbi?',
						text: 'You are receiving this because you (or someone else) requested the reset of the password for your account.\n\n' +
					          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
					          'http://' + req.headers.host + '/reset/' + forgot_token + '\n\n' +
					          'If you did not request this, please ignore this email and your password will remain unchanged.\n' +
							  'The link above will expire in 1 hour.'
					};

					//send email
					mailer.sendMail(email, function(err) {
						if (err) {
							console.log(err)
						}
						else {
							res.send({
								state: "success"
							})
						}
					});
				}
			});
		});
	}
}

//function to reset password
function resetPost(req, res, next){
	var token = req.params.token;
	var password = req.body.password;

	if (!token){
		error.handler(req, res, "Invalid token!", "json");
	}
	else if (!password){
		error.handler(req, res, "Invalid password!", "json");
	}
	else {
		Account.getAccountByToken(token, function(result){
			if (result.state=="error"){error.handler(req, res, result.info);}
			else {
				var email = result.info[0].email;
				var forgot_exp = new Date(result.info[0].forgot_exp);
				var now = new Date();
				var now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());

				//if token hasn't expired
				if (now_utc < forgot_exp){
					//update account with new password
					var account_info = {
						password : bcrypt.hashSync(password, null, null),
					};

					Account.updateAccount(account_info, email, function(result){
						if (result.state=="error"){error.handler(req, res, result.info);}
						else {

							account_info = {
								forgot_exp: null,
								forgot_token: null
							}

							//delete the token and expiration date
							Account.updateAccount(account_info, email, function(result){
								if (result.state=="error"){error.handler(req, res, result.info);}
								else {
									res.send({
										state: "success"
									});
								}
							});
						}
					});
				}
				else {
					error.handler(req, res, "The token has expired!", "json");
				}
			}
		});
	}
}
