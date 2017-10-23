$(document).ready(function() {
  calcUnverified();
  calcOffers();
  calcSold();
  showNotifications();

  //delete notification when you click its respective X
  $("#notifications-tray .delete").on("click", function() {
    $(this).parent().remove();
    calcNotificationCounter();
  });

  //referral link
  $("#referral-link").on("focus", function(){
    $(this).select();
  });
  $("#referral-link-copy").on("click", function(){
    $("#referral-link").select();
    document.execCommand("copy");
    $("#referral-link").blur();
    $(this).find("i").removeClass("fa-clipboard").addClass('fa-check');
    $(this).find("p").text("Copied!");
  });

});

//find out how many domains are unverified
function calcUnverified() {
  var unverified_listings = user.listings.filter(function(listing) {
    return !listing.verified;
  });
  if (unverified_listings.length > 0){
    appendNotification("Verify " + unverified_listings.length + " <a tabindex='0' class='is-primary is-underlined' href='/profile/mylistings?tab=verify'>unverified domains</a>.", true);
  }
}

//find out how many offers per domain
function calcOffers(){
  var num_total_offers = user.listings.reduce(function(arr, listing) {
    return arr + ((listing.offers_count) ? listing.offers_count : 0);
  }, 0) || 0;
  $("#offers-counter").text(num_total_offers);
}

//function to figure out sold domains
function calcSold(){
  $("#sold-counter").text(user.listings.filter(function(listing) {
    return listing.deposited || listing.transferred;
  }).length);
}

//populate the notifications tray
function showNotifications() {

  //if no listings
  if (!user.listings || user.listings.length == 0){
    appendNotification("Let's create some <a tabindex='0' class='is-primary is-underlined' href='/listings/create'>DomaHub listings</a>!", true);
  }

  //if stripe payout settings are not set
  if (!user.stripe_account) {
    appendNotification("Complete your <a tabindex='0' class='is-primary is-underlined' href='/profile/settings#payout-address'>payout settings</a> to start receiving payments.", true);
  }

  //if bank account is not connected
  if (!(user.stripe_info && user.stripe_info.transfers_enabled)) {
    appendNotification("Connect your <a tabindex='0' class='is-primary is-underlined' href='/profile/settings#payout-bank'>bank account</a> to start receiving payments.", true);
  }

  //if not premium
  if (!user.stripe_subscription_id){
    appendNotification("Sign up for a <a tabindex='0' class='is-primary is-underlined' href='/profile/settings#premium'>Premum account</a> and sell more domains.", true);
  }

  calcNotificationCounter();
}

//when notifications tray is empty
function calcNotificationCounter() {
  if ($("#notifications-tray li").length == 0) {
    appendNotification("Nothing to show - you're all set!", false);
    $("#notification-counter").addClass('is-hidden');
  }
  else {
    $("#notification-counter").text($("#notifications-tray li").length);
    document.title = "Dashboard (" +  $("#notifications-tray li").length + ") - DomaHub";
  }
}

function appendNotification(msg, delOption) {
  var tray = $("#notifications-tray");
  if (delOption) {
    return tray.append("<li><span class='delete is-small is-transparent is-fc'></span>" + msg + "</li>");
  }
  else {
    return tray.append("<li>" + msg + "</li>");
  }
}
