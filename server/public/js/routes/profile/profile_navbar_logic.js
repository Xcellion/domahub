$(document).ready(function() {

  //<editor-fold>-------------------------------PROFILE NAVBAR--------------------------------

  showNotifications();

  //view left menu
  $(".menu-button").on("click", function() {
    $(".left-menu, .right-content").toggleClass("is-active");
  });

  //change menu visible items
  $(".nav-button").on("click", function() {
    $(".nav-button").removeClass("is-active");
    $(this).addClass("is-active");
    $(".menu:not(#" + $(this).data("menu") + ")").addClass("is-hidden");
    $("#" + $(this).data("menu")).removeClass("is-hidden").find("textarea").focus();
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
    }).done(function(data){
      clearNotification();
      $("#contact-submit-button").removeClass('is-loading');
      $("#contact_message").val("");
      $("#contact-dropdown-menu").addClass('is-hidden');
      console.log(data);
      if (data.state == "success"){
        successMessage("Message sent! We will get back to you as soon as possible. Thank you for your patience.");
      }
      else {
        errorMessage(data.message);
      }
    });
  });

  //</editor-fold>

  $(".right-content").scroll(function(e){
    if ($(this).scrollTop() > 0){
      $(".profile-nav.is-bar").find(".flat-logo, .circle-logo").addClass('is-hidden');
      $(".menu-button.is-open").addClass("is-circle");
    }
    else {
      $(".profile-nav.is-bar").find(".flat-logo, .circle-logo").removeClass('is-hidden');
      $(".menu-button.is-open").removeClass("is-circle");
    }
  });

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

  var listing_to_check = (typeof listings == "undefined") ? user.listings : listings;

  //if no listings
  if (!listing_to_check || listing_to_check.length == 0){
    appendNotification("listings-notification", "<a tabindex='0' class='is-primary' href='/listings/create'>Create DomaHub listings</a>");
  }
  else {
    //look through and check for unverified or date_created empty listings
    var unverified_listings = 0;
    var no_registration_date_listings = [];
    var no_registration_cost_listings = [];
    listing_to_check.forEach(function(listing) {
      if (!listing.verified){
        unverified_listings++;
      }
      if (!listing.date_registered){
        no_registration_date_listings.push(listing.id);
      }
      if (!listing.registrar_cost || listing.registrar_cost == 0){
        no_registration_cost_listings.push(listing.id);
      }
    });

    //unverified listings
    if (unverified_listings > 0){
      appendNotification("verify-notification", "/profile/mylistings?tab=verify", "Verify " + unverified_listings + " unverified domains");
    }

    //listings with no date-registered
    if (no_registration_date_listings.length > 0){
      var plural_or_not = (no_registration_date_listings.length == 1) ? "" : "s";
      appendNotification("listing-registered-notification", "/profile/mylistings?listings=" + no_registration_date_listings.join(",") + "&tab=domain-info", no_registration_date_listings.length + " listing" + plural_or_not + " missing registration date" + plural_or_not, "Please edit the domain registration date" + plural_or_not + " for your listing" + plural_or_not + "!");
    }

    //listings with no registered cost
    if (no_registration_cost_listings.length > 0){
      var plural_or_not = (no_registration_cost_listings.length == 1) ? "" : "s";
      appendNotification("listing-cost-notification", "/profile/mylistings?listings=" + no_registration_cost_listings.join(",") + "&tab=domain-info", no_registration_cost_listings.length + " listing" + plural_or_not + " missing registration cost" + plural_or_not, "Please edit the annual registration renewal cost" + plural_or_not + " for your listing" + plural_or_not + "!");
    }
  }


  //if stripe payout settings are not set
  if (!user.stripe_account) {
    appendNotification("payout-details-notification", "/profile/settings#payment", "Add payout details", "Add your payout details to ensure that you get paid!");
  }

  //if bank account is not connected
  if (!user.stripe_bank && !user.paypal_email) {
    appendNotification("payout-account-notification", "/profile/settings#payment", "Connect a payout method", "Connect an account to withdraw your earnings to!");
  }

  //if not premium
  if (!user.stripe_subscription){
    appendNotification("premium-notification", "/profile/settings#premium", "Upgrade to Premium", "Upgrade to DomaHub Premium to enjoy premium features!");
  }
  //if premium expiring
  else if (user.stripe_subscription.cancel_at_period_end){
    appendNotification("expiring-notification", "/profile/settings#premium", "Premium is expiring!", "You will lose access to premium features!");
  }

  calcNotificationCounter();
}

//when notifications tray is empty
function calcNotificationCounter() {
  var notification_length = $("#notification-tray li").length;
  if (notification_length > 0 && $(".notification-counter").hasClass("is-hidden")) {
    $("#all-set-notification").remove();
    $("#notification-number").html(notification_length);
    $(".notification-counter").removeClass("is-hidden").text(notification_length);
    var page_title = document.title.replace(/\(([^)]+)\)/, "").split(" - ");
    if (page_title){
      document.title = page_title[0] + " (" + notification_length + ") - " + page_title[1];
    }
  }
  else if (notification_length == 0 && $("#all-set-notification").length == 0){
    $(".notification-counter").addClass("is-hidden");
    $("#notification-number").html("");
    $("#notification-tray").append("<div id='all-set-notification' class='content'><p>None - you're all set!</p></div>");
    document.title = document.title.replace(/\(([^)]+)\)/, "");
  }
}

function appendNotification(id, link, text, tooltip) {
  if ($("#" + id).length == 0){
    var tray = $("#notification-tray");
    var append_tooltip = (tooltip) ? "data-balloon-length='medium' data-balloon='" + tooltip + "' data-balloon-pos='down'" : "";
    tray.append("<li id=" + id + "><a tabindex='0' " + append_tooltip + " href='" + link + "'>" + text + "</a></li>");
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
