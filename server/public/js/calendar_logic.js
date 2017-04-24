//----------------------------------------------------------------------------------------------------------------CALENDAR SET UP

function getExistingEvents(calendar_elem){
    calendar_elem.off("click");

    listing_info.rental_moments = [];
    for (var x = 0; x < listing_info.rentals.length; x++){
        var startDate = moment(listing_info.rentals[x].date);
        var endDate = moment(listing_info.rentals[x].date + listing_info.rentals[x].duration);

        //only if its the same path and after today
        if (endDate.isSameOrAfter(moment()) && listing_info.rentals[x].path == $("#typed-slash").val()){
            listing_info.rental_moments.push({
                start : startDate,
                end : endDate,
                rental: listing_info.rentals[x]
            });
        }
    }

    //re-add the event handler
    $("#calendar").on("click", function(){
        getExistingEvents($(this));
    });

    setUpCalendar(listing_info);
    $("#calendar").focus().data('daterangepicker').show();
}

//function to setup the calendar
function setUpCalendar(listing_info){

    //remove any existing date range pickers
    if ($("#calendar").data('daterangepicker')){
        console.log("Removing old date picker");
        $("#calendar").data('daterangepicker').remove();
    }

    //create a new range picker based on new path rental availability
    var start_date = moment().endOf("hour").add(1, "millisecond");
    var end_date = moment().endOf(listing_info.price_type).add(1, "millisecond");

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

        minDate: moment().endOf("hour").add(1, "millisecond").add(1, "hour"),
        maxDate: moment().endOf("hour").add(1, "millisecond").add(1, "year"),

        isInvalidDate: function(curDate){
            if (curDate.isAfter(moment())){
                var bool = checkIfNotOverlapped(curDate);
                return bool;
            }
            else {
                return true;
            }
        }
    });

    //update when applying new dates
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

    //to figure out what events are already existing in given view
    $('#calendar').on('show.daterangepicker', function(ev, picker) {
        //remove any error messages
        $("#calendar-regular-message").removeClass('is-hidden');
        $("#calendar-error-message").addClass('is-hidden');
    });

    //clear any selected dates if cancelled
    //for when the calendar is hidden (click outside)
    $('#calendar').on('cancel.daterangepicker', function(ev, picker) {
        delete $("#calendar").data('daterangepicker').startDate;
        delete $("#calendar").data('daterangepicker').endDate;
        $(this).val("");
        $("#checkout-button").addClass('is-disabled');
    });

    $("#calendar").data('daterangepicker').show();
}

//helper function to make sure theres nothing overlapping this event
function checkIfNotOverlapped(event){
    var overlap = 0;
    for (var x = 0; x < listing_info.rental_moments.length; x++){
        var rental_start = listing_info.rental_moments[x].start;
        var rental_end = listing_info.rental_moments[x].end;

        //include start, exclude end
        if (event.isBetween(rental_start, rental_end, listing_info.price_type, "[)")){
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

		//calculate the price
        var totalPrice = moment.duration(endDate.diff(startDate));
        if (listing_info.price_type == "month"){
            totalPrice = totalPrice.asDays() / 30;
        }
        else {
            totalPrice = totalPrice.as(listing_info.price_type);
            totalPrice = Number(Math.round(totalPrice+'e2')+'e-2');
        }
        totalPrice = totalPrice * listing_info.price_rate;

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
