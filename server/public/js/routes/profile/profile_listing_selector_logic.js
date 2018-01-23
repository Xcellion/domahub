var last_selected;

$(document).ready(function(){
  createRows();

  //<editor-fold>-------------------------------FILTERS / SORT / SEARCH-------------------------------

  //sort by header
  $(".listing-header-sort").on("click", function(){
    var sort_value = $(this).data("value");
    var sort_direction = ($(this).data("sort_direction")) ? true : false;

    //sort icon
    $(".listing-header-sort").find(".icon").removeClass('is-primary');
    $(".listing-header-sort").find("svg").attr("data-icon", "sort");
    $(this).find(".icon").addClass('is-primary');
    $(this).data("sort_direction", !sort_direction).find(".fa").addClass()
    if (sort_direction){
      $(this).find("svg").attr("data-icon", "sort-up");
    }
    else {
      $(this).find("svg").attr("data-icon", "sort-down");
    }

    //sort the rows
    $(".table-row:not(.clone-row)").sort(function(a,b){
      if (sort_value == "registrar_name" || sort_value == "date_registered" || sort_value == "date_expire" || sort_value == "date_created" || sort_value == "min_price" || sort_value == "buy_price"){
        var a_sort = $(a).data("listing_info")[sort_value] || "";
        var b_sort = $(b).data("listing_info")[sort_value] || "";
      }
      else {
        var a_sort = $(a).find("." + sort_value + "-sort-value").text().toLowerCase();
        var b_sort = $(b).find("." + sort_value + "-sort-value").text().toLowerCase();
      }

      console.log(a_sort, b_sort);
      if (sort_direction){
        return (a_sort > b_sort) ? 1 : (a_sort < b_sort) ? -1 : 0;
      }
      else {
        return (a_sort > b_sort) ? -1 : (a_sort < b_sort) ? 1 : 0;
      }
    }).appendTo("#table-body");
  });

  //domain search
  $("#domain-search").on("input", function(){
    showRows();
  });

  //filters
  $("#filter-select").on("change", function(){
    showRows();
  });

  //</editor-fold>

  //<editor-fold>-------------------------------BUTTONS-------------------------------

  //select dropper
  $("#selector-select-button").on('click', function(e){
    $("#hub-drop").addClass('is-hidden');
    $("#select-all-drop").toggleClass('is-hidden');
  });

  //hub dropper
  $("#hub-select-button").on('click', function(e){
    $("#select-all-drop").addClass('is-hidden');
    $("#hub-drop").toggleClass('is-hidden');

    //update the drop if we see it
    if (!$("#hub-drop").hasClass("is-hidden")){
      handleHubUpdate();
    }
  });

  //close select dropper on click anywhere else
  $(document).on("click", function(event) {
    if (!$(event.target).closest("#selector-select-button").length) {
      $("#select-all-drop").addClass('is-hidden');
    }
    if (!$(event.target).closest("#hub-select-button").length && !$(event.target).closest("#hub-drop").length) {
      $("#hub-drop").addClass('is-hidden');
    }
  });

  //select specific rows
  $(".select-drop-button").on('click', function(){
    selectSpecificRows($(this).data("type"), $(this).data("value"));
    $("#select-all-drop").addClass('is-hidden');
  });

  //select all domains
  $("#select-all").on("click", function(e){
    e.stopPropagation();
    $("#hub-drop").addClass('is-hidden');
    selectAllRows(!$(this).data("selected"));
  });

  //go into edit mode
  $("#selector-edit-button").on('click', function(){
    viewDomainDetails();
  });

  //go into offers mode
  $("#selector-offers-button").on('click', function(){
    viewDomainOffers();
  });

  // //go into stats mode
  // $("#selector-stats-button").on('click', function(){
  //   viewDomainStats();
  // });

  //go into verify mode
  $("#selector-verify-button").on("click", function(e){
    viewDomainDNS();
  });

  //multiple delete listings
  $("#selector-delete-button").on("click", function(e){
    confirmDeleteListings($(this));
  });

  //confirmed delete
  $("#delete-confirmed").on("click", function(){
    deleteListings($(this));
  });

  //refresh listings
  $("#refresh-listings-button").on("click", function(){
    $("#refresh-listings-button").addClass('is-loading');
    $(".table-row:not(.clone-row), #no-listings-row").addClass('is-hidden');
    $("#loading-listings-row").removeClass('is-hidden');
    clearNotification();
    $.ajax({
      url: "/profile/mylistings/refresh",
      method : "POST"
    }).done(function(data){
      $("#refresh-listings-button").removeClass('is-loading');
      if (data.state == "success"){
        listings = data.listings;
      }
      else {
        errorMessage(data.message);
      }
      createRows();
      showRows();
    });
  });

  //</editor-fold>

  //<editor-fold>-------------------------------URL-------------------------------

  //replace URL tab if not a good tab
  var replace_url = [location.protocol, '//', location.host, location.pathname].join('');
  var url_tab = getParameterByName("tab");
  if (["verify", "info", "hub", "design", "stats", "offers", "purchased"].indexOf(url_tab) == -1){
    removeURLParameter("tab");
    url_tab = "";
  }

  //select URL rows
  var url_selected_listings = getParameterByName("listings");
  if (url_selected_listings){
    var url_listings_id = url_selected_listings.split(",");
    for (var x = 0 ; x < url_listings_id.length; x++){
      selectRow($("#row-listing_id" + url_listings_id[x]), true);
    }

    if ($(".table-row.is-selected").length == 0){
      removeURLParameter("listings");
      url_selected_listings = "";
    }

    //check for what has been selected and display buttons accordingly
    multiSelectButtons();
  }

  //requested specific tab
  if (url_selected_listings != "" && ["info", "design", "hub"].indexOf(url_tab) != -1){
    viewDomainDetails(url_tab);
  }
  else if (url_selected_listings != "" && url_tab == "verify"){
    viewDomainDNS();
  }
  else if (url_selected_listings != "" && url_tab == "offers"){
    viewDomainOffers();
  }
  // else if (url_selected_listings != "" && url_tab == "stats"){
  //   viewDomainStats();
  // }
  else {
    showSelector();
  }

  //</editor-fold>

});

