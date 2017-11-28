$(document).ready(function() {

  //function that runs when back button is pressed
  window.onpopstate = function(event) {
    showListingCreateSelector();
  }

  //<editor-fold>-------------------------------MANUAL CREATE-------------------------------

    //<editor-fold>-------------------------------TEXTAREA BINDINGS-------------------------------

    //submit to submit textarea and create the table
    $("#domain-input-form").on("submit", function(e){
      e.preventDefault();
      submitManualTextarea($(this));
    });

    //enter to submit textarea
    $("#domain-names").on("keypress", function(e){
      if (e.which == 13 && !e.shiftKey){
        e.preventDefault();
        submitManualTextarea($(this));
      }
    });

    //</editor-fold>

    //<editor-fold>-------------------------------TABLE BINDINGS-------------------------------

    //go back to
    $("#back-to-listing-create-selector").on("click", function(e){
      history.back();
    });

    //add row to table
    $(".add-domain-button").on("click", function(e){
      clearSuccessRows();
      createTableRow("");
      handleSubmitDisabled();
    });

    //delete all rows
    $(".delete-domains-button").on("click", function(e){
      deleteAllRows();
      handleSubmitDisabled();
      clearNotification();
    });

    //delete all errored rows
    $(".delete-errors-button").on("click", function(e){
      deleteErroredRows();
      handleSubmitDisabled();
      clearNotification();
    });

    //submit to create listings
    $("#domains-submit").on("click", function(e){
      e.preventDefault();
      submitDomains();
    });

    //</editor-fold>

  //</editor-fold>

  //<editor-fold>-------------------------------LOOK UP REGISTAR-------------------------------

  updateRegistrars();

  //button to lookup domains
  $("#lookup-domains-button").on("click", function(){
    lookupRegistrars();
  });

  //</editor-fold>

});

