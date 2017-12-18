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
          listings.id,\
          listings.date_created,\
          listings.domain_name,\
          listings.owner_id,\
          listings.status,\
          listings.verified,\
          listings.rentable,\
          listings.price_type,\
          listings.price_rate,\
          listings.buy_price,\
          listings.min_price,\
          listings.description,\
          listings.description_hook,\
          listings.description_footer,\
          listings.categories,\
          listings.paths,\
          listings.background_image,\
          listings.background_color,\
          listings.logo,\
          listings.domain_owner,\
          listings.domain_age,\
          listings.domain_list,\
          listings.domain_appraisal,\
          listings.social_sharing,\
          listings.traffic_module,\
          listings.traffic_graph,\
          listings.alexa_stats,\
          listings.history_module,\
          listings.info_module,\
          IF(listings.primary_color IS NULL, '#3CBC8D', listings.primary_color) as primary_color, \
          IF(listings.secondary_color IS NULL, '#FF5722', listings.secondary_color) as secondary_color, \
          IF(listings.tertiary_color IS NULL, '#2196F3', listings.tertiary_color) as tertiary_color, \
          IF(listings.font_name IS NULL, 'Rubik', listings.font_name) as font_name, \
          IF(listings.font_color IS NULL, '#000000', listings.font_color) as font_color, \
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
        WHERE owner_id = ? \
        AND listings.deleted IS NULL \
        ORDER BY listings.id ASC";
    database.query(query, "Failed to get all listings belonging to account " + account_id + "!", callback, account_id);
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

  //gets all coupon codes
  getCouponCodes : function(callback){
    console.log("DB: Attempting to get all coupon codes...");
    var query = "SELECT code FROM coupon_codes"
    database.query(query, "Failed to get all coupon codes!", callback);
  },

  //gets all referrals/existing coupons for a user
  getCouponsAndReferralsForUser : function(account_id, callback){
    console.log("DB: Attempting to get all referrals/coupons for user #" + account_id + "...");
    var query = "SELECT \
          coupon_codes.date_created, \
          coupon_codes.date_accessed, \
          coupon_codes.duration_in_months, \
          accounts.stripe_subscription_id, \
          coupon_codes.referer_id \
            FROM accounts \
          LEFT JOIN coupon_codes ON accounts.id = coupon_codes.account_id \
          WHERE coupon_codes.referer_id = ? \
          OR coupon_codes.account_id = ?"
    database.query(query, "Failed to get all coupon codes!", callback, [account_id, account_id]);
  },

  //gets any existing coupon code for a user
  getExistingPromoCodeByUser : function(account_id, callback){
    console.log("DB: Attempting to get the existing coupon code for user #" + account_id + "...");
    var query = "SELECT \
          coupon_codes.code, \
          coupon_codes.referer_id, \
          coupon_codes.duration_in_months, \
          accounts.stripe_subscription_id \
            FROM accounts \
          LEFT JOIN coupon_codes ON accounts.id = coupon_codes.account_id \
          WHERE accounts.id = ? "
  database.query(query, "Failed to get an existing coupon code!", callback, account_id);
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
          duration_in_months \
        )\
        VALUES ? "
    database.query(query, "Failed to create coupon codes!", callback, [codes]);
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

  //attaches a user to a promo code
  updatePromoCode : function(code, account_info, callback){
    console.log("DB: Updating coupon " + code + " code details...");
    var query = "UPDATE coupon_codes \
          SET ? \
        WHERE code = ? "
    database.query(query, "Failed to apply coupon code!", callback, [account_info, code]);
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
