var row_display = listings.slice(0);

$(document).ready(function(){
	//multiple delete listings
	$("#multi-delete").on("click", function(e){
		multiDelete($(this));
	});

	//multiple verify listings
	$("#multi-verify").on("click", function(e){
		multiVerify($(this));
	});
});

//function to handle post-deletion of multi listings
function deletionHandler(rows, selected_rows){
	listings = rows;
	row_display = listings.slice(0);
	for (var x = 0; x < selected_rows.length; x++){
		$(selected_rows[x]).next(".row-drop").remove();
		$(selected_rows[x]).remove();
	}
	deselectAllRows();
	emptyRows();
}

// ------------------------------------------------------------------------------------------------------------------------------ CREATE ROW

//function to create a listing row
function createRow(listing_info, rownum){
	$("#row" + rownum).remove();

	//choose a row to clone
	if (listing_info.verified){
		var tempRow = $("#verified-clone-row").clone();
		updateView(tempRow, listing_info);
		updateStatus(tempRow, listing_info);
		updatePriceRate(tempRow, listing_info);
		updatePriceType(tempRow, listing_info);
	}
	else {
		var tempRow = $("#unverified-clone-row").clone();
		tempRow.data("verified", false);
	}

	//update row specifics and add handlers
    updateDomainName(tempRow, listing_info);
    updateIcon(tempRow, listing_info);

	tempRow.click(function(e){
		editRow($(this));
	});

	tempRow.removeClass('is-hidden clone-row').attr("id", "row" + rownum);

	tempRow.data("editing", false);
	tempRow.data("selected", false);
	tempRow.data("id", listing_info.id);

	//already got the dns and a records for unverified domain
	if (listing_info.a_records != undefined && listing_info.whois != undefined){
		tempRow.data("record_got", true);
	}

    return tempRow;
}

//update the clone row with row specifics
function updateDomainName(tempRow, listing_info){
	tempRow.find(".td-domain").text(listing_info.domain_name);
}
function updateIcon(tempRow, listing_info){
	tempRow.find(".td-arrow").on('click', function(e){
		e.stopPropagation();
		selectRow(tempRow);
	});
}
function updateView(tempRow, listing_info){
	tempRow.find(".view-button").attr('href', "/listing/" + listing_info.domain_name).on('click', function(e) {
		e.stopPropagation();
	});
}
function updateStatus(tempRow, listing_info){
	if (listing_info.status == 0){
		tempRow.find(".td-status").text("Inactive").addClass('is-danger');
	}
	else {
		tempRow.find(".td-status").text("Active").removeClass('is-danger');
	}

	tempRow.find(".td-status-drop").find('.status_input').val(listing_info.status).on('click', function(e) {
		e.stopPropagation();
	});
}
function updatePriceRate(tempRow, listing_info){
	tempRow.find(".td-price-rate").text("$" + listing_info.price_rate);
}
function updatePriceType(tempRow, listing_info){
	tempRow.find(".td-price-type").text(toUpperCase(listing_info.price_type));
}

// ------------------------------------------------------------------------------------------------------------------------------ CREATE DROP

//function to create dropdown row
function createRowDrop(listing_info, rownum){
	$("#row-drop" + rownum).remove();

	//choose a row to clone
	if (listing_info.verified){
		var tempRow_drop = $("#verified-clone-row-drop").clone();
		updatePriceInputs(tempRow_drop, listing_info);
		updateDescription(tempRow_drop, listing_info);
		updateCategories(tempRow_drop, listing_info);
		updateSaveCancelButtons(tempRow_drop, listing_info);
		updateBackgroundImage(tempRow_drop, listing_info, rownum);
		updateDeleteMessagesX(tempRow_drop);
	}
	else {
		var tempRow_drop = $("#unverified-clone-row-drop").clone();
		updateRegistrarURL(tempRow_drop, listing_info.whois);
		updateExistingDNS(tempRow_drop, listing_info.a_records);
		updateVerificationButton(tempRow_drop, listing_info, function(){
			listing_info.verified = 1;

			if (user.stripe_info && user.stripe_info.charges_enabled){
				listing_info.status = 1;
			}

			//recreate the rows
			var new_row = tempRow_drop.prev(".row-disp");
			new_row.replaceWith(createRow(listing_info, rownum));
			tempRow_drop.replaceWith(createRowDrop(listing_info, rownum));
			refreshSubmitbindings();
		});
	}

	tempRow_drop.removeClass('is-hidden clone-row').attr("id", "row-drop" + rownum);
    return tempRow_drop;
}

