var row_display = listings.slice(0);

$(document).ready(function() {

});

//function to create a listing row
function createRow(listing_info, rownum){
    var tempRow = $("<tr class='row-disp' id='row" + rownum + "'></tr>");
    var verified = listing_info.status != 0;

    tempRow.append(createArrow(listing_info));
    tempRow.append(createDomain(listing_info));
    tempRow.append(createType(listing_info));
    tempRow.append(createVerify(listing_info, verified));
    tempRow.append(createStatus(listing_info, verified));
    tempRow.append(createStatusDrop(listing_info));
    tempRow.append(createDate(listing_info));
    tempRow.append(createView(listing_info));

    tempRow.on("click", function(e){
        editRow($(this));
    });

    tempRow.data("editing", false);
    return tempRow;
}

//function to create the listing price type td
function createType(listing_info){
    var text = (listing_info.price_type != 0) ? "Premium" : "Basic";
    var temp_td = $("<td class='td-visible td-type'>" + text + "</td>");
    temp_td.data("type", text);
    return temp_td;
}

//function to create a button to verify the listing
function createVerify(listing_info, bool){
    var temp_td = $("<td class='td-visible td-verify'></td>");
        var temp_a = $("<a class='verify-link'></a>");
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
    var text = (listing_info.status == 1) ? "Inactive" : "Active";
    var temp_td = $("<td class='td-visible td-status'>" + text + "</td>");

    //hide if not verified
    if (!bool){
        temp_td.addClass("is-hidden");
    }
    temp_td.data("status", text);
    return temp_td;
}

//function to create the listing created date
function createDate(listing_info){
    var start = moment(new Date(listing_info.date_created + "Z")).format('YYYY/MM/DD, hh:mm A');
    var temp_td = $("<td class='td-visible td-date'>" + start + "</td>");
    return temp_td;
}