//<editor-fold>-------------------------------SELECTOR FUNCTIONS-------------------------------

//return to domain selector
function showEditor(url_tab, selected_domain_ids){
  $(".changeable-input").off();

  //hide other tabs and tab-drops
  $(".tab-drop").addClass('is-hidden');
  $(".tab.verified-elem").removeClass('is-active');

  //update URL if exists
  if (url_tab){
    updateQueryStringParam("tab", url_tab);
    $("#tab-title").text($("#" + url_tab + "-tab-drop").data('title'));
    $("#" + url_tab + "-tab").addClass('is-active');
    $("#" + url_tab + "-tab-drop").show().removeClass('is-hidden');
  }
  if (selected_domain_ids.length > 0){
    updateQueryStringParam("listings", selected_domain_ids);
  }
  //clear any messages
  clearNotification();
  $("#domain-selector").addClass('is-hidden');
  $("#domain-editor").removeClass('is-hidden');

  //hide secondary left menu if offers
  if (url_tab != "offers"){
    $("#second-left-menu, #card-view").removeClass('is-hidden');
  }
  else {
    $("#second-left-menu, #card-view").addClass('is-hidden');
  }

  leftMenuActive();
}

//show rows based on filter + search
function showRows(){
  $(".table-row:not(.clone-row)").addClass('is-hidden');

  var filter_val = $("#filter-select").val();
  var search_term = $("#domain-search").val().toLowerCase();
  $(".table-row:not(.clone-row)").filter(function(){
    if ($(this).data(filter_val) && $(this).data('domain_name').toLowerCase().indexOf(search_term) != -1){
      return true;
    }
  }).removeClass('is-hidden');

  //something matches
  if ($(".table-row:not(.clone-row):visible:first").length > 0){
    $("#no-listings-row").addClass('is-hidden');
  }
  //nothing matches
  else {
    $("#no-listings-row").removeClass('is-hidden');
  }
}

