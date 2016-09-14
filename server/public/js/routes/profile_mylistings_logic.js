$(document).ready(function() {
    var listings_per_page = 5;
    var total_pages = Math.ceil(listings.length / listings_per_page);
    var current_page = 1;

    //create the pagination pages
    createPaginationPages(total_pages);
    paginateListings(total_pages, current_page);

    //create the rows
    createAllRows(listings_per_page, current_page);

    $(".page-button").click(function(e){
        current_page = ($(this).text() == "...") ? current_page : $(this).text();
        changePage(listings_per_page, current_page, total_pages);
    })

    $("#next-page").click(function(e){
        current_page++;
        if (current_page > total_pages){
            current_page = total_pages;
        }
        else {
            changePage(listings_per_page, current_page, total_pages);
        }
    })

    $("#prev-page").click(function(e){
        current_page--;
        if (current_page < 1){
            current_page = 1;
        }
        else {
            changePage(listings_per_page, current_page, total_pages);
        }
    })

});

// --------------------------------------------------------------------------------- SORTING

//function to sort the listings
function sortListings(method){

}

// --------------------------------------------------------------------------------- PAGINATION

//function to change pages
function changePage(listings_per_page, current_page, total_pages){
    console.log(current_page);
    createAllRows(listings_per_page, current_page);
    paginateListings(total_pages, current_page);
}

//function to create the pagination buttons
function createPaginationPages(total_pages){
    if (total_pages > 7){
        createPaginationPage(1);
        createPaginationPage(2);
        createPaginationPage(3);
        createPaginationPage(4);
        createPaginationPage(5);
        createPaginationPage(6, "...");
        createPaginationPage(7, total_pages);
    }
    else {
        var counter = 1;
        while (counter <= total_pages){
            createPaginationPage(counter);
            counter++;
        }
    }
}

//function to create a single page on paginate list
function createPaginationPage(page_num, text){
    page_text = text || page_num;
    temp_li = $("<li></li>");
    temp_button = $("<a id='page-" + page_num + "' class='page-button button'>" + page_text + "</a>")
    temp_li.append(temp_button);
    $("#page-list").append(temp_li);
}

//function to paginate the listings
function paginateListings(total_pages, current_page){
    current_page = parseFloat(current_page);
    $(".page-button").removeClass("is-primary");
    if (total_pages > 7){
        if (current_page < 5){
            $("#page-2").text(2);
            $("#page-3").text(3);
            $("#page-4").text(4);
            $("#page-5").text(5);
            $("#page-6").text("...");
            $("#page-" + current_page).addClass("is-primary");
        }
        else if (current_page >= total_pages - 3){
            current_page_id = 7 - (total_pages - current_page);
            $("#page-" + current_page_id).addClass("is-primary");
            $("#page-3").text(total_pages - 4);
            $("#page-4").text(total_pages - 3);
            $("#page-5").text(total_pages - 2);
            $("#page-6").text(total_pages - 1);
        }
        else {
            $("#page-2").text("...");
            $("#page-3").text(current_page - 1);
            $("#page-4").text(current_page);
            $("#page-4").addClass("is-primary");
            $("#page-5").text(current_page + 1);
            $("#page-6").text("...");
        }
    }
    else {
        $("#page-" + current_page).addClass("is-primary");
    }
}

// --------------------------------------------------------------------------------- ROWS

//function to create all the rows
function createAllRows(listings_per_page, current_page){
    $("#mylistings_tbody").empty();
    listing_start = listings_per_page * (current_page - 1);
    for (var x = 0; x < listings_per_page; x++){
        if (listings[listing_start]){
            $("#mylistings_tbody").append(createRow(listings[listing_start], listing_start));
            $("#mylistings_tbody").append(createRowDrop(listings[listing_start], listing_start));
        }
        listing_start++;
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
        temp_a = $("<d class='button'></a>");
            temp_span = $("<span class='icon'></span>");
                temp_i = $("<i class='fa fa-gear'></i>");
            temp_span2 = $("<span class='edit-text'>Edit</span>");
    temp_td.append(temp_a.append(temp_span.append(temp_i), temp_span2));

    temp_td.on("click", function(e){
        editRow($(this).parents("tr"));
    });

    return temp_td;
}

// --------------------------------------------------------------------------------- EDIT ROW

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
    row_drop.find("div").slideToggle("fast");
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
