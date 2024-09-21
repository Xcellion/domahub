//#region -------------------------------DOMA LIB FUNCTIONS-------------------------------

var account_model = require("../models/account_model.js");
var listing_model = require("../models/listing_model.js");

var error = require("../lib/error.js");
var mailer = require("../lib/mailer.js");
var Currencies = require("../lib/currencies.js");

//#endregion

//#region -------------------------------VARIABLES-------------------------------

var stripe_key = process.env.NODE_ENV == "dev" ? "" : "";
var stripe = require("stripe")(stripe_key);

var Q = require("q");
var validator = require("validator");
var path = require("path");

var wNumb = require("wnumb");

//#endregion

module.exports = {
  //#region -------------------------------CUSTOMERS-------------------------------

  //get stripe customer info
  getStripeCustomer: function (req, res, next) {
    //if customer id exists in our database
    if (req.user.stripe_customer_id && !req.user.stripe_customer) {
      console.log(
        "SF: Getting existing Stripe customer information for an account..."
      );

      //check it against stripe
      stripe.customers.retrieve(
        req.user.stripe_customer_id,
        function (err, customer) {
          if (err) {
            error.log(err, "Failed to retrieve Stripe customer.");
          }
          //update our DH database to remove stripe_customer_id
          if (!customer || (customer && customer.deleted)) {
            console.log(
              "SF: Not a real Stripe customer! Updating our database appropriately..."
            );
            deleteDHStripeDetails(req, "stripe_customer_id");
          }
          //legit customer
          else {
            updateUserStripeCustomer(req.user, customer);
          }
          next();
        }
      );
    } else {
      next();
    }
  },

  //get invoices for a stripe customer
  getStripeCustomerInvoices: function (req, res, next) {
    //if we're deleting customer since it doesnt exist anymore
    if (
      req.session.new_account_info &&
      req.session.new_account_info.stripe_customer_id == null
    ) {
      next();
    }
    //if customer id and subscription id exists in our database
    else if (
      req.user.stripe_subscription_id &&
      req.user.stripe_customer_id &&
      req.user.stripe_customer &&
      typeof req.user.stripe_customer.charges == "undefined"
    ) {
      console.log(
        "SF: Getting Stripe customer invoice history for an account..."
      );

      stripe.invoices.list(
        {
          customer: req.user.stripe_customer_id,
        },
        function (err, invoices) {
          if (err) {
            error.log(err, "Failed to get customer Stripe invoices.");
          } else {
            updateUserStripeCustomerInvoices(req.user, invoices);
          }
          next();
        }
      );
    } else {
      next();
    }
  },

  //get the upcoming invoice for a stripe customer
  getStripeCustomerNextInvoice: function (req, res, next) {
    //if we're deleting customer since it doesnt exist anymore
    if (
      req.session.new_account_info &&
      req.session.new_account_info.stripe_customer_id == null
    ) {
      next();
    }
    //if customer id and subscription id exists in our database
    else if (
      req.user.stripe_subscription_id &&
      req.user.stripe_customer_id &&
      req.user.stripe_customer &&
      typeof req.user.stripe_customer.upcoming_invoice == "undefined"
    ) {
      console.log(
        "SF: Getting Stripe customer upcoming invoice for an account..."
      );

      stripe.invoices.retrieveUpcoming(
        req.user.stripe_customer_id,
        function (err, upcoming) {
          if (err && err.message.indexOf("No upcoming invoices") == -1) {
            error.log(err, "Failed to get upcoming Stripe customer invoice.");
          } else {
            updateUserStripeCustomerUpcomingInvoice(req.user, upcoming);
          }
          next();
        }
      );
    } else {
      next();
    }
  },

  //check that the stripe customer is legit and has a good payment card
  createStripeCustomer: function (req, res, next) {
    if (!req.body.stripeToken && !req.user.stripe_customer_id) {
      error.handler(
        req,
        res,
        "Something went wrong with the payment! Please refresh the page and try again!",
        "json"
      );
    } else if (req.user.stripe_customer_id) {
      //cross reference with stripe
      stripe.customers.retrieve(
        req.user.stripe_customer_id,
        function (err, customer) {
          //our db is outdated, customer doesnt exist
          if (err) {
            newStripeCustomer(req, res, next);
          } else {
            //update the customer default credit card
            if (
              req.body.stripeToken &&
              typeof req.body.stripeToken == "string"
            ) {
              console.log(
                "SF: Trying to update an existing Stripe customer default credit card..."
              );

              stripe.customers.update(
                req.user.stripe_customer_id,
                {
                  source: req.body.stripeToken,
                },
                function (err, customer) {
                  if (err) {
                    error.log(err, "Failed to update Stripe customer.");
                    error.handler(req, res, err.message, "json");
                  } else {
                    updateUserStripeCustomer(req.user, customer);
                    next();
                  }
                }
              );
            } else {
              next();
            }
          }
        }
      );
    }

    //no customer exists, create a new stripe customer
    else {
      newStripeCustomer(req, res, next);
    }
  },

  //delete existing customer CC
  deleteCustomerCard: function (req, res, next) {
    if (!req.user.stripe_customer_id) {
      error.handler(
        req,
        res,
        "Something went wrong! Please refresh the page and try again!",
        "json"
      );
    } else {
      //cross reference with stripe
      stripe.customers.retrieve(
        req.user.stripe_customer_id,
        function (err, customer) {
          if (err) {
            error.handler(
              req,
              res,
              "Something went wrong! Please refresh the page and try again!",
              "json"
            );
          } else {
            console.log("SF: Deleting Stripe customer default card...");
            stripe.customers.deleteCard(
              customer.id,
              customer.default_source,
              function (err, confirmation) {
                stripe.customers.retrieve(
                  req.user.stripe_customer_id,
                  function (err, customer) {
                    if (err) {
                      error.handler(
                        req,
                        res,
                        "Something went wrong! Please refresh the page and try again!",
                        "json"
                      );
                    } else {
                      updateUserStripeCustomer(req.user, customer);

                      //cancel subscription at period end if they have one
                      if (req.user.stripe_subscription_id) {
                        next();
                      }
                      //otherwise just send success
                      else {
                        res.json({
                          state: "success",
                          user: req.user,
                        });
                      }
                    }
                  }
                );
              }
            );
          }
        }
      );
    }
  },

  //#endregion

  //#region -------------------------------SUBSCRIPTIONS-------------------------------

  //check if stripe subscription is still valid (FOR LISTING DISPLAY PREMIUM OR NOT)
  checkStripeSubscriptionForUser: function (req, res, next) {
    var domain_name = req.session.api_domain
      ? req.session.api_domain
      : req.params.domain_name;
    var listing_info = req.session.listing_info
      ? req.session.listing_info
      : getUserListingObj(req.user.listings, domain_name);

    //if subscription id exists in our database
    if (listing_info && listing_info.stripe_subscription_id) {
      console.log(
        "SF: Checking if Stripe subscription for account is still active (user)..."
      );

      //check it against stripe
      stripe.subscriptions.retrieve(
        listing_info.stripe_subscription_id,
        function (err, subscription) {
          //get rid of stripe sub ID on the object
          if (req.session.listing_info) {
            delete req.session.listing_info.stripe_subscription_id;
          }

          //log it if it's weird
          if (
            err &&
            err.code != "resource_missing" &&
            err.code != "ECONNRESET"
          ) {
            console.log("\x1b[31m", "ERROR: " + err, "\x1b[0m");
            // error.log(err, "Something went wrong with looking up Stripe subscription active: domain - " + listing_info.domain_name + listing_info.owner_email);
          }

          //all good!
          if (!err && subscription && subscription.status == "active") {
            console.log("SF: Premium is still active!");
            listing_info.premium = true;
          } else {
            console.log("SF: Premium is NOT active!");

            //delete it from our database if it's wrong
            if (
              (err && err.code == "resource_missing") ||
              (subscription && subscription.status != "active")
            ) {
              req.session.new_account_info = {
                stripe_subscription_id: null,
              };
            }

            listing_info.premium = false;
          }
          next();
        }
      );
    } else {
      //only set it to basic if we havent already checked and premium is set
      if (typeof listing_info.premium == "undefined") {
        listing_info.premium = false;
      }
      next();
    }
  },

  //get stripe address and contact details for german law
  checkStripeAccountForContactDetails: function (req, res, next) {
    var domain_name = req.session.api_domain
      ? req.session.api_domain
      : req.params.domain_name;
    var listing_info = req.session.listing_info
      ? req.session.listing_info
      : getUserListingObj(req.user.listings, domain_name);

    //if stripe account id exists in our database
    if (listing_info && listing_info.stripe_account_id) {
      console.log(
        "SF: Checking if Stripe account is still active for contact details..."
      );

      //check it against stripe
      stripe.accounts.retrieve(
        listing_info.stripe_account_id,
        function (err, account) {
          //get rid of stripe account ID on the object
          if (req.session.listing_info) {
            delete req.session.listing_info.stripe_account_id;
          }

          //log it if it's weird
          if (
            err &&
            err.code != "resource_missing" &&
            err.code != "ECONNRESET"
          ) {
            console.log("\x1b[31m", "ERROR: " + err, "\x1b[0m");
            // error.log(err, "Something went wrong with looking up Stripe account: domain - " + listing_info.domain_name + listing_info.owner_email);
          }

          //all good!
          if (!err && account) {
            listing_info.owner_address = account.legal_entity.address;
            listing_info.owner_phone = account.support_phone;
            listing_info.owner_name =
              account.legal_entity.first_name +
              " " +
              account.legal_entity.last_name;
            listing_info.owner_business_name =
              account.legal_entity.business_name;
            listing_info.owner_business_name_override =
              account.metadata.business_name_override;
            listing_info.owner_vat_number = account.metadata.vat_number;
            listing_info.owner_court_locality = account.metadata.court_locality;
            listing_info.owner_registration_number =
              account.metadata.registration_number;
            listing_info.owner_privacy_policy_link =
              account.metadata.privacy_policy_link;
          } else {
            //delete it from our database if it's wrong
            if (err && err.code == "resource_missing") {
              req.session.new_account_info = {
                stripe_account_id: null,
              };
            }
          }
          next();
        }
      );
    } else {
      next();
    }
  },

  //check if stripe subscription is still valid (FOR LISTING OWNER TO EDIT INFO)
  checkStripeSubscriptionForOwner: function (req, res, next) {
    //if subscription id exists in our database
    if (req.user.stripe_subscription_id) {
      console.log(
        "SF: Checking if Stripe subscription for account is still active (owner)..."
      );

      //check it against stripe
      stripe.subscriptions.retrieve(
        req.user.stripe_subscription_id,
        function (err, subscription) {
          //delete it from our database if it's wrong
          if (err || !subscription) {
            console.log("SF: Premium is NOT active!");
            req.session.new_account_info = {
              stripe_subscription_id: null,
            };
          }
          next();
        }
      );
    } else {
      next();
    }
  },

  //get stripe subscription info (FOR ACCOUNT SETTINGS)
  getStripeSubscription: function (req, res, next) {
    //if subscription id exists in our database
    if (req.user.stripe_subscription_id && !req.user.stripe_subscription) {
      console.log(
        "SF: Getting Stripe subscription information for an account..."
      );
      //check it against stripe
      stripe.subscriptions.retrieve(
        req.user.stripe_subscription_id,
        function (err, subscription) {
          if (err) {
            error.log(err, "Failed to retrieve Stripe subscription.");
          }
          //update our DH database to remove stripe_subscription_id
          if (!subscription) {
            console.log(
              "SF: Not a real Stripe subscription! Updating our database appropriately..."
            );
            deleteDHStripeDetails(req, "stripe_subscription_id");
          }
          //legit subscription!
          else {
            updateUserStripeSubscription(req.user, subscription);
          }
          next();
        }
      );
    } else {
      next();
    }
  },

  //create a monthly subscription for a listing
  createStripeSubscription: function (req, res, next) {
    if (!req.body.stripeToken && !req.user.stripe_customer_id) {
      error.handler(
        req,
        res,
        "Something went wrong with the payment! Please refresh the page and try again!",
        "json"
      );
    }
    //if subscription id exists in our database
    else if (req.user.stripe_subscription_id) {
      //check it against stripe
      stripe.subscriptions.retrieve(
        req.user.stripe_subscription_id,
        function (err, subscription) {
          //our db is outdated, subscription doesnt exist
          if (err) {
            newStripeSubscription(req, res, next);
          } else {
            //subscription was cancelled, re-subscribe
            if (subscription.cancel_at_period_end) {
              console.log("SF: Renewing existing Stripe subscription...");

              stripe.subscriptions.update(
                req.user.stripe_subscription_id,
                {
                  plan: subscription.plan.id,
                  cancel_at_period_end: false,
                },
                function (err, subscription) {
                  if (err) {
                    error.log(err, "Failed to update Stripe subscription.");
                    error.handler(req, res, err.message, "json");
                  } else {
                    updateUserStripeSubscription(req.user, subscription);
                    next();
                  }
                }
              );
            }
            //subscription is still active, all gucci
            else {
              res.json({
                state: "success",
                user: req.user,
              });
            }
          }
        }
      );
    } else {
      newStripeSubscription(req, res, next);
    }
  },

  //check that stripe subscription exists
  cancelStripeSubscription: function (req, res, next) {
    //if subscription id exists in our database
    if (req.user.stripe_subscription_id) {
      console.log("SF: Cancelling an existing Stripe subscription...");

      //cancel the subscription at period end (not immediately)
      stripe.subscriptions.del(
        req.user.stripe_subscription_id,
        { at_period_end: true },
        function (err, subscription) {
          if (err) {
            error.log(err, "Failed to cancel Stripe subscription.");
            error.handler(req, res, err.message, "json");
          } else {
            //notify us if someone cancels
            mailer.sendBasicMail({
              to: "general@domahub.com",
              from: "general@domahub.com",
              subject: "Premium member cancelled! Email asking why / what's up",
              html:
                "Username - " +
                req.user.username +
                "<br />Email - " +
                req.user.email +
                "<br />",
            });

            updateUserStripeSubscription(req.user, subscription);
            res.json({
              state: "success",
              user: req.user,
            });
          }
        }
      );
    } else {
      error.handler(
        req,
        res,
        "You don't have a Premium account to cancel!",
        "json"
      );
    }
  },

  //#endregion

  //#region -------------------------------ACCOUNT-------------------------------

  //gets the stripe managed account info
  getStripeAccount: function (req, res, next) {
    if (req.user.stripe_account_id && !req.user.stripe_account) {
      console.log(
        "SF: Getting existing Stripe managed account information for an account..."
      );
      stripe.accounts.retrieve(
        req.user.stripe_account_id,
        function (err, account) {
          if (err) {
            error.log(err, "Failed to retrieve Stripe account.");
          }
          //update our DH database to remove stripe_account_id
          if (!account) {
            console.log(
              "SF: Not a real Stripe account! Updating our database appropriately..."
            );
            deleteDHStripeDetails(req, "stripe_account_id", true);
            next();
          } else {
            //get supported currencies for this country
            stripe.countrySpecs.retrieve(
              account.country,
              function (err, countrySpec) {
                updateUserStripeCurrencies(req.user, countrySpec);
                updateUserStripeAccount(req.user, account);
                updateUserStripeBank(req.user, account);
                next();
              }
            );
          }
        }
      );
    } else {
      next();
    }
  },

  //check posted info for address
  checkPayoutAddress: function (req, res, next) {
    console.log(
      "SF: Checking posted Stripe managed account address information..."
    );
    var country_codes = [
      "AU", //Australia
      "US", //United States
      "CA", //Canada
      "AT", //Austria
      "DK", //Denmark
      "BE", //Belgium
      "FI", //Finland
      "DE", //Germany
      "FR", //France
      "HK", //Hong Kong
      "IE", //Ireland
      "IT", //Italy
      "JP", //Japan
      "LU", //Luxembourg
      "NO", //Norway
      "NL", //Netherlands
      "SG", //Singapore
      "NZ", //New Zealand
      "ES", //Spain
      "PT", //Portugal
      "SE", //Sweden
      "CH", //Switzerland
      "GB", //United Kingdom
      "BR", //Brazil
      "MX", //Mexico
    ];

    if (country_codes.indexOf(req.body.country) == -1) {
      error.handler(
        req,
        res,
        "Invalid country! Please select a valid country from the dropdown menu!",
        "json"
      );
    } else if (!req.body.addressline1) {
      error.handler(
        req,
        res,
        "Invalid address! Please enter a valid address!",
        "json"
      );
    } else if (!req.body.city) {
      error.handler(
        req,
        res,
        "Invalid city! Please enter a valid city!",
        "json"
      );
    } else if (!req.body.state && req.body.country == "US") {
      error.handler(
        req,
        res,
        "Invalid state! Please enter a valid state!",
        "json"
      );
    } else if (!req.body.zip) {
      error.handler(
        req,
        res,
        "Invalid postal code! Please enter a valid postal code!",
        "json"
      );
    } else {
      next();
    }
  },

  //check posted info for personal
  checkPayoutPersonal: function (req, res, next) {
    console.log(
      "SF: Checking posted Stripe managed account personal information..."
    );
    if (!req.body.first_name) {
      error.handler(
        req,
        res,
        "Invalid first name! Please enter a valid first name!",
        "json"
      );
    } else if (!req.body.last_name) {
      error.handler(
        req,
        res,
        "Invalid last name! Please enter a valid last name!",
        "json"
      );
    } else if (
      !req.body.birthday_year ||
      !validator.isInt(req.body.birthday_year, { min: 1900 })
    ) {
      error.handler(
        req,
        res,
        "Invalid birthday year! Please select a valid year from the dropdown menu!",
        "json"
      );
    } else if (
      !req.body.birthday_month ||
      !validator.isInt(req.body.birthday_month, { min: 1, max: 12 })
    ) {
      error.handler(
        req,
        res,
        "Invalid birthday month! Please select a valid month from the dropdown menu!",
        "json"
      );
    } else if (
      !req.body.birthday_day ||
      !validator.isInt(req.body.birthday_day, { min: 1, max: 31 })
    ) {
      error.handler(
        req,
        res,
        "Invalid birthday date! Please select a valid date from the dropdown menu!",
        "json"
      );
    } else {
      next();
    }
  },

  //check posted info for bank info
  checkPayoutBank: function (req, res, next) {
    console.log(
      "SF: Checking posted Stripe managed account bank information..."
    );
    if (!req.user.stripe_account_id) {
      error.handler(
        req,
        res,
        "Please update your legal contact information first before adding a new bank!",
        "json"
      );
    } else if (!req.body.stripe_token) {
      error.handler(
        req,
        res,
        "Invalid bank information! Please refresh the page and try again!",
        "json"
      );
    } else {
      //cross reference with stripe
      stripe.accounts.retrieve(
        req.user.stripe_account_id,
        function (err, account) {
          if (err) {
            error.handler(
              req,
              res,
              "Please update your legal contact information!",
              "json"
            );
          } else {
            next();
          }
        }
      );
    }
  },

  //create a new or update an existing managed account with stripe
  createStripeAccount: function (req, res, next) {
    var legal_entity = {
      address: {
        city: req.body.city,
        country: req.body.country,
        line1: req.body.addressline1,
        line2: req.body.addressline2,
        postal_code: req.body.zip,
        state: req.body.state,
      },
      type: "individual",
      dob: {
        day: req.body.birthday_day,
        month: req.body.birthday_month,
        year: req.body.birthday_year,
      },
      first_name: req.body.first_name,
      last_name: req.body.last_name,
    };

    //optional business name
    if (req.body.business_name) {
      legal_entity.business_name = req.body.business_name;
    }

    var stripe_account_info = {
      country: req.body.country,
      email: req.user.email,
      type: "custom",
      payout_schedule: {
        interval: "manual",
      },
      tos_acceptance: {
        date: Math.floor(Date.now() / 1000),
        ip: req.connection.remoteAddress,
      },
      legal_entity: legal_entity,
      support_phone: req.body.phone_number,
      metadata: {},
    };

    //optional VAT number
    if (req.body.vat_number) {
      stripe_account_info.metadata.vat_number = req.body.vat_number;
    }

    //optional override legal entity
    stripe_account_info.metadata.business_name_override = req.body
      .business_name_override
      ? "on"
      : "off";

    //optional court locality
    if (req.body.court_locality) {
      stripe_account_info.metadata.court_locality = req.body.court_locality;
    }

    //optional registration number
    if (req.body.registration_number) {
      stripe_account_info.metadata.registration_number =
        req.body.registration_number;
    }

    //optional privacy policy link
    if (req.body.privacy_policy_link) {
      stripe_account_info.metadata.privacy_policy_link =
        req.body.privacy_policy_link;
    }

    if (req.user.stripe_account_id) {
      //cross reference with stripe
      stripe.accounts.retrieve(
        req.user.stripe_account_id,
        function (err, account) {
          //our db is outdated, account doesnt exist or if we're changing country
          if (err || account.country != req.body.country) {
            newStripeAccount(req, res, next, stripe_account_info);
          } else {
            console.log("SF: Updating existing Stripe managed account...");
            stripe.accounts.update(
              req.user.stripe_account_id,
              {
                legal_entity: legal_entity,
                support_phone: req.body.phone_number,
                metadata: {
                  vat_number: req.body.vat_number,
                  business_name_override: req.body.business_name_override
                    ? "on"
                    : "off",
                  court_locality: req.body.court_locality,
                  registration_number: req.body.registration_number,
                  privacy_policy_link: req.body.privacy_policy_link,
                },
              },
              function (err, account) {
                if (err) {
                  error.log(err, "Failed to update Stripe account.");
                  error.handler(req, res, err.message, "json");
                } else {
                  updateUserStripeAccount(req.user, account);
                  res.json({
                    state: "success",
                    user: req.user,
                  });
                }
              }
            );
          }
        }
      );
    } else {
      newStripeAccount(req, res, next, stripe_account_info);
    }
  },

  //create or update stripe managed bank account
  createStripeBank: function (req, res, next) {
    console.log(
      "SF: Updating existing Stripe managed account bank information..."
    );
    stripe.accounts.update(
      req.user.stripe_account_id,
      {
        external_account: req.body.stripe_token,
      },
      function (err, account) {
        if (err) {
          error.log(err, "Failed to update Stripe account.");
          error.handler(req, res, err.message, "json");
        } else {
          updateUserStripeBank(req.user, account);
          res.json({
            state: "success",
            user: req.user,
          });
        }
      }
    );
  },

  //#endregion

  //#region -------------------------------WITHDRAW TO BANK-------------------------------

  //withdraw money to a stripe bank
  withdrawToStripeBank: function (req, res, next) {
    if (req.body.destination_account == "bank") {
      var total_amount_available =
        req.session.withdrawal_obj.total_amount_available;
      var total_amount_available_formatted = Currencies.format(
        req.session.withdrawal_obj.total_amount_available,
        req.user.default_currency
      );
      console.log(
        "SF: Attempting to transfer " +
          total_amount_available_formatted +
          " to Stripe bank account..."
      );

      //notify us
      mailer.sendBasicMail({
        to: "general@domahub.com",
        from: "general@domahub.com",
        subject: "Someone tried to withdraw to Stripe!",
        html:
          "Username - " +
          req.user.username +
          "<br />Email - " +
          req.user.email +
          "<br />Stripe account - " +
          req.user.stripe_account_id +
          "<br />Amount - " +
          total_amount_available_formatted,
      });

      // //transfer the money to stripe connected account
      // stripe.transfers.create({
      //   amount: total_amount_available,
      //   currency: "usd",
      //   destination: req.user.stripe_account_id,
      //   transfer_group: req.user.id
      // }, function(err, transfer) {
      //   if (err){
      //     error.log(err, "Something went wrong with the Stripe account transfer!", "json");
      //     error.handler(req, res, "Something went wrong with the withdrawal! Please refresh the page and try again.", "json");
      //   }
      //   else {
      //
      //     //transfer to bank manually
      //     stripe.payouts.create({
      //       amount: total_amount_available,
      //       currency: "usd",
      //     }, {
      //       stripe_account: req.user.stripe_account_id,
      //     }).then(function(payout) {
      //       if (!payout || payout.failure_code || payout.failure_message){
      //         error.log(err, "Something went wrong with the bank payout!", "json");
      //         error.handler(req, res, "Something went wrong with the withdrawal! Please refresh the page and try again.", "json");
      //       }
      //       else {
      //         next();
      //       }
      //     });
      //   }
      // });
    }

    next();
  },

  //#endregion

  //#region -------------------------------PAYMENTS (FOR RENTAL + BIN)-------------------------------

  //promise to get transaction details
  get_stripe_transaction_details: get_stripe_transaction_details,

  //pay for a rental via stripe
  chargeMoneyRent: function (req, res, next) {
    if (
      req.body.payment_type == "stripe" &&
      req.session.new_rental_info.price != 0
    ) {
      if (!req.body.stripeToken) {
        error.handler(
          req,
          res,
          "Something went wrong with your card payment! Please refresh the page and try again.",
          "json"
        );
      } else {
        var total_price = Math.round(req.session.new_rental_info.price);

        //doma fee if the account owner is basic (aka premium hasn't expired)
        var doma_fees = req.session.listing_info.premium
          ? 0
          : getDomaFees(total_price);
        var stripe_fees = getStripeFees(total_price);

        //something went wrong with the price
        if (isNaN(total_price) || isNaN(stripe_fees) || isNaN(doma_fees)) {
          error.handler(
            req,
            res,
            "Something went wrong with the price of the rental! Please refresh the page and try again!",
            "json"
          );
        } else {
          console.log("SF: Charging money via Stripe...");

          var stripe_options = {
            amount: total_price,
            currency: req.session.new_rental_info.default_currency,
            source: req.body.stripeToken,
            description: "Rental for " + req.params.domain_name,
            transfer_group: req.session.listing_info.owner_id,
            metadata: {
              domain_name: req.params.domain_name,
              renter_name: req.user ? req.user.username : "Guest",
              rental_id: req.session.new_rental_info.rental_id,
              doma_fees: doma_fees,
              stripe_fees: stripe_fees,
            },
            expand: ["balance_transaction"],
          };

          //charge the end user and take doma fees if its a basic listing
          stripe.charges.create(stripe_options, function (err, charge) {
            if (err) {
              error.log(err, "Failed to create Stripe charge.");
              error.handler(
                req,
                res,
                "Something went wrong with your payment! Please refresh the page and try again.",
                "json"
              );
            } else {
              //various info for keeping track of transactions on our end
              req.session.new_rental_info.rental_payment_type = "stripe";
              req.session.new_rental_info.rental_transaction_id = charge.id;
              req.session.new_rental_info.rental_cost = charge.amount;
              req.session.new_rental_info.rental_doma_fees = doma_fees;
              req.session.new_rental_info.rental_payment_fees =
                charge.balance_transaction.fee;
              req.session.new_rental_info.rental_exchange_rate =
                charge.balance_transaction.exchange_rate;

              console.log(
                "SF: Payment processed! Customer paid " +
                  Currencies.format(
                    total_price,
                    req.session.new_rental_info.default_currency
                  ) +
                  " with " +
                  Currencies.format(
                    doma_fees,
                    req.session.new_rental_info.default_currency
                  ) +
                  " in Doma fees and " +
                  Currencies.format(
                    stripe_fees,
                    req.session.new_rental_info.default_currency
                  ) +
                  " in Stripe fees."
              );
              next();
            }
          });
        }
      }
    } else {
      next();
    }
  },

  //pay for a listing via stripe
  chargeMoneyBuy: function (req, res, next) {
    if (req.body.payment_type == "stripe") {
      if (!req.body.stripeToken) {
        error.handler(
          req,
          res,
          "Something went wrong with your card payment! Please refresh the page and try again.",
          "json"
        );
      } else {
        //BIN or buying actor accepting an offer
        var price_of_listing = req.session.new_buying_info.id
          ? req.session.new_buying_info.offer
          : req.session.listing_info.buy_price;
        var total_price = Math.round(price_of_listing);

        //doma fee if the account owner is basic (aka premium hasn't expired)
        var doma_fees = req.session.listing_info.premium
          ? 0
          : getDomaFees(total_price);
        var stripe_fees = getStripeFees(total_price);

        //something went wrong with the price
        if (isNaN(total_price) || isNaN(stripe_fees) || isNaN(doma_fees)) {
          error.handler(
            req,
            res,
            "Something went wrong with the payment! Please refresh the page and try again.",
            "json"
          );
        } else {
          console.log("SF: Charging money via Stripe...");

          var stripeOptions = {
            amount: total_price,
            currency: req.session.listing_info.default_currency,
            source: req.body.stripeToken,
            description: "Purchasing " + req.params.domain_name,
            transfer_group: req.session.listing_info.owner_id,
            metadata: {
              domain_name: req.params.domain_name,
              owner_id: req.session.listing_info.owner_id,
              listing_id: req.session.listing_info.id,
              offer_id: req.session.new_buying_info.offer_id,
              buyer_name: req.session.new_buying_info.name,
              buyer_email: req.session.new_buying_info.email,
              buyer_phone: req.session.new_buying_info.phone,
              doma_fees: doma_fees,
              stripe_fees: stripe_fees,
              pending_transfer: true,
            },
            expand: ["balance_transaction"],
          };

          //charge the end user, transfer to the owner, take doma fees if its a basic listing
          stripe.charges.create(stripeOptions, function (err, charge) {
            if (err) {
              error.log(err, "Failed to create Stripe charge.");
              error.handler(req, res, err.message, "json");
            } else {
              //various info for keeping track of transactions on our end
              req.session.new_buying_info.purchase_payment_type = "stripe";
              req.session.new_buying_info.purchase_transaction_id = charge.id;
              req.session.new_buying_info.purchase_doma_fees = doma_fees;
              req.session.new_buying_info.purchase_payment_fees =
                charge.balance_transaction.fee;
              req.session.new_buying_info.purchase_exchange_rate =
                charge.balance_transaction.exchange_rate;

              console.log(
                "SF: Payment processed! Received " +
                  Currencies.format(
                    total_price,
                    req.session.new_buying_info.default_currency
                  )
              );
              next();
            }
          });
        }
      }
    } else {
      next();
    }
  },

  //refund a rental
  refundRental: function (req, res, next) {
    if (req.session.rental_info.payment_type == "stripe") {
      console.log("SF: Refunding with Stripe...");
      stripe.refunds.create(
        {
          charge: req.body.transaction_id,
        },
        function (err, refund) {
          if (err) {
            error.log(error, "Failed to refund via Stripe!");
            error.handler(
              req,
              res,
              "Something went wrong with refunding this rental. Please refresh the page and try again!",
              "json"
            );
          } else {
            req.session.rental_object.db_object.status = false;
            req.session.rental_object.db_object.amount_refunded = parseFloat(
              req.session.rental_info.total_cost
            );
            next();
          }
        }
      );
    } else {
      next();
    }
  },

  //#endregion

  //#region -------------------------------WEBHOOK-------------------------------

  //to catch all stripe web hook events
  stripeWebhookEventCatcher: function (req, res) {
    if (process.env.NODE_ENV == "dev") {
      switchStripeEvents(req.body, res);
    } else {
      //Verify the event by fetching it from Stripe
      stripe.events.retrieve(req.body.id, function (err, event) {
        switchStripeEvents(event, res);
      });
    }
  },

  //#endregion
};

