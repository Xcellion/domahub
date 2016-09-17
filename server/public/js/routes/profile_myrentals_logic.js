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
            //$("#table_body").append(createRowDrop(row_display[listing_start], listing_start));
        }
        listing_start++;
    }
}

//function to create a listing row
function createRow(rental_info, rownum){
    tempRow = $("<tr class='row-disp' id='row" + rownum + "'></tr>");

    tempRow.append(createArrow(rental_info));
    tempRow.append(createDomain(rental_info));
    tempRow.append(createStart(rental_info));
    tempRow.append(createEnd(rental_info));
    tempRow.append(createView(rental_info));

    tempRow.on("click", function(e){
        editRow($(this));
    });

    tempRow.data("editing", false);
    return tempRow;
}

//function to create the status td
function createStart(rental_info){
    var earliest = rental_info.date.reduce(function (a, b) { return a < b ? a : b; });
    var start = moment(new Date(earliest + "Z")).format('YYYY/MM/DD, hh:mm A');
    var temp_td = $("<td class='td-visible td-date'>" + start + "</td>");
    return temp_td;
}

//function to create the date
function createEnd(rental_info){
    var end_dates = [];

    //create an array of end dates
    for (var x = 0; x < rental_info.date.length; x++){
        start_date = new Date(rental_info.date[x]);
        end_date = new Date(start_date.getTime() + rental_info.duration[x]);
        end_dates.push(end_date);
    }

    //find latest one
    var latest = end_dates.reduce(function (a, b) { return a > b ? a : b; });
    var disp_end = moment(new Date(latest + "Z")).format('YYYY/MM/DD, hh:mm A');
    var temp_td = $("<td class='td-visible td-date'>" + disp_end + "</td>");
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
    temp_div_drop = $("<div id='div-drop' class='td-visible container'></div>");
    temp_div_col = $("<div class='columns'></div>");

    temp_drop.append(temp_td.append(temp_div_drop.append(temp_div_col.append(
        createFormDrop(rental_info)
    ))));
    temp_div_drop.hide();

    return temp_drop;
}

//function to create buy link and background image form drop
function createFormDrop(rental_info){
    var temp_col = $("<div class='column'></div>");
    var temp_form = $("<form'></form>");

    var ip_add = (rental_info.ip == null) ? "" : rental_info.ip;

    var temp_div1 = $('<div class="control is-horizontal"></div>');
        var temp_div1_control = $("<div class='control-label'></div>");
            var temp_div1_label = $("<label class='label'>IP Address</label>")
        var temp_div1_p = $("<p class='control has-icon'></p>");
            var temp_div1_input = $('<input class="input" type="url" placeholder="https://buy-my-website.com" value="' + ip_add + '"/>');
            var temp_div1_input_i = $('<i class="fa fa-link"></i>');
    temp_div1.append(temp_div1_control.append(temp_div1_label), temp_div1_p.append(temp_div1_input, temp_div1_input_i));

    var temp_div2 = $('<div class="control"></div>');
        temp_div2.append('<button class="button is-medium is-success is-pulled-right">Save</button>');

    temp_col.append(temp_form.append(temp_div1, temp_div2));

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
