$(document).ready(function() {

  //<editor-fold>-------------------------------PROFILE NAVBAR--------------------------------

  showNotifications();

  //toggle user drop down menu on icon button click
  $(".nav-button").on("click", function() {
    $(".nav-menu").removeClass('is-active');
    $(".nav-drop:not(#" + $(this).data("menu") + ")").addClass("is-hidden");
    $("#" + $(this).data("menu")).toggleClass("is-hidden").find("textarea").focus();
  });

  //mobile view nav menu
  $(".nav-toggle").on("click", function() {
    $(this).toggleClass("is-active");
    $(".hover-menu").toggleClass("is-active");
  });

  //close user dropdown menu on click outside the element
  $(document).on("click", function(event) {
    if (!$(event.target).closest(".user-button").length && !$(event.target).closest(".contact-link").length) {
      if ($(".nav-drop").is(":visible")) {
        $(".nav-drop").addClass("is-hidden");
        $(".user-button").toggleClass("is-active").blur();
      }
    }

    if (!$(event.target).closest(".nav-toggle").length && !$(event.target).closest(".profile-nav-link").length) {
      if ($(".hover-menu").is(":visible")) {
        $(".hover-menu").removeClass("is-active");
        $(".nav-toggle").toggleClass("is-active").blur();
      }
    }
  });


  //</editor-fold>

  //<editor-fold>-------------------------------MODAL--------------------------------

  $(document).on("keyup", function(e) {
    if (e.which == 27) {
      closeModals();
    }
  });

  //close modal
  $(".modal-close, .modal-background, .cancel-modal").on("click", function(){
    closeModals();
  });

  //</editor-fold>

  //<editor-fold>-------------------------------LEFT MENU VISUAL--------------------------------

  leftMenuActive();

  //hide upgrade link on left nav if already premium
  if (!user.stripe_subscription_id || !user.stripe_subscription || user.stripe_subscription.cancel_at_period_end == true){
    $("#nav-premium-link").removeClass('is-hidden');

    if (user.stripe_subscription && user.stripe_subscription.cancel_at_period_end == true){
      $("#nav-premium-link").find("small").text("Renew Premium");
    }
  }

  //</editor-fold>

  //<editor-fold>-------------------------------CONTACT US--------------------------------

  contactLinkHandler();

  //contact us form
  $("#contact-form").on("submit", function(e){
    e.preventDefault();
    $("#contact-submit-button").addClass('is-loading');
    $.ajax({
      url: "/contact",
      data: {
        contact_email: user.email,
        contact_name: user.username,
        contact_message: $("#contact_message").val()
      },
      method: "POST"
    }).done(function(){
      clearNotification();
      $("#contact-submit-button").removeClass('is-loading');
      $("#contact_message").val("");
      $("#contact-dropdown-menu").addClass('is-hidden');
      successMessage("Message sent! We will get back to you as soon as possible. Thank you for your patience.");
    });
  });

  //</editor-fold>

});

//<editor-fold>----------------------------------MODAL HELPERS-------------------------

//close modals
function closeModals(){
  clearNotification();
  $(".modal").find("input, textarea, select").val("");
  $(".modal").removeClass('is-active');
  $("#cancel-premium-button").addClass("is-disabled");

  //closing announcement modal
  if ($("#announcement-modal").length == 1){
    bakeCookie("announcement", true);
  }

  //extra function for some pages
  if (typeof extraCloseModal != "undefined"){
    extraCloseModal();
  }
}

//</editor-fold>

//<editor-fold>----------------------------------URL HELPER FUNCTIONS-------------------------

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

//get current page view name
function getCurrentView() {
  var path = window.location.pathname;
  path = path.split("/");
  var newPath = path[2].charAt(0).toUpperCase() + path[2].slice(1);

  if (newPath == "Mylistings") {
    newPath = "My Listings";
  }
  if (newPath == "Create") {
    newPath = "Create Listings";
  }
  if (newPath == "Settings") {
    newPath = "Account Settings";
  }

  $("#current-view-name").html(newPath);
}

//get a URL query param by name
function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
  results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function updateQueryStringParam(key, value, push) {
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
  if (push){
    window.history.pushState({}, "", baseUrl + params);
  }
  else {
    window.history.replaceState({}, "", baseUrl + params);
  }
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

//<editor-fold>----------------------------------NOTIFICATIONS-------------------------

//populate the notifications tray
function showNotifications() {

  //reset tray
  $("#notification-tray li").remove();

  //if no listings
  if (!user.listings || user.listings.length == 0){
    appendNotification("listings-notification", "<a tabindex='0' class='is-primary' href='/listings/create'>Create DomaHub listings</a>");
  }

  //if unverified domains exist
  var unverified_listings = user.listings.filter(function(listing) {
    return !listing.verified;
  });
  if (unverified_listings.length > 0){
    appendNotification("verify-notification", "<a tabindex='0' href='/profile/mylistings?tab=verify'>Verify " + unverified_listings.length + " unverified domains</a>");
  }

  //if stripe payout settings are not set
  if (!user.stripe_account) {
    appendNotification("payout-details-notification", "<a tabindex='0' href='/profile/settings#payment'>Add payout details</a>");
  }

  //if bank account is not connected
  if (!user.stripe_bank && !user.paypal_email) {
    appendNotification("payout-account-notification", "<a tabindex='0' href='/profile/settings#payment'>Connect a payout method</a>");
  }

  //if not premium
  if (!user.stripe_subscription){
    appendNotification("premium-notification", "<a tabindex='0' href='/profile/settings#premium'>Upgrade to Premium</a>");
  }
  //if premium expiring
  else if (user.stripe_subscription.cancel_at_period_end){
    appendNotification("expiring-notification", "<a tabindex='0' href='/profile/settings#premium'>Premium is expiring!</a>");
  }

  calcNotificationCounter();
}

//when notifications tray is empty
function calcNotificationCounter() {
  var notification_length = $("#notification-tray li").length;
  if (notification_length > 0 && $("#notification-counter").hasClass("is-hidden")) {
    $("#all-set-notification").remove();
    $("#notification-number").html(notification_length);
    $("#notification-counter").removeClass("is-hidden").text(notification_length);
    var page_title = document.title.replace(/\(([^)]+)\)/, "").split(" - ");
    if (page_title){
      document.title = page_title[0] + " (" + notification_length + ") - " + page_title[1];
    }
  }
  else if (notification_length == 0 && $("#all-set-notification").length == 0){
    $("#notification-counter").addClass("is-hidden");
    $("#notification-number").html("");
    $("#notification-tray").append("<div id='all-set-notification' class='content'><p>None - you're all set!</p></div>");
    document.title = document.title.replace(/\(([^)]+)\)/, "");
  }
}

function appendNotification(id, msg) {
  if ($("#" + id).length == 0){
    var tray = $("#notification-tray");
    tray.append("<li id=" + id + ">" + msg + "</li>");
  }
}

//</editor-fold>

//<editor-fold>----------------------------------ANNOUNCEMENT COOKIE-------------------------------

//helper function to make cookie
function bakeCookie(name, value) {
  var cookie = [name, '=', JSON.stringify(value), '; path=/;'].join('');
  document.cookie = cookie;
}

//</editor-fold>
