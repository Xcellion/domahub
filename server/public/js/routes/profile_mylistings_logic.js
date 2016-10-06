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
    var temp_drop = $("<tr id='row-drop" + rownum + "' class='row-drop'></tr>");
    var temp_td = $("<td class='row-drop-td' colspan='6'></td>")
    var temp_div_drop = $("<div id='div-drop" + rownum + "' class='div-drop td-visible container'></div>");
    var temp_div_col = $("<div class='columns'></div>");

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

    var temp_col = $("<div class='column is-one-quarter'></div>");
        var temp_div = $("<div class='card'></div>");
            var temp_div_image = $("<div class='card-image'></div>")
                var temp_figure = $("<figure class='image listing-img is-256x256'></figure>");
                    var temp_img = $("<img class='is-listing' alt='Image not found' src=" + background_image + " />");
                var temp_footer = $("<footer class='card-footer'></div>");
                    var temp_a = $("<a class='card-footer-item'>Change Picture</a>");
    temp_col.append(temp_div.append(temp_div_image.append(temp_figure.append(temp_img), temp_footer.append(temp_a))));

    temp_img.error(function() {
        $(this).attr("src", "");
    });

    return temp_col;
}

//function to create the price drop column
function createPriceDrop(listing_info){
    var temp_col = $("<div class='column is-3'></div>");
    var temp_form = $("<form class='drop-form'></form>");

    var label_types = ["Hourly", "Daily", "Weekly", "Monthly"];
    var label_values = [listing_info.hour_price, listing_info.day_price, listing_info.week_price,listing_info.month_price];

    for (var x = 0; x < 4; x++){
        var hourly_hidden = (listing_info.price_type == 0 && x == 0) ? "is-hidden" : "";
        var temp_div1 = $("<div class='control " + hourly_hidden + " is-horizontal'></div>");
            var temp_div_label = $("<div class='control-label is-small'></div>");
                var temp_label = $('<label class="label">' + label_types[x] + '</label>');
            var temp_div_control = $("<div class='control'></div>");
                var temp_control_p = $("<p class='control has-icon'></p>");

                    var disabled = (listing_info.price_type == 0) ? "is-disabled" : "";
                    var temp_input = $('<input class="' + label_types[x].toLowerCase() + '-price-input input changeable-input ' + disabled + '" type="number" value="' + label_values[x] + '">');

                    var temp_i = $('<i class="fa fa-dollar"></i>');
        temp_form.append(temp_div1.append(temp_div_label.append(temp_label), temp_div_control.append(temp_control_p.append(temp_input, temp_i))));
    }
    var temp_upgrade_control = $("<div class='control is-horizontal'></div>");
        var premium_text = (listing_info.price_type == 0) ? "Upgrade to Premium" : "Revert to Basic"
        var temp_upgrade_button = $('<a href="/listing/' + listing_info.domain_name + '/upgrade" class="button is-accent">' + premium_text + '</a>');
    temp_form.append(temp_upgrade_control.append(temp_upgrade_button));

    temp_col.append(temp_form);

    return temp_col;
}

