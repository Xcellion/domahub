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
    var data_to_display = (window.location.pathname.indexOf("listings") != -1) ? listings : rentals;

    setupTable(total_pages, row_per_page, current_page, row_display);
    setupControls(total_pages, row_per_page, current_page, row_display);

    //search for a specific domain
    $("#search-domain").keyup(function(e){
        //make sure it obeys filter
        row_display = data_to_display.slice(0);
        row_display = row_display.filter(function(row){
            return filterCheck($("#filter-select").val(), row);
        });

        var needle = $(this).val();
        if (needle){
            var temp_rows = [];
            for (var x = 0; x < row_display.length; x++){
                if (row_display[x].domain_name.includes(needle)){
                    temp_rows.push(row_display[x]);
                }
            }
            row_display = temp_rows;
        }

        total_pages = Math.ceil(row_display.length / row_per_page);
        setupTable(total_pages, row_per_page, current_page, row_display);
        setupControls(total_pages, row_per_page, current_page, row_display);
    });

    //sort by header
    $("th").click(function(e){
        var sorted = ($(this).data("sorted") == 1) ? -1 : 1;
        $(this).data("sorted", sorted);
        sortRows($(this).attr('class').split("-").pop(), sorted);
        createAllRows(row_per_page, current_page);
        emptyRows();

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

    //select all rows
    $("#select-all").off().on("click", function(e){
        if ($(".row-disp").not('.is-active').length != 0){
            selectAllRows($(this));
        }
        else {
            deselectAllRows();
        }
    });
});

