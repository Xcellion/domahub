var database,
	Passport;

module.exports = {
	auth: function(db, pp){
		database = db;
		Passport = pp;
	},
	
	isLoggedIn: isLoggedIn,
	signupPost: signupPost,
	loginPost: loginPost
}

//make sure user is logged in before doing anything
function isLoggedIn(req, res, next) {
	req.session.redirectTo = req.header('Referer');
	//if user is authenticated in the session, carry on
	if (req.isAuthenticated()){
		delete req.user.password;
		console.log("Authenticated!");
		return next();
	}
	else {
		//if they aren't redirect them to the login page
		res.render("login.ejs", {
			message: "unauthenticated"
		});
	}
}

//function to login 
function loginPost(req, res, next){
	//redirect to referrer or main page
	redirectURL = req.header('Referer') || "/";
	Passport.authenticate('local-login', function(err, user, info){
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
		  return res.redirect(redirectURL);
		});
	})(req, res, next);
};

//function to sign up for a new account
function signupPost(req, res, next){
	Passport.authenticate('local-signup', {
		successRedirect : '/', // redirect to main page
		failureRedirect : '/signup', // redirect back to the signup page if there is an error
	}, function(err, user, info){
		if (!user){
			req.session.message = info.message;
			return res.redirect('/signup');
		}
		req.logIn(user, function(err) {
		  if (err) {
			req.session.message = "Error";
			return next(err);
		  }

		  // set the message
		  req.session.message = "Logged in successfully!";
		  return res.redirect('/');
		});
	})(req, res, next);
};