//<editor-fold>-------------------------------MANUAL CREATE-------------------------------

  //<editor-fold>-------------------------------MANUAL TEXTAREA-------------------------------

  //show the textarea manual domain submitter
  function showListingCreateSelector(){
    clearNotification();
    $("#domain-names").val("");
    $(".create-type-selector").removeClass('is-hidden');
    $(".manual-listing-table-elem").addClass('is-hidden');
  }

  //submit textarea domains
  function submitManualTextarea(submit_elem){
    var domain_names = $("#domain-names").val().replace(/\s/g,'').replace(/^[,\s]+|[,\s]+$/g, '').replace(/,[,\s]*,/g, ',').split(",");
    submit_elem.addClass('is-loading');
    clearNotification();
    $.ajax({
      url: "/listings/create/table",
      method: "POST",
      data: {
        domain_names: domain_names
      }
    }).done(function(data){
      submit_elem.removeClass('is-loading');

      //successfully checked domain names, create the table
      if (data.state == "success"){
        createDomainsTable(data.bad_listings, data.good_listings);
      }
      else {
        errorMessage(data.message);
      }
    }).error(function(){
      errorMessage("You can only create up to 500 domains at a time!");
    });
  }

  //</editor-fold>

  //<editor-fold>-------------------------------MANUAL TABLE-------------------------------

  //show the table
  function showManualTable(){
    $(".create-type-selector").addClass('is-hidden');
    $(".manual-listing-table-elem").removeClass('is-hidden');
  }

  //create the listing table from server info after initial textarea
  function createDomainsTable(bad_listings, good_listings){
    window.history.pushState({}, "", "/listings/create#table");

    $(".table-row:not(#clone-row)").remove();

    if (bad_listings.length > 0){
      errorMessage("Some domain names were invalid! See below for more details.");
      for (var x = 0; x < bad_listings.length; x++){
        createTableRow(bad_listings[x]);
      }
    }

    if (good_listings.length > 0){
      for (var y = 0; y < good_listings.length; y++){
        createTableRow(good_listings[y]);
      }
    }

    handleSubmitDisabled();
    showManualTable();
  }

  //create table row
  function createTableRow(data){
    var temp_table_row = $("#clone-row").clone();
    temp_table_row.removeAttr('id').removeClass('is-hidden');    //clone row

    //set row domain data
    if (data){
      temp_table_row.attr("data-domain_name", data.domain_name.toLowerCase())
    }

    temp_table_row.find(".domain-name-input").val(data.domain_name).on("keyup change", function(){
      handleSubmitDisabled();
    });

    //click handler for row delete
    temp_table_row.find(".delete-icon").on("click", function(){
      $(this).closest('tr').remove();
      if ($(".delete-icon").length == 1){
        createTableRow("");
      }
      clearNotification();
      handleSubmitDisabled();
    });

    //handler to clear reasons and append the reason
    temp_table_row.find("input").on("input change", function(){
      //set domain name data
      temp_table_row.attr("data-domain_name", $(this).val());

      //check to see if it's legit domain name
      if ($(this).val().indexOf(".") != -1){
        temp_table_row.removeClass('errored-row');
        $(this).removeClass('is-danger');
        $(this).closest("td").find("small").remove();
        clearNotification();
        handleSubmitDisabled();
      }
    });

    //reasons for why it was a bad listing
    createBadReasons(data.reasons, temp_table_row);

    temp_table_row.appendTo("#domain-input-body");
  }

  //clear any reasons from a row
  function clearRowReasons(row){
    row.removeClass('errored-row').removeClass("success-row");
    row.find("small").remove();
    row.find('.is-danger').removeClass("is-danger");
    row.find('.is-primary').removeClass("is-primary");
  }

  //edit the rows to append any bad reasons
  function createBadReasons(reasons, row){
    if (reasons){
      $("#clear-errored-button").removeClass('is-hidden');
      row.addClass('errored-row');

      //append latest one
      for (var x = 0; x < reasons.length; x++){
        var explanation = $("<small class='is-danger tip is-inline no-margin'>" + reasons[x] + "</small>")
        if (reasons[x] == "Invalid min. price!"){
          var reason_input = ".min-price-input";
        }
        else if (reasons[x] == "Invalid BIN price!"){
          var reason_input = ".buy-price-input";
        }
        else {
          var reason_input = ".domain-name-input";
        }
      }

      row.find(reason_input).addClass('is-danger').closest('td').append(explanation);
    }
  }

  //edit the rows to append any good reasons
  function createGoodReasons(reasons, row){
    if (reasons){

      //append latest one
      for (var x = 0 ; x < reasons.length ; x++){
        var explanation = $("<small class='is-primary tip is-inline no-margin'>" + reasons[x] + "</small>")
        row.find('.domain-name-input').closest("td").append(explanation);
      }
      row.addClass('success-row').find(".table-input").removeClass('is-danger').addClass('is-primary').addClass('is-disabled');
    }
  }

  //</editor-fold>

  //<editor-fold>-------------------------------MANUAL TABLE SUBMIT-------------------------------

  //show or disable submit
  function handleSubmitDisabled(){
    //see if we should remove disable on submit button
    if ($(".domain-name-input").filter(function(){ return $(this).val() != "" && !$(this).hasClass("is-disabled")}).length > 0
    && $(".notification.is-danger:not(.is-hidden)").length == 0
    && $(".domain-name-input.is-danger").length == 0){
      $("#domains-submit").removeClass('is-hidden');
    }
    else {
      $("#domains-submit").addClass('is-hidden');
    }
  }

  //get the table row values for ajax submission
  function getTableListingInfo(){
    var temp_array = [];
    $(".table-row").not("#clone-row").each(function(idx, elem) {
      var temp_row = $(this);
      //if domain name is not empty and not disabled
      if (temp_row.find(".domain-name-input").val() && !temp_row.find(".domain-name-input").hasClass('is-disabled')){
        var row_obj = {
          domain_name : temp_row.find(".domain-name-input").val().replace(/\s/g, ''),
          min_price : (temp_row.find(".min-price-input").val() == "") ? 0 : temp_row.find(".min-price-input").val(),
          buy_price : (temp_row.find(".buy-price-input").val() == "") ? 0 : temp_row.find(".buy-price-input").val()
        };
        temp_array.push(row_obj);
      }
    });
    return temp_array;
  }

  //submit table domains (NOT TEXTAREA)
  function submitDomains(submit_elem){
    deleteEmptyTableRows();
    var domains = getTableListingInfo(".domain-name-input");
    if (domains.length > 0){
      $("#domains-submit").addClass('is-loading');
      deleteGoodTableRows();
      clearNotification();
      $.ajax({
        url: "/listings/create",
        method: "POST",
        data: {
          domains: domains
        }
      }).done(function(data){
        $("#domains-submit").removeClass('is-loading');
        clearNotification();

        if (data.state == "error"){
          if (data.message == "max-domains-reached"){
            errorMessage("You have reached the maximum 100 domains for a Basic account. Please <a class='is-underlined' href='/profile/settings#premium'>upgrade to a Premium account</a> to create more listings!");
          }
          else {
            errorMessage(data.message);
          }
        }
        else {
          //handle any good or bad listings
          updateRows(data.bad_listings, data.good_listings);
        }

        handleSubmitDisabled();
      });
    }
  }

  //delete table rows that are already successful (so we dont create duplicates)
  function deleteGoodTableRows(){
    var good_domain_inputs = $(".domain-name-input").filter(function() { return $(this).hasClass("is-disabled");});
    good_domain_inputs.closest("tr").not("#clone-row").remove();
    if ($(".table-row").length == 1){
      createTableRow("");
    }
  }

  //</editor-fold>

  //<editor-fold>-------------------------------TABLE BUTTONS-------------------------------

  //delete empty table rows
  function deleteEmptyTableRows(){
    var empty_domain_inputs = $(".domain-name-input").filter(function() { return $(this).val() == ""; });
    empty_domain_inputs.closest("tr").not("#clone-row").remove();
    if ($(".table-row").length == 1){
      createTableRow("");
    }
  }

  //delete all rows
  function deleteAllRows(){
    $(".table-row").not("#clone-row").remove();
    if ($(".table-row").length == 1){
      createTableRow("");
    }
  }

  //delete all errored rows
  function deleteErroredRows(){
    $(".table-row.errored-row").not("#clone-row").remove();
    if ($(".table-row").length == 1){
      createTableRow("");
    }
  }

  //</editor-fold>

  //<editor-fold>-------------------------------TABLE UPDATE-------------------------------

  //clear all successful rows
  function clearSuccessRows(){
    $(".domain-name-input.is-disabled").closest(".table-row").not("#clone-row").remove();
    clearNotification();
  }

  //refresh rows on ajax return
  function updateRows(bad_listings, good_listings){
    //remove small error reasons
    $("td small").remove();
    $("td .is-danger").removeClass("is-danger");

    //hide submit now
    $("#domains-submit").addClass('is-hidden');

    //append bad reasons
    if (bad_listings && bad_listings.length > 0){
      for (var x = 0; x < bad_listings.length; x++){
        createBadReasons(
          bad_listings[x].reasons,
          $(".table-row:not(#clone-row)[data-domain_name='" + bad_listings[x].domain_name + "']")
        );
      }
    }

    //append success message to inputs
    if (good_listings && good_listings.length > 0){
      for (var x = 0; x < good_listings.length; x++){
        createGoodReasons(
          good_listings[x].reasons,
          $(".table-row:not(#clone-row)[data-domain_name='" + good_listings[x].domain_name + "']")
        );
      }
    }

    //notify the user
    if (!good_listings || (good_listings.length == 0 && bad_listings.length > 0)){
      var error_amount = (bad_listings.length == 1) ? "a domain name" : bad_listings.length + " domains"
      errorMessage("There was something wrong with " + error_amount + "! See below for more details.");
    }
    else if (!bad_listings || (bad_listings.length == 0 && good_listings.length > 0)){
      var success_amount = (good_listings.length == 1) ? "a listing" : good_listings.length + " listings"
      successMessage("Successfully created " + success_amount + "! Please go to your <a href='/profile/mylistings' class='is-underlined'>My Listings page</a> to view your newly created listings!")
    }
    else if (good_listings.length > 0 && bad_listings.length > 0){
      var success_amount = (good_listings.length == 1) ? "a listing" : good_listings.length + " listings"
      var error_amount = (bad_listings.length == 1) ? "a domain name" : bad_listings.length + " domains"
      successMessage("Successfully created " + success_amount + "! Please go to your <a href='/profile/mylistings' class='is-underlined'>My Listings page</a> to view your newly created listings!</br></br>There was an issue with " + error_amount + ". Please see below for more details.");
    }
  }

  //</editor-fold>

//</editor-fold>

//<editor-fold>-------------------------------LOOKUP REGISTAR-------------------------------

//initialize the registrar domain name look ups
function lookupRegistrars(){
  if (user.registrars.length > 0){
    clearNotification();
    $("#lookup-domains-button").addClass('is-loading');
    $.ajax({
      url: "/profile/registrar/lookup",
      method: "POST"
    }).done(function(data){
      $("#lookup-domains-button").removeClass('is-loading');
      if (data.state == "success"){
        if (data.good_listings.length > 0){
          var total_good_domains = (data.good_listings.length == 1) ? "an unlisted domain" : data.good_listings.length + " unlisted domains"
          successMessage("Successfully found " + total_good_domains + " from your connected registrars!");
          createDomainsTable(data.bad_listings, data.good_listings);
        }
        else {
          errorMessage("You don't have any domains in your connected registrars! If there is something wrong, please contact us for assistance!");
        }
      }
      else {
        errorMessage(data.message);
      }
    });
  }
  else {
    errorMessage("You don't have any registrars to look up! Please click a connect button to add specific registrars.");
  }
}

//</editor-fold>
