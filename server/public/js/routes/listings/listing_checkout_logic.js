$(document).ready(function () {

    //--------------------------------------------------------------------------------------------------------- HEADER STEPS

    //hide the login step if logged in
    if (user){
        $("#step-header-log").addClass('is-disabled');
        $("#step-content-log").addClass('is-hidden');

        $("#step-header-site").removeClass('is-disabled');
        $("#step-content-site").removeClass('is-hidden');
    }

    //click to go to different step
    $(".step-header").on("click", function(){
        $(".step-header").addClass('is-disabled');
        $(this).removeClass('is-disabled');

        $(".step-content").addClass('is-hidden');
        $(this).next(".step-content").removeClass('is-hidden');
    });


    //--------------------------------------------------------------------------------------------------------- LISTING DETAILS CARD

    //get the start date and end date of the new rental
    var first_date = new_rental_info.new_rental_times[0];
    var last_date = new_rental_info.new_rental_times[new_rental_info.new_rental_times.length - 1];
    $("#rental-start").text(moment(first_date[0]).format("MMMM DD, YYYY"));
    $("#rental-end").text(moment(last_date[0] + last_date[1]).format("MMMM DD, YYYY"));

    //total duration of the rental
    var total_duration = 0;
    for (var x = 0; x < new_rental_info.new_rental_times.length; x++){
        total_duration += new_rental_info.new_rental_times[x][1];
    }
    total_duration = moment.duration(total_duration).as(listing_info.price_type)
    var duration_plural = (total_duration == 1) ? "" : "s";
    $("#total-duration").text(total_duration + ' ' + listing_info.price_type + duration_plural);
    $("#listing-price-rate").text(moneyFormat.to(listing_info.price_rate));

    //total price of the rental
    var total_price = calculatePrice(new_rental_info.new_rental_times, listing_info);
    $("#total-duration").text(total_duration + ' ' + listing_info.price_type + duration_plural);
    $(".total-price").text(moneyFormat.to(total_price));

    //--------------------------------------------------------------------------------------------------------- CHOICE BLOCKS

    //click choice block
    $(".choice-block").on("click", function() {
        $("#choices-block").addClass("is-hidden");
        $("#choices-selected").removeClass("is-hidden");
        $(".back-button").removeClass("is-hidden");

        //build a website
        if ($(this).hasClass("build-choice")) {
            $(".build-choice-column").toggleClass("is-hidden");
            $("#checkout-msg1").text("We are NOT sponsored by any of these providers below. Clicking the image will send you to the respective website.")
        }

        //link a website
        else if ($(this).hasClass("link-choice")) {
            $(".link-choice-column").toggleClass("is-hidden");
            $("#checkout-msg1").text("Enter the URL of the web content you wish to display on your rental.")
        }

        //forward to a website
        else {
            $(".forward-choice-column").toggleClass("is-hidden");
            $("#checkout-msg1").text("Enter the URL of the website you want to forward your rental to.")
        }
    });

    //back button on
    $(".back-button").on("click", function() {
        $(this).addClass("is-hidden");
        $("#checkout-msg1").text("There are many different ways to create content for your website. Please select one of the options below to move forward!")
        $("#choices-block").removeClass("is-hidden");
        $("#choices-selected").addClass("is-hidden");
        $(".choice-column").addClass("is-hidden");
    });
});

//to format a number for $$$$
var moneyFormat = wNumb({
	thousand: ',',
	prefix: '$',
	decimals: 0
});

//helper function to get price of events
function calculatePrice(times, listing_info){
    if (times && listing_info){
        var totalPrice = 0;

        for (var x = 0; x < times.length; x++){
            //get total number of price type units
            var tempPrice = moment.duration(parseFloat(times[x][1]));
            if (listing_info.price_type == "month"){
                tempPrice = tempPrice.asDays() / 30;
            }
            else {
                tempPrice = tempPrice.as(listing_info.price_type);
                tempPrice = Number(Math.round(tempPrice+'e2')+'e-2');
            }

            totalPrice += tempPrice;
        }

        return totalPrice * listing_info.price_rate;
    }
    else {return false;}
}