//#region -------------------------------NEW STRIPE CREATOR HELPERS-------------------------------

//create a new stripe customer
function newStripeCustomer(req, res, next) {
  console.log("SF: Trying to create a new Stripe customer...");

  stripe.customers.create(
    {
      source: req.body.stripeToken,
      email: req.user.email,
      metadata: {
        account_id: req.user.id,
        username: req.user.username,
        stripe_account_id: req.user.stripe_account_id,
      },
    },
    function (err, customer) {
      if (err) {
        error.log(err, "Failed to create Stripe customer." + req.user.username);
        error.handler(req, res, err.message, "json");
      } else {
        //update the customer id in the DB
        req.session.new_account_info = {
          stripe_customer_id: customer.id,
        };
        updateUserStripeCustomer(req.user, customer);
        next();
      }
    }
  );
}

//check for existing coupons and then create new subscription
function newStripeSubscription(req, res, next) {
  var premium_annual = req.body.annual && req.body.annual == "true";
  var amount_due = premium_annual ? 5000 : 500;

  // var amount_due = 500;   //for testing daily subscription
  checkForRedeemedableCoupons(
    req.user.stripe_customer_id,
    req.user.id,
    amount_due,
    function (result) {
      if (result) {
        console.log("SF: Creating a new Stripe subscription...");

        //create the subscription in stripe!
        stripe.subscriptions.create(
          {
            customer: req.user.stripe_customer_id,
            plan: premium_annual ? "premium_account_annual" : "premium_account",
            // plan: "premium_account_test",      //daily test plan
            metadata: {
              account_id: req.user.id,
              username: req.user.username,
            },
          },
          function (err, subscription) {
            if (err) {
              error.log(
                err,
                "Failed to create Stripe subscription." + req.user.username
              );
              error.handler(req, res, err.message, "json");
            } else {
              updateUserStripeSubscription(req.user, subscription);

              //create this now for getting charges + invoice
              req.user.stripe_subscription_id = subscription.id;

              //update our database with new stripe customer ID
              req.session.new_account_info = {
                stripe_subscription_id: subscription.id,
                stripe_customer_id: req.user.stripe_customer_id,
              };

              //email congrats on prod only
              if (process.env.NODE_ENV != "dev") {
                mailer.sendEJSMail(
                  path.resolve(
                    process.cwd(),
                    "server",
                    "views",
                    "email",
                    "welcome_premium.ejs"
                  ),
                  {
                    username: req.user.username,
                  },
                  {
                    to: req.user.email,
                    from: "DomaHub <general@domahub.com>",
                    subject:
                      "Awesome! " +
                      req.user.username +
                      " Let's sell more domains with your Premium DomaHub account!",
                  },
                  function (state) {
                    if (state == "success") {
                      console.log("SF: Successfully sent email!");
                    }
                  }
                );
              }

              next();
            }
          }
        );
      } else {
        error.handler(
          req,
          res,
          "Something went wrong with the payment! Please refresh the page and try again!",
          "json"
        );
      }
    }
  );
}

