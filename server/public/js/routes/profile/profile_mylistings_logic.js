var row_display = listings.slice(0);

// --------------------------------------------------------------------------------- CREATE ROW

//function to create a listing row
function createRow(listing_info, rownum){
    var verified = listing_info.verified != null;
    var verified_row = (listing_info.verified != null) ? "" : " unverified-row";

    var tempRow = $("<tr class='row-disp" + verified_row + "' id='row" + rownum + "'></tr>");
    tempRow.append(createArrow(listing_info));
    tempRow.append(createDomain(listing_info));
    if (verified){
        tempRow.append(createView(listing_info));
    }
    else {
        tempRow.append("<td></td>")
    }
    tempRow.append(createType(listing_info));
    tempRow.append(createVerify(listing_info, verified));
    tempRow.append(createStatus(listing_info, verified));
    tempRow.append(createStatusDrop(listing_info));
    tempRow.append(createPriceRate(listing_info));
    tempRow.append(createPriceType(listing_info));


    tempRow.on("click", function(e){
        editRow($(this));
    });

    tempRow.data("editing", false);
    return tempRow;
}

//function to create the listing price type td
function createType(listing_info){
    var text = (listing_info.exp_date >= new Date().getTime()) ? "Premium" : "Basic";
    var temp_td = $("<td class='td-visible td-type'>" + text + "</td>");
    temp_td.data("type", text);
    return temp_td;
}

//function to create a button to verify the listing
function createVerify(listing_info, bool){
    var temp_td = $("<td class='td-visible td-verify'></td>");
        var temp_a = $("<p class='is-danger verify-link'></p>");
            temp_a.data("href", '/listing/' + listing_info.domain_name + '/verify');
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
    var temp_td = $("<td class='td-visible td-status'>" + text + "</td>");

    //hide if not verified
    if (!bool){
        temp_td.addClass("is-hidden");
    }
    temp_td.data("status", text);
    return temp_td;
}

//function to create the listing created date
function createPriceRate(listing_info){
    var temp_td = $("<td class='td-visible has-text-right td-price-rate'>$ " + listing_info.price_rate + "</td>");
    return temp_td;
}

//function to create the listing created date
function createPriceType(listing_info){
    var temp_td = $("<td class='td-visible td-price-type'>" + listing_info.price_type.charAt(0).toUpperCase() + listing_info.price_type.substr(1) + "</td>");
    return temp_td;
}

//function to create the tv icon
function createView(listing_info){
    var temp_td = $("<td class='td-visible td-view'></td>");
        var temp_a = $("<a class='button no-shadow' target='_blank' style='target-new: tab;' href='/listing/" + listing_info.domain_name + "'></a>");
            var temp_span = $("<span class='icon'></span>");
                var temp_i = $("<i class='fa fa-external-link'></i>");
            var temp_span2 = $("<span>View</span>");
    temp_td.append(temp_a.append(temp_span.append(temp_i), temp_span2));

    //prevent clicking view from dropping down row
    temp_td.click(function(e) {
        e.stopPropagation();
    });

    return temp_td;
}

// --------------------------------------------------------------------------------- CREATE DROP

//function to create dropdown row
function createRowDrop(listing_info, rownum){
    var temp_drop = $("<tr id='row-drop" + rownum + "' class='row-drop'></tr>");
    var temp_td = $("<td class='row-drop-td' colspan='7'></td>")
    var temp_div_drop = $("<div id='div-drop" + rownum + "' class='div-drop td-visible'></div>");
    var temp_div_col = $("<div class='columns'></div>");

    temp_drop.append(temp_td.append(temp_div_drop.append(temp_div_col)));

    //if unverified show instructions
    if (listing_info.verified == null){
        temp_div_drop.append(
            //create the unverified instructions, with callback to create regular drop when verified
            createVerifiedDrop(listing_info, function(){
                listing_info.verified = 1;

                //show status button
                var row = temp_drop.prev(".row-disp");
                row.find(".td-status-drop").removeClass("is-hidden");
                row.find(".td-verify").addClass("is-hidden");
                row.find(".td-status-drop").find(".status_input").val(1);

                temp_div_col.empty().append(
                    createInfoDrop(listing_info),
                    createPremiumDrop(listing_info),
                    createImgDrop(listing_info, rownum)
                );
            })
        );
    }
    else {
        //append various stuff to the row drop div
        temp_div_col.append(
            createInfoDrop(listing_info),
            createImgDrop(listing_info, rownum),
            createPremiumDrop(listing_info)
        );
    }

    temp_div_drop.hide();

    return temp_drop;
}

