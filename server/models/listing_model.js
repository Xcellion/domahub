var database = require('../lib/database.js');

//GET - 'SELECT * from ?? WHERE ?? = ?'
//UPDATE SET - 'UPDATE ?? SET ? WHERE ?? = ?'
//INSERT SET - 'INSERT INTO ?? SET ?'
//INSERT BULK - 'INSERT INTO ?? (??) VALUES ?'
//DELETE - 'DELETE FROM ?? WHERE ?? = ?'

//database.query(query, client_error_msg_when_errored, callback, posting_params)

module.exports = {

  //<editor-fold>-------------------------------CHECKS-------------------------------

  //check if a listing exists
  checkListing : function(domain_name, callback){
    console.log("DB: Checking to see if " + domain_name + " is listed on DomaHub...");
    var query = 'SELECT 1 AS "exist" FROM listings WHERE domain_name = ? AND listings.deleted IS NULL'
    database.query(query, "Listing does not exist!", callback, domain_name);
  },

  //check if an account owns a listing
  checkListingOwner : function(account_id, domain_name, callback){
    console.log("DB: Checking to see if account #" + account_id + " owns domain " + domain_name + "...");
    var query = 'SELECT 1 AS "exist" FROM listings WHERE owner_id = ? AND domain_name = ? AND listings.deleted IS NULL'
    database.query(query, "Account does not own the domain" + domain_name + "!", callback, [account_id, domain_name]);
  },

  //check if a listing has been purchased already
  checkListingPurchased : function(domain_name, callback){
    console.log("DB: Checking to see if domain " + domain_name + " has been purchased...");
    var query = 'SELECT 1 AS "exist" FROM listings \
        INNER JOIN stats_contact_history ON \
        stats_contact_history.listing_id = listings.id \
        WHERE stats_contact_history.verification_code IS NOT NULL \
        AND stats_contact_history.bin = 1 \
        AND listings.domain_name = ?'
    database.query(query, "Failed to check if domain has been bought already!" + domain_name + "!", callback, [domain_name]);
  },

  //check a purchase verfication code for a listing
  checkListingPurchaseVerificationCode : function(domain_name, verification_code, callback){
    console.log("DB: Checking if verification code for domain " + domain_name + " is correct...");
    var query = 'SELECT 1 AS "exist" FROM listings \
        INNER JOIN stats_contact_history ON \
        stats_contact_history.listing_id = listings.id \
        WHERE listings.domain_name = ? AND stats_contact_history.verification_code = ?'
    database.query(query, "Failed to check if verification code for domain is correct!" + domain_name + "!", callback, [domain_name, verification_code]);
  },

  //check if listing(s) are currently rented
  checkCurrentlyRented : function(domain_names, callback){
    console.log("DB: Checking if domain(s) are currently rented...");
    var query = "SELECT 1 AS 'exist' \
          FROM rentals \
        LEFT JOIN listings \
          ON rentals.listing_id = listings.id \
        LEFT OUTER JOIN rental_times \
          ON rentals.rental_id = rental_times.rental_id \
        WHERE \
          (listings.domain_name IN (?) \
          OR listings.id IN (?)) \
          AND (UNIX_TIMESTAMP(NOW()) * 1000) BETWEEN rental_times.date AND rental_times.date + rental_times.duration \
          AND listings.status = 1 \
          AND listings.verified = 1 \
          AND listings.deleted IS NULL \
          AND rentals.status = 1";
    database.query(query, "Failed to check if domain(s) are currently rented!", callback, [domain_names, domain_names]);
  },

  //turns off listings above 100 count (for cancellation of premium)
  selectAbove100Listings : function(stripe_customer_id, callback){
    console.log("DB: Attempting to get any listings above 100 basic limit...");
    var query = "SELECT listings.id \
    FROM listings \
    INNER JOIN accounts \
    ON accounts.id = listings.owner_id \
    WHERE (accounts.stripe_customer_id = ?) \
    LIMIT 100, 18446744073709551615"
    database.query(query, "Failed to get listings above 100 basic limit!", callback, stripe_customer_id);
  },

  //</editor-fold>

  //<editor-fold>-------------------------------NEW/EDIT EXISTING LISTING-------------------------------

  //creates a new listing
  newListing : function(listing_info, callback){
    console.log("DB: Attempting to create a new listing: " + listing_info.domain_name + "...");
    var query = "INSERT INTO listings \
        SET ? "
    database.query(query, "Failed to create a new listing: " + listing_info.domain_name + "!", callback, listing_info);
  },

  //creates multiple new listings
  //BULK INSERT NEEDS TRIPLE NESTED ARRAYS
  newListings : function(listing_info_array, callback){
    console.log("DB: Attempting to create " + listing_info_array.length + " new listings...");
    var query = "INSERT INTO listings ( \
          owner_id, \
          date_created, \
          domain_name, \
          registrar_id, \
          min_price, \
          buy_price, \
          description, \
          date_expire, \
          date_registered, \
          registrar_name \
        )\
         VALUES ? \
         ON DUPLICATE KEY UPDATE \
         registrar_id = CASE WHEN (owner_id = VALUES(owner_id) AND deleted IS NOT NULL) \
          THEN VALUES(registrar_id) ELSE registrar_id END \
         ,min_price = CASE WHEN (owner_id = VALUES(owner_id) AND deleted IS NOT NULL) \
           THEN VALUES(min_price) ELSE min_price END \
         ,buy_price = CASE WHEN (owner_id = VALUES(owner_id) AND deleted IS NOT NULL) \
           THEN VALUES(buy_price) ELSE buy_price END \
         ,description = CASE WHEN (owner_id = VALUES(owner_id) AND deleted IS NOT NULL) \
           THEN VALUES(description) ELSE description END \
         ,date_created = CASE WHEN (owner_id = VALUES(owner_id) AND deleted IS NOT NULL) \
           THEN VALUES(date_created) ELSE date_created END \
         ,deleted = CASE WHEN (owner_id = VALUES(owner_id) AND deleted IS NOT NULL) \
           THEN NULL ELSE deleted END "
    database.query(query, "Failed to create " + listing_info_array.length + " new listings! Please refresh the page and try again.", callback, [listing_info_array]);
  },

  //updates listing info
  updateListingsInfo : function(domains, listing_info, callback){
    console.log("DB: Attempting to update domain(s)...");
    var query = "UPDATE listings \
        SET ? \
        WHERE (listings.domain_name IN (?) OR listings.id IN (CAST(? AS CHAR)))"
    database.query(query, "Failed to update domain(s)!", callback, [listing_info, domains, domains]);
  },

  //updates listing registrar info (for getting registrar related info after creation)
  updateListingsRegistrarInfo : function(listing_info, callback){
    console.log("DB: Attempting to update registrar info for domain(s)...");
    var query = "INSERT INTO listings \
        ( \
          id, \
          registrar_name, \
          date_expire, \
          date_registered, \
          registrar_admin_name, \
          registrar_admin_org, \
          registrar_admin_email, \
          registrar_admin_address, \
          registrar_admin_phone, \
          registrar_registrant_name, \
          registrar_registrant_org, \
          registrar_registrant_email, \
          registrar_registrant_address, \
          registrar_registrant_phone, \
          registrar_tech_name, \
          registrar_tech_org, \
          registrar_tech_email, \
          registrar_tech_address, \
          registrar_tech_phone \
        ) \
        VALUES ? \
        ON DUPLICATE KEY UPDATE \
          registrar_name = VALUES(registrar_name), \
          date_expire = VALUES(date_expire), \
          date_registered = VALUES(date_registered), \
          registrar_admin_name = VALUES(registrar_admin_name), \
          registrar_admin_org = VALUES(registrar_admin_org), \
          registrar_admin_email = VALUES(registrar_admin_email), \
          registrar_admin_address = VALUES(registrar_admin_address), \
          registrar_admin_phone = VALUES(registrar_admin_phone), \
          registrar_registrant_name = VALUES(registrar_registrant_name), \
          registrar_registrant_org = VALUES(registrar_registrant_org), \
          registrar_registrant_email = VALUES(registrar_registrant_email), \
          registrar_registrant_address = VALUES(registrar_registrant_address), \
          registrar_registrant_phone = VALUES(registrar_registrant_phone), \
          registrar_tech_name = VALUES(registrar_tech_name), \
          registrar_tech_org = VALUES(registrar_tech_org), \
          registrar_tech_email = VALUES(registrar_tech_email), \
          registrar_tech_address = VALUES(registrar_tech_address), \
          registrar_tech_phone = VALUES(registrar_tech_phone)"
    database.query(query, "Failed to update registrar info for domain(s)!", callback, [listing_info]);
  },

  //updates multiple listings, needs to be all created without error, or else cant figure out insert IDs
  updateListingsVerified : function(listing_ids, callback){
    console.log("DB: Attempting to revert verified status for bulk domain creation...");
    var query = "INSERT INTO listings \
          (id) \
        VALUES ? \
        ON DUPLICATE KEY UPDATE verified = NULL"
    database.query(query, "Failed to revert verified status for bulk domain creation!", callback, [listing_ids]);
  },

  //verifies multiple listings
  //BULK INSERT NEEDS TRIPLE NESTED ARRAYS
  verifyListings : function(listings_to_verify, callback){
    console.log("DB: Attempting to verify " + listings_to_verify.length + " listings...");
    var query = "INSERT INTO listings ( \
      id, \
      verified, \
      status \
    )\
    VALUES ? \
    ON DUPLICATE KEY UPDATE \
    id = VALUES(id), \
    verified = VALUES(verified), \
    status = VALUES(status) "
    database.query(query, "Failed to deactivate " + listings_to_verify.length + " listings!", callback, [listings_to_verify]);
  },

  //</editor-fold>

  //<editor-fold>-------------------------------DELETE LISTING-------------------------------

  //deletes a specific listing
  deleteListing : function(listing_id, callback){
    console.log("DB: Attempting to delete listing #" + listing_id + "...");
    var query = "UPDATE listings \
        SET deleted = 1, \
            status = 0 \
        WHERE id = ? "
    database.query(query, "Failed to delete listing #" + listing_id + "!", callback, listing_id);
  },

  //sets multiple listings to inactive
  //BULK INSERT NEEDS TRIPLE NESTED ARRAYS
  deleteListings : function(listings_to_delete, callback){
    console.log("DB: Attempting to deactivate " + listings_to_delete.length + " listings...");
    var query = "INSERT INTO listings ( \
      id \
    )\
    VALUES ? \
    ON DUPLICATE KEY UPDATE \
      deleted = 1, \
      status = NULL "
    database.query(query, "Failed to deactivate " + listings_to_delete.length + " listings!", callback, [listings_to_delete]);
  },

  //</editor-fold>

  //<editor-fold>-------------------------------DOMAIN EXPENSE-------------------------------

  //get any existing domain expenses for listings
  getDomainExpenses : function(listing_ids, callback){
    console.log("DB: Attempting to get existing domain expenses...");
    var query = "SELECT * FROM domain_expenses \
    WHERE listing_id IN (?) \
    ORDER BY listing_id, id "
    database.query(query, "Failed to get existing domain expenses!", callback, [listing_ids]);
  },

  //insert new domain expense(s)
  newDomainExpenses : function(domain_expenses, callback){
    console.log("DB: Attempting to create new domain expenses...");
    var query = "INSERT INTO domain_expenses ( \
      listing_id, \
      expense_name, \
      expense_cost, \
      expense_date \
    ) VALUES ? ON DUPLICATE KEY UPDATE \
    expense_name = VALUES(expense_name), \
    expense_cost = VALUES(expense_cost), \
    expense_date = VALUES(expense_date)"
    database.query(query, "Failed to create new expenses!", callback, [domain_expenses]);
  },

  //delete existing domain expense(s)
  deleteDomainExpenses : function(expense_ids, callback){
    console.log("DB: Attempting to delete existing domain expenses...");
    var query = "DELETE FROM domain_expenses \
    WHERE id IN (?)"
    database.query(query, "Failed to delete existing domain expenses!", callback, [expense_ids]);
  },

  //</editor-fold>

  //<editor-fold>-------------------------------DOMAIN RENTAL-------------------------------

  //check if rental time is okay
  crossCheckRentalTime : function(domain_name, path, starttime, endtime, callback){
    console.log("DB: Checking times for " + domain_name + "/" + path + "...");
    var query = 'SELECT 1 AS "exist" \
        FROM rentals \
        INNER JOIN rental_times \
          ON rentals.rental_id = rental_times.rental_id \
        INNER JOIN listings \
          ON listings.id = rentals.listing_id \
        WHERE \
          listings.domain_name = ? AND \
          rentals.path = ? AND \
          rentals.status = 1 AND \
          listings.deleted IS NULL AND ((\
          ? < rental_times.date + rental_times.duration) AND ( \
          ? > rental_times.date))'
    database.query(query, "Failed to check times for " + domain_name + "/" + path + "!", callback, [domain_name, path, starttime, endtime, starttime, endtime]);
  },

  //gets all rental info for a specific rental
  getRentalInfo : function(rental_id, callback){
    console.log("DB: Attempting to get all rental info for rental #" + rental_id + "...");
    var query = "SELECT \
          rentals.*, \
          listings.domain_name \
        FROM rentals \
        INNER JOIN listings \
          ON listings.id = rentals.listing_id \
        WHERE rental_id = ?"
    database.query(query, "Failed to get all info for rental #" + rental_id + "!", callback, rental_id);
  },

  //gets all rental information for the current rental
  getCurrentRental : function(domain_name, path, callback){
    console.log("DB: Attempting to get current rental info for for domain " + domain_name + "...");
    var query = "SELECT \
          rentals.*,\
          listings.domain_name,\
          listings.description_hook,\
          listings.description_footer,\
          listings.id,\
          rental_times.date,\
          rental_times.duration \
        FROM rentals \
        LEFT JOIN listings \
        ON rentals.listing_id = listings.id \
        LEFT OUTER JOIN rental_times \
        ON rentals.rental_id = rental_times.rental_id \
        WHERE listings.domain_name = ? \
        AND (UNIX_TIMESTAMP(NOW()) * 1000) BETWEEN rental_times.date AND rental_times.date + rental_times.duration \
        AND rentals.path = ? \
        AND listings.status = 1 \
        AND listings.verified = 1 \
        AND listings.deleted IS NULL \
        AND rentals.status = 1";
    database.query(query, "Failed to get current rental info for domain " + domain_name + "!", callback, [domain_name, path]);
  },

  //gets all rental times for a specific rental
  getRentalRentalTimes : function(rental_id, callback){
    console.log("DB: Attempting to get rental times for rental #" + rental_id + "...");
    var query = "SELECT \
          rental_id, \
          date, \
          duration \
        FROM rental_times \
        WHERE rental_id = ?\
        ORDER BY date ASC"
    database.query(query, "Failed to get rental times for rental #" + rental_id + "!", callback, rental_id);
  },

  //creates a new rental under a listing
  newListingRental : function(listing_id, rental_info, callback){
    console.log("DB: Attempting to create a new rental for listing #" + listing_id + "...");
    var query = "INSERT INTO rentals \
    SET ? "
    database.query(query, "Failed to add a new rental for listing #" + listing_id + "!", callback, rental_info);
  },

  //creates new rental times for a specific rental
  //BULK INSERT NEEDS TRIPLE NESTED ARRAYS
  newRentalTimes : function(rental_id, rental_times, callback){
    console.log("DB: Attempting to create new rental times for rental #" + rental_id + "...");
    var query = "INSERT INTO rental_times (rental_id, date, duration) VALUES ? ON DUPLICATE KEY UPDATE \
    rental_id = VALUES(rental_id), \
    date = VALUES(date), \
    duration = VALUES(duration)"
    database.query(query, "Failed to add new rental times for rental #" + rental_id + "!", callback, [rental_times]);
  },

  //updates rental info
  updateRental : function(rental_id, rental_info, callback){
    console.log("DB: Attempting to update rental #" + rental_id + "...");
    var query = "UPDATE rentals \
        SET ? \
        WHERE rental_id = ?"
    database.query(query, "Failed to update rental #" + rental_id + "!", callback, [rental_info, rental_id]);
  },

  //updates rental times if for the same rental
  updateRentalTime : function(new_rental_times, callback){
    console.log("DB: Attempting to update rental time #" + rental_time_id + "...");
    var query = "UPDATE rental_times \
        SET duration = ? \
        WHERE id = ?"
    database.query(query, "Failed to update rental #" + rental_id + "!", callback, new_rental_times);
  },

  //toggles the rental active or inactive
  toggleActivateRental : function(rental_id, callback){
    console.log("DB: Attempting to toggle activation on rental #" + rental_id + "...");
    var query = "UPDATE rentals \
        SET status = !status \
        WHERE rental_id = ?"
    database.query(query, "Failed to toggle activation on rental #" + rental_id + "!", callback, rental_id);
  },

  //deletes a specific rental
  deleteRental : function(rental_id, callback){
    console.log("DB: Attempting to de-activate rental #" + rental_id + "...");
    var query = "UPDATE rentals \
        SET status = 0 \
        WHERE rental_id = ? "
    database.query(query, "Failed to de-activate rental #" + rental_id + "!", callback, rental_id);
  },

  //sets multiple rentals to inactive
  //BULK INSERT NEEDS TRIPLE NESTED ARRAYS
  deleteRentals : function(rentals_to_delete, callback){
    console.log("DB: Attempting to delete " + rentals_to_delete.length + " rentals...");
    var query = "INSERT INTO rentals ( \
      rental_id \
    )\
    VALUES ? \
    ON DUPLICATE KEY UPDATE \
      status = 0"
    database.query(query, "Failed to delete " + rentals_to_delete.length + " rentals!", callback, [rentals_to_delete]);
  },

  //</editor-fold>

  //<editor-fold>-------------------------------DISPLAY A LISTING-------------------------------

  //gets all info for an active listing including owner name and email
  getVerifiedListing : function(domain_name, callback){
    console.log("DB: Attempting to get active listing information for " + domain_name + "...");
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
          accounts.username, \
          accounts.email AS owner_email, \
          accounts.stripe_subscription_id, \
          !ISNULL(accounts.stripe_account_id) AS stripe_connected, \
          accounts.date_created AS user_created, \
          offers_table.deposited \
        FROM listings \
        JOIN accounts ON listings.owner_id = accounts.id \
        LEFT JOIN \
          (SELECT DISTINCT\
            stats_contact_history.listing_id as listing_id, \
            stats_contact_history.deposited IS NOT NULL AS deposited \
          FROM stats_contact_history \
          WHERE stats_contact_history.deposited = 1 \
        ) as offers_table \
        ON offers_table.listing_id = listings.id \
        WHERE listings.domain_name = ? \
        AND listings.verified = 1 \
        AND listings.deleted IS NULL";
    database.query(query, "Failed to get active listing info for " + domain_name + "!", callback, domain_name);
  },

  //gets contact info for an active/verified listing
  getListingOwnerContactInfo : function(domain_name, callback){
    console.log("DB: Attempting to get contact info for " + domain_name + "...");
    var query = "SELECT \
          accounts.username,\
          accounts.email\
        FROM listings \
        JOIN accounts ON listings.owner_id = accounts.id \
        WHERE listings.domain_name = ? \
        AND listings.verified = 1 \
        AND listings.deleted IS NULL";
    database.query(query, "Failed to get contact info for " + domain_name + "!", callback, domain_name);
  },

  //gets X number of rentals at a time
  getListingRentals : function(domain_name, oldest_rental_date, count, callback){
    console.log("DB: Attempting to get " + count + " rentals for domain: " + domain_name + " after " + oldest_rental_date + "...");
    var query = "SELECT \
          rentals.address, \
          rentals.rental_id, \
          rentals.type, \
          rentals.path, \
          rental_times.date, \
          rental_times.duration, \
          accounts.username, \
          IFNULL(rental_s.views, 0) as views \
        FROM rentals \
        INNER JOIN rental_times ON rentals.rental_id = rental_times.rental_id \
        LEFT JOIN accounts ON rentals.account_id = accounts.id \
        LEFT JOIN listings ON rentals.listing_id = listings.id \
        LEFT OUTER JOIN ( \
          SELECT rental_id, COUNT(rental_id) AS views FROM stats_rental_history GROUP BY rental_id \
        ) AS rental_s \
        ON rental_s.rental_id = rentals.rental_id \
        WHERE listings.domain_name = ? \
        AND rentals.status = 1 \
        AND rental_times.date < ? \
        ORDER BY rental_times.date DESC \
        LIMIT ?"
    database.query(query, "Failed to get all existing active rentals for domain: " + domain_name + "!", callback, [domain_name, oldest_rental_date, count]);
  },

  //gets all rental times for a specific listing and path
  getListingTimes : function(domain_name, path, max_date, callback){
    console.log("DB: Attempting to get times for domain: " + domain_name + "...");
    var query = "SELECT \
          rental_times.date, \
          rental_times.duration \
        FROM rental_times \
        INNER JOIN rentals ON rentals.rental_id = rental_times.rental_id \
        INNER JOIN listings ON rentals.listing_id = listings.id \
        WHERE listings.domain_name = ? \
        AND listings.status = 1 \
        AND rentals.path = ? \
        AND rentals.status = 1 \
        AND rental_times.date <= ? \
        AND rental_times.date + rental_times.duration >= (UNIX_TIMESTAMP(NOW()) * 1000) \
        ORDER BY rental_times.date ASC "
    database.query(query, "Failed to get times for domain: " + domain_name + "!", callback, [domain_name, path, max_date]);
  },

  //gets all free rental times for a specific listing
  getListingFreeTimes : function(domain_name, callback){
    console.log("DB: Attempting to get free times for domain: " + domain_name + "...");
    var query = "SELECT \
          listing_free_times.date, \
          listing_free_times.duration \
        FROM listing_free_times \
        INNER JOIN listings ON listing_free_times.listing_id = listings.id \
        WHERE listings.domain_name = ? \
        AND listings.status = 1 \
        AND listing_free_times.date + listing_free_times.duration >= UNIX_TIMESTAMP() * 1000 \
        ORDER BY listing_free_times.date ASC "
    database.query(query, "Failed to get free times for domain: " + domain_name + "!", callback, domain_name);
  },

  //gets listings owned by the same owner
  getListingsByOwner : function(hub_id, owner_id, callback){
    console.log("DB: Attempting to get other listings by the same owner...");
    var query = "SELECT \
          listings.*, \
          listing_hub_grouping.rank, \
          listing_hub_grouping.listing_hub_id \
        FROM listings \
        LEFT JOIN listing_hub_grouping \
        ON listing_hub_grouping.listing_id = listings.id \
        WHERE listings.id != ? \
        AND listings.owner_id = ? \
        AND listings.status = 1 \
        AND listings.verified = 1 \
        AND listings.deleted IS NULL \
        ORDER BY listings.id"
    database.query(query, "Failed to get other listings by the same owner!", callback, [hub_id, owner_id]);
  },

  //</editor-fold>

  //<editor-fold>-------------------------------LISTING HUB-------------------------------

  //insert new listings into listing hubs
  addListingHubGrouping : function(formatted_hub_additions, callback){
    console.log("DB: Attempting to insert listings into listing hub...");
    var query = "INSERT INTO listing_hub_grouping (listing_id, listing_hub_id, rank) VALUES ? ON DUPLICATE KEY UPDATE \
      listing_id = VALUES(listing_id), \
      listing_hub_id = VALUES(listing_hub_id), \
      rank = VALUES(rank)"
    database.query(query, "Failed to insert listings into listing hub!", callback, [formatted_hub_additions]);
  },

  //deletes all listings from multiple hubs
  deleteHubGroupings : function(listing_hub_ids, callback){
    console.log("DB: Attempting to delete all listings from multiple hubs...");
    var query = "DELETE FROM listing_hub_grouping \
        WHERE listing_hub_id IN (?)"
    database.query(query, "Failed to delete all listings for multiple hubs!", callback, [listing_hub_ids]);
  },

  //</editor-fold>

  //<editor-fold>----------------SEARCH FOR A SPECIFIC LISTING PAGE (DEPRECATED)-------------------------------

  //gets all active listings with X category, X domain name, X price -- and all active rentals/rental_times for them
  getListingByFilter : function(filter_name, filter_price, filter_date, callback){
    console.log("DB: Attempting to search for a listing...");
    var query = "SELECT \
    listings.domain_name, \
    listings.hour_price, \
    listings.day_price, \
    listings.week_price, \
    listings.month_price, \
    listings.categories, \
    rentals.rental_id, \
    rental_times.date, \
    rental_times.duration \
    FROM listings \
    LEFT JOIN rentals \
    ON rentals.listing_id = listings.id \
    LEFT JOIN rental_times \
    ON rental_times.rental_id = rentals.rental_id \
    WHERE listings.status = 1 \
    AND listings.verified = 1 \
    AND listings.deleted IS NULL \
    AND listings.domain_name LIKE ? \
    AND listings." + filter_price.type + " BETWEEN ? AND ? \
    ORDER BY listings.id ASC, rentals.rental_id ASC, rental_times.date DESC";
    database.query(query, "Failed to search for listing!", callback, [
      filter_name,
      filter_price.min,
      filter_price.max
    ]);
  },

  //gets a handful of random listings for the search page
  getRandomListings : function(search_term, total, callback){
    console.log("DB: Attempting to get 10 random listings...");
    var query = "SELECT \
    listings.id, \
    listings.domain_name, \
    listings.price_rate, \
    listings.price_type \
    FROM listings \
    INNER JOIN accounts \
    ON accounts.id = listings.owner_id \
    WHERE listings.status = 1 \
    AND listings.verified = 1 \
    AND listings.deleted IS NULL \
    AND accounts.stripe_account_id IS NOT NULL \
    AND listings.domain_name LIKE ? \
    ORDER BY listings.domain_name ASC \
    LIMIT ?, 10";
    database.query(query, "Failed to get 10 random listings!", callback, [search_term, total]);
  },

  //gets 3 random listings
  getThreeRandomListings : function(domain_name_exclude, callback){
    console.log("DB: Attempting to get 3 random listings...");
    var query = "SELECT \
    listings.domain_name, \
    listings.background_image, \
    listings.price_type, \
    listings.price_rate \
    FROM listings \
    WHERE listings.domain_name != ? \
    AND listings.status = 1 \
    AND listings.verified = 1 \
    AND listings.deleted IS NULL \
    AND listings.categories NOT LIKE '%adult%' \
    ORDER BY RAND() \
    LIMIT 3"
    database.query(query, "Failed to get related 3 random listings!", callback, domain_name_exclude);
  },

  //gets listings related to specific categories
  getRelatedListings : function(categories, domain_name_exclude, callback){
    console.log("DB: Attempting to get related listings with categories: " + categories + "...");
    var query = "SELECT \
    listings.domain_name, \
    listings.background_image, \
    listings.price_type, \
    listings.price_rate \
    FROM listings \
    WHERE categories REGEXP ? \
    AND listings.domain_name != ? \
    AND listings.status = 1 \
    AND listings.verified = 1 \
    AND listings.deleted IS NULL \
    ORDER BY RAND() \
    LIMIT 3"
    database.query(query, "Failed to get related listings with categories: " + categories + "!", callback, [categories, domain_name_exclude]);
  },

  //gets all rental times for a specific listing to cross check against a new rental (see checkRentalTime)
  getRandomListingByCategory : function(category, callback){
    console.log("DB: Attempting to get a random listing with category: " + category + "...");
    var query = "SELECT \
    listings.domain_name \
    FROM listings \
    WHERE categories LIKE ? \
    ORDER BY RAND() LIMIT 1"
    database.query(query, "Failed to get a random listing with category: " + category + "!", callback, category);
  },

  //</editor-fold>

}
