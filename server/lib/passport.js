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
            return done(false, {message: 'User with that email exists!'});
          }

          else {
            //check if username exists
            account_model.checkAccountUsername(req.body.username, function(result){
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
                account_model.newAccount(account_info, function(result){
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
      })
    );

  }

  //</editor-fold>

}
