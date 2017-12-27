//<editor-fold>-------------------------------DOMA LIB FUNCTIONS-------------------------------

var data_model = require('../models/data_model.js');
var account_model = require('../models/account_model.js');

//</editor-fold>

//<editor-fold>-------------------------------VARIABLES-------------------------------

var Q = require('q');
var qs = require('qs');

var stripe_key = (process.env.NODE_ENV == "dev") ? "sk_test_PHd0TEZT5ytlF0qCNvmgAThp" : "sk_live_Nqq1WW2x9JmScHxNbnFlORoh";
var stripe = require("stripe")(stripe_key);
var randomstring = require("randomstring");
var validator = require('validator');

//</editor-fold>

module.exports = function(app){

  //<editor-fold>-------------------------------ROUTES-------------------------------

  //analyze prod data and get key info for making business decisions
  app.get("/analyze", [
    checkAdmin,
    analyzeProdData
  ]);

  //create coupon codes
  app.get("/createcodes/:number", [
    checkAdmin,
    createCouponCodes
  ]);

  //</editor-fold>

}

//<editor-fold>-------------------------------ANALYZE PRODUCTION DATA-------------------------------

//only wonmin can create codes
function checkAdmin(req, res, next){
  console.log("F: Checking if admin...");
  if (!req.user || req.user.id != 1 || req.user.email != "won2blee@gmail.com"){
    console.log("F: Not admin! Redirecting...");
    res.redirect("/");
  }
  else {
    next();
  }
};

//analyze prod data and get key info for making business decisions
function analyzeProdData(req, res, next){
  console.log("F: Getting key production info...");
  var analyzed_data = {};
  data_model.getDemoDomains(function(result){
    analyzed_data.demo_domains = result.info;
    data_model.getUserCount(function(result){
      analyzed_data.user_count = result.info;
      data_model.getCoupons(function(result){
        analyzed_data.coupon_info = result.info;
        res.send(analyzed_data);
      });
    });
  });
};

//</editor-fold>

//<editor-fold>-------------------------------CREATE COUPON CODE-------------------------------

//create X sign up codes
function createCouponCodes(req, res, next){
  console.log("SF: Creating " + req.params.number + " coupon codes...");
  insertCoupons(createUniqueCoupons(req.params.number), req.params.number, function(codes){
    var stripe_promises = [];
    for (var x = 0 ; x < codes.length ; x++){
      var promise = (function(code){
        var deferred = Q.defer();
        stripe.coupons.create({
          id: code,
          duration: "repeating",
          percent_off: 100,
          duration_in_months: 1,
          max_redemptions : 1
        }, function(err, coupon) {
          if (err){
            deferred.reject(err);
          }
          else {
            deferred.resolve(coupon);
          }
        });
        return deferred.promise;
      })(codes[x][0]);
      stripe_promises.push(promise);
    }

    Q.allSettled(stripe_promises).then(function(results) {
      var success_codes = []
      for (var x = 0 ; x < results.length; x++){
        if (results[x].state == "fulfilled"){
          success_codes.push(results[x].value.id);
        }
      }

      //all successful!
      if (success_codes.length == parseFloat(req.params.number)){
        res.send(success_codes.join("</br>"));
      }
    });

  });
};

//create unique coupon codes
function createUniqueCoupons(number, referrer){
  var codes = [];

  if (validator.isInt(number)){
    for (var x = 0; x < number; x++){
      var random_string = randomstring.generate(10);
      codes.push([random_string, null, 1]);
    }
  }

  return codes;
}

//insert the coupon codes
function insertCoupons(codes, number, cb){
  account_model.createCouponCodes(codes, function(result){
    if (result.state == "error" && result.errcode == "ER_DUP_ENTRY"){
      console.log("Duplicate coupon!");
      insertCoupons(createUniqueCoupons(number), number);
    }
    else if (result.state != "error"){
      cb(codes);
    }
  });
}

//</editor-fold>