//function to create the verified overlay
function createVerifiedDrop(listing_info){
  var unverified_container = $("<div class='verification-container'></div>");
        var unverified_columns_header = $("<div class='columns'></div>");
        var unverified_columns_steps = $("<div class='columns'></div>");
            var unverified_column_step0 = $("<div class='column'></div>");
            var unverified_column0 = $("<div class='column is-3 flex-column-center'></div>");
            var unverified_column1 = $("<div class='column is-1 flex-column-center'></div>");
            var unverified_column2 = $("<div class='column is-3 flex-column-center'></div>");
            var unverified_column3 = $("<div class='column is-1 flex-column-center'></div>");
            var unverified_column4 = $("<div class='column is-3 flex-column-center'></div>");
                var unverified_step0_content = $("<div class='content'></div>");
                    var unverified_h3 = $("<h3 class='is-bold'>You must first verify that you own this domain.</h3>");
                    var unverified_button = $("<a class='button is-primary verify-link'></a>");
                        unverified_button.data("href", '/listing/' + listing_info.domain_name + '/verify');
                        var unverified_span2 = $("<span>Click here to Verify</span></a>");
                        unverified_button.append(unverified_span2);
                    var unverified_faq = $("<p>Click <a target='_blank' style'target-new: tab;' class='orange-link margin-bottom-25' href='/faq#verifying'>here</a> for more information on domain verification.</p>");
                    var unverified_icon0 = $("<figure class='image is-32x32'><img src='/images/lib/material/arrow-right.svg' /></figure>");
                    var unverified_icon1 = $("<figure class='image is-32x32'><img src='/images/lib/material/arrow-right.svg' /></figure>");
                    var unverified_step1 = $("<div class='content'><h3 class='is-blacklight is-bold'>Step 1</h3> <p>Create a new <strong>A Record</strong> for your domain name.</p></div>");
                    var unverified_step2 = $("<div class='content'><h3 class='is-blacklight is-bold'>Step 2</h3> <p>Point the new <strong>A Record</strong> to DomaHub servers at 208.68.37.82</p></div>");
                    var unverified_step3 = $("<div class='content'><h3 class='is-blacklight is-bold'>Step 3</h3> </div>");

    unverified_button.off().click(function(e){
        e.preventDefault();
        var unverified_a = $(this);
        unverified_a.addClass('is-loading');
        $.ajax({
            url: unverified_a.data("href"),
            method: "GET"
        }).done(function(data){
            unverified_a.removeClass('is-loading is-danger');
            if (data.state == "success"){
                cb_when_verified();
            }
            else {
                unverified_a.addClass('is-danger');
                unverified_a.text("Failed!");
            }
        });
    });
    return unverified_container.append(unverified_columns_header.append(unverified_column_step0.append(unverified_step0_content.append(unverified_h3, unverified_faq))),
           unverified_columns_steps.append(
           unverified_column0.append(unverified_step1),
           unverified_column1.append(unverified_icon0),
           unverified_column2.append(unverified_step2),
           unverified_column3.append(unverified_icon1),
           unverified_column4.append(
           unverified_step3, unverified_button)
           ));
}

