$(document).ready(function() {

  //delete notifications button
  $(".delete").on("click", function(e){
    e.preventDefault();
    handleSubmitDisabled();
  });

  //<editor-fold>-------------------------------LISTING CREATE-------------------------------

  //submit to create the table
  $("#domain-names-submit").on("click", function(e){
    e.preventDefault();
    submitDomainNames($(this));
  });

  //enter to submit textarea
  $("#domain-names").on("keypress", function(e){
    if (e.which == 13){
      e.preventDefault();
      submitDomainNames($(this));
    }
  });

  //add row to table
  $(".add-domain-button").on("click keypress", function(e){
    if (e.which == 1 || e.which == 13 || e.which == 32){
      e.preventDefault();
      clearSuccessRows();
      createTableRow("");
      handleSubmitDisabled();
    }
  });

  //delete all rows
  $(".delete-domains-button").on("click keypress", function(e){
    if (e.which == 1 || e.which == 13 || e.which == 32){
      e.preventDefault();
      deleteAllRows();
      handleSubmitDisabled();
      handleTopAddDomainButton();
      refreshNotification();
    }
  });

  //submit to create listings
  $("#domains-submit").on("click", function(e){
    e.preventDefault();
    submitDomains($(this));
  });

  //go back to edit table
  $("#review-table-button, #goback-button").on("click", function(e){
    e.preventDefault();
    showTable();
    refreshNotification();
  });

  //</editor-fold>

});

//helper function to show next help text
function showHelpText(help_text_id){
  $(".content-wrapper").addClass("is-hidden");
  $("#" + help_text_id + "-helptext").removeClass('is-hidden');
}

//<editor-fold>-------------------------------TEXTAREA CREATE-------------------------------

//function to submit textarea domains
function submitDomainNames(submit_elem){
  var domain_names = $("#domain-names").val().replace(/\s/g,'').replace(/^[,\s]+|[,\s]+$/g, '').replace(/,[,\s]*,/g, ',').split(",");
  if (domain_names.length > 0 && $("#domain-names").val() != ""){
    submit_elem.off();    //remove handler
    submit_elem.addClass('is-loading');

    $.ajax({
      url: "/listings/create/table",
      method: "POST",
      data: {
        domain_names: domain_names
      }
    }).done(function(data){
      createTable(data.bad_listings, data.good_listings);
      submit_elem.removeClass('is-loading');
      submit_elem.off().on("click", function(e){
        e.preventDefault();
        submitDomainNames(submit_elem);
      });
    });
  }
}

//function to create the listing table from server info after initial textarea
function createTable(bad_listings, good_listings){
  $("#domain-input-form").addClass('is-hidden');
  $("#table-columns").removeClass('is-hidden');

  if (bad_listings.length > 0){
    $("#domain-error-message").removeClass("is-hidden").addClass("is-active");
    for (var x = 0; x < bad_listings.length; x++){
      createTableRow(bad_listings[x]);
    }
  }

  if (good_listings.length > 0){
    for (var y = 0; y < good_listings.length; y++){
      createTableRow(good_listings[y]);
    }
  }

  showHelpText("table");
  window.scrollTo(0, 0);    //scroll to top so we can see the help text
  handleSubmitDisabled();
}

//</editor-fold>

//<editor-fold>-------------------------------TABLE CREATE-------------------------------

//function to show the table
function showTable(){
  showHelpText("table");
  $("#domains-submit").removeClass('is-hidden is-disabled');
  $("#table-column").removeClass('is-hidden');
  $("#review-table-button").addClass('is-hidden');
}

//function to create table row
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
    handleSubmitDisabled();
    handleTopAddDomainButton();
    refreshNotification();
  });

  //reasons for why it was a bad listing
  handleBadReasons(data.reasons, temp_table_row);

  $("#clone-row").addClass("is-hidden");
  temp_table_row.appendTo("#domain-input-table");
  temp_table_row.find(".domain-name-input").focus();

  //add addbutton on top if there are too many
  handleTopAddDomainButton();
  refreshNotification();
}

//function to show or disable submit
function handleSubmitDisabled(){
  //show the table related help text
  showHelpText("table");

  //see if we should remove disable on submit button
  if ($(".domain-name-input").filter(function(){ return $(this).val() != "" && !$(this).hasClass("is-disabled")}).length > 0
  && $(".notification.is-danger:not(.is-hidden)").length == 0){
    $("#domains-submit").removeClass('is-disabled');
  }
  else {
    $("#domains-submit").addClass('is-disabled');
  }
}

//if there are more than 10 rows, add the add-domain button to the top as well
function handleTopAddDomainButton(){
  if ($(".table-row").length > 7){
    $("#top-header-row").removeClass('is-hidden');
  }
  else {
    $("#top-header-row").addClass('is-hidden');
  }
}

//</editor-fold>

//<editor-fold>-------------------------------TABLE SUBMIT-------------------------------

