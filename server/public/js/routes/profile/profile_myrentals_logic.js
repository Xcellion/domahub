var row_display = rentals.slice(0)
var listing_info = false;
var rental_min = false;
var refresh_time_submit = false;

$(document).ready(function() {
	//show active ones first
	row_display = row_display.filter(function(rental){
		return filterCheck("active_filter", rental);
	});

    //various ways to close calendar modal
	$('.modal-close, .modal-background').click(function() {

		//refresh the modal after successful time submission
		if (refresh_time_submit){
			successHide(false);
		}

	  	$('#listing-modal').removeClass('is-active');
		listing_info = false;
		rental_min = false;
		delete_cookie("modal-active");
	});

	//esc key to close modal
	$(document).keyup(function(e) {
		if (e.which == 27) {
			//refresh the modal after successful time submission
			if (refresh_time_submit){
				successHide(false);
			}

			listing_info = false;
			rental_min = false;
			$('#listing-modal').removeClass('is-active');
			delete_cookie("modal-active");
		}
	});

    //go to the rental start date
    $("#rent-beginning-button").click(function(e){
        $("#calendar").fullCalendar('gotoDate', rental_min);
    });

	//show checkout modal content
	$('#redirect-next-button').click(function() {
		showModalContent("checkout");
	});

	//show calendar again (press back on checkout)
	$('#edit-dates-button, #checkout-back-button').click(function() {
		showModalContent("calendar");
	});

	//multiple delete rentals
	$("#multi-delete").on("click", function(e){
		multiDelete($(this));
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
    tempRow = $("<tr class='row-disp verified-row' id='row" + rownum + "'></tr>");
	tempRow.data("rental_id", rental_info.rental_id);

    tempRow.append(createIcon(rental_info));
    tempRow.append(createDomain(rental_info));
    tempRow.append(createPreview(rental_info));
	tempRow.append(createEdit(rental_info));
    tempRow.append(createStatus(rental_info, rownum));
    tempRow.append(createAddress(rental_info));
	tempRow.append(createAddressDrop(rental_info));

    tempRow.data("editing", false);
	tempRow.data("selected", false);
	tempRow.data("id", rental_info.rental_id);

	tempRow.click(function(e){
		editRow($(this));
	});

    return tempRow;
}

//function to create the status td
function createStatus(rental_info, rownum){
	var text = "Active";
	var expired_danger = "";
	row_display[rownum].expired = 0;
	for (var x = rental_info.date.length - 1; x >= 0; x--){
		if (new Date().getTime() >= parseInt(rental_info.date[x]) + parseInt(rental_info.duration[x])){
			text = "Expired";
			expired_danger = " is-danger";
			row_display[rownum].expired = 1;
			break;
		}
	}
    var temp_td = $("<td class='td-visible td-status is-hidden-mobile" + expired_danger + "'>" + text + "</td>");
    return temp_td;
}

//function to create the tv icon
function createPreview(rental_info){
    var temp_td = $("<td class='td-view is-hidden-mobile'></td>");
    var temp_a = $("<a class='button no-shadow' target='_blank' title='Preview this rental' style='target-new: tab;' href='/listing/" + rental_info.domain_name + "/" + rental_info.rental_id + "'></a>");
    var temp_span = $("<span class='icon is-small'></span>");
    var temp_i = $("<i class='fa fa-external-link'></i>");
    var temp_span2 = $("<span>Preview</span>");
    temp_td.append(temp_a.append(temp_span.append(temp_i), temp_span2));

    //prevent clicking view from dropping down row
    temp_td.click(function(e) {
        e.stopPropagation();
    });

    return temp_td;
}

//function to create the edit button
function createEdit(listing_info){
    var temp_td = $("<td class='td-edit padding-left-0 is-hidden-mobile'></td>");
    var temp_a = $("<a class='button no-shadow'></a>");
    var temp_span = $("<span class='icon is-small'></span>");
    var temp_i = $("<i class='fa fa-cog'></i>");
    var temp_span2 = $("<span>Edit</span>");
    temp_td.append(temp_a.append(temp_span.append(temp_i), temp_span2));

    //prevent clicking view from dropping down row
    temp_a.click(function(e) {
        e.stopPropagation();
        editRow($(this).closest('.row-disp'));
    });

    return temp_td;
}

// ------------------------------------------------------------------------------------------------------------------------------ CREATE ROW DROP

//function to create the address td
function createAddress(rental_info){
    var temp_td = $("<td class='td-visible td-address is-hidden-mobile'></td>");
    var temp_td_div = $("<div class='address-div-wrapper'><div>");

	if (rental_info.address == ""){
		var temp_address = $("<p>Nothing is being displayed!</p>");
	}
	else {
		var temp_address = $("<a target='_blank' class='is-accent has-bs-underline' href='" + rental_info.address + "'>" + rental_info.address + "</a>");
		//prevent link click from selecting row
		temp_address.click(function(e){
			e.stopPropagation();
		})
	}

	return temp_td.append(temp_td_div.append(temp_address));
}

//function to create the address input dropdown for rental address
function createAddressDrop(rental_info){
    var new_td = $("<td class='td-visible td-address td-address-drop is-hidden is-hidden-mobile'></td>");
        var temp_span = $("<span class='is-fullwidth address-span'></span>");
        var temp_form = $("<form class='drop-form'></form>");
        var temp_input = $("<input placeholder='Nothing is being displayed!' class='address_input input changeable-input'></input>");
            temp_input.val(rental_info.address);
            temp_input.data("name", "address");
    new_td.append(temp_span.append(temp_form.append(temp_input)));

    //prevent clicking from dropping down row
    temp_input.click(function(e) {
        e.stopPropagation();
    });

    //change the hidden address TD along with dropdown
    temp_input.on("input", function(e){
		var address_wrapper = $(this).closest(".td-address-drop").prev(".td-address").find(".address-div-wrapper").empty();
		if ($(this).val() == ""){
			address_wrapper.append($("<p>Nothing is being displayed!</p>"));
		}
		else {
			address_wrapper.append($("<a target='_blank' class='is-accent has-bs-underline' href='" + $(this).val() + "'>" + $(this).val() + "</a>"));
		}
    });

    return new_td;
}

//function to create dropdown row
function createRowDrop(rental_info, rownum){
    var temp_drop = $("<tr id='row-drop" + rownum + "' class='row-drop'></tr>");
    var temp_td = $("<td class='row-drop-td' colspan='6'></td>")
    var temp_div_drop = $("<div id='div-drop" + rownum + "' class='div-drop td-visible container'></div>");
	var temp_cols = $("<div class='columns'></div>");

    //append various stuff to the row drop div
    temp_drop.append(temp_td.append(temp_div_drop.append(temp_cols.append(
        createFormDrop(rental_info),
		createDatesDrop(rental_info),
		createImgDrop(rental_info)
    ))));
    temp_div_drop.hide();

    return temp_drop;
}

//function to create the submit button and error message column
function createFormDrop(rental_info){
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

    temp_col.append(createButtons(rental_info), temp_form.append(temp_div4, temp_msg));

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

//various buttons (add time, view listing, view rental, delete rental)
function createButtons(rental_info){
	var temp_div_buttons = $("<div class='control'></div>");
	var temp_button1 = $("<a target='_blank' href='/listing/" + rental_info.domain_name + "' class='button margin-right-10 margin-bottom-5 no-shadow'>View Listing</a>");
	var temp_button2 = $("<a class='button margin-right-10 no-shadow'>Add Time</a>");
	var temp_button3 = $("<a class='button no-shadow'>Delete Rental</a>");

	//display calendar modal
	temp_button2.on("click", function(e) {
		addTimeRental(rental_info, temp_button2);
	});

	//are you sure?
	temp_button3.on("click", function(e) {
		areYouSure($(this), rental_info)
	});

	temp_div_buttons.append(temp_button1, temp_button2, temp_button3);

	return temp_div_buttons;
}

//function to create start and end dates
function createDatesDrop(rental_info){
    var temp_col = $("<div class='column is-5'></div>");

	var temp_control_labels = $("<div class='control'></div>")
    var temp_p_start = $("<p class='is-inline-block margin-bottom-5 is-bold'>Rental Dates</p>");
	var temp_ol = $("<ol></ol>");

	temp_col.append(temp_control_labels.append(temp_p_start, temp_ol));

    for (var x = 0; x < rental_info.date.length; x++){
        var disp_start = moment(new Date(rental_info.date[x])).format('MMMM DD, YYYY h:mmA');
        var disp_duration = moment.duration(rental_info.duration[x]).humanize();
        var disp_end = moment(parseFloat(rental_info.date[x]) + parseFloat(rental_info.duration[x])).format('MMMM DD, YYYY h:mmA');

        var p_date = $("<li>" + disp_start + " - " + disp_end + " <span class='is-accent'>(" + disp_duration + ")</span></li>");

		temp_ol.append(p_date);
    }

    return temp_col;
}

//function to create the image drop column
function createImgDrop(rental_info){
	if (rental_info.address == ""){
		var background_image = "https://placeholdit.imgix.net/~text?txtsize=40&txt=NO%20PREVIEW&w=200&h=200";
	}
	else if (rental_info.address.match(/\.(jpeg|jpg|gif|png)$/) != null){
		var background_image = rental_info.address;
	}
	else {
		var background_image =  "/screenshot?rental_address=" + rental_info.address + "&width=200&height=200";
	}

    var temp_col = $("<div class='column is-4'></div>");
    var temp_div = $("<div class='card is-pulled-right no-shadow'></div>");
    var temp_div_image = $("<div class='card-image'></div>")
    var temp_figure = $("<figure class='image listing-img is-256x256'></figure>");
    var temp_img = $("<img class='is-listing' alt='Image not found' src=" + background_image + " />");
    var temp_footer = $("<footer class='card-footer has-text-centered'></div>");
    var temp_preview_button = $("<a href='' class='button'>Click to Preview</a>");
    temp_col.append(temp_div.append(temp_div_image.append(temp_figure.append(temp_img)), temp_footer.append(temp_preview_button)));

    //if theres an error in getting the image, remove the link
    temp_img.error(function() {
        $(this).attr("src", "");
    });

    return temp_col;
}

// ------------------------------------------------------------------------------------------------------------------------------ CALENDAR MODAL SET UP

//function to display modal on add time button
function addTimeRental(rental_info, time_a){
	rental_id = rental_info.rental_id;		//for new time submission

	//take off the handler
	time_a.off();

    //do ajax for listing info
    time_a.addClass('is-loading');
    $.ajax({
        method: "POST",
        url: "/listing/" + rental_info.domain_name + "/times"
    }).done(function(data){
        time_a.removeClass('is-loading');
        listing_info = data.listing_info;
		rental_min = moment(rental_info.date[0]).startOf('week');

		displayListingInfo(listing_info);

		//put handler back
		time_a.on("click", function(e) {
	        e.stopPropagation();    //prevent clicking view from dropping down row
	        addTimeRental(rental_info, time_a);
	    });

        //display modal
        $('#listing-modal').addClass('is-active');

		//render calendar
		setUpCalendar(listing_info);
		$('#calendar').fullCalendar('render');

		//fix calendar height for month view
		if (listing_info.price_type != "hour"){
			var cal_height = $(".modal-container-calendar").height() - $("#calendar-modal-top").height() - 90;
			$('#calendar').fullCalendar('option', 'contentHeight', cal_height);
		}

		$("#calendar").fullCalendar('gotoDate', rental_info.date[0]);

        //delete all existing listing events (except BG events)
        $('#calendar').fullCalendar('removeEvents', returnNotMineNotBG);

		//check if there are cookies for this domain name
		if (read_cookie("domain_name") == listing_info.domain_name){
			if (read_cookie("local_events")){
				var cookie_events = read_cookie("local_events");
				var changed = false;
				for (var x = cookie_events.length - 1; x >= 0; x--){
					var partial_days = handlePartialDays(moment(cookie_events[x].start), moment(cookie_events[x].end));
					cookie_events[x].start = partial_days.start;
					cookie_events[x].end = partial_days.end;
					//if its a new event, make sure it doesnt overlap
					if (checkIfNotOverlapped(cookie_events[x])){
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

		updatePrices();	//show prices

        //create existing rentals
        createExisting(listing_info.rentals);
    });
}

//function to update various listing info in add time modal
function displayListingInfo(listing_info){

	//update pricing
	$("#listing-hour-price").text("$" + listing_info.hour_price);
	$("#listing-day-price").text("$" + listing_info.day_price);
	$("#listing-week-price").text("$" + listing_info.week_price);
	$("#listing-month-price").text("$" + listing_info.month_price);

    //change domain name
    $(".rental-domain-name").text(listing_info.domain_name);
	$("#href-domain").prop("href", "http://www." + listing_info.domain_name);
	$("#href-domain").text(listing_info.domain_name);
}

// ------------------------------------------------------------------------------------------------------------------------------ DELETE RENTAL

//function to make sure of deletion
function areYouSure(delete_button, rental_info){
	delete_button.off().text("Are you sure?").addClass('is-danger');
 	//freeze for 500ms to prevent dbl click
	setTimeout(function() {
		delete_button.on('click', function(){
			delete_button.off();
			deleteRental(rental_info, delete_button);
		});
    }, 500);
}

//function to delete rental
function deleteRental(rental_info, delete_button){
	$.ajax({
		url: "/listing/" + rental_info.domain_name + "/" + rental_info.rental_id + "/delete",
		method: "POST"
	}).done(function(data){
		var row_drop = delete_button.closest(".row-drop");
		var row = row_drop.prev(".row-disp");

		if (data.state == "success"){
			rentals = data.rentals;
			row_display = rentals.slice(0);
			row_drop.remove();
			row.remove();
			emptyRows();
		}
		else {
			errorMessage(row_drop.find(".listing-msg-error"), data.message);
		}
	});
}

//function to handle post-deletion of multi rentals
function deletionHandler(rows, selected_rows){
	rentals = rows;
	row_display = rentals.slice(0);
	selected_rows.remove();
	emptyRows();
}

// ------------------------------------------------------------------------------------------------------------------------------ EDIT ROW

//function to initiate edit mode
function editRow(row){
    //all others are not editing
    $(".row-disp").each(function(e){
        if ($(this).data('editing') == true && $(this).attr("id") != row.attr("id")){
            $(this).data("editing", false);
            dropRow($(this), false);
			editAddress($(this), false);
            $(this).next(".row-drop").find(".cancel-changes-button").click();
        }
    });

    //are we editing or saving?
    editing = (row.data("editing") == false) ? true : false;
    row.data("editing", editing);

    dropRow(row, editing);
    editAddress(row, editing);

    //cancel any changes if we collapse the row
    if (!editing){
        row.next(".row-drop").find(".cancel-changes-button").click();
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

// ------------------------------------------------------------------------------------------------------------------------------ SELECT ROW

//function to select a row
function selectRow(row){
    var selected = (row.data("selected") == false) ? true : false;
    row.data("selected", selected);

    var icon_span = row.find(".td-arrow .icon");
	var icon_i = row.find(".td-arrow i");

    if (selected){
		row.addClass('is-active');
		icon_span.addClass('is-primary');
        icon_i.removeClass('fa-square-o').addClass("fa-check-square-o box-checked");
    }
    else {
		row.removeClass('is-active');
		icon_span.removeClass('is-primary');
        icon_i.addClass('fa-square-o').removeClass("fa-check-square-o box-checked");
    }

	multiSelectButtons();
}

//function to select all rows
function selectAllRows(){
	$(".row-disp").addClass('is-active').data('selected', true);
	$(".row-disp>.td-arrow .icon, #select-all>span").addClass('is-primary');
	$(".row-disp>.td-arrow i, #select-all>span>i").removeClass("fa-square-o").addClass('fa-check-square-o box-checked');
	multiSelectButtons();
}

//function to deselect all rows
function deselectAllRows(){
	$(".row-disp").removeClass('is-active').data('selected', false);
	$(".row-disp>.td-arrow .icon, #select-all>span").removeClass('is-primary');
	$(".row-disp>.td-arrow i, #select-all>span>i").addClass("fa-square-o").removeClass('fa-check-square-o box-checked');
	multiSelectButtons();
}

// ------------------------------------------------------------------------------------------------------------------------------ SUBMIT RENTAL UPDATES

//function to cancel the rental submit
function cancelRentalChanges(row, row_drop, cancel_button, rental_info){
    cancel_button.addClass("is-hidden");
    success_button = cancel_button.closest(".control").prev(".control").find(".save-changes-button");
    success_button.removeClass("is-loading is-success is-danger").addClass('is-disabled').text("Save Changes");

    var rental_msg = row_drop.find(".rental-msg");
    rental_msg.addClass('is-hidden');

    //revert back to the old address
    row.find(".address_input").val(rental_info.address);
    var address_wrapper = row.find(".td-address").find(".address-div-wrapper").empty();
	if (rental_info.address == ""){
		address_wrapper.append($("<p>Nothing is being displayed!</p>"));
	}
	else {
		var temp_address = $("<a target='_blank' class='is-accent has-bs-underline' href='" + rental_info.address + "'>" + rental_info.address + "</a>")
		address_wrapper.append(temp_address);

		//prevent link click from selecting row
		temp_address.click(function(e){
			e.stopPropagation();
		});
	}
}

//function to submit any changes to a rental
function submitRentalChanges(row, row_drop, success_button, rental_info){
    var cancel_button = success_button.closest(".control").next(".control").find(".cancel-changes-button");
    var domain_name = rental_info.domain_name;

    //clear any existing messages
    var rental_msg = row_drop.find(".rental-msg");
    errorMessage(rental_msg);

    success_button.addClass("is-loading");

	var posted_data = {};
	if (row.find(".address_input").data("changed")){
		posted_data.address = row.find(".address_input").val();
	}

    $.ajax({
        url: "/listing/" + rental_info.domain_name + "/" + rental_info.rental_id + "/edit",
        type: "POST",
        data: posted_data
    }).done(function(data){
        success_button.removeClass("is-loading");
        if (data.state == "success"){
            rentals = data.rentals;
            success_button.addClass("is-disabled");
            cancel_button.addClass('is-hidden');
            refreshSubmitbindings(success_button, cancel_button, rentals, rental_info.rental_id);
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
function refreshSubmitbindings(success_button, cancel_button, rentals, rental_id){
    for (var x = 0; x < rentals.length; x++){
        if (rentals[x].rental_id == rental_id){
            var row_drop = success_button.closest('.row-drop');
            var row = row_drop.prev(".row-disp");
            var both_rows = row.add(row_drop);

            cancel_button.off().click(function(e){
                cancelRentalChanges(row, row_drop, $(this), rentals[x]);
            });

            success_button.off().click(function(e){
                submitRentalChanges(row, row_drop, $(this), rentals[x]);
            });

			//prevent enter to submit
            both_rows.find(".drop-form").on("submit", function(e){
                e.preventDefault();
            });

            both_rows.find(".drop-form .changeable-input").unbind("input").on("input", function(e){
                changedListingValue($(this), rentals[x]);
            });

            break;
        }
    }
}

// ------------------------------------------------------------------------------------------------------------------------------ SUBMIT NEW RENTAL TIMES

//helper function to check if everything is legit
function checkSubmit(){
	var newEvents = $('#calendar').fullCalendar('clientEvents', returnMineNotBG);
	var bool = true;

	if (!newEvents || newEvents.length == 0){
		bool = "Invalid dates!";
		errorHandler(bool);
	}
	else if (!$("#cc-num").val()){
		bool = "Invalid cc number!";
		$("#stripe-error-message").addClass('is-danger').html("Please provide a credit card to charge.");
	}
	else if (!$("#cc-exp").val()){
		bool = "Invalid cc exp!";
		$("#stripe-error-message").addClass('is-danger').html("Please provide your credit card expiration date.");
	}
	else if (!$("#cc-cvc").val()){
		bool = "Invalid cvc!";
		$("#stripe-error-message").addClass('is-danger').html("Please provide your credit card CVC number.");
	}
	else if (!$("#cc-zip").val()){
		bool = "Invalid zip Code!";
		$("#stripe-error-message").addClass('is-danger').html("Please provide a ZIP code.");
	}
	else if (!$("#agree-to-terms").prop('checked')){
		bool = "Invalid terms!";
		$("#stripe-error-message").addClass('is-danger').html("You must agree to the terms and conditions.");
	}
	else if (newEvents.length > 0){
		for (var x = 0; x < newEvents.length; x++){
			if (!newEvents[x].old){
				var start = new Date(newEvents[x].start._d);
				if (isNaN(start)){
					bool = "Invalid dates!";
					errorHandler(bool);
					break;
				}
			}
		}
	}
	return bool;
}

//function to submit new rental times
function submitStripe(stripeToken){
	if (checkSubmit() == true && unlock){
		var newEvents = $('#calendar').fullCalendar('clientEvents', returnMineNotBG);
		unlock = false;
		var minEvents = [];

		//format the events to be sent
		for (var x = 0; x < newEvents.length; x++){
			var start = new Date(newEvents[x].start._d);
			var offset = start.getTimezoneOffset();
			minEvents.push({
				start: newEvents[x].start._d.getTime(),
				end: newEvents[x].end._d.getTime(),
				_id: newEvents[x]._id
			});
		}

		//create a new rental
		$.ajax({
			type: "POST",
			url: "/listing/" + listing_info.domain_name + "/" + rental_id + "/time",
			data: {
				events: minEvents,
				stripeToken: stripeToken
			}
		}).done(function(data){
			$('#checkout-button').removeClass('is-loading');
			unlock = true;
			if (data.unavailable){
				for (var x = 0; x < data.unavailable.length; x++){
					showModalContent("calendar");
					$('#calendar').fullCalendar('removeEvents', data.unavailable[x]._id);
					$("#calendar-error-message").addClass('is-danger').html("Some dates/times were unavailable! They have been removed from your selection.<br />Your credit card has not been charged yet.");
				}
			}
			else if (data.state == "success"){
				delete_cookies();
				successHandler(data);
			}
			else if (data.state == "error"){
				errorHandler(data.message);
			}
		});
	}
}

//error handler from server
function errorHandler(message){
	if (message == "Invalid dates!"){
		showModalContent("calendar");
		$("#calendar-error-message").addClass('is-danger').html("There was something wrong with the dates you selected!<br />Your credit card has not been charged yet.");
	}
	else if (message == "Invalid price!"){
		showModalContent("checkout");
		$("#stripe-error-message").addClass('is-danger').html("There was something wrong with your credit card!<br />Your credit card has not been charged yet.");
	}
	else if (message == "Invalid stripe user account!"){
		showModalContent("checkout");
		$("#summary-error-message").addClass('is-danger').html("There was something wrong with this listing!<br />Your credit card has not been charged yet.");
	}
}

//success handler
function successHandler(data){
	refresh_time_submit = true;
	successHide(true);
	rentals = data.rentals;
	row_display = rentals.slice(0);
	var row_per_page = parseFloat($("#domains-per-page").val());
	createAllRows(row_per_page, 1);
}

//function to hide stuff after success
function successHide(bool){
	if (bool){
		$("#payment-column, .success-hide").addClass('is-hidden');
		$("#success-column").removeClass('is-hidden');
		$("#success-message").text("Your credit card was successfully charged!");
	}
	else {
		$("#payment-column, .success-hide, #calendar-modal-content").removeClass('is-hidden');
		$("#checkout-modal-content, #success-column").addClass('is-hidden');
		$("#success-message").text("Please take a moment to review the summary below. You may edit the information on any of the previous pages by clicking the go back button.");
	}
}

//function to show a specific modal content
function showModalContent(type){
	if (type == "calendar"){
		var cal_height = $("#calendar-modal-content").height() - $("#calendar-modal-top").height() - 100;
		$('#calendar').fullCalendar('option', 'contentHeight', cal_height);
		$("#calendar-modal-content").removeClass('is-hidden');
		$("#checkout-modal-content").addClass('is-hidden');
	}
	else {
		$("#calendar-modal-content").addClass('is-hidden');
		$("#checkout-modal-content").removeClass('is-hidden');
	}
}