//function to create the select dropdown for listing status
function createStatusDrop(listing_info){
    var new_td = $("<td class='td-visible td-status-drop is-hidden'></td>");
        var temp_span = $("<span class='select status-span'></span>");
        var temp_form = $("<form class='drop-form'></form>");
        var temp_select = $("<select class='status_input changeable-input'></select>");
            temp_select.append("<option value='0'>Inactive</option");
            temp_select.append("<option value='1'>Active</option");
            temp_select.val(listing_info.status);
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

//function to create the listing info form drop
function createInfoDrop(listing_info){
    var temp_col = $("<div class='column'></div>");
    var temp_form = $("<form class='drop-form'></form>");

    //variables to hide or disable things based on verification status
    var verified_hidden = (listing_info.verified == null) ? 'is-hidden" tabindex="1"' : "";
    var verified_disabled = (listing_info.verified == null) ? 'is-disabled" tabindex="1"' : "";

    //date created
    var temp_div1 = $('<div class="control is-horizontal"></div>');
        var temp_div1_control = $("<div class='control-label is-small'></div>");
            var temp_div1_label = $("<label class='label'>Date created</label>")
        var temp_div1_p = $("<p class='control'></p>");
            var temp_div1_input = $("<div>" + moment(listing_info.date_created).format("MMMM DD, YYYY - HH:MM A") + "</div>");
    temp_div1.append(temp_div1_control.append(temp_div1_label), temp_div1_p.append(temp_div1_input));

    //description
    var description = (listing_info.description == null) ? "" : listing_info.description;
    var temp_div2 = $('<div class="control is-horizontal"></div>');
        var temp_div2_control_label = $('<div class="control-label is-small">');
            var temp_div2_label = $('<label class="label">Description</label>');
        var temp_div2_control = $('<div class="control">');
            var temp_div2_input = $('<textarea class="description-input textarea changeable-input ' + verified_disabled + '" placeholder="Rent this website for any time period you please!">' + description + '</textarea>')
                temp_div2_input.data("name", "description");

    temp_div2.append(temp_div2_control_label.append(temp_div2_label), temp_div2_control.append(temp_div2_input));

    //categories
    var categories = (listing_info.categories) ? listing_info.categories : "";
    var temp_div3 = $('<div class="control is-horizontal"></div>');
        var temp_div3_control_label = $('<div class="control-label is-small">');
            var temp_div3_label = $('<label class="label">Categories</label>');
        var temp_div3_control = $('<div class="control">');
            var temp_div3_input = $('<input class="categories-input input changeable-input ' + verified_disabled + '" placeholder="startup industry promotion" value="' + categories + '"></input>')
                temp_div3_input.data("name", "categories");

    temp_div3.append(temp_div3_control_label.append(temp_div3_label), temp_div3_control.append(temp_div3_input));

    //buttons for submit/cancel
    var temp_div4 = $('<div class="control is-grouped"></div>');
        var temp_submit_control = $('<div class="control"></div>');
            var temp_submit_button = $('<a class="save-changes-button button is-disabled is-primary ' + verified_hidden + '">Save Changes</a>');
        var temp_cancel_control = $('<div class="control"></div>');
            var temp_cancel_button = $('<a class="cancel-changes-button button is-hidden is-danger ' + verified_hidden + '">Cancel Changes</a>');

    temp_div4.append(temp_submit_control.append(temp_submit_button), temp_cancel_control.append(temp_cancel_button));

    //error message
    var temp_msg = $("<div class='listing-msg is-hidden is-danger notification'></div>");
        var temp_msg_delete = $("<button class='delete'></button>");
        temp_msg.append(temp_msg_delete);

    temp_col.append(temp_form.append(temp_div1, temp_div2, temp_div3, temp_div4, temp_msg));

    //to hide the message
    temp_msg_delete.click(function(e){
        e.preventDefault();
        temp_msg.addClass('is-hidden');
    });

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

    return temp_col;
}

//function to create the premium drop down column
function createPremiumDrop(listing_info){
    var temp_col = $("<div class='column is-2'></div>");
    var temp_form = $("<form class='drop-form'></form>");
    var verified_disabled = (listing_info.verified == null) ? 'is-disabled" tabindex="1"' : "";

    var premium = listing_info.exp_date >= new Date().getTime();
    var expiring = (listing_info.expiring == 0) ? false : true;

    var temp_upgrade_control = $("<div class='control is-horizontal'></div>");
    var premium_text = (premium) ? "Revert to Basic" : "Upgrade to Premium";
    premium_text = (expiring) ? "Renew Premium" : premium_text;
    var premium_src = (premium) ? "/downgrade" : "/upgrade";
    premium_src = (expiring) ? "/upgrade" : premium_src;
    var temp_upgrade_button = $('<a href="/listing/' + listing_info.domain_name + premium_src + '" class="stripe-button button is-primary ' + verified_disabled + '">' + premium_text + '</a>');

    //show an expiration or renewal date if this is a premium listing
    var expiring_text = (expiring) ? "Premium expiring" : "Premium renewing";
    var premium_hidden = (premium) ? "" : "is-hidden";
    var expiry_date = $('<div class="' + premium_hidden + ' has-text-right premium-exp-date">' + expiring_text + " on " + moment(listing_info.exp_date).format("YYYY-MM-DD") + "</div>");

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

    //buttons for submit/cancel
    var temp_div4 = $('<div class="control has-text-right"></div>');
        var temp_submit_control = $('<div class="control"></div>');
            var temp_submit_button = $('<a class="save-changes-button button is-disabled is-primary">Save Changes</a>');
        var temp_cancel_control = $('<div class="control"></div>');
            var temp_cancel_button = $('<a class="cancel-changes-button button is-hidden is-danger">Cancel Changes</a>');

    temp_div4.append(temp_submit_control.append(temp_submit_button), temp_cancel_control.append(temp_cancel_button));

    temp_form.append(temp_upgrade_control.append(temp_upgrade_button), expiry_date, temp_div4);

    temp_col.append(temp_form);

    return temp_col;
}

//function to create the image drop column
function createImgDrop(listing_info, rownum){
    var background_image = (listing_info.background_image == null || listing_info.background_image == undefined || listing_info.background_image == "") ? "https://placeholdit.imgix.net/~text?txtsize=40&txt=RANDOM%20PHOTO&w=200&h=200" : listing_info.background_image;
    var verified_disabled = (listing_info.verified == null) ? 'is-disabled" tabindex="1"' : "";

    var temp_col = $("<div class='column is-one-quarter'></div>");
    var temp_div = $("<div class='card'></div>");
    var temp_div_image = $("<div class='card-image'></div>")
    var temp_figure = $("<figure class='image listing-img is-256x256'></figure>");
    var temp_x = $('<button class="delete ' + verified_disabled + '"></button>');
    var temp_img = $("<img class='is-listing' alt='Image not found' src=" + background_image + " />");
    var temp_footer = $("<footer class='card-footer'></div>");
    var temp_form = $('<form id="mult-form' + rownum + '" class="drop-form-file card-footer-item" action="/listings/create/multiple" method="post" enctype="multipart/form-data"></form>')
    var temp_input = $('<input type="file" id="file' + rownum + '" name="background_image" accept="image/png, image/gif, image/jpeg" class="picture-file changeable-input input-file ' + verified_disabled + '" />');
    var temp_input_label = $('<label for="file' + rownum + '" class="button ' + verified_disabled + '"><i class="fa fa-upload"></i><p class="file-label">Upload Picture</p></label>');
    temp_input.data("name", "background_image");
    temp_col.append(temp_div.append(temp_div_image.append(temp_figure.append(temp_x, temp_img), temp_footer.append(temp_form.append(temp_input, temp_input_label)))));

    //if theres an error in getting the image, remove the link
    temp_img.error(function() {
        $(this).attr("src", "");
    });

    //click X to delete image
    temp_x.click(function(e){
        if (temp_img.attr("src") != "https://placeholdit.imgix.net/~text?txtsize=40&txt=RANDOM%20PHOTO&w=200&h=200"){
            var old_src = temp_img.attr("src");
            temp_img.data("old_src", old_src);
            temp_img.attr("src", "https://placeholdit.imgix.net/~text?txtsize=40&txt=RANDOM%20PHOTO&w=200&h=200");
            temp_input.data("deleted", true);
            temp_input.val("");
            temp_form.find(".file-label").text("Change Picture");
        }
        changedListingValue(temp_input, listing_info);
    })

    return temp_col;
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
            editStatus($(this), false);
            $(this).next(".row-drop").find(".cancel-changes-button").click();
        }
    });

    //are we editing or saving?
    var editing = (row.data("editing") == false) ? true : false;
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