//function to filter listings or rentals
function filterCheck(type, data){
    //listings
    if (type == "rented_filter"){
        return data.rented == 1 && data.verified;
    }
    else if (type == "premium_filter"){
        return data.exp_date != 0 && data.verified;
    }
    else if (type == "basic_filter"){
        return data.exp_date == 0 && data.verified;
    }
    else if (type == "unverified_filter"){
        return data.verified == null;
    }
    //rentals
    else if (type == "active_filter"){
        var time_now = new Date().getTime();
        return data.date[0] + data.duration[0] > time_now;
    }
    else if (type == "upcoming_filter"){
        var time_now = new Date().getTime();
        return data.date[0] > time_now;
    }
    else if (type == "expired_filter"){
        var time_now = new Date().getTime();
        return data.date[0] + data.duration[0] <= time_now;
    }
    else {
        return true;
    }
}

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
    var listing_or_rental = window.location.pathname.indexOf("listings") != -1 ? listings : rentals;
    if (listing_or_rental.length == 0){
        $("#filters").addClass('is-hidden');
    }
    else {
        $("#filters").removeClass('is-hidden');
    }
    if (!rows_to_disp.length){
        $("#table_body").children().not(".clone-row").remove();
        emptyRows();
    }
    else {
        createAllRows(row_per_page, current_page);
    }

    createPaginationPages(total_pages, row_per_page, current_page);
    paginateRows(total_pages, current_page);
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

    //show per page, hide if unnecessary
    if (rows_to_disp.length > 25){
        $("#domains-per-page-control").removeClass('is-hidden');
    }
    else {
        $("#domains-per-page-control").addClass('is-hidden');
    }

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
        var page_val = $("#go-to-page-input").val();
        if (page_val <= 0 || page_val > total_pages){
            page_val = 1;
            $("#go-to-page-input").val(page_val);
        }

        if (page_val != current_page){
            current_page = page_val;
            changePage(total_pages, row_per_page, current_page);
            createPaginationPages(total_pages, row_per_page, current_page);
            paginateRows(total_pages, current_page);
        }
    });

    //filter panel
    $("#filter-select").off().change(function(e){

        //remove any search query
        $("#search-domain").val("");

        //remove any sort
        $(".sort-asc, .sort-desc").addClass("is-hidden");
        $(".sort-none").removeClass("is-hidden");

        var temp_rows = [];
        var data_to_display = (window.location.pathname.indexOf("listings") != -1) ? listings : rentals;
        for (var x = 0; x < data_to_display.length; x++){
            if (filterCheck($(this).val(), data_to_display[x])){
                temp_rows.push(data_to_display[x]);
            }
        }
        row_display = temp_rows;
        total_pages = Math.ceil(row_display.length / parseInt($("#domains-per-page").val()));
        setupTable(total_pages, row_per_page, current_page, temp_rows);
        setupControls(total_pages, row_per_page, current_page, temp_rows);
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
    else if (method == "rentalstatus"){
        toggleSort("expired", sorted);
    }
    else if (method == "type"){
        toggleSort("price_type", sorted);
    }
    else if (method == "rate"){
        toggleSort("price_rate", sorted);
    }
    else if (method == "type"){
        toggleSort("exp_date", sorted);
    }
    else if (method == "address"){
        toggleSort("address", sorted);
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
    var url_text = (window.location.pathname.indexOf("listings") != -1) ? '/profile/mylistings/' : "/profile/myrentals/";

    if (!bool || typeof bool == "undefined"){
        history.pushState({
            current_page: current_page,
            total_pages: total_pages,
            row_per_page: row_per_page
        }, document.title + " - Page " + current_page, url_text + current_page);
    }
    createAllRows(row_per_page, current_page);
    paginateRows(total_pages, current_page);
}

//function to create the pagination buttons
function createPaginationPages(total_pages, row_per_page, current_page){
    $("#page-list").empty();

    var pages_to_create = (total_pages > 7) ? 7 : total_pages;

    //only create page button if there are actually more than 1 page to display
    if (pages_to_create > 1){
        for (var x = 1; x <= pages_to_create; x++){
            var text;
            if (x == 2 && (current_page >= total_pages - 3) && pages_to_create > 7){
                text = "...";
            }
            if (x == 6 && current_page < 5 && pages_to_create > 7){
                text = "...";
            }
            if (x == 7){
                text = total_pages;
            }
            var temp_li = createPaginationPage(x, text);
            temp_li.find(".page-button").click(function(e){
                var button_page = ($(this).text() == "...") ? current_page : $(this).text();

                //only change page if not current page
                if (button_page != current_page) {
                    current_page = button_page;
                    changePage(total_pages, row_per_page, current_page);
                    setupControls(total_pages, row_per_page, current_page, row_display);
                }

            })
            $("#page-list").append(temp_li);
        }
    }
}

//function to create a single page on paginate list
function createPaginationPage(page_num, text){
    var page_text = text || page_num;
    var temp_li = $("<li></li>");
    var temp_button = $("<a id='page-" + page_num + "' class='page-button button no-shadow'>" + page_text + "</a>")
    temp_li.append(temp_button);
    return temp_li;
}

//function to paginate the rows
function paginateRows(total_pages, current_page){
    current_page = parseFloat(current_page);

    if (total_pages > 1){
        $("#page-control, #go-to-page-control").removeClass("is-hidden");

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
                $("#page-2").text(2).addClass("button");
                $("#page-3").text(3);
                $("#page-4").text(4);
                $("#page-5").text(5);
                $("#page-6").text("...").removeClass('button');
                $("#page-" + current_page).addClass("is-primary");
            }
            else if (current_page >= total_pages - 3){
                current_page_id = 7 - (total_pages - current_page);
                $("#page-2").text("...").removeClass('button');
                $("#page-" + current_page_id).addClass("is-primary");
                $("#page-3").text(total_pages - 4);
                $("#page-4").text(total_pages - 3);
                $("#page-5").text(total_pages - 2);
                $("#page-6").text(total_pages - 1).addClass("button");
            }
            else {
                $("#page-2").text("...").removeClass('button');
                $("#page-3").text(current_page - 1);
                $("#page-4").text(current_page);
                $("#page-4").addClass("is-primary");
                $("#page-5").text(current_page + 1);
                $("#page-6").text("...").removeClass('button');
            }
        }
        else {
            $("#page-" + current_page).addClass("is-primary");
        }
    }
    else {
        $("#page-control, #go-to-page-control").addClass("is-hidden");
    }

}

// --------------------------------------------------------------------------------- CREATE ROWS

//function to create an empty row if there are no more applicable rentals/listings
function emptyRows(){
    var listing_or_rental_text = window.location.pathname.indexOf("listings") != -1 ? "listings" : "rentals";
    if ($(".row-disp").not('.clone-row').length == 0){
        if (listing_or_rental_text == "listings" && listings.length == 0){
            var tempRow = $("<tr><td class='padding-50 has-text-centered' colspan='99'>There are no listings! <a href='/listings/create' class='is-accent'>Create one now!</a></td></tr>");
        }
        else {
            var tempRow = $("<tr><td class='padding-50 has-text-centered' colspan='99'>There are no matching " + listing_or_rental_text + "! </td></tr>");
        }
        $("#table_body").append(tempRow);
    }
}

//function to create all the rows
function createAllRows(row_per_page, current_page){
    $("#table_body").children().not(".clone-row").remove();
    var row_start = row_per_page * (current_page - 1);
    for (var x = 0; x < row_per_page; x++){
        if (row_display[row_start]){
            var temp_row = createRow(row_display[row_start], row_start);
            var temp_row_drop = createRowDrop(row_display[row_start], row_start);
            var both_rows = temp_row.add(temp_row_drop);

            //JS closure magic
            (function(info){
                changedValueHandlers(both_rows, info);
            }(row_display[row_start]));


            $("#table_body").append(temp_row, temp_row_drop);
        }
        row_start++;
    }
}

