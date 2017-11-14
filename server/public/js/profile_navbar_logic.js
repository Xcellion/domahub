$(document).ready(function() {

  //<editor-fold>-------------------------------PROFILE NAVBAR--------------------------------

  showNotifications();

  //mobile view nav menu
  $(".nav-toggle").on("click", function() {
    $(this).toggleClass("is-active");
    $(".nav-menu").toggleClass("is-active");
  });

  //close user dropdown menu on click outside the element
  $(document).on("click", function(event) {
    if (!$(event.target).closest(".nav-button").length) {
      if ($(".nav-drop").is(":visible")) {
        $(".nav-drop").addClass("is-hidden");
        $(this).toggleClass("is-active").blur();
      }
    }
  });

  //</editor-fold>

  //<editor-fold>-------------------------------MODAL--------------------------------

  //toggle user drop down menu on icon button click
  $(".nav-button").on("click", function() {
    $(".nav-drop").addClass("is-hidden");
    $("#" + $(this).data("menu")).removeClass("is-hidden");
  });

  $(document).on("keyup", function(e) {
    if (e.which == 27) {
      $('.modal').removeClass('is-active');
    }
  });

  //close modal
  $(".modal-close, .modal-background, .cancel-modal").on("click", function(){
    $('.modal').removeClass('is-active');
  });

  //</editor-fold>

  //<editor-fold>-------------------------------LEFT MENU VISUAL--------------------------------

  leftMenuActive();

  //hide upgrade link on left nav if already premium
  if (!user.stripe_subscription_id || user.stripe_subscription.cancel_at_period_end == true){
    $("#nav-premium-link").removeClass('is-hidden');
  }

  //</editor-fold>

});

//<editor-fold>-------------------------------URL HELPER FUNCTIONS--------------------------------

//add active to left menu
function leftMenuActive(){
  $(".left-tab").removeClass('is-active');
  var url_tab = getParameterByName("tab");
  if (url_tab == "offers"){
    $("#offers-left-tab").addClass('is-active');
  }
  else if (url_tab == "offers"){
    $("#stats-left-tab").addClass('is-active');
  }
  else {
    $("#" + window.location.pathname.split("/")[2] + "-left-tab").addClass('is-active');
  }
}

//function to get a URL query param by name
function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
  results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function updateQueryStringParam(key, value) {
  var baseUrl = [location.protocol, '//', location.host, location.pathname].join(''),
  urlQueryString = document.location.search,
  newParam = key + '=' + value,
  params = '?' + newParam;
  // If the "search" string exists, then build params from it
  if (urlQueryString) {
    updateRegex = new RegExp('([\?&])' + key + '[^&]*');
    removeRegex = new RegExp('([\?&])' + key + '=[^&;]+[&;]?');
    if( typeof value == 'undefined' || value == null || value == '' ) { // Remove param if value is empty
      params = urlQueryString.replace(removeRegex, "$1");
      params = params.replace( /[&;]$/, "" );
    } else if (urlQueryString.match(updateRegex) !== null) { // If param exists already, update it
      params = urlQueryString.replace(updateRegex, "$1" + newParam);
    } else { // Otherwise, add it to end of query string
      params = urlQueryString + '&' + newParam;
    }
  }
  params = (params == "?") ? "" : params;
  window.history.replaceState({}, "", baseUrl + params);
};

function removeURLParameter(parameter) {
  var url = [location.protocol, '//', location.host, location.pathname].join('');
  var urlparts= window.location.href.split('?');
  if (urlparts.length>=2) {
    var prefix= encodeURIComponent(parameter)+'=';
    var pars= urlparts[1].split(/[&;]/g);
    //reverse iteration as may be destructive
    for (var i= pars.length; i-- > 0;) {
      //idiom for string.startsWith
      if (pars[i].lastIndexOf(prefix, 0) !== -1) {
        pars.splice(i, 1);
      }
    }
    url= urlparts[0] + (pars.length > 0 ? '?' + pars.join('&') : "");
    window.history.replaceState({}, "", url);
  } else {
    window.history.replaceState({}, "", url);
  }
}

//</editor-fold>

//<editor-fold>----------------------------------DROPDOWN MENUS-------------------------

//populate the notifications tray
function showNotifications() {

  //if no listings
  if (!user.listings || user.listings.length == 0){
    appendNotification("<a tabindex='0' class='is-primary' href='/listings/create'>Create DomaHub listings</a>");
  }

  //if stripe payout settings are not set
  if (!user.stripe_account) {
    appendNotification("<a tabindex='0' href='/profile/settings#payout-address'>Complete payout settings</a>");
  }

  //if bank account is not connected
  if (!(user.stripe_info && user.stripe_info.transfers_enabled)) {
    appendNotification("<a tabindex='0' href='/profile/settings#payout-bank'>Connect a bank account</a>");
  }

  //if not premium
  if (!user.stripe_subscription_id){
    appendNotification("<a tabindex='0' href='/profile/settings#premium'>Upgrade to Premium</a>");
  }

  //if unverified domains exist
  var unverified_listings = user.listings.filter(function(listing) {
    return !listing.verified;
  });
  if (unverified_listings.length > 0){
    appendNotification("<a tabindex='0' href='/profile/mylistings?tab=verify'>Verify " + unverified_listings.length + " unverified domains</a>");
  }

  calcNotificationCounter();
}

//when notifications tray is empty
function calcNotificationCounter() {
  if ($("#notification-tray li").length > 0) {
    $("#notification-dropdown-menu").prepend("<p class='menu-label'>Notifications</p>");
    $("#notification-counter").removeClass("is-hidden").text($("#notification-tray li").length);
  }
  else {
    $("#notification-tray").append(
      "<div class='smile-text'><figure class='smile'><img src='/images/lib/smile.png'></img></figure><p>No notifications - you're all set!</p></div>");
  }
}

function appendNotification(msg) {
  var tray = $("#notification-tray");
  return tray.append("<li>" + msg + "</li>");
}

//</editor-fold>