//function to refresh listing_info on cancel, submit, input event listeners after AJAX success
function refreshSubmitbindings(success_button, cancel_button, listings, domain_name){
    for (var x = 0; x < listings.length; x++){
        if (listings[x].domain_name == domain_name){
            var row_drop = success_button.closest('.row-drop');
            var row = row_drop.prev(".row-disp");
            var both_rows = row.add(row_drop);

            cancel_button.off().click(function(e){
                cancelListingChanges(row, row_drop, $(this), listings[x]);
            });

            success_button.off().click(function(e){
                submitListingChanges(row, row_drop, $(this), listings[x]);
            });

            both_rows.find(".drop-form .changeable-input").unbind("input").on("input", function(e){
                changedListingValue($(this), listings[x]);
            });

            both_rows.find(".drop-form-file .changeable-input").off().on("change", function(e){
                var file_name = ($(this).val()) ? $(this).val().replace(/^.*[\\\/]/, '') : "Change Picture";
                file_name = (file_name.length > 14) ? "..." + file_name.substr(file_name.length - 14) : file_name;
                $(this).next(".button").find(".file-label").text(file_name);

                changedListingValue($(this), listings[x]);
            });

            row_drop.find(".categories-input").val(listings[x].categories);

            break;
        }
    }
}

// --------------------------------------------------------------------------------- SUBMIT LISTING UPDATES

