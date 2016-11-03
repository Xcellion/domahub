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
var request = require('request');

var options = {
    auth: {
        api_key: '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'
    }
}
var mailer = nodemailer.createTransport(sgTransport(options));

module.exports = {

	//constructor
	init: function(db, pp, e){
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
				Account.getAccount(user.email, undefined, function(result){
					if (result.state=="error"){
						done(err, user);
					}
					else {
						done(null, null);
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
				Account.getAccount(email, username, function(result){
					if (result.state=="error"){ done(false, { message: result.info}); }

					//account exists
					else if (result.info.length){
						return done(false, {message: 'User exists!'});
					}

					//account doesnt exist
					else {
						var now = new Date();
						var now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());

						var account_info = {
							email: email,
							username: username,
							password: bcrypt.hashSync(password, null, null),
							date_created: now_utc,
							date_accessed: now_utc
						}

						//create the new account
						Account.newAccount(account_info, function(result){
							if (result.state=="error"){ done(false, { message: result.info}); }
							else {
								account_info.id = result.info.insertId;
								account_info.type = 0;
								return done(account_info);
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
				Account.getAccount(email, undefined, function(result){
					if (result.state=="error"){
						done(result.info, null);
					}

					//account doesnt exists
					else if (!result.info.length){
						return done(null, false, {message: 'Invalid user!'});
					}

				 	//if the user is found but the password is wrong
					else if (!bcrypt.compareSync(password, result.info[0].password)){
						return done(null, false, {message: 'Invalid password!'});
					}

					else {
						user = result.info[0];
						return done(null, user);
					}
				});
			})
		);

	},

	//helper functions related to authentication
	//make sure user is logged in before doing anything
	checkLoggedIn : function(req, res, next) {
		var route = req.path;

		//if user is authenticated in the session, carry on
		if (req.isAuthenticated()){
			res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
			res.header('Expires', '-1');
			res.header('Pragma', 'no-cache');

			//no verified email, make them verify
			if (req.user.type == 0){
				res.render("account/pw_verify.ejs", {message: messageReset(req)});
			}
			else {
				req.session.touch();	//reset maxAge for session since user did something
				return next();
			}
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
						res.render("account/login.ejs", {message: messageReset(req)});
					}
					//redirect to the default login page
					else {
						res.render("account/login.ejs", {message: messageReset(req)});
					}
					break;
			}
		}
	},

	//function to make sure user is NOT logged in
	isNotLoggedIn : function(req, res, next) {
		if (req.isAuthenticated()){
			res.redirect("/profile");		//if user is authenticated in the session redirect to main page
		}
		else {
			next();
		}
	},

	//function to check token length
	checkToken : function(req, res, next){
		if (req.params.token.length != 40 || !req.params.token){
			res.redirect('/');
		}
		else {
			next();
		}
	},

	//resets message
	messageReset: messageReset,

	//log out of the session
	logout: function(req, res) {
		if (req.isAuthenticated()){
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
	},

	//sign up for a new account
	signup: function(req, res){
		if (req.header("Referer") && req.header("Referer").split("/").indexOf("listing") != -1){
			req.session.redirectBack = req.header("Referer");
		}
		res.render("account/signup.ejs", { message: messageReset(req)});
	},

	//forgot my password
	forgot: function(req, res){
		res.render("account/pw_forgot.ejs", {message: messageReset(req)});
	},

	//function to check token for resetting password
	renderReset: function(req, res){
		res.render("account/pw_reset.ejs", {message: messageReset(req)});
	},

	//function to check token for verifying account email
	renderVerify: function(req, res){
		res.render("account/verify_email.ejs", {message: messageReset(req)});
	},

	//function to request verification
	requestVerify: function(req, res){
		if (req.isAuthenticated() && req.user.type == 0 && !req.user.requested && req.header("x-requested-with") == "XMLHttpRequest"){
			req.user.requested = true;
			generateVerify(req, res, req.user.email, req.user.username, function(state){
				if (state == "success"){
					req.logout();
					res.send({
						state: "success"
					})
				}
				else {
					res.send({
						state: "error"
					})
				}
			});
		}
		else if (!req.isAuthenticated()){
			req.session.message = "You must log in first to verify your account!";
			error.handler(req, res, "Please log in!", "json");
		}
		else if (req.user.type == 1){
			error.handler(req, res, "Account is already verified!", "json");
		}
		else if (req.user.requested){
			error.handler(req, res, "Please check your email for further instructions!", "json");
		}
		else {
			error.handler(req, res, "Something went wrong with account verification!", "json");
		}
	},

	//function to sign up for a new account
	signupPost: function(req, res, next){
		email = req.body.email;
		username = req.body.username;
		password = req.body.password;
		recaptcha = req.body["g-recaptcha-response"]

		//not a valid email
		if (!email || !validator.isEmail(email)){
			error.handler(req, res, "Invalid email!", "json");
		}
		//invalid username
		else if (!username || /\s/.test(username)){
			error.handler(req, res, "Invalid name!", "json");
		}
		//username is too long
		else if (username.length > 70){
			error.handler(req, res, "Username is too long!", "json");
		}
		//username is too short
		else if (username.length < 3){
			error.handler(req, res, "Username is too short!", "json");
		}
		//invalid password
		else if (!password){
			error.handler(req, res, "Invalid password!", "json");
		}
		//password is too long
		else if (70 > password.length){
			error.handler(req, res, "Password is too long!", "json");
		}
		//password is too long
		else if (password.length > 3){
			error.handler(req, res, "Password is too short!", "json");
		}
		//recaptcha is empty
		else if (!recaptcha){
			error.handler(req, res, "Invalid captcha!", "json");
		}
		//verify recaptcha with google
		else {
			request.post({
				url: 'https://www.google.com/recaptcha/api/siteverify',
				form: {
					secret: "6LdwpykTAAAAAEMcP-NUWJuVXMLEQx1fZLbcGfVO",
					response: recaptcha
				}
			},
				function (err, response, body) {
					body = JSON.parse(body);

					//all good with google!
					if (!err && response.statusCode == 200 && body.success) {

						passport.authenticate('local-signup', {
							failureRedirect : '/signup', // redirect back to the signup page if there is an error
						}, function(user, info){
							if (!user && info){
								error.handler(req, res, info.message);
							}
							else {
								generateVerify(req, res, email, username, function(state){
									//if coming from a listing, redirect to listing. otherwise redirect to profile
									redirectTo = (req.header("Referer").split("/").indexOf("listing") != -1) ? req.header("Referer") : "/profile/dashboard";
									redirectback = req.session.redirectBack;
									req.session.redirectBack = redirectback || redirectTo;
									req.session.message = "Success! Please check your email for further instructions!";
									res.redirect("/login");
								});
							}
						})(req, res, next);
					}
					else {
						error.handler(req, res, "Invalid captcha!");
					}
				}
			)
		}
	},

	//function to login
	loginPost: function(req, res, next){
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
						var now = new Date();
						var now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
						var account_info = {
							date_accessed : now_utc
						};

						//update account last accessed
						console.log("Updating last accessed for account with email: " + req.body.email);
						Account.updateAccount(account_info, req.body.email, function(result){
							delete req.session.redirectBack;
							return res.redirect(redirectURL);
						});
					}
				});
			}
		})(req, res, next);
	},

	//function to change password
	forgotPost: function(req, res, next){
		email = req.body.email;

		if (!validator.isEmail(email)){
			error.handler(req, res, "Invalid email!", "json");
		}
		else {

			//generate token to email to user
			crypto.randomBytes(20, function(err, buf) {
				var token = buf.toString('hex');
				var now = new Date(new Date().getTime() + 3600000); 	// 1 hour buffer
				var token_exp = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());

				var account_info = {
					token : token,
					token_exp : token_exp
				};

				//update account with token and expiration
				Account.updateAccount(account_info, email, function(result){
					if (result.state=="error"){error.handler(req, res, result.info);}
					else {

						var email = {
							to: req.body.email,
							from: 'noreply@domahub.com',
							subject: 'Forgot your password for domahub?',
							text: 'You are receiving this because you (or someone else) requested the reset of the password for your account.\n\n' +
						          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
						          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
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
	},

	//function to reset password
	resetPost: function(req, res, next){
		var token = req.params.token;
		var password = req.body.password;

		if (!password){
			error.handler(req, res, "Invalid password!", "json");
		}
		else {
			Account.getAccountByToken(token, function(result){
				if (result.state=="error"){error.handler(req, res, result.info);}
				else if (!result.info.length){
					error.handler(req, res, "Invalid token! Please click here to reset your password again!", "json");
				}
				else {
					var email = result.info[0].email;
					var token_exp = new Date(result.info[0].token_exp);
					var now = new Date();
					var now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());

					//if token hasn't expired
					if (now_utc < token_exp){
						//update account with new password
						var account_info = {
							password : bcrypt.hashSync(password, null, null),
						};

						Account.updateAccount(account_info, email, function(result){
							if (result.state=="error"){error.handler(req, res, result.info);}
							else {

								account_info = {
									token: null,
									token_exp: null
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
	},

	//function to verify account
	verifyPost: function(req, res, next){
		var token = req.params.token;

		Account.getAccountByToken(token, function(result){
			if (result.state=="error"){error.handler(req, res, result.info);}
			else if (!result.info.length){
				error.handler(req, res, "Invalid token! Please click here to verify your account again!", "json");
			}
			else {
				var email = result.info[0].email;
				var token_exp = new Date(result.info[0].token_exp);
				var now = new Date();
				var now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());

				//if token hasn't expired
				if (now_utc < token_exp){

					//update account with new type
					account_info = {
						type: 1
					}

					Account.updateAccount(account_info, email, function(result){
						if (result.state=="error"){error.handler(req, res, result.info);}
						else {

							account_info = {
								token: null,
								token_exp: null
							}

							//delete the token and expiration date
							Account.updateAccount(account_info, email, function(result){
								if (result.state=="error"){error.handler(req, res, result.info);}
								else {
									if (req.user){
										delete req.user.requested;
										req.user.refresh = true;
									}
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
	},

	//function to check account settings posted
	checkAccountSettings: function(req, res, next){
		new_email = req.body.new_email;
		username = req.body.username;
		password = req.body.new_password;

		//not a valid email
		if (new_email && !validator.isEmail(new_email)){
			error.handler(req, res, "Invalid email!", "json");
		}
		//username too long
		else if (username && username.length > 70){
			error.handler(req, res, "Username is too long!", "json");
		}
		//username too short
		else if (username && username.length < 3){
			error.handler(req, res, "Username is too short!", "json");
		}
		//username is invalid
		else if (username && /\s/.test(username)){
			error.handler(req, res, "Invalid name!", "json");
		}
		//password is too long
		else if (password && 70 > password.length){
			error.handler(req, res, "Password is too long!", "json");
		}
		//password is too long
		else if (password && password.length > 3){
			error.handler(req, res, "Password is too short!", "json");
		}
		//check the pw
		else {
			req.body.email = req.body.email || req.user.email;
			passport.authenticate('local-login', function(err, user, info){
				if (!user && info){
					error.handler(req, res, info.message, "json");
				}
				else {
					next();
				}
			})(req, res, next);
		}
	},

	//function to update account settings
	updateAccountSettings : function(req, res, next){
		new_account_info = {};
		if (req.body.new_email){
			new_account_info.email = req.body.new_email;
		}
		if (req.body.username){
			new_account_info.username = req.body.username;
		}
		if (req.body.new_password){
			new_account_info.password = bcrypt.hashSync(req.body.new_password, null, null);
		}
		console.log(new_account_info, req.body);
		//update only if theres something to update
		if (req.body.new_email || req.body.username || req.body.new_password){
			Account.updateAccount(new_account_info, req.user.email, function(result){
				if (result.state=="error"){
					if (result.errcode == "ER_DUP_ENTRY"){
						error.handler(req, res, "A user with that email/username already exists!", "json");
					}
					else {
						error.handler(req, res, result.info, "json");
					}
				}
				else {
					req.user.email = req.body.email;
					req.user.username = req.body.username;
					res.json({
						state: "success",
						user: req.user
					});
				}
			})
		}
		else {
			error.handler(req, res, "Failed to update account settings!", "json");
		}

	}

}

//helper function to reset a session message;
function messageReset(req){
	if (req.session){
		var message = req.session.message;
		delete req.session.message;
		return message;
	}
}

//helper function to verify account
function generateVerify(req, res, email, username, cb){
	//generate token to email to user
	crypto.randomBytes(20, function(err, buf) {
		var verify_token = buf.toString('hex');
		var now = new Date(new Date().getTime() + 3600000); 	// 1 hour buffer
		var verify_exp = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());

		var account_info = {
			token : verify_token,
			token_exp : verify_exp
		};

		//update account with token and expiration
		Account.updateAccount(account_info, email, function(result){
			if (result.state=="error"){error.handler(req, res, result.info);}
			else {
				var email_message = {
					to: email,
					from: 'noreply@domahub.com',
					subject: 'Verify your account at domahub!',
					text: 'Hello, ' + username + '.\n\n' +
						  'Please click on the following link, or paste this into your browser to verify your email.\n\n' +
						  'http://' + req.headers.host + '/verify/' + verify_token + '\n\n' +
						  'The link above will expire in 1 hour.'
				};

				//send email
				mailer.sendMail(email_message, function(err) {
					if (err) {
						cb(err);
					}
					else {
						cb("success");
					}
				});
			}
		});
	});
}