//function to create buy link and background image form drop
function createFormDrop(listing_info){
    var temp_col = $("<div class='column'></div>");
    var temp_form = $("<form class='drop-form'></form>");

    var buy_link = (listing_info.buy_link == null) ? "" : listing_info.buy_link;
    var description = (listing_info.description == null) ? "" : listing_info.description;

    var temp_div1 = $('<div class="control is-horizontal"></div>');
        var temp_div1_control = $("<div class='control-label is-small'></div>");
            var temp_div1_label = $("<label class='label'>Purchase link</label>")
        var temp_div1_p = $("<p class='control has-icon'></p>");
            var temp_div1_input = $('<input class="purchase-link-input input changeable-input" type="url" placeholder="https://buy-my-website.com" value="' + buy_link + '"/>');
            var temp_div1_input_i = $('<i class="fa fa-link"></i>');
    temp_div1.append(temp_div1_control.append(temp_div1_label), temp_div1_p.append(temp_div1_input, temp_div1_input_i));

    var temp_div2 = $('<div class="control is-horizontal"></div>');
        var temp_div2_control_label = $('<div class="control-label is-small">');
            var temp_div2_label = $('<label class="label">Description</label>');
        var temp_div2_control = $('<div class="control">');
            var temp_div2_input = $('<textarea class="description-input textarea changeable-input" placeholder="Rent this website for any time period you please!">' + description + '</textarea>')
    temp_div2.append(temp_div2_control_label.append(temp_div2_label), temp_div2_control.append(temp_div2_input));

    var temp_div3 = $('<div class="control is-grouped"></div>');
        var temp_control1 = $('<div class="control"></div>');
            var temp_button1 = $('<a class="save-changes-button button is-disabled is-primary">Save Changes</a>');
        var temp_control2 = $('<div class="control"></div>');
            var temp_button2 = $('<a class="cancel-changes-button button is-hidden is-danger">Cancel Changes</a>');

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
    var status = (listing_info.status == 1) ? "Inactive" : "Active";

    var new_td = $("<td class='td-visible td-status td-status-drop is-hidden'></td>");
        var temp_span = $("<span class='select status-span'></span>");
        var temp_form = $("<form class='drop-form'></form>");
        var temp_select = $("<select class='status-select changeable-input'></select>");
            temp_select.append("<option value='Active'>Active</option");
            temp_select.append("<option value='Inactive'>Inactive</option");
            temp_select.val(status);
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
            editVerify($(this), false);
            $(this).next(".row-drop").find(".cancel-changes-button").click();
        }
    });

    //are we editing or saving?
    var editing = (row.data("editing") == false) ? true : false;
    row.data("editing", editing);

    dropRow(row, editing);
    editArrow(row, editing);
    editStatus(row, editing);
    editVerify(row, editing);

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

//function to change verify column to editable
function editVerify(row, editing){
    var verify_td = row.find(".td-verify");
    var status_td = row.find(".td-status");
    var verify_a = verify_td.find(".verify-link");

    if (editing){
        verify_a.addClass("button");
        verify_a.text("Verify?");

        //bind a click to verify the listing
        verify_a.unbind().click(function(e){
            e.preventDefault();
            e.stopPropagation();
            verify_a.addClass('is-loading').removeClass("is-danger");
            $.ajax({
                url: verify_a.data("href"),
                method: "GET"
            }).done(function(data){
                verify_a.removeClass('is-loading');
                if (data.state == "success"){
                    status_td.removeClass("is-hidden");
                    verify_td.addClass("is-hidden");
                    editStatus(row, editing);
                    listings = data.listings;
                }
                else {
                    verify_a.addClass('is-danger');
                    verify_a.text("Failed");
                }
            });
        });
    }
    else {
        verify_a.unbind().removeClass("button is-danger").text("Unverified");
    }
}

//function to refresh listing_info on cancel button after AJAX success
function refreshCancel(cancel_button, listings, domain_name){
    for (var x = 0; x < listings.length; x++){
        if (listings[x].domain_name == domain_name){
            cancel_button.unbind().click(function(e){
                var row_drop = $(this).closest('.row-drop');
                var row = row_drop.prev(".row-disp");

                cancelListingChanges(row, row_drop, $(this), listings[x]);
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
    row.find(".status-select").val(old_status);
    row.find(".td-status").not(".td-status-drop").text(old_status);

    //revert all other inputs
    row_drop.find(".purchase-link-input").val(listing_info.buy_link);
    row_drop.find(".description-input").html(listing_info.description);
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

    var submit_data = {
        status : (row.find(".status-select").val() == "Inactive") ? 1 : 2,
        buy_link : row_drop.find(".purchase-link-input").val(),
        description : row_drop.find(".description-input").val(),
        hour_price : row_drop.find(".hourly-price-input").val(),
        day_price : row_drop.find(".daily-price-input").val(),
        week_price : row_drop.find(".weekly-price-input").val(),
        month_price : row_drop.find(".monthly-price-input").val()
        //todo - picture
    }

    success_button.addClass("is-loading");

    $.ajax({
        url: "/listing/" + domain_name + "/update",
        method: "POST",
        data: submit_data
    }).done(function(data){
        success_button.removeClass("is-loading");
        if (data.state == "success"){
            listings = data.listings;
            success_button.addClass("is-disabled");
            cancel_button.addClass('is-hidden');
            refreshCancel(cancel_button, listings, domain_name);
        }
        else {
            listing_msg.removeClass('is-hidden');
            listing_msg.find("p").empty();
            listing_msg.append("<p>" + data.message + "</p>");
        }
    });
}