//create a new stripe account
function newStripeAccount(req, res, next, stripe_account_info) {
  console.log("SF: Creating a new Stripe managed account...");
  stripe.accounts.create(stripe_account_info, function (err, account) {
    if (err) {
      error.handler(req, res, err.message, "json");
    } else {
      //get supported currencies for this country
      stripe.countrySpecs.retrieve(
        account.country,
        function (err, countrySpec) {
          updateUserStripeCurrencies(req.user, countrySpec);
          updateUserStripeAccount(req.user, account);

          //update our database with new stripe account ID and type = 2
          req.session.new_account_info = {
            stripe_account_id: account.id,
            type: 2,
          };

          next();
        }
      );
    }
  });
}

//#endregion

//#region -------------------------------REQ.USER HELPERS-------------------------------

//delete an expired stripe info (our DB was outdated)
function deleteDHStripeDetails(req, stripe_col, type_as_well) {
  if (!req.session.new_account_info) {
    req.session.new_account_info = {};
  }
  //update our DH database to remove specific stripe info
  req.session.new_account_info[stripe_col] = null;
  delete req.user[stripe_col];

  //change type of account as well
  if (type_as_well) {
    req.session.new_account_info.type = 1;
  }
}

//update req.user with stripe customer object
function updateUserStripeCustomer(user, customer) {
  if (customer) {
    if (process.env.NODE_ENV == "dev") {
      user.dev_stripe_customer = customer;
    }

    //customer last4 cc # for premium payments
    if (customer.sources && customer.sources.total_count > 0) {
      user.stripe_customer = {
        brand: customer.sources.data[0].brand,
        last4: customer.sources.data[0].last4,
      };
    } else {
      user.stripe_customer = {};
    }
  }
}

