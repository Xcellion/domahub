$(document).ready(function(){

  //<editor-fold>-------------------------------URL-------------------------------

  // var replace_url = [location.protocol, '//', location.host, location.pathname].join('');
  // var url_tab = getParameterByName("tab");
  // if (["verify", "info", "rental", "design", "stats", "offers", "purchased"].indexOf(url_tab) == -1){
  //   url_tab = "info";
  //   updateQueryStringParam("tab", "info");
  // }
  //
  // var url_listing_index = 0;
  // var url_listing = getParameterByName("listing");
  // if (listings.length){
  //   for (var x = 0 ; x < listings.length; x++){
  //     if (listings[x].domain_name.toLowerCase() == url_listing){
  //       var url_listing_index = x;
  //       break;
  //     }
  //   }
  //
  //   //url_listing doesnt exist in listing var, replace the history
  //   if (url_listing_index == 0){
  //     updateQueryStringParam("listing", listings[0].domain_name);
  //   }
  // }

  //populate all themes
  populateThemeDropdown();

  //</editor-fold>

  //<editor-fold>-------------------------------FILTERS-------------------------------

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

  //sorting
  $("#sort-select").on("change", function(){
    var sort_value = $(this).val().split("-");
    var sort_by = sort_value[0];
    var sort_order = sort_value[1];

    if (sort_order == "asc"){
      listings.sort(function(a,b){
        return a[sort_by] > b[sort_by];
      });
    }
    else if (sort_order == "desc"){
      listings.sort(function(a,b){
        return a[sort_by] < b[sort_by];
      });
    }

    createRows();
  });

  //domain search
  $("#domain-search").on("input keyup", function(){
    $(".table-row:not(.clone-row)").addClass('is-hidden');

    var search_term = $(this).val();

    $(".table-row:not(.clone-row)").filter(function(){
      if ($(this).data('domain_name').indexOf(search_term) != -1){
        return true;
      }
    }).removeClass('is-hidden');

    //something matches new filter
    if ($(".table-row:not(.clone-row):visible:first").length > 0){
      $("#no-listings-row").addClass('is-hidden');
    }
    //nothing matches the new filter
    else {
      $("#no-listings-row").removeClass('is-hidden');
    }
  });

  //filters
  $("#filter-select").on("change", function(){
    $(".table-row:not(.clone-row)").addClass('is-hidden');

    var filter_val = $(this).val();
    $(".table-row:not(.clone-row)").filter(function(){
      if ($(this).data(filter_val)){
        return true;
      }
    }).removeClass('is-hidden');

    //something matches new filter
    if ($(".table-row:not(.clone-row):visible:first").length > 0){
      $("#no-listings-row").addClass('is-hidden');
    }
    //nothing matches the new filter
    else {
      $("#no-listings-row").removeClass('is-hidden');
    }
  });

  //</editor-fold>

  //<editor-fold>-------------------------------DOMAIN LIST AND BUTTONS-------------------------------

  createRows();

  //select all domains
  $("#select-all").data("selected", true).on("click", function(e){
    selectAllRows($(this), $(this).data('selected'));
  });

  //go into edit mode
  $("#go-to-editor").on('click', function(){
    $("#domain-selector").addClass('is-hidden');
    $("#domain-editor").removeClass('is-hidden');
  });

  //multiple verify listings
  $("#selector-verify-button").on("click", function(e){
    viewDomainsDNS();
  });

  //multiple delete listings
  $("#selector-delete-button").on("click", function(e){
    confirmDeleteListings($(this));
  });

  //confirm delete
  $("#delete-confirmed").on("click", function(){
    deleteListings($(this));
  });

  //</editor-fold>

});

//<editor-fold>-------------------------------CREATE ROWS OF DOMAINS-------------------------------

//function to create all rows
function createRows(){
  //empty the table and hide loading
  $("#table-body").find(".table-row:not(.clone-row)").remove();
  $("#loading-tab").addClass('is-hidden');

  //if listings, create rows
  if (listings.length > 0){
    $("#loading-tab").addClass('is-hidden');
    //create rows for each listing
    for (var x = 0; x < listings.length; x++){
      $("#table-body").append(createRow(listings[x], x));
    }
  }
  //there are no listings to show!
  else {
    $("#no-domains-row").removeClass('is-hidden');
  }
}

//function to create a listing row
function createRow(listing_info, rownum){
  //choose a row to clone (accepted listings are verified by default)
  if (listing_info.verified){
    var tempRow = $("#verified-clone-row").clone();
  }
  else {
    var tempRow = $("#unverified-clone-row").clone();
  }

  //update row specifics and add handlers
  tempRow.removeClass('is-hidden clone-row').attr("id", "row-listing_id" + listing_info.id);
  updateDomainRow(tempRow, listing_info);
  updateRowData(tempRow, listing_info);

  //select row by clicking it
  tempRow.on('click', function(e){
    e.stopPropagation();
    selectRow($(this), listing_info);
  });

  return tempRow;
}

//function to update row data
function updateRowData(row, listing_info){
  //already got the dns and a records for unverified domain
  if (listing_info.a_records != undefined && listing_info.whois != undefined){
    row.data("record_got", true);
  }

  row.data("id", listing_info.id);
  row.data("domain_name", listing_info.domain_name);
  row.data("unverified", (listing_info.verified) ? false : true);
  row.data("rented", listing_info.rented);
  row.data("status", (listing_info.status == 1) ? true : false);
  row.data("inactive", (listing_info.status == 0 && listing_info.verified) ? true : false);
}

//update the clone row with row specifics
function updateDomainRow(tempRow, listing_info){
  tempRow.find(".td-domain").text((listing_info.domain_name.length > 100) ? listing_info.domain_name.substr(0, 97) + "..." : listing_info.domain_name);
  tempRow.find(".td-date").text(moment(listing_info.date_created).format("M/D/YYYY"));
  tempRow.find(".td-status").text((listing_info.verified) ? ((listing_info.status) ? "Active" : "Inactive") : "Unverified");
  tempRow.find(".td-min").text((listing_info.min_price) ? moneyFormat.to(listing_info.min_price) : "-");
  tempRow.find(".td-bin").text((listing_info.buy_price) ? moneyFormat.to(listing_info.buy_price) : "-");
  tempRow.find(".select-button").off().on('click', function(e){
    e.stopPropagation();
    selectRow(tempRow, listing_info);
  });
}

//</editor-fold>

//<editor-fold>-------------------------------SELECT ROW-------------------------------

//function to select a row
function selectRow(row, listing_info){
  var selected = (row.hasClass("is-selected")) ? false : true;
  row.toggleClass('is-selected');
  row.find(".select-button").prop("checked", selected);
  multiSelectButtons($(this));
}

//function to select all rows
function selectAllRows(select_all_button, select){

  //select all
  if (select){
    select_all_button.data('selected', true);
    select_all_button.find("i").removeClass("fa-square-o").addClass('fa-check-square-o box-checked');

    $(".table-row:not(.clone-row)").addClass('is-selected');
    $(".table-row .select-button").prop("checked", true);
  }
  //deselect all
  else {
    select_all_button.data('selected', false);
    select_all_button.find("i").addClass("fa-square-o").removeClass('fa-check-square-o box-checked');

    $(".table-row:not(.clone-row)").removeClass('is-selected');
    $(".table-row .select-button").prop("checked", false);
  }

  select_all_button.data('selected', !select);
  multiSelectButtons();
}

//helper function to handle multi-select action buttons
function multiSelectButtons(clicked_row){
  var selected_rows = $(".table-row:not(.clone-row).is-selected");
  var verified_selected_rows = selected_rows.filter(function(){ return $(this).data("unverified") == false});
  var unverified_selected_rows = selected_rows.filter(function(){ return $(this).data("unverified") == true});

  //selected something (show delete)
  if (selected_rows.length > 0){
    $(".selector-button").removeClass("is-hidden");
  }
  else {
    $(".selector-button").addClass("is-hidden");
  }

  //verified selections (show edit and status toggle)
  if (verified_selected_rows.length > 0 && unverified_selected_rows.length == 0){
    $(".selector-verified-button").removeClass("is-hidden");
  }
  else {
    $(".selector-verified-button").addClass("is-hidden");
  }

  //if any unverified domains were selected
  if (unverified_selected_rows.length > 0 && verified_selected_rows.length == 0){
    $(".selector-unverified-button").removeClass("is-hidden");
  }
  else {
    $(".selector-unverified-button").addClass("is-hidden");
  }
}

//</editor-fold>

//<editor-fold>-------------------------------EDIT DOMAIN DETAILS-------------------------------

//function to change domain
function editDomainDetails(listing_info){

  $(".changeable-input").off();

  //clear any existing messages
  errorMessage(false);
  successMessage(false);

  //change URL param
  updateQueryStringParam("listing", listing_info.domain_name);

  //change domain name header and view button
  $(".current-domain-name").text(listing_info.domain_name);
  $("#current-domain-view").attr("href", (user.stripe_subscription_id) ? "https://" + listing_info.domain_name.toLowerCase() : "/listing/" + listing_info.domain_name);

  //update inputs for purchased/accepted domain
  if (listing_info.deposited || listing_info.accepted){
    editRowPurchased(listing_info);
  }
  //update inputs for verified
  else if (listing_info.verified){
    editRowVerified(listing_info);
  }
  //update inputs for unverified
  else {
    editRowUnverified(listing_info);
  }

  //change the current listing at the end
  current_listing = listing_info;
}

//function to view offers
function viewDomainOffers(){

}

//function to view statistics
function viewDomainOffers(){

}

//</editor-fold>

//<editor-fold>-------------------------------VERIFY LISTINGS-------------------------------

//function to change domain
function viewDomainsDNS(){

  var selected_domain_ids = getSelectedDomains("id", false);

  //clear any existing messages
  errorMessage(false);
  successMessage(false);
  $(".changeable-input").off();

  //show editor
  $("#domain-selector").addClass('is-hidden');
  $("#domain-editor").removeClass('is-hidden');

  //change domain name header
  $("#editor-title").text("Now Verifying - ");
  if (selected_domain_ids.length > 1){
    $(".current-domain-name").text(selected_domain_ids.length + " Domains");
    $(".verification-plural").text("s");
    $(".verification-domains-plural").text("these domains");
  }
  else {
    var verifying_domain = getDomainByID(selected_domain_ids[0]);
    $(".current-domain-name").text(verifying_domain.domain_name);
    $(".verification-plural").text("");
    $(".verification-domains-plural").text("this domain");
  }

  //display the verification menu
  editRowUnverified(selected_domain_ids);
}

//function to multi-verify listings
function multiVerify(verify_button){
  verify_button.off().addClass('is-loading');

  var verify_ids = getSelectedDomains("id", false);

  $.ajax({
    url: "/profile/mylistings/verify",
    method: "POST",
    data: {
      ids: verify_ids
    }
  }).done(function(data){
    verify_button.removeClass('is-loading').blur().on("click", function(){
      multiVerify(verify_button);
    });
    //deselect all rows
    selectAllRows($("#select-all"), false);

    //success!
    if (data.state == "success"){
      successMessage("Successfully verified " + verify_ids.length + " listings!");
      listings = data.listings;
      createRows();
    }
    //unverified listings error
    else if (data.unverified_listings){
      errorMessage("Failed to verify listings! Did you make the necessary DNS changes?");
    }
  });
}

//</editor-fold>

//<editor-fold>-------------------------------DELETE LISTINGS-------------------------------

//function to display delete confirmation modal
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

//function to delete multiple rows
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

    //deselect all rows
    selectAllRows($("#select-all"), false);
    if (data.state == "success"){
      deletionHandler(data.rows, $(".table-row:not(.clone-row).is-selected"));
      successMessage("Successfully deleted " + deletion_ids.length + " listings!");
    }
  });
}

//function to handle post-deletion of multi listings
function deletionHandler(rows, selected_rows){
  listings = rows;
  for (var x = 0; x < selected_rows.length; x++){
    $(selected_rows[x]).remove();
  }

  //there are no more listings!
  if (rows.length == 0){
    $(".yes-listings-elem").addClass('is-hidden');
    $(".no-listings-elem").removeClass('is-hidden');
    $("#loading-tab").addClass('is-hidden');
  }
  //recreate the rows
  else {
    createRows();
  }
}

//</editor-fold>

//<editor-fold>-------------------------------HELPER FUNCTIONS--------------------------------

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

  window.history.replaceState({}, "", baseUrl + params);
};

//function to sort
function sortBy(property_name, asc, a, b){
  if (asc){
    if (a[property_name] < b[property_name]){
      return -1;
    }
    if (a[property_name] > b[property_name]) {
      return 1;
    }
    return 0;
  }
  else {
    if (a[property_name] > b[property_name]){
      return -1;
    }
    if (a[property_name] < b[property_name]) {
      return 1;
    }
    return 0;
  }
}

function toUpperCase(string){
  return string.charAt(0).toUpperCase() + string.substr(1);
}

//to format a number for $$$$
var moneyFormat = wNumb({
  thousand: ',',
  prefix: '$',
  decimals: 0
});

//get domain_name or ID of all selected rows
function getSelectedDomains(data_name, verified){

  //return all selected
  if (typeof verified == undefined){
    return $(".table-row:not(.clone-row).is-selected").map(function(){
      return $(this).data(data_name)
    }).toArray();
  }

  //return verified or unverified selected
  else {
    return $(".table-row:not(.clone-row).is-selected").filter(function(){
      return $(this).data("unverified") != verified
    }).map(function(){
      return $(this).data(data_name)
    }).toArray();
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
