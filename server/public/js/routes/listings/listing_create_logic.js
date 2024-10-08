var using_api = false;

$(document).ready(function() {

  //function that runs when back button is pressed
  window.onpopstate = function(event) {
    showListingCreateSelector();
  }

  //#region -------------------------------MANUAL CREATE-------------------------------

    //#region -------------------------------TEXTAREA BINDINGS-------------------------------

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

    //#endregion

    //#region -------------------------------TABLE BINDINGS-------------------------------

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
    $("#clear-errored-button").on("click", function(e){
      deleteErroredRows();
      handleSubmitDisabled();
      clearNotification();
      $("#clear-errored-button").addClass("is-hidden");
    });

    //submit to create listings
    $("#domains-submit").on("click", function(e){
      e.preventDefault();
      if (using_api){
        successMessage(false);
        $("#api-confirmation-modal").addClass("is-active");
      }
      else {
        submitDomains();
      }
    });

    //using API confirmation of DNS settings changes
    $("#api-confirm-button").on("click", function(e){
      submitDomains();
    });

    //#endregion

  //#endregion

  //#region -------------------------------CSV UPLOAD CREATE-------------------------------

  //selecting a CSV file
  $("#csv-select-input").on("input", function(){
    if (!$(this)[0].files[0]){
      $("#current-csv-file-name").text("None!");
      $("#csv-submit-input").addClass("is-disabled");
    }
    else {
      $("#current-csv-file-name").text($(this)[0].files[0].name);
      $("#csv-submit-input").removeClass("is-disabled");
    }
  });

  //submitting a CSV file
  $("#csv-input-form").on("submit", function(e){
    clearNotification();
    e.preventDefault();

    //if browser supports
    if (isAPIAvailable()){
      var reader = new FileReader();
      reader.readAsText($("#csv-select-input")[0].files[0]);
      reader.onload = function(event){
        var csv = event.target.result;
        var data = $.csv.toObjects(csv);

        //check all the data
        var total_good = 0;
        for (var x = 0 ; x < Math.min(data.length, 100) ; x++){
          if (data[0].domain_name && data[0].min_price && data[0].buy_price){
            total_good++;
          }
        }

        //all good
        if (total_good == data.length){
          createDomainsTable([], data);
        }
        else if (data.length > 100){
          errorMessage("You can only create up to 100 domain listings at a time!");
        }
        else {
          errorMessage("There was an issue with the CSV file you submitted. Did you use the correct format? Please check your file and try again.");
        }
      };
    }
    else {
      errorMessage("Unfortunately, your browser does not support CSV uploads. Please upgrade to the latest version of Chrome or Firefox to utilize this feature.");
    }
  });

  //#endregion


  //#region -------------------------------LOOK UP REGISTAR-------------------------------

  updateRegistrars();

  //button to lookup domains
  $("#lookup-domains-button").on("click", function(){
    lookupRegistrars();
  });

  //#endregion

});