//update req.user with stripe customer invoices object
function updateUserStripeCustomerInvoices(user, invoices) {
  if (invoices) {
    //dev stripe info
    if (process.env.NODE_ENV == "dev") {
      user.dev_stripe_customer.invoices = invoices;
    }

    //charges array
    var temp_invoices = [];
    for (var x = 0; x < invoices.data.length; x++) {
      temp_invoices.push({
        amount: invoices.data[x].total,
        subtotal: invoices.data[x].subtotal,
        created: invoices.data[x].date * 1000,
      });
    }
    user.stripe_customer.invoices = temp_invoices;
  }
}

//update req.user with stripe customer invoice object
function updateUserStripeCustomerUpcomingInvoice(user, upcoming) {
  if (upcoming) {
    //dev stripe info
    if (process.env.NODE_ENV == "dev") {
      user.dev_stripe_customer.upcoming_invoice = upcoming;
    }

    user.stripe_customer.upcoming_invoice = {
      amount_due: upcoming.amount_due,
      subtotal: upcoming.subtotal,
      date: upcoming.date * 1000,
    };

    //if any existing unredeemed coupons
    if (user.existing_code_amount_off) {
      user.stripe_customer.upcoming_invoice.amount_due -=
        user.existing_code_amount_off;
    }
  }
}

