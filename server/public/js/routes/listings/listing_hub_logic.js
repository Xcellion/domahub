var can_submit = false;

$(document).ready(function() {
    //default the dates to today and 1 year from now
    $("#start_date-input").val(moment(new Date()).format("YYYY-MM-DD"));
    $("#end_date-input").val(moment(new Date().getTime() + 31556952000).format("YYYY-MM-DD"));

    //on value change of any input, you can submit
    $(".input").on("change input keyup", function(e){
        allowSubmission();
    });

    $(".cat-checkbox").on('click', function(e){
        allowSubmission();
    });

    //create the rows for the 10 random listings
    createListingRows(random_listings);
    initBigSlider();
    initSmallSlider();

    // Filter dropdown logic
    $("#filter-open-button").click(function() {
        $(this).parents(".listing-buttons").addClass("is-hidden");
        $("#listings-table").addClass("is-hidden");
        $("#filter-dropdown").removeClass("is-hidden");
    });

    $("#filter-cancel-button, #filter-apply-button").click(function() {
        $("#filter-dropdown").addClass("is-hidden");
        $(this).parents().parents().siblings(".listing-buttons").removeClass("is-hidden");
        $("#listings-table").removeClass("is-hidden");
    });

    //submit search
    $("#submit-button").click(function(e) {
        e.preventDefault();
        submitData();
    });

});

//function to initiate the big slider
function initSmallSlider(){
    // Creating the price range slider element
    var sliderSmall = document.getElementById('sliderSmall');

    // Small char slider
    noUiSlider.create(sliderSmall, {
        start: [1, 63],
        connect: true,
        margin: 0,
        behaviour: 'drag-snap',
        tooltips: [wNumb({decimals: 0}), wNumb({decimals: 0})],
        step: 1,
        range: {
            'min': 1,
            'max': 63
        }
    });

    // Add is-small class to sliderSmall
    $("#sliderSmall").addClass("is-small");

}

//function to initiate the big slider
function initBigSlider(){
    // Creating the price range slider element
    var slider = document.getElementById('slider');
    $(slider).addClass('is-disabled is-hidden');

    // Large price slider
    noUiSlider.create(slider, {
        start: [1, 50, 100],
        connect: true,
        behaviour: 'drag-snap',
        tooltips: true,
        step: 1,
        format: wNumb({
            decimals: 0,
            thousand: ',',
            prefix: '$',
        }),
        animate: false,
        range: {
            'min': 1,
            'max': 150000
        }
    });

    // To disable middle handle
    $($(".noUi-handle")[1]).css({
        "border" : "1px solid transparent",
        "box-shadow" : "none",
        "background" : "transparent",
        "z-index" : "0"
    });
    $($(".noUi-tooltip")[1]).addClass("is-hidden");

    //tooltip widths
    var left_width = parseFloat($($(".noUi-tooltip")[0]).css('width')) / 2;
    var right_width = parseFloat($($(".noUi-tooltip")[2]).css('width')) / 2;

    // Tooltips movement on large slider
    slider.noUiSlider.on('slide', function(values, handle, unencoded, tap, positions) {
        //change middle value to middle of first / last
        var middle_val = (handle == 2) ? Math.floor((unencoded[0] + unencoded[2]) / 2) : Math.ceil((unencoded[0] + unencoded[2]) / 2);
        slider.noUiSlider.set([null, middle_val, null]);

        //update the tooltip widths as long as they aren't hidden
        if (!$($(".noUi-tooltip")[0]).hasClass("is-hidden")){
            left_width = parseFloat($($(".noUi-tooltip")[0]).css('width')) / 2;
        }
        if (!$($(".noUi-tooltip")[2]).hasClass("is-hidden")){
            right_width = parseFloat($($(".noUi-tooltip")[2]).css('width')) / 2;
        }

        //if left of left handle + half the widths of both tooltips >= left of right handle
        //visual of handle doesn't update until after this callback has completed
        var handle_0_left = positions[0] * 0.01 * $(".noUi-base").width();
        var handle_2_left = positions[2] * 0.01 * $(".noUi-base").width();
        var is_close = (handle_0_left + left_width >= handle_2_left - right_width);

        //hide the other handle, change moving handle tooltip
        if (is_close && (values[2] !== values[0])) {
            $(".noUi-tooltip").addClass("is-hidden");
            $($(".noUi-tooltip")[1]).removeClass("is-hidden");
            $($(".noUi-tooltip")[1]).text(values[0] + " - " + values[2]);
        }
        else if (values[2] == values[0]) {
            $(".noUi-tooltip").removeClass("is-hidden");
        }
        else {
            $(".noUi-tooltip").removeClass("is-hidden");
            $($(".noUi-tooltip")[1]).addClass("is-hidden");
        }

        //can submit
        allowSubmission();
    });

    //change big slider values on changing of price rate
    $("#category-input").on("change", function(e){
        allowSubmission();
        
        if ($(this).val() != "none"){
            $(slider).removeClass('is-disabled is-hidden');
            var price_rate = $(this).val();
            slider.noUiSlider.updateOptions({
                range: {
                    'min': min_max_prices[price_rate].min,
                    'max': min_max_prices[price_rate].max
                }
            });

            //update current values of handle
            slider.noUiSlider.set([min_max_prices[price_rate].min, (min_max_prices[price_rate].min + min_max_prices[price_rate].max) / 2, min_max_prices[price_rate].max]);
        }
        else {
            $(slider).addClass('is-disabled is-hidden');
        }
    });
}

