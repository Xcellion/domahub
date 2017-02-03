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

// ------------------------------------------------------------------------------------------------------------------------------ CREATE ROW

//function to create a listing row
function createRow(listing_info, rownum){
    var verified = listing_info.verified != null;
    var verified_row = (listing_info.verified != null) ? " verified-row" : " unverified-row";
    var premium = listing_info.exp_date >= new Date().getTime();

    var tempRow = $("<tr class='row-disp" + verified_row + "' id='row" + rownum + "'></tr>");
    tempRow.append(
        createIcon(listing_info),
        createDomain(listing_info),
        createView(listing_info),
		createEdit(listing_info),
        // createType(listing_info),
        createVerify(listing_info, verified),
        createStatus(listing_info, verified),
        createStatusDrop(listing_info),
        createPriceRate(listing_info),
        createPriceRateDrop(listing_info),
        createPriceType(listing_info),
        createPriceTypeDrop(listing_info)
    );

    tempRow.data("editing", false);
    tempRow.data("selected", false);
    tempRow.data("verified", verified);
    tempRow.data("id", listing_info.id);

    tempRow.click(function(e){
        editRow($(this));
    });
    return tempRow;
}

//function to create the listing type td
function createType(listing_info){
    var text = (listing_info.exp_date >= new Date().getTime()) ? "Premium" : "Basic";
    var temp_td = $("<td class='td-type is-hidden-mobile'>" + text + "</td>");
    temp_td.data("type", text);
    return temp_td;
}

//function to create a button to verify the listing
function createVerify(listing_info, bool){
    var temp_td = $("<td class='td-verify is-hidden-mobile'></td>");
        var temp_a = $("<p class='is-danger verify-link'></p>");
            var temp_span2 = $("<span>Unverified</span>");

    //hide if verified
    if (bool){
        temp_td.addClass("is-hidden");
    }
    temp_td.append(temp_a.append(temp_span2));
    return temp_td;
}

//function to create the listing status td
function createStatus(listing_info, bool){
    var text = (listing_info.status == 0) ? "Inactive" : "Active";
    var temp_td = $("<td class='td-status is-hidden-mobile'>" + text + "</td>");

    //hide if not verified
    if (!bool){
        temp_td.addClass("is-hidden");
    }
    temp_td.data("status", text);
    return temp_td;
}

//function to create the listing created date
function createPriceRate(listing_info){
    var temp_td = $("<td class='has-text-right td-price-rate is-bold is-hidden-mobile'>$" + listing_info.price_rate + "</td>");
    return temp_td;
}

//function to create the listing created date
function createPriceType(listing_info){
    var temp_td = $("<td class='td-price-type is-hidden-mobile'>" + toUpperCase(listing_info.price_type) + "</td>");
    return temp_td;
}

//function to create the tv icon
function createView(listing_info){
    if (listing_info.verified){
        var temp_td = $("<td class='td-view is-hidden-mobile'></td>");
        var temp_a = $("<a class='button no-shadow' target='_blank' title='Open listing in new tab' style='target-new: tab;' href='/listing/" + listing_info.domain_name + "'></a>");
        var temp_span = $("<span class='icon is-small'></span>");
        var temp_i = $("<i class='fa fa-external-link'></i>");
        var temp_span2 = $("<span>View</span>");
        temp_td.append(temp_a.append(temp_span.append(temp_i), temp_span2));

        //prevent clicking view from dropping down row
        temp_td.click(function(e) {
            e.stopPropagation();
        });

        return temp_td;
    }
    else {
        return "<td></td>";
    }
}

//function to create the edit button
function createEdit(listing_info){
	var verified_text = (listing_info.verified) ? "Edit" : "Verify";
	var verified_text_fa = (listing_info.verified) ? "fa-cog" : "fa-check-circle-o";

    var temp_td = $("<td class='td-edit padding-left-0 is-hidden-mobile'></td>");
    var temp_a = $("<a class='button no-shadow'></a>");
    var temp_span = $("<span class='icon is-small'></span>");
    var temp_i = $("<i class='fa " + verified_text_fa + "'></i>");
    var temp_span2 = $("<span>" + verified_text + "</span>");
    temp_td.append(temp_a.append(temp_span.append(temp_i), temp_span2));

    //prevent clicking view from dropping down row
    temp_a.click(function(e) {
        e.stopPropagation();
        editRow($(this).closest('.row-disp'));
    });

    return temp_td;
}

