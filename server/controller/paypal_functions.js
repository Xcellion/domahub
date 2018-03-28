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

var Q = require('q');

var wNumb = require("wnumb");
var moneyFormat = wNumb({
  thousand: ',',
  prefix: '$',
  decimals: 2
});

//</editor-fold>

module.exports = {

  //<editor-fold>-------------------------------PAYMENTS (FOR RENTAL + BIN)-------------------------------

  //promise to get transaction details
  get_paypal_transaction_details : get_paypal_transaction_details,

  //create a payment ID via paypal (rental)
  createPaymentIDRent : function(req, res, next){
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
        console.log("PPF: Creating payment via PayPal...");

        //redirect URLs for paypal cancel / return
        if (process.env.NODE_ENV == "dev"){
          var redirect_url = "http://localhost:8080/listing/" + req.session.listing_info.domain_name + "/checkout/rent";
        }
        else if (req.session.listing_info.premium){
          var redirect_url = "https://" + req.session.listing_info.domain_name + "/listing/" + req.session.listing_info.domain_name + "/checkout/rent";
        }
        else {
          var redirect_url = "https://domahub.com/listing/" + req.session.listing_info.domain_name + "/checkout/rent";
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
            error.handler(req, res, "Something went wrong with your PayPal payment! Please refresh the page and try again.", "json");
          }
          else {
            console.log("PFF: Payment created! Customer will pay " + moneyFormat.to(total_price/100) + " with " +  moneyFormat.to(doma_fees/100) + " in Doma fees and " + moneyFormat.to(paypal_fees/100) + " in PayPal fees.");
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

  //complete the paypal payment (rental)
  chargeMoneyRent : function(req, res, next){
    if (req.body.payment_type == "paypal" && req.session.new_rental_info.price != 0){
      if (!req.body.paymentID || !req.body.payerID){
        error.handler(req, res, "Something went wrong with your PayPal payment! Please refresh the page and try again.", "json");
      }
      else {
        console.log("PPF: Executing payment via PayPal...");

        //execute the authorized paypal payment
        paypal.payment.execute(req.body.paymentID, {
          "payer_id": req.body.payerID,
        }, function (err, payment) {
          if (err) {
            error.log(err, "Failed to execute PayPal payment.");
            error.handler(req, res, "Something went wrong with your PayPal payment! Please refresh the page and try again.", "json");
          }
          else if (payment && payment.state == "approved"){

            //various info for keeping track of transactions on our end
            req.session.new_rental_info.rental_payment_type = "paypal";
            req.session.new_rental_info.rental_transaction_id = payment.id;
            req.session.new_rental_info.rental_cost = payment.transactions[0].amount.total * 100;
            req.session.new_rental_info.rental_doma_fees = (req.session.listing_info.premium) ? 0 : getDomaFees((payment.transactions[0].amount.total * 100));
            req.session.new_rental_info.rental_payment_fees = getPaypalFees((payment.transactions[0].amount.total * 100));

            next();
          }
          else {
            error.handler(req, res, "Something went wrong with your PayPal payment! Please refresh the page and try again.", "json");
          }
        });
      }
    }
    else {
      next();
    }
  },

  //create a payment ID via paypal (BIN)
  createPaymentIDBuy : function(req, res, next){
    if (req.session.listing_info.buy_price && req.session.listing_info.buy_price > 0){
      var total_price = Math.round(req.session.listing_info.buy_price * 100);    //USD in cents

      //doma fee if the account owner is basic (aka premium hasn't expired)
      var doma_fees = (req.session.listing_info.premium) ? 0 : getDomaFees(total_price);
      var paypal_fees = getPaypalFees(total_price);

      //something went wrong with the price
      if (isNaN(total_price) || isNaN(paypal_fees) || isNaN(doma_fees)){
        error.handler(req, res, "Something went wrong with the price of the domain! Please refresh the page and try again!", 'json');
      }
      else {
        console.log("PPF: Creating payment via PayPal...");

        //redirect URLs for paypal cancel / return
        if (process.env.NODE_ENV == "dev"){
          var redirect_url = "http://localhost:8080/listing/" + req.session.listing_info.domain_name + "/checkout/buy";
        }
        else if (req.session.listing_info.premium){
          var redirect_url = "https://" + req.session.listing_info.domain_name + "/listing/" + req.session.listing_info.domain_name + "/checkout/buy";
        }
        else {
          var redirect_url = "https://domahub.com/listing/" + req.session.listing_info.domain_name + "/checkout/buy";
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
                "name": "Purchasing " + req.params.domain_name,
                "sku": "Purchasing " + req.params.domain_name,
                "price": total_price / 100,
                "currency": "USD",
                "quantity": 1
              }]
            },
            "custom" : JSON.stringify({
              "domain_name" : req.params.domain_name,
              "owner_id" : req.session.listing_info.owner_id,
              "listing_id" : req.session.listing_info.id,
              "offer_id" : req.session.new_buying_info.offer_id,
              "buyer_name" : req.session.new_buying_info.name,
              "buyer_email" : req.session.new_buying_info.email,
              "buyer_phone" : req.session.new_buying_info.phone,
              "doma_fees" : doma_fees,
              "paypal_fees" : paypal_fees,
              "pending_transfer" : true
            }),
            "amount": {
              "currency": "USD",
              "total": total_price / 100
            },
            "description": "Purchasing " + req.params.domain_name
          }]
        };

        //charge the end user and take doma fees if its a basic listing
        paypal.payment.create(paypal_options, function (err, payment) {
          if (err) {
            error.log(err, "Failed to create PayPal payment.");
            error.handler(req, res, "Something went wrong with your PayPal payment! Please refresh the page and try again.", "json");
          }
          else {
            console.log("PFF: Payment created! Customer will pay " + moneyFormat.to(total_price/100) + " with " +  moneyFormat.to(doma_fees/100) + " in Doma fees and " + moneyFormat.to(paypal_fees/100) + " in PayPal fees.");
            res.send({
              state : "success",
              payment : payment
            });
          }
        });
      }
    }
    else {
      error.handler(req, res, "Something went wrong with the price of the domain! Please refresh the page and try again!", 'json');
    }
  },

  //complete the paypal payment (BIN)
  chargeMoneyBuy : function(req, res, next){
    if (req.body.payment_type == "paypal"){
      if (!req.body.paymentID || !req.body.payerID){
        error.handler(req, res, "Something went wrong with your PayPal payment! Please refresh the page and try again.", "json");
      }
      else {
        console.log("PPF: Executing payment via PayPal...");

        //execute the authorized paypal payment
        paypal.payment.execute(req.body.paymentID, {
          "payer_id": req.body.payerID,
        }, function (err, payment) {
          if (err) {
            error.log(err, "Failed to execute PayPal payment.");
            error.handler(req, res, "Something went wrong with your PayPal payment! Please refresh the page and try again.", "json");
          }
          else if (payment && payment.state == "approved"){

            //various info for keeping track of transactions on our end
            req.session.new_buying_info.purchase_transaction_id = payment.id;
            req.session.new_buying_info.purchase_payment_type = "paypal";
            req.session.new_buying_info.purchase_doma_fees = (req.session.listing_info.premium) ? 0 : getDomaFees((payment.transactions[0].amount.total * 100));
            req.session.new_buying_info.purchase_payment_fees = getPaypalFees((payment.transactions[0].amount.total * 100));

            next();
          }
          else {
            error.handler(req, res, "Something went wrong with your PayPal payment! Please refresh the page and try again.", "json");
          }
        });
      }
    }
    else {
      error.handler(req, res, "Something went wrong with the price of the domain! Please refresh the page and try again!", 'json');
    }
  },

  //refund a rental
  refundRental : function(req, res, next){
    if (req.session.rental_info.payment_type == "paypal"){
      console.log("SF: Refunding with PayPal...");
      paypal.sale.refund(req.body.transaction_id, {
        "amount": {
          "currency": "USD",
          "total": req.session.rental_info.total_cost / 100
        }
      }, function (err, refund) {
        if (err) {
          error.log(err, "Failed to refund via PayPal!");
          error.handler(req, res, "Something went wrong with refunding this rental. Please refresh the page and try again!", "json");
        } else {
          req.session.rental_object.db_object.status = false;
          req.session.rental_object.db_object.amount_refunded = parseFloat(req.session.rental_info.total_cost) - 30;
          next();
        }
      });
    }
    else {
      next();
    }
  },

  //</editor-fold>

  //<editor-fold>-------------------------------WITHDRAW TO BANK-------------------------------

  //withdraw money to a paypal account
  withdrawToPayPal : function(req, res, next){
    if (req.body.destination_account == "paypal"){
      var total_amount_available = req.session.withdrawal_obj.total_amount_available;
      var total_amount_available_formatted = moneyFormat.to(req.session.withdrawal_obj.total_amount_available / 100);
      console.log("PPF: Attempting to transfer " + total_amount_available_formatted + " to PayPal account - " + req.user.paypal_email + "...");

      //notify us
      mailer.sendBasicMail({
        to: "general@domahub.com",
        from: 'general@domahub.com',
        subject: "Someone tried to withdraw to PayPal!",
        html: "Username - " + req.user.username + "<br />Email - " + req.user.email + "<br />PayPal email - " + req.user.paypal_email + "<br />Amount - " + total_amount_available_formatted
      });
    }

    next();
  },

  //</editor-fold>

}

//<editor-fold>-------------------------------TRANSACTION HELPERS (PROMISES)-------------------------------

//get paypal transaction details
function get_paypal_transaction_details(transaction_id, index){
  return function(){
    return Q.Promise(function(resolve, reject, notify){
      console.log("PF: Getting PayPal transaction details...");
      paypal.payment.list({
        start_id : transaction_id,
        count : 1
      }, function (error, payment) {
        if (error) {
          reject(error);
        } else {
          resolve({
            index : index,
            payment_obj : payment,
            payment_type : "paypal"
          });
        }
      });
    });
  }
}

//</editor-fold>

//<editor-fold>-------------------------------HELPERS -------------------------------

//get the doma fees
function getDomaFees(amount){
  return Math.round(amount * 0.1);
}

//get the paypal fees
function getPaypalFees(amount){
  return Math.round(amount * 0.029) + 30;
}

//</editor-fold>
