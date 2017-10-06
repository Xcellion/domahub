$(document).ready(function() {

  //<editor-fold>-------------------------------TEXT AREA BINDINGS-------------------------------

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

  //</editor-fold>

  //<editor-fold>-------------------------------TABLE BINDINGS-------------------------------

  //scroll to next error
  $("#scroll-error-button").on("click", function(){
    $('html, body').stop().animate({
      scrollTop: $("input.is-danger").offset().top - 100
    }, 500, function(){
      $("input.is-danger:first").focus();
    });
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
    refreshNotification();
  });

  //delete all errored rows
  $(".delete-errors-button").on("click", function(e){
    deleteErroredRows();
    handleSubmitDisabled();
    refreshNotification();
  });

  //submit to create listings
  $("#domains-submit").on("click", function(e){
    e.preventDefault();
    submitDomains($(this));
  });

  //</editor-fold>

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
  
});

//<editor-fold>-------------------------------HELPERS-------------------------------

//helper function to show next help text
function showHelpText(help_text_id){
  $(".content-wrapper").addClass("is-hidden");
  $("#" + help_text_id + "-helptext").removeClass('is-hidden');
}

//helper function to display/hide error messages
function errorMessage(message){

  //hide success
  $("#domain-success-message").addClass("is-hidden").removeClass("is-active");

  //show errors or hide errors
  if (message == "invalid domains"){
    $("#domain-error-text").text("Some domain names were invalid! See below for more details.");
    $("#scroll-error-button").removeClass('is-hidden');
    $("#domain-error").removeClass("is-hidden").addClass("is-active");
  }
  else {

    //hide scroll to button
    $("#scroll-error-button").addClass('is-hidden');

    if (message){
      $("#domain-error-text").text(message);
      $("#domain-error").removeClass("is-hidden").addClass("is-active");
    }
    else {
      $("#domain-error").addClass("is-hidden").removeClass("is-active");
    }
  }
}

//</editor-fold>

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
      submit_elem.removeClass('is-loading').off().on("click", function(e){
        e.preventDefault();
        submitDomainNames(submit_elem);
      });

      //successfully checked domain names
      if (data.state == "success"){
        createTable(data.bad_listings, data.good_listings);
      }
      else {
        errorMessage(data.message);
      }
    }).error(function(){
      submit_elem.removeClass('is-loading').off().on("click", function(e){
        e.preventDefault();
        submitDomainNames(submit_elem);
      });
      errorMessage("You can only create up to 500 domains at a time!");
    })
  }
}

//function to create the listing table from server info after initial textarea
function createTable(bad_listings, good_listings){
  $("#domain-input-form").addClass('is-hidden');
  $("#table-columns").removeClass('is-hidden');

  if (bad_listings.length > 0){
    errorMessage("invalid domains");
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
    refreshNotification();
    handleSubmitDisabled();
  });

  //reasons for why it was a bad listing
  handleBadReasons(data.reasons, temp_table_row);

  $("#clone-row").addClass("is-hidden");
  temp_table_row.appendTo("#domain-input-body");
  temp_table_row.find(".domain-name-input").focus();

  refreshNotification();
}

//function to show or disable submit
function handleSubmitDisabled(){
  //show the table related help text
  showHelpText("table");

  //see if we should remove disable on submit button
  if ($(".domain-name-input").filter(function(){ return $(this).val() != "" && !$(this).hasClass("is-disabled")}).length > 0
  && $(".notification.is-danger:not(.is-hidden)").length == 0
  && $(".domain-name-input.is-danger").length == 0){
    $("#domains-submit").removeClass('is-disabled');
  }
  else {
    $("#domains-submit").addClass('is-disabled');
  }
}

//</editor-fold>

//<editor-fold>-------------------------------TABLE SUBMIT-------------------------------

//function to submit table domains (NOT TEXTAREA)
function submitDomains(submit_elem){

  //only if there are no error messages currently
  if ($("#domain-error").hasClass("is-hidden") && $("td .is-danger").length == 0){
    deleteEmptyTableRows();

    var domains = getTableListingInfo(".domain-name-input");

    if (domains.length > 0){
      submit_elem.off().addClass('is-loading');
      submitDomainsAjax(domains, submit_elem);
    }
  }

  //show warning that something needs fixed
  else {
    errorMessage("invalid domains");
    $("#domains-submit").addClass('is-disabled');
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
    console.log(data);
    refreshNotification();

    //handle any good or bad listings
    refreshRows(data.bad_listings, data.good_listings);

    if (data.state == "error"){
      //some unhandled error
      if (!data.bad_listings && !data.good_listings){
        showTable();
      }

      errorMessage(data.message);
    }

    if (data.bad_listings && data.bad_listings.length == 0){
      showHelpText("success");
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

//function to delete all errored rows
function deleteErroredRows(){
  $(".table-row.errored-row").not("#clone-row").remove();
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
  errorMessage(false);
  $("#domain-success-message").addClass("is-hidden").removeClass("is-active");

  //remove small error reasons
  $("td small").remove();
  $("td .is-danger").removeClass("is-danger");

  //remove disabled success rows
  $("td .is-primary").closest("tr").remove();
}

//label the incorrect table rows
function badTableRows(bad_listings){
  errorMessage("invalid domains");
  for (var x = 0; x < bad_listings.length; x++){
    var table_row = $($(".table-row").not("#clone-row")[bad_listings[x].index]);
    handleBadReasons(bad_listings[x].reasons, table_row);
  }
}

//function to edit the rows to append any bad reasons
function handleBadReasons(reasons, row){
  if (reasons){

    //refresh the row
    row.addClass('errored-row');
    row.find("small").remove();
    row.find('.is-danger').removeClass("is-danger");

    //append latest one
    for (var x = 0; x < reasons.length; x++){
      var explanation = $("<small class='is-danger tip'>" + reasons[x] + "</small>")
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
    table_row.find(".domain-name-input, .min-price-input").addClass('is-disabled');
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