// ------------------------------------------------------------------------------------------------------------------------------ CREATE DROP

//function to create dropdown row
function createRowDrop(listing_info, rownum){
    var temp_drop = $("<tr id='row-drop" + rownum + "' class='row-drop'></tr>");
    var temp_td = $("<td class='row-drop-td' colspan='7'></td>")
    var temp_div_drop = $("<div id='div-drop" + rownum + "' class='div-drop'></div>");
    var temp_div_col = $("<div class='columns'></div>");

    temp_drop.append(temp_td.append(temp_div_drop.append(temp_div_col)));

    //if unverified show instructions
    if (listing_info.verified == null){
        temp_div_drop.append(
            //create the unverified instructions, with callback to create regular drop when verified
            createVerifiedDrop(listing_info, function(){
                listing_info.verified = 1;

                //recreate the rows
                var row = temp_drop.prev(".row-disp");
                row.replaceWith(createRow(listing_info, rownum));
                temp_drop.replaceWith(createRowDrop(listing_info, rownum));
            })
        );
    }
    else {
        //append various stuff to the row drop div
        temp_div_col.append(
			createInfoDrop(listing_info),
			createImgDrop(listing_info, rownum)
        );
    }

    temp_div_drop.hide();

    return temp_drop;
}

//function to create the verified overlay
function createVerifiedDrop(listing_info, cb_when_verified){
    var unverified_container = $("<div></div>");

    var unverified_columns_header = $("<div class='columns'></div>");
    var header_column = $("<div class='column'></div>");
    var unverified_h3 = $("<h3 class='is-bold'>You must verify that you own this domain.</h3>");
    var unverified_faq = $("<p>Click <a target='_blank' style'target-new: tab;' class='is-accent margin-bottom-25' href='/faq#verifying'>here</a> for more information on domain verification.</br>Any unverified domains will be automatically deleted each week.</p>");
        unverified_columns_header.append(header_column.append(unverified_h3, unverified_faq));

    var unverified_columns_steps = $("<div class='columns'></div>");
    var steps_column = $("<div class='column'></div>");
        unverified_columns_steps.append(steps_column);

    var unverified_step1 = $("<div class='content'><h3 class='is-blacklight is-bold'>Step 1</h3></div>");
    var step1_text = $("<p>Go to your registrar and log in.</p>");
    var step1_button = $("<a class='margin-right-10 button is-accent no-shadow' target='_blank' title='Open registrar website in new tab' href='https://whois.icann.org/en/lookup?name=" + listing_info.domain_name + "'><span class='is-small icon'><i class='fa fa-search'></i></span><span>Find my registrar.</span></a>");

    var unverified_step2 = $("<div class='content margin-top-0 is-hidden'><h3 class='is-blacklight is-bold'>Step 2</h3><p>Create a new <strong>A Record</strong> for your domain.</div>");
    var step2_button = $("<a class='button is-accent margin-right-10 no-shadow' target='_blank' title='Open registrar website in new tab' href='https://www.google.com/search?q=create+a+record&btnI'><span class='icon is-small'><i class='fa fa-question-circle-o'></i></span><span>How do I create an A Record?</span></a>");

    var unverified_step3 = $("<div class='content margin-top-0 is-hidden'><h3 class='is-blacklight is-bold'>Step 3</h3><p>Point the new <strong>A Record</strong> to DomaHub servers at <strong>208.68.37.82</strong></p></div>");
    var step3_button = $("<input style='width:110px' value='208.68.37.82' class='input is-accent margin-right-10'></input>");

    var unverified_step4 = $("<div class='content margin-top-0 margin-bottom-10 is-hidden'><h3 class='is-blacklight is-bold'>Step 4</h3><p>Click the button below to verify your domain. <br>NOTE: It may take up to 72 hours for <strong>A Record</strong> changes to take effect.</p></div>");
    steps_column.append(unverified_step1, unverified_step2, unverified_step3, unverified_step4);

    //if there is a whois object
    if (listing_info.whois && listing_info.whois.Registrar){
        step1_text.text("Go to your registrar (" + listing_info.whois.Registrar + ") and log in.");
        step1_button.attr('href', listing_info.whois["Registrar URL"]).html("<span class='icon is-small'><i class='fa fa-external-link'></i></span><span>Open my registrar.</span>");
        step2_button.attr('href', "https://www.google.com/search?q=create+a+record+" + listing_info.whois.Registrar + "&btnI");
    }

    //step 1 - login
    var step1_control = $("<div class='control is-grouped'></div>");
    var step1_button_next = $("<a class='button is-primary no-shadow' title='Go to the next step'><span>Okay, I'm logged in.</span><span class='icon'><i class='fa fa-angle-right'></i></span></a>");
        unverified_step1.append(step1_text, step1_control.append(step1_button, step1_button_next));

    //step 2 - create A record
    var step2_control = $("<div class='control is-grouped'></div>");
    var step2_button_next = $("<button class='button is-primary no-shadow' title='Go to the next step'><span>Okay, I made a new A Record.</span><span class='icon'><i class='fa fa-angle-right'></i></span></button>");
        unverified_step2.append(step2_control.append(step2_button, step2_button_next));

    //step 3 - point A record
    var step3_control = $("<div class='control has-addons is-grouped'></div>");
        step3_copy_button = $("<button class='button no-shadow is-accent' title='Copy to Clipboard'><span class='is-small icon'><i class='fa fa-clipboard'></i></span></button>");
    var step3_button_next = $("<a class='button is-primary no-shadow' title='Go to the next step'><span>Okay, I've pointed the A Record.</span><span class='icon'><i class='fa fa-angle-right'></i></span></a>");
        unverified_step3.append(step3_control.append(step3_copy_button, step3_button, step3_button_next));

    step3_copy_button.click(function(){
        $(this).next("input").select();
        document.execCommand("copy");
        $(this).next("input").blur();
        $(this).find("i").removeClass("fa-clipboard").addClass('fa-check-square-o');
    });

    //step 4 - verify
    var step4_control = $("<div class='control is-grouped'></div>");
    var step4_button_next = $("<a class='button margin-right-10 is-primary verify-link no-shadow' title='Verify this Domain'><span class='is-small icon'><i class='fa fa-check-circle-o'></i></span><span>Verify this domain.</span></a>");
        unverified_step4.append(step4_control.append(step4_button_next));

    //click to next
    step1_button_next.add(step2_button_next).add(step3_button_next).click(function(){
        var current_step = $(this).closest(".content").not(".is-hidden");
        if (current_step.next(".content").length){
            current_step.addClass('is-hidden').next(".content").removeClass('is-hidden');
        }
    });

    //ajax to make sure it's all done, then display a regular row if verified
    step4_button_next.off().click(function(e){
        e.preventDefault();
        var unverified_a = $(this);
        unverified_a.addClass('is-loading');
        $.ajax({
            url: "/listing/" + listing_info.domain_name + "/verify",
            method: "POST"
        }).done(function(data){
            unverified_a.removeClass('is-loading is-danger');
            if (data.state == "success"){
                cb_when_verified();
            }
            else {
                unverified_a.addClass('is-danger');
                unverified_a.text("Failed to verify! Please try again.");

                //back to step 1
                var back_to_step1 = $("<a class='button is-primary'><span>Go back to step 1.</span><span class='is-small icon'><i class='fa fa-undo'></i></span></a>");
                back_to_step1.click(function(){
                    var current_step = $(this).closest(".content").addClass("is-hidden");
                    var next_step = $(this).closest(".column").find(">:first-child").removeClass('is-hidden');
                    unverified_a.removeClass('is-danger');
                    unverified_a.html("<span>Verify this domain.</span><span class='is-small icon'><i class='fa fa-check-square'></i></span>");
                    $(this).remove();
                });

				unverified_a.next(".button").remove();
                unverified_a.after(back_to_step1);
            }
        });
    });

    return unverified_container.append(unverified_columns_header, unverified_columns_steps);
}

