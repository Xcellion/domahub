//function that runs when back button is pressed
window.onpopstate = function(event) {
    var row_per_page = parseFloat($("#domains-per-page").val());
    var total_pages = Math.ceil(row_display.length / row_per_page);
    var url_page = parseFloat(window.location.pathname.split('/').pop()) >>> 0;
    var current_page = calculateCurrentPage(url_page, total_pages, row_per_page);
    setupTable(total_pages, row_per_page, current_page, row_display);
    setupControls(total_pages, row_per_page, current_page, row_display);
}

$(document).ready(function() {
    var row_per_page = parseFloat($("#domains-per-page").val());
    var total_pages = Math.ceil(row_display.length / row_per_page);
    var url_page = parseFloat(window.location.pathname.split('/').pop()) >>> 0;
    var current_page = calculateCurrentPage(url_page, total_pages, row_per_page);

    setupTable(total_pages, row_per_page, current_page, row_display);
    setupControls(total_pages, row_per_page, current_page, row_display);

    //search for a specific domain
    $("#search-domain").keyup(function(e){
        var needle = $(this).val();

        data_to_display = (window.location.pathname.indexOf("listings") != -1) ? listings : rentals;

        if (needle){
            var temp_rows = [];
            for (var x = 0; x < data_to_display.length; x++){
                if (data_to_display[x].domain_name.includes(needle)){
                    temp_rows.push(data_to_display[x]);
                }
            }
            row_display = temp_rows;
            total_pages = Math.ceil(row_display.length / row_per_page);
            setupTable(total_pages, row_per_page, current_page, row_display);
        }
        else {
            row_display = data_to_display.slice(0);
            total_pages = Math.ceil(row_display.length / row_per_page);
            setupTable(total_pages, row_per_page, current_page, row_display);
        }
    });

    //sort by header
    $("th").click(function(e){
        var sorted = ($(this).data("sorted") == 1) ? -1 : 1;
        $(this).data("sorted", sorted);
        sortRows($(this).attr('class').split("-").pop(), sorted);
        createAllRows(row_per_page, current_page);

        //reset other headers
        $(".sort-asc, .sort-desc").addClass("is-hidden");
        $(".sort-none").removeClass("is-hidden");

        $(this).find('.sort-none').addClass('is-hidden');
        if (sorted == -1){
            $(this).find('.sort-asc').addClass('is-hidden');
            $(this).find('.sort-desc').removeClass('is-hidden');
        }
        else {
            $(this).find('.sort-desc').addClass('is-hidden');
            $(this).find('.sort-asc').removeClass('is-hidden');
        }
    });

    //select all when clicking an input
    $("input[type=text], input[type=number]").click(function(e){
        $(this).select();
    });
});

//function to prevent high pages
function calculateCurrentPage(url_page, total_pages, row_per_page){
    listing_or_rental = window.location.pathname.indexOf("listings") != -1 ? "mylistings" : "myrentals";

    if (url_page <= total_pages && url_page > 0){
        var current_page = url_page;
        return current_page;
    }
    else {
        var current_page = 1;
        history.replaceState({
            current_page: current_page,
            total_pages: total_pages,
            row_per_page: row_per_page
        }, document.title + " - Page " + current_page, "/profile/" + listing_or_rental + "/" + current_page);
        return current_page;
    }
}

//refresh table (pagination and rows)
function setupTable(total_pages, row_per_page, current_page, rows_to_disp){
    if (!rows_to_disp.length){
        $("#no-rows").removeClass("is-hidden");
        $(".rows-exist").addClass("is-hidden");
    }
    else {
        $(".rows-exist").removeClass("is-hidden");
        $("#no-rows").addClass("is-hidden");
        createPaginationPages(total_pages, row_per_page, current_page);
        paginateRows(total_pages, current_page);
        createAllRows(row_per_page, current_page);
    }
}

