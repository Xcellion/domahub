//#region -------------------------------DOMA LIB FUNCTIONS-------------------------------

var data_model = require('../models/data_model.js');
var account_model = require('../models/account_model.js');

var mailer = require('../lib/mailer.js');
var profile_functions = require('../controller/profile_functions.js');

//#endregion

//#region -------------------------------VARIABLES-------------------------------

var Q = require('q');
var qs = require('qs');
var fs = require('fs');
var path = require('path');
var glob = require('glob');

var stripe_key = (process.env.NODE_ENV == "dev") ? "sk_test_PHd0TEZT5ytlF0qCNvmgAThp" : "sk_live_Nqq1WW2x9JmScHxNbnFlORoh";
var stripe = require("stripe")(stripe_key);
var randomstring = require("randomstring");
var crypto = require("crypto");
var validator = require('validator');
var moment = require('moment');

//#endregion

module.exports = function(app){

  //#region -------------------------------ROUTES-------------------------------

  //render the admin dashboard page
  app.get("/admin", [
    checkAdmin,
    renderAdminDashboard
  ]);

  //get key info for making business decisions
  app.post("/admin/getdata", [
    checkAdmin,
    getData
  ]);

  //remind people with unverified emails to verify
  app.post("/admin/remindVerifyEmail", [
    checkAdmin,
    remindVerifyEmail
  ]);

  //analyze prod data
  app.get([
    "/admin/analyze/:prod_or_test",
    "/admin/analyze"
  ], [
    checkAdmin,
    analyzeData
  ]);

  //create coupon codes
  app.post("/admin/createcodes/:number", [
    checkAdmin,
    createPromoCodes
  ]);

  //#endregion

}

//#region -------------------------------ANALYZE PRODUCTION DATA-------------------------------

//only wonmin can create codes
function checkAdmin(req, res, next){
  console.log("F: Checking if admin...");
  if (process.env.NODE_ENV == "dev"){
    next();
  }
  else if (!req.user || req.user.id != 1 || req.user.email != "won2blee@gmail.com"){
    console.log("F: Not admin! Redirecting...");
    res.redirect("/");
  }
  else {
    next();
  }
};

//get key info for making business decisions
function getData(req, res, next){
  console.log("F: Gathering data...");

  var analyzed_data = {};
  data_model.getSearchedDomains(function(result){
    analyzed_data.domains_requested_in_domahub = result.info;
    data_model.getDemoDomains(function(result){
      analyzed_data.domains_viewed_in_compare = result.info;
      data_model.getVerifiedUserCount(function(result){
        analyzed_data.verified_users = result.info;
        data_model.getUnverifiedUserCount(function(result){
          analyzed_data.unverified_users = result.info;
          data_model.getConnectedRegistrars(function(result){
            analyzed_data.connected_registrars = result.info;
            data_model.getCoupons(function(result){
              analyzed_data.coupons = result.info;
              data_model.getVerifiedDomains(function(result){
                analyzed_data.verified_domains = result.info;
                data_model.getUnverifiedDomains(function(result){
                  analyzed_data.unverified_domains = result.info;
                  data_model.getContactHistory(function(result){
                    analyzed_data.offers = result.info;
                    data_model.getAvailCheckHistory(function(result){
                      analyzed_data.rental_paths_looked_up = result.info;

                      //output to JSON file
                      var path_dev_prod = (process.env.NODE_ENV == "dev") ? "test" : "prod";
                      var path_to_save = path.resolve(process.cwd(), 'other', 'analytics', path_dev_prod, moment().format("MM_DD_YYYY") + ".json");
                      fs.writeFile(path_to_save, JSON.stringify(analyzed_data), function(err){
                        console.log("F: Data saved as file!");
                        res.send("Data saved as file!");
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
};

//analyze the data
function analyzeData(req, res, next){
  console.log("F: Reading all gathered data...");
  var path_dev_prod = (req.params.prod_or_test == "prod") ? "prod" : (process.env.NODE_ENV == "dev") ? "test" : "prod";
  var path_to_save = path.resolve(process.cwd(), 'other', 'analytics', path_dev_prod);
  glob(path_to_save + "/*.json", function (er, files) {
    var analyzed_data = [];
    files.forEach(function(file){
      var split_by_slash = file.split("/");
      var data_obj = {
        date : split_by_slash[split_by_slash.length - 1].replace(".json", ""),
        data : JSON.parse(fs.readFileSync(file))
      }
      analyzed_data.push(data_obj);
    });
    res.render("./admin/admin_data_analysis.ejs", {
      analyzed_data : analyzed_data
    });
  });
};

//#endregion

//#region -------------------------------CREATE COUPON CODE-------------------------------

//create req.params.number amount of codes for $5.00 off, no referer
function createPromoCodes(req, res, next){
  profile_functions.createPromoCodes(req.params.number, 500, null, function(codes){
    res.send(codes.join("</br>"));
  });
};

//#endregion

//#region -------------------------------ADMIN DASHBOARD-------------------------------

//render the admin dashboard
function renderAdminDashboard(req, res, next){
  res.render("./admin/admin_page.ejs");
}

//#endregion

//#region -------------------------------REMIND UNVERIFIED EMAIL-------------------------------

//remind all unverified users to verify their emails
function remindVerifyEmail(req, res, next){
  var promises = [];
  account_model.getUnverifiedAccount(function(result){
    for (var x = 0 ; x < result.info.length ; x++){
      promises.push(send_remind_email_promise(result.info[x].email, result.info[x].username))
    }

    Q.allSettled(promises).then(function(results){
      res.send("Sent emails!");
    });

  });
}

function send_remind_email_promise(email, username){
  var deferred = Q.defer();

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
      //email welcome to domahub email
      mailer.sendEJSMail(path.resolve(process.cwd(), 'server', 'views', 'email', 'email_verify_remind.ejs'), {
        username : username,
        token : verify_token
      }, {
        to: email,
        from: 'DomaHub <general@domahub.com>',
        subject: "Hi, " + username + ". Finish signing up for DomaHub and start selling domains today!",
      }, function(state){
        if (state == "success"){
          console.log("F: Successfully sent email!");
          deferred.resolve();
        }
      });
    });
  });

  return deferred.promise;
}

//#endregion
