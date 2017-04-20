//----------------------------------------------------------------------------------------------------------------CALENDAR SET UP

//function to setup the calendar
function setUpCalendar(listing_info){
    var start_date = moment().endOf("hour").add(1, "millisecond");

    listing_info.rental_moments = [];
    for (var x = 0; x < listing_info.rentals.length; x++){
        var startDate = moment(listing_info.rentals[x].date);
        var endDate = moment(listing_info.rentals[x].date + listing_info.rentals[x].duration);
        //only if it's after now
        if (startDate.isAfter(moment())){
            listing_info.rental_moments.push({
                start : startDate,
                end : endDate
            });
        }
    }

    $('#calendar').daterangepicker({
        opens: "center",
        autoApply: true,
        autoUpdateInput: false,
        locale: {
            // format: 'MM/DD/YYYY h:mmA'
            format: 'MM/DD/YYYY'
        },
        // timePicker: true,
        // timePickerIncrement: 60,

        startDate: start_date,
        endDate: moment().endOf("hour").add(1, "millisecond").add(1, "hour"),
        minDate: start_date,
        maxDate: moment().endOf("hour").add(1, "millisecond").add(1, "year"),

        isInvalidDate: function(curDate){
            var bool = checkIfNotOverlapped(curDate);
            return bool;
        },
        isCustomDate: function(curDate){

        }
    });

    //update when pressing apply
    $('#calendar').on('apply.daterangepicker', function(ev, picker) {
        updatePrices();
        if (picker.startDate.isValid() && picker.endDate.isValid()){
            $(this).val(picker.startDate.format('MMM D, YYYY') + ' - ' + picker.endDate.format('MMM D, YYYY'));
            $("#checkout-button").removeClass('is-disabled');
        }
        else {
            $("#checkout-button").addClass('is-disabled');
        }
    });

    //clear any selected dates if cancelled
    $('#calendar').on('cancel.daterangepicker', function(ev, picker) {
        $(this).val('');
        $("#checkout-button").addClass('is-disabled');
    });

    //to figure out what events are already existing in given view
    $('#calendar').on('show.daterangepicker', function(a, b,c,d) {

    });
}


//helper function to make sure theres nothing overlapping this event
function checkIfNotOverlapped(event){
    var overlap = 0;
    for (var x = 0; x < listing_info.rental_moments.length; x++){
        if (event.isBetween(listing_info.rental_moments[x].start, listing_info.rental_moments[x].end, listing_info.price_type, "[)")){
            overlap++;
        }
    }
    return overlap != 0;
}

//helper function to get correct price of events
function updatePrices(){
	if (listing_info.status){
        var startDate = $("#calendar").data('daterangepicker').startDate;
    	var endDate = $("#calendar").data('daterangepicker').endDate.clone().add(1, "millisecond");

        if (!startDate.isValid() || !endDate.isValid()){
			$("#redirect-next-button, #remove_events").removeClass('is-disabled');
		}
		else {
			$("#redirect-next-button, #remove_events").addClass('is-disabled');
		}

		//calculate the price
        var tempDuration = moment.duration(endDate.diff(startDate));
        if (listing_info.price_type == "month"){
            tempDuration = tempDuration.asDays() / 30;
        }
        else {
            tempDuration = tempDuration.as(listing_info.price_type);
            tempDuration = Number(Math.round(tempDuration+'e2')+'e-2');
        }

        totalPrice = tempDuration * listing_info.price_rate;
        totalUnits = tempDuration;

        var s_or_not = (totalUnits > 1) ? "s" : "";

        //price or price per day
        if (totalPrice == 0 && listing_info.price_rate != 0){
            $("#checkout-button").addClass('is-disabled');
            $("#price").text("$" + listing_info.price_rate + " Per " + listing_info.price_type.capitalizeFirstLetter());
        }
        else {
            $("#checkout-button").removeClass('is-disabled');

            //animation for counting numbers
            $("#price").prop('Counter', $("#price").prop('Counter')).stop().animate({
                Counter: totalPrice
            }, {
                duration: 100,
                easing: 'swing',
                step: function (now) {
                    if (listing_info.price_rate != 0){
                        $(this).text("Total: $" + Number(Math.round(now+'e2')+'e-2').toFixed(2));
                    }
                }
            });
        }
	}
}
