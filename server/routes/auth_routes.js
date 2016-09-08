module.exports = function(app, auth){
	app.get('/login', auth.isLoggedIn);
	app.get('/logout', auth.logout);

	//cant access these routes if they are logged in
	app.get([
		'/signup',
		'/forgot'
	], [
		auth.isNotLoggedIn,
		function(req, res, next){
			var path_name = req.path.slice(1, req.path.length);
			auth[path_name](req, res, next);
		}
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

	//post routes for authentication
	app.post([
		"/signup",
		"/login",
		"/forgot"
	], [
		auth.isNotLoggedIn,
		function(req, res, next){
			var path_name = req.path.slice(1, req.path.length) + "Post";
			auth[path_name](req, res, next);
		}
	])

	//to reset password
	app.post("/reset/:token", [
		auth.isNotLoggedIn,
		auth.checkToken,
		auth.resetPost
	]);

	//to resend verification email
	app.post("/verify", [
		auth.isLoggedIn,
		auth.requestVerify
	]);

	//to verify email
	app.post("/verify/:token", [
		auth.checkToken,
		auth.verifyPost
	]);
}
