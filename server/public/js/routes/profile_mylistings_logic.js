var row_display = listings.slice(0);

$(document).ready(function() {

});

//function to create a listing row
function createRow(listing_info, rownum){
    tempRow = $("<tr class='row-disp' id='row" + rownum + "'></tr>");

    tempRow.append(createArrow(listing_info));
    tempRow.append(createDomain(listing_info));
    tempRow.append(createType(listing_info));
    tempRow.append(createStatus(listing_info));
    tempRow.append(createDate(listing_info));
    tempRow.append(createView(listing_info));

    tempRow.on("click", function(e){
        editRow($(this));
    });

    tempRow.data("editing", false);
    return tempRow;
}

//function to create the listing status td
function createType(listing_info){
    var text = (listing_info.type != 0) ? "Premium" : "Basic";
    var temp_td = $("<td class='td-visible td-type'>" + text + "</td>");
    temp_td.data("type", text);
    return temp_td;
}

//function to create the listing status td
function createStatus(listing_info){
    var text = (listing_info.price_type != 0) ? "Active" : "Inactive";
    var temp_td = $("<td class='td-visible td-status'>" + text + "</td>");
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
    temp_drop = $("<tr id='row-drop" + rownum + "' class='row-drop'></tr>");
    temp_td = $("<td class='row-drop-td' colspan='6'></td>")
    temp_div_drop = $("<div id='div-drop' class='td-visible container'></div>");
    temp_div_col = $("<div class='columns'></div>");

    temp_drop.append(temp_td.append(temp_div_drop.append(temp_div_col.append(
        createImgDrop(listing_info),
        createPriceDrop(listing_info),
        createFormDrop(listing_info)
    ))));
    temp_div_drop.hide();

    return temp_drop;
}

//function to create the image drop column
function createImgDrop(listing_info){
    var background_image = (listing_info.background_image == null || listing_info.background_image == undefined) ? "" : listing_info.background_image;

    var temp_col = $("<div class='column is-one-quarter'></div>");
        var temp_div = $("<div class='card'></div>");
            var temp_div_image = $("<div class='card-image'></div>")
                var temp_figure = $("<figure class='image listing-img is-256x256'></figure>");
                    var temp_img = $("<img class='is-listing' alt='Image not found' src=" + listing_info.background_image + "/>");
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
    var temp_form = $("<form'></form>");

    var label_types = ["Hourly", "Daily", "Weekly", "Monthly"];
    var label_values = [listing_info.hour_price, listing_info.day_price, listing_info.week_price,listing_info.month_price];

    for (var x = 0; x < 4; x++){
        var temp_div1 = $("<div class='control is-horizontal'></div>");
            var temp_div_label = $("<div class='control-label is-small'></div>");
                var temp_label = $('<label class="label">' + label_types[x] + '</label>');
            var temp_div_control = $("<div class='control'></div>");
                var temp_control_p = $("<p class='control has-icon'></p>");
                    disabled = (listing_info.type == 0) ? "is-disabled" : "";
                    var temp_input = $('<input class="input ' + disabled + '" type="number" value="' + label_values[x] + '">');
                    var temp_i = $('<i class="fa fa-dollar"></i>');

        temp_form.append(temp_div1.append(temp_div_label.append(temp_label), temp_div_control.append(temp_control_p.append(temp_input, temp_i))));
    }

    temp_col.append(temp_form);

    return temp_col;
}

//function to create buy link and background image form drop
function createFormDrop(listing_info){
    var temp_col = $("<div class='column'></div>");
    var temp_form = $("<form></form>");

    var buy_link = (listing_info.buy_link == null) ? "" : listing_info.buy_link;
    var description = (listing_info.description == null) ? "" : listing_info.description;

    var temp_div1 = $('<div class="control is-horizontal"></div>');
        var temp_div1_control = $("<div class='control-label is-small'></div>");
            var temp_div1_label = $("<label class='label'>Purchase link</label>")
        var temp_div1_p = $("<p class='control has-icon'></p>");
            var temp_div1_input = $('<input class="input" type="url" placeholder="https://buy-my-website.com" value="' + buy_link + '"/>');
            var temp_div1_input_i = $('<i class="fa fa-link"></i>');
    temp_div1.append(temp_div1_control.append(temp_div1_label), temp_div1_p.append(temp_div1_input, temp_div1_input_i));

    var temp_div2 = $('<div class="control is-horizontal"></div>');
        var temp_div2_control_label = $('<div class="control-label is-small">');
            var temp_div2_label = $('<label class="label">Description</label>');
        var temp_div2_control = $('<div class="control">');
            var temp_div2_input = $('<textarea class="textarea" placeholder="Rent this website for any time period you please!">' + description + '</textarea>')
    temp_div2.append(temp_div2_control_label.append(temp_div2_label), temp_div2_control.append(temp_div2_input));

    var temp_div3 = $('<div class="control is-pulled-right is-grouped"></div>');
        var temp_control1 = $('<div class="control"></div>');
            var temp_button1 = $('<a href="/listing/upgrade?d=' + listing_info.domain_name + '" class="button is-success">Upgrade to a Premium Listing</a>');
        var temp_control2 = $('<div class="control"></div>');
            var temp_button2 = $('<button class="button is-success">Save Changes</button>');

    temp_div3.append(temp_control1.append(temp_button1), temp_control2.append(temp_button2));

    temp_col.append(temp_form.append(temp_div1, temp_div2, temp_div3));

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
        }
    });

    //are we editing or saving?
    editing = (row.data("editing") == false) ? true : false;
    row.data("editing", editing);

    dropRow(row, editing);
    editArrow(row, editing);
    editStatus(row, editing);
    editType(row, editing);
}

//function to change status column to editable
function editStatus(row, editing){
    status_td = row.find(".td-status");

    if (editing){
        new_td = $("<td class='td-visible td-status'></td>");
            temp_span = $("<span class='select status-span'></span>");
            temp_select = $("<select class='status-select'></select>");
                temp_select.append("<option value='Active'>Active</option");
                temp_select.append("<option value='Inactive'>Inactive</option");
                temp_select.val(status_td.data('status'));
        new_td.append(temp_span.append(temp_select));

        //prevent clicking status from dropping down row
        temp_select.click(function(e) {
            e.stopPropagation();
        });

        status_td.replaceWith(new_td);
    }
    else {
        status_td.data("status", status_td.find("select").val())
        status_td.text(status_td.data("status"));
    }
}

//function to change status column to editable
function editType(row, editing){

}
