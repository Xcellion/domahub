//<editor-fold>-------------------------------DOMA LIB FUNCTIONS-------------------------------

var account_model = require('../models/account_model.js');

var stripe_functions = require('./stripe_functions.js');

var passport = require('../lib/passport.js').passport;
var error = require('../lib/error.js');
var mailer = require('../lib/mailer.js');

//</editor-fold>

//<editor-fold>-------------------------------VARIABLES-------------------------------

var bcrypt = require('bcrypt-nodejs');
var crypto = require("crypto");
var validator = require("validator");
var request = require('request');

var path = require("path");

var monkey_api_key = "8255be227b33934b7822c777f2cbb11e-us15"
var monkey_url = "https://us15.api.mailchimp.com/3.0/lists/9bcbd932cd/members"

//</editor-fold>

module.exports = {

  //<editor-fold>------------------------------------------GENERAL---------------------------------------

  //resets message before returning it
  messageReset : messageReset,

  //check token length (for pw reset, email verify)
  checkToken : function(req, res, next){
    if (req.params.token.length != 10 || !req.params.token){
      res.redirect('/');
    }
    else {
      //check if token is expired
      account_model.checkTokenExpired(req.params.token, function(result){
        if (result.state=="error"){error.handler(req, res, result.info);}
        else if (!result.info.length){
          error.handler(req, res, "This token has expired!");
        }
        else {
          next();
        }
      });
    }
  },

  //</editor-fold>

  //<editor-fold>------------------------------------------SIGNUP / REFERRAL---------------------------------------

  //sign up for a new account
  renderSignup: function(req, res){
    res.render("account/signup.ejs", { message: messageReset(req)});
  },

  //check promo code for referral
  checkReferralCode : function(req, res, next){
    console.log("F: Checking referral code validity...");

    if (!req.params.promo_code){
      res.redirect("/signup");
    }
    else {

      //check if code exists and is unused
      account_model.checkPromoCodeUnused(req.params.promo_code, function(result){
        if (result.state == "success" && result.info.length > 0){
          console.log("F: Promo code exists!");
          req.session.promo_code_signup = req.params.promo_code;
          req.session.message = "Promo code applied! Sign up below to get started.";
          next();
        }

        //promo code doesnt exist, maybe it's a username (AKA referral)
        else {

          //get the username ID so we can create a referral code
          account_model.getAccountIDByUsername(req.params.promo_code, function(result){
            if (result.state == "success" && result.info.length > 0){
              console.log("F: Username referral code exists!");
              req.session.referer_id = result.info[0].id;
              req.session.message = "Promo code applied! Sign up below to get started.";
            }
            res.redirect("/signup");
          });

        }
      });
    }
  },

  //sign up for a new account
  signupPost: function(req, res, next){
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;
    var recaptcha = req.body["g-recaptcha-response"];
    var verify_pw = req.body["verify-pw"];

    //not a valid email
    if (!email || !validator.isEmail(email)){
      error.handler(req, res, "Please enter an email address!");
    }
    //invalid username
    else if (!username){
      error.handler(req, res, "Please enter a username!");
    }
    //username has a space
    else if (/\s/.test(username)){
      error.handler(req, res, "Usernames cannot have a space!");
    }
    //username is too long
    else if (username.length > 50){
      error.handler(req, res, "Your username is too long!");
    }
    //username is too short
    else if (username.length < 3){
      error.handler(req, res, "Your username is too short!");
    }
    //invalid password
    else if (!password){
      error.handler(req, res, "Please enter a password!");
    }
    //password is too long
    else if (password.length > 70){
      error.handler(req, res, "Your password is too long!");
    }
    //password is too short
    else if (password.length < 3){
      error.handler(req, res, "Your password is too short!");
    }
    //passwords aren't the same
    else if (password != verify_pw){
      error.handler(req, res, "Please prove that you are not a robot!");
    }
    //recaptcha is empty
    else if (!recaptcha){
      error.handler(req, res, "Invalid captcha!");
    }
    //verify recaptcha with google
    else {
      request.post({
        url: 'https://www.google.com/recaptcha/api/siteverify',
        form: {
          secret: "6LdwpykTAAAAAEMcP-NUWJuVXMLEQx1fZLbcGfVO",
          response: recaptcha
        }
      }, function (err, response, body) {
        body = JSON.parse(body);

        //all good with google!
        if (!err && response.statusCode == 200 && body.success) {
          var redirectUrl = (req.params.code) ? "/signup/" + req.params.code : "/signup";

          passport.authenticate('local-signup', {
            failureRedirect : redirectUrl,    //redirect back to the signup page if there is an error
          }, function(user, info){
            if (!user && info){
              error.handler(req, res, info.message);
            }
            else {
              //create 1 promo code, with referer_id, and 1 duration_in_months
              if (req.session.referer_id){
                stripe_functions.createPromoCode("1", req.session.referer_id, "1", function(result){
                  account_model.updatePromoCode(result[0], { account_id : user.id }, function(result){
                    delete req.session.referer_id;
                  });
                });
              }
              //just update our database
              else if (req.session.promo_code_signup){
                account_model.updatePromoCode(req.session.promo_code_signup, { account_id : user.id }, function(result){
                  delete req.session.promo_code_signup;
                });
              }

              //sign up on mailchimp
              if (process.env.NODE_ENV != "dev"){
                console.log("F: Adding to Mailchimp list...");
                request({
                  url : monkey_url,
                  method : "POST",
                  headers : {
                    "Authorization" : "Basic " + new Buffer('any:' + monkey_api_key ).toString('base64')
                  },
                  json : {
                    email_address : user.email,
                    status : "subscribed",
                    merge_fields : {
                      "USERNAME" : user.username
                    }
                  }
                }, function(err, response, body){
                  if (err || body.errors || body.status == 400){
                    //send email to notify
                    console.log("F: Failed to add to Mailchimp list! Notifying...");
                    mailer.sendBasicMail({
                      to: "general@domahub.com",
                      from: 'general@domahub.com',
                      subject: "New user signed up for DomaHub! Failed monkey insert!",
                      html: "Username - " + user.username + "<br />Email - " + user.email + "<br />Error - " + err + "<br />Body - " + body
                    });
                  }
                  else {
                    //send email to notify
                    console.log("F: Successfully added to Mailchimp list! Notifying...");
                    mailer.sendBasicMail({
                      to: "general@domahub.com",
                      from: 'general@domahub.com',
                      subject: "New user signed up for DomaHub!",
                      html: "Username - " + user.username + "<br />Email - " + user.email + "<br />"
                    });
                  }
                });
              }

              generateVerify(req, res, email, username, function(state){
                req.session.message = "Success! Please check your email for further instructions!";
                res.redirect("/login");
              });
            }
          })(req, res, next);
        }
        else {
          error.handler(req, res, "Invalid captcha!");
        }
      })
    }
  },

  //</editor-fold>

  //<editor-fold>------------------------------------------LOGIN / LOGOUT---------------------------------------

  //check if account exists on domahub
  checkAccountExists : function(req, res, next){
    console.log("F: Checking if account exists...");

    account_model.checkAccountEmail(req.body["email"], function(result){
      if (!result.info.length || result.state == "error"){
        error.handler(req, res, "No account exists with that email!", "json");
      }
      else {
        next();
      }
    });
  },

  //make sure user is logged in before doing anything
  checkLoggedIn : function(req, res, next) {
    console.log("F: Checking if authenticated...");

    //if user is authenticated in the session, carry on
    if (req.isAuthenticated()){
      res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      res.header('Expires', '-1');
      res.header('Pragma', 'no-cache');

      //no verified email, make them verify
      if (req.user.type == 0){
        res.render("account/page_for_not_verified_email.ejs", {message: messageReset(req)});
      }
      else {
        req.session.touch();  //reset maxAge for session since user did something
        next();
      }
    }
    else {
      if (req.method == "POST"){
        error.handler(req, res, "Your login session has expired! Please refresh the page and log back in.", "json");
      }
      else {
        res.render("account/login.ejs", {
          user: false,
          message: messageReset(req)
        });
      }
    }
  },

  //make sure user is NOT logged in
  isNotLoggedIn : function(req, res, next) {
    if (req.isAuthenticated()){
      res.redirect("/profile");    //if user is authenticated in the session redirect to main page
    }
    else {
      next();
    }
  },

  //log out of the session
  logout: function(req, res) {
    if (req.isAuthenticated()){
      req.logout();
      req.session.destroy();
      delete req.session;
      delete req.user;
    }
    res.redirect("/login");
  },

  //login
  loginPost: function(req, res, next){
    var referer = req.header("Referer").split("/");
    var redirectTo = "";
    //redirect to profile unless coming from a listing (or listings create)
    if (referer.indexOf('rentalpreview') != -1 || referer.indexOf("profile") != -1){
      redirectTo = req.header("Referer");
    }
    else if (referer.indexOf("upgrade") != -1 || referer.indexOf("premium") != -1){
      redirectTo = "/profile/settings#premium";
    }
    else if (referer.indexOf("create") != -1 && referer.indexOf("listings") != -1 ){
      redirectTo = "/listings/create";
    }
    else {
      redirectTo = "/profile/dashboard";
    }

    passport.authenticate('local-login', function(err, user, info){
      if (!user && info){
        error.handler(req, res, info.message);
      }
      else {
        req.logIn(user, function(err) {
          if (err) {
            console.log(err);
            error.handler(req, res, "Login error!");
          }
          else {
            var now = new Date();
            var now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());

            //update account last accessed and removing any existing tokens
            console.log("F: Updating last accessed for account with email: " + req.body.email);
            account_model.updateAccount({
              date_accessed : now_utc,
              token: null,
              token_exp: null
            }, req.body.email, function(result){
              return res.redirect(redirectTo);
            });
          }
        });
      }
    })(req, res, next);
  },

  //</editor-fold>

  //<editor-fold>------------------------------------------VERIFY EMAIL---------------------------------------

  //check token for verifying account email
  renderVerify: function(req, res){
    res.render("account/page_to_verify_email.ejs", {message: messageReset(req)});
  },

  //verify account
  verifyPost: function(req, res, next){
    console.log('F: Verifying account...');

    account_model.getAccountByToken(req.params.token, function(result){
      if (result.state=="error"){error.handler(req, res, result.info);}
      else if (!result.info.length){
        error.handler(req, res, "Invalid token!", "json");
      }
      else {
        var email = result.info[0].email;
        var username = result.info[0].username;

        //update account with new type, delete token
        account_model.updateAccount({
          type: 1,
          token: null,
          token_exp: null
        }, email, function(result){
          if (result.state=="error"){error.handler(req, res, result.info);}
          else {
            //use helper function to email someone
            mailer.sendEJSMail(path.resolve(process.cwd(), 'server', 'views', 'email', 'welcome_domahub.ejs'), {
              //ESJ Variables
              username : username,
            }, {
              //email variables
              to: email,
              from: 'general@domahub.com',
              subject: "Hi, " + username + '. Welcome to DomaHub!',
            }, function(state){
              if (state == "success"){
                console.log("F: Successfully sent email!");
              }
            });

            res.send({
              state: "success"
            });
          }
        });
      }
    });
  },

  //request verification email again
  requestVerify: function(req, res){

    //not logged in
    if (!req.isAuthenticated()){
      error.handler(req, res, "Please log in!", "json");
    }

    //already verified
    else if (req.user.type == 1){
      res.redirect("/profile");
    }

    //already requested and token still good
    if (req.user.token && req.user.token_exp && (new Date().getTime() < new Date(req.user.token_exp).getTime())){
      console.log("F: Sending existing token!");

      //use helper function to email someone
      mailer.sendEJSMail(path.resolve(process.cwd(), 'server', 'views', 'email', 'email_verify.ejs'), {
        //ESJ Variables
        username : req.user.username,
        token : req.user.token
      }, {
        //email variables
        to: user.email,
        from: 'support@domahub.com',
        subject: "Hi, " + user.username + '! Please verify your email address for DomaHub!',
      }, function(state){
        req.logout();
        if (state == "success"){
          res.send({
            state: "success"
          });
        }
        else {
          res.send({
            state: "error"
          });
        }
      });
    }

    //generate new token
    else {
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
  },

  //</editor-fold>

  //<editor-fold>------------------------------------------FORGOT PASSWORD---------------------------------------

  //forgot my password
  renderForgotPW: function(req, res){
    res.render("account/page_for_pw_forgot.ejs", {message: messageReset(req)});
  },

  //change password
  forgotPost: function(req, res, next){
    email = req.body.email;
    console.log('F: Sending account password forgot email...');

    if (!validator.isEmail(email)){
      error.handler(req, res, "Invalid email!", "json");
    }
    else {

      //generate token to email to user
      crypto.randomBytes(5, function(err, buf) {
        var token = buf.toString('hex');
        var now = new Date(new Date().getTime() + 3600000);   // 1 hour buffer
        var token_exp = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());

        var account_info = {
          token : token,
          token_exp : token_exp
        };

        //update account with token and expiration
        account_model.updateAccount(account_info, email, function(result){
          if (result.state=="error"){error.handler(req, res, result.info);}
          else {

            //use helper function to email someone
            mailer.sendEJSMail(path.resolve(process.cwd(), 'server', 'views', 'email', 'forgot_password.ejs'), {
              //ESJ Variables
              token : token
            }, {
              //email variables
              to: req.body.email,
              from: 'support@domahub.com',
              subject: 'Forgot your password for domahub?',
            }, function(err) {
              res.send({
                state: "success"
              });
            });
          }
        });
      });
    }
  },

  //</editor-fold>

  //<editor-fold>------------------------------------------RESET PASSWORD---------------------------------------

  //check token for resetting password
  renderResetPW: function(req, res){
    res.render("account/page_for_pw_reset.ejs", {message: messageReset(req)});
  },

  //reset password
  resetPost: function(req, res, next){
    var token = req.params.token;
    var password = req.body.password;
    console.log('F: Resetting account password...');

    if (!password){
      error.handler(req, res, "Invalid password!", "json");
    }
    //password is too long
    else if (password.length > 70){
      error.handler(req, res, "Password is too long!", "json");
    }
    //password is too short
    else if (password.length < 3){
      error.handler(req, res, "Password is too short!", "json");
    }
    else {
      account_model.getAccountByToken(token, function(result){
        if (result.state=="error"){error.handler(req, res, result.info);}
        else if (!result.info.length){
          error.handler(req, res, "Invalid token! Please click here to reset your password again!", "json");
        }
        else {
          var email = result.info[0].email;

          //update account with new password
          var account_info = {
            password : bcrypt.hashSync(password, null, null),
            token: null,
            token_exp: null
          };

          account_model.updateAccount(account_info, email, function(result){
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
  },

  //</editor-fold>

}

//<editor-fold>------------------------------------------HELPERS---------------------------------------

//resets message before returning it
function messageReset(req){
 if (req.session){
   var message = req.session.message;
   delete req.session.message;
   return message;
 }
}

//helper function to verify account
function generateVerify(req, res, email, username, cb){
  console.log("F: Creating a new verification link...");
  //generate token to email to user
  crypto.randomBytes(5, function(err, buf) {
    var verify_token = buf.toString('hex');
    var now = new Date(new Date().getTime() + 3600000);   // 1 hour buffer
    var verify_exp = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());

    var account_info = {
      token : verify_token,
      token_exp : verify_exp
    };

    //update account with token and expiration
    account_model.updateAccount(account_info, email, function(result){
      if (result.state=="error"){error.handler(req, res, result.info);}
      else {
        //use helper function to email someone
        mailer.sendEJSMail(path.resolve(process.cwd(), 'server', 'views', 'email', 'email_verify.ejs'), {
          //ESJ Variables
          username : username,
          token : verify_token
        }, {
          //email variables
          to: email,
          from: 'support@domahub.com',
          subject: "Hi, " + username + '! Please verify your email address for DomaHub!',
        }, cb);
      }
    });
  });
}

//</editor-fold>
