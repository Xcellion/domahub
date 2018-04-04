//<editor-fold>-------------------------------DOMA LIB FUNCTIONS-------------------------------

var error = require('./error.js');

//</editor-fold>

//<editor-fold>-------------------------------VARIABLES-------------------------------

var account_model = require('../models/account_model.js');

var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var bcrypt = require('bcrypt-nodejs');
var crypto = require("crypto");

//</editor-fold>

module.exports = {

  //<editor-fold>-------------------------------SET UP PASSPORT-------------------------------

  passport : passport,

  //passport constructor
  init: function(app){

    //initialize app with passport
    app.use(passport.initialize());
    app.use(passport.session());

    // used to serialize the user for the session
    passport.serializeUser(function(user, done) {
      if (user){
        delete user.password;
        delete user.stripe_secret;
        delete user.stripe_public;
        done(null, user);
      }
      else {
        done(null, null);
      }
    });

    // called every subsequent request.
    passport.deserializeUser(function(user, done) {
      done(null, user);
    });

    //post to create a new account
    passport.use('local-signup', new LocalStrategy({
        usernameField: 'email',
        passReqToCallback : true // allows us to pass back the entire request to the callback
      }, function(req, email, password, done) {
        //check if account exists
        account_model.checkAccountEmail(email, function(result){
          //email exists
          if (result.state=="error" || result.info.length){
            return done(false, {message: 'A user with that email exists already!'});
          }

          else {
            //check if username exists
            account_model.checkAccountUsername(req.body.username, function(result){
              //username exists
              if (result.state=="error" || result.info.length){
                return done(false, {message: 'A user with that username exists already!'});
              }
              else {
                var account_info = {
                  email: email,
                  username: req.body.username,
                  password: bcrypt.hashSync(password, null, null),
                  onboarding_step: 1
                }
                //create the new account
                account_model.newAccount(account_info, function(result){
                  if (result.state=="error"){ done(false, { message: result.info}); }
                  else {

                    //set ID of inserted and type
                    account_info.id = result.info.insertId;
                    account_info.type = 0;

                    return done(account_info);
                  }
                });
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
      }, function(req, email, password, done) {
        account_model.getAccount(email, undefined, function(result){
          if (result.state=="error"){
            done(result.info, null);
          }

          //account doesnt exist
          else if (!result.info.length){
            return done(null, false, {message: 'No user exists with that combination of email and password!'});
          }

          else {
            bcrypt.compare(password, result.info[0].password, function(err, same){
              //error with bcrypt
              if (err) {
                error.log(err, "Password comparison failed!");
                return done(null, false, {message: 'Invalid password! Please try again.'});
              }
              else {
                //if the user is found but the password is wrong
                if (!same){
                  return done(null, false, {message: 'Invalid password! Please try again.'});
                }
                else {
                  user = result.info[0];
                  return done(null, user);
                }
              }
            })
          }
        });
      })
    );

  }

  //</editor-fold>

}
