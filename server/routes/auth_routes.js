var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()
var urlencodedParser = bodyParser.urlencoded({ extended: false })

module.exports = function(app, auth){
	app.get('/login', auth.checkLoggedIn);
	app.get('/logout', auth.logout);

	//cant access these routes if they are logged in
	app.get([
		// '/signup',
		'/forgot'
	], [
		auth.isNotLoggedIn,
		function(req, res, next){
			var path_name = req.path.slice(1, req.path.length);
			auth[path_name](req, res, next);
		}
	]);

	app.get("/signup/:code", [
		auth.checkCode,
		auth.signup,
		auth.signupCode
	])

	//to render reset/verify page
	app.get("/reset/:token", [
		auth.isNotLoggedIn,
		auth.checkToken,
		auth.renderReset
	]);

	app.get("/verify/:token", [
		auth.checkToken,
		auth.renderVerify
	]);

	// //to render the request verify page
	// app.get("/verify", [
	// 	auth.checkLoggedIn,
	// 	function(req, res){
	// 		res.redirect('/profile');
	// 	}
	// ]);

	//post routes for authentication
	app.post([
		"/signup",
		"/login",
		"/forgot"
	], [
		urlencodedParser,
		auth.isNotLoggedIn,
		function(req, res, next){
			var path_name = req.path.slice(1, req.path.length) + "Post";
			auth[path_name](req, res, next);
		}
	]);

	//signup with code
	app.post("/signup/:code", [
		urlencodedParser,
		auth.isNotLoggedIn,
		auth.signupPost
	]);

	//to reset password
	app.post("/reset/:token", [
		urlencodedParser,
		auth.isNotLoggedIn,
		auth.checkToken,
		auth.resetPost
	]);

	//to resend verification email
	app.post("/verify", [
		urlencodedParser,
		auth.requestVerify
	]);

	//to verify email
	app.post("/verify/:token", [
		urlencodedParser,
		auth.checkToken,
		auth.verifyPost
	]);
}
