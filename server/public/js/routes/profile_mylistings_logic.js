var listings_display = listings.slice(0);

$(document).ready(function() {
    var listings_per_page = parseFloat($("#domains-per-page").val());
    var total_pages = Math.ceil(listings_display.length / listings_per_page);
    var current_page = 1;

    setupTable(total_pages, listings_per_page, current_page, listings_display);

    //on changing of domains per page
    $("#domains-per-page").change(function(e){
        listings_per_page = parseFloat($(this).val());
        total_pages = Math.ceil(listings_display.length / listings_per_page);
        setupTable(total_pages, listings_per_page, current_page, listings_display);
    })

    //pagination logic
    $(".page-button").click(function(e){
        current_page = ($(this).text() == "...") ? current_page : $(this).text();
        changePage(total_pages, listings_per_page, current_page);
    })

    $("#next-page").click(function(e){
        current_page++;
        if (current_page > total_pages){
            current_page = total_pages;
        }
        else {
            changePage(total_pages, listings_per_page, current_page);
        }
    })

    $("#prev-page").click(function(e){
        current_page--;
        if (current_page < 1){
            current_page = 1;
        }
        else {
            changePage(total_pages, listings_per_page, current_page);
        }
    })

    //sort by header
    $("th").click(function(e){
        var sorted = ($(this).data("sorted") == 1) ? -1 : 1;
        $(this).data("sorted", sorted);
        sortListings($(this).attr('class').split("-").pop(), sorted);
        createAllRows(listings_per_page, current_page);
    });

    //search for a specific domain
    $("#search-domain").keyup(function(e){
        var needle = $(this).val();
        if (needle){
            if (listings_display.length){
                var temp_listings = [];
                for (var x = 0; x < listings.length; x++){
                    if (listings[x].domain_name.includes(needle)){
                        temp_listings.push(listings[x]);
                    }
                }
                listings_display = temp_listings;
                total_pages = Math.ceil(listings_display.length / listings_per_page);
                setupTable(total_pages, listings_per_page, current_page, listings_display);
            }
        }
        else {
            listings_display = listings.slice(0);
            total_pages = Math.ceil(listings_display.length / listings_per_page);
            setupTable(total_pages, listings_per_page, current_page, listings_display);
        }
    })

});

//refresh table (pagination and rows)
function setupTable(total_pages, listings_per_page, current_page, listings_to_disp){
    console.log('w')
    if (!listings_to_disp.length){
        $("#no-listings").removeClass("is-hidden");
        $("#domain_table").addClass("is-hidden");
    }
    else {
        $("#domain_table").removeClass("is-hidden");
        $("#no-listings").addClass("is-hidden");
        createPaginationPages(total_pages);
        paginateListings(total_pages, current_page);
        createAllRows(listings_per_page, current_page);
    }
}

// --------------------------------------------------------------------------------- SORTING

//function to sort the listings
function sortListings(method, sorted){
    if (method == "domain"){
        toggleSort("domain_name", sorted);
    }
    else if (method == "status"){
        toggleSort("price_type", sorted);
    }
    else {
        toggleSort("date_created", sorted);
    }
}

//function to toggle the sorting by header
function toggleSort(attr, bool){
    listings_display.sort(function(a,b) {
        return (bool * ((a[attr] > b[attr]) ? 1 : ((b[attr] > a[attr]) ? -1 : 0)));
    });
}

// --------------------------------------------------------------------------------- PAGINATION

//function to change pages
function changePage(total_pages, listings_per_page, current_page){
    createAllRows(listings_per_page, current_page);
    paginateListings(total_pages, current_page);
}

//function to create the pagination buttons
function createPaginationPages(total_pages){
    $("#page-list").empty();
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
        if (listings_display[listing_start]){
            $("#mylistings_tbody").append(createRow(listings_display[listing_start], listing_start));
            $("#mylistings_tbody").append(createRowDrop(listings_display[listing_start], listing_start));
        }
        listing_start++;
    }
}

//function to create a listing row
function createRow(listing_info, rownum){
    tempRow = $("<tr class='row-disp' id='row" + rownum + "'></tr>");

    tempRow.append(createArrow(listing_info));
    tempRow.append(createDomain(listing_info));
    tempRow.append(createStatus(listing_info));
    tempRow.append(createDate(listing_info));
    tempRow.append(createView(listing_info));

    tempRow.on("click", function(e){
        editRow($(this));
    });

    tempRow.data("editing", false);
    return tempRow;
}