//function to refresh the controls
function setupControls(total_pages, row_per_page, current_page, rows_to_disp){
    //on changing of domains per page
    $("#domains-per-page").off().change(function(e){
        row_per_page = parseFloat($(this).val());
        total_pages = Math.ceil(row_display.length / row_per_page);
        current_page = 1;
        setupTable(total_pages, row_per_page, current_page, row_display);
    });

    //right and left keyboard click
    $(document).off('keydown').on('keydown', function(event) {
        if ($(event.target).is("input")){
            return true;
        }
        else {
            if (event.keyCode == 37) {
                $("#prev-page").click();
            }
            else if(event.keyCode == 39) {
                $("#next-page").click();
            }
        }
    });

    $("#next-page").off().click(function(e){
        current_page++;
        if (current_page > total_pages){
            current_page = total_pages;
        }
        else {
            changePage(total_pages, row_per_page, current_page);
            createPaginationPages(total_pages, row_per_page, current_page);
            paginateRows(total_pages, current_page);
        }
    });

    $("#prev-page").off().click(function(e){
        current_page--;
        if (current_page < 1){
            current_page = 1;
        }
        else {
            changePage(total_pages, row_per_page, current_page);
            createPaginationPages(total_pages, row_per_page, current_page);
            paginateRows(total_pages, current_page);
        }
    });

    //go to a specific page
    $("#go-to-page-button").off().click(function(e){
        page_val = $("#go-to-page-input").val();
        if (page_val > 0 && page_val <= total_pages && page_val != current_page){
            current_page = page_val;
            changePage(total_pages, row_per_page, current_page);
            createPaginationPages(total_pages, row_per_page, current_page);
            paginateRows(total_pages, current_page);
        }
        else if (page_val != current_page){
            $("#go-to-page-input").val(1);
        }
    });
}

// --------------------------------------------------------------------------------- SORTING

//function to sort the rows
function sortRows(method, sorted){
    if (method == "domain"){
        toggleSort("domain_name", sorted);
    }
    else if (method == "status"){
        toggleSort("status", sorted);
    }
    else if (method == "date"){
        toggleSort("date_created", sorted);
    }
    else if (method == "type"){
        toggleSort("type", sorted);
    }
}

//function to toggle the sorting by header
function toggleSort(attr, bool){
    row_display.sort(function(a,b) {
        return (bool * ((a[attr] > b[attr]) ? 1 : ((b[attr] > a[attr]) ? -1 : 0)));
    });
}

// --------------------------------------------------------------------------------- PAGINATION

//function to change pages
function changePage(total_pages, row_per_page, current_page, bool){
    if (!bool || typeof bool == "undefined"){
        history.pushState({
            current_page: current_page,
            total_pages: total_pages,
            row_per_page: row_per_page
        }, document.title + " - Page " + current_page, "/profile/mylistings/" + current_page);
    }
    createAllRows(row_per_page, current_page);
    paginateRows(total_pages, current_page);
}

//function to create the pagination buttons
function createPaginationPages(total_pages, row_per_page, current_page){
    $("#page-list").empty();

    var pages_to_create = (total_pages > 7) ? 7 : total_pages;

    for (var x = 1; x <= pages_to_create; x++){
        var text;
        if (x == 6){
            text = "...";
        }
        if (x == 7){
            text = total_pages;
        }
        var temp_li = createPaginationPage(x, text);
        temp_li.find(".page-button").click(function(e){
            var button_page = ($(this).text() == "...") ? current_page : $(this).text();
            if (button_page != current_page) {

                current_page = button_page;
                changePage(total_pages, row_per_page, current_page);
                setupControls(total_pages, row_per_page, current_page, row_display);
            }

        })
        $("#page-list").append(temp_li);
    }
}

//function to create a single page on paginate list
function createPaginationPage(page_num, text){
    var page_text = text || page_num;
    var temp_li = $("<li></li>");
    var temp_button = $("<a id='page-" + page_num + "' class='page-button button'>" + page_text + "</a>")
    temp_li.append(temp_button);
    return temp_li;
}

