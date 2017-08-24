data_model = function(database){
  this.db = database;

  data_query = function(query, error_description, callback, params){
    database.query(query, function(result, err){
      if (err){
        callback({
          state : "error",
          info : error_description,
          errcode : err.code
        });
      }
      else {
        callback({
          state : "success",
          info : result
        });
      }
    }, params);
  }
}

module.exports = data_model;

//<editor-fold>-------------------------------CHECKS-------------------------------

//check if a specific offer is verified and not yet accepted/rejected
data_model.prototype.checkContactVerified = function(domain_name, offer_id, callback){
  console.log("DB: Checking if code for domain: " + domain_name + " is verified...");
  query = "SELECT \
      FROM stats_contact_history \
      INNER JOIN listings \
      ON listings.id = stats_contact_history.listing_id \
      WHERE listings.domain_name = ? \
      AND stats_contact_history.id = ? "
  data_query(query, "Failed to get traffic for domain: " + domain_name + "!", callback, [domain_name, offer_id]);
}

//check if a specific verification code for a domain exists
data_model.prototype.checkContactVerificationCode = function(domain_name, verification_code, callback){
  console.log("DB: Checking if code for domain: " + domain_name + " is not verified...");
  query = "SELECT 1 AS 'exist' \
      FROM stats_contact_history \
      INNER JOIN listings \
      ON listings.id = stats_contact_history.listing_id \
      WHERE listings.domain_name = ? \
      AND stats_contact_history.verification_code = ? \
      AND stats_contact_history.verified IS NULL "
  data_query(query, "Failed to get traffic for domain: " + domain_name + "!", callback, [domain_name, verification_code]);
}

//</editor-fold>

//<editor-fold>-------------------------------GETS-------------------------------

//gets all listing traffic grouped by month
data_model.prototype.getListingTraffic = function(domain_name, callback){
  console.log("DB: Attempting to get traffic for domain: " + domain_name + "...");
  query = "SELECT \
        2592000000 * (stats_search_history.timestamp div 2592000000) as 'from_time', \
        2592000000 * (stats_search_history.timestamp div 2592000000) + 2629746000 as 'to_time', \
        COUNT(*) as views \
      FROM stats_search_history \
    WHERE domain_name = ? \
    GROUP BY stats_search_history.timestamp div 2592000000 \
    ORDER BY from_time DESC "
  data_query(query, "Failed to get traffic for domain: " + domain_name + "!", callback, domain_name);
}

//gets all views for a specific listing's rentals
data_model.prototype.getRentalTraffic = function(domain_name, callback){
  console.log("DB: Attempting to get rental traffic for domain: " + domain_name + "...");
  query = 'SELECT \
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
  listing_query(query, "Failed to get rental traffic for " + domain_name + "!", callback, domain_name);
}

//gets all views for a specific listing that came from a rental
data_model.prototype.getListingRentalTraffic = function(domain_name, callback){
  console.log("DB: Attempting to get listing traffic for domain: " + domain_name + " that came from rentals...");
  query = 'SELECT \
        stats_search_history.rental_id, \
        count(stats_search_history.timestamp) AS views \
      FROM stats_search_history \
      WHERE stats_search_history.domain_name = ? \
      AND stats_search_history.rental_id IS NOT NULL \
      GROUP BY stats_search_history.rental_id \
      ORDER BY stats_search_history.rental_id DESC '
  listing_query(query, "Failed to get listing traffic for " + domain_name + "!", callback, domain_name);
}

//gets all availability check history for a specific listing
data_model.prototype.getAvailCheckHistory = function(domain_name, callback){
  console.log("DB: Attempting to get avail check history for domain: " + domain_name + "...");
  query = 'SELECT \
        stats_availcheck_history.* \
      FROM stats_availcheck_history \
      WHERE stats_availcheck_history.domain_name = ? \
      ORDER BY timestamp DESC '
  listing_query(query, "Failed to get avail check history for " + domain_name + "!", callback, domain_name);
}

//gets all availability check history for a specific listing
data_model.prototype.getCheckoutHistory = function(domain_name, callback){
  console.log("DB: Attempting to get checkout history for domain: " + domain_name + "...");
  query = 'SELECT \
        stats_checkout_history.rental_id, \
        stats_checkout_history.timestamp, \
        stats_checkout_history.path, \
        stats_checkout_history.starttime, \
        stats_checkout_history.endtime \
      FROM stats_checkout_history \
      WHERE stats_checkout_history.domain_name = ? \
      ORDER BY timestamp DESC '
  listing_query(query, "Failed to get checkout history for " + domain_name + "!", callback, domain_name);
}