//function to create the icon in front
function createIcon(listing_info){
    var temp_td = $("<td class='td-arrow'></td>");
    var temp_span = $("<span class='v-align-bottom icon is-small'></span>");
    var temp_i = $("<i class='no-transition fa fa-square-o'></i>");
    temp_td.append(temp_span.append(temp_i));

    temp_td.on('click', function(e){
        e.stopPropagation();
        selectRow($(this.closest(".row-disp")));
    });

    return temp_td;
}

//function to create the domain name td
function createDomain(row_info){
    var temp_td = $("<td class='td-visible td-domain'>" + row_info.domain_name + "</td>");
    return temp_td;
}

// --------------------------------------------------------------------------------- EDIT ROW

//function to handle all changed value handlers (for submit/cancel)
function changedValueHandlers(both_rows, info){
    //to remove disabled on save changes button
    both_rows.find(".drop-form .changeable-input").on("input change", function(e){
        e.preventDefault();
        $(".notification").addClass('is-hidden');
        changedValue($(this), info);
    });

    //to select all text
    both_rows.find(".drop-form .changeable-input").on("focus", function(e){
        $(this).select();
    });

    //upload image button handler
    both_rows.find(".drop-form-file .changeable-input").off().on("change", function(e){
    e.preventDefault();
    var file_name = ($(this).val()) ? $(this).val().replace(/^.*[\\\/]/, '') : $(this).data("default_text");
        if ($(this).val()){
            file_name = (file_name.length > 14) ? "..." + file_name.substr(file_name.length - 14) : file_name;
        }
    $(this).next("label").find(".file-label").text(file_name);
    changedValue($(this), info);
  });
}

//helper function to bind to inputs to listen for any changes from existing listing info
function changedValue(input_elem, info){
    var name_of_attr = input_elem.data("name");
    var closest_row = input_elem.closest(".row-drop, .row-disp");
    var save_button = (closest_row.hasClass("row-drop")) ? closest_row.find(".save-changes-button") : closest_row.next(".row-drop").find(".save-changes-button");
    var cancel_button = (closest_row.hasClass("row-drop")) ? closest_row.find(".cancel-changes-button") : closest_row.next(".row-drop").find(".cancel-changes-button");

    //only change if the value changed from existing or if image exists
    if ((name_of_attr != "background_image" && name_of_attr != "logo" && input_elem.val() != info[name_of_attr])
    || ((name_of_attr == "background_image" || name_of_attr == "logo") && input_elem.val())
    || ((name_of_attr == "background_image" || name_of_attr == "logo") && input_elem.data("deleted"))){
        input_elem.data('changed', true);

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
        input_elem.data('changed', false);

        save_button.removeClass("is-success").addClass("is-disabled").text("Save Changes");
        cancel_button.addClass("is-hidden");
    }
}

//function to drop down a row
function dropRow(row, editing){
    var row_drop = row.next(".row-drop");
    if (editing){
        row_drop.find(".div-drop").stop().slideDown("fast");
    }
    else {
        row_drop.find(".div-drop").stop().slideUp("fast");
    }
}

// --------------------------------------------------------------------------------- SELECT ROW

//helper function to handle multi-select action buttons
function multiSelectButtons(){
    var selected_rows = $(".row-disp").filter(function(){ return $(this).data("selected") == true });
    var verified_selected_rows = selected_rows.filter(function(){ return $(this).data("verified") == false});

    if (selected_rows.length > 0){
        $("#multi-delete").removeClass("is-disabled");
    }
    else {
        $("#multi-delete").addClass("is-disabled");
    }

    if (verified_selected_rows.length > 0){
        $("#multi-verify").removeClass("is-disabled");
    }
    else {
        $("#multi-verify").addClass("is-disabled");
    }
}

//function to delete multiple rows
function multiDelete(delete_button){
    delete_button.off();

  var deletion_ids = [];
  var selected_rows = $(".row-disp").filter(function(){
    if ($(this).data('selected') == true){
      deletion_ids.push($(this).data('id'));
      return true;
    }
  });

    var listing_or_rental_url = window.location.pathname.indexOf("listings") != -1 ? "mylistings" : "myrentals";
  $.ajax({
    url: "/profile/" + listing_or_rental_url + "/delete",
    method: "POST",
    data: {
      ids: deletion_ids
    }
  }).done(function(data){
    delete_button.on("click", function(){
      multiDelete(delete_button);
    });

        deselectAllRows();
    if (data.state == "success"){
            deletionHandler(data.rows, selected_rows);
    }
        else {
            console.log(data);
        }
  });
}