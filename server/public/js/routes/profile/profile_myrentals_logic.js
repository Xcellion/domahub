var row_display = rentals.slice(0);

$(document).ready(function() {

});

//function to create all the rows
function createAllRows(row_per_page, current_page){
    $("#table_body").empty();
    listing_start = row_per_page * (current_page - 1);
    for (var x = 0; x < row_per_page; x++){
        if (row_display[listing_start]){
            $("#table_body").append(createRow(row_display[listing_start], listing_start));
            $("#table_body").append(createRowDrop(row_display[listing_start], listing_start));
        }
        listing_start++;
    }
}

//function to create a listing row
function createRow(rental_info, rownum){
    tempRow = $("<tr class='row-disp' id='row" + rownum + "'></tr>");

    tempRow.append(createArrow(rental_info));
    tempRow.append(createDomain(rental_info));
    tempRow.append(createStatus(rental_info));
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
            var temp_span2 = $("<span>View</span>");
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

    temp_drop.append(temp_td.append(temp_div_drop.append(temp_div_col.append(
        createDates(rental_info)
    ))));
    temp_div_drop.hide();

    return temp_drop;
}


//function to create the status td
function createStart(rental_info){
    var earliest = rental_info.date.reduce(function (a, b) { return a < b ? a : b; });
    var start = moment(new Date(earliest)).format('YYYY/MM/DD, hh:mm A');
    var temp_td = $("<td class='td-visible td-date'>" + start + "</td>");
    return temp_td;
}


//function to create start and end dates
function createDates(rental_info){
    var temp_col = $("<div class='column'></div>");

    var temp_div = $('<div class="control is-horizontal"></div>');
    for (var x = 0; x < rental_info.date.length; x++){
        var start = moment(new Date(rental_info.date[x]));
        var disp_start = start.format('YYYY/MM/DD, hh:mm A');
        var disp_end = moment(start._d.getTime() + rental_info.duration[x]).format('YYYY/MM/DD, hh:mm A');

        var start_label = $("<label class='label'>Start Date</label>")
        var start_date = $("<p class=''>" + disp_start + "</p>")

        var end_label = $("<label class='label'>End Date</label>")
        var end_date = $("<p class=''>" + disp_end + "</p>")

        var date_wrapper = $("<div class='date-wrapper'></div>");
        temp_div.append(date_wrapper.append(start_label, start_date, end_label, end_date));
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
        }
    });

    //are we editing or saving?
    editing = (row.data("editing") == false) ? true : false;
    row.data("editing", editing);

    dropRow(row, editing);
    editArrow(row, editing);
}
