var database = require('../lib/database.js');

//GET - 'SELECT * from ?? WHERE ?? = ?'
//UPDATE SET - 'UPDATE ?? SET ? WHERE ?? = ?'
//INSERT SET - 'INSERT INTO ?? SET ?'
//INSERT BULK - 'INSERT INTO ?? (??) VALUES ?'
//DELETE - 'DELETE FROM ?? WHERE ?? = ?'

//database.query(query, client_error_msg_when_errored, callback, posting_params)

module.exports = {

  //<editor-fold>-------------------------------CHECK-------------------------------

  //check if an account email exists
  checkAccountEmail : function(email, callback){
    console.log("DB: Checking to see if account with email " + email + " exists on DomaHub...");
    var query = 'SELECT 1 AS "exist" FROM accounts WHERE email = ?'
    database.query(query, "Account does not exist!", callback, email);
  },

  //check if an account username exists
  checkAccountUsername : function(username, callback){
    console.log("DB: Checking to see if account with username " + username + " exists on DomaHub...");
    var query = 'SELECT 1 AS "exist" FROM accounts WHERE LOWER(username) = LOWER(?)'
    database.query(query, "Account does not exist!", callback, username);
  },

  //check if an account token is expired
  checkTokenExpired : function(token, callback){
    console.log("DB: Checking to see if account token is expired...");
    var query = 'SELECT 1 AS "exist" FROM accounts WHERE token = ? AND token_exp > NOW()'
    database.query(query, "Failed to check if token is expired!", callback, token);
  },

  //check if an account already applied a promo code for referral
  checkExistingReferral : function(account_id, referer_id, callback){
    console.log("DB: Checking to see if account #" + account_id + " has an applied referer promo code...");
    var query = 'SELECT 1 AS "exist" FROM coupon_codes WHERE (account_id = ? AND referer_id IS NOT NULL) OR (referer_id = ? AND account_id = ?)'
    database.query(query, "Promo code does not exist!", callback, [account_id, account_id, referer_id]);
  },

  //check if a promocode exists
  checkPromoCodeUnused : function(code, callback){
    console.log("DB: Checking to see if promo code " + code + " exists...");
    var query = 'SELECT 1 AS "exist" FROM coupon_codes WHERE code = ? AND account_id IS NULL'
    database.query(query, "Promo code does not exist!", callback, code);
  },

  //</editor-fold>

  //<editor-fold>-------------------------------GETS-------------------------------

  //get unverified account emails
  getUnverifiedAccount : function(callback){
    console.log("DB: Attempting to get all unverified account information...");
    var query = "SELECT username, email FROM accounts WHERE type = 0"
    database.query(query, "Failed to get all unverified account information!", callback);
  },

  //gets all account info
  getAccount : function(email, username, callback){
    if (email){
      console.log("DB: Attempting to get all account information for email: " + email + "...");
    }
    else {
      console.log("DB: Attempting to get all account information for username " + username + "...");
    }
    var query = "SELECT * FROM accounts WHERE email = ? OR username = ? "
    database.query(query, "Failed to get all account information for email: " + email + "!", callback, [email, username]);
  },

  //gets id of account by username
  getAccountIDByUsername : function(username, callback){
    console.log("DB: Attempting to get all account information for username: " + username + "...");
    var query = "SELECT id FROM accounts WHERE LOWER(username) = LOWER(?)"
    database.query(query, "Failed to get all account information for username: " + username + "!", callback, username);
  },

  //gets account by token
  getAccountByToken : function(token, callback){
    console.log("DB: Attempting to get account information for token: " + token + "...");
    var query = "SELECT username, email, token, token_exp FROM accounts WHERE token = ?"
    database.query(query, "Failed to get account information for token: " + token + "!", callback, token);
  },

  //gets all listing info belonging to specific account
  getAccountListings : function(account_id, callback){
    console.log("DB: Attempting to get all listings belonging to account " + account_id + "...");
    var query = "SELECT \
          listings.*, \
          IF(listings.background_color IS NULL, '#FFFFFF', listings.background_color) as background_color, \
          IF(listings.primary_color IS NULL, '#3CBC8D', listings.primary_color) as primary_color, \
          IF(listings.secondary_color IS NULL, '#FF5722', listings.secondary_color) as secondary_color, \
          IF(listings.tertiary_color IS NULL, '#2196F3', listings.tertiary_color) as tertiary_color, \
          IF(listings.font_name IS NULL, 'Nunito Sans', listings.font_name) as font_name, \
          IF(listings.font_color IS NULL, '#000000', listings.font_color) as font_color, \
          IF(listings.footer_color IS NULL, '#565656', listings.footer_color) as footer_color, \
          IF(listings.footer_background_color IS NULL, '#F1F1F1', listings.footer_background_color) as footer_background_color, \
          hub_grouping_table.hub_listing_ids, \
          rented_table.rented, \
          offers_table.deposited, \
          offers_table_accepted.accepted, \
          offers_table_count.offers_count, \
          accounts.stripe_subscription_id \
        FROM listings \
        JOIN accounts ON listings.owner_id = accounts.id \
        LEFT JOIN \
          (SELECT DISTINCT\
            listings.id AS listing_id, \
            rentals.rental_id IS NOT NULL AS rented \
          FROM rental_times \
          INNER JOIN rentals \
            ON rental_times.rental_id = rentals.rental_id \
          INNER JOIN listings \
            ON listings.id = rentals.listing_id \
          WHERE (UNIX_TIMESTAMP(NOW())*1000) BETWEEN rental_times.date AND rental_times.date + rental_times.duration \
        ) as rented_table \
        ON rented_table.listing_id = listings.id \
        LEFT JOIN \
          (SELECT DISTINCT\
            stats_contact_history.listing_id as listing_id, \
            stats_contact_history.deposited IS NOT NULL AS deposited \
          FROM stats_contact_history \
          WHERE stats_contact_history.deposited = 1 \
        ) as offers_table \
        ON offers_table.listing_id = listings.id \
        LEFT JOIN \
          (SELECT DISTINCT\
            stats_contact_history.listing_id as listing_id, \
            stats_contact_history.accepted IS NOT NULL AS accepted \
          FROM stats_contact_history \
          WHERE stats_contact_history.accepted = 1 \
        ) as offers_table_accepted \
        ON offers_table_accepted.listing_id = listings.id \
        LEFT JOIN \
          (SELECT \
            stats_contact_history.listing_id as listing_id, \
            COUNT(stats_contact_history.listing_id) as offers_count \
          FROM stats_contact_history \
          WHERE stats_contact_history.verified IS NOT NULL \
          AND stats_contact_history.accepted IS NULL \
          GROUP BY stats_contact_history.listing_id \
        ) as offers_table_count \
        ON offers_table_count.listing_id = listings.id \
        LEFT JOIN \
          (SELECT \
              listing_hub_grouping.listing_hub_id, \
              GROUP_CONCAT(listing_hub_grouping.listing_id ORDER BY listing_hub_grouping.rank ASC) as hub_listing_ids, \
              GROUP_CONCAT(listing_hub_grouping.rank ORDER BY listing_hub_grouping.rank ASC) as hub_ranks \
            FROM listing_hub_grouping \
            INNER JOIN listings \
            ON listing_id = listings.id \
            GROUP BY listing_hub_id \
        ) as hub_grouping_table \
        ON hub_grouping_table.listing_hub_id = listings.id \
        WHERE owner_id = ? \
        AND listings.deleted IS NULL \
        ORDER BY listings.id ASC";
    database.query(query, "Failed to get all listings belonging to account " + account_id + "!", callback, account_id);
  },

  //gets all registrars connected to specific account
  getAccountRegistrars : function(account_id, callback){
    console.log("DB: Attempting to get all registrars connected to account " + account_id + "...");
    var query = "SELECT \
          registrars.* \
            FROM registrars \
          WHERE registrars.account_id = ? ";
    database.query(query, "Failed to get all registrars connected to account " + account_id + "!", callback, account_id);
  },

  //gets the stripe ID and listing type of a listing owner
  getStripeAndType : function(domain_name, callback){
    console.log("DB: Attempting to get the Stripe ID of the owner of: " + domain_name + "...");
    var query = "SELECT \
          accounts.stripe_account_id \
            FROM accounts \
            JOIN listings ON listings.owner_id = accounts.id \
            WHERE listings.domain_name = ? ";
    database.query(query, "Failed to get the Stripe ID of the owner of: " + domain_name + "!", callback, domain_name);
  },

  //gets all referrals/existing coupons for a user (for front-end table building)
  getCouponsAndReferralsForUser : function(account_id, callback){
    console.log("DB: Attempting to get all referrals/coupons for user #" + account_id + "...");
    var query = "SELECT \
          coupon_codes.id, \
          coupon_codes.date_created, \
          coupon_codes.date_accessed, \
          coupon_codes.date_redeemed, \
          coupon_codes.date_redeemed_r, \
          coupon_codes.amount_off, \
          accounts.stripe_subscription_id, \
          coupon_codes.referer_id \
            FROM accounts \
          LEFT JOIN coupon_codes ON accounts.id = coupon_codes.account_id \
          WHERE coupon_codes.referer_id = ? \
          OR coupon_codes.account_id = ?"
    database.query(query, "Failed to get all coupon codes!", callback, [account_id, account_id]);
  },

  //gets all existing unredeemed coupon codes for a user (for creating new coupons)
  getUnredeemedPromoCodesForUser : function(account_id, callback){
    console.log("DB: Attempting to get all unredeemed coupon codes for user #" + account_id + "...");
    var query = "SELECT \
          coupon_codes.id, \
          coupon_codes.account_id, \
          coupon_codes.amount_off \
          FROM coupon_codes \
          WHERE (coupon_codes.account_id = ? && coupon_codes.date_redeemed IS NULL) OR (coupon_codes.referer_id = ? && coupon_codes.date_redeemed IS NOT NULL && coupon_codes.date_redeemed_r IS NULL)"
    database.query(query, "Failed to get unredeemed coupon codes!", callback, [account_id, account_id]);
  },

  //</editor-fold>

  //<editor-fold>-------------------------------SETS-------------------------------

  //creates a new account
  newAccount : function(account_info, callback){
    console.log("DB: Creating a new account for email: " + account_info.email + "...");
    var query = "INSERT INTO accounts \
        SET ? "
    database.query(query, "Failed to create a new account for email: " + account_info.email + "!", callback, account_info);
  },

  //creates new sign up codes
  createCouponCodes : function(codes, callback){
    console.log("DB: Creating coupon codes...");
    var query = "INSERT INTO coupon_codes (\
          code, \
          referer_id, \
          amount_off \
        )\
        VALUES ? "
    database.query(query, "Failed to create coupon codes!", callback, [codes]);
  },

  //creates a new registrar
  newRegistrar : function(registrar_array, callback){
    console.log("DB: Attempting to create or update registrar information for user...");
    var query = "INSERT INTO registrars ( \
          account_id, \
          registrar_name, \
          api_key, \
          username, \
          password \
        )\
         VALUES ? \
         ON DUPLICATE KEY UPDATE \
         api_key = VALUES(api_key), \
         username = VALUES(username), \
         password = VALUES(password)"
    database.query(query, "Failed to create or update registrar information!", callback, [registrar_array]);
  },

  //</editor-fold>

  //<editor-fold>-------------------------------UPDATES-------------------------------

  //updates a new account
  updateAccount : function(account_info, email, callback){
    if (!account_info.date_accessed){
      console.log("DB: Updating account with email: " + email + "...");
    }
    var query = "UPDATE accounts \
        SET ? \
        WHERE email = ?"
    database.query(query, "Failed to update account!", callback, [account_info, email]);
  },

  //updates a specific promo code
  updatePromoCode : function(code, account_info, callback){
    console.log("DB: Updating coupon " + code + " code details...");
    var query = "UPDATE coupon_codes \
          SET ? \
        WHERE code = ? "
    database.query(query, "Failed to apply coupon code!", callback, [account_info, code]);
  },

  //marks as redeemed used promo codes
  redeemUsedPromoCodes : function(used_codes, callback){
    console.log("DB: Redeeming used coupons...");
    var query = "INSERT INTO coupon_codes \
            (id) \
          VALUES ? \
          ON DUPLICATE KEY UPDATE \
            date_redeemed = NOW() "
    database.query(query, "Failed to redeemed used coupon codes!", callback, [used_codes]);
  },

  //marks as redeemed used referral codes
  redeemUsedReferralCodes : function(used_codes, callback){
    console.log("DB: Redeeming used coupons...");
    var query = "INSERT INTO coupon_codes \
            (id) \
          VALUES ? \
          ON DUPLICATE KEY UPDATE \
            date_redeemed_r = NOW() "
    database.query(query, "Failed to redeemed used coupon codes!", callback, [used_codes]);
  },

  //cancels a user's premium subscription
  cancelStripeSubscription : function(stripe_subscription_id, callback){
    console.log("DB: Cancelling Stripe subscription...");
    var query = "UPDATE accounts \
          SET stripe_subscription_id = null \
        WHERE stripe_subscription_id = ? "
    database.query(query, "Failed to cancel Stripe subscription!", callback, stripe_subscription_id);
  },

  //cancels a user's premium customer
  cancelStripeCustomer : function(stripe_customer_id, callback){
    console.log("DB: Cancelling Stripe customer...");
    var query = "UPDATE accounts \
          SET stripe_customer_id = null \
        WHERE stripe_customer_id = ? "
    database.query(query, "Failed to cancel Stripe subscription!", callback, stripe_customer_id);
  },

  //</editor-fold>

  //<editor-fold>-------------------------------DELETES-------------------------------

  //deletes a specific coupon code
  deletePromoCode : function(code, callback){
    console.log("DB: Deleting coupon " + code + "...");
    var query = "DELETE FROM coupon_codes \
          WHERE code = ? \
          LIMIT 1"
    database.query(query, "Failed to delete coupon code!", callback, [code]);
  },

  //</editor-fold>

};