//function to create the select dropdown for listing status
function createStatusDrop(listing_info){
    var new_td = $("<td class='td-status-drop is-hidden'></td>");
        var temp_span = $("<span class='select status-span'></span>");
        var temp_form = $("<form class='drop-form'></form>");
        var temp_select = $("<select class='status_input changeable-input'></select>");
            temp_select.append("<option value='1'>Active</option");
            temp_select.append("<option value='0'>Inactive</option");
            temp_select.val(listing_info.status);
            temp_select.data("name", "status");
    new_td.append(temp_span.append(temp_form.append(temp_select)));

    //prevent clicking status from dropping down row
    temp_select.click(function(e) {
        e.stopPropagation();
    });

    //change the hidden status TD along with dropdown
    temp_select.change(function(e){
        var text = ($(this).val() == 0) ? "Inactive" : "Active";
        $(this).closest(".td-status-drop").prev(".td-status").text(text);
    });

    return new_td;
}

//function to create the listing info form drop
function createInfoDrop(listing_info){
	var temp_form = $("<form class='drop-form column is-9'></form>");
			var temp_cols2 = $("<div class='columns listing-module'></div>");
						var temp_col3 = $("<div class='column is-3'></div>");
						var temp_col4 = $("<div class='column is-9'></div>");
			var temp_cols3 = $("<div class='columns listing-module'></div>");
						var temp_col5 = $("<div class='column is-3'></div>");
						var temp_col6 = $("<div class='column is-9'></div>");

	//headers on left column
	var temp_header2 = $('<p class="is-bold">Listing Description</p>')
	var temp_header3 = $('<p class="is-bold">Categories</p>')

    //description
    var description = (listing_info.description == null) ? "" : listing_info.description;
    var temp_div2 = $('<div class="control"></div>');
        var temp_div2_control = $('<div class="control">');
            var temp_div2_input = $('<textarea tabindex="1" class="description-input textarea changeable-input" placeholder="Rent this website for any time period you please!">' + description + '</textarea>')
                temp_div2_input.data("name", "description");

    temp_div2.append(temp_div2_control.append(temp_div2_input));

    //categories
    var categories = (listing_info.categories) ? listing_info.categories : "";
    var temp_div3 = $('<div class="control"></div>');
        var temp_category_selectors = createCategorySelections(listing_info);

    temp_div3.append(temp_category_selectors);

    //error message
    var temp_msg_error = $("<div class='listing-msg-error is-hidden is-danger notification'></div>");
        var temp_msg_delete_e = $("<button class='delete'></button>");
        temp_msg_error.append(temp_msg_delete_e);

    //error message
    var temp_msg_success = $("<div class='listing-msg-success is-hidden is-primary notification'></div>");
        var temp_msg_delete_s = $("<button class='delete'></button>");
        temp_msg_success.append(temp_msg_delete_s);

    temp_form.append(temp_cols2.append(temp_col3.append(temp_header2), temp_col4.append(temp_div2)),
					 temp_cols3.append(temp_col5.append(temp_header3), temp_col6.append(temp_div3, createSubmitCancelButton(listing_info), temp_msg_error, temp_msg_success)));

    //to hide the message (error)
    temp_msg_delete_e.click(function(e){
        e.preventDefault();
        temp_msg_error.addClass('is-hidden');
    });

    //to hide the message (success)
    temp_msg_delete_s.click(function(e){
        e.preventDefault();
        temp_msg_success.addClass('is-hidden');
    });

    return temp_form;
}