//function to cancel the listing submit
function cancelListingChanges(row, row_drop, cancel_button, listing_info){
    cancel_button.addClass("is-hidden");
    success_button = cancel_button.closest(".control").prev(".control").find(".save-changes-button");
    success_button.removeClass("is-loading is-success is-danger").addClass('is-disabled').text("Save Changes");

    var listing_msg = row_drop.find(".listing-msg");
    listing_msg.addClass('is-hidden');

    //revert back to the old status
    var old_status = (listing_info.status == 0) ? "Inactive" : "Active"
    row.find(".status_input").val(listing_info.status);
    row.find(".td-status").not(".td-status-drop").text(old_status);

    //revert all other inputs
    row_drop.find(".buy-link-input").val(listing_info.buy_link);
    row_drop.find(".description-input").val(listing_info.description);
    row_drop.find(".categories-input").val(listing_info.categories);
    row_drop.find(".hourly-price-input").val(listing_info.hour_price);
    row_drop.find(".daily-price-input").val(listing_info.day_price);
    row_drop.find(".weekly-price-input").val(listing_info.week_price);
    row_drop.find(".monthly-price-input").val(listing_info.month_price);

    //image
    var img_elem = row_drop.find("img.is-listing");
    img_elem.attr("src", img_elem.data("old_src"));
    row_drop.find(".file-label").text("Change Picture");
    row_drop.find(".input-file").val("");
}

//function to submit any changes to a listing
function submitListingChanges(row, row_drop, success_button, listing_info){
    var cancel_button = success_button.closest(".control").next(".control").find(".cancel-changes-button");

    //clear any existing messages
    var listing_msg = row_drop.find(".listing-msg");
    errorMessage(listing_msg);

    var domain_name = listing_info.domain_name;

    var formData = new FormData();

    //only add changed inputs
    row.add(row_drop).find(".changeable-input").each(function(e){
        var input_name = $(this).data("name");
        var input_val = (input_name == "background_image") ? $(this)[0].files[0] : $(this).val();

        //if image is being deleted
        if (input_name == "background_image" && $(this).data("deleted")){
            var input_val = "";
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
            listings = data.listings;
            success_button.addClass("is-disabled");
            cancel_button.addClass('is-hidden');
            refreshSubmitbindings(success_button, cancel_button, listings, domain_name);

            //change background image if its changed
            if (data.new_background_image){
                row_drop.find("img.is-listing").attr("src", data.new_background_image);
                row_drop.find(".file-label").text("Change Picture");
                row_drop.find(".picture-file").val("");
            }
        }
        else {
            errorMessage(listing_msg, data.message);
        }
    });
}

//helper function to display error messages per listing
function errorMessage(msg_elem, message){
    msg_elem.removeClass('is-hidden');
    msg_elem.find("p").empty();
    if (message){
        //connect stripe first!
        if (message == "stripe-connect-error"){
            msg_elem.append("<p class='is-white'>You must <a class='orange-link' href='/authorizestripe'>connect your Stripe account</a> before your listing can go live!</p>");
        }
        else {
            msg_elem.append("<p class='is-white'>" + message + "</p>");
        }
    }
    else {
        msg_elem.addClass('is-hidden');
    }
}

// --------------------------------------------------------------------------------- PREMIUM/BASIC SUBMISSION

