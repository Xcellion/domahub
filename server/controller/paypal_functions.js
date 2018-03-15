//<editor-fold>-------------------------------DOMA LIB FUNCTIONS-------------------------------

var account_model = require('../models/account_model.js');
var listing_model = require('../models/listing_model.js');

var error = require('../lib/error.js');
var mailer = require('../lib/mailer.js');

//</editor-fold>

//<editor-fold>-------------------------------VARIABLES-------------------------------

var paypal = require('paypal-rest-sdk');
paypal.configure({
  'mode': (process.env.NODE_ENV == "dev") ? "sandbox" : "live",
  'client_id': (process.env.NODE_ENV == "dev") ? "AUhTlwR2uAIPU7rdMv5GZLq_sti0j5QTz6fybkCXkEAZ1iKQXFPcolcYAoXB1IUbFFWyjLdzevkhXwI4" : "ASbhz7VDDGzJu5p3jb4z9BIWeIJymNPrTpmJ_SSQYo-7v-Ut-Sb3lqUVD55pj2Due56FNapr8boEP7Il",
  'client_secret': (process.env.NODE_ENV == "dev") ? "EIT2ZOp7hHqh4RAm2iHJGWGmcFqqiMbctL6zL3Ac-Pezk06kkGe6sO7P3HKzagzIHJ8OryGqVrqZA2TP" : "EBwuUWSultvsTFVBU-evV93dDLsZ4Qg3FCgWEPNWL83OO8M8ERRax0Qrtg9UNgD4XiBWganwcBZvWWqT"
});

var wNumb = require("wnumb");
var moneyFormat = wNumb({
  thousand: ',',
  prefix: '$',
  decimals: 2
});

//</editor-fold>

module.exports = {

  //<editor-fold>-------------------------------PAYPAL PAYMENTS-------------------------------

  //create a payment ID via paypal
  createPaymentID : function(req, res, next){
    if (req.session.new_rental_info.price != 0){
      var total_price = Math.round(req.session.new_rental_info.price * 100);    //USD in cents

      //doma fee if the account owner is basic (aka premium hasn't expired)
      var doma_fees = (req.session.listing_info.premium) ? 0 : getDomaFees(total_price);
      var paypal_fees = getPaypalFees(total_price);

      //something went wrong with the price
      if (isNaN(total_price) || isNaN(paypal_fees) || isNaN(doma_fees)){
        error.handler(req, res, "Something went wrong with the price of the rental! Please refresh the page and try again!", 'json');
      }
      else {
        console.log("SF: Creating payment via PayPal...");

        //redirect URLs for paypal cancel / return
        if (process.env.NODE_ENV == "dev"){
          var redirect_url = "http://localhost:8080/listing/" + req.session.listing_info.domain_name + "/rent";
        }
        else if (req.session.listing_info.premium){
          var redirect_url = "https://" + req.session.listing_info.domain_name + "/listing/" + req.session.listing_info.domain_name + "/rent";
        }
        else {
          var redirect_url = "https://domahub.com/listing/" + req.session.listing_info.domain_name + "/rent";
        }

        var paypal_options = {
          "intent": "sale",
          "payer": {
            "payment_method": "paypal"
          },
          "redirect_urls": {
            "return_url": redirect_url,
            "cancel_url": redirect_url
          },
          "transactions": [{
            "item_list": {
              "items": [{
                "name": "Rental for " + req.params.domain_name,
                "sku": "Rental for " + req.params.domain_name,
                "price": total_price / 100,
                "currency": "USD",
                "quantity": 1
              }]
            },
            "custom" : JSON.stringify({
              "domain_name" : req.params.domain_name,
              "renter_name" : (req.user) ? req.user.username : "Guest",
              "rental_id" : req.session.new_rental_info.rental_id,
              "doma_fees" : doma_fees,
              "paypal_fees" : paypal_fees
            }),
            "amount": {
              "currency": "USD",
              "total": total_price / 100
            },
            "description": "Rental for " + req.params.domain_name
          }]
        };

        //charge the end user and take doma fees if its a basic listing
        paypal.payment.create(paypal_options, function (err, payment) {
          if (err) {
            error.log(err, "Failed to create PayPal payment.");
            error.handler(req, res, "Something went wrong with the price of the rental! Please refresh the page and try again!", 'json');
          }
          else {
            console.log("Payment created! Customer will pay " + moneyFormat.to(total_price/100) + " with " +  moneyFormat.to(doma_fees/100) + " in Doma fees and " + moneyFormat.to(paypal_fees/100) + " in PayPal fees.");
            res.send({
              state : "success",
              payment : payment
            });
          }
        });
      }
    }
    else {
      error.handler(req, res, "Something went wrong with the price of the rental! Please refresh the page and try again!", 'json');
    }
  },

  //complete the paypal payment
  chargeMoneyRent : function(req, res, next){

  },

  //</editor-fold>

}

//<editor-fold>-------------------------------HELPERS -------------------------------

//get the req.user listings object for a specific domain
function getUserListingObj(listings, domain_name){
  for (var x = 0; x < listings.length; x++){
    if (listings[x].domain_name.toLowerCase() == domain_name.toLowerCase()){
      return listings[x];
    }
  }
}

//get the doma fees
function getDomaFees(amount){
  return Math.round(amount * 0.1);
}

//get the paypal fees
function getPaypalFees(amount){
  return Math.round(amount * 0.029) + 30;
}

//</editor-fold>
