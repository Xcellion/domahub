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

  $(document).on("keyup", function(e) {
    if (e.which == 27) {
      $('.modal').removeClass('is-active');
    }
  });

  //close modal
  $(".modal-close, .modal-background, .cancel-modal").on("click", function(){
    $('.modal').removeClass('is-active');
  });

  leftMenuActive();
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

//<editor-fold>-------------------------------NOTIFICATION--------------------------------

//helper function to display/hide error messages per listing
function errorMessage(message){
  //hide success
  $("#profile-msg-success").addClass('is-hidden').removeClass("is-active");

  if (message){
    $("#profile-msg-error").removeClass('is-hidden').addClass("is-active");
    $("#profile-msg-error-text").html(message);
  }
  else if (!message) {
    $("#profile-msg-error").addClass('is-hidden').removeClass("is-active");
  }
}

//helper function to display success messages per listing
function successMessage(message){
  //hide error
  $("#profile-msg-error").addClass('is-hidden').removeClass("is-active");

  if (message){
    $("#profile-msg-success").removeClass('is-hidden').addClass("is-active");
    $("#profile-msg-success-text").html(message);
  }
  else if (!message){
    $("#profile-msg-success").addClass('is-hidden').removeClass("is-active");
  }
}

//function to refresh notifications
function clearNotification(){
  errorMessage(false);
  successMessage(false);
}

//</editor-fold>