//#region -------------------------------MANUAL CREATE-------------------------------

  //#region -------------------------------MANUAL TEXTAREA-------------------------------

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
        if (data.message == "max-domains-reached"){
          errorMessage("You cannot exceed 100 domains for a Basic account. Please <a class='is-underlined' href='/profile/settings#premium'>upgrade to a Premium account</a> to create more listings!");
        }
        else {
          errorMessage(data.message);
        }
      }
    }).error(function(){
      errorMessage("You can only create up to 100 domains at a time!");
    });
  }

  //#endregion

  //#region -------------------------------MANUAL TABLE-------------------------------

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
        createTableRow(good_listings[y], true);
      }
    }

    handleSubmitDisabled();
    showManualTable();
  }

  //create table row
  function createTableRow(data, good){
    var temp_table_row = $("#clone-row").clone();
    temp_table_row.removeAttr('id').removeClass('is-hidden');    //clone row

    //set row domain data
    if (data && data.domain_name){
      temp_table_row.attr("data-domain_name", punycode.toASCII(data.domain_name.toLowerCase()));
      temp_table_row.find(".domain-name-input").val(data.domain_name).on("keyup change", function(){
        handleSubmitDisabled();
      });
    }

    //set row min_price data
    if (data && data.min_price){
      temp_table_row.attr("data-min_price", data.min_price);
      temp_table_row.find(".min-price-input").val(data.min_price)
    }

    //set row buy_price data
    if (data && data.buy_price){
      temp_table_row.attr("data-buy_price", data.buy_price);
      temp_table_row.find(".buy-price-input").val(data.buy_price)
    }

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
    temp_table_row.find(".domain-name-input").on("input change", function(){
      //set domain name data
      temp_table_row.attr("data-domain_name", $(this).val());

      //check to see if it's legit domain name
      if ($(this).val().indexOf(".") != -1 || $(this).val() == ""){
        temp_table_row.removeClass('errored-row');
        $(this).removeClass('is-danger');
        $(this).closest("td").find("small").remove();
        clearNotification();
      }
      handleSubmitDisabled();
    });

    //looked up from a specific registrar
    if (good){
      createGoodReasons(data.reasons, temp_table_row, true);
    }
    //reasons for why it was a bad listing
    else {
      createBadReasons(data.reasons, temp_table_row);
    }

    temp_table_row.appendTo("#domain-input-body");
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
  function createGoodReasons(reasons, row, registrar){
    if (reasons){
      //append latest one
      for (var x = 0 ; x < reasons.length ; x++){
        var explanation = $("<small class='is-primary tip is-inline no-margin'>" + reasons[x] + "</small>")
        row.find('.domain-name-input').closest("td").append(explanation);
      }

      //only if successfully created, and not successful lookup via registrar
      if (!registrar){
        row.addClass('success-row').find(".table-input").removeClass('is-danger').addClass('is-primary').addClass('is-disabled');
      }
    }
  }

  //#endregion

  //#region -------------------------------MANUAL TABLE SUBMIT-------------------------------

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
  function submitDomains(){
    deleteEmptyTableRows();
    var domains = getTableListingInfo(".domain-name-input");
    if (domains.length > 0){
      $("#domains-submit").addClass('is-loading');
      deleteGoodTableRows();
      clearNotification();
      infoMessage("Now creating listings...this process could take a long time. Do not refresh the page or close the browser when creating a large set of listings.")
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
            errorMessage("You cannot exceed 100 domains for a Basic account. Please <a class='is-underlined' href='/profile/settings#premium'>upgrade to a Premium account</a> to create more listings!");
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

  //#endregion

  //#region -------------------------------TABLE BUTTONS-------------------------------

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

  //#endregion

  //#region -------------------------------TABLE UPDATE-------------------------------

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
          $(".table-row:not(#clone-row)").eq(bad_listings[x].index)
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

  //#endregion

//#endregion

//#region -------------------------------CSV UPLOAD-------------------------------

function isAPIAvailable() {
  // Check for the various File API support.
  if (window.File && window.FileReader && window.FileList && window.Blob) {
    // Great success! All the File APIs are supported.
    return true;
  } else {
    // source: File API availability - http://caniuse.com/#feat=fileapi
    // source: <output> availability - http://html5doctor.com/the-output-element/
    console.log('The HTML5 APIs used in this form are only available in the following browsers:<br />');
    // 6.0 File API & 13.0 <output>
    console.log(' - Google Chrome: 13.0 or later<br />');
    // 3.6 File API & 6.0 <output>
    console.log(' - Mozilla Firefox: 6.0 or later<br />');
    // 10.0 File API & 10.0 <output>
    console.log(' - Internet Explorer: Not supported (partial support expected in 10.0)<br />');
    // ? File API & 5.1 <output>
    console.log(' - Safari: Not supported<br />');
    // ? File API & 9.2 <output>
    console.log(' - Opera: Not supported');
    return false;
  }
}

//#endregion

//#region -------------------------------LOOKUP REGISTAR-------------------------------

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
          using_api = true;
          var total_good_domains = (data.good_listings.length == 1) ? "an unlisted domain" : data.good_listings.length + " unlisted domains"
          var excess_hundred = (data.good_listings.length > 20) ? " Now showing the first 20 listings." : "";
          successMessage("Successfully found " + total_good_domains + " from your connected registrars!" + excess_hundred);
          createDomainsTable(data.bad_listings, data.good_listings.slice(0, 20));
        }
        else if (data.bad_listings.length == 0){
          infoMessage("We couldn't find any unlisted domains in your connected registrars! Please try creating your domain listings manually.</br></br>If there is something wrong, please <a class='is-underlined contact-link' href='/contact'>contact us</a> for assistance!");
        }
        else {
          errorMessage("Something went wrong in looking up your domains! Please refresh the page and try again. If this continues, please create your listings manually.");
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

//#endregion
