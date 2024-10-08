//#region -------------------------------DOMA LIB FUNCTIONS-------------------------------

var account_model = require("../models/account_model.js");

var stripe_functions = require("./stripe_functions.js");
var profile_functions = require("./profile_functions.js");

var passport = require("../lib/passport.js").passport;
var error = require("../lib/error.js");
var mailer = require("../lib/mailer.js");
var Descriptions = require("../lib/descriptions.js");

//#endregion

//#region -------------------------------VARIABLES-------------------------------

var bcrypt = require("bcrypt-nodejs");
var crypto = require("crypto");
var validator = require("validator");
var request = require("request");

var path = require("path");
var moment = require("moment");

var monkey_api_key = "8255be227b33934b7822c777f2cbb11e-us15";
var monkey_url = "https://us15.api.mailchimp.com/3.0/lists/9bcbd932cd/members";

//#endregion

//#region -------------------------------DEMO USER OBJECT-------------------------------

//user object for domahub demo
var demo_domahub_user = {
  id: false,
  type: 2,
  username: "DomaHubDemo",
  email: "general@domahub.com",
  paypal_email: "general@domahub.com",
  stripe_account_id: "demo",
  default_currency: "usd",
  stripe_account: {
    addressline1: "555 Domain Street",
    addressline2: null,
    birthday_day: 1,
    birthday_month: 1,
    birthday_year: 1970,
    charges_enabled: true,
    city: "Domain City",
    country: "US",
    first_name: "DomaHub",
    last_name: "Demo",
    postal_code: "11111",
    state: "CA",
    transfers_enabled: true,
  },
  stripe_customer_id: "demo",
  stripe_customer: {
    brand: "Visa",
    charges: [],
    last4: "1234",
    upcoming_invoice: {
      amount_due: 500,
      date: moment().endOf("month").valueOf(),
    },
  },
  stripe_subscription_id: "demo",
  stripe_subscription: {
    cancel_at_period_end: false,
    created: moment().valueOf(),
    current_period_end: moment().endOf("month").valueOf(),
  },
  stripe_bank: {
    bank_country: "US",
    bank_name: "DomaHub Demo Bank",
    currency: "USD",
    last4: "1234",
  },
  transactions_remote: true, //already got remote transactions
  transactions: [
    {
      transaction_type: "expense",
      id: 1,
      domain_name: "cooldomains.com",
      available: 0,
      date_created: moment().add(6, "day").subtract(1, "year").valueOf(),
      doma_fees: 0,
      listing_id: "demo1",
      payment_fees: 0,
      transaction_cost: 30000,
      transaction_cost_currency: "usd",
      transaction_details: "One time marketing fee",
    },
    {
      transaction_type: "expense",
      id: 2,
      domain_name: "mycooldomain.com",
      available: 0,
      date_created: moment().add(6, "day").subtract(1, "year").valueOf(),
      doma_fees: 0,
      listing_id: "demo2",
      payment_fees: 0,
      transaction_cost: 1500,
      transaction_cost_currency: "usd",
      transaction_details: "One time transaction fee",
    },
    {
      transaction_type: "sale",
      id: 3,
      domain_name: "mysolddomain.com",
      available: 0,
      date_created: moment(),
      doma_fees: 0,
      listing_id: "demo6",
      payment_fees: 14530,
      payment_type: "stripe",
      remote_received: true,
      transaction_id: "testeroo",
      transaction_cost: 50000,
      transaction_cost_currency: "usd",
      transaction_details: "One time marketing fee",
    },
    {
      transaction_type: "rental",
      id: 4,
      domain_name: "mycooldomain.com",
      available: 0,
      date_created: moment().subtract(1, "month").valueOf(),
      doma_fees: 0,
      listing_id: "demo2",
      payment_fees: 755,
      payment_type: "paypal",
      remote_received: true,
      transaction_id: "testeroo",
      transaction_cost: 25000,
      transaction_cost_currency: "usd",
    },
    {
      transaction_type: "rental",
      id: 5,
      domain_name: "mycooldomain.com",
      available: 0,
      date_created: moment().subtract(2, "month").valueOf(),
      doma_fees: 0,
      listing_id: "demo2",
      payment_fees: 755,
      payment_type: "paypal",
      remote_received: true,
      transaction_id: "testeroo",
      transaction_cost: 2500,
      transaction_cost_currency: "usd",
    },
    {
      transaction_type: "rental",
      id: 6,
      domain_name: "mycooldomain.com",
      available: 0,
      date_created: moment().subtract(3, "month").valueOf(),
      doma_fees: 0,
      listing_id: "demo2",
      payment_fees: 755,
      payment_type: "paypal",
      remote_received: true,
      transaction_id: "testeroo",
      transaction_cost: 220,
      transaction_cost_currency: "usd",
    },
  ],
  listings: [
    {
      id: "demo1",
      domain_name: "cooldomains.com",
      status: 1,
      verified: 1,
      min_price: 1000000,
      buy_price: 2500000,
      date_created: moment().add(6, "day").subtract(1, "year").valueOf(),
      date_expire: moment().add(6, "day").valueOf(),
      date_registered: moment().subtract(5, "month").valueOf(),
      default_currency: "usd",
      categories: "hightraffic industry other startup",
      description: Descriptions.random(),
      registrar_cost: 1499,
      registrar_cost_currency: "usd",
      registrar_name: "GoDaddy, LLC",
      rentable: 1,
      offers_count: 1,
      price_type: "month",
      price_rate: 20000,
      paths: "",
      primary_color: "#B35A00",
      secondary_color: "#007866",
      tertiary_color: "#D9D9D9",
      font_color: "#FFFFFF",
      background_color: "#FFFFFF",
      footer_background_color: "#1B2733",
      footer_color: "#F1F1F1",
      background_image:
        "https://images.unsplash.com/photo-1504890231393-71b0d15a05f4?dpr=1&auto=format&fit=crop&w=1500&h=1000&q=20",
      offers: [
        {
          accepted: null,
          bin: null,
          deadline: null,
          domain_name: "mycooldomains.com",
          email: "dave@buyer.com",
          id: false,
          message:
            "Hey, this is an amazing domain. I'm interested in purchasing it. Let's talk.",
          name: "Dave Johnson",
          offer: 1000000,
          offer_currency: "usd",
          phone: "+1 111-222-3333",
          response: null,
          timestamp: moment().valueOf(),
          user_ip: null,
        },
      ],
    },
    {
      id: "demo2",
      domain_name: "mycooldomain.com",
      status: 1,
      verified: 1,
      min_price: 300000,
      buy_price: 500000,
      rented: 1,
      date_created: moment().add(1, "month").subtract(1, "year").valueOf(),
      date_expire: moment().add(1, "month").valueOf(),
      date_registered: moment().subtract(4, "day").valueOf(),
      default_currency: "usd",
      categories: "industry other startup",
      description: Descriptions.random(),
      registrar_cost: 1200,
      registrar_cost_currency: "usd",
      rentable: 1,
      offers_count: 0,
      price_type: "month",
      price_rate: 25000,
      paths: "",
      primary_color: "#E8CF61",
      secondary_color: "#FF6600",
      tertiary_color: "#898989",
      font_color: "#FFFFFF",
      background_color: "#222222",
      footer_background_color: "#1B2733",
      footer_color: "#F1F1F1",
      offers: [
        {
          accepted: 0,
          bin: null,
          deadline: null,
          domain_name: "mycooldomains.com",
          email: "suspicious@dude.com",
          id: false,
          message: "Hey, let me buy this domain please.",
          name: "Suspicious Buyer",
          offer: 300000,
          offer_currency: "usd",
          phone: "+1 222-222-2222",
          response: null,
          timestamp: moment().subtract(1, "month").valueOf(),
          user_ip: null,
        },
      ],
    },
    {
      id: "demo3",
      domain_name: "abc.xyz",
      status: 1,
      verified: 1,
      min_price: 0,
      buy_price: 0,
      date_created: moment().valueOf(),
      date_expire: moment().add(1, "year").valueOf(),
      date_registered: moment().subtract(2, "year").valueOf(),
      default_currency: "usd",
      categories:
        "brandable business career industry keywords other promotion startup technology",
      description: Descriptions.random(),
      registrar_cost: 1200,
      registrar_cost_currency: "usd",
      registrar_name: "GoDaddy, LLC",
      rentable: 1,
      offers_count: 3,
      price_type: "month",
      price_rate: 500000,
      primary_color: "#222222",
      secondary_color: "#878787",
      tertiary_color: "#0645AD",
      font_color: "#222222",
      background_color: "#FFFFFF",
      paths: "",
      footer_background_color: "#F1F1F1",
      footer_color: "#1B2733",
      offers: [
        {
          accepted: 0,
          bin: null,
          deadline: null,
          domain_name: "abc.xyz",
          email: "sarah@domainers.com",
          id: false,
          message: "OMG this is an amazing deal...let's negotiate.",
          name: "Sarah C",
          offer: 500000,
          offer_currency: "usd",
          phone: "+1 111-222-3333",
          response: null,
          timestamp: moment().subtract(5, "day").valueOf(),
          user_ip: null,
        },
        {
          accepted: null,
          bin: null,
          deadline: null,
          domain_name: "abc.xyz",
          email: "lisa@buyer.com",
          id: false,
          message:
            "Hello, please let me purchase this domain for my next venture.",
          name: "Lisa K",
          offer: 2500000,
          offer_currency: "usd",
          phone: "+1 999-888-2255",
          response: null,
          timestamp: moment().subtract(3, "day").valueOf(),
          user_ip: null,
        },
        {
          accepted: null,
          bin: null,
          deadline: null,
          domain_name: "abc.xyz",
          email: "john@highroller.com",
          id: false,
          message:
            "You won't get a better offer elsewhere. I'll match whatever you get.",
          name: "John",
          offer: 15000000,
          offer_currency: "usd",
          phone: "+1 999-999-9999",
          response: null,
          timestamp: moment().valueOf(),
          user_ip: null,
        },
      ],
    },
    {
      id: "demo4",
      domain_name: "goingon.holiday",
      status: 1,
      verified: 1,
      min_price: 0,
      buy_price: 0,
      date_created: moment().add(5, "month").subtract(1, "year").valueOf(),
      date_expire: moment().add(5, "month").valueOf(),
      date_registered: moment().subtract(6, "week").valueOf(),
      default_currency: "usd",
      categories:
        "event hightraffic holiday kids lifestyle niche other personal promotion shopping toys travel",
      description: Descriptions.random(),
      registrar_cost: 1200,
      registrar_cost_currency: "usd",
      registrar_name: "NameSilo",
      rentable: 0,
      offers_count: 0,
      price_type: "day",
      price_rate: 5000,
      paths: "",
      primary_color: "#3CBC8D",
      secondary_color: "#FF5722",
      tertiary_color: "#777777",
      font_color: "#1B2733",
      background_color: "#FFFFFF",
      footer_background_color: "#f1f1f1",
      footer_color: "#1B2733",
      offers: [],
    },
    {
      id: "demo5",
      domain_name: "unverifieddomain.com",
      status: 0,
      verified: null,
      min_price: 0,
      buy_price: 0,
      a_records: [],
      whois: {
        Registrar: "GoDaddy, LLC",
        "Registrar URL": "https://godaddy.com",
      },
      date_created: moment(),
      date_expire: moment().add(1, "year").valueOf(),
      date_registered: moment().subtract(2, "month").valueOf(),
      default_currency: "usd",
      categories: "hightraffic industry other startup",
      description: Descriptions.random(),
      registrar_cost: 1399,
      registrar_cost_currency: "usd",
      registrar_name: "NameCheap, LLC",
      rentable: 1,
      offers_count: 0,
      price_type: "month",
      price_rate: 20000,
      paths: "",
      primary_color: "#3CBC8D",
      secondary_color: "#FF5722",
      tertiary_color: "#777777",
      font_color: "#1B2733",
      background_color: "#FFFFFF",
      footer_background_color: "#f1f1f1",
      footer_color: "#1B2733",
      offers: [],
    },
    {
      id: "demo6",
      domain_name: "mysolddomain.com",
      status: 0,
      deposited: 1,
      transferred: 1,
      accepted: 1,
      verified: 1,
      min_price: 5000,
      buy_price: 25000,
      date_created: moment(),
      date_expire: moment().add(1, "year").valueOf(),
      date_registered: moment().subtract(8, "year").valueOf(),
      default_currency: "eur",
      categories: "hightraffic industry other startup",
      description: Descriptions.random(),
      registrar_cost: 1299,
      registrar_cost_currency: "usd",
      registrar_name: "NameCheap, LLC",
      rentable: 1,
      offers_count: 0,
      price_type: "month",
      price_rate: 200,
      paths: "",
      primary_color: "#3CBC8D",
      secondary_color: "#FF5722",
      tertiary_color: "#777777",
      font_color: "#1B2733",
      background_color: "#FFFFFF",
      footer_background_color: "#f1f1f1",
      footer_color: "#1B2733",
      offers: [
        {
          accepted: 1,
          bin: 1,
          deposited: 1,
          transferred: 1,
          deadline: moment().subtract(1, "week"),
          domain_name: "mysolddomain.com",
          email: "jack@leezak.com",
          id: false,
          message: "Great price, great domain, I'll take it.",
          name: "Jack Lee",
          offer: 25000,
          offer_currency: "eur",
          phone: "+1 123-123-1234",
          response: "Sounds great, Jack. Thanks.",
          timestamp: moment().subtract(1, "week").valueOf(),
          user_ip: null,
        },
      ],
    },
  ],
};