//</editor-fold>

//<editor-fold>-------------------------------CREATE ROWS OF DOMAINS-------------------------------

//create all rows
function createRows(selected_ids){
  //empty the table and hide loading
  $("#table-body").find(".table-row:not(.clone-row)").remove();
  $("#loading-listings-row").addClass('is-hidden');

  var url_listings = getParameterByName("listings");

  if (selected_ids == false){
    selected_ids = [];
    removeURLParameter("listings");
  }
  else if (!selected_ids && url_listings){
    selected_ids = url_listings.split(",");
  }
  else if (!selected_ids){
    selected_ids = [];
  }

  //reset sort
  $(".listing-header-sort").data("sort_direction", false).find(".icon").removeClass('is-primary')
  $(".listing-header-sort").find("svg").attr("data-icon", "sort");

  //if listings, create rows
  if (listings.length > 0){
    $("#loading-listings-row").addClass('is-hidden');

    //any hubs?
    var listing_hubs = [];

    //create rows for each listing
    var now = moment();
    for (var x = 0; x < listings.length; x++){

      //add to hubs list
      if (listings[x].hub){
        listing_hubs.push(listings[x]);
      }

      //if there is any existing selected
      var selected = false;
      if (selected_ids){
        for (var y = 0; y < selected_ids.length; y++){
          if (selected_ids[y] == listings[x].id){
            selected = true;
            break;
          }
        }
      }
      $("#table-body").append(createRow(now, listings[x], x, selected));
    }

    //create add to hub dropdown
    if (listing_hubs.length > 0){
      $(".hub-drop-row").remove();
      for (var y = 0; y < listing_hubs.length; y++){
        createHubRow(listing_hubs[y]);
      }

      //submit hub changes
      $("#hub-drop-apply").off().on("click", function(){
        submitHubChanges();
      });
    }

    multiSelectButtons();
  }
  //there are no listings to show!
  else {
    $("#no-domains-row").removeClass('is-hidden');
    $(".yes-listings-elem").addClass('is-hidden');
  }
}

//create a listing row
function createRow(now, listing_info, rownum, selected){
  //choose a row to clone (accepted listings are verified by default)
  if (listing_info.verified || listing_info.status == 3){
    var tempRow = $("#verified-clone-row").clone();
  }
  else {
    var tempRow = $("#unverified-clone-row").clone();

    //to fix the overlap on unverified tooltips for first two rows
    if (rownum < 2){
      tempRow.find(".unverified-icon").attr("data-balloon-pos", "down");
    }
  }

  //update row specifics and add handlers
  tempRow.removeClass('is-hidden clone-row').attr("id", "row-listing_id" + listing_info.id);

  //update checkbox label click
  tempRow.find(".select-button").attr("id", "row-listing_id" + listing_info.id + "-select");
  tempRow.find(".select-label").attr("for", "row-listing_id" + listing_info.id + "-select");

  updateDomainRow(tempRow, listing_info, now);
  updateRowData(tempRow, listing_info);

  if (selected){
    selectRow(tempRow, true);
  }

  return tempRow;
}

