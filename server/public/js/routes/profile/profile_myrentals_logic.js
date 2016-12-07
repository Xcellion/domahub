var row_display = rentals.slice(0);
var listing_info = {};

$(document).ready(function() {
	//fix weird issue with modal and fullcalendar not appearing
	$("#calendar").appendTo("#calendar-modal-bottom");
	var cal_height = $("#calendar-modal-content").height() - $("#calendar-modal-top").height() - 100;
	$('#calendar').fullCalendar('option', 'contentHeight', cal_height);

    //various ways to close calendar modal
	$('.modal-close, .modal-background').click(function() {
	  	$('#listing-modal').removeClass('is-active');
		delete_cookie("modal-active");
	});

	//esc key to close modal
	$(document).keyup(function(e) {
		if (e.which == 27) {
			$('#listing-modal').removeClass('is-active');
			delete_cookie("modal-active");
		}
	});
});

// --------------------------------------------------------------------------------- CREATE ROW

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
    tempRow.append(createAddressDrop(rental_info));
    tempRow.append(createAddress(rental_info));
    tempRow.append(createAddTime(rental_info));

    tempRow.on("click", function(e){
        editRow($(this));
    });

    tempRow.data("editing", false);
    return tempRow;
}

//function to create the status td
function createStatus(rental_info){
    var text = (rental_info.status == 0) ? "Inactive" : "Active"
    var temp_td = $("<td class='td-visible td-status'>" + text + "</td>");
    return temp_td;
}

// --------------------------------------------------------------------------------- CREATE ROW DROP

//function to create the select dropdown for rental status
function createStatusDrop(rental_info){
    var new_td = $("<td class='td-visible td-status td-status-drop is-hidden'></td>");
        var temp_span = $("<span class='select status-span'></span>");
        var temp_form = $("<form class='drop-form'></form>");
        var temp_select = $("<select class='status_input changeable-input'></select>");
            temp_select.append("<option value='0'>Inactive</option");
            temp_select.append("<option value='1'>Active</option");
            temp_select.val(rental_info.status);
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
    var temp_td = $("<td class='td-visible td-address'><div class='address-div-wrapper'><a class='orange-link' href='" + rental_info.address + "'>" + rental_info.address + "</a><div></td>");
    return temp_td;
}

//function to create the address input dropdown for rental address
function createAddressDrop(rental_info){
    var new_td = $("<td class='td-visible td-address td-address-drop is-hidden'></td>");
        var temp_span = $("<span class='is-fullwidth address-span'></span>");
        var temp_form = $("<form class='drop-form'></form>");
        var temp_input = $("<input class='address_input input changeable-input'></input>");
            temp_input.val(rental_info.address);
            temp_input.data("name", "address");
    new_td.append(temp_span.append(temp_form.append(temp_input)));

    //prevent clicking from dropping down row
    temp_input.click(function(e) {
        e.stopPropagation();
    });

    //change the hidden status TD along with dropdown
    temp_input.change(function(e){
        $(this).closest(".td-address-drop").prev(".td-address").text($(this).val());
    });

    return new_td;
}

//function to create the add time
function createAddTime(rental_info){
    var temp_td = $("<td class='td-visible td-view'></td>");
        var temp_a = $("<a class='button no-shadow'></a>");
            var temp_span = $("<span class='icon'></span>");
                var temp_i = $("<i class='fa fa-clock-o'></i>");
            var temp_span2 = $("<span>Add Time</span>");
    temp_td.append(temp_a.append(temp_span.append(temp_i), temp_span2));

    //display calendar modal
    temp_td.click(function(e) {
        e.stopPropagation();    //prevent clicking view from dropping down row
        addTimeRental(rental_info, temp_a);
    });

    return temp_td;
}

//function to create dropdown row
function createRowDrop(rental_info, rownum){
    temp_drop = $("<tr id='row-drop" + rownum + "' class='row-drop'></tr>");
    temp_td = $("<td class='row-drop-td' colspan='5'></td>")
    temp_div_drop = $("<div id='div-drop" + rownum + "' class='div-drop td-visible container'></div>");

    //append various stuff to the row drop div
    temp_drop.append(temp_td.append(temp_div_drop.append(
        createDatesDrop(rental_info),
        createFormDrop(rental_info)
    )));
    temp_div_drop.hide();

    return temp_drop;
}

