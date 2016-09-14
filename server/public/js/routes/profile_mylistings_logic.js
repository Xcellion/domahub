$(document).ready(function() {
    var listings_per_page = 2;

    paginateListings(listings.length / listings_per_page);
    createAllRows(listings);

    $(".edit-td").click(function(e){
        e.preventDefault();
        editRow($(this).parents("tr"));
    });

});

//function to sort the listings
function sortListings(method){

}

//function to paginate the listings
function paginateListings(pages){
    for (var x = 1; x < pages; x++){
        var y = x+1;
        temp_li = $("<li></li>");
        if (x > 4){
            temp_button = $("<a id='page-" + y + "' class='button is-hidden'>" + y + "</a>")
        }
        else {
            temp_button = $("<a id='page-" + y + "' class='button'>" + y + "</a>")
        }
        temp_li.append(temp_button);

        $("#page-list").append(temp_li);
    }
}

//function to create all the rows
function createAllRows(listings){
    //$("#mylistings_tbody").empty();
    for (var x = 0; x < listings.length; x++){
        $("#mylistings_tbody").append(createRow(listings[x], x));
        $("#mylistings_tbody").append(createRowDrop(listings[x], x));
    }
}

//function to create a listing row
function createRow(listing_info, rownum){
    tempRow = $("<tr id='row" + rownum + "'></tr>");

    tempRow.append(createDomain(listing_info));
    tempRow.append(createStatus(listing_info));
    tempRow.append(createDate(listing_info));
    tempRow.append(createView(listing_info));
    tempRow.append(createEdit(listing_info));

    tempRow.data("editing", false);
    return tempRow;
}

//function to create dropdown row
function createRowDrop(listing_info, rownum){
    temp_drop = $("<tr id='row-drop" + rownum + "' class='row-drop'></tr>");
    temp_td = $("<td class='row-drop-td' colspan='5'></td>")
    temp_div = $("<div class='td-visible'></div>")
    temp_div.append(listing_info.set_price);
    temp_div.append(listing_info.minute_price);
    temp_div.append(listing_info.hour_price);
    temp_div.append(listing_info.day_price);
    temp_div.append(listing_info.week_price);
    temp_div.append(listing_info.month_price);
    temp_div.append(listing_info.description);
    temp_div.append(listing_info.background_image);
    temp_div.append(listing_info.buy_link);

    temp_div.hide();
    temp_drop.append(temp_td.append(temp_div));

    return temp_drop;
}

//function to create the domain name td
function createDomain(listing_info){
    temp_td = $("<td class='td-visible domain-td'>" + listing_info.domain_name + "</td>");
    return temp_td;
}

//function to create the status td
function createStatus(listing_info){
    text = (listing_info.price_type != 0) ? "Active" : "Inactive";
    temp_td = $("<td class='td-visible status-td'>" + text + "</td>");
    temp_td.data("status", text);
    return temp_td;
}

//function to create the date
function createDate(listing_info){
    start = moment(new Date(listing_info.date_created + " UTC")).format('YYYY/MM/DD, hh:mm A');
    temp_td = $("<td class='td-visible date-td'>" + start + "</td>");
    return temp_td;
}

//function to create the tv icon
function createView(listing_info){
    temp_td = $("<td class='td-visible view-td'></td>");
        temp_a = $("<a class='button' href='/listing/" + listing_info.domain_name + "'></a>");
            temp_span = $("<span class='icon'></span>");
                temp_i = $("<i class='fa fa-television'></i>");
            temp_span2 = $("<span>View</span>");
    temp_td.append(temp_a.append(temp_span.append(temp_i), temp_span2));

    return temp_td;
}

//function to create the edit icon
function createEdit(listing_info){
    temp_td = $("<td class='td-visible edit-td'></td>");
        temp_a = $("<a class='button' href=''></a>");
            temp_span = $("<span class='icon'></span>");
                temp_i = $("<i class='fa fa-gear'></i>");
            temp_span2 = $("<span class='edit-text'>Edit</span>");
    temp_td.append(temp_a.append(temp_span.append(temp_i), temp_span2));

    return temp_td;
}

//function to initiate edit mode
function editRow(row){

    //are we editing or saving?
    editing = (row.data("editing") == false) ? true : false;
    row.data("editing", editing);

    dropRow(row, editing);
    editStatus(row, editing);
    editEdit(row, editing);
}

//function to drop down a row
function dropRow(row, editing){
    row_drop = row.next(".row-drop");
    row_drop.find("div").slideToggle();
}

//function to change edit icon
function editEdit(row, editing){
    edit_td = row.find(".edit-td");

    edit_td.find(".button").toggleClass("is-primary");
    if (editing){
        edit_td.find(".edit-text").text("Save");
    }
    else {
        edit_td.find(".edit-text").text("Edit");
    }
}

//function to change status column to editable
function editStatus(row, editing){
    status_td = row.find(".status-td");

    if (editing){
        new_td = $("<td class='td-visible status-td'></td>");
            temp_span = $("<span class='select'></span>");
            temp_select = $("<select></select>");
                temp_select.append("<option value='Active'>Active</option");
                temp_select.append("<option value='Inactive'>Inactive</option");
                temp_select.val(status_td.data('status'));
        new_td.append(temp_span.append(temp_select));

        status_td.replaceWith(new_td);
    }
    else {
        status_td.data("status", status_td.find("select").val())
        status_td.text(status_td.data("status"));
    }
}