//function to submit textarea domains
function submitDomains(submit_elem){

  //only if there are no error messages currently
  if ($("#domain-error-message").hasClass("is-hidden") && $("td .is-danger").length == 0){
    deleteEmptyTableRows();
    var domains = getTableListingInfo(".domain-name-input");

    if (domains.length > 0){
      submit_elem.off().addClass('is-loading');
      submitDomainsAjax(domains, submit_elem);
    }
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
        min_price : temp_row.find(".min-price-input").val()
      };
      temp_array.push(row_obj);
    }
  });
  return temp_array;
}

//function to send ajax to server for domain creation
function submitDomainsAjax(domains, submit_elem){
  deleteGoodTableRows();

  $.ajax({
    url: "/listings/create",
    method: "POST",
    data: {
      domains: domains
    }
  }).done(function(data){
    refreshNotification();

    //handle any good or bad listings
    refreshRows(data.bad_listings, data.good_listings);

    if (data.state == "error"){
      //some unhandled error
      if (!data.bad_listings && !data.good_listings){
        showTable();
      }

      handleErrors(data.message);
    }

    if (data.bad_listings && data.bad_listings.length == 0){
      showHelpText("success");
    }

    //click handler for resubmitting newly added domains
    $("#domains-submit").removeClass('is-loading').off().on("click", function(e){
      submitDomains(submit_elem);
    });

    handleSubmitDisabled();
  });
}

//</editor-fold>

//<editor-fold>-------------------------------TABLE UPDATE-------------------------------

//function to delete empty table rows
function deleteEmptyTableRows(){
  var empty_domain_inputs = $(".domain-name-input").filter(function() { return $(this).val() == ""; });
  empty_domain_inputs.closest("tr").not("#clone-row").remove();
  if ($(".table-row").length == 1){
    createTableRow("");
  }
}

//function to delete all rows
function deleteAllRows(){
  $(".table-row").not("#clone-row").remove();
  if ($(".table-row").length == 1){
    createTableRow("");
  }
}

//function to clear all successful rows
function clearSuccessRows(){
  $(".domain-name-input.is-disabled").closest(".table-row").not("#clone-row").remove();
}

//function to refresh rows on ajax return
function refreshRows(bad_listings, good_listings){
  clearDangerSuccess();
  window.scrollTo(0, 0);    //scroll to top so we can see the notification

  //show which rows were bad
  if (bad_listings && bad_listings.length > 0){
    showTable();
    badTableRows(bad_listings);
  }

  //show which rows were good
  if (good_listings && good_listings.length > 0){
    showTable();
    goodTableRows(good_listings);

    //how many were created successfully
    var success_amount = (good_listings.length == 1) ? "1 domain" : good_listings.length + " domains"
    $("#success-total").text(success_amount);
    $("#domain-success-message").removeClass("is-hidden").addClass("is-active");
  }

  //disable submit and unclick terms
  $("#domains-submit").addClass('is-disabled');
}

//function to refresh notifications if there are no relative rows
function refreshNotification(){
  //hide error notification
  if ($("small.is-danger").length == 0){
    $(".notification.is-danger").addClass("is-hidden").removeClass("is-active");
    $("td small.is-danger").remove();
    $("td .is-danger").removeClass("is-danger");
  }

  //hide success notification
  if ($("tr .td-price .is-disabled").not("#clone-row").length == 0){
    $("#domain-success-message").addClass("is-hidden").removeClass("is-active");
  }
}

//function to remove all success/error messages
function clearDangerSuccess(){
  //notifications
  $("#domain-error-message").addClass("is-hidden").removeClass("is-active");
  $("#domain-success-message").addClass("is-hidden").removeClass("is-active");

  //remove small error reasons
  $("td small").remove();
  $("td .is-danger").removeClass("is-danger");

  //remove disabled success rows
  $("td .is-primary").closest("tr").remove();
}

//label the incorrect table rows
function badTableRows(bad_listings){
  $("#domain-error-message").removeClass("is-hidden").addClass("is-active");
  for (var x = 0; x < bad_listings.length; x++){
    var table_row = $($(".table-row").not("#clone-row")[bad_listings[x].index]);
    handleBadReasons(bad_listings[x].reasons, table_row);
  }
}

//function to edit the rows to append any bad reasons
function handleBadReasons(reasons, row){
  if (reasons){

    //refresh the row
    row.find("small").remove();
    row.find('.is-danger').removeClass("is-danger");

    //append latest one
    for (var x = 0; x < reasons.length; x++){
      var explanation = $("<small class='is-danger tip'>" + reasons[x] + "</small>")
      if (reasons[x] == "Invalid price!"){
        var reason_input = ".buy-price-input";
      }
      else {
        var reason_input = ".domain-name-input";
      }

      //handler to clear reasons and append the reason
      row.find(reason_input).addClass('is-danger').on("input change", function(){
        if ($(this).val().indexOf(".") != -1){
          $(this).removeClass('is-danger');
          $(this).closest("td").find("small").remove();
          refreshNotification();
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
    table_row.find(".domain-name-input, .buy-price-input").addClass('is-disabled');
  }
}

//function to delete empty table rows
function deleteGoodTableRows(){
  var good_domain_inputs = $(".domain-name-input").filter(function() { return $(this).hasClass("is-disabled");});
  good_domain_inputs.closest("tr").not("#clone-row").remove();
  if ($(".table-row").length == 1){
    createTableRow("");
  }
}

//</editor-fold>