//update req.user with stripe subscription object
function updateUserStripeSubscription(user, subscription) {
  if (subscription) {
    if (process.env.NODE_ENV == "dev") {
      user.dev_stripe_subscription = subscription;
    }

    user.stripe_subscription = {
      created: subscription.created * 1000,
      current_period_end: subscription.current_period_end * 1000,
      cancel_at_period_end: subscription.cancel_at_period_end,
    };
  }
}

//update req.user default currencies with stripe countrySpec object
function updateUserStripeCurrencies(user, countrySpec) {
  if (countrySpec) {
    if (process.env.NODE_ENV == "dev") {
      user.dev_currencies = countrySpec;
    }

    //stripe countrySpec details for list of acceptable currencies
    if (countrySpec) {
      //we only support what stripe + paypal both support
      var supported_payment_currencies = [];
      for (
        var x = 0;
        x < countrySpec.supported_payment_currencies.length;
        x++
      ) {
        // console.log(Currencies.paypalFee(countrySpec.supported_payment_currencies[x].toUpperCase()), countrySpec.supported_payment_currencies[x])
        if (
          Currencies.paypalFee(
            countrySpec.supported_payment_currencies[x].toUpperCase()
          )
        ) {
          supported_payment_currencies.push(
            countrySpec.supported_payment_currencies[x]
          );
        }
      }

      user.currencies = {
        bank_currencies: countrySpec.supported_bank_account_currencies,
        payment_currencies: supported_payment_currencies.sort(),
      };
    }
  }
}