//update row data
function updateRowData(row, listing_info){
  //already got the dns and a records for unverified domain
  if (listing_info.a_records != undefined && listing_info.whois != undefined){
    row.data("record_got", true);
  }

  row.data("id", listing_info.id);
  row.data("listing_info", listing_info);
  row.data("domain_name", listing_info.domain_name);
  row.data("all", true);
  row.data("unverified", (listing_info.verified) ? false : true);
  row.data("hub", (listing_info.hub) ? true : false);
  row.data("verified", (listing_info.verified) ? true : false);
  row.data("editable", (listing_info.verified && !listing_info.accepted) ? true : false);
  row.data("accepted", (listing_info.accepted) ? true : false);
  row.data("deposited", (listing_info.deposited) ? true : false);
  row.data("transferred", (listing_info.transferred) ? true : false);
  row.data("rented", listing_info.rented);
  row.data("status", (listing_info.status == 1) ? true : false);
  row.data("inactive", ((listing_info.status == 0 || listing_info.status == 3) && listing_info.verified) ? true : false);
}

//update the clone row with row specifics
function updateDomainRow(tempRow, listing_info, now){
  var clipped_domain_name = (listing_info.domain_name.length > 100) ? listing_info.domain_name.substr(0, 97) + "..." : listing_info.domain_name;

  //if demo
  if (!user.id){
    var listing_href = ((window.location.hostname.indexOf("domahub") != -1) ? "https://domahub.com/listing/" + listing_info.domain_name.toLowerCase() : "http://localhost:8080/listing/" + listing_info.domain_name.toLowerCase()) + "?compare=true&theme=Random";
  }
  //if production
  else if (window.location.hostname.indexOf("domahub") != -1){
    var listing_href = (user.stripe_subscription_id) ? "https://" + listing_info.domain_name.toLowerCase() : "/listing/" + listing_info.domain_name.toLowerCase();
  }
  //testing
  else {
    var listing_href = "http://localhost:8080/listing/" + listing_info.domain_name.toLowerCase();
  }

  tempRow.find(".td-domain").html("<a class='is-underlined' target='_blank' href='" + listing_href + "'>" + clipped_domain_name + "</a>");
  tempRow.find(".td-registrar").text((listing_info.registrar_name) ? listing_info.registrar_name : "-");

  if (listing_info.date_registered){
    tempRow.find(".td-date").text(moment(listing_info.date_registered).format("YYYY-MM-DD")).attr("title", moment(listing_info.date_registered).format("YYYY-MM-DD HH:mm"));
  }
  else {
    tempRow.find(".td-date").text("-");
  }

  //registrar expiration date
  if (listing_info.date_expire){
    var moment_expire = moment(listing_info.date_expire);
    var humanized = Math.round(moment.duration(moment_expire.diff(now)).asDays());
    var expired_already = humanized < 0;
    var days_plural = (humanized == 1) ? "day" : "days";
    var expired_text = (expired_already) ? "Expired " + Math.abs(humanized) + " " + days_plural + " ago" : "In " + humanized + " " + days_plural;
    tempRow.find(".td-date-expire").text(expired_text).attr("title", moment_expire.format("YYYY-MM-DD HH:mm"));
  }
  else {
    tempRow.find(".td-date-expire").text("-").removeAttr("title");
  }

  //status text
  if (listing_info.transferred){
    var status_text = "Sold (Transferred)";
  }
  else if (listing_info.deposited){
    var status_text = "Sold (Not Transferred)";
  }
  else if (listing_info.accepted){
    var status_text = "Accepted An Offer";
  }
  else if (listing_info.rented){
    var status_text = "Currently Rented";
  }
  else if (listing_info.hub == 1){
    var status_text = "Listing Hub";
  }
  else if (listing_info.verified && listing_info.status == 1){
    var status_text = "Active";
  }
  else if (listing_info.verified && listing_info.status == 0){
    var status_text = "Inactive";
  }
  else if (listing_info.status == 3){
    var status_text = "Pending";
    tempRow.find(".pending-status-icon").removeClass('is-hidden');
  }
  else {
    var status_text = "Unverified";
  }

  tempRow.find(".td-status").text(status_text);
  tempRow.find(".td-min").text((listing_info.min_price) ? moneyFormat.to(parseFloat(listing_info.min_price)) : "-");
  tempRow.find(".td-bin").text((listing_info.buy_price) ? moneyFormat.to(parseFloat(listing_info.buy_price)) : "-");
  tempRow.find(".select-button").off().on('click', function(e){
    e.stopPropagation();
    toggleSelectRow(tempRow, e);
  });
}