//gets all availability check history for a specific listing
data_model.prototype.getCheckoutActions = function(domain_name, callback){
  console.log("DB: Attempting to get checkout actions for domain: " + domain_name + "...");
  query = 'SELECT \
        stats_checkout_actions.rental_id, \
        stats_checkout_actions.timestamp, \
        stats_checkout_actions.user_ip, \
        stats_checkout_actions.elem_id \
      FROM stats_checkout_actions \
      WHERE stats_checkout_actions.domain_name = ? \
      ORDER BY timestamp DESC '
  listing_query(query, "Failed to get checkout actions for " + domain_name + "!", callback, domain_name);
}

//gets specific offer details for a specific domain by offer ID
data_model.prototype.getListingOffererContactInfoByID = function(domain_name, offer_id, callback){
  console.log("DB: Attempting to get contact info for an offer for domain: " + domain_name + " with id: " + offer_id + "...");
  query = 'SELECT \
        stats_contact_history.id, \
        stats_contact_history.name, \
        stats_contact_history.email, \
        stats_contact_history.phone, \
        stats_contact_history.offer, \
        stats_contact_history.message, \
        stats_contact_history.response, \
        stats_contact_history.accepted \
      FROM stats_contact_history \
      INNER JOIN listings \
      ON listings.id = stats_contact_history.listing_id \
      WHERE listings.domain_name = ? \
      AND stats_contact_history.id = ? \
      AND stats_contact_history.verified = 1 '
  listing_query(query, "Failed to get contact info for an offer for " + domain_name + "!", callback, [domain_name, offer_id]);
}

//gets specific offer details for a specific domain by verification code
data_model.prototype.getListingOffererContactInfoByCode = function(domain_name, verification_code, callback){
  console.log("DB: Attempting to get contact info for an offer for domain: " + domain_name + " with code: " + verification_code + "...");
  query = 'SELECT \
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
  listing_query(query, "Failed to get contact info for an offer for " + domain_name + "!", callback, [domain_name, verification_code]);
}

//gets all offers for a specific domain
data_model.prototype.getListingOffers = function(domain_name, callback){
  console.log("DB: Attempting to get all verified offers for domain: " + domain_name + "...");
  query = 'SELECT \
        stats_contact_history.id, \
        stats_contact_history.timestamp, \
        stats_contact_history.name, \
        stats_contact_history.email, \
        stats_contact_history.phone, \
        stats_contact_history.offer, \
        stats_contact_history.message, \
        stats_contact_history.response, \
        IFNULL(stats_contact_history.accepted, -1) as accepted, \
        stats_contact_history.bin \
      FROM stats_contact_history \
      INNER JOIN listings \
      ON listings.id = stats_contact_history.listing_id \
      WHERE listings.domain_name = ? \
      AND stats_contact_history.verified = 1'
  listing_query(query, "Failed to get offers for " + domain_name + "!", callback, domain_name);
}

//gets statistics for a specific domain
data_model.prototype.getListingStats = function(domain_name, callback){
  console.log("DB: Attempting to get statistics for domain: " + domain_name + "...");
  query = 'SELECT \
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
  listing_query(query, "Failed to get statistics for " + domain_name + "!", callback, domain_name);
}

//</editor-fold>

//<editor-fold>-------------------------------SETS-------------------------------

//creates a new entry for a listing data row
data_model.prototype.newListingHistory = function(history_info, callback){
  console.log("DB: Adding new search history item for " + history_info.domain_name + "...");
  query = "INSERT INTO stats_search_history \
      SET ? "
  data_query(query, "Failed to add search history for " + history_info.domain_name + "!", callback, history_info);
}

//creates a new entry for a listing contact data row
data_model.prototype.newListingContactHistory = function(domain_name, history_info, callback){
  console.log("DB: Adding new purchase contact history item for " + domain_name + "...");
  query = "INSERT INTO stats_contact_history \
      SET ? "
  data_query(query, "Failed to add purchase contact history for " + domain_name + "!", callback, history_info);
}

