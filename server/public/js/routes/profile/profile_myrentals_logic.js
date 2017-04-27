var row_display = rentals.slice(0)
var listing_info = false;
var rental_min = false;
var refresh_time_submit = false;

$(document).ready(function() {
	//show active ones first
	row_display = row_display.filter(function(rental){
		return filterCheck("active_filter", rental);
	});

	//multiple delete rentals
	$("#multi-delete").on("click", function(e){
		multiDelete($(this));
	});
});

// --------------------------------------------------------------------------------- CREATE ROW

//function to create all the rows
function createAllRows(row_per_page, current_page){
	$("#table_body").children().not(".clone-row").remove();
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
	$("#row" + rownum).remove();

    tempRow = $("#clone-row").clone();
    tempRow.removeClass('is-hidden clone-row').attr("id", "row" + rownum);

	updateDomainName(tempRow, rental_info);
	updateStatus(tempRow, rental_info);
	updateAddress(tempRow, rental_info);
	updatePreview(tempRow, rental_info);

	tempRow.data("rental_id", rental_info.rental_id);
    tempRow.data("editing", false);
	tempRow.data("selected", false);
	tempRow.data("id", rental_info.rental_id);

	tempRow.click(function(e){
		editRow($(this));
	});

    return tempRow;
}

//update the clone row with row specifics
function updateDomainName(tempRow, rental_info){
	tempRow.find(".td-domain").text(rental_info.domain_name);
}
function updatePreview(tempRow, rental_info){
	tempRow.find(".preview-button").attr("href", "/listing/" + rental_info.domain_name + "/" + rental_info.rental_id).on("click", function(e){
		e.stopPropagation();
	});
}
function updateStatus(tempRow, rental_info){
	var expired = rental_info.date[0] + rental_info.duration[0] <= new Date().getTime();
	var status_text = (rental_info.status == 0) ? "Inactive" : "Active";
	if (expired){
		status_text = "Expired";
	}
	tempRow.find(".td-status").text(status_text);
}
function updateAddress(tempRow, rental_info){
	if (!rental_info.address){
		tempRow.find(".address-link").removeAttr("href").text("Nothing is being displayed!").removeClass('is-accent');
	}
	else {
		tempRow.find(".address-link").attr("href", rental_info.address).text(rental_info.address).addClass('is-accent');
	}

	//address input change
	tempRow.find(".address_input").val(rental_info.address).on("click", function(e){
		e.stopPropagation();
	}).on("input", function(e){
		if (!$(this).val()){
			tempRow.find(".address-link").removeAttr("href").text("Nothing is being displayed!").removeClass('is-accent');
		}
		else {
			tempRow.find(".address-link").attr("href", $(this).val()).text($(this).val()).addClass('is-accent');
		}
    });
}

// ------------------------------------------------------------------------------------------------------------------------------ CREATE ROW DROP

//function to create dropdown row
function createRowDrop(rental_info, rownum){
	$("#row-drop" + rownum).remove();

	tempRow_drop = $("#clone-row-drop").clone();
	updateDates(tempRow_drop, rental_info);
	updateViewListing(tempRow_drop, rental_info);
	updateRentalDelete(tempRow_drop, rental_info);
	updateSaveCancelButtons(tempRow_drop, rental_info);
	updateDeleteMessagesX(tempRow_drop);
	updatePreviewImage(tempRow_drop, rental_info);
	updateBuildChoice(tempRow_drop);
	updateLinkChoice(tempRow_drop);
	updateForwardChoice(tempRow_drop);

	tempRow_drop.removeClass('is-hidden clone-row').attr("id", "row-drop" + rownum);
    return tempRow_drop;
}