//</editor-fold>

//<editor-fold>-------------------------------LISTING HUB-------------------------------

//create a hub row for the add to hub dropdown
function createHubRow(listing_info){
  var hub_drop_clone = $("#hub-drop-clone").clone().removeAttr("id").removeClass('is-hidden');
  var hub_title = listing_info.hub_title || listing_info.domain_name;
  hub_title = (hub_title.length > 30) ? hub_title.substr(0, 27) + "..." : hub_title;
  hub_drop_clone.find(".hub-drop-domain-name").text(hub_title);
  hub_drop_clone.find(".select-button").attr("id", "hub-drop-listing_id" + listing_info.id).attr("title", "Add to listing hub " + (listing_info.hub_title || listing_info.domain_name));
  hub_drop_clone.find(".hub-drop-label").attr("for", "hub-drop-listing_id" + listing_info.id);
  hub_drop_clone.data("hub_id", listing_info.id).addClass("hub-drop-row");

  //ids of all listings that are in this hub
  if (listing_info.hub_listing_ids){
    hub_drop_clone.data("hub_listing_ids", listing_info.hub_listing_ids.split(",").map(function(elem){
      return parseFloat(elem);
    }));
  }
  else {
    hub_drop_clone.data("hub_listing_ids", []);
  }

  //initialize tristate and handle change
  hub_drop_clone.find(".select-button").addClass("hub-drop-select-button").tristate({
    change : function(state, value){
      //prevents indeterminate states when it's ALL or NONE
      if (!$(this).data("indet") && $(this).tristate("state") === null){
        $(this).tristate("state", true);
      }

      handleHubClick();
    },
    reverse : true
  });

  $("#hub-drop-domains-wrapper").append(hub_drop_clone);
}

//figures out what to check, how to check, and show apply in hub drop
function handleHubUpdate(){
  var selected_domains = $(".table-row:not(.clone-row).is-selected");
  var selected_domains_as_array = $(".table-row:not(.clone-row).is-selected").map(function(){
    return $(this).data("listing_info").id
  }).toArray();

  //loop through to see if we should check/indeterminate/uncheck the hub checkboxes
  $(".hub-drop-row").each(function(){
    var hub_drop_row = $(this);
    var hub_drop_select = $(this).find(".select-button");

    var selected_and_in_hub = hub_drop_row.data("hub_listing_ids").filter(function(elem){
      return selected_domains_as_array.indexOf(elem) > -1;
    });

    //if ALL selected are in this hub
    if (selected_and_in_hub.length == selected_domains_as_array.length){
      hub_drop_select.data("indet", false).data("original-tristate", true);
      hub_drop_select.tristate("state", true);
    }
    //if SOME selected are in this hub
    else if (selected_and_in_hub.length > 0){
      hub_drop_select.data("indet", true).data("original-tristate", null);
      hub_drop_select.tristate("state", null);
    }
    //NONE of the selected are in this hub
    else {
      hub_drop_select.data("indet", false).data("original-tristate", false);
      hub_drop_select.tristate("state", false);
    }
  });
}

//figure out if anything is different from it's original state and to display apply or not
function handleHubClick(){
  var changed = $(".hub-drop-select-button").filter(function(elem){
    return $(this).data("original-tristate") != $(this).tristate("state");
  }).length;

  if (changed > 0){
    $("#hub-drop-apply").removeClass('is-hidden');
  }
  else {
    $("#hub-drop-apply").addClass('is-hidden');
  }
}