//update the clone row drop with row drop specifics
function updatePriceInputs(tempRow_drop, listing_info){
	tempRow_drop.find(".price-rate-input").val(listing_info.price_rate);
	tempRow_drop.find(".price-type-input").val(listing_info.price_type);

	//only if not 0
	if (listing_info.buy_price != 0 || listing_info.buy_price == null || listing_info.buy_price == undefined){
		tempRow_drop.find(".buy-price-input").val(listing_info.buy_price);
	}
}
function updateDescription(tempRow_drop, listing_info){
	tempRow_drop.find(".description-input").val(listing_info.description);
}
function updateCategories(tempRow_drop, listing_info){
	//color existing categories
	var listing_categories = (listing_info.categories) ? listing_info.categories.split(" ") : [];
	tempRow_drop.find(".category-selector").removeClass('is-dark');
	for (var x = 0; x < listing_categories.length; x++){
		var temp_category = tempRow_drop.find("." + listing_categories[x] + "-category").addClass('is-dark');
	}

	var category_input = tempRow_drop.find(".categories-input");
	updateHiddenCategoryInput(tempRow_drop, category_input);

	//click to add this category
	tempRow_drop.find(".category-selector").off().on("click", function(e){
		$(this).toggleClass('is-dark');
		updateHiddenCategoryInput(tempRow_drop, category_input);
		changedValue(category_input, listing_info);
	});
}
function updateHiddenCategoryInput(tempRow_drop, input){
	var joined_categories = tempRow_drop.find(".category-selector.is-dark").map(function() {
		return $(this).data("category");
	}).toArray().sort().join(" ");
	joined_categories = (joined_categories == "") ? null : joined_categories;
	input.val(joined_categories);
}
function updateSaveCancelButtons(tempRow_drop, listing_info){
	//to submit form changes
	tempRow_drop.find(".save-changes-button").click(function(e){
		submitListingChanges(tempRow_drop.prev(".row-disp"), tempRow_drop, $(this), listing_info);
	});

	//to cancel form changes
	tempRow_drop.find(".cancel-changes-button").click(function(e){
		cancelListingChanges(tempRow_drop.prev(".row-disp"), tempRow_drop, $(this), listing_info);
	});
}
function updateBackgroundImage(tempRow_drop, listing_info, rownum){
	var background_image = (listing_info.background_image == null || listing_info.background_image == undefined || listing_info.background_image == "") ? "https://placeholdit.imgix.net/~text?txtsize=40&txt=RANDOM%20PHOTO&w=200&h=200" : listing_info.background_image;
	tempRow_drop.find(".background_image").attr('src', background_image).error(function() {
        $(this).attr("src", "");
    });

	tempRow_drop.find(".picture-file").attr('id', "pic" + rownum);
	tempRow_drop.find(".picture-label").attr('for', "pic" + rownum);

	tempRow_drop.find(".delete-img").on("click", function(e){
		deleteBackgroundImg($(this), listing_info);
	});
}
function deleteBackgroundImg(temp_x, listing_info){
	var temp_img = temp_x.next('img');
	var temp_input = temp_x.closest(".card-image").next('.card-footer').find(".input-file");
	var temp_form = temp_x.closest(".card-image").next('.card-footer').find(".drop-form-file");

	if (temp_img.attr("src") != "https://placeholdit.imgix.net/~text?txtsize=40&txt=RANDOM%20PHOTO&w=200&h=200"){
		var old_src = temp_img.attr("src");
		temp_img.data("old_src", old_src);
		temp_img.attr("src", "https://placeholdit.imgix.net/~text?txtsize=40&txt=RANDOM%20PHOTO&w=200&h=200");
		temp_input.data("deleted", true);
		temp_input.val("");
		temp_form.find(".file-label").text("Background Image");
	}
	changedValue(temp_input, listing_info);
}
function updateDeleteMessagesX(tempRow_drop){
	tempRow_drop.find(".notification").find(".delete").on("click", function(){
		$(this).closest(".notification").addClass('is-hidden');
	});
}

