$(document).ready(function() {

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
      showListingCreateSelector();
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
      submitDomains($(this));
    });

    //</editor-fold>

  //</editor-fold>

  //<editor-fold>-------------------------------SYNC REGISTAR-------------------------------

  updateRegistrars();

  //button to sync domains
  $("#sync-domains-button").on("click", function(){
    syncRegistrars();
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
        createManualTable(data.bad_listings, data.good_listings);
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
  function createManualTable(bad_listings, good_listings){
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
    var temp_table_row = $("#clone-row").removeClass('is-hidden').clone();    //clone row

    temp_table_row.removeAttr('id');
    temp_table_row.find(".domain-name-input").val(data.domain_name).on("keyup change", function(){
      handleSubmitDisabled();
    });

    temp_table_row.find()

    //click handler for row delete
    temp_table_row.find(".delete-icon").on("click", function(){
      $(this).closest('tr').remove();
      if ($(".delete-icon").length == 1){
        createTableRow("");
      }
      clearNotification();
      handleSubmitDisabled();
    });

    //reasons for why it was a bad listing
    handleBadReasons(data.reasons, temp_table_row);

    $("#clone-row").addClass("is-hidden");
    temp_table_row.appendTo("#domain-input-body");
    temp_table_row.find(".domain-name-input").focus();
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

  //submit table domains (NOT TEXTAREA)
  function submitDomains(submit_elem){
    deleteEmptyTableRows();
    var domains = getTableListingInfo(".domain-name-input");
    if (domains.length > 0){
      submit_elem.off().addClass('is-loading');
      submitDomainsAjax(domains, submit_elem);
    }
  }

  //helper function to get the table row values for ajax submission
  function getTableListingInfo(){
    var temp_array = [];
    $(".table-row").not("#clone-row").each(function(idx, elem) {
      var temp_row = $(this);
      //if domain name is not empty and not disabled
      if (temp_row.find(".domain-name-input").val() && !temp_row.find(".domain-name-input").hasClass('is-disabled')){
        var row_obj = {
          domain_name : temp_row.find(".domain-name-input").val().replace(/\s/g, ''),
          min_price : (temp_row.find(".min-price-input").val() == "") ? 0 : temp_row.find(".min-price-input").val()
        };
        temp_array.push(row_obj);
      }
    });
    return temp_array;
  }

  //send ajax to server for domain creation
  function submitDomainsAjax(domains, submit_elem){
    deleteGoodTableRows();
    clearNotification();
    $.ajax({
      url: "/listings/create",
      method: "POST",
      data: {
        domains: domains
      }
    }).done(function(data){
      clearNotification();

      //handle any good or bad listings
      refreshRows(data.bad_listings, data.good_listings);
      if (data.state == "error"){
        //some unhandled error
        if (!data.bad_listings && !data.good_listings){
          showManualTable();
        }

        if (data.message == "max-domains-reached"){
          errorMessage("You have reached the maximum 100 domains for a Basic account. Please <a class='is-underlined' href='/profile/settings#premium'>upgrade to a Premium account</a> to create more listings!");
        }
        else {
          errorMessage(data.message);
        }

      }

      //click handler for resubmitting newly added domains
      submit_elem.removeClass('is-loading').off().on("click", function(e){
        submitDomains(submit_elem);
      });

      handleSubmitDisabled();
    });
  }

  //</editor-fold>

  //<editor-fold>-------------------------------TABLE UPDATE-------------------------------

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

  //clear all successful rows
  function clearSuccessRows(){
    $(".domain-name-input.is-disabled").closest(".table-row").not("#clone-row").remove();
  }

  //refresh rows on ajax return
  function refreshRows(bad_listings, good_listings){
    clearDangerSuccess();
    window.scrollTo(0, 0);    //scroll to top so we can see the notification

    //show which rows were bad
    if (bad_listings && bad_listings.length > 0){
      showManualTable();
      badTableRows(bad_listings);
    }

    //show which rows were good
    if (good_listings && good_listings.length > 0){
      showManualTable();
      goodTableRows(good_listings);

      //how many were created successfully
      var success_amount = (good_listings.length == 1) ? "a listing" : good_listings.length + " listings"
      successMessage("Successfully created " + success_amount + "! Please go to your <a href='/profile/mylistings' class='is-underlined'>My Listings page</a> to view your newly created listings!")
    }

    //disable submit and unclick terms
    $("#domains-submit").addClass('is-hidden');
  }

  //remove all success/error messages
  function clearDangerSuccess(){
    clearNotification();

    //remove small error reasons
    $("td small").remove();
    $("td .is-danger").removeClass("is-danger");

    //remove disabled success rows
    $("td .is-primary").closest("tr").remove();
  }

  //label the incorrect table rows
  function badTableRows(bad_listings){
    errorMessage("Some domain names were invalid! See below for more details.");
    for (var x = 0; x < bad_listings.length; x++){
      var table_row = $($(".table-row").not("#clone-row")[bad_listings[x].index]);
      handleBadReasons(bad_listings[x].reasons, table_row);
    }
  }

  //edit the rows to append any bad reasons
  function handleBadReasons(reasons, row){
    if (reasons){
      $("#clear-errored-button").removeClass('is-hidden');

      //refresh the row
      row.addClass('errored-row');
      row.find("small").remove();
      row.find('.is-danger').removeClass("is-danger");

      //append latest one
      for (var x = 0; x < reasons.length; x++){
        var explanation = $("<small class='is-danger tip no-margin'>" + reasons[x] + "</small>")
        if (reasons[x] == "Invalid price!"){
          var reason_input = ".min-price-input";
        }
        else {
          var reason_input = ".domain-name-input";
        }

        //handler to clear reasons and append the reason
        row.find(reason_input).addClass('is-danger').on("input change", function(){
          if ($(this).val().indexOf(".") != -1){
            row.removeClass('errored-row');
            $(this).removeClass('is-danger');
            $(this).closest("td").find("small").remove();
            clearNotification();
          }
        }).closest('td').append(explanation);
      }
    }
  }

  //label the correct table rows
  function goodTableRows(good_listings){
    for (var x = 0; x < good_listings.length; x++){
      var table_row = $($(".table-row").not("#clone-row")[good_listings[x].index]);
      var explanation = $("<small class='is-primary tip'>Successfully added!</small>")
      table_row.find(".domain-name-input").addClass('is-primary').closest('td').append(explanation);
      table_row.find(".domain-name-input, .min-price-input").addClass('is-disabled');
    }
  }

  //delete empty table rows
  function deleteGoodTableRows(){
    var good_domain_inputs = $(".domain-name-input").filter(function() { return $(this).hasClass("is-disabled");});
    good_domain_inputs.closest("tr").not("#clone-row").remove();
    if ($(".table-row").length == 1){
      createTableRow("");
    }
  }

  //</editor-fold>

//</editor-fold>

//<editor-fold>-------------------------------SYNC REGISTAR-------------------------------

//initialize the registrar domain name look ups
function syncRegistrars(){
  if (user.registrars.length > 0){
    clearNotification();
    $("#sync-domains-button").addClass('is-loading');
    $.ajax({
      url: "/profile/registrar/sync",
      method: "POST"
    }).done(function(data){
      $("#sync-domains-button").removeClass('is-loading');
      if (data.state == "success"){
        if (data.good_listings.length > 0){

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
    errorMessage("You don't have any registrars to sync with! Please click a connect button to add specific registrars.");
  }
}

//</editor-fold>