//function to create the tv icon
function createView(listing_info){
    var temp_td = $("<td class='td-visible td-view'></td>");
        var temp_a = $("<a class='button' target='_blank' style='target-new: tab;'' href='/listing/" + listing_info.domain_name + "'></a>");
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

//function to create dropdown row
function createRowDrop(listing_info, rownum){
    var unverified_opacity = (listing_info.status == 0) ? "is-unverified" : "";

    var temp_drop = $("<tr id='row-drop" + rownum + "' class='row-drop'></tr>");
    var temp_td = $("<td class='row-drop-td' colspan='6'></td>")
    var temp_div_drop = $("<div id='div-drop" + rownum + "' class='div-drop " + unverified_opacity + " td-visible container'></div>");
    var temp_div_col = $("<div class='columns'></div>");

    //if unverified, gray out the controls in the background
    if (listing_info.status == 0){
        var unverified_div = $("<div class='unverified-div div-drop'></div>");
            var unverified_a = $("<a class='button verify-link'></a>");
                unverified_a.data("href", '/listing/' + listing_info.domain_name + '/verify');
                var unverified_span2 = $("<span>Please verify that you own this domain</span>");
                unverified_a.append(unverified_span2);

        unverified_a.unbind().click(function(e){
            e.preventDefault();
            unverified_a.removeClass("is-danger").addClass('is-loading');
            $.ajax({
                url: unverified_a.data("href"),
                method: "GET"
            }).done(function(data){
                unverified_a.removeClass('is-loading').addClass("is-success").text("Success!");
                if (data.state == "success"){

                    //show all inputs except price
                    var row_drop = unverified_div.closest(".row-drop");
                    row_drop.find(".is-disabled").not(".premium-input").removeClass("is-disabled");
                    row_drop.find(".save-changes-button").removeClass("is-hidden");

                    //show status button
                    var row = row_drop.prev(".row-disp");
                    row.find(".td-verify").addClass("is-hidden");
                    row.find(".td-status").removeClass("is-hidden");
                    row.find(".status-input").val(1);

                    unverified_div.addClass('is-hidden');
                    editStatus(row, true);
                    listings = data.listings;
                }
                else {
                    unverified_a.addClass('is-danger');
                    unverified_a.text("Failed");
                }
            });
        });

        temp_div_drop.append(unverified_div.append(unverified_a));
        unverified_div.hide();
    }

    temp_drop.append(temp_td.append(temp_div_drop.append(temp_div_col.append(
        createFormDrop(listing_info),
        createPriceDrop(listing_info),
        createImgDrop(listing_info)
    ))));

    temp_div_drop.hide();

    return temp_drop;
}

//function to create the image drop column
function createImgDrop(listing_info){
    var background_image = (listing_info.background_image == null || listing_info.background_image == undefined) ? "https://placeholdit.imgix.net/~text?txtsize=40&txt=2000x1000&w=200&h=200" : listing_info.background_image;
    var verified_disabled = (listing_info.status == 0) ? "is-disabled" : "";

    var temp_col = $("<div class='column is-one-quarter'></div>");
        var temp_div = $("<div class='card'></div>");
            var temp_div_image = $("<div class='card-image'></div>")
                var temp_figure = $("<figure class='image listing-img is-256x256'></figure>");
                    var temp_img = $("<img class='is-listing' alt='Image not found' src=" + background_image + " />");
                var temp_footer = $("<footer class='card-footer'></div>");
                    var temp_form = $('<form id="mult-form" class="card-footer-item" action="/listing/create/batch" method="post" enctype="multipart/form-data"></form>')
                    var temp_input = $('<input type="file" name="image" id="file" accept="image/png, image/gif, image/jpeg" class="is-hidden input-file" />');
                    var temp_input_label = $('<label for="file" class="' + verified_disabled + ' button"><i class="fa fa-upload"></i>Change Picture</label>');

    temp_col.append(temp_div.append(temp_div_image.append(temp_figure.append(temp_img), temp_footer.append(temp_form.append(temp_input, temp_input_label)))));

    temp_img.error(function() {
        $(this).attr("src", "");
    });

    return temp_col;
}

//function to create the price drop column
function createPriceDrop(listing_info){
    var temp_col = $("<div class='column is-3'></div>");
    var temp_form = $("<form class='drop-form'></form>");
    var verified_disabled = (listing_info.status == 0) ? "is-disabled" : "";

    var label_types = ["Hourly", "Daily", "Weekly", "Monthly"];     //for display
    var label_names = ["hour_price", "day_price", "week_price", "month_price"];     //for data for input listener
    var label_values = [listing_info.hour_price, listing_info.day_price, listing_info.week_price,listing_info.month_price];     //for values

    for (var x = 0; x < 4; x++){
        var hourly_hidden = (listing_info.price_type == 0 && x == 0) ? "is-hidden" : "";
        var temp_div1 = $("<div class='control " + hourly_hidden + " is-horizontal'></div>");
            var temp_div_label = $("<div class='control-label is-small'></div>");
                var temp_label = $('<label class="label">' + label_types[x] + '</label>');
            var temp_div_control = $("<div class='control'></div>");
                var temp_control_p = $("<p class='control has-icon'></p>");

                    //disabled if listing is not verified
                    var disabled = (listing_info.price_type == 0) ? "is-disabled" : "";
                    var temp_input = $('<input class="' + label_types[x].toLowerCase() + '-price-input premium-input input changeable-input ' + disabled + '" type="number" value="' + label_values[x] + '">');
                        temp_input.data("name", label_names[x]);

                    var temp_i = $('<i class="fa fa-dollar"></i>');
        temp_form.append(temp_div1.append(temp_div_label.append(temp_label), temp_div_control.append(temp_control_p.append(temp_input, temp_i))));
    }
    var temp_upgrade_control = $("<div class='control is-horizontal'></div>");
        var premium_text = (listing_info.price_type == 0) ? "Upgrade to Premium" : "Revert to Basic"
        var temp_upgrade_button = $('<a href="/listing/' + listing_info.domain_name + '/upgrade" class="' + verified_disabled + ' button is-accent">' + premium_text + '</a>');
    temp_form.append(temp_upgrade_control.append(temp_upgrade_button));

    temp_col.append(temp_form);

    return temp_col;
}

//function to create buy link and background image form drop
function createFormDrop(listing_info){
    var temp_col = $("<div class='column'></div>");
    var temp_form = $("<form class='drop-form'></form>");
    var verified_hidden = (listing_info.status == 0) ? "is-hidden" : "";
    var verified_disabled = (listing_info.status == 0) ? "is-disabled" : "";

    var buy_link = (listing_info.buy_link == null) ? "" : listing_info.buy_link;
    var description = (listing_info.description == null) ? "" : listing_info.description;

    var temp_div1 = $('<div class="control is-horizontal"></div>');
        var temp_div1_control = $("<div class='control-label is-small'></div>");
            var temp_div1_label = $("<label class='label'>Purchase link</label>")
        var temp_div1_p = $("<p class='control has-icon'></p>");
            var temp_div1_input = $('<input class="buy-link-input ' + verified_disabled + ' input changeable-input" type="url" placeholder="https://buy-my-website.com" value="' + buy_link + '"/>');
                temp_div1_input.data("name", "buy_link");
            var temp_div1_input_i = $('<i class="fa fa-link"></i>');
    temp_div1.append(temp_div1_control.append(temp_div1_label), temp_div1_p.append(temp_div1_input, temp_div1_input_i));

    var temp_div2 = $('<div class="control is-horizontal"></div>');
        var temp_div2_control_label = $('<div class="control-label is-small">');
            var temp_div2_label = $('<label class="label">Description</label>');
        var temp_div2_control = $('<div class="control">');
            var temp_div2_input = $('<textarea class="description-input ' + verified_disabled + ' textarea changeable-input" placeholder="Rent this website for any time period you please!">' + description + '</textarea>')
                temp_div2_input.data("name", "description");

    temp_div2.append(temp_div2_control_label.append(temp_div2_label), temp_div2_control.append(temp_div2_input));

    var temp_div3 = $('<div class="control is-grouped"></div>');
        var temp_control1 = $('<div class="control"></div>');
            var temp_button1 = $('<a class="save-changes-button ' + verified_hidden + ' button is-disabled is-primary">Save Changes</a>');
        var temp_control2 = $('<div class="control"></div>');
            var temp_button2 = $('<a class="cancel-changes-button ' + verified_hidden + ' button is-hidden is-danger">Cancel Changes</a>');

    var temp_msg = $("<p class='listing-msg is-hidden notification'></p>");
        var temp_msg_delete = $("<button class='delete'></button>");
        temp_msg.append(temp_msg_delete);


    //to submit form changes
    temp_button1.click(function(e){
        var row_drop = $(this).closest('.row-drop');
        var row = row_drop.prev(".row-disp");

        submitListingChanges(row, row_drop, $(this), listing_info);
    });

    //to cancel form changes
    temp_button2.click(function(e){
        var row_drop = $(this).closest('.row-drop');
        var row = row_drop.prev(".row-disp");

        cancelListingChanges(row, row_drop, $(this), listing_info);
    });

    temp_div3.append(temp_control1.append(temp_button1), temp_control2.append(temp_button2));

    temp_col.append(temp_form.append(temp_div1, temp_div2, temp_div3, temp_msg));

    return temp_col;
}

//function to create the select dropdown for listing status
function createStatusDrop(listing_info){
    var new_td = $("<td class='td-visible td-status td-status-drop is-hidden'></td>");
        var temp_span = $("<span class='select status-span'></span>");
        var temp_form = $("<form class='drop-form'></form>");
        var temp_select = $("<select class='status_input changeable-input'></select>");
            temp_select.append("<option value='1'>Inactive</option");
            temp_select.append("<option value='2'>Active</option");
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

//function to refresh listing_info on cancel and submit button after AJAX success
function refreshSubmitBindings(success_button, cancel_button, listings, domain_name){
    for (var x = 0; x < listings.length; x++){
        if (listings[x].domain_name == domain_name){
            cancel_button.unbind().click(function(e){
                var row_drop = $(this).closest('.row-drop');
                var row = row_drop.prev(".row-disp");

                cancelListingChanges(row, row_drop, $(this), listings[x]);
            });

            success_button.unbind().click(function(e){
                var row_drop = $(this).closest('.row-drop');
                var row = row_drop.prev(".row-disp");

                submitListingChanges(row, row_drop, $(this), listings[x]);
            });

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
    var old_status = (listing_info.status == 1) ? "Inactive" : "Active"
    row.find(".status_input").val(listing_info.status);
    row.find(".td-status").not(".td-status-drop").text(old_status);

    //revert all other inputs
    row_drop.find(".buy-link-input").val(listing_info.buy_link);
    row_drop.find(".description-input").val(listing_info.description);
    row_drop.find(".hourly-price-input").val(listing_info.hour_price);
    row_drop.find(".daily-price-input").val(listing_info.day_price);
    row_drop.find(".weekly-price-input").val(listing_info.week_price);
    row_drop.find(".monthly-price-input").val(listing_info.month_price);

    //todo - picture
}

//function to submit any changes to a listing
function submitListingChanges(row, row_drop, success_button, listing_info){
    var cancel_button = success_button.closest(".control").next(".control").find(".cancel-changes-button");
    var listing_msg = row_drop.find(".listing-msg");
    var domain_name = listing_info.domain_name;

    var formData = new FormData();
    row.add(row_drop).find(".changeable-input").each(function(e){
        var input_name = $(this).data("name");
        var input_val =$(this).val();

        //if null or undefined
        listing_info[input_name] = (listing_info[input_name] == null || listing_info[input_name] == undefined) ? "" : listing_info[input_name];
        if (input_val != listing_info[input_name]){
            formData.append(input_name, input_val);
        }
    });

    //formData.append('image', $('#mult-form')[0].files[0]);
    success_button.addClass("is-loading");

    $.ajax({
        url: "/listing/" + domain_name + "/update",
        method: "POST",
        data: formData,
        // Options to tell jQuery not to process data or worry about the content-type
        cache: false,
        contentType: false,
        processData: false
    }).done(function(data){
        success_button.removeClass("is-loading");
        if (data.state == "success"){
            listings = data.listings;
            success_button.addClass("is-disabled");
            cancel_button.addClass('is-hidden');
            refreshSubmitBindings(success_button, cancel_button, listings, domain_name);
        }
        else {
            listing_msg.removeClass('is-hidden');
            listing_msg.find("p").empty();
            listing_msg.append("<p>" + data.message + "</p>");
        }
    });
}
