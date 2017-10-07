$(document).ready(function() {

  //mobile view nav menu
  $(".nav-toggle").on("click", function() {
    $(this).toggleClass("is-active");
    $(".nav-menu").toggleClass("is-active");
  });

  //close user dropdown menu on click outside the element
  $(document).on("click", function(event) {
    if (!$(event.target).closest("#user-dropdown-button").length) {
      if ($(".user-dropdown-menu").is(":visible")) {
        $(".user-dropdown-menu").addClass("is-hidden");
        $("#user-dropdown-button").toggleClass("is-active").blur();
      }
    }
  });

  //toggle user drop down menu on icon button click
  $("#user-dropdown-button").on("click", function() {
    $(this).toggleClass("is-active");
    $(".user-dropdown-menu").toggleClass("is-hidden");
  });

  //calculate and show # of unverified domains
  calcUnverified();

  //populate the notifications tray
  showNotifications();

  //show empty notification if tray is empty
  ifTrayEmpty();

  //delete notification when you click its respective X
  $(".delete").on("click", function() {
    $(this).parent().remove();
    ifTrayEmpty();
  });

});

//find out how many domains are unverified
function calcUnverified() {
  var counter = user.listings.filter(function(listing) {
    return listing.verified == null;
  });

  $("#unverified-counter").text(counter.length);
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

  //if domains are not verified
  const counter = parseInt($("#unverified-counter").text());

  if (counter > 0) {
    appendNotification("Verify " + counter + " <a tabindex='0' class='is-underlined' href='/profile/mylistings'>unverified domains</a>.", true);
  }
}

//when notifications tray is empty
function ifTrayEmpty() {
  if ($("#notifications-tray li").length == 0) {
    appendNotification("Nothing to show - you're all set!", false);
  }
}

function appendNotification(msg, delOption) {
  var tray = $("#notifications-tray");

  if (delOption) {
    return tray.append("<li>" + "<span class='delete is-small is-transparent is-fc'></span>" + msg + "</li>");
  }
  else {
    return tray.append("<li>" + msg + "</li>");
  }
}