//function to submit request to upgrade
function submitSubscription(upgrade_button, stripeToken, stripeEmail){
    var listing_msg = upgrade_button.closest(".row-drop").find(".listing-msg");
    errorMessage(listing_msg);

    $.ajax({
        type: "POST",
        url: upgrade_button.attr("href"),
        data: {
            stripeToken: stripeToken,
            stripeEmail: stripeEmail
        }
    }).done(function(data){
        upgrade_button.removeClass('is-loading');
        if (data.state == "error"){
            errorMessage(listing_msg, data.message);
        }
        else {
            listings = data.listings;
            upgradeToPremium(upgrade_button, data.new_exp_date);
        }
    });
}

//function to submit request to downgrade
function submitCancellation(upgrade_button){
    var listing_msg = upgrade_button.closest(".row-drop").find(".listing-msg");
    errorMessage(listing_msg);

    $.ajax({
        type: "POST",
        url: upgrade_button.attr("href"),
        data: {

        }
    }).done(function(data){
        upgrade_button.removeClass('is-loading');
        if (data.state == "error"){
            errorMessage(listing_msg, data.message);
        }
        else {
            listings = data.listings;
            downgradeToBasic(upgrade_button);
        }
    });
}

//stuff to run after upgrading to premium
function upgradeToPremium(upgrade_button, new_exp_date){
    var row_drop = upgrade_button.closest(".row-drop");
    var row = row_drop.prev(".row-disp");

    row.find(".td-type").text("Premium");       //type TD

    //remove all hidden or disabled inputs
    row_drop.find(".premium-input").removeClass("is-disabled");
    row_drop.find(".premium-control").removeClass("is-hidden");

    //change expiry date
    var exp_date_elem = row_drop.find(".premium-exp-date");
    exp_date_elem.text("Premium renewing on " + moment(new_exp_date).format("YYYY-MM-DD")).removeClass('is-hidden');

    //change the button
    var old_src = upgrade_button.attr("href");
    var new_src = old_src.replace("/upgrade", "/downgrade");
    upgrade_button.attr("href", new_src);
    upgrade_button.html('Revert to Basic');
    upgrade_button.off().on("click", function(e){
        basicBind(e, $(this));
    });
}

//stuff to run after downgrading to basic
function downgradeToBasic(upgrade_button){
    var row_drop = upgrade_button.closest(".row-drop");

    ///dont change type TD or disable/hide buttons because cancellation happens at end of period

    //change expiry date
    var exp_date_elem = row_drop.find(".premium-exp-date");
    var old_text = exp_date_elem.text().replace("renewing", "expiring");
    exp_date_elem.text(old_text);

    //change the button
    var old_src = upgrade_button.attr("href");
    var new_src = old_src.replace("/downgrade", "/upgrade");
    upgrade_button.attr("href", new_src);
    upgrade_button.html('Renew Premium');
    upgrade_button.off().on("click", function(e){
        premiumBind(e, $(this));
    });
}

//event binder for reverting to basic
function basicBind(e, upgrade_button){
    e.preventDefault();

    if (upgrade_button.text() == "Are you sure?"){
        upgrade_button.addClass('is-loading');
        submitCancellation(upgrade_button);
    }
    else {
        upgrade_button.text("Are you sure?");
    }
}

//event binder for upgrading to premium
function premiumBind(e, upgrade_button){
    e.preventDefault();

    //stripe configuration
    handler = StripeCheckout.configure({
        key: 'pk_test_kcmOEkkC3QtULG5JiRMWVODJ',
        name: 'DomaHub Domain Rentals',
        image: '/images/d-logo.PNG',
        panelLabel: 'Pay Monthly',
        zipCode : true,
        locale: 'auto',
        email: user.email,
        token: function(token) {
            if (token.email != user.email){
                var listing_msg = upgrade_button.closest(".row-drop").find(".listing-msg");
                errorMessage(listing_msg, "Please use the same email for payments as your DomaHub account!");
                upgrade_button.removeClass("is-loading");
            }
            else {
                upgrade_button.addClass("is-loading");
                submitSubscription(upgrade_button, token.id, token.email);
            }
        }
    });

    handler.open({
        amount: 500,
        description: "Upgrading to a Premium listing."
    });

    //close Checkout on page navigation
    window.addEventListener('popstate', function() {
        handler.close();
    });
}
