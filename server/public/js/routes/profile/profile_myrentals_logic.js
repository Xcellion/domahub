var row_display = rentals.slice(0);

$(document).ready(function() {

});

//function to create all the rows
function createAllRows(row_per_page, current_page){
    $("#table_body").empty();
    var rental_start = row_per_page * (current_page - 1);
    for (var x = 0; x < row_per_page; x++){
        if (row_display[rental_start]){
            $("#table_body").append(createRow(row_display[rental_start], rental_start));
            $("#table_body").append(createRowDrop(row_display[rental_start], rental_start));
        }
        rental_start++;
    }
}

//function to create a rental row
function createRow(rental_info, rownum){
    tempRow = $("<tr class='row-disp' id='row" + rownum + "'></tr>");

    tempRow.append(createArrow(rental_info));
    tempRow.append(createDomain(rental_info));
    tempRow.append(createStatus(rental_info));
    tempRow.append(createStatusDrop(rental_info));
    tempRow.append(createAddress(rental_info));
    tempRow.append(createView(rental_info));

    tempRow.on("click", function(e){
        editRow($(this));
    });

    tempRow.data("editing", false);
    return tempRow;
}

//function to create the status td
function createStatus(rental_info){
    var text = (rental_info.active == 0) ? "Inactive" : "Active"
    var temp_td = $("<td class='td-visible td-status'>" + text + "</td>");
    return temp_td;
}

//function to create the select dropdown for rental status
function createStatusDrop(rental_info){
    var new_td = $("<td class='td-visible td-status td-status-drop is-hidden'></td>");
        var temp_span = $("<span class='select status-span'></span>");
        var temp_form = $("<form class='drop-form'></form>");
        var temp_select = $("<select class='status_input changeable-input'></select>");
            temp_select.append("<option value='0'>Inactive</option");
            temp_select.append("<option value='1'>Active</option");
            temp_select.val(rental_info.active);
            temp_select.data("name", "status");
    new_td.append(temp_span.append(temp_form.append(temp_select)));

    //prevent clicking status from dropping down row
    temp_select.click(function(e) {
        e.stopPropagation();
    });

    //change the hidden status TD along with dropdown
    temp_select.change(function(e){
        $(this).closest(".td-status-drop").prev(".td-status").text($(this).val());
    });

    return new_td;
}

//function to create the address td
function createAddress(rental_info){
    var temp_td = $("<td class='td-visible td-address'><a class='orange-link' href='" + rental_info.address + "'>" + rental_info.address + "</a></td>");
    return temp_td;
}

//function to create the tv icon
function createView(rental_info){
    var temp_td = $("<td class='td-visible td-view'></td>");
        var temp_a = $("<a class='button' target='_blank' style='target-new: tab;'' href='/listing/" + rental_info.domain_name + "/" + rental_info.rental_id + "'></a>");
            var temp_span = $("<span class='icon'></span>");
                var temp_i = $("<i class='fa fa-external-link'></i>");
            var temp_span2 = $("<span>Add Time</span>");
    temp_td.append(temp_a.append(temp_span.append(temp_i), temp_span2));

    //prevent clicking view from dropping down row
    temp_td.click(function(e) {
        e.stopPropagation();
    });

    return temp_td;
}

//function to create dropdown row
function createRowDrop(rental_info, rownum){
    temp_drop = $("<tr id='row-drop" + rownum + "' class='row-drop'></tr>");
    temp_td = $("<td class='row-drop-td' colspan='5'></td>")
    temp_div_drop = $("<div id='div-drop" + rownum + "' class='div-drop td-visible container'></div>");
    temp_div_col = $("<div class='columns'></div>");

    //append various stuff to the row drop div
    temp_drop.append(temp_td.append(temp_div_drop.append(temp_div_col.append(
        createFormDrop(rental_info),
        createDatesDrop(rental_info)
    ))));
    temp_div_drop.hide();

    return temp_drop;
}

//function to create the submit button and error message column
function createFormDrop(rental_info){
    var temp_col = $("<div class='column'></div>");
    var temp_form = $("<form class='drop-form'></form>");

    //buttons for submit/cancel
    var temp_div4 = $('<div class="control is-grouped"></div>');
        var temp_submit_control = $('<div class="control"></div>');
            var temp_submit_button = $('<a class="save-changes-button button is-disabled is-primary">Save Changes</a>');
        var temp_cancel_control = $('<div class="control"></div>');
            var temp_cancel_button = $('<a class="cancel-changes-button button is-hidden is-danger">Cancel Changes</a>');

    temp_div4.append(temp_submit_control.append(temp_submit_button), temp_cancel_control.append(temp_cancel_button));

    //error message
    var temp_msg = $("<p class='rental-msg is-hidden notification'></p>");
        var temp_msg_delete = $("<button class='delete'></button>");
        temp_msg.append(temp_msg_delete);

    temp_col.append(temp_form.append(temp_div4, temp_msg));

    //to hide the message
    temp_msg_delete.click(function(e){
        e.preventDefault();
        temp_msg.addClass('is-hidden');
    });

    //to submit form changes
    temp_submit_button.click(function(e){
        var row_drop = $(this).closest('.row-drop');
        var row = row_drop.prev(".row-disp");

        submitRentalChanges(row, row_drop, $(this), rental_info);
    });

    //to cancel form changes
    temp_cancel_button.click(function(e){
        var row_drop = $(this).closest('.row-drop');
        var row = row_drop.prev(".row-disp");

        cancelRentalChanges(row, row_drop, $(this), rental_info);
    });

    return temp_col;
}

