var database = require('../lib/database.js');

//GET - 'SELECT * from ?? WHERE ?? = ?'
//UPDATE SET - 'UPDATE ?? SET ? WHERE ?? = ?'
//INSERT SET - 'INSERT INTO ?? SET ?'
//INSERT BULK - 'INSERT INTO ?? (??) VALUES ?'
//DELETE - 'DELETE FROM ?? WHERE ?? = ?'

//database.query(query, client_error_msg_when_errored, callback, posting_params)

module.exports = {

  //<editor-fold>-------------------------------CHECKS-------------------------------

  //check if a specific offer is verified and not yet accepted/rejected
  checkContactVerified : function(domain_name, offer_id, callback){
    console.log("DB: Checking if code for domain " + domain_name + " is verified...");
    var query = "SELECT 1 AS 'exist' \
        FROM stats_contact_history \
        INNER JOIN listings \
        ON listings.id = stats_contact_history.listing_id \
        WHERE listings.domain_name = ? \
        AND stats_contact_history.id = ? "
    database.query(query, "Failed to check if offer for domain " + domain_name + " was verified and not yet accepted/rejected!", callback, [domain_name, offer_id]);
  },

  //check if a specific verification code for a domain exists
  checkContactVerificationCode : function(domain_name, verification_code, callback){
    console.log("DB: Checking if code for domain " + domain_name + " is not verified...");
    var query = "SELECT 1 AS 'exist' \
        FROM stats_contact_history \
        INNER JOIN listings \
        ON listings.id = stats_contact_history.listing_id \
        WHERE listings.domain_name = ? \
        AND stats_contact_history.verification_code = ? \
        AND stats_contact_history.verified IS NULL "
    database.query(query, "Failed to check if code for " + domain_name + " was correct!", callback, [domain_name, verification_code]);
  },

  //check if a specific offer has been accepted and not yet deposited
  checkOfferAccepted : function(domain_name, offer_id, callback){
    console.log("DB: Checking if offer for domain " + domain_name + " has been accepted...");
    var query = "SELECT 1 AS 'exist' \
        FROM stats_contact_history \
        INNER JOIN listings \
        ON listings.id = stats_contact_history.listing_id \
        WHERE listings.domain_name = ? \
        AND stats_contact_history.id = ? \
        AND stats_contact_history.verified = 1 \
        AND stats_contact_history.accepted = 1 \
        AND stats_contact_history.deposited IS NULL "
    database.query(query, "Failed to get check if offer for domain " + domain_name + " was accepted!", callback, [domain_name, offer_id]);
  },

  //</editor-fold>

  //<editor-fold>-------------------------------ANALYZE DATA-------------------------------

  //gets total number of users
  getVerifiedUserCount : function(callback){
    console.log("DB: Attempting to get total verified user count...");
    var query = 'SELECT \
          accounts.id, \
          accounts.email, \
          accounts.username, \
          accounts.date_created, \
          accounts.date_accessed, \
          TIMESTAMPDIFF(DAY, accounts.date_accessed, NOW()) as days_since_log_on, \
          accounts.stripe_subscription_id, \
          verified_listings_count.total as verified_listings_count, \
          unverified_listings_count.total as unverified_listings_count \
        FROM accounts \
        LEFT JOIN (\
          SELECT COUNT(*) as total, \
          owner_id \
        FROM listings \
        WHERE listings.verified = 1 \
        GROUP BY owner_id ) verified_listings_count \
        ON verified_listings_count.owner_id = accounts.id \
        LEFT JOIN (\
          SELECT COUNT(*) as total, \
          owner_id \
        FROM listings \
        WHERE listings.verified IS NULL \
        GROUP BY owner_id ) unverified_listings_count \
        ON unverified_listings_count.owner_id = accounts.id \
        WHERE accounts.type >= 1 \
        ORDER BY verified_listings_count DESC, stripe_subscription_id DESC'
    database.query(query, "Failed to get verified user count!", callback);
  },

  //gets total number of users
  getUnverifiedUserCount : function(callback){
    console.log("DB: Attempting to get total unverified user count...");
    var query = 'SELECT \
          accounts.id, \
          accounts.email, \
          accounts.username, \
          accounts.date_created, \
          accounts.date_accessed, \
          TIMESTAMPDIFF(DAY, accounts.date_accessed, NOW()) as days_since_log_on \
        FROM accounts \
        WHERE accounts.type = 0 '
    database.query(query, "Failed to get unverified user count!", callback);
  },

  //gets coupon info
  getCoupons : function(callback){
    console.log("DB: Attempting to get coupon info...");
    var query = 'SELECT * FROM coupon_codes '
    database.query(query, "Failed to get coupon info!", callback);
  },

  //gets verified domain info
  getVerifiedDomains : function(callback){
    console.log("DB: Attempting to get verified domain info...");
    var query = 'SELECT \
      listings.id, \
      listings.date_created, \
      listings.domain_name, \
      listings.status, \
      listings.deleted, \
      listings.verified, \
      listings.owner_id, \
      listings.min_price, \
      listings.buy_price, \
      listings.price_type, \
      listings.price_rate, \
      accounts.username, \
      accounts.email, \
      accounts.stripe_subscription_id \
     FROM listings \
     INNER JOIN accounts \
     ON accounts.id = listings.owner_id \
     WHERE listings.verified IS NOT NULL'
    database.query(query, "Failed to get verified domain info!", callback);
  },

  //gets unverified domain info
  getUnverifiedDomains : function(callback){
    console.log("DB: Attempting to get unverified domain info...");
    var query = 'SELECT \
      listings.id, \
      listings.date_created, \
      listings.domain_name, \
      listings.status, \
      listings.owner_id, \
      accounts.username, \
      accounts.email \
     FROM listings \
     INNER JOIN accounts \
     ON accounts.id = listings.owner_id \
     WHERE listings.verified IS NULL'
    database.query(query, "Failed to get unverified domain info!", callback);
  },

  //gets all connected registrars
  getConnectedRegistrars : function(callback){
    console.log("DB: Attempting to get connected registrars...");
    var query = "SELECT \
    registrars.registrar_name, \
    accounts.username, \
    accounts.email \
    FROM registrars \
    INNER JOIN accounts \
    ON accounts.id = registrars.account_id "
    database.query(query, "Failed to get connected registrars!", callback);
  },

  //gets all domains viewed on demo mode
  getDemoDomains : function(callback){
    console.log("DB: Attempting to get demo mode statistics...");
    var query = "SELECT \
    stats_hits.domain_name, \
    stats_hits.count, \
    listings.id, \
    listings.verified, \
    listings.deleted, \
    listings.owner_id, \
    accounts.username, \
    accounts.type, \
    accounts.email \
    FROM \
      (SELECT domain_name, COUNT( * ) AS count \
        FROM stats_search_history \
        WHERE compare = 1 \
        GROUP BY domain_name ) stats_hits \
    LEFT JOIN listings \
    ON LOWER(listings.domain_name) = LOWER(stats_hits.domain_name) \
    LEFT JOIN accounts \
    ON listings.owner_id = accounts.id \
    ORDER BY stats_hits.count DESC, listings.owner_id DESC"
    database.query(query, "Failed to get demo mode statistics!", callback);
  },

  //gets all domains requested on domahub
  getSearchedDomains : function(callback){
    console.log("DB: Attempting to get demo mode statistics...");
    var query = "SELECT \
    stats_hits.domain_name, \
    stats_hits.count, \
    listings.id, \
    listings.verified, \
    listings.deleted, \
    listings.owner_id, \
    accounts.username, \
    accounts.type, \
    accounts.email \
    FROM \
      (SELECT domain_name, COUNT( * ) AS count \
        FROM stats_search_history \
        GROUP BY domain_name ) stats_hits \
    LEFT JOIN listings \
    ON LOWER(listings.domain_name) = LOWER(stats_hits.domain_name) \
    LEFT JOIN accounts \
    ON listings.owner_id = accounts.id \
    ORDER BY stats_hits.count DESC, listings.owner_id DESC"
    database.query(query, "Failed to get demo mode statistics!", callback);
  },

  //gets all referers on domains
  getReferers : function(callback){
    console.log("DB: Attempting to get referers...");
    var query = 'SELECT referer, COUNT( * ) AS count \
              FROM stats_search_history \
              WHERE referer IS NOT NULL \
              GROUP BY referer \
              ORDER BY count DESC'
    database.query(query, "Failed to get demo mode statistics!", callback);
  },

  //get all contact history items
  getContactHistory : function(callback){
    console.log("DB: Attempting to get contact history...");
    var query = 'SELECT \
                listings.domain_name, \
                accounts.username as owner_username, \
                accounts.email as owner_email, \
                stats_contact_history.timestamp, \
                stats_contact_history.deadline, \
                stats_contact_history.user_ip, \
                stats_contact_history.name, \
                stats_contact_history.email, \
                stats_contact_history.phone, \
                stats_contact_history.offer, \
                stats_contact_history.bin, \
                stats_contact_history.message, \
                stats_contact_history.response, \
                stats_contact_history.verified, \
                stats_contact_history.accepted, \
                stats_contact_history.deposited, \
                stats_contact_history.transferred \
              FROM stats_contact_history \
              INNER JOIN listings \
              ON listings.id = stats_contact_history.listing_id \
              INNER JOIN accounts \
              ON accounts.id = listings.owner_id'
    database.query(query, "Failed to get contact history!", callback);
  },

  //gets all views for a specific listing's rentals
  getRentalTraffic : function(domain_name, callback){
    console.log("DB: Attempting to get rental traffic for domain: " + domain_name + "...");
    var query = 'SELECT \
          stats_rental_history.rental_id, \
          min_timestamp.min_ts, \
          max_timestamp.max_ts, \
          rental_times.date, \
          rental_times.duration, \
          rentals.path, \
          rentals.date_created, \
          count(stats_rental_history.timestamp) AS views \
        FROM stats_rental_history \
        INNER JOIN rentals \
          ON stats_rental_history.rental_id = rentals.rental_id \
        INNER JOIN rental_times \
          ON rental_times.rental_id = rentals.rental_id \
        INNER JOIN listings \
          ON listings.id = rentals.listing_id \
        INNER JOIN ( \
          SELECT rental_id, MIN( TIMESTAMP ) AS min_ts \
          FROM  stats_rental_history \
          GROUP BY rental_id \
        ) AS min_timestamp \
          ON min_timestamp.rental_id = stats_rental_history.rental_id \
        INNER JOIN ( \
          SELECT rental_id, MAX( TIMESTAMP ) AS max_ts \
          FROM  stats_rental_history \
          GROUP BY rental_id \
        ) AS max_timestamp \
          ON max_timestamp.rental_id = stats_rental_history.rental_id \
        WHERE listings.domain_name = ? \
        GROUP BY stats_rental_history.rental_id \
        ORDER BY rentals.rental_id DESC '
    database.query(query, "Failed to get rental traffic for " + domain_name + "!", callback, domain_name);
  },

  //gets all views for a specific listing that came from a rental
  getListingRentalTraffic : function(domain_name, callback){
    console.log("DB: Attempting to get listing traffic for domain: " + domain_name + " that came from rentals...");
    var query = 'SELECT \
          stats_search_history.rental_id, \
          count(stats_search_history.timestamp) AS views \
        FROM stats_search_history \
        WHERE stats_search_history.domain_name = ? \
        AND stats_search_history.rental_id IS NOT NULL \
        GROUP BY stats_search_history.rental_id \
        ORDER BY stats_search_history.rental_id DESC '
    database.query(query, "Failed to get listing traffic for " + domain_name + "!", callback, domain_name);
  },

  //gets all availability check history
  getAvailCheckHistory : function(callback){
    console.log("DB: Attempting to get rental path check history...");
    var query = 'SELECT  \
      account_hits_table.domain_name, \
      account_hits_table.domain_hits as total_hits, \
      path_hits_table.unique_paths, \
      path_hits_table.paths, \
      account_hits_table.unique_account_ids, \
      account_hits_table.account_ids, \
      ip_hits_table.unique_user_ips, \
      ip_hits_table.user_ips \
    FROM  \
      (SELECT  \
      domain_name, \
      COUNT(path) as unique_paths, \
      GROUP_CONCAT(DISTINCT IF(path = "", "ROOTPATH", path), " - ", CONCAT(path_hits, " hits") ORDER BY path_hits DESC SEPARATOR "</br>") as paths \
      FROM \
        (SELECT  \
        domain_name,  \
        count(*) as path_hits, \
        path \
        FROM stats_availcheck_history  \
        GROUP BY domain_name, path) path_hits \
      GROUP BY domain_name) as path_hits_table \
    INNER JOIN  \
      (SELECT  \
      domain_name, \
      SUM(hits) as domain_hits, \
      COUNT(account_id) as unique_account_ids, \
      GROUP_CONCAT(DISTINCT CASE WHEN account_id IS NULL THEN "Guest" ELSE CONCAT("Account #", account_id) END, " - ", CONCAT(hits, " hits") ORDER BY hits DESC SEPARATOR "</br>") as account_ids \
      FROM \
        (SELECT  \
        domain_name,  \
        count(*) as hits, \
        account_id \
        FROM stats_availcheck_history  \
        GROUP BY domain_name, account_id) account_hits \
      GROUP BY domain_name) as account_hits_table \
    ON account_hits_table.domain_name = path_hits_table.domain_name \
    INNER JOIN  \
      (SELECT  \
      domain_name, \
      SUM(user_ip_hits) as domain_hits, \
      COUNT(user_ip) as unique_user_ips, \
      GROUP_CONCAT(DISTINCT CASE WHEN user_ip IS NULL THEN "Guest" ELSE user_ip END, " - ", user_ip_hits ORDER BY user_ip_hits DESC SEPARATOR "</br>") as user_ips \
      FROM \
        (SELECT  \
        domain_name,  \
        count(*) as user_ip_hits, \
        user_ip \
        FROM stats_availcheck_history  \
      GROUP BY domain_name, user_ip) user_ip_hits_table \
      GROUP BY domain_name) as ip_hits_table \
    ON ip_hits_table.domain_name = path_hits_table.domain_name \
    ORDER BY account_hits_table.domain_hits DESC'
    database.query(query, "Failed to get rental path check history!", callback);
  },

  //gets all availability check history for a specific listing
  getCheckoutHistory : function(domain_name, callback){
    console.log("DB: Attempting to get checkout history for domain: " + domain_name + "...");
    var query = 'SELECT \
          stats_checkout_history.rental_id, \
          stats_checkout_history.timestamp, \
          stats_checkout_history.path, \
          stats_checkout_history.starttime, \
          stats_checkout_history.endtime \
        FROM stats_checkout_history \
        WHERE stats_checkout_history.domain_name = ? \
        ORDER BY timestamp DESC '
    database.query(query, "Failed to get checkout history for " + domain_name + "!", callback, domain_name);
  },

  //gets all availability check history for a specific listing
  getCheckoutActions : function(domain_name, callback){
    console.log("DB: Attempting to get checkout actions for domain: " + domain_name + "...");
    var query = 'SELECT \
          stats_checkout_actions.rental_id, \
          stats_checkout_actions.timestamp, \
          stats_checkout_actions.user_ip, \
          stats_checkout_actions.elem_id \
        FROM stats_checkout_actions \
        WHERE stats_checkout_actions.domain_name = ? \
        ORDER BY timestamp DESC '
    database.query(query, "Failed to get checkout actions for " + domain_name + "!", callback, domain_name);
  },

  //</editor-fold>

  //<editor-fold>-------------------------------GETS-------------------------------

  //gets specific offer details for a specific domain by offer ID
  getListingOffererContactInfoByID : function(domain_name, offer_id, callback){
    console.log("DB: Attempting to get contact info for an offer for domain: " + domain_name + " with id: " + offer_id + "...");
    var query = 'SELECT \
          stats_contact_history.id, \
          stats_contact_history.name, \
          stats_contact_history.email, \
          stats_contact_history.phone, \
          stats_contact_history.offer, \
          stats_contact_history.message, \
          stats_contact_history.response, \
          stats_contact_history.accepted, \
          stats_contact_history.deposited, \
          stats_contact_history.verification_code \
        FROM stats_contact_history \
        INNER JOIN listings \
        ON listings.id = stats_contact_history.listing_id \
        WHERE listings.domain_name = ? \
        AND stats_contact_history.id = ? \
        AND stats_contact_history.verified = 1 '
    database.query(query, "Failed to get contact info for an offer for " + domain_name + "!", callback, [domain_name, offer_id]);
  },

  //gets specific offer details for a specific domain by verification code
  getListingOffererContactInfoByCode : function(domain_name, verification_code, callback){
    console.log("DB: Attempting to get contact info for an offer for domain: " + domain_name + " with code: " + verification_code + "...");
    var query = 'SELECT \
          stats_contact_history.id, \
          stats_contact_history.name, \
          stats_contact_history.email, \
          stats_contact_history.phone, \
          stats_contact_history.offer, \
          stats_contact_history.message, \
          stats_contact_history.accepted \
        FROM stats_contact_history \
        INNER JOIN listings \
        ON listings.id = stats_contact_history.listing_id \
        WHERE listings.domain_name = ? \
        AND stats_contact_history.verification_code = ? \
        AND stats_contact_history.verified = 1 '
    database.query(query, "Failed to get contact info for an offer for " + domain_name + "!", callback, [domain_name, verification_code]);
  },

  //gets all offers for specific domains
  getOffersMulti : function(domain_ids, callback){
    console.log("DB: Attempting to get all verified offers for posted domains...");
    var query = 'SELECT \
          listings.id AS listing_id, \
          listings.domain_name, \
          stats_contact_history.id, \
          stats_contact_history.timestamp, \
          stats_contact_history.deadline, \
          stats_contact_history.user_ip, \
          stats_contact_history.name, \
          stats_contact_history.email, \
          stats_contact_history.phone, \
          stats_contact_history.offer, \
          stats_contact_history.message, \
          stats_contact_history.response, \
          stats_contact_history.accepted, \
          stats_contact_history.bin \
        FROM stats_contact_history \
        INNER JOIN listings \
        ON listings.id = stats_contact_history.listing_id \
        WHERE stats_contact_history.listing_id IN (?) \
        AND stats_contact_history.verified = 1'
    database.query(query, "Failed to get offers for posted domains!", callback, [domain_ids]);
  },

  //gets view statistics for a specific domain
  getListingStats : function(domain_name, callback){
    console.log("DB: Attempting to get statistics for domain: " + domain_name + "...");
    var query = 'SELECT \
          stats_search_history.timestamp, \
          stats_search_history.rental_id, \
          stats_search_history.user_ip, \
          IFNULL(SUBSTRING_INDEX(SUBSTRING_INDEX(SUBSTRING_INDEX(SUBSTRING_INDEX(stats_search_history.referer, "/", 3), "://", -1), "/", 1), "www", 1), "") AS referer, \
          stats_search_history.compare, \
          accounts.username \
        FROM stats_search_history \
        LEFT JOIN accounts \
        ON accounts.id = stats_search_history.account_id \
        WHERE stats_search_history.domain_name = ? \
        ORDER BY stats_search_history.timestamp DESC'
    database.query(query, "Failed to get statistics for " + domain_name + "!", callback, domain_name);
  },

  //</editor-fold>

  //<editor-fold>-------------------------------SETS-------------------------------

  //creates a new entry for a listing data row
  newListingHistory : function(history_info, callback){
    console.log("DB: Adding new search history item for " + history_info.domain_name + "...");
    var query = "INSERT INTO stats_search_history \
        SET ? "
    database.query(query, "Failed to add search history for " + history_info.domain_name + "!", callback, history_info);
  },

  //creates a new entry for a listing contact data row
  newListingContactHistory : function(domain_name, history_info, callback){
    console.log("DB: Adding new purchase contact history item for " + domain_name + "...");
    var query = "INSERT INTO stats_contact_history \
        SET ? "
    database.query(query, "Failed to add purchase contact history for " + domain_name + "!", callback, history_info);
  },

  //creates a new entry for a rental history data row
  newRentalHistory : function(history_info, callback){
    console.log("DB: Adding new rental history item for rental #" + history_info.rental_id + "...");
    var query = "INSERT INTO stats_rental_history \
        SET ? "
    database.query(query, "Failed to add rental view history for rental #" + history_info.rental_id + "!", callback, history_info);
  },

  //creates a new entry for a checked availability history data row
  newCheckAvailHistory : function(history_info, callback){
    console.log("DB: Adding new availability check history item for domain: " + history_info.domain_name + "...");
    var query = "INSERT INTO stats_availcheck_history \
        SET ? "
    database.query(query, "Failed to add availability check history item for domain:" + history_info.domain_name + "!", callback, history_info);
  },

  //creates a new entry for a checkout history data row
  newCheckoutHistory : function(history_info, callback){
    console.log("DB: Adding new checkout history item for domain: " + history_info.domain_name + "...");
    var query = "INSERT INTO stats_checkout_history \
        SET ? "
    database.query(query, "Failed to add checkout check history item for domain:" + history_info.domain_name + "!", callback, history_info);
  },

  //creates a new entry for a checkout action data row
  newCheckoutAction : function(history_info, callback){
    console.log("DB: Adding new checkout action item for domain: " + history_info.domain_name + "...");
    var query = "INSERT INTO stats_checkout_actions \
        SET ? "
    database.query(query, "Failed to add checkout check action item for domain:" + history_info.domain_name + "!", callback, history_info);
  },

  //</editor-fold>

  //<editor-fold>-------------------------------UPDATES-------------------------------

  //verifies the email on the offer contact history db
  verifyContactHistory : function(verification_code, domain_name, callback){
    console.log("DB: Verifying contact history on domain " + domain_name + " with code: " + verification_code + "...");
    var query = "UPDATE stats_contact_history \
        INNER JOIN listings \
        ON listings.id = stats_contact_history.listing_id \
        SET stats_contact_history.verified = true \
        WHERE stats_contact_history.verification_code = ? \
        AND listings.domain_name = ?"
    database.query(query, "Failed to verify contact history!", callback, [verification_code, domain_name]);
  },

  //accept or reject an offer
  acceptRejectOffer : function(contact_item, domain_name, offer_id, callback){
    var accept_text = (contact_item.accepted) ? "Accepting " : "Rejecting ";
    console.log("DB: " + accept_text + " offer on domain with id: " + offer_id + " on domain: " + domain_name + "...");
    var query = "UPDATE stats_contact_history \
        INNER JOIN listings \
        ON listings.id = stats_contact_history.listing_id \
        SET ? \
        WHERE stats_contact_history.id = ? \
        AND listings.domain_name = ?"
    database.query(query, "Failed to accept/reject offer!", callback, [contact_item, offer_id, domain_name]);
  },

  //changes an offer to deposited
  depositedOffer : function(deposited_details, domain_name, offer_id, callback){
    console.log("DB: Updating deposited for offer with id: " + offer_id + " on domain: " + domain_name + "...");
    var query = "UPDATE stats_contact_history \
        INNER JOIN listings \
        ON listings.id = stats_contact_history.listing_id \
        SET ? \
        WHERE stats_contact_history.id = ? \
        AND listings.domain_name = ?"
    database.query(query, "Failed to change offer to deposited!", callback, [deposited_details, offer_id, domain_name]);
  },

  //marks certain offers as having been withdrawn
  markSalesWithdrawn : function(stats_contact_history_ids, withdrawn_on, callback){
    console.log("DB: Attempting to mark " + stats_contact_history_ids.length + " offers as having been withdrawn...");
    var query = "UPDATE stats_contact_history \
      SET ? \
      WHERE id IN (?)"
    database.query(query, "Failed to mark " + stats_contact_history_ids.length + " offers as having been withdrawn!", callback, [withdrawn_on, stats_contact_history_ids]);
  },

  //</editor-fold>

}