//function to create the categories selectors
function createCategorySelections(listing_info){
	var temp_div3_control = $('<div class="is-flex-wrap category-control">');
	var temp_div3_input = $('<input tabindex="1" class="is-hidden categories-input input changeable-input value="' + listing_info.categories + '"></input>').val(listing_info.categories).data('name', "categories");
	temp_div3_control.append(temp_div3_input);
	clickHandler(temp_div3_control, listing_info);

	return temp_div3_control;
}

//function to add click handler for each category
function clickHandler(control, listing_info){
	control.find(".category-selector").remove();

	for (var x = 0; x < categories.length; x++){
		var listing_categories = (listing_info.categories) ? listing_info.categories.split(" ") : [];
		var selected = (listing_categories.indexOf(categories[x].back) != -1) ? " is-accent" : ""
		var temp_category = $("<a class='button category-selector no-shadow" + selected + "'>" + categories[x].front + "</a>").data("category", categories[x].back);
		var temp_div3_input = control.find(".categories-input");

		//click to add this category
		temp_category.off().on("click", function(e){
			$(this).toggleClass('is-accent');
			var joined_categories = $(this).siblings(".category-selector.is-accent").addBack(".category-selector.is-accent").map(function() {
				return $(this).data("category");
			}).toArray().sort().join(" ");
			joined_categories = (joined_categories == "") ? null : joined_categories;
			temp_div3_input.val(joined_categories);
			changedListingValue(temp_div3_input, listing_info);
		});

		control.append(temp_category);
	}
}

