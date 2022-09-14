//<editor-fold>-------------------------------DOMA LIB FUNCTIONS-------------------------------

var general_functions = require('../controller/general_functions.js');
var auth_functions = require('../controller/auth_functions.js');
var currencies = require('../lib/currencies.js');

//</editor-fold>>

module.exports = function(app){

  //<editor-fold>-------------------------------SIGNUP / REFERRAL-------------------------------

  //signup normal (no referral)
  app.get('/signup', [
    function(req, res){
      res.redirect("/");
    }
    // auth_functions.isNotLoggedIn,
    // auth_functions.renderSignup
  ]);

  //signup referrals
  app.get("/signup/:promo_code", [
    function(req, res){
      res.redirect("/");
    }
    // auth_functions.isNotLoggedIn,
    // auth_functions.checkReferralCode
  ]);

  //post for a new signup
  app.post("/signup", [
    general_functions.urlencodedParser,
    auth_functions.isNotLoggedIn,
    auth_functions.signupPost
  ]);

  //</editor-fold>

  //<editor-fold>-------------------------------LOGIN / LOGOUT-------------------------------

  //login to demo user
  app.get("/demo", [
    auth_functions.loginToDemo
  ]);

  //render login page
  app.get('/login', [
    function(req, res){
      res.redirect("/");
    }
    // auth_functions.logoutDemo,
    // auth_functions.checkLoggedIn,
    // function(req, res){
    //   res.redirect("/profile/dashboard");
    // }
  ]);

  //logout
  app.get('/logout', auth_functions.logout);

  //login post
  app.post("/login", [
    general_functions.urlencodedParser,
    auth_functions.isNotLoggedIn,
    currencies.checkExchangeRates,
    auth_functions.loginPost
  ]);

  //</editor-fold>

  //<editor-fold>-------------------------------VERIFY EMAIL-------------------------------

  //verify email
  app.get("/verify/:token", [
    auth_functions.checkToken,
    auth_functions.renderVerify
  ]);

  //to resend verification email
  app.post("/verify", [
    general_functions.urlencodedParser,
    auth_functions.requestVerify
  ]);

  //to verify email
  app.post("/verify/:token", [
    general_functions.urlencodedParser,
    auth_functions.checkToken,
    auth_functions.verifyPost
  ]);

  //</editor-fold>

  //<editor-fold>-------------------------------FORGOT PASSWORD-------------------------------

  //render forgot PW page
  app.get('/forgot', [
    auth_functions.isNotLoggedIn,
    auth_functions.renderForgotPW
  ]);

  //send forgot password email
  app.post("/forgot", [
    general_functions.urlencodedParser,
    auth_functions.isNotLoggedIn,
    auth_functions.checkAccountExists,
    auth_functions.forgotPost
  ]);

  //</editor-fold>

  //<editor-fold>-------------------------------RESET PASSWORD-------------------------------

  //to render reset pw page
  app.get("/reset/:token", [
    auth_functions.isNotLoggedIn,
    auth_functions.checkToken,
    auth_functions.renderResetPW
  ]);

  //to reset password
  app.post("/reset/:token", [
    general_functions.urlencodedParser,
    auth_functions.isNotLoggedIn,
    auth_functions.checkToken,
    auth_functions.resetPost
  ]);

  //</editor-fold>

}