//update req.user with stripe account object
function updateUserStripeAccount(user, account) {
  if (account) {
    if (process.env.NODE_ENV == "dev") {
      user.dev_stripe_account = account;
    }

    //stripe account details for getting paid
    if (account && account.legal_entity) {
      user.stripe_account = {
        country: account.legal_entity.address.country,
        addressline1: account.legal_entity.address.line1,
        addressline2: account.legal_entity.address.line2,
        city: account.legal_entity.address.city,
        state: account.legal_entity.address.state,
        postal_code: account.legal_entity.address.postal_code,
        birthday_year: account.legal_entity.dob.year,
        birthday_month: account.legal_entity.dob.month,
        birthday_day: account.legal_entity.dob.day,
        first_name: account.legal_entity.first_name,
        last_name: account.legal_entity.last_name,
        transfers_enabled: account.transfers_enabled,
        charges_enabled: account.charges_enabled,
        phone_number: account.support_phone,
        business_name: account.legal_entity.business_name,
        business_name_override: account.metadata.business_name_override,
        vat_number: account.metadata.vat_number,
        court_locality: account.metadata.court_locality,
        registration_number: account.metadata.registration_number,
        privacy_policy_link: account.metadata.privacy_policy_link,
      };
    }
  }
}

//update req.user with stripe bank info
function updateUserStripeBank(user, account) {
  if (
    account &&
    account.external_accounts &&
    account.external_accounts.total_count > 0
  ) {
    if (process.env.NODE_ENV == "dev") {
      user.dev_stripe_bank = account.external_accounts;
    }

    //bank account details
    user.stripe_bank = {
      bank_country: account.external_accounts.data[0].country,
      currency: account.external_accounts.data[0].currency.toUpperCase(),
      bank_name: account.external_accounts.data[0].bank_name,
      last4: account.external_accounts.data[0].last4,
    };
  }
}