//submit any new hub changes
function submitHubChanges(){
  clearNotification();
  var selected_ids = getSelectedDomains("id");

  //get checked hubs that changed
  var selected_hubs = $(".hub-drop-select-button:checked").filter(function(elem){
    return $(this).data("original-tristate") != $(this).tristate("state");
  }).map(function(){
    return $(this).closest(".hub-drop-row").data("hub_id");
  }).toArray();

  //get unchecked hubs that changed
  var not_selected_hubs = $(".hub-drop-select-button:not(:checked):not(:indeterminate)").filter(function(elem){
    return $(this).data("original-tristate") != $(this).tristate("state");
  }).map(function(){
    return $(this).closest(".hub-drop-row").data("hub_id");
  }).toArray();

  $("#hub-drop-apply").addClass('is-loading');

  $.ajax({
    url : "/profile/mylistings/hub",
    method : "POST",
    data: {
      ids : selected_ids,
      selected_hubs : (selected_hubs) ? selected_hubs : [],
      not_selected_hubs : (not_selected_hubs) ? not_selected_hubs : [],
    }
  }).done(function(data){
    $("#hub-drop-apply").removeClass('is-loading');
    $("#hub-drop").addClass('is-hidden');
    if (data.state == "success"){
      listings = data.listings;
      var total_updated = (selected_hubs.length + not_selected_hubs.length == 1) ? "a" : selected_hubs.length + not_selected_hubs.length;
      var total_updated_plural = (selected_hubs.length + not_selected_hubs.length == 1) ? "" : "s";
      successMessage("Successfully updated " + total_updated + " listing hub" + total_updated_plural + "!");
    }
    else {
      errorMessage(data.message);
    }
    createRows();
  });
}

//</editor-fold>

//<editor-fold>-------------------------------SELECT ROW-------------------------------

//select a row
function selectRow(row, selected){
  if (row){
    if (selected){
      row.addClass('is-selected');
    }
    else {
      row.removeClass('is-selected');
    }
  }
  row.find(".select-button").prop("checked", selected);
}

//toggle a row select
function toggleSelectRow(row, event){
  var selected = (row.hasClass("is-selected")) ? false : true;
  $(".table-row").removeClass('last-selected');
  row.addClass('last-selected').toggleClass('is-selected');
  row.find(".select-button").prop("checked", selected);

  //shift click to select/deselect all in between
  if (event.shiftKey && last_selected >= 0){
    var current_selected = row.index(".table-row:not('.clone-row')");

    for (var x = Math.min(current_selected, last_selected) ; x <= Math.max(current_selected, last_selected) ; x++){
      selectRow($($(".table-row:not('.clone-row')")[x]), selected);
    }
  }
  last_selected = row.index(".table-row:not('.clone-row')");
  multiSelectButtons(row);
}

//select all rows
function selectAllRows(select){
  //select all
  if (select){
    $("#select-all").data('selected', true).prop("checked", true);
    $(".table-row:not(.clone-row)").addClass('is-selected');
    $(".table-row:not('.clone-row') .select-button").prop("checked", true);
  }
  //deselect all
  else {
    $("#select-all").data('selected', false).prop("checked", false);
    $(".table-row:not(.clone-row)").removeClass('is-selected');
    $(".table-row:not('.clone-row') .select-button").prop("checked", false);
  }
  multiSelectButtons();
}

//select specific type of row
function selectSpecificRows(type, value){
  $(".table-row:not('.clone-row')").each(function(){
    selectRow($(this), $(this).data(type) == value);
  });
  multiSelectButtons();
}

