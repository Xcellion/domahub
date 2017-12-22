//<editor-fold>-------------------------------DOMA LIB FUNCTIONS-------------------------------

var account_model = require('../models/account_model.js');

var stripe_functions = require('./stripe_functions.js');

var passport = require('../lib/passport.js').passport;
var error = require('../lib/error.js');
var mailer = require('../lib/mailer.js');
var Descriptions = require("../lib/descriptions.js");

//</editor-fold>

//<editor-fold>-------------------------------VARIABLES-------------------------------

var bcrypt = require('bcrypt-nodejs');
var crypto = require("crypto");
var validator = require("validator");
var request = require('request');

var path = require("path");
var moment = require("moment");

var monkey_api_key = "8255be227b33934b7822c777f2cbb11e-us15"
var monkey_url = "https://us15.api.mailchimp.com/3.0/lists/9bcbd932cd/members"

//</editor-fold>

//<editor-fold>------------------------------------------DEMO USER OBJECT---------------------------------------

//user object for domahub demo
var demo_domahub_user = {
  id : false,
  type : 2,
  username : "DomaHubDemo",
  email : "general@domahub.com",
  paypal_email : "general@domahub.com",
  stripe_account_id : "demo",
  stripe_account : {
    addressline1 : "555 Domain Street",
    addressline2 : null,
    birthday_day : 1,
    birthday_month : 1,
    birthday_year : 1970,
    charges_enabled : true,
    city : "Domain City",
    country : "US",
    first_name : "DomaHub",
    last_name : "Demo",
    postal_code : "11111",
    state : "CA",
    transfers_enabled : true,
  },
  stripe_customer_id : "demo",
  stripe_customer : {
    brand : "Visa",
    charges : [],
    last4 : "1234",
    upcoming_invoice : {
      amount_due : 500,
      date : moment().endOf("month").valueOf()
    }
  },
  stripe_subscription_id : "demo",
  stripe_subscription : {
    cancel_at_period_end : false,
    created : moment().valueOf(),
    current_period_end : moment().endOf("month").valueOf()
  },
  stripe_bank : {
    bank_country : "US",
    bank_name : "DomaHub Demo Bank",
    currency : "USD",
    last4 : "1234"
  },
  transactions : {
    total : 5,
    stripe_transactions : [
      {
        amount : 2500000,
        amount_refunded : 0,
        stripe_fees : "72530",
        doma_fees : "0",
        available_on : moment().valueOf(),
        created : moment().subtract(1, "month").valueOf(),
        currency : "usd",
        domain_name : "mysolddomain.com",
      },
      {
        amount : 25000,
        amount_refunded : 0,
        stripe_fees : "755",
        doma_fees : "0",
        available_on : moment().valueOf(),
        created : moment().subtract(1, "month").valueOf(),
        currency : "usd",
        domain_name : "mycooldomain.com",
        rental_id : "demorental1",
        renter_name : "Guest",
      }
    ]
  },
  listings : [
    {
      id : "demo1",
      domain_name : "cooldomains.com",
      status : 1,
      verified : 1,
      min_price : 10000,
      buy_price : 25000,
      date_created : moment().add(6, "day").subtract(1, "year").valueOf(),
      date_expire : moment().add(6, "day").valueOf(),
      categories : "hightraffic industry other startup",
      description : Descriptions.random(),
      registrar_cost : 12.00,
      registrar_name : "GoDaddy, LLC",
      rentable : 1,
      offers_count : 1,
      price_type : "month",
      price_rate : 200,
      paths : "",
      offers : [
        {
          accepted : null,
          bin : null,
          deadline : null,
          domain_name : "mycooldomains.com",
          email : "dave@buyer.com",
          id : false,
          message : "Hey, this is an amazing domain. I'm interested in purchasing it. Let's talk.",
          name : "Dave Johnson",
          offer : 10000,
          phone : "+1 111-222-3333",
          response : null,
          timestamp : moment().valueOf(),
          user_ip : null
        }
      ]
    },
    {
      id : "demo2",
      domain_name : "mycooldomain.com",
      status : 1,
      verified : 1,
      min_price : 3000,
      buy_price : 5000,
      rented : 1,
      date_created : moment().add(1, "month").subtract(1, "year").valueOf(),
      date_expire : moment().add(1, "month").valueOf(),
      categories : "industry other startup",
      description : Descriptions.random(),
      registrar_cost : 12.00,
      registrar_name : "GoDaddy, LLC",
      rentable : 1,
      offers_count : 0,
      price_type : "month",
      price_rate : 250,
      paths : "",
      offers : [
        {
          accepted : 0,
          bin : null,
          deadline : null,
          domain_name : "mycooldomains.com",
          email : "suspicious@dude.com",
          id : false,
          message : "Hey, let me buy this domain please.",
          name : "Suspicious Buyer",
          offer : 3000,
          phone : "+1 222-222-2222",
          response : null,
          timestamp : moment().subtract(1, "month").valueOf(),
          user_ip : null
        }
      ]
    },
    {
      id : "demo3",
      domain_name : "abc.xyz",
      status : 1,
      verified : 1,
      min_price : 0,
      buy_price : 0,
      date_created : moment().valueOf(),
      date_expire : moment().add(1, "year").valueOf(),
      categories : "brandable business career industry keywords other promotion startup technology",
      description : Descriptions.random(),
      registrar_cost : 12.00,
      registrar_name : "GoDaddy, LLC",
      rentable : 1,
      offers_count : 3,
      price_type : "month",
      price_rate : 5000,
      paths : "",
      offers : [
        {
          accepted : 0,
          bin : null,
          deadline : null,
          domain_name : "abc.xyz",
          email : "sarah@domainers.com",
          id : false,
          message : "OMG this is an amazing deal...let's negotiate.",
          name : "Sarah C",
          offer : 5000,
          phone : "+1 111-222-3333",
          response : null,
          timestamp : moment().subtract(5, "day").valueOf(),
          user_ip : null
        },
        {
          accepted : null,
          bin : null,
          deadline : null,
          domain_name : "abc.xyz",
          email : "lisa@buyer.com",
          id : false,
          message : "Hello, please let me purchase this domain for my next venture.",
          name : "Lisa K",
          offer : 25000,
          phone : "+1 999-888-2255",
          response : null,
          timestamp : moment().subtract(3, "day").valueOf(),
          user_ip : null
        },
        {
          accepted : null,
          bin : null,
          deadline : null,
          domain_name : "abc.xyz",
          email : "john@highroller.com",
          id : false,
          message : "You won't get a better offer elsewhere. I'll match whatever you get.",
          name : "John",
          offer : 150000,
          phone : "+1 999-999-9999",
          response : null,
          timestamp : moment().valueOf(),
          user_ip : null
        }
      ]
    },
    {
      id : "demo4",
      domain_name : "goingon.holiday",
      status : 1,
      verified : 1,
      min_price : 0,
      buy_price : 0,
      date_created : moment().add(5, "month").subtract(1, "year").valueOf(),
      date_expire : moment().add(5, "month").valueOf(),
      categories : "event hightraffic holiday kids lifestyle niche other personal promotion shopping toys travel",
      description : Descriptions.random(),
      registrar_cost : 9.99,
      registrar_name : "Namecheap, LLC",
      rentable : 0,
      offers_count : 0,
      price_type : "day",
      price_rate : 50,
      paths : "",
      offers : []
    },
    {
      id : "demo5",
      domain_name : "unverifieddomain.com",
      status : 0,
      verified : null,
      min_price : 10000,
      buy_price : 25000,
      a_records : [],
      whois : {
        "Registrar" : "GoDaddy, LLC",
        "Registrar URL" : "https://godaddy.com"
      },
      date_created : moment(),
      date_expire : moment().add(1, "year").valueOf(),
      categories : "hightraffic industry other startup",
      description : Descriptions.random(),
      registrar_cost : 9.99,
      registrar_name : "NameCheap, LLC",
      rentable : 1,
      offers_count : 0,
      price_type : "month",
      price_rate : 200,
      paths : "",
      offers : []
    },
    {
      id : "demo6",
      domain_name : "mysolddomain.com",
      status : 0,
      deposited : 1,
      transferred : 1,
      accepted : 1,
      verified : 1,
      min_price : 5000,
      buy_price : 25000,
      date_created : moment(),
      date_expire : moment().add(1, "year").valueOf(),
      categories : "hightraffic industry other startup",
      description : Descriptions.random(),
      registrar_cost : 9.99,
      registrar_name : "NameCheap, LLC",
      rentable : 1,
      offers_count : 0,
      price_type : "month",
      price_rate : 200,
      paths : "",
      offers : [
        {
          accepted : 1,
          bin : 1,
          deposited : 1,
          transferred : 1,
          deadline : moment().subtract(1, "week"),
          domain_name : "mysolddomain.com",
          email : "jack@leezak.com",
          id : false,
          message : "Great price, great domain, I'll take it.",
          name : "Jack Lee",
          offer : 25000,
          phone : "+1 123-123-1234",
          response : "Sounds great, Jack. Thanks.",
          timestamp : moment().subtract(1, "week").valueOf(),
          user_ip : null
        },
      ]
    }
  ],
}