//update the clone row drop with row specifics
function updateDates(tempRow_drop, rental_info){
	for (var x = 0; x < rental_info.date.length; x++){
		var disp_start = moment(new Date(rental_info.date[x])).format('MMMM D, YYYY h:mmA');
		var disp_duration = moment.duration(rental_info.duration[x]).humanize();
		var disp_end = moment(parseFloat(rental_info.date[x]) + parseFloat(rental_info.duration[x])).format('MMMM D, YYYY h:mmA');

		var temp_date = tempRow_drop.find("#rental-dates-clone").clone().removeClass('is-hidden').attr('id', "");
		temp_date.text(disp_start + " - " + disp_end + " (" + disp_duration + ")");
		tempRow_drop.find(".rental-dates").append(temp_date);
	}
}
function updateViewListing(tempRow_drop, rental_info){
	tempRow_drop.find(".view-rental").attr('href', "/listing/" + rental_info.domain_name);
}
function updateSaveCancelButtons(tempRow_drop, rental_info){
	//to submit form changes
	tempRow_drop.find(".save-changes-button").click(function(e){
		submitRentalChanges(tempRow_drop.prev(".row-disp"), tempRow_drop, $(this), rental_info);
	});

	//to cancel form changes
	tempRow_drop.find(".cancel-changes-button").click(function(e){
		cancelRentalChanges(tempRow_drop.prev(".row-disp"), tempRow_drop, $(this), rental_info);
	});
}
function updateDeleteMessagesX(tempRow_drop){
	tempRow_drop.find(".notification").find(".delete").on("click", function(){
		$(this).closest(".notification").addClass('is-hidden');
	});
}
function updateRentalDelete(tempRow_drop, rental_info){
	tempRow_drop.find(".delete-rental").on("click", function(e) {
		areYouSure($(this), rental_info);
	});
}
function updatePreviewImage(tempRow_drop, rental_info){
	if (rental_info.address == ""){
		var background_image = "https://placeholdit.imgix.net/~text?txtsize=40&txt=NO%20PREVIEW&w=200&h=200";
	}
	else if (rental_info.address.match(/\.(jpeg|jpg|gif|png)$/) != null){
		var background_image = rental_info.address;
	}
	else {
		var background_image =  "/screenshot?rental_address=" + rental_info.address + "&width=200&height=200";
	}

	tempRow_drop.data('background_image', background_image);
	tempRow_drop.find(".preview-image").error(function() {
		$(this).attr("src", "");
	});

	//preview link
	tempRow_drop.find(".preview-link").attr('href', "/listing/" + rental_info.domain_name + "/" + rental_info.rental_id);
}
function updateBuildChoice(tempRow_drop) {
	tempRow_drop.find(".build-choice").on("click", function() {
		$(this).parents("#choices-block").addClass("is-hidden");
		tempRow_drop.find(".build-choice-column").toggleClass("is-hidden");
		tempRow_drop.find(".choices-message").text("These are some quick and easy ways to create a website! (We are not sponsored by any of these providers.)");
	});
}
function updateLinkChoice(tempRow_drop) {
	tempRow_drop.find(".link-choice").on("click", function() {
		$(this).parents("#choices-block").addClass("is-hidden");
		$(".link-choice-column").toggleClass("is-hidden");
	});
}
function updateForwardChoice(tempRow_drop) {
	tempRow_drop.find(".forward-choice").on("click", function() {
		$(this).parents("#choices-block").addClass("is-hidden");
		$(".forward-choice-column").toggleClass("is-hidden");
	});
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
	editImage(row.next('.row-drop'), editing);

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

//function to update the preview image
function editImage(tempRow_drop, editing){
	if (editing && !tempRow_drop.find('.preview-image').attr("src")){
		tempRow_drop.find('.preview-image').attr("src", tempRow_drop.data("background_image"));
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
    var rental_msg_error = row_drop.find(".listing-msg-error");
    var rental_msg_success = row_drop.find(".listing-msg-success");
    errorMessage(rental_msg_error);
    successMessage(rental_msg_success);

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
			successMessage(rental_msg_success, true);
            rentals = data.rentals;
            success_button.addClass("is-disabled");
            cancel_button.addClass('is-hidden');
            refreshSubmitbindings(success_button, cancel_button, rentals, rental_info.rental_id);
        }
        else {
            cancel_button.click();
            errorMessage(rental_msg_error, data.message);
        }
    });
}

//helper function to display success messages per rental
function successMessage(msg_elem, message){
	$(".notification").addClass('is-hidden');
    msg_elem.removeClass('is-hidden');
	msg_elem.find("p").empty();
    if (message){
        msg_elem.append("<p class='is-white'>Successfully updated this rental!</p>");
    }
    else {
        msg_elem.addClass('is-hidden');
    }
}

//helper function to display error messages per rental
function errorMessage(msg_elem, message){
	$(".notification").addClass('is-hidden');
    msg_elem.removeClass('is-hidden');
    msg_elem.find("p").empty();
    if (message){
        msg_elem.append("<p class='is-white'>" + message + "</p>");
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
                changedValue($(this), rentals[x]);
            });

			updatePreviewImage(row_drop, rentals[x]);
			row_drop.find('.preview-image').removeAttr("src");
			editImage(row_drop, true);

            break;
        }
    }
}