//helper function to handle multi-select action buttons
function multiSelectButtons(clicked_row){
  var selected_rows = $(".table-row:not(.clone-row).is-selected");
  var not_selected_rows = $(".table-row:not(.clone-row, .is-selected)");
  var editable_selected_rows = selected_rows.filter(function(){
    return $(this).data("unverified") == false && $(this).data("accepted") == false
  });
  var offer_selected_rows = selected_rows.filter(function(){ return $(this).data("unverified") == false });
  var unverified_selected_rows = selected_rows.filter(function(){ return $(this).data("unverified") == true });
  var hub_rows = selected_rows.filter(function(){ return $(this).data("hub") == true });

  //hide hub drop
  $("#hub-drop").addClass('is-hidden');

  //selected something
  if (selected_rows.length > 0){
    $(".selector-button").removeClass("is-hidden");
    $("#current-selected-count").text(selected_rows.length);
    $("#selector-delete-button").attr("title", "Delete " + ((selected_rows.length == 1) ? "Listing" : "Listings"));

    //verified selections (show edit)
    if (editable_selected_rows.length == selected_rows.length){
      $("#selector-edit-button").removeClass("is-hidden");
    }
    else {
      $("#selector-edit-button").addClass("is-hidden");
    }

    // //add to hub (show hub dropdown only if no hubs are selected)
    // if (user.stripe_subscription_id && hub_rows.length == 0){
    //   $("#hub-select-button").removeClass("is-hidden");
    // }
    // else {
    //   $("#hub-select-button").addClass("is-hidden");
    // }

    //accepted selections (show offer)
    if (offer_selected_rows.length == selected_rows.length){
      $("#selector-offers-button").removeClass("is-hidden");
    }
    else {
      $("#selector-offers-button").addClass("is-hidden");
    }

    //if any unverified domains were selected
    if (unverified_selected_rows.length == selected_rows.length){
      $("#selector-verify-button").removeClass("is-hidden");
    }
    else {
      $("#selector-verify-button").addClass("is-hidden");
    }
  }
  else {
    $(".selector-button").addClass("is-hidden");
    $("#current-selected-count").text("");
  }

  //every row is selected
  if (not_selected_rows.length == 0 && listings.length > 0){
    $("#select-all").data('selected', true).prop("checked", true);
  }
  else {
    $("#select-all").data('selected', false).prop("checked", false);
  }

  var selected_ids = getSelectedDomains("id");
  if (selected_ids.length > 0){
    updateQueryStringParam("listings", getSelectedDomains("id"));
  }
  else {
    removeURLParameter("listings");
  }
}

//</editor-fold>

//<editor-fold>-------------------------------SELECTOR BUTTONS-------------------------------

//view domain details and edit them
function viewDomainDetails(url_tab){
  var selected_domain_ids = getSelectedDomains("id", true, true);
  if (selected_domain_ids.length > 0){
    if (!url_tab){
      url_tab = "info";
    }
    showEditor(url_tab, selected_domain_ids);
    updateEditorEditing(selected_domain_ids);
  }
  else {
    window.history.replaceState({}, "", "/profile/mylistings");
    showSelector();
  }
}

//view domain offers
function viewDomainOffers(){
  var selected_domain_ids = getSelectedDomains("id", true);
  showEditor("offers", selected_domain_ids);
  updateEditorOffers(selected_domain_ids);
}

// //view domain stats
// function viewDomainStats(){
//   var selected_domain_ids = getSelectedDomains("id", true);
//   if (selected_domain_ids.length > 0){
//     showEditor("stats", selected_domain_ids);
//     updateEditorStats(selected_domain_ids);
//   }
//   else {
//     window.history.replaceState({}, "", "/profile/mylistings");
//     showSelector();
//   }
// }