// //function to create the delete button
// function createDeleteButton(listing_info){
//     var temp_delete_button = $('<a tabindex="1" title="Delete Listing" class="button is-danger">Delete Listing</a>');
//
//     //click to delete
//     temp_delete_button.on("click", function(){
//         var delete_button = $(this);
//         delete_button.off().text("Are you sure?");
//
//         //freeze 500ms
//         setTimeout(function() {
//             delete_button.on('click', function(){
//                 $.ajax({
//                     url: "/listing/" + listing_info.domain_name + "/delete",
//                     method: "POST"
//                 }).done(function(data){
//                     var row_drop = delete_button.closest(".row-drop");
//                     var row = row_drop.prev(".row-disp");
//
//                     if (data.state == "success"){
//                         listings = data.listings;
//                         row_display = listings.slice(0);
//                         row_drop.remove();
//                         row.remove();
//                     }
//                     else {
//                         errorMessage(row_drop.find(".listing-msg-error"), data.message);
//                     }
//                 });
//             });
//         }, 500);
//     });
//
//     return temp_delete_button;
// }

//function to create the premium drop down column
function createPremiumButton(listing_info){
    var temp_form = $("<form class='drop-form is-inline-block v-align-top'></form>");

    var premium = listing_info.exp_date >= new Date().getTime();
    var expiring = (listing_info.expiring == 0) ? false : true;

    var temp_upgrade_control = $("<div class='control'></div>");

    var premium_text = (premium) ? "Revert to Basic" : "Upgrade to Premium";
        premium_text = (expiring) ? "Renew Premium" : premium_text;
    var premium_src = (premium) ? "/downgrade" : "/upgrade";
        premium_src = (expiring) ? "/upgrade" : premium_src;
    var temp_upgrade_button = $('<a tabindex="1" title="Upgrade Listing" href="/listing/' + listing_info.domain_name + premium_src + '" class="button is-small no-shadow is-accent">' + premium_text + '</a>');

    if (!premium || expiring){
        //stripe upgrade button
        temp_upgrade_button.off().on("click", function(e){
            premiumBind(e, $(this));
        });
    }
    else {
        //downgrade button
        temp_upgrade_button.off().on("click", function(e){
            basicBind(e, $(this));
        })
    }

    temp_form.append(temp_upgrade_button);

    return temp_form;
}

//function to create submit / cancel buttons
function createSubmitCancelButton(listing_info){
    var temp_control = $('<div class="control"></div>');
        var temp_submit_button = $('<a tabindex="1" title="Save Changes" class="save-changes-button margin-right-10 button is-disabled is-primary no-shadow">Save Changes</a>');
        var temp_cancel_button = $('<a tabindex="1" title="Cancel Changes" class="cancel-changes-button button is-hidden is-danger no-shadow">Cancel Changes</a>');

    temp_control.append(temp_submit_button, temp_cancel_button);

    //to submit form changes
    temp_submit_button.click(function(e){
        var row_drop = $(this).closest('.row-drop');
        var row = row_drop.prev(".row-disp");

        submitListingChanges(row, row_drop, $(this), listing_info);
    });

    //to cancel form changes
    temp_cancel_button.click(function(e){
        var row_drop = $(this).closest('.row-drop');
        var row = row_drop.prev(".row-disp");

        cancelListingChanges(row, row_drop, $(this), listing_info);
    });

    return temp_control;
}

//function to create the image drop column
function createImgDrop(listing_info, rownum){
    var background_image = (listing_info.background_image == null || listing_info.background_image == undefined || listing_info.background_image == "") ? "https://placeholdit.imgix.net/~text?txtsize=40&txt=RANDOM%20PHOTO&w=200&h=200" : listing_info.background_image;

    var temp_col = $("<div class='column is-3'></div>");
    var temp_div = $("<div class='card is-pulled-right listing-img no-shadow'></div>");
    var temp_div_image = $("<div class='card-image'></div>")
    var temp_figure = $("<figure class='image listing-img'></figure>");
    var temp_x = $('<button tabindex="1" class="delete-img delete"></button>');
    var temp_img = $("<img class='is-listing' alt='Image not found' src=" + background_image + " />");
    var temp_footer = $("<footer class='card-footer'></div>");
    var temp_form = $('<form tabindex="1" id="mult-form' + rownum + '" class="drop-form-file" action="/listings/create/multiple" method="post" enctype="multipart/form-data"></form>')
    var temp_input = $('<input type="file" id="file' + rownum + '" name="background_image" accept="image/png, image/gif, image/jpeg" class="picture-file changeable-input input-file" />');
    var temp_input_label = $('<label for="file' + rownum + '" class="card-footer-item"><i class="fa fa-upload"></i><p class="file-label">Upload Picture</p></label>');
    temp_input.data("name", "background_image");
    temp_col.append(temp_div.append(temp_div_image.append(temp_figure.append(temp_x, temp_img)), temp_footer.append(temp_form.append(temp_input, temp_input_label))));

    //if theres an error in getting the image, remove the link
    temp_img.error(function() {
        $(this).attr("src", "");
    });

    //click X to delete image
    temp_x.on("click", function(e){
        deleteBackgroundImg(temp_x, listing_info);
    });

    return temp_col;
}