//creates a new entry for a rental history data row
data_model.prototype.newRentalHistory = function(history_info, callback){
  console.log("DB: Adding new rental history item for rental #" + history_info.rental_id + "...");
  query = "INSERT INTO stats_rental_history \
      SET ? "
  data_query(query, "Failed to add rental view history for rental #" + history_info.rental_id + "!", callback, history_info);
}

//creates a new entry for a checked availability history data row
data_model.prototype.newCheckAvailHistory = function(history_info, callback){
  console.log("DB: Adding new availability check history item for domain: " + history_info.domain_name + "...");
  query = "INSERT INTO stats_availcheck_history \
      SET ? "
  data_query(query, "Failed to add availability check history item for domain:" + history_info.domain_name + "!", callback, history_info);
}

//creates a new entry for a checkout history data row
data_model.prototype.newCheckoutHistory = function(history_info, callback){
  console.log("DB: Adding new checkout history item for domain: " + history_info.domain_name + "...");
  query = "INSERT INTO stats_checkout_history \
      SET ? "
  data_query(query, "Failed to add checkout check history item for domain:" + history_info.domain_name + "!", callback, history_info);
}

//creates a new entry for a checkout action data row
data_model.prototype.newCheckoutAction = function(history_info, callback){
  console.log("DB: Adding new checkout action item for domain: " + history_info.domain_name + "...");
  query = "INSERT INTO stats_checkout_actions \
      SET ? "
  data_query(query, "Failed to add checkout check action item for domain:" + history_info.domain_name + "!", callback, history_info);
}

// //creates new rental times for unavailable listings
// //BULK INSERT NEEDS TRIPLE NESTED ARRAYS
// data_model.prototype.newDesiredRentalTimes = function(domain_name, desired_times_info, callback){
//   console.log("DB: Attempting to create new desired times for domain" + domain_name + "...");
//   query = "INSERT INTO stats_desired_times (domain_name, timestamp, start_date, duration, account_id, user_ip) VALUES ? ";
//   data_query(query, "Failed to add new desired times for domain" + domain_name + "!", callback, [desired_times_info]);
// }
//
// //gets the maximum and minimum prices for all domains
// data_model.prototype.getMinMaxPrices = function(callback){
//   console.log("DB: Attempting to get maximum and minimum prices for all domains...");
//   query = "SELECT \
//         MIN(hour_price) AS min_hour_price, \
//         MAX(hour_price) AS max_hour_price, \
//         MIN(day_price) AS min_day_price, \
//         MAX(day_price) AS max_day_price, \
//         MIN(week_price) AS min_week_price, \
//         MAX(week_price) AS max_week_price, \
//         MIN(month_price) AS min_month_price, \
//         MAX(month_price) AS max_month_price \
//       FROM `listings` \
//       WHERE listings.status >= 1";
//   data_query(query, "Failed to get maxmimum and minimum prices for all domains!", callback);
// }

//</editor-fold>

//<editor-fold>-------------------------------UPDATES-------------------------------

//verifies the email on the offer contact history db
data_model.prototype.verifyContactHistory = function(verification_code, domain_name, callback){
  console.log("DB: Verifying contact history on domain " + domain_name + " with code: " + verification_code + "...");
  query = "UPDATE stats_contact_history \
      INNER JOIN listings \
      ON listings.id = stats_contact_history.listing_id \
      SET stats_contact_history.verified = true \
      WHERE stats_contact_history.verification_code = ? \
      AND listings.domain_name = ?"
  account_query(query, "Failed to verify contact history!", callback, [verification_code, domain_name]);
}

//accept or reject an offer
data_model.prototype.acceptRejectOffer = function(contact_item, domain_name, offer_id, callback){
  var accept_text = (contact_item.accepted) ? "Accepting " : "Rejecting ";
  console.log("DB: " + accept_text + " offer on domain with id: " + offer_id + " on domain: " + domain_name + "...");
  query = "UPDATE stats_contact_history \
      INNER JOIN listings \
      ON listings.id = stats_contact_history.listing_id \
      SET ? \
      WHERE stats_contact_history.id = ? \
      AND listings.domain_name = ?"
  account_query(query, "Failed to accept/reject offer!", callback, [contact_item, offer_id, domain_name]);
}

//</editor-fold>
