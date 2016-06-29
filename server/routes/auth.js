var database,
	passport,
	error;

module.exports = {
	
	//constructor
	auth: function(db, pp, e){
		database = db;
		passport = pp;
		error = e;
	},
	
	//helper functions related to authentication
	isLoggedIn: isLoggedIn,
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

//function to login 
function loginPost(req, res, next){
	//redirect to referrer or main page
	redirectURL = req.header('Referer') || "/";
	passport.authenticate('local-login', function(err, user, info){
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
	passport.authenticate('local-signup', {
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

//helper function to remove last part of URL
function RemoveLastDirectoryPartOf(the_url){
    var the_arr = the_url.split('/');
    the_arr.pop();
    return( the_arr.join('/') );
}