//functions to update row drop unverified
function updateRegistrarURL(tempRow, whois){
	if (whois && (whois.Registrar || whois["Sponsoring Registrar"])){
		var reg_name = whois.Registrar || whois["Sponsoring Registrar"];
		var reg_url = whois["Registrar URL"] || whois["Registrar URL (registration services)"];
		var regex_url = /^((http|https):\/\/)/;
		if (!regex_url.test(reg_url)) { reg_url = "http://" + reg_url; }
		tempRow.find(".registrar_url").replaceWith("<a class='registrar_url is-accent' target='_blank' href='" + reg_url + "'>log in to your domain provider</a> (" + reg_name + ") ");
	}
}
function updateExistingDNS(tempRow, a_records){
	if (a_records){
		tempRow.find(".existing_a_record").text(a_records);
	}
}
function updateVerificationButton(tempRow, listing_info, cb_when_verified){
	var verify_button = tempRow.find(".verify-button");

	//ajax to make sure it's all done, then display a regular row if verified
	verify_button.off().on("click", function(e){
		e.preventDefault();

		verify_button.addClass('is-loading');
		$.ajax({
			url: "/listing/" + listing_info.domain_name + "/verify",
			method: "POST"
		}).done(function(data){
			verify_button.removeClass('is-loading is-danger');
			if (data.state == "success"){
				cb_when_verified();
			}
			else {
				verify_button.addClass('is-danger');
				verify_button.text("Failed to verify! Please check the above table and try again.");
			}
		});
	});
}

// ------------------------------------------------------------------------------------------------------------------------------ EDIT ROW

//function to initiate edit mode
function editRow(row){
    //all others are not editing
    $(".row-disp").each(function(e){
        if ($(this).data('editing') == true && $(this).attr("id") != row.attr("id")){
            $(this).data("editing", false);
            dropRow($(this), false);
            editStatus($(this), false);
			editVerifyButton($(this), false);
            $(this).next(".row-drop").find(".cancel-changes-button").click();
        }
    });

    //are we editing or saving?
    var editing = (row.data("editing") == false) ? true : false;
    row.data("editing", editing);

    dropRow(row, editing);
    editStatus(row, editing);
	editVerifyButton(row, editing);

	//get the current who is and A record if unverified row
	if (row.data('verified') == false && editing && !row.data('record_got')){
		getDNSRecordAndWhois(row.find(".td-domain").text(), row);
	}

    //cancel any changes if we collapse the row
    if (!editing){
        row.next(".row-drop").find(".cancel-changes-button").click();
    }
}