//function to handle deletion of background img
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
		temp_form.find(".file-label").text("Change Picture");
	}
	changedListingValue(temp_input, listing_info);
}

//function to create input price rate drop
function createPriceRateDrop(listing_info){
    var new_td = $("<td class='td-price-rate-drop is-hidden'></td>");
        var temp_form = $("<form class='drop-form'></form>");
        var temp_input = $("<input type='number' min='1' step='1' class='padding-top-0 price-rate-input has-text-right input changeable-input'></input>");
            temp_input.val(listing_info.price_rate);
            temp_input.data("name", "price_rate");
    new_td.append(temp_form.append(temp_input));

    //prevent clicking status from dropping down row
    temp_input.click(function(e) {
        e.stopPropagation();
    });

    //change the hidden price rate TD along with dropdown
    temp_input.on("change", function(e){
        e.preventDefault();
        $(this).closest(".td-price-rate").prev(".td-price-rate").text("$" + $(this).val());
    });

    return new_td;
}

//function to create select price type drop
function createPriceTypeDrop(listing_info){
    var new_td = $("<td class='td-price-type-drop padding-right-0 is-hidden'></td>");
        var temp_span = $("<span class='select price-type-span'></span>");
        var temp_form = $("<form class='drop-form'></form>");
        var temp_select = $("<select class='price-type-input changeable-input'></select>");
            temp_select.append("<option value='month'>Month</option");
            temp_select.append("<option value='week'>Week</option");
            temp_select.append("<option value='day'>Day</option");
            temp_select.val(listing_info.price_type);
            temp_select.data("name", "price_type");
    new_td.append(temp_span.append(temp_form.append(temp_select)));

    //prevent clicking price type from dropping down row
    temp_select.click(function(e) {
        e.stopPropagation();
    });

    //change the hidden price type TD along with dropdown
    temp_select.change(function(e){
        $(this).closest(".td-price-type-drop").prev(".td-price-type").text($(this).val());
    });

    return new_td;
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
            editPriceRate($(this), false);
            editPriceType($(this), false);
            $(this).next(".row-drop").find(".cancel-changes-button").click();
        }
    });

    //are we editing or saving?
    var editing = (row.data("editing") == false) ? true : false;
    row.data("editing", editing);

    dropRow(row, editing);
    editStatus(row, editing);
    editPriceRate(row, editing);
    editPriceType(row, editing);

    //cancel any changes if we collapse the row
    if (!editing){
        row.next(".row-drop").find(".cancel-changes-button").click();
    }
}

//function to change status column to editable
function editStatus(row, editing){
    var status_drop_td = row.find(".td-status-drop");
    var status_td = row.find(".td-status");
    var verify_td = row.find(".td-verify");

    //only show status stuff when the listing is verified
    if (verify_td.hasClass("is-hidden")){
        if (editing){
            status_td.addClass("is-hidden");
            status_drop_td.removeClass("is-hidden");
        }
        else {
            status_td.removeClass("is-hidden");
            status_drop_td.addClass("is-hidden");
        }
    }
}

//function to change price rate column to editable
function editPriceRate(row, editing){
    var price_rate_drop_td = row.find(".td-price-rate-drop");
    var price_rate_td = row.find(".td-price-rate");
    var verified = row.find(".td-verify").hasClass("is-hidden");

    //only show price rate input when the listing is verified
    if (verified){
        if (editing){
            price_rate_td.addClass("is-hidden");
            price_rate_drop_td.removeClass("is-hidden");
        }
        else {
            price_rate_td.removeClass("is-hidden");
            price_rate_drop_td.addClass("is-hidden");
        }
    }
}

