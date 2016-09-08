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
				var fullname = req.body.fullname;
				if (70 > fullname.length > 3){
					return done(null, false, {message: 'Invalid name!'});
				}

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
							fullname: fullname,
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
	checkToken : checkToken,
	messageReset: messageReset,

	//account related route functions
	logout: logout,
	signup: signup,
	forgot: forgot,
	renderReset: renderReset,
	renderVerify: renderVerify,

	requestVerify: requestVerify,

	signupPost: signupPost,
	loginPost: loginPost,
	forgotPost: forgotPost,
	resetPost: resetPost,
	verifyPost: verifyPost
}

//make sure user is logged in before doing anything
function isLoggedIn(req, res, next) {
	var route = req.path;

	//if user is authenticated in the session, carry on
	if (req.isAuthenticated()){
		res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
		res.header('Expires', '-1');
		res.header('Pragma', 'no-cache');
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

//function to check token length
function checkToken(req, res, next){
	if (req.params.token.length != 40 || !req.params.token){
		res.redirect('/');
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
function renderReset(req, res){
	res.render("pw_reset.ejs", {message: messageReset(req)});
}

//function to check token for verifying account email
function renderVerify(req, res){
	res.render("signup_verify.ejs", {message: messageReset(req)});
}

//helper function to verify account
function generateVerify(req, res){
	//generate token to email to user
	crypto.randomBytes(20, function(err, buf) {
		var email = req.user.email;
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
					from: 'theITguy@w3bbi.com',
					subject: 'Verify your account at w3bbi?',
					text: 'Hello, ' + req.user.fullname + ' .\n\n' +
						  'Please click on the following link, or paste this into your browser to verify your email:\n\n' +
						  'http://' + req.headers.host + '/verify/' + verify_token + '\n\n' +
						  'The link above will expire in 1 hour.'
				};

				//send email
				mailer.sendMail(email_message, function(err) {
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

//function to request verification
function requestVerify(req, res){
	if (req.user.type == 0 && !req.user.requested && req.header("x-requested-with") == "XMLHttpRequest"){
		req.user.requested = true;
		generateVerify(req, res);
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
						from: 'theITguy@w3bbi.com',
						subject: 'Forgot your password for w3bbi?',
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
}

//function to reset password
function resetPost(req, res, next){
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
}

//function to verify account
function verifyPost(req, res, next){
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
								}
								user.refresh = true;
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
