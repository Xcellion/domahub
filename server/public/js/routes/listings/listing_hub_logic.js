var can_submit = false;

$(document).ready(function() {
    //default the dates to today and 1 year from now
    $("#start_date-input").val(moment(new Date()).format("YYYY-MM-DD"));
    $("#end_date-input").val(moment(new Date().getTime() + 31556952000).format("YYYY-MM-DD"));

    //on value change of any input, you can submit
    $(".input").change(function(e){
        can_submit = true;
        $('#submit-button').removeClass("is-disabled");
    });

    //create the rows for the 10 random listings
    createListingRows(random_listings);

    // Creating the price range slider element
    var slider = document.getElementById('slider');
    var sliderSmall = document.getElementById('sliderSmall');

    noUiSlider.create(slider, {
        start: [1, 300],
        connect: true,
        margin: 0,
        behaviour: 'drag-snap',
        tooltips: [wNumb({decimals: 0, prefix: '$'}), wNumb({decimals: 0, prefix: '$'})],
        step: 1,
        range: {
            'min': 1,
            'max': 300
        },
    });

    slider.noUiSlider.on('slide', function(values, handle, unencoded) {

        if (values[1] - values[0] <= 11) {

        }
    });

    noUiSlider.create(sliderSmall, {
        start: [1, 63],
        connect: true,
        margin: 1,
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

//function to get the submission data
function getSubmitData(){
    var searchData = {
        domain_name : $("#domain_name-input").val(),
        start_date : new Date($("#start_date-input").val()).getTime(),
        end_date : new Date($("#end_date-input").val()).getTime(),
        price_rate : $("#category-input").val(),
        min_price : slider.noUiSlider.get()[0],
        max_price : slider.noUiSlider.get()[1],
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
            $("#submit-button").removeClass("is-loading");
            if (data.state == "success"){
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
