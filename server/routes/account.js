var app,
	database;

var	account_model = require('../models/account_model.js'),
	listing_model = require('../models/listing_model.js'),
	Account,
	Passport;

module.exports = function(app_pass, db, pp){
	app = app_pass;
	database = db;
	Passport = pp;
	
	Account = new account_model(database);
	Listing = new listing_model(database, Account);
	
	app.get("/", function(req, res, next){
		console.log("Checking if user is authenticated...");
		if (req.isAuthenticated()){
			delete req.user.password;
			console.log("Authenticated!");
			return next();
		}
		else {
			console.log("User is not authenticated");
			return next();
		}
	}, mainPage);
	
	//checks if the user is logged in before running anything
	app.get('/profile', isLoggedIn, profile);
	app.get('/logout', isLoggedIn, logout);
	app.get('/signup', signup);
	
	//create a new account
	app.post('/signup', signupPost);
	
	//login to existing account
	app.post('/', loginPost);
}

//display main page with everything
function mainPage(req, res, next){
	Listing.getAllListings(function(result){
		if (result.state == "success"){
			res.render("index.ejs", {
				message: "",
				listings: result.listings
			});
		}
	});
}

//make sure user is logged in before doing anything
function isLoggedIn(req, res, next) {
	//if user is authenticated in the session, carry on
	if (req.isAuthenticated()){
		delete req.user.password;
		console.log("Authenticated!");
		return next();
	}
	else {
		//if they aren't redirect them to the home page
		res.redirect('/');
	}
}

//goes to profile
function profile(req, res){
	res.render("profile.ejs", {
		user: req.user,
		message: ""
	});
}

//log out of the session
function logout(req, res) {
	console.log("Logging out");
	req.logout();
	//redirect to home page
	res.redirect('/');
};

//sign up for a new account
function signup(req, res){
	var message = req.session.message || "";
	req.session.message = "";
	res.render("signup.ejs", { message: message});
};

function signupPost(req, res, next){
	Passport.authenticate('local-signup', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
	}, function(err, user, info){
		if (!user){
			req.session.message = info.message;
			return res.redirect('/signup');
		}
		req.logIn(user, function(err) {
		  if (err) {
			req.session.messages = "Error";
			return next(err);
		  }

		  // set the message
		  req.session.messages = "Logged in successfully!";
		  return res.redirect('/profile');
		});
	})(req, res, next);
};

function loginPost(req, res, next){
	Passport.authenticate('local-login', {
		successRedirect : '/profile', // redirect to the secure profile section
		failureRedirect : '/', // redirect back to the signup page if there is an error
	}, function(err, user, info){
		if (!user && info){
			req.session.message = info.message;
			var message = req.session.message || "";
			req.session.message = "";
			return res.render('index.ejs', { message: message} );
		}
		req.logIn(user, function(err) {
		  if (err) {
			req.session.messages = "Error";
			return next(err);
		  }

		  // set the message
		  req.session.messages = "Login successfully";
		  return res.redirect('/profile');
		});
	})(req, res, next);
};