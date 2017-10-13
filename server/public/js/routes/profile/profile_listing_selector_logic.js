$(document).ready(function(){
  createRows();

  //<editor-fold>-------------------------------FILTERS-------------------------------

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

  //<editor-fold>-------------------------------BUTTONS-------------------------------

  //select dropper
  $("#selector-select-button").on('click', function(e){
    console.log("WTF")
    $("#select-all-drop").toggleClass('is-hidden');
  });

  //close select dropper on click anywhere else
  $(document).on("click", function(event) {
    if (!$(event.target).closest("#selector-select-button").length) {
      $("#select-all-drop").addClass('is-hidden');
    }
  });

  $(".select-drop-button").on('click', function(){
    selectSpecificRows($(this).data("type"), $(this).data("value"));
    $("#select-all-drop").addClass('is-hidden');
  });

  //select all domains
  $("#select-all").on("click", function(e){
    e.stopPropagation();
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

  //go into stats mode
  $("#selector-stats-button").on('click', function(){
    viewDomainStats();
  });

  //go into verify mode
  $("#selector-verify-button").on("click", function(e){
    viewDomainDNS();
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

  //<editor-fold>-------------------------------URL-------------------------------

  //replace URL tab if not a good tab
  var replace_url = [location.protocol, '//', location.host, location.pathname].join('');
  var url_tab = getParameterByName("tab");
  if (["verify", "info", "rental", "design", "stats", "offers", "purchased"].indexOf(url_tab) == -1){
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
  if (url_selected_listings != "" && ["info", "rental", "design"].indexOf(url_tab) != -1){
    viewDomainDetails(url_tab);
  }
  else if (url_selected_listings != "" && url_tab == "verify"){
    viewDomainDNS();
  }
  else if (url_selected_listings != "" && url_tab == "offers"){
    viewDomainOffers();
  }
  else if (url_selected_listings != "" && url_tab == "stats"){
    viewDomainStats();
  }
  else {
    showSelector();
  }

  //</editor-fold>

});

//function to return to domain selector
function showEditor(url_tab, selected_domain_ids){
  $(".changeable-input").off();

  //hide other tabs and drop-tabs
  $(".drop-tab").addClass('is-hidden');
  $(".tab.verified-elem").removeClass('is-active');

  //update URL if exists
  if (url_tab){
    updateQueryStringParam("tab", url_tab);
    $("#" + url_tab + "-tab").addClass('is-active');
    $("#" + url_tab + "-tab-drop").show().removeClass('is-hidden');
  }
  if (selected_domain_ids.length > 0){
    updateQueryStringParam("listings", selected_domain_ids);
  }
  errorMessage(false);
  successMessage(false);
  $("#domain-selector").addClass('is-hidden');
  $("#domain-editor").removeClass('is-hidden');
  leftMenuActive();
}

//<editor-fold>-------------------------------CREATE ROWS OF DOMAINS-------------------------------

//function to create all rows
function createRows(selected_ids){
  //empty the table and hide loading
  $("#table-body").find(".table-row:not(.clone-row)").remove();
  $("#loading-tab").addClass('is-hidden');

  var url_listings = getParameterByName("listings")

  if (selected_ids == false){
    removeURLParameter("listings");
  }
  else if (!selected_ids && url_listings){
    selected_ids = url_listings.split(",");
  }
  else {
    selected_ids = [];
  }

  //if listings, create rows
  if (listings.length > 0){
    $("#loading-tab").addClass('is-hidden');
    //create rows for each listing
    for (var x = 0; x < listings.length; x++){

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
      $("#table-body").append(createRow(listings[x], x, selected));
    }

    multiSelectButtons();
  }
  //there are no listings to show!
  else {
    $("#no-domains-row").removeClass('is-hidden');
  }
}

//function to create a listing row
function createRow(listing_info, rownum, selected){
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

  if (selected){
    selectRow(tempRow, true);
  }

  return tempRow;
}

//function to update row data
function updateRowData(row, listing_info){
  //already got the dns and a records for unverified domain
  if (listing_info.a_records != undefined && listing_info.whois != undefined){
    row.data("record_got", true);
  }

  row.data("id", listing_info.id);
  row.data("all", true);    //for selecting all
  row.data("domain_name", listing_info.domain_name);
  row.data("unverified", (listing_info.verified) ? false : true);
  row.data("verified", (listing_info.verified) ? true : false);
  row.data("rented", listing_info.rented);
  row.data("status", (listing_info.status == 1) ? true : false);
  row.data("inactive", (listing_info.status == 0 && listing_info.verified) ? true : false);
}

//update the clone row with row specifics
function updateDomainRow(tempRow, listing_info){
  var clipped_domain_name = (listing_info.domain_name.length > 100) ? listing_info.domain_name.substr(0, 97) + "..." : listing_info.domain_name;
  var listing_href = (user.stripe_subscription_id) ? "https://" + listing_info.domain_name.toLowerCase() : "/listing/" + listing_info.domain_name;

  tempRow.find(".td-domain").html("<a href='" + listing_href + "' class='is-underlined'>" + clipped_domain_name + "</a>");
  tempRow.find(".td-date").text(moment(listing_info.date_created).format("M/D/YYYY"));
  tempRow.find(".td-status").text((listing_info.verified) ? ((listing_info.status) ? "Active" : "Inactive") : "Unverified");
  tempRow.find(".td-min").text((listing_info.min_price) ? moneyFormat.to(parseFloat(listing_info.min_price)) : "-");
  tempRow.find(".td-bin").text((listing_info.buy_price) ? moneyFormat.to(parseFloat(listing_info.buy_price)) : "-");
  tempRow.find(".select-button").off().on('click', function(e){
    e.stopPropagation();
    toggleSelectRow(tempRow);
  });
}

//</editor-fold>

//<editor-fold>-------------------------------SELECT ROW-------------------------------

//function to select a row
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

//function to toggle a row select
function toggleSelectRow(row){
  var selected = (row.hasClass("is-selected")) ? false : true;
  row.toggleClass('is-selected');
  row.find(".select-button").prop("checked", selected);
  multiSelectButtons(row);
}

//function to select all rows
function selectAllRows(select){
  //select all
  if (select){
    $("#select-all").data('selected', true).prop("checked", true);
    $(".table-row:not(.clone-row)").addClass('is-selected');
    $(".table-row .select-button").prop("checked", true);
  }
  //deselect all
  else {
    $("#select-all").data('selected', false).prop("checked", false);
    $(".table-row:not(.clone-row)").removeClass('is-selected');
    $(".table-row .select-button").prop("checked", false);
  }
  multiSelectButtons();
}

//function to select specific type of row
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

  //every row is selected
  if (not_selected_rows.length == 0){
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

//function to view domain details and edit them
function viewDomainDetails(url_tab){
  var selected_domain_ids = getSelectedDomains("id", true);
  if (selected_domain_ids.length > 0){
    if (!url_tab){
      url_tab = "info";
    }
    showEditor(url_tab, selected_domain_ids);
    $("#edit-toolbar").removeClass('is-hidden');
    $("#offers-toolbar").addClass('is-hidden');
    updateEditorEditing(selected_domain_ids);
  }
  else {
    window.history.replaceState({}, "", "/profile/mylistings");
  }
}

//function to view domain offers
function viewDomainOffers(url_tab){
  var selected_domain_ids = getSelectedDomains("id", true);
  showEditor("offers", selected_domain_ids);
  $("#edit-toolbar").addClass('is-hidden');
  $("#offers-toolbar").removeClass('is-hidden');
  updateEditorOffers(selected_domain_ids);
}

//function to view domain stats
function viewDomainStats(url_tab){
  var selected_domain_ids = getSelectedDomains("id", true);
  showEditor("stats", selected_domain_ids);
  $("#edit-toolbar").addClass('is-hidden');
  $("#offers-toolbar").addClass('is-hidden');
  updateEditorStats(selected_domain_ids);
}

//function to change domain
function viewDomainDNS(){
  var selected_domain_ids = getSelectedDomains("id", false);
  if (selected_domain_ids.length > 0){
    showEditor("verify", selected_domain_ids);
    $("#edit-toolbar").addClass('is-hidden');
    updateEditorUnverified(selected_domain_ids);
  }
  else {
    window.history.replaceState({}, "", "/profile/mylistings");
  }
}

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
      selectAllRows(false);
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

//</editor-fold>

//<editor-fold>-------------------------------HELPER FUNCTIONS--------------------------------

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

//get domain by ID
function getDomainByID(domain_id){
  for (var x = 0; x < listings.length; x++){
    if (listings[x].id == domain_id){
      return listings[x];
    }
  }
}

//</editor-fold>
