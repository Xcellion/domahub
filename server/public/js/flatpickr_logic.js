$(document).ready(function(){
    console.log("Flatpickr loaded.");

    let fcalendar = $("#flatpickr-calendar").flatpickr({
        altInput: true,
        altFormat: "n/j/y",
        wrap: true,
        mode: "multiple",

        minDate: moment().endOf("hour").add(1, "millisecond").valueOf(),
        maxDate: moment().endOf("hour").add(1, "millisecond").add(1, "year").valueOf(),

        onChange: function(selectedDates, dateStr, instance) {
            console.log(instance);
        },

        onDayCreate: function(dObj, dStr, fp, dayElem){
            //busy dot so we can see whats already rented
            if ($(dayElem).hasClass('disabled') && !$(dayElem).hasClass('prevMonthDay') && !$(dayElem).hasClass('nextMonthDay')){
                dayElem.innerHTML += "<span class='event busy'></span>";
            }
        }

    });

    //disable existing rental slots
    var existingRentalDates = [];
    for (var x = 0; x < listing_info.rentals.length; x++){
        existingRentalDates.push({
            from: listing_info.rentals[x].date,
            to: listing_info.rentals[x].date + listing_info.rentals[x].duration
        });
    }

    fcalendar.set("disable", existingRentalDates);

    //if hourly rate
    if (listing_info.price_type == "hour"){
        fcalendar.set("enableTime", true);
    }

    //today's date
    $("#fcalendar-today-button").on("click", function(){
        fcalendar.jumpToDate(new Date());
    });

});
