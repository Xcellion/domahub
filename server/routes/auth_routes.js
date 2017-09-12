var bodyParser = require('body-parser')
var jsonParser = bodyParser.json()
var urlencodedParser = bodyParser.urlencoded({ extended: false })

module.exports = function(app, auth){
  app.get('/login', auth.checkLoggedIn);
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
  ]);

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
    "/login"
  ], [
    urlencodedParser,
    auth.isNotLoggedIn,
    function(req, res, next){
      var path_name = req.path.slice(1, req.path.length) + "Post";
      auth[path_name](req, res, next);
    }
  ]);

  app.post("/forgot", [
    urlencodedParser,
    auth.isNotLoggedIn,
    checkAccountExists,
    auth.forgotPost
  ])

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


//function to check if account exists on domahub
function checkAccountExists(req, res, next){
  console.log("F: Checking if account exists...");

  var email = req.body["email"];

  Account.checkAccountEmail(email, function(result){
    if (!result.info.length || result.state == "error"){
      error.handler(req, res, "No account exists with that email!", "json");
    }
    else {
      next();
    }
  });
}