//#endregion//email variables

module.exports = {
  //#region ------------------------------------------GENERAL---------------------------------------

  //resets message before returning it
  messageReset: messageReset,

  //check token length (for pw reset, email verify)
  checkToken: function (req, res, next) {
    if (req.params.token.length != 10 || !req.params.token) {
      res.redirect("/");
    } else {
      //check if token is expired
      account_model.checkTokenExpired(req.params.token, function (result) {
        if (result.state == "error") {
          error.handler(req, res, result.info);
        } else if (!result.info.length) {
          error.handler(req, res, "This token has expired!");
        } else {
          next();
        }
      });
    }
  },

  //#endregion

  //#region ------------------------------------------SIGNUP / REFERRAL---------------------------------------

  //sign up for a new account
  renderSignup: function (req, res) {
    res.render("account/signup.ejs", { message: messageReset(req) });
  },

  //check promo code for referral
  checkReferralCode: function (req, res, next) {
    console.log("AUF: Checking referral code validity...");

    //if no promo code or if it's the demo username
    if (!req.params.promo_code || req.params.promo_code == "domahubdemo") {
      res.redirect("/signup");
    } else {
      //check if code exists and is unused
      account_model.checkPromoCodeUnused(
        req.params.promo_code,
        function (result) {
          if (result.state == "success" && result.info.length > 0) {
            console.log("AUF: Promo code exists!");
            delete req.session.referer_id;
            req.session.promo_code_signup = req.params.promo_code;
            req.session.message =
              "Successfully applied promo code! Sign up below to get started.";
            res.redirect("/signup");
          }

          //promo code doesnt exist, maybe it's a username (AKA referral)
          else {
            //get the username ID so we can create a referral code
            account_model.getAccountIDByUsername(
              req.params.promo_code,
              function (result) {
                if (result.state == "success" && result.info.length > 0) {
                  console.log("AUF: Username referral code exists!");
                  delete req.session.promo_code_signup;
                  req.session.referer_id = result.info[0].id;
                  req.session.message =
                    "Successfully applied promo code! Sign up below to get started.";
                }
                res.redirect("/signup");
              }
            );
          }
        }
      );
    }
  },

  //sign up for a new account
  signupPost: function (req, res, next) {
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;
    var recaptcha = req.body["g-recaptcha-response"];
    var verify_pw = req.body["verify-pw"];

    //not a valid email
    if (!email || !validator.isEmail(email)) {
      error.handler(req, res, "Please enter an email address!");
    }
    //invalid username
    else if (!username || username == "domahubdemo") {
      error.handler(req, res, "Please enter a valid username!");
    }
    //username has a space
    else if (/\s/.test(username)) {
      error.handler(req, res, "Usernames cannot have a space!");
    }
    //username is too long
    else if (username.length > 50) {
      error.handler(req, res, "Your username is too long!");
    }
    //username is too short
    else if (username.length < 3) {
      error.handler(req, res, "Your username is too short!");
    }
    //invalid password
    else if (!password) {
      error.handler(req, res, "Please enter a password!");
    }
    //password is too long
    else if (password.length > 70) {
      error.handler(req, res, "Your password is too long!");
    }
    //password is too short
    else if (password.length < 3) {
      error.handler(req, res, "Your password is too short!");
    }
    //passwords aren't the same
    else if (password != verify_pw) {
      error.handler(req, res, "Please prove that you are not a robot!");
    }
    //recaptcha is empty
    else if (!recaptcha) {
      error.handler(req, res, "Invalid captcha!");
    }
    //verify recaptcha with google
    else {
      request.post(
        {
          url: "https://www.google.com/recaptcha/api/siteverify",
          form: {
            secret: "6LdwpykTAAAAAEMcP-NUWJuVXMLEQx1fZLbcGfVO",
            response: recaptcha,
          },
        },
        function (err, response, body) {
          body = JSON.parse(body);

          //all good with google!
          if (!err && response.statusCode == 200 && body.success) {
            var redirectUrl = req.params.code
              ? "/signup/" + req.params.code
              : "/signup";

            passport.authenticate(
              "local-signup",
              {
                failureRedirect: redirectUrl, //redirect back to the signup page if there is an error
              },
              function (user, info) {
                if (!user && info) {
                  error.handler(req, res, info.message);
                } else {
                  //create 1 promo code, with referer_id
                  if (req.session.referer_id) {
                    //create a local coupon for the referral
                    profile_functions.createPromoCodes(
                      1,
                      500,
                      req.session.referer_id,
                      function (codes) {
                        account_model.updatePromoCode(
                          codes[0],
                          {
                            code: null,
                            account_id: user.id,
                            date_accessed: new Date(),
                          },
                          function (result) {
                            delete req.session.referer_id;
                          }
                        );
                      }
                    );
                  }
                  //just update our database
                  else if (req.session.promo_code_signup) {
                    account_model.updatePromoCode(
                      req.session.promo_code_signup,
                      {
                        code: null,
                        account_id: user.id,
                      },
                      function (result) {
                        delete req.session.promo_code_signup;
                      }
                    );
                  }

                  //sign up on mailchimp
                  if (process.env.NODE_ENV != "dev") {
                    console.log("AUF: Adding to Mailchimp list...");
                    request(
                      {
                        url: monkey_url,
                        method: "POST",
                        headers: {
                          Authorization:
                            "Basic " +
                            new Buffer("any:" + monkey_api_key).toString(
                              "base64"
                            ),
                        },
                        json: {
                          email_address: user.email,
                          status: "subscribed",
                          merge_fields: {
                            USERNAME: user.username,
                          },
                        },
                      },
                      function (err, response, body) {
                        if (err || body.errors || body.status == 400) {
                          //send email to notify
                          console.log(
                            "AUF: Failed to add to Mailchimp list! Notifying..."
                          );
                          mailer.sendBasicMail({
                            to: "general@domahub.com",
                            from: "general@domahub.com",
                            subject:
                              "New user signed up for DomaHub! Failed monkey insert!",
                            html:
                              "Username - " +
                              user.username +
                              "<br />Email - " +
                              user.email +
                              "<br />Error - " +
                              err +
                              "<br />Body - " +
                              JSON.stringify(body) +
                              JSON.stringify(err),
                          });
                        } else {
                          //send email to notify
                          console.log(
                            "AUF: Successfully added to Mailchimp list! Notifying..."
                          );
                          mailer.sendBasicMail({
                            to: "general@domahub.com",
                            from: "general@domahub.com",
                            subject: "New user signed up for DomaHub!",
                            html:
                              "Username - " +
                              user.username +
                              "<br />Email - " +
                              user.email +
                              "<br />",
                          });
                        }
                      }
                    );
                  }

                  generateVerify(req, res, email, username, function (state) {
                    req.session.message =
                      "Success! Please check your email for further instructions!";
                    res.redirect("/login");
                  });
                }
              }
            )(req, res, next);
          } else {
            error.handler(req, res, "Invalid captcha!");
          }
        }
      );
    }
  },

  //#endregion

  //#region ------------------------------------------LOGIN / LOGOUT---------------------------------------

  //logout demo
  logoutDemo: function (req, res, next) {
    if (req.isAuthenticated() && !req.user.id) {
      console.log("AUF: Logging out as the Domahub demo user...");
      req.logout(() => {
        next();
      });
    } else {
      next();
    }
  },

  //login as demo user
  loginToDemo: function (req, res, next) {
    //if user is authenticated, log them out first
    // if (req.isAuthenticated()){
    //   console.log("AUF: Logging out existing user before DomaHub demo...");
    //   req.logout();
    //   delete req.user;
    // }

    console.log("AUF: Attempting to log in as the DomaHub demo user...");
    res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
    res.header("Expires", "-1");
    res.header("Pragma", "no-cache");
    req.login(demo_domahub_user, function (err) {
      res.redirect("/profile/dashboard");
    });
  },

  //check if account exists on domahub (for password reset)
  checkAccountExists: function (req, res, next) {
    console.log("AUF: Checking if account exists...");

    account_model.checkAccountEmail(req.body["email"], function (result) {
      if (!result.info.length || result.state == "error") {
        error.handler(req, res, "No account exists with that email!", "json");
      } else {
        next();
      }
    });
  },

  //make sure user is logged in before doing anything
  checkLoggedIn: function (req, res, next) {
    console.log("AUF: Checking if authenticated...");

    //session var for verifying email of user
    if (req.session.verify_email_user) {
      delete req.session.verify_email_user;
    }

    //if user is authenticated in the session, carry on
    if (req.isAuthenticated()) {
      res.header(
        "Cache-Control",
        "private, no-cache, no-store, must-revalidate"
      );
      res.header("Expires", "-1");
      res.header("Pragma", "no-cache");

      //no verified email, say that they should check their email
      if (req.user.type == 0) {
        req.session.message = "non-verified-email";
        req.session.verify_email_user = req.user;
        req.logout();
        res.render("account/login.ejs", {
          user: false,
          message: messageReset(req),
        });
      }
      //redirect to welcome setup if just created account (12 means finished onboarding and wants to check out tutorial)
      else if (
        req.user.onboarding_step &&
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].indexOf(
          parseFloat(req.user.onboarding_step)
        ) != -1
      ) {
        if (
          req.path.indexOf("/profile/welcome") != -1 ||
          req.header("Referer").indexOf("profile/welcome") != -1
        ) {
          next();
        } else {
          res.redirect("/profile/welcome?step=" + user.onboarding_step);
        }
      }
      //successfully logged in!
      else {
        if (!req.user.id && req.method == "POST") {
          error.handler(req, res, "demo-error", "json");
        } else {
          req.session.touch(); //reset maxAge for session since user did something
          next();
        }
      }
    } else {
      if (req.method == "POST") {
        error.handler(
          req,
          res,
          "Your login session has expired! Please refresh the page and log back in.",
          "json"
        );
      } else {
        res.render("account/login.ejs", {
          user: false,
          message: messageReset(req),
        });
      }
    }
  },

  //make sure user is NOT logged in
  isNotLoggedIn: function (req, res, next) {
    if (req.isAuthenticated()) {
      res.redirect("/profile"); //if user is authenticated in the session redirect to main page
    } else {
      next();
    }
  },

  //log out of the session
  logout: function (req, res) {
    if (req.isAuthenticated()) {
      console.log("AUF: " + req.user.username + " is logging out...");
      req.logout();
      req.session.destroy();
      delete req.session;
      delete req.user;
    }
    res.redirect("/login");
  },

  //login
  loginPost: function (req, res, next) {
    var referer = req.header("Referer").split("/");
    var redirectTo = "";
    //redirect to profile unless coming from a listing (or listings create)
    if (
      referer.indexOf("rentalpreview") != -1 ||
      referer.indexOf("profile") != -1
    ) {
      redirectTo = req.header("Referer");
    } else if (
      referer.indexOf("upgrade") != -1 ||
      referer.indexOf("premium") != -1
    ) {
      redirectTo = "/profile/settings#premium";
    } else if (
      referer.indexOf("create") != -1 &&
      referer.indexOf("listings") != -1
    ) {
      redirectTo = "/listings/create";
    } else {
      redirectTo = "/profile/dashboard";
    }

    passport.authenticate("local-login", function (err, user, info) {
      if (!user && info) {
        error.handler(req, res, info.message);
      } else {
        req.logIn(user, function (err) {
          if (err) {
            error.log(err, "Failed to login via passport.");
            error.handler(
              req,
              res,
              "Sign in has been disabled! Please <a class='is-underlined' href='/demo'>click here</a> to check out the demo."
            );
          } else {
            var now = new Date();
            var now_utc = new Date(
              now.getUTCFullYear(),
              now.getUTCMonth(),
              now.getUTCDate(),
              now.getUTCHours(),
              now.getUTCMinutes(),
              now.getUTCSeconds()
            );

            var user_db_obj = {
              date_accessed: now_utc,
            };

            //remove tokens if we're already logging in / verified email
            if (user.type > 0) {
              user_db_obj.token = null;
              user_db_obj.token_exp = null;
            }

            //remove onboarding step if they've logged out and logged in again after completing
            if (user.onboarding_step == 12) {
              user_db_obj.onboarding_step = null;
              delete req.user.onboarding_step;
            }

            //update account last accessed and removing any existing tokens
            console.log(
              "AUF: Updating last accessed for account with email: " +
                req.body.email
            );
            account_model.updateAccount(
              user_db_obj,
              req.body.email,
              function (result) {
                return res.redirect(redirectTo);
              }
            );
          }
        });
      }
    })(req, res, next);
  },

  //#endregion

  //#region ------------------------------------------VERIFY EMAIL---------------------------------------

  //check token for verifying account email
  renderVerify: function (req, res) {
    res.render("account/page_to_verify_email.ejs", {
      message: messageReset(req),
    });
  },

  //verify account
  verifyPost: function (req, res, next) {
    console.log("F: Verifying account...");

    account_model.getAccountByToken(req.params.token, function (result) {
      if (result.state == "error") {
        error.handler(req, res, result.info);
      } else if (!result.info.length) {
        error.handler(req, res, "Invalid token!", "json");
      } else {
        var email = result.info[0].email;
        var username = result.info[0].username;

        //update account with new type, delete token
        account_model.updateAccount(
          {
            type: 1,
            token: null,
            token_exp: null,
          },
          email,
          function (result) {
            if (result.state == "error") {
              error.handler(req, res, result.info);
            } else {
              //email welcome to domahub email
              mailer.sendEJSMail(
                path.resolve(
                  process.cwd(),
                  "server",
                  "views",
                  "email",
                  "welcome_domahub.ejs"
                ),
                {
                  username: username,
                },
                {
                  to: email,
                  from: "DomaHub <general@domahub.com>",
                  subject: "Hi, " + username + ". Welcome to DomaHub!",
                },
                function (state) {
                  if (state == "success") {
                    console.log("AUF: Successfully sent email!");
                  }
                }
              );

              res.send({
                state: "success",
              });
            }
          }
        );
      }
    });
  },

  //request verification email again
  requestVerify: function (req, res, next) {
    //no session var from having logged in before
    if (!req.session.verify_email_user) {
      error.handler(
        req,
        res,
        "You must be logged in to request a new email! Please refresh the page and log in to try again.",
        "json"
      );
    }
    //already requested and token still good
    else if (
      req.session.verify_email_user.token &&
      req.session.verify_email_user.token_exp &&
      new Date().getTime() <
        new Date(req.session.verify_email_user.token_exp).getTime()
    ) {
      console.log("AUF: Sending existing token!");

      //email verify email
      mailer.sendEJSMail(
        path.resolve(
          process.cwd(),
          "server",
          "views",
          "email",
          "email_verify.ejs"
        ),
        {
          username: req.session.verify_email_user.username,
          token: req.session.verify_email_user.token,
        },
        {
          to: req.session.verify_email_user.email,
          from: "DomaHub Support <support@domahub.com>",
          subject:
            "Hi, " +
            req.session.verify_email_user.username +
            "! Please verify your email address for DomaHub!",
        },
        function (state) {
          delete req.session.verify_email_user;
          if (state == "success") {
            res.send({
              state: "success",
            });
          } else {
            error.log("Failed to send new token email!");
            error.handler(req, res, "Failed to send new token email!", "json");
          }
        }
      );
    }
    //generate new token
    else {
      generateVerify(
        req,
        res,
        req.session.verify_email_user.email,
        req.session.verify_email_user.username,
        function (state) {
          delete req.session.verify_email_user;
          if (state == "success") {
            res.send({
              state: "success",
            });
          } else {
            error.log("Failed to generate new token!");
            error.handler(req, res, "Failed to generate new token!", "json");
          }
        }
      );
    }
  },

  //#endregion

  //#region ------------------------------------------FORGOT PASSWORD---------------------------------------

  //forgot my password
  renderForgotPW: function (req, res) {
    res.render("account/page_for_pw_forgot.ejs", {
      message: messageReset(req),
    });
  },

  //change password
  forgotPost: function (req, res, next) {
    email = req.body.email;
    console.log("F: Sending account password forgot email...");

    if (!validator.isEmail(email)) {
      error.handler(req, res, "Invalid email!", "json");
    } else {
      //generate token to email to user
      crypto.randomBytes(5, function (err, buf) {
        var token = buf.toString("hex");
        var now = new Date(new Date().getTime() + 3600000); // 1 hour buffer
        var token_exp = new Date(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          now.getUTCHours(),
          now.getUTCMinutes(),
          now.getUTCSeconds()
        );

        var account_info = {
          token: token,
          token_exp: token_exp,
        };

        //update account with token and expiration
        account_model.updateAccount(account_info, email, function (result) {
          if (result.state == "error") {
            error.handler(req, res, result.info);
          } else {
            //email forgot password
            mailer.sendEJSMail(
              path.resolve(
                process.cwd(),
                "server",
                "views",
                "email",
                "forgot_password.ejs"
              ),
              {
                token: token,
              },
              {
                to: req.body.email,
                from: "DomaHub Support <support@domahub.com>",
                subject: "Forgot your password for domahub?",
              },
              function (err) {
                res.send({
                  state: "success",
                });
              }
            );
          }
        });
      });
    }
  },

  //#endregion

  //#region ------------------------------------------RESET PASSWORD---------------------------------------

  //check token for resetting password
  renderResetPW: function (req, res) {
    res.render("account/page_for_pw_reset.ejs", { message: messageReset(req) });
  },

  //reset password
  resetPost: function (req, res, next) {
    var token = req.params.token;
    var password = req.body.password;
    console.log("F: Resetting account password...");

    if (!password) {
      error.handler(req, res, "Invalid password!", "json");
    }
    //password is too long
    else if (password.length > 70) {
      error.handler(req, res, "Password is too long!", "json");
    }
    //password is too short
    else if (password.length < 3) {
      error.handler(req, res, "Password is too short!", "json");
    } else {
      account_model.getAccountByToken(token, function (result) {
        if (result.state == "error") {
          error.handler(req, res, result.info);
        } else if (!result.info.length) {
          error.handler(
            req,
            res,
            "Invalid token! Please click here to reset your password again!",
            "json"
          );
        } else {
          var email = result.info[0].email;

          //update account with new password
          var account_info = {
            password: bcrypt.hashSync(password, null, null),
            token: null,
            token_exp: null,
          };

          account_model.updateAccount(account_info, email, function (result) {
            if (result.state == "error") {
              error.handler(req, res, result.info);
            } else {
              res.send({
                state: "success",
              });
            }
          });
        }
      });
    }
  },

  //#endregion
};