//function to create start and end dates
function createDatesDrop(rental_info){
    var temp_col = $("<div class='column'></div>");

    var temp_div = $('<div class="has-text-right is-horizontal"></div>');

    var control_wrapper = $("<div class='control is-horizontal'></div>");
    var start_label = $("<p class=''>Start Date</p>");
    var end_label = $("<p class=''>End Date</p>");
    temp_div.append(control_wrapper.append(start_label, end_label));

    for (var x = 0; x < rental_info.date.length; x++){
        var start = moment(new Date(rental_info.date[x]));
        var disp_start = start.format('YYYY/MM/DD, hh:mm A');
        var disp_end = moment(start._d.getTime() + rental_info.duration[x]).format('YYYY/MM/DD, hh:mm A');

        var dates = $("<p class=''>" + disp_start + " - " + disp_end + "</p>");
        var date_wrapper = $("<div class='date-wrapper'></div>");
        temp_div.append(date_wrapper.append(dates));
    }
    temp_col.append(temp_div);

    return temp_col;
}

//function to initiate edit mode
function editRow(row){
    //all others are not editing
    $(".row-disp").each(function(e){
        if ($(this).data('editing') == true && $(this).attr("id") != row.attr("id")){
            $(this).data("editing", false);
            dropRow($(this), false);
            editArrow($(this), false);
            $(this).next(".row-drop").find(".cancel-changes-button").click();
        }
    });

    //are we editing or saving?
    editing = (row.data("editing") == false) ? true : false;
    row.data("editing", editing);

    dropRow(row, editing);
    editArrow(row, editing);
    editStatus(row, editing);

    //cancel any changes if we collapse the row
    if (!editing){
        row.next(".row-drop").find(".cancel-changes-button").click();
    }
}

//function to change status column to editable
function editStatus(row, editing){
    var status_drop_td = row.find(".td-status-drop");
    var status_td = row.find(".td-status");

    if (editing){
        status_td.addClass("is-hidden");
        status_drop_td.removeClass("is-hidden");
    }
    else {
        status_td.removeClass("is-hidden");
        status_drop_td.addClass("is-hidden");
    }
}

// --------------------------------------------------------------------------------- SUBMIT RENTAL UPDATES

//function to cancel the rental submit
function cancelRentalChanges(row, row_drop, cancel_button, rental_info){
    cancel_button.addClass("is-hidden");
    success_button = cancel_button.closest(".control").prev(".control").find(".save-changes-button");
    success_button.removeClass("is-loading is-success is-danger").addClass('is-disabled').text("Save Changes");

    var rental_msg = row_drop.find(".rental-msg");
    rental_msg.addClass('is-hidden');

    //revert back to the old status
    var old_status = (rental_info.active == 0) ? "Inactive" : "Active"
    row.find(".status_input").val(rental_info.active);
    row.find(".td-status").not(".td-status-drop").text(old_status);
}

//function to submit any changes to a rental
function submitRentalChanges(row, row_drop, success_button, rental_info){
    var cancel_button = success_button.closest(".control").next(".control").find(".cancel-changes-button");
    var domain_name = rental_info.domain_name;

    //clear any existing messages
    var rental_msg = row_drop.find(".rental-msg");
    errorMessage(rental_msg);

    success_button.addClass("is-loading");

    $.ajax({
        url: "/listing/" + rental_info.domain_name + "/" + rental_info.rental_id + "/status",
        type: "POST",
        data: {
            active: row.find(".status_input").val()
        }
    }).done(function(data){
        success_button.removeClass("is-loading");
        if (data.state == "success"){
            rentals = data.rentals;
            success_button.addClass("is-disabled");
            cancel_button.addClass('is-hidden');
            refreshSubmitbindings(success_button, cancel_button, rentals, domain_name);
        }
        else {
            cancel_button.click();
            errorMessage(rental_msg, data.message);
        }
    });
}

//helper function to display error messages per listing
function errorMessage(msg_elem, message){
    msg_elem.removeClass('is-hidden');
    msg_elem.find("p").empty();
    if (message){
        msg_elem.append("<p>" + message + "</p>");
    }
    else {
        msg_elem.addClass('is-hidden');
    }
}

//function to refresh listing_info on cancel, submit, input event listeners after AJAX success
function refreshSubmitbindings(success_button, cancel_button, rentals, domain_name){
    for (var x = 0; x < rentals.length; x++){
        if (rentals[x].domain_name == domain_name){
            var row_drop = success_button.closest('.row-drop');
            var row = row_drop.prev(".row-disp");
            var both_rows = row.add(row_drop);

            cancel_button.off().click(function(e){
                cancelRentalChanges(row, row_drop, $(this), rentals[x]);
            });

            success_button.off().click(function(e){
                submitRentalChanges(row, row_drop, $(this), rentals[x]);
            });

            both_rows.find(".drop-form .changeable-input").unbind("input").on("input", function(e){
                changedListingValue($(this), rentals[x]);
            });

            break;
        }
    }
}
