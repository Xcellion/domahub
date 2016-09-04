var renderPage = function(pathName) {
    //alter tab CSS
    $(".tab").removeClass("is-active");
    $("#" + pathName + "-tab").addClass("is-active");

    //change which section is displaying
    $(".section").addClass("is-hidden");
    $("#" + pathName).removeClass("is-hidden").addClass("is-active");
}

//function that runs when back button is pressed
window.onpopstate = function(event) {

    //figure out current path
    var path = window.location.pathname;
    var pathName = path.substr(1, path.length);

    //if there was a path inserted via history.pushState
    if (event.state){
        pathName = event.state.page;
    }
    renderPage(pathName);
}

$(document).ready(function() {

  //figure out the current path, then render appropriately
  var path = window.location.pathname;
  var pathName = path.substr(1, path.length);
  renderPage(pathName);

  //changing tabs
  $(".tab").click(function() {
    var tabName = $(this).attr("id").split("-").shift();

    $(".tab").removeClass("is-active");
    $(this).addClass("is-active");
    renderPage(tabName);

    //only add to history if we clicked on something new
    if (tabName != pathName){
        var stateObj = { page: tabName};
        history.pushState(stateObj, "", tabName);
    }
  });

});