//function to change price rate column to editable
function editPriceType(row, editing){
    var price_type_drop_td = row.find(".td-price-type-drop");
    var price_type_td = row.find(".td-price-type");
    var verify_td = row.find(".td-verify");

    //only show status stuff when the listing is verified
    if (verify_td.hasClass("is-hidden")){
        if (editing){
            price_type_td.addClass("is-hidden");
            price_type_drop_td.removeClass("is-hidden");
        }
        else {
            price_type_td.removeClass("is-hidden");
            price_type_drop_td.addClass("is-hidden");
        }
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
					clickHandler(row_drop.find(".category-control"), info);

					//all other inputs handler
                    both_rows.find(".drop-form .changeable-input").unbind("input").on("input", function(e){
                        e.preventDefault();
                        changedListingValue($(this), info);
                    });

					//upload image button handler
                    both_rows.find(".drop-form-file .changeable-input").off().on("change", function(e){
                        e.preventDefault();
                        var file_name = ($(this).val()) ? $(this).val().replace(/^.*[\\\/]/, '') : "Change Picture";
                        file_name = (file_name.length > 14) ? "..." + file_name.substr(file_name.length - 14) : file_name;
                        $(this).next(".card-footer-item").find(".file-label").text(file_name);

                        changedListingValue($(this), info);
                    });

					//click X to delete image
					row_drop.find(".delete-img").off().on("click", function(e){
						e.preventDefault();
						deleteBackgroundImg($(this), info);
					})

                    row_drop.find(".categories-input").val(info.categories);

                    //update the status td text
                    if (bool_for_status_td){
                        row.find(".td-status").text("Inactive");
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

//function to handle post-deletion of multi listings
function deletionHandler(rows){
	listings = rows;
	row_display = listings.slice(0);
    refreshSubmitbindings(true);
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
	listings = data.rows;
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
    var old_status = (listing_info.status == 0) ? "Inactive" : "Active"
    row.find(".status_input").val(listing_info.status);
    row.find(".td-status").not(".td-status-drop").text(old_status);

    //revert prices
    row.find(".price-rate-input").val(listing_info.price_rate);
    row.find(".td-price-rate").text("$" + listing_info.price_rate);

    row.find(".price-type-input").val(listing_info.price_type);
    row.find(".td-price-type").text(toUpperCase(listing_info.price_type));

    //revert all other inputs
    row_drop.find(".description-input").val(listing_info.description);
    row_drop.find(".categories-input").val(listing_info.categories);

	//revert categories
	clickHandler(row_drop.find(".category-control"), listing_info);

    //image
    var img_elem = row_drop.find("img.is-listing");
	var background_image = (listing_info.background_image == null || listing_info.background_image == undefined || listing_info.background_image == "") ? "https://placeholdit.imgix.net/~text?txtsize=40&txt=RANDOM%20PHOTO&w=200&h=200" : listing_info.background_image;
    img_elem.attr("src", background_image);
    row_drop.find(".file-label").text("Upload Picture");
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
                row_drop.find(".file-label").text("Change Picture");
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
            msg_elem.append("<p class='is-white'>You must <a class='is-accent' href='/authorizestripe'>connect your Stripe account</a> before your listing can go live!</p>");
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

// ------------------------------------------------------------------------------------------------------------------------------ PREMIUM/BASIC SUBMISSION

// //function to submit request to upgrade
// function submitSubscription(upgrade_button, stripeToken, stripeEmail){
//     var listing_msg = upgrade_button.closest(".row-drop").find(".listing-msg");
//     var listing_msg_success = upgrade_button.closest(".row-drop").find(".listing-msg-success");
//     errorMessage(listing_msg);
//
//     $.ajax({
//         type: "POST",
//         url: upgrade_button.attr("href"),
//         data: {
//             stripeToken: stripeToken,
//             stripeEmail: stripeEmail
//         }
//     }).done(function(data){
//         upgrade_button.removeClass('is-loading');
//         if (data.state == "error"){
//             errorMessage(listing_msg, data.message);
//         }
//         else {
//             successMessage(listing_msg_success, true);
//             listings = data.listings;
//             row_display = listings.slice(0);
//             upgradeToPremium(upgrade_button, data.new_exp_date);
//         }
//     });
// }
//
// //function to submit request to downgrade
// function submitCancellation(upgrade_button){
//     var listing_msg = upgrade_button.closest(".row-drop").find(".listing-msg");
//     var listing_msg_success = upgrade_button.closest(".row-drop").find(".listing-msg-success");
//     errorMessage(listing_msg);
//
//     $.ajax({
//         type: "POST",
//         url: upgrade_button.attr("href")
//     }).done(function(data){
//         upgrade_button.removeClass('is-loading');
//         if (data.state == "error"){
//             errorMessage(listing_msg, data.message);
//         }
//         else {
//             successMessage(listing_msg_success, true);
//             listings = data.listings;
//             row_display = listings.slice(0);
//             downgradeToBasic(upgrade_button);
//         }
//     });
// }
//
// //stuff to run after upgrading to premium
// function upgradeToPremium(upgrade_button, new_exp_date){
//     var row_drop = upgrade_button.closest(".row-drop");
//     var row = row_drop.prev(".row-disp");
//
//     //edit the various TDs
//     row.find(".td-type").text("Premium");
//     editPriceRate(row, true);
//     editPriceType(row, true);
//
//     //remove all hidden or disabled inputs
//     row_drop.find(".premium-input").removeClass("is-disabled");
//     row_drop.find(".premium-control").removeClass("is-hidden");
//
//     //change expiry date
//     var exp_date_elem = row_drop.find(".premium-exp-date");
//     exp_date_elem.text("Premium renewing on " + moment().add("1", "month").format("YYYY-MM-DD")).removeClass('is-hidden');
//
//     //change the button
//     var old_src = upgrade_button.attr("href");
//     var new_src = old_src.replace("/upgrade", "/downgrade");
//     upgrade_button.attr("href", new_src);
//     upgrade_button.html('Revert to Basic');
//     upgrade_button.off().on("click", function(e){
//         basicBind(e, $(this));
//     });
// }
//
// //stuff to run after downgrading to basic
// function downgradeToBasic(upgrade_button){
//     var row_drop = upgrade_button.closest(".row-drop");
//
//     ///dont change type TD or disable/hide buttons because cancellation happens at end of period
//
//     //change expiry date
//     var exp_date_elem = row_drop.find(".premium-exp-date");
//     var old_text = exp_date_elem.text().replace("renewing", "expiring");
//     exp_date_elem.text(old_text);
//
//     //change the button
//     var old_src = upgrade_button.attr("href");
//     var new_src = old_src.replace("/downgrade", "/upgrade");
//     upgrade_button.attr("href", new_src);
//     upgrade_button.html('Renew Premium');
//     upgrade_button.off().on("click", function(e){
//         premiumBind(e, $(this));
//     });
// }
//
// //event binder for reverting to basic
// function basicBind(e, upgrade_button){
//     e.preventDefault();
//
//     if (upgrade_button.text() == "Are you sure?"){
//         upgrade_button.addClass('is-loading');
//         submitCancellation(upgrade_button);
//     }
//     else {
//         upgrade_button.text("Are you sure?");
//     }
// }
//
// //event binder for upgrading to premium
// function premiumBind(e, upgrade_button){
//     e.preventDefault();
//
//     //stripe configuration
//     handler = StripeCheckout.configure({
//         key: 'pk_test_kcmOEkkC3QtULG5JiRMWVODJ',
//         name: 'DomaHub Domain Rentals',
//         image: '/images/d-logo.PNG',
//         panelLabel: 'Pay Monthly',
//         zipCode : true,
//         locale: 'auto',
//         email: user.email,
//         token: function(token) {
//             if (token.email != user.email){
//                 var listing_msg = upgrade_button.closest(".row-drop").find(".listing-msg");
//                 errorMessage(listing_msg, "Please use the same email for payments as your DomaHub account!");
//                 upgrade_button.removeClass("is-loading");
//             }
//             else {
//                 upgrade_button.addClass("is-loading");
//                 submitSubscription(upgrade_button, token.id, token.email);
//             }
//         }
//     });
//
//     handler.open({
//         amount: 500,
//         description: "Upgrading to a Premium listing."
//     });
//
//     //close Checkout on page navigation
//     window.addEventListener('popstate', function() {
//         handler.close();
//     });
// }

function toUpperCase(string){
    return string.charAt(0).toUpperCase() + string.substr(1);
}