//function to get A Record and Whois info for unverified domain
function getDNSRecordAndWhois(domain_name, row){
	$.ajax({
		url: "/listing/" + domain_name + "/unverifiedInfo",
		method: "POST"
	}).done(function(data){
		$(row).data("record_got", true);

		//to do, update the table
		var unverified_domain = getUserListingObj(listings, domain_name);
		unverified_domain.a_records = data.listing.a_records;
		unverified_domain.whois = data.listing.whois;

		updateRegistrarURL(row.next(".row-drop"), data.listing.whois);
		updateExistingDNS(row.next(".row-drop"), data.listing.a_records);
	});
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

//function to hide verification button in row
function editVerifyButton(row, editing){
	if (editing){
		row.find(".verify-button").addClass('is-hidden');
	}
	else {
		row.find(".verify-button").removeClass('is-hidden');
	}
}

//function to refresh listing_info on cancel, submit, input event listeners after AJAX success
function refreshSubmitbindings(bool_for_status_td){
    for (var x = 0; x < $(".row-disp").length; x++){
        for (var y = 0; y < listings.length; y++){
            if (listings[y].id == $($(".row-disp")[x]).data("id")){
                (function(info, row){
                    var row_drop = row.next('.row-drop');
                    var both_rows = row.add(row_drop);
                    var cancel_button = row_drop.find(".cancel-changes-button");
                    var success_button = row_drop.find(".save-changes-button");

                    cancel_button.off().on("click", function(e){
                        cancelListingChanges(row, row_drop, $(this), info);
                    });

                    success_button.off().on("click", function(e){
                        submitListingChanges(row, row_drop, $(this), info);
                    });

                    //prevent enter to submit
                    both_rows.find(".drop-form").on("submit", function(e){
                        e.preventDefault();
                    });

                    //refresh category click handlers
					updateCategories(row_drop, info);

					//all other inputs handler
                    both_rows.find(".drop-form .changeable-input").unbind("input").on("input", function(e){
                        e.preventDefault();
                        changedValue($(this), info);
                    });

					//upload image button handler
                    both_rows.find(".drop-form-file .changeable-input").off().on("change", function(e){
                        e.preventDefault();
                        var file_name = ($(this).val()) ? $(this).val().replace(/^.*[\\\/]/, '') : "Background Image";
                        file_name = (file_name.length > 14) ? "..." + file_name.substr(file_name.length - 14) : file_name;
                        $(this).next(".card-footer-item").find(".file-label").text(file_name);
                        changedValue($(this), info);
                    });

					//click X to delete image
					row_drop.find(".delete-img").off().on("click", function(e){
						e.preventDefault();
						deleteBackgroundImg($(this), info);
					})

                    row_drop.find(".categories-input").val(info.categories);

                    //update the status td text
                    if (info.status == 0){
                        row.find(".td-status").text("Inactive").addClass('is-danger');
                    }
					else {
						row.find(".td-status").text("Active").removeClass('is-danger');
					}
                }(listings[y], $($(".row-disp")[x])));
                break;
            }
        }
    }
}

// ------------------------------------------------------------------------------------------------------------------------------ SELECT ROW

//function to select a row
function selectRow(row){
    var selected = (row.data("selected") == false) ? true : false;
    var verified = row.data("verified");
    row.data("selected", selected);

    var icon_i = row.find(".td-arrow i");
    var icon_span = row.find(".td-arrow .icon");

    row.toggleClass('is-active');
    icon_span.toggleClass('is-primary');
    if (selected){
		icon_span.removeClass('is-danger');
        icon_i.removeClass("fa-exclamation-triangle").removeClass('fa-square-o').addClass("fa-check-square-o box-checked");
    }
    else {
        icon_i.addClass('fa-square-o');
        icon_i.removeClass("fa-check-square-o box-checked");
    }

    multiSelectButtons();
}

//function to select all rows
function selectAllRows(){
	$(".row-disp").addClass('is-active').data('selected', true);
	$(".row-disp>.td-arrow .icon, #select-all>span").addClass('is-primary');
	$(".row-disp>.td-arrow i, #select-all>span>i").removeClass("fa-square-o").addClass('fa-check-square-o box-checked');

	var unverified_icon = $(".row-disp>.td-arrow i.fa-exclamation-triangle");
	var unverified_span = $(".row-disp>.td-arrow .icon.is-danger");
	unverified_icon.removeClass('fa-exclamation-triangle').addClass('unverified-icon');
	unverified_span.removeClass('is-danger').addClass('unverified-span');

	multiSelectButtons();
}

//function to deselect all rows
function deselectAllRows(){
	$(".row-disp").removeClass('is-active').data('selected', false);
	$(".row-disp>.td-arrow .icon, #select-all>span").removeClass('is-primary');
	$(".row-disp>.td-arrow i, #select-all>span>i").addClass("fa-square-o").removeClass('fa-check-square-o box-checked');

	$(".unverified-icon").addClass("fa-exclamation-triangle").removeClass('fa-square-o');
	$(".unverified-span").addClass("is-danger");

	multiSelectButtons();
}

//function to multi-verify listings
function multiVerify(verify_button){
    verify_button.off();

	var ids = [];
	var selected_rows = $(".row-disp").filter(function(){
		if ($(this).data('selected') == true){
			ids.push($(this).data('id'));
			return true;
		}
	});

	$.ajax({
		url: "/profile/mylistings/verify",
		method: "POST",
		data: {
			ids: ids
		}
	}).done(function(data){
		verify_button.on("click", function(){
			multiVerify(verify_button);
		});

		deselectAllRows();
		//unverified listings error
		if (data.unverified_listings){
			//add danger to failed rows
			for (var x = 0; x < data.unverified_listings.length; x++){
				$(".row-disp").each(function(){
					if ($(this).data('id') == data.unverified_listings[x]){
						$(this).find(".td-edit>.button").addClass('is-danger');
						$(this).find(".td-arrow>.icon").addClass('is-danger');
						$(this).find(".td-arrow .fa").removeClass('fa-square-o').addClass('fa-exclamation-triangle');
					}
				});
			}
		}

		//success rows
		if (data.state == "success"){
            verificationHandler(data);
		}
	});
}

//function to handle post-verification of multi listings
function verificationHandler(data){
	listings = data.listings;
	row_display = listings.slice(0);

	//verified listings change
	if (data.verified_listings){
		for (var x = 0; x < data.verified_listings.length; x++){
			for (var y = 0; y < listings.length; y++){
				if (data.verified_listings[x] == listings[y].id){
					$(".row-disp").each(function(){
						if ($(this).data('id') == data.verified_listings[x]){
							//recreate the rows
							var row_drop = $(this).next(".row-drop");
							$(this).replaceWith(createRow(listings[y], $(this).attr('id').replace("row", "")));
							row_drop.replaceWith(createRowDrop(listings[y], $(this).attr('id').replace("row", "")));
							return false;
						}
					});
				}
			}
		}
	}
	refreshSubmitbindings();
}

// ------------------------------------------------------------------------------------------------------------------------------ SUBMIT LISTING UPDATES

//function to cancel the listing submit
function cancelListingChanges(row, row_drop, cancel_button, listing_info){
    cancel_button.addClass("is-hidden");
    success_button = cancel_button.prev(".save-changes-button");
    success_button.removeClass("is-loading is-success is-danger").addClass('is-disabled').text("Save Changes");

    var listing_msg = row_drop.find(".listing-msg");
    listing_msg.addClass('is-hidden');

    //revert back to the old status
    row.find(".status_input").val(listing_info.status);
	var current_status = row.find(".td-status").not(".td-status-drop");
	if (listing_info.status == 0){
		current_status.text("Inactive");
		current_status.addClass('is-danger');
	}
	else {
		current_status.text("Active");
		current_status.removeClass('is-danger');
	}

    //revert prices
    row.find(".price-rate-input").val(listing_info.price_rate);
    row.find(".td-price-rate").text("$" + listing_info.price_rate);

    row.find(".price-type-input").val(listing_info.price_type);
    row.find(".td-price-type").text(toUpperCase(listing_info.price_type));

    //revert all other inputs
    row_drop.find(".description-input").val(listing_info.description);
    row_drop.find(".categories-input").val(listing_info.categories);

	//revert categories
	updateCategories(row_drop, listing_info);

    //image
    var img_elem = row_drop.find("img.is-listing");
	var background_image = (listing_info.background_image == null || listing_info.background_image == undefined || listing_info.background_image == "") ? "https://placeholdit.imgix.net/~text?txtsize=40&txt=RANDOM%20PHOTO&w=200&h=200" : listing_info.background_image;
    img_elem.attr("src", background_image);
    row_drop.find(".file-label").text("Background Image");
    row_drop.find(".input-file").val("");

    var listing_msg_error = row_drop.find(".listing-msg-error");
    var listing_msg_success = row_drop.find(".listing-msg-success");
    errorMessage(listing_msg_error);
    successMessage(listing_msg_success);
}

//function to submit any changes to a listing
function submitListingChanges(row, row_drop, success_button, listing_info){
    var cancel_button = success_button.next(".cancel-changes-button");

    //clear any existing messages
    var listing_msg_error = row_drop.find(".listing-msg-error");
    var listing_msg_success = row_drop.find(".listing-msg-success");
    errorMessage(listing_msg_error);
    successMessage(listing_msg_error);

    var domain_name = listing_info.domain_name;
    var formData = new FormData();

    //only add changed inputs
    row.add(row_drop).find(".changeable-input").each(function(e){
        var input_name = $(this).data("name");
        var input_val = (input_name == "background_image") ? $(this)[0].files[0] : $(this).val();

        //if image is being deleted
        if (input_name == "background_image" && $(this).data("deleted")){
            var input_val = "";
			$(this).data('deleted', false);
        }

        //if null or undefined
        listing_info[input_name] = (listing_info[input_name] == null || listing_info[input_name] == undefined) ? "" : listing_info[input_name];
        if (input_val != listing_info[input_name]){
            formData.append(input_name, input_val);
        }
    });

    success_button.addClass("is-loading");
    $.ajax({
        url: "/listing/" + domain_name + "/update",
        type: "POST",
        data: formData,
        // Options to tell jQuery not to process data or worry about the content-type
        cache: false,
        contentType: false,
        processData: false
    }, 'json').done(function(data){
        success_button.removeClass("is-loading");
        if (data.state == "success"){
            successMessage(listing_msg_success, true);
            listings = data.listings;
            row_display = listings.slice(0);

            success_button.addClass("is-disabled");
            cancel_button.addClass('is-hidden');
            refreshSubmitbindings();

            //change background image if its changed
            if (data.new_background_image){
                row_drop.find("img.is-listing").attr("src", data.new_background_image);
                row_drop.find(".file-label").text("Background Image");
                row_drop.find(".picture-file").val("");
            }
        }
        else {
            errorMessage(listing_msg_error, data.message);
        }
    });
}

//helper function to display error messages per listing
function errorMessage(msg_elem, message){
    $(".notification").addClass('is-hidden')
    msg_elem.removeClass('is-hidden');
    msg_elem.find("p").empty();
    if (message){
        //connect stripe first!
        if (message == "stripe-connect-error"){
            msg_elem.append("<p class='is-white'>You must <a class='is-underlined' href='/profile/settings#payout-address'>enter your payment information</a> before your listing can go live!</p>");
        }
        else {
            msg_elem.append("<p class='is-white'>" + message + "</p>");
        }
    }
    else {
        msg_elem.addClass('is-hidden');
    }
}

//helper function to display success messages per listing
function successMessage(msg_elem, message){
    msg_elem.removeClass('is-hidden');
    $(".notification p").empty();
    if (message){
        msg_elem.append("<p class='is-white'>Successfully updated this listing!</p>");
    }
    else {
        msg_elem.addClass('is-hidden');
    }
}

function toUpperCase(string){
    return string.charAt(0).toUpperCase() + string.substr(1);
}

//helper function to get the user listings object for a specific domain
function getUserListingObj(listings, domain_name){
	for (var x = 0; x < listings.length; x++){
		if (listings[x].domain_name.toLowerCase() == domain_name.toLowerCase()){
			return listings[x];
		}
	}
}
