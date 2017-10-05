//<editor-fold>------------------------------------------VARIABLES---------------------------------------

var account_model = require('../models/account_model.js');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt-nodejs');
var validator = require("validator");
var crypto = require("crypto");
var request = require('request');
var moment = require('moment');
var ejs = require('ejs');
var path = require("path");
var nodemailer = require('nodemailer');
var sgTransport = require('nodemailer-sendgrid-transport');
var mailOptions = {
  auth: {
    api_key: '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'
  }
}
var mailer = nodemailer.createTransport(sgTransport(mailOptions));

//</editor-fold>

module.exports = {

  //<editor-fold>------------------------------------------PASSPORT---------------------------------------

  //constructor
  init: function(db, pp, e){
    database = db;
    passport = pp;
    error = e;

    Account = new account_model(db);

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
      delete user.password;
      delete user.stripe_secret;
      delete user.stripe_public;
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
    }, function(req, email, password, done) {
      //check if account exists
      Account.checkAccountEmail(email, function(result){
        //email exists
        if (result.state=="error" || result.info.length){
          return done(false, {message: 'User with that email exists!'});
        }

        else {
          //check if username exists
          Account.checkAccountUsername(req.body.username, function(result){
            //username exists
            if (result.state=="error" || result.info.length){
              return done(false, {message: 'User with that username exists!'});
            }

            else {
              var now = new Date();
              var now_utc = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),  now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());

              var account_info = {
                email: email,
                username: req.body.username,
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

        }
      });
    }));

    //post to check login
    passport.use('local-login', new LocalStrategy({
      usernameField: 'email',
      passReqToCallback : true // allows us to pass back the entire request to the callback
    }, function(req, email, password, done) {
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
    }));
  },

  //</editor-fold>

  //<editor-fold>------------------------------------------CHECKS---------------------------------------

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

  //function to make sure user is NOT logged in
  isNotLoggedIn : function(req, res, next) {
    if (req.isAuthenticated()){
      res.redirect("/profile");    //if user is authenticated in the session redirect to main page
    }
    else {
      next();
    }
  },

  //function to check token length
  checkToken : function(req, res, next){
    if (req.params.token.length != 10 || !req.params.token){
      res.redirect('/');
    }
    else {
      next();
    }
  },

  //</editor-fold>

  //<editor-fold>------------------------------------------RENDERS---------------------------------------

  //resets message before returning it
  messageReset : messageReset,

  //log out of the session
  logout: function(req, res) {
    if (req.isAuthenticated()){
      req.logout();
      req.session.destroy();
      delete req.session;
      delete req.user;
      redirectTo = "/login";
      res.redirect(redirectTo);
    }
    else {
      res.redirect('/');
    }
  },

  //sign up for a new account
  signup: function(req, res){
    res.render("account/signup.ejs", { message: messageReset(req)});
  },

  //forgot my password
  forgot: function(req, res){
    res.render("account/page_for_pw_forgot.ejs", {message: messageReset(req)});
  },

  //function to check token for resetting password
  renderReset: function(req, res){
    res.render("account/page_for_pw_reset.ejs", {message: messageReset(req)});
  },

  //function to check token for verifying account email
  renderVerify: function(req, res){
    res.render("account/page_to_verify_email.ejs", {message: messageReset(req)});
  },

  //function to request verification
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
      emailSomeone(path.resolve(process.cwd(), 'server', 'views', 'email', 'email_verify.ejs'), {
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

  //<editor-fold>------------------------------------------POSTS---------------------------------------

  //function to sign up for a new account
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
    else if (!username || /\s/.test(username)){
      error.handler(req, res, "Please enter a username!");
    }
    //username is too long
    else if (username.length > 70){
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
      error.handler(req, res, "Please prove you're not a robot!");
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
            failureRedirect : redirectUrl, // redirect back to the signup page if there is an error
          }, function(user, info){
            if (!user && info){
              error.handler(req, res, info.message);
            }
            else {
              //if code, update
              if (req.params.code){
                Account.useSignupCode(req.params.code, {
                  account_id : user.id,
                  code : null,
                  date_accessed : new Date()
                }, function(){
                  console.log("Successfully used code!");
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

  //function to login
  loginPost: function(req, res, next){
    var referer = req.header("Referer").split("/");
    //redirect to profile unless coming from a listing
    if (referer.indexOf('rentalpreview') != -1 || referer.indexOf("profile") != -1){
      redirectTo = req.header("Referer");
    }
    else {
      redirectTo = "/profile";
    }

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
            console.log("F: Updating last accessed for account with email: " + req.body.email);
            Account.updateAccount(account_info, req.body.email, function(result){
              return res.redirect(redirectTo);
            });
          }
        });
      }
    })(req, res, next);
  },

  //function to change password
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
        Account.updateAccount(account_info, email, function(result){
          if (result.state=="error"){error.handler(req, res, result.info);}
          else {

            //use helper function to email someone
            emailSomeone(path.resolve(process.cwd(), 'server', 'views', 'email', 'forgot_password.ejs'), {
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

  //function to reset password
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
    console.log('F: Verifying account...');

    Account.getAccountByToken(token, function(result){
      if (result.state=="error"){error.handler(req, res, result.info);}
      else if (!result.info.length){
        error.handler(req, res, "Invalid token!", "json");
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
    console.log('F: Checking posted account settings...');

    new_email = req.body.new_email;
    username = req.body.username;
    password = req.body.new_password;

    //not a valid email
    if (req.body.new_email && !validator.isEmail(new_email)){
      error.handler(req, res, "Invalid email!", "json");
    }
    //username too long
    else if (req.body.username && username.length > 70){
      error.handler(req, res, "Username is too long!", "json");
    }
    //username too short
    else if (req.body.username && username.length < 3){
      error.handler(req, res, "Username is too short!", "json");
    }
    //username is invalid
    else if (req.body.username && /\s/.test(username)){
      error.handler(req, res, "Invalid name!", "json");
    }
    //password is too long
    else if (req.body.new_password && password && 70 < password.length){
      error.handler(req, res, "The new password is too long!", "json");
    }
    //password is too short
    else if (req.body.new_password && password && password.length < 6){
      error.handler(req, res, "The new password is too short!", "json");
    }
    //check the pw
    else if (req.body.new_password || req.body.username || req.body.new_email){
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
    //paypal
    else if (validator.isEmail(req.body.paypal_email)){
      next();
    }
    else {
      error.handler(req, res, "Something went wrong! Please refresh the page and try again!", "json");
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
    Account.updateAccount(account_info, email, function(result){
      if (result.state=="error"){error.handler(req, res, result.info);}
      else {
        //use helper function to email someone
        emailSomeone(path.resolve(process.cwd(), 'server', 'views', 'email', 'email_verify.ejs'), {
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

//helper function to email someone
function emailSomeone(pathEJSTemplate, EJSVariables, emailDetails, cb){
  console.log("F: Sending email!");

  //read the file and add appropriate variables
  ejs.renderFile(pathEJSTemplate, EJSVariables, null, function(err, html_str){
    if (err){
      console.log(err);
      cb("error");
    }
    else {
      //set EJS template to body of email
      emailDetails.html = html_str;

      //send email
      mailer.sendMail(emailDetails, function(err) {
        if (err){
          console.log(err);
          cb("error");
        }
        else {
          cb("success");
        }
      });
    }
  });
}

//</editor-fold>