//#endregion

//#region -------------------------------WEBHOOK-------------------------------

//switch between event types for stripe webhooks
function switchStripeEvents(event, res) {
  if (event) {
    console.log("SF: Event from Stripe: " + event.type);
    switch (event.type) {
      case "customer.subscription.deleted":
        handleSubscriptionCancel(
          event.data.object.customer,
          event.data.object.id
        );
        res.sendStatus(200);
        break;
      case "invoice.payment_failed":
        handleSubscriptionCancel(
          event.data.object.customer,
          event.data.object.subscription
        );
        res.sendStatus(200);
        break;
      case "customer.deleted":
        handleCustomerDelete(event.data.object.id);
        res.sendStatus(200);
        break;
      case "invoice.upcoming":
        if (event.data.object.customer && event.data.object.subscription) {
          handleSubscriptionInvoice(
            event.data.object.customer,
            event.data.object.amount_due,
            res
          );
        }
      default:
        res.sendStatus(200);
        break;
    }
  } else {
    res.sendStatus(404);
  }
}

//subscription was cancelled, check for over 100 listings and remove it locally
function handleSubscriptionCancel(customer_id, subscription_id) {
  console.log("F: Checking if user has over 100 listings...");
  listing_model.selectIDsAbove100Listings(customer_id, function (result) {
    if (result.info.length > 100) {
      console.log(
        "F: Ex-Premium user has over 100 listings! Now setting some as inactive..."
      );
      listing_model.updateListingsInfoByID(
        result.info,
        {
          status: 0,
        },
        function (result) {
          //done!
        }
      );
    }
  });

  console.log("F: Removing Premium DomaHub subscription...");
  account_model.cancelStripeSubscription(subscription_id, function (result) {
    //done!
  });
}