//change domain
function viewDomainDNS(){
  var selected_domain_ids = getSelectedDomains("id", false);

  //if nothing selected, select all unverified
  if (selected_domain_ids.length == 0){
    selectSpecificRows("unverified", true);
  }
  selected_domain_ids = getSelectedDomains("id", false);

  //show unverified tab
  if (selected_domain_ids.length > 0){
    showEditor("verify", selected_domain_ids);
    updateEditorUnverified(selected_domain_ids);
  }
  //if nothing still selected, then there are no unverified listings to verify
  else {
    window.history.replaceState({}, "", "/profile/mylistings");
    showSelector();
  }
}

  //<editor-fold>-------------------------------DELETE LISTINGS-------------------------------

  //display delete confirmation modal
  function confirmDeleteListings(){
    $("#delete-modal").addClass('is-active');
    var selected_domain_names = getSelectedDomains("domain_name");
    $("#delete-modal-count").text((selected_domain_names.length > 1) ? selected_domain_names.length : "");

    if (selected_domain_names.length == 1){
      $("#delete-modal-plural").addClass('is-hidden');
    }
    else {
      $("#delete-modal-plural").removeClass('is-hidden');
    }

    //list of domains to delete
    $("#delete-modal-domains .delete-modal-cloned-domain").remove();
    for (var x = 0; x < selected_domain_names.length; x++){
      var cloned_domain = $("#delete-modal-domain-name-clone").clone().removeClass('is-hidden').addClass('delete-modal-cloned-domain').text(selected_domain_names[x]);
      $("#delete-modal-domains").append(cloned_domain);
    }
  }

  //delete multiple rows
  function deleteListings(delete_button){
    delete_button.addClass('is-loading');

    var deletion_ids = getSelectedDomains("id");
    $.ajax({
      url: "/profile/mylistings/delete",
      method: "POST",
      data: {
        ids: deletion_ids
      }
    }).done(function(data){
      delete_button.removeClass('is-loading');
      $("#delete-modal").removeClass('is-active');

      if (data.state == "success"){
        deletionHandler(data.rows, $(".table-row:not(.clone-row).is-selected"));
        successMessage("Successfully deleted " + deletion_ids.length + " listings!");
      }
      else {
        errorMessage(data.message);
      }

      //deselect all rows
      selectAllRows(false);
    });
  }

  //handle post-deletion of multi listings
  function deletionHandler(rows, selected_rows){
    listings = rows;
    for (var x = 0; x < selected_rows.length; x++){
      $(selected_rows[x]).remove();
    }

    //there are no more listings!
    if (rows.length == 0){
      $(".yes-listings-elem").addClass('is-hidden');
      $(".no-listings-elem").removeClass('is-hidden');
      $("#offers-left-tab").addClass('is-hidden');    //hide left offers menu tab if 0 listings
    }
    //recreate the rows
    else {
      createRows();
    }
  }

  //</editor-fold>

//</editor-fold>

//<editor-fold>-------------------------------HELPER FUNCTIONS--------------------------------

//to format a number for $$$$
var moneyFormat = wNumb({
  thousand: ',',
  prefix: '$',
  decimals: 0
});

//get domain_name or ID of all selected rows
function getSelectedDomains(data_name, verified, editable){

  //return all selected data
  if (typeof verified == undefined){
    return $(".table-row:not(.clone-row).is-selected").map(function(){
      return $(this).data(data_name)
    }).toArray();
  }

  //return verified, unverified, editable, or offer-only
  else {
    if (editable){
      //deselect other ones
      $(".table-row:not(.clone-row).is-selected").filter(function(){
        return $(this).data("unverified") == verified && $(this).data("accepted") == editable
      }).each(function(){
        selectRow($(this), false);
      });

      //return selected ones
      return $(".table-row:not(.clone-row).is-selected").filter(function(){
        return $(this).data("unverified") != verified && $(this).data("accepted") != editable
      }).map(function(){
        return $(this).data(data_name)
      }).toArray();
    }
    else {
      //deselect other ones
      $(".table-row:not(.clone-row).is-selected").filter(function(){
        return $(this).data("unverified") == verified
      }).each(function(){
        selectRow($(this), false);
      });

      //return selected ones
      return $(".table-row:not(.clone-row).is-selected").filter(function(){
        return $(this).data("unverified") != verified
      }).map(function(){
        return $(this).data(data_name)
      }).toArray();
    }
  }
}

//get domain by ID
function getDomainByID(domain_id){
  for (var x = 0; x < listings.length; x++){
    if (listings[x].id == domain_id){
      return listings[x];
    }
  }
}

//</editor-fold>
