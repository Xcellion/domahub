$(document).ready(function() {
  calcUnverified();
  calcOffers();
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
    $("#referral-link-input").blur();
    $(this).find("i").removeClass("fa-clipboard").addClass('fa-check');
    $(this).find("p").text("Copied!");
  });

});

//find out how many domains are unverified
function calcUnverified() {
  var unverified_listings_id = user.listings.reduce(function(arr, listing) {
    if (!listing.verified) { arr.push(listing.id); }
    return arr;
  }, []);
  var unverified_href = "/profile/mylistings?listings=" + unverified_listings_id.join(",") + "&tab=verify";

  $("#unverified-counter").text(unverified_listings_id.length);
  if (unverified_listings_id.length > 0){
    appendNotification("Verify " + unverified_listings_id.length + " <a tabindex='0' class='is-underlined' href='" + unverified_href + "'>unverified domains</a>.", true);
    $("#unverified-button").attr("href", unverified_href);
  }
  else {
    $("#unverified-button").addClass("is-hidden");
  }
}

//find out how many offers per domain
function calcOffers(){
  var num_total_offers = user.listings.reduce(function(arr, listing) {
    return arr + ((listing.offers_count) ? listing.offers_count : 0);
  }, 0) || 0;
  $("#offers-counter").text(num_total_offers);
}

//populate the notifications tray
function showNotifications() {

  //if stripe payout settings are not set
  if (!user.stripe_account) {
    appendNotification("Complete your <a tabindex='0' class='is-underlined' href='/profile/settings#payout-address'>payout settings</a>.", true);
  }

  //if bank account is not connected
  if (!(user.stripe_info && user.stripe_info.transfers_enabled)) {
    appendNotification("Connect your <a tabindex='0' class='is-underlined' href='/profile/settings#payout-bank'>bank account</a>.", true);
  }

  calcNotificationCounter();
}

//when notifications tray is empty
function calcNotificationCounter() {
  if ($("#notifications-tray li").length == 0) {
    appendNotification("Nothing to show - you're all set!", false);
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