//function to get the submission data
function getSubmitData(){
    var searchData = {
        domain_name : $("#domain_name-input").val(),
        start_date : new Date($("#start_date-input").val()).getTime(),
        end_date : new Date($("#end_date-input").val()).getTime(),
        price_rate : $("#category-input").val() || "none",
        min_price : slider.noUiSlider.get()[0],
        max_price : slider.noUiSlider.get()[2],
        categories : ""
    }

    //categories string
    $(".cat-checkbox").each(function(e){
        if ($(this).prop("checked")){
            searchData.categories += $(this).val() + " ";
        }
    });

    return searchData;
}

//function to allow submission
function allowSubmission(){
    can_submit = true;
    $('#submit-button').removeClass("is-disabled");
}

//function to submit
function submitData(){
    if (can_submit){
        can_submit = false;
        $("#submit-button").addClass("is-loading");
        $.ajax({
            url: "/testing",
            method: "POST",
            data: getSubmitData()
        }).done(function(data){
            $("#submit-button").removeClass("is-loading").addClass("is-disabled");
            if (data.state == "success"){
                console.log(data.listings);
                createListingRows(data.listings);
            }
            else {
                console.log(data);
            }
        });
    }
}

//function to add new rows after search
function createListingRows(listings){
    var tbody = $("#listings-table").find("tbody");
    tbody.empty();

    if (listings.length){
        //loop through and create each row
        for (var x = 0; x < listings.length; x++){
            var temp_tr = $("<tr></tr>");
            var temp_domain = $("<td><a class='orange-link' href='/listing/" + listings[x].domain_name + "'>" + listings[x].domain_name + "</a></td>");
            var temp_hour = $("<td>" + listings[x].hour_price + "</td>");
            var temp_day = $("<td>" + listings[x].day_price + "</td>");
            var temp_week = $("<td>" + listings[x].week_price + "</td>");
            var temp_month = $("<td>" + listings[x].month_price + "</td>");
            temp_tr.append(temp_domain, temp_hour, temp_day, temp_week, temp_month);
            tbody.append(temp_tr);
        }
    }
    //nothing!
    else {
        var temp_tr = $("<tr></tr>");
        var temp_td = $("<td colspan='5'>There were no listings matching your search criteria!</td>");
        temp_tr.append(temp_td);

        tbody.append(temp_tr);
    }
}