//function to create dropdown row
function createRowDrop(listing_info, rownum){
    temp_drop = $("<tr id='row-drop" + rownum + "' class='row-drop'></tr>");
    temp_td = $("<td class='row-drop-td' colspan='5'></td>")
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
    var background_image = (listing_info.background_image == null || listing_info.background_image == undefined) ? "http://placehold.it/256x256" : listing_info.background_image;

    var temp_col = $("<div class='column is-one-quarter'></div>");
        var temp_div = $("<div class='card'></div>");
            var temp_div_image = $("<div class='card-image'></div>")
                var temp_figure = $("<figure class='image listing-img is-256x256'></figure>");
                    var temp_img = $("<img class='is-listing' alt='Image not found' src=" + listing_info.background_image + "/>");
                var temp_footer = $("<footer class='card-footer'></div>");
                    var temp_a = $("<a class='card-footer-item'>Change Picture</a>");
    temp_col.append(temp_div.append(temp_div_image.append(temp_figure.append(temp_img), temp_footer.append(temp_a))));

    temp_img.error(function() {
        $(this).attr("src", "http://placehold.it/256x256");
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
            var temp_div_label = $("<div class='control-label'></div>");
                var temp_label = $('<label class="label">' + label_types[x] + '</label>');
            var temp_div_control = $("<div class='control'></div>");
                var temp_control_p = $("<p class='control has-icon'></p>");
                    var temp_input = $('<input class="input" type="number" value="' + label_values[x] + '">');
                    var temp_i = $('<i class="fa fa-dollar"></i>');

        temp_form.append(temp_div1.append(temp_div_label.append(temp_label), temp_div_control.append(temp_control_p.append(temp_input, temp_i))));
    }
    temp_col.append(temp_form);

    return temp_col;
}

//function to create buy link and background image form drop
function createFormDrop(listing_info){
    var temp_col = $("<div class='column'></div>");
    var temp_form = $("<form'></form>");

    var buy_link = (listing_info.buy_link == null) ? "" : listing_info.buy_link;
    var description = (listing_info.description == null) ? "" : listing_info.description;

    var temp_div1 = $('<div class="control is-horizontal"></div>');
        var temp_div1_control = $("<div class='control-label'></div>");
            var temp_div1_label = $("<label class='label'>Purchase link</label>")
        var temp_div1_p = $("<p class='control has-icon'></p>");
            var temp_div1_input = $('<input class="input" type="url" placeholder="https://buy-my-website.com" value="' + buy_link + '"/>');
            var temp_div1_input_i = $('<i class="fa fa-link"></i>');
    temp_div1.append(temp_div1_control.append(temp_div1_label), temp_div1_p.append(temp_div1_input, temp_div1_input_i));

    var temp_div2 = $('<div class="control is-horizontal"></div>');
        var temp_div2_control_label = $('<div class="control-label">');
            var temp_div2_label = $('<label class="label">Description</label>');
        var temp_div2_control = $('<div class="control">');
            var temp_div2_input = $('<textarea class="textarea" placeholder="Rent this website for any time period you please!">' + description + '</textarea>')
    temp_div2.append(temp_div2_control_label.append(temp_div2_label), temp_div2_control.append(temp_div2_input));

    var temp_div3 = $('<div class="control"></div>');
        temp_div3.append('<button class="button is-medium is-success is-pulled-right">Save</button>');

    temp_col.append(temp_form.append(temp_div1, temp_div2, temp_div3));

    return temp_col;
}

//function to create the domain name td
function createDomain(listing_info){
    var temp_td = $("<td class='td-visible td-domain'>" + listing_info.domain_name + "</td>");
    return temp_td;
}

//function to create the status td
function createStatus(listing_info){
    var text = (listing_info.price_type != 0) ? "Active" : "Inactive";
    var temp_td = $("<td class='td-visible td-status'>" + text + "</td>");
    temp_td.data("status", text);
    return temp_td;
}

//function to create the date
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
                var temp_i = $("<i class='fa fa-television'></i>");
            var temp_span2 = $("<span>View</span>");
    temp_td.append(temp_a.append(temp_span.append(temp_i), temp_span2));

    //prevent clicking view from dropping down row
    temp_td.click(function(e) {
        e.stopPropagation();
    });

    return temp_td;
}

//function to create the dropdown arrow
function createArrow(){
    var temp_td = $("<td class='td-visible td-arrow'></td>");
        var temp_span = $("<span class='icon'></span>");
            var temp_i = $("<i class='fa fa-angle-right'></i>");
    temp_td.append(temp_span.append(temp_i));

    return temp_td;
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
}

//function to drop down a row
function dropRow(row, editing){
    row_drop = row.next(".row-drop");
    row.toggleClass("is-active");
    if (editing){
        row_drop.find("#div-drop").stop().slideDown("fast");
    }
    else {
        row_drop.find("#div-drop").stop().slideUp("fast");
    }
}

//function to change edit icon
function editArrow(row, editing){
    edit_td = row.find(".td-arrow").find("i");
    if (editing){
        edit_td.addClass("fa-rotate-90");
        edit_td.parent("span").addClass("is-active");
    }
    else {
        edit_td.removeClass("fa-rotate-90");
        edit_td.parent("span").removeClass("is-active");
    }
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