//#region ------------------------------------------HELPERS---------------------------------------

//resets message before returning it
function messageReset(req) {
  if (req.session) {
    var message = req.session.message;
    delete req.session.message;
    return message;
  }
}

//helper function to verify account
function generateVerify(req, res, email, username, cb) {
  console.log("AUF: Creating a new verification link...");
  //generate token to email to user
  crypto.randomBytes(5, function (err, buf) {
    var verify_token = buf.toString("hex");
    var now = new Date(new Date().getTime() + 3600000); // 1 hour buffer
    var verify_exp = new Date(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes(),
      now.getUTCSeconds()
    );

    var account_info = {
      token: verify_token,
      token_exp: verify_exp,
    };

    //update account with token and expiration
    account_model.updateAccount(account_info, email, function (result) {
      if (result.state == "error") {
        error.handler(req, res, result.info);
      } else {
        //email verify email
        mailer.sendEJSMail(
          path.resolve(
            process.cwd(),
            "server",
            "views",
            "email",
            "email_verify.ejs"
          ),
          {
            username: username,
            token: verify_token,
          },
          {
            to: email,
            from: "DomaHub Support <support@domahub.com>",
            subject:
              "Hi, " +
              username +
              "! Please verify your email address for DomaHub!",
          },
          cb
        );
      }
    });
  });
}

//#endregion
