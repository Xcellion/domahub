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

    //only show new calendar if path changed
    if (myPath != $("#typed-slash").val()){
        myPath = $("#typed-slash").val();
        setUpCalendar(listing_info);
    }
    else {
        $("#calendar").focus().data('daterangepicker').show();
    }
}

//function to setup the calendar
function setUpCalendar(listing_info){
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

<<<<<<< HEAD
    //custom buttons for today
    $(".fc-today-button").hide();
    $("#today-button").click(function(e){
        $(".fc-today-button").click();
    });
    $("#next-available-button").click(function(e){
        if (listing_info.rentals.length){
            var last_rental = listing_info.rentals[listing_info.rentals.length - 1];
            last_rental = (moment().isSameOrAfter(moment(last_rental.date + last_rental.duration))) ? moment() : moment(last_rental.date + last_rental.duration);
            $("#calendar").fullCalendar('gotoDate', last_rental);
        }
    });

    //remove all events and remember
	$("#remove_events").click(function(e){
		$('#calendar').fullCalendar('removeEvents', returnMineNotBG);
		storeCookies("local_events");
		updatePrices();
	});
}

//helper function to get month from a string
function getMonthFromString(mon){
    var d = Date.parse(mon + "1, 2012");
    if(!isNaN(d))
        return new Date(d).getMonth() + 1;
    return -1;
}