//function to paginate the rows
function paginateRows(total_pages, current_page){
    current_page = parseFloat(current_page);

    //grey out next/prev buttons if first or last page
    if (current_page == total_pages){
        $("#next-page").addClass("is-disabled");
    }
    else {
        $("#next-page").removeClass("is-disabled");
    }
    if (current_page == 1){
        $("#prev-page").addClass("is-disabled");
    }
    else {
        $("#prev-page").removeClass("is-disabled");
    }

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

// --------------------------------------------------------------------------------- CREATE ROWS

//function to create all the rows
function createAllRows(row_per_page, current_page){
    $("#table_body").empty();
    var row_start = row_per_page * (current_page - 1);
    for (var x = 0; x < row_per_page; x++){
        if (row_display[row_start]){
            var temp_row = createRow(row_display[row_start], row_start);
            var temp_row_drop = createRowDrop(row_display[row_start], row_start);
            var both_rows = temp_row.add(temp_row_drop);

            //JS closure magic
            (function(listing_info){
                //to remove disabled on save changes button
                both_rows.find(".drop-form .changeable-input").on("input", function(e){
                    changedListingValue($(this), listing_info);
                });

                //on file change
                both_rows.find(".drop-form-file .changeable-input").off().on("change", function(e){
                    if ($(this).data("deleted")){
                        $(this).data("deleted", false);
                    }
                    var file_name = ($(this).val()) ? $(this).val().replace(/^.*[\\\/]/, '') : "Change Picture";
                    file_name = (file_name.length > 14) ? "..." + file_name.substr(file_name.length - 14) : file_name;
                    $(this).next(".button").find(".file-label").text(file_name);

                    changedListingValue($(this), listing_info);
                });
            }(row_display[row_start]))


            $("#table_body").append(temp_row, temp_row_drop);
        }
        row_start++;
    }
}

//function to create the domain name td
function createDomain(row_info){
    var temp_td = $("<td class='td-visible td-domain'>" + row_info.domain_name + "</td>");
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

//helper function to bind to inputs to listen for any changes from existing listing info
function changedListingValue(input_elem, listing_info){
    var name_of_attr = input_elem.data("name");
    var closest_row = input_elem.closest(".row-drop, .row-disp");
    var save_button = (closest_row.hasClass("row-drop")) ? closest_row.find(".save-changes-button") : closest_row.next(".row-drop").find(".save-changes-button");
    var cancel_button = (closest_row.hasClass("row-drop")) ? closest_row.find(".cancel-changes-button") : closest_row.next(".row-drop").find(".cancel-changes-button");

    //only change if the value changed from existing or if image exists
    if ((name_of_attr != "image" && input_elem.val() != listing_info[name_of_attr])
     || (name_of_attr == "image" && input_elem.val())){
        if (save_button.hasClass("is-disabled")){
            save_button.removeClass("is-disabled");
        }
        else if (save_button.hasClass("is-success")){
            save_button.removeClass("is-success").text("Save Changes");
        }
        if (cancel_button.hasClass("is-hidden")){
            cancel_button.removeClass("is-hidden");
        }
    }
    //hide the cancel, disable the save
    else {
        save_button.removeClass("is-success").addClass("is-disabled").text("Save Changes");
        cancel_button.addClass("is-hidden");
    }
}

//function to drop down a row
function dropRow(row, editing){
    var row_drop = row.next(".row-drop");
    row.toggleClass("is-active");
    if (editing){
        row_drop.find(".div-drop").stop().slideDown("fast");
    }
    else {
        row_drop.find(".div-drop").stop().slideUp("fast");
    }
}

//function to change edit arrow
function editArrow(row, editing){
    var edit_td = row.find(".td-arrow").find("i");
    if (editing){
        edit_td.addClass("fa-rotate-90");
        edit_td.parent("span").addClass("is-active");
    }
    else {
        edit_td.removeClass("fa-rotate-90");
        edit_td.parent("span").removeClass("is-active");
    }
}