//customer was deleted
function handleCustomerDelete(customer_id) {
  console.log("F: Removing Premium DomaHub customer...");
  account_model.cancelStripeCustomer(customer_id, function (result) {
    //done!
  });
}

//handle subscription payments and see if there are any applicable coupons
function handleSubscriptionInvoice(customer_id, amount_due, res) {
  //get existing stripe customer data
  stripe.customers.retrieve(customer_id, function (err, customer) {
    if (err) {
      error.log(
        err,
        "Created invoice doesn't have an active customer attached!"
      );
    } else if (
      customer &&
      customer.subscriptions &&
      customer.subscriptions.total_count == 1
    ) {
      checkForRedeemedableCoupons(
        customer_id,
        parseFloat(customer.metadata.account_id),
        amount_due,
        function (result) {
          if (result) {
            res.sendStatus(200);
          } else {
            res.sendStatus(404);
          }
        }
      );
    }
  });
}

//#endregion

//#region -------------------------------PROMO HELPERS-------------------------------

//create a new promo code on stripe with account_id as ID
function createPromoCode(account_id, amount, callback) {
  console.log("SF: Creating Stripe promo code...");
  stripe.coupons.create(
    {
      id: account_id,
      duration: "once",
      max_redemptions: 1,
      amount_off: amount,
      currency: "USD",
    },
    function (err, coupon) {
      if (err) {
        if (err.message == "Coupon already exists.") {
          stripe.coupons.del(account_id, function () {
            createPromoCode(account_id, amount, callback);
          });
        } else {
          error.log(err);
          callback(false);
        }
      } else {
        callback(coupon.id);
      }
    }
  );
}

//create a new promo code and apply it to a stripe customer with ID account_id
function createPromoAndApply(stripe_customer_id, account_id, amount, cb) {
  createPromoCode(account_id, amount, function (coupon) {
    if (!coupon && cb) {
      cb(false);
    } else {
      console.log("SF: Applying promo code to Stripe customer...");
      stripe.customers.update(
        stripe_customer_id,
        {
          coupon: coupon,
        },
        function (err, customer) {
          if (err) {
            error.log(
              err,
              "Something went wrong while applying a promo code to a Stripe customer."
            );
          } else if (cb) {
            cb(true);
          }
        }
      );
    }
  });
}

//redeem applicable coupons and create a new promo code on stripe
function checkForRedeemedableCoupons(customer_id, account_id, amount_due, cb) {
  //redeem applicable coupons locally
  account_model.getUnredeemedPromoCodesForUser(account_id, function (results) {
    var total_amount_off = 0;
    var promo_code_ids = [];
    var referral_code_ids = [];
    var needle = 0;

    //loop through and get the total amount we can discount (if greater, then stop)
    while (total_amount_off < amount_due && needle < results.info.length) {
      if (parseFloat(results.info[needle].account_id) == account_id) {
        promo_code_ids.push([results.info[needle].id]);
      } else {
        referral_code_ids.push([results.info[needle].id]);
      }
      total_amount_off += results.info[needle].amount_off;
      needle++;
    }
    if (total_amount_off > 0) {
      //create a one-time coupon for total discount amount
      createPromoAndApply(
        customer_id,
        account_id,
        total_amount_off,
        function (result) {
          if (!result) {
            error.log(
              err,
              "Something went wrong with creating and applying a coupon! Should probably delete Stripe coupons."
            );
            cb(false);
          }
          //mark redeemed the coupons used
          else {
            //these arrays can be empty so we need to use promises
            var redemption_promise_arrays = [];
            if (promo_code_ids.length > 0) {
              redemption_promise_arrays.push(
                (function (promo_code_ids) {
                  return Q.Promise(function (resolve, reject, notify) {
                    account_model.redeemUsedPromoCodes(
                      promo_code_ids,
                      function (result) {
                        if (result.state == "success") {
                          resolve();
                        } else {
                          error.log(
                            "Something went wrong with marking promo codes as redeemed. Should probably delete Stripe coupons."
                          );
                          reject();
                        }
                      }
                    );
                  });
                })(promo_code_ids)
              );
            }
            if (referral_code_ids.length > 0) {
              redemption_promise_arrays.push(
                (function (referral_code_ids) {
                  return Q.Promise(function (resolve, reject, notify) {
                    account_model.redeemUsedReferralCodes(
                      referral_code_ids,
                      function (result) {
                        if (result.state == "success") {
                          resolve();
                        } else {
                          error.log(
                            "Something went wrong with marking referral codes as redeemed. Should probably delete Stripe coupons."
                          );
                          reject();
                        }
                      }
                    );
                  });
                })(referral_code_ids)
              );
            }

            Q.allSettled(redemption_promise_arrays).then(function (results) {
              var all_good = true;
              for (var x = 0; x < results.length; x++) {
                if (results[x].state != "fulfilled") {
                  var all_good = false;
                  break;
                }
              }

              if (all_good) {
                cb(true);
              } else {
                cb(false);
              }
            });
          }
        }
      );
    } else {
      cb(true);
    }
  });
}

//#endregion

//#region -------------------------------TRANSACTION HELPERS (promises)-------------------------------

//get stripe transaction details
function get_stripe_transaction_details(transaction_id, index) {
  return function () {
    return Q.Promise(function (resolve, reject, notify) {
      console.log("PF: Getting Stripe transaction details...");
      stripe.charges.retrieve(
        transaction_id,
        {
          expand: ["balance_transaction"],
        },
        function (err, charge) {
          if (err) {
            reject(err);
          } else {
            resolve({
              index: index,
              payment_obj: charge,
              payment_type: "stripe",
            });
          }
        }
      );
    });
  };
}

//#endregion

//#region -------------------------------HELPERS -------------------------------

//get the req.user listings object for a specific domain
function getUserListingObj(listings, domain_name) {
  for (var x = 0; x < listings.length; x++) {
    if (listings[x].domain_name.toLowerCase() == domain_name.toLowerCase()) {
      return listings[x];
    }
  }
}

//get the doma fees
function getDomaFees(amount) {
  return Math.round(amount * 0.1);
}

//get the stripe fees
function getStripeFees(amount) {
  return Math.round(amount * 0.029) + 30;
}

//#endregion