//</editor-fold>//email variables

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

    //if no promo code or if it's the demo username
    if (!req.params.promo_code || req.params.promo_code == "domahubdemo"){
      res.redirect("/signup");
    }
    else {

      //check if code exists and is unused
      account_model.checkPromoCodeUnused(req.params.promo_code, function(result){
        if (result.state == "success" && result.info.length > 0){
          console.log("F: Promo code exists!");
          delete req.session.referer_id;
          req.session.promo_code_signup = req.params.promo_code;
          req.session.message = "Successfully applied promo code! Sign up below to get started.";
          res.redirect("/signup");
        }

        //promo code doesnt exist, maybe it's a username (AKA referral)
        else {

          //get the username ID so we can create a referral code
          account_model.getAccountIDByUsername(req.params.promo_code, function(result){
            if (result.state == "success" && result.info.length > 0){
              console.log("F: Username referral code exists!");
              delete req.session.promo_code_signup;
              req.session.referer_id = result.info[0].id;
              req.session.message = "Successfully applied promo code! Sign up below to get started.";
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
    else if (!username || username == "domahubdemo"){
      error.handler(req, res, "Please enter a valid username!");
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

  //logout demo
  logoutDemo : function(req, res, next){
    if (req.isAuthenticated() && !req.user.id){
      console.log("F: Logging out as the Domahub demo user...");
      req.logout();
    }
    next();
  },

  //login as demo user
  loginToDemo : function(req, res, next){

    //if user is authenticated, log them out first
    if (req.isAuthenticated()){
      console.log("F: Logging out existing user before DomaHub demo...");
      req.logout();
      delete req.user;
    }

    console.log("F: Attempting to log in as the DomaHub demo user...");
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');
    req.login(demo_domahub_user, function(err){
      res.redirect("/profile/dashboard");
    });
  },

  //check if account exists on domahub (for password reset)
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
        if (!req.user.id && req.method == "POST"){
          error.handler(req, res, "demo-error", "json");
        }
        else {
          req.session.touch();  //reset maxAge for session since user did something
          next();
        }
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
      console.log("F: " + req.user.username + " is logging out...");
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
    else if (referer.indexOf("create") != -1 && referer.indexOf("listings") != -1){
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
            error.log(err, "Failed to login via passport.");
            error.handler(req, res, "Something went wrong while logging in! Please refresh the page and try again!</br></br>If this continues, please <a class='is-underlined' href='/contact'>contact us</a> for assistance.");
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
            //email welcome to domahub email
            mailer.sendEJSMail(path.resolve(process.cwd(), 'server', 'views', 'email', 'welcome_domahub.ejs'), {
              username : username,
            }, {
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

      //email verify email
      mailer.sendEJSMail(path.resolve(process.cwd(), 'server', 'views', 'email', 'email_verify.ejs'), {
        username : req.user.username,
        token : req.user.token
      }, {
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

            //email forgot password
            mailer.sendEJSMail(path.resolve(process.cwd(), 'server', 'views', 'email', 'forgot_password.ejs'), {
              token : token
            }, {
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
        //email verify email
        mailer.sendEJSMail(path.resolve(process.cwd(), 'server', 'views', 'email', 'email_verify.ejs'), {
          username : username,
          token : verify_token
        }, {
          to: email,
          from: 'support@domahub.com',
          subject: "Hi, " + username + '! Please verify your email address for DomaHub!',
        }, cb);
      }
    });
  });
}

//</editor-fold>