//helper function to highlight individual agendaweek cells
function highlightCellHover(viewname){
	$('td.fc-widget-content').not(".fc-axis").mouseenter(function(e){
        if ($(this).data("date") && moment($(this).data("date")).isSameOrAfter(moment().startOf("day"))){
            highlightCell($(this).data("date"), viewname);
            $($(this).attr("class")
                .replace("fc-day fc-widget-content", ".fc-day-header fc-widget-header")
                .replace("fc-future", "is-unselectable")
                .split(" ").join(".")).addClass('is-active');
=======
    //update when applying new dates
    $('#calendar').on('apply.daterangepicker', function(ev, picker) {
        if (picker.startDate.isValid() && picker.endDate.isValid()){
            updatePrices();
            $(this).val(picker.startDate.format('MMM D, YYYY') + ' - ' + picker.endDate.format('MMM D, YYYY'));
            $("#checkout-button").removeClass('is-disabled');
>>>>>>> development
        }
        else {
            $(this).val("");
            $("#checkout-button").addClass('is-disabled');
        }
    });

    //to figure out what events are already existing in given view
    $('#calendar').on('show.daterangepicker', function(ev, picker) {
        //remove any error messages
        $("#calendar-regular-message").removeClass('is-hidden');
        $("#calendar-error-message").addClass('is-hidden');
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

<<<<<<< HEAD
//helper function to merge events
function createEvent(start, end){
	var allevents = $('#calendar').fullCalendar('clientEvents', returnMineNotBG);
	var mergingEvents = [];
	var overlappingEvents = [];
	var fullyOverlappingEvents = [];
	var removeEvents = [];
	var eventEncompassed = false;

	//check for overlapping events or mergeable events (only for mine)
	$.each(allevents, function( index, eventitem )
	{
		//event being created is fully overlapped by existing event, so dont create anything new
		if (eventitem.start.isSameOrBefore(start) && eventitem.end.isSameOrAfter(end)){
			//console.log('new event is not needed');
			eventEncompassed = true;
			removeEventTimeSlot(eventitem, {start: start, end: end}, {start: start, end: end});
			updatePrices();
		}
		//check if existing event is fully overlapped by event being created
		else if (start.isSameOrBefore(eventitem.start) && end.isSameOrAfter(eventitem.end)){
			//console.log('full overlap');
			fullyOverlappingEvents.push(eventitem);
		}
		//overlaps something, just not completely
		else if (
            (end.isAfter(eventitem.end) && start.isBefore(eventitem.end)) ||
            (start.isBefore(eventitem.start) && end.isAfter(eventitem.start))
        ){
			//console.log('partial overlap');
			overlappingEvents.push(eventitem);
		}

		//no overlaps, check for merges
		if (!eventitem.old && !eventEncompassed && (moment(start).format('YYYY-MM-DD HH:mm') == moment(eventitem.end).format('YYYY-MM-DD HH:mm')
		|| moment(end).format('YYYY-MM-DD HH:mm') == moment(eventitem.start).format('YYYY-MM-DD HH:mm'))){
			//console.log('merge');
			//if start time of new event (2nd slot) is end time of existing event (1st slot)
			//i.e. if new event is below any existing events
			if (moment(start).format('YYYY-MM-DD HH:mm') == moment(eventitem.end).format('YYYY-MM-DD HH:mm'))
			{
				mergingEvents.push(eventitem);
			}
			//if end time of new event (1st slot) is start time of existing event (2nd slot)
			//i.e. if new event is above any existing events
			else if (moment(end).format('YYYY-MM-DD HH:mm') == moment(eventitem.start).format('YYYY-MM-DD HH:mm'))
			{
				mergingEvents.push(eventitem);
			}
		}
	});

	// //there are mergable events, merge them!
	// if (mergingEvents.length){
	// 	if (mergingEvents.length == 2){
	// 		//if the first merge event is above second merge event
	// 		if (mergingEvents[0].start < mergingEvents[1].start){
	// 			start = mergingEvents[0].start;
	// 			end = mergingEvents[1].end;
	// 		}
	// 		else {
	// 			start = mergingEvents[1].start;
	// 			end = mergingEvents[0].end;
	// 		}
	// 		$('#calendar').fullCalendar('removeEvents', mergingEvents[1]._id);
	// 		$('#calendar').fullCalendar('removeEvents', mergingEvents[0]._id);
	// 	}
	// 	//only 1 merge
	// 	else if (mergingEvents.length == 1){
	// 		//if new event is below any existing events
	// 		if (moment(start).format('YYYY-MM-DD HH:mm') == moment(mergingEvents[0].end).format('YYYY-MM-DD HH:mm'))
	// 		{
	// 			start = mergingEvents[0].start;
	// 		}
	// 		//if new event is above any existing events
	// 		else if (moment(end).format('YYYY-MM-DD HH:mm') == moment(mergingEvents[0].start).format('YYYY-MM-DD HH:mm'))
	// 		{
	// 			end = mergingEvents[0].end;
	// 		}
	// 		$('#calendar').fullCalendar('removeEvents', mergingEvents[0]._id);
	// 	}
	// 	mergingEvents = [];
	// }

	//there are fully overlapping events
	if (fullyOverlappingEvents.length){
		for (var x = 0; x < fullyOverlappingEvents.length; x++){
			//if fully overlapped events are not mine, add them to an array to be removed later
			if (fullyOverlappingEvents[x].old){
				fullyOverlappingEvents[x].full = true;
				removeEvents.push(fullyOverlappingEvents[x]);
			}
			//if fully overlapped events are mine
			else {
				$('#calendar').fullCalendar('removeEvents', fullyOverlappingEvents[x]._id);
			}
		}
		fullyOverlappingEvents = [];
	}

	//there are some partially overlapping events
	if (overlappingEvents.length){
		for (var x = 0; x < overlappingEvents.length; x++){
			//existing event's bottom is overlapped
			if (overlappingEvents[x].end < end){
				//if partially overlapped events are not mine, add them to an array to be removed later
				if (overlappingEvents[x].old){
					overlappingEvents[x].full = false;
					overlappingEvents[x].bottom = true;
					removeEvents.push(overlappingEvents[x]);
				}
				else {
					start = overlappingEvents[x].start;
					$('#calendar').fullCalendar('removeEvents', overlappingEvents[x]._id, true);
				}
			}
			//existing event's top is overlapped
			else {
				if (overlappingEvents[x].old){
					overlappingEvents[x].full = false;
					overlappingEvents[x].bottom = false;
					removeEvents.push(overlappingEvents[x]);
				}
				else {
					end = overlappingEvents[x].end;
					$('#calendar').fullCalendar('removeEvents', overlappingEvents[x]._id, true);
				}
			}
		}
		overlappingEvents = [];
	}

	//checked for all cases, create the new event!
	if (!eventEncompassed && overlappingEvents.length == 0 && fullyOverlappingEvents.length == 0){
        if (listing_info.price_rate != 0){
            var event_title = moneyFormat.to(eventPrice({
                start: start,
                end: end
            }).price);
        }
        else {
            var event_title = "Free";
        }

		var eventData = {
			start: start,
			end: end,
			newevent: true,
			color: "#3CBC8D",
			title: event_title,
		};

		//make sure it doesnt overlap any existing events (not mine)
		if (checkIfNotOverlapped(eventData)){
			var newEvent = $('#calendar').fullCalendar('renderEvent', eventData, true);
		}

		if (removeEvents.length){

			//sort events so we can remove them properly
			removeEvents.sort(function(a, b){
				return b.start - a.start;
			});

			//if any slots need to removed because they overlap existing slots, remove them here
			for (var x = 0; x < removeEvents.length; x++){
				//remove the entire chunk of the full existing event from the newly created event
				if (removeEvents[x].full){
					//console.log('full existing removed');
					removeEventTimeSlot(newEvent[0], removeEvents[x], removeEvents[x]);
				}
				//remove only the partially overlapped portion
				else {
					//console.log('partial existing removed');
					if (removeEvents[x].bottom){
						removeEventTimeSlot(newEvent[0], {start: start}, removeEvents[x]);
					}
					else {
						removeEventTimeSlot(newEvent[0], removeEvents[x], {end: end});
					}
				}
			}
		}

		//remove highlight
		$("#calendar").fullCalendar('unselect');

		//store local events as cookie so we dont lose it
		storeCookies("local_events");

		//update the total price of current events
		updatePrices();

		//if there were any error messages
		if ($("#calendar-error-message").hasClass('is-danger')){
			$("#calendar-error-message").removeClass('is-danger').text("");
		}
	}
}

//----------------------------------------------------------------------------------------------------------------PRICE CALCULATION

=======
>>>>>>> development
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
<<<<<<< HEAD
            $("#calendar-card-content").find(".card-button-next").addClass('is-disabled');
=======
            $("#checkout-button").addClass('is-disabled');
>>>>>>> development
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