//function to create the submit button and error message column
function createFormDrop(rental_info){
    var temp_cols = $("<div class='columns'></div>");
    var temp_col = $("<div class='column is-3'></div>");
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

    temp_cols.append(temp_col.append(temp_form.append(temp_div4, temp_msg)));

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

    return temp_cols;
}

//function to create start and end dates
function createDatesDrop(rental_info){
    var temp_cols = $("<div class='columns'></div>");
    var temp_col_start = $("<div class='column is-3'></div>");
    var temp_p_start = $("<p class='is-bold'>Rental Start</p>");
    temp_col_start.append(temp_p_start);

    var temp_col_end = $("<div class='column is-3'></div>");
    var temp_p_end = $("<p class='is-bold'>Rental End</p>");
    temp_col_end.append(temp_p_end);

    for (var x = 0; x < rental_info.date.length; x++){
        var disp_start = moment(new Date(rental_info.date[x])).format('MMM DD, YYYY hh:mm A');
        var disp_end = moment(parseFloat(rental_info.date[x]) + parseFloat(rental_info.duration[x])).format('MMM DD, YYYY hh:mm A');

        var p_start = $("<p>" + disp_start + "</p>");
        var p_end = $("<p>" + disp_end + "</p>");

        temp_col_start.append(p_start);
        temp_col_end.append(p_end);
    }
    temp_cols.append(temp_col_start, temp_col_end);

    return temp_cols;
}

// --------------------------------------------------------------------------------- CALENDAR MODAL SET UP

function addTimeRental(rental_info, time_button){

    //do ajax for listing info
    time_button.addClass('is-loading');
    $.ajax({
        method: "POST",
        url: "/listing/" + rental_info.domain_name + "/times"
    }).done(function(data){
        time_button.removeClass('is-loading');
        listing_info = data.listing_info;

        //display modal
        $('#listing-modal').addClass('is-active');
        var cal_height = $("#calendar-modal-content").height() - $("#calendar-modal-top").height() - 100;
        $('#calendar').fullCalendar('option', 'contentHeight', cal_height);

        //delete all existing cookies / events (except BG events)
        $('#calendar').fullCalendar('removeEvents', returnNotMineOrBG);
        updatePrices();

        //todo - delete cookie events for all non-same domain names

        var domain_cookie = read_cookie("domain");
        if (domain_cookie == rental_info.domain_name){
            var cookie_events = read_cookie("local_events");
            if (cookie_events){
                var changed = false;

                for (var x = cookie_events.length - 1; x >= 0; x--){
                    //if its a new event, make sure it's past current time
                    if (new Date().getTime() < new Date(cookie_events[x].start).getTime()){
                        $('#calendar').fullCalendar('renderEvent', cookie_events[x], true);
                    }
                    else {
                        changed = true;
                        cookie_events.splice(x, 1);
                    }
                }

                //if we removed any events, change the cookies
                if (changed){
                    storeCookies("local_events");
                }
            }
            updatePrices();	//show prices
        }
        else {
            delete_cookies();
        }

        //change listing info on modal
        $("#rental-domain-name").text(rental_info.domain_name);

        //create existing rentals
        createExisting(listing_info.rentals);
    });
}

// --------------------------------------------------------------------------------- EDIT ROW

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
    editAddress(row, editing);

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

//function to change address column to editable
function editAddress(row, editing){
    var address_drop_td = row.find(".td-address-drop");
    var address_td = row.find(".td-address");

    if (editing){
        address_td.addClass("is-hidden");
        address_drop_td.removeClass("is-hidden");
    }
    else {
        address_td.removeClass("is-hidden");
        address_drop_td.addClass("is-hidden");
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
    var old_status = (rental_info.status == 0) ? "Inactive" : "Active"
    row.find(".status_input").val(rental_info.status);
    row.find(".td-status").not(".td-status-drop").text(old_status);

    //revert back to the old address
    row.find(".address_input").val(rental_info.address);
    row.find(".td-address").not(".td-address-drop").attr("href", rental_info.address);
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
