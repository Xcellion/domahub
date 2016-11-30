var moneyFormat = wNumb({
	thousand: ',',
	prefix: '$',
	postfix: " USD",
	decimals: 2
});

$(document).ready(function() {
	var alldayMouseDown, alldayMouseUp;
	
	//calendar logic
	 $('#calendar').fullCalendar({
		scrollTime: moment(new Date()).format("hh:mm:ss"),
		defaultView: "agendaWeek",
		allDayDefault: false,
		allDaySlot: false,
		selectable: true,
		timezone: "local",
		editable: false, //prevents editing of events
		eventOverlap: false, //prevents overlap of events
		eventStartEditable: false, //prevents moving of events
		nowIndicator: true, //red line indicating current time
		slotDuration: '01:00:00', //how long a slot is,
		height: "parent",
		contentHeight: 650, //auto height

		//formatting for labels
		titleFormat: {
		   month: 'YYYY MMMM',
		   week: "MMM DD YYYY"
	   	},
		timeFormat: 'hA',
		axisFormat: 'hA',

		// header buttons
		header: {left:'prev', center:'next', right:'title, today'},

		// background event to show that you cant select past dates
		events: [
			{
				start: '1970-01-01T00:00:00',
				end: moment().format("YYYY-MM-DD"),
				rendering: 'background'
			},
			{
				start: '1970-01-01T00:00:00',
				end: moment().format("YYYY-MM-DD"),
				rendering: 'background',
				title: "You cannot select dates in the past!",
				allDay: true
			},
			{
				start: moment().format("YYYY-MM-DD"),
				end: moment(),
				rendering: 'background',
				title: "You cannot select dates in the past!"
			},
		],

		//prevent selecting anything before now
		selectConstraint: {
			start: moment(new Date().getTime()),
			end: moment(new Date().getTime() + 31556952000)
		},

		//prevent calendar from going back in past
		viewRender: function(currentView){
			var minDate = moment();

			if (minDate >= currentView.start && minDate <= currentView.end) {
				$(".fc-prev-button").prop('disabled', true);
				$(".fc-prev-button").addClass('fc-state-disabled');
			}
			else {
				$(".fc-prev-button").removeClass('fc-state-disabled');
				$(".fc-prev-button").prop('disabled', false);
			}

			//make it unselectable to prevent highlighting annoyance
			$(".fc-day-header").addClass('is-unselectable');

			//create all day events
			$(".fc-day-header").mousedown(function(){
				alldayMouseDown = moment($(this).data('date'));
				$(this).addClass('is-active');
			});
			$(".fc-day-header").mouseup(function(){
				alldayMouseUp = moment($(this).data('date'));

				//if true, you're dragging left
				var start = (alldayMouseUp < alldayMouseDown) ? alldayMouseUp : alldayMouseDown;
				var end = (alldayMouseUp < alldayMouseDown) ? moment(alldayMouseDown._d.getTime() + 86400000) : moment(alldayMouseUp._d.getTime() + 86400000);

				var now = new moment();
				//prevent calendar from creating events in the past (except for current hour slot)
				if (start < now - 1800000){
					$('#calendar').fullCalendar('unselect');
					return false;
				}
				else {
					createEvent(start, end);
				}
			});

			//highlight when dragging
			$(".fc-day-header").mouseenter(function(e){
				if (e.which == 1){
					$(this).addClass('is-active');
				}
			});
			$(document).mouseup(function(e){
				$(".fc-day-header").removeClass('is-active');
			});
		},

		//creating new events
		select: function(start, end, jsEvent, view){
			var start = moment(start.format());
			var end = moment(end.format());
			var now = moment().add(1, 'hour').startOf('hour');

			//prevent calendar from creating events in the past (except for current hour slot)
			if (start < now){
				$('#calendar').fullCalendar('unselect');
				return false;
			}
			else {
				createEvent(start, end);
			}
		},

		//tag id to HTML DOM for easy access
		eventAfterRender: function(event, element, view ) {
			$(element).attr("id", event._id);
			if (view.name == "agendaWeek"){
				$(element).css("width", "100%");
				$(element).find(".fc-content").css({
					left: "50%",
					top: "50%",
					position: "absolute",
					transform: "translate(-50%, -50%)",
					"margin-right": "-50%"
				});

				//remove event title repeat
				if (!$(element).hasClass('fc-start')){
					$(element).find('.fc-content').text("");
				}
			}

		}
    });

	//create existing rentals
	if (listing_info.rentals){
		createExisting(listing_info.rentals);
	}

	$("#events").click(function(e){
		$('#calendar').fullCalendar('removeEvents', filterMine);
		storeCookies("local_events");
		eventPrices();
	});

	$("#remove_events").click(function(e){
		$('#calendar').fullCalendar('removeEvents', filterMine);
		storeCookies("local_events");
		eventPrices();
	});
});

//helper function to create pre-existing rentals
function createExisting(rentals){
	for (var x = 0; x < rentals.length; x++){
		var start = new Date(rentals[x].date);
		var end = new Date(start.getTime() + rentals[x].duration);
		var eventData = {
			start: start,
			end: end,
			old: true,
			rental_id: rentals[x].rental_id,
			account_id: rentals[x].account_id
		};

		if (user.id == rentals[x].account_id){
			eventData.title = user.username || "Guest";
			eventData.color = "#73c8e3";
		}
		else {
			eventData.title = "Rented!";
			eventData.color = "#DB7093";
			eventData.other = true;
		}
		$('#calendar').fullCalendar('renderEvent', eventData, true);
	}
}

//--------------------------------------------------------------------------------------------------------------------------------

var mouseDownJsEvent;
var mouseDownCalEvent;

$(document).on("mousedown", ".fc-event", function(e){
	//only left click
	if (e.which == 1){
		mouseDownCalEvent = $("#calendar").fullCalendar('clientEvents', $(this).attr("id"))[0];
		if (!mouseDownCalEvent.old){
			mouseDownJsEvent = e;
		}
	}
});

$(document).on("mouseup", ".fc-event", function(mouseUpJsEvent){
	//only left click
	if (mouseUpJsEvent.which == 1){
		var view = $('#calendar').fullCalendar('getView');

		if (view.type != "month"){
			var mouseUpCalEvent = $("#calendar").fullCalendar('clientEvents', $(this).attr("id"))[0];
			if (!mouseUpCalEvent.old){
				var datetime;
				//if mousedown exists and the mousedown event is the same as the mouseup event
				if (mouseDownJsEvent && mouseDownCalEvent._id == mouseUpCalEvent._id){
					//get the time slots of both mousedown and mouseup
					var mouseDownSlot = getTimeSlot(mouseUpCalEvent, mouseDownJsEvent);
					var mouseUpSlot = getTimeSlot(mouseUpCalEvent, mouseUpJsEvent);

					var mouseDown_start = moment(mouseDownSlot.start).format('YYYY-MM-DD HH:mm');
					var mouseUp_start = moment(mouseUpSlot.start).format('YYYY-MM-DD HH:mm');

					//moved down or stayed the same
					if (mouseDown_start <= mouseUp_start){
						//remove the time slots in between mousedown and mouseup from the event
						removeEventTimeSlot(mouseUpCalEvent, mouseDownSlot, mouseUpSlot);
					}
					//moved up
					else {
						//same function, but reversed the mousedown and mouseup, genius
						removeEventTimeSlot(mouseUpCalEvent, mouseUpSlot, mouseDownSlot);
					}
				}
				mouseDownCalEvent = {};
				mouseDownJsEvent = {};
			}
			storeCookies("local_events");
			eventPrices();
		}
	}
});

//helper function to determine the time slot of a mouse event
function getTimeSlot(calEvent, jsEvent){
	var datetime = "";
	var rows = $(jsEvent.delegateTarget).find("[data-time]");
	var days = $(jsEvent.delegateTarget).find("[data-date]");

	//find the day of the clicked on event
	for (var y = 0; y < days.length; y++){
		if (jsEvent.pageX >= $(days[y]).offset().left && jsEvent.pageX <= $(days[y]).offset().left + $(days[y]).width()){
			datetime += $(days[y]).data("date");
			break;
		}
	}
	datetime+= " ";
	for (var x = 0; x < rows.length; x++){
		if (jsEvent.pageY >= Math.round($(rows[x]).offset().top) && (jsEvent.pageY == Math.round($(rows[x]).offset().top) + $(rows[x]).height() || jsEvent.pageY == Math.round($(rows[x]).offset().top) + $(rows[x]).height() - 1)){
			//bullshit bug in fullcalendar
			tempDate = datetime + $(rows[x]).data("time");
			if (moment(calEvent.start._d).format('YYYY-MM-DD HH:mm') <= moment(tempDate).format('YYYY-MM-DD HH:mm')){
				datetime += $(rows[x]).data("time");
				break;
			}
			else {
				datetime += $(rows[x+1]).data("time");
				break;
			}
		}
		else if (jsEvent.pageY >= Math.round($(rows[x]).offset().top) && jsEvent.pageY <= Math.round($(rows[x]).offset().top) + $(rows[x]).height()){
			datetime += $(rows[x]).data("time");
			break;
		}
	}
	var removeStart = new Date(datetime);
	var removeEnd = moment(removeStart).add(1, "hour");

	return {
		start: removeStart,
		end: removeEnd
	}
}

//helper function to remove time slots from an event
function removeEventTimeSlot(calEvent, mouseDownSlot, mouseUpSlot){
	var calEvent_start = moment(calEvent.start)._d.getTime();
	var calEvent_end = moment(calEvent.end)._d.getTime();

	var mouseDown_start = moment(mouseDownSlot.start)._d.getTime();
	var mouseUp_end = moment(mouseUpSlot.end)._d.getTime();

	//event is equal to slot
	if (calEvent_start >= mouseDown_start
		&& calEvent_end <= mouseUp_end){
			$('#calendar').fullCalendar('removeEvents', calEvent._id);
			$('#calendar').fullCalendar('updateEvent', calEvent);
			console.log('event equal to slot');
	}
	//if clipping starts at top of event
	else if (calEvent_start == mouseDown_start){
		calEvent.start = mouseUpSlot.end;
		calEvent.title = moneyFormat.to(eventPrice({
			start: calEvent.start,
			end: calEvent.end
		}).totalPrice);
		$('#calendar').fullCalendar('updateEvent', calEvent);
		console.log('clipping at top');
	}
	//if clipping starts at middle of event and goes all the way
	else if (calEvent_end == mouseUp_end){
		calEvent.end = mouseDownSlot.start;
		calEvent.title = moneyFormat.to(eventPrice({
			start: calEvent.start,
			end: calEvent.end
		}).totalPrice);
		$('#calendar').fullCalendar('updateEvent', calEvent);
		console.log('clipping at bottom');
	}
	//if middle of event, split event into two
	else {
		console.log('middle of event');

		//update existing
		var tempEnd = calEvent.end;
		calEvent.end = mouseDownSlot.start;
		calEvent.title = moneyFormat.to(eventPrice({
			start: calEvent.start,
			end: calEvent.end
		}).totalPrice);
		$('#calendar').fullCalendar('updateEvent', calEvent);

		//update splitting off
		if (!checkEventOverlap(mouseUpSlot.end, tempEnd)){
			var eventData = {
				title: moneyFormat.to(eventPrice({
					start: mouseUpSlot.end,
					end: tempEnd
				}).totalPrice),
				start: mouseUpSlot.end,
				end: tempEnd,
				color: calEvent.color,
				newevent: true
			};
			var newEvent = $('#calendar').fullCalendar('renderEvent', eventData, true);
		}
		else {
			calEvent.end = tempEnd;
		}
	}
}

//helper function to check if new event overlaps any existing event
function checkEventOverlap(start, end){
	var allevents = $('#calendar').fullCalendar('clientEvents', filterMine);
	var overlap = false;
	$.each(allevents, function( index, eventitem ){
		//overlaps something, cancel creation
		if (checkOverlap(start._d, end - start, eventitem.start._d, eventitem.end - eventitem.start)){
			overlap = true;
			return false;
		}
	});
	return overlap;
}

//helper function to merge events
function createEvent(start, end){
	var allevents = $('#calendar').fullCalendar('clientEvents');
	var mergingEvents = [];
	var overlappingEvents = [];
	var fullyOverlappingEvents = [];
	var removeEvents = [];
	var eventEncompassed = false;
	//check for overlapping events or mergeable events
	$.each(allevents, function( index, eventitem )
	{
		if (eventitem !== null && typeof eventitem != 'undefined')
		{
			//event being created is fully overlapped by existing event, so dont create anything new
			if (checkFullOverlap(start._d, end - start, eventitem.start._d, eventitem.end - eventitem.start) && !eventitem.old){
				console.log('new event is not needed');
				eventEncompassed = true;
				//check if new event is in multiples of days (i.e. pressed the all-day button)
				if ((start - end) % 86400000 === 0){
					removeEventTimeSlot(eventitem, {start: start, end: end}, {start: start, end: end});
				}
				eventPrices();
			}
			//check if existing event is fully overlapped by event being created
			else if (checkFullOverlap(eventitem.start._d, eventitem.end - eventitem.start, start._d, end - start)){
				console.log('full overlap');
				fullyOverlappingEvents.push(eventitem);
			}
			//overlaps something, just not completely
			else if (checkOverlap(start._d, end - start, eventitem.start._d, eventitem.end - eventitem.start)){
				console.log('partial overlap');
				overlappingEvents.push(eventitem);
			}

			//no overlaps, check for merges
			if (!eventitem.old && !eventEncompassed && (moment(start).format('YYYY-MM-DD HH:mm') == moment(eventitem.end).format('YYYY-MM-DD HH:mm')
				|| moment(end).format('YYYY-MM-DD HH:mm') == moment(eventitem.start).format('YYYY-MM-DD HH:mm'))){
				console.log('merge');
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
		}
	});

	//there are mergable events, merge them!
	if (mergingEvents.length){
		if (mergingEvents.length == 2){
			//if the first merge event is above second merge event
			if (mergingEvents[0].start < mergingEvents[1].start){
				start = mergingEvents[0].start;
				end = mergingEvents[1].end;
			}
			else {
				start = mergingEvents[1].start;
				end = mergingEvents[0].end;
			}
			$('#calendar').fullCalendar('removeEvents', mergingEvents[1]._id);
			$('#calendar').fullCalendar('removeEvents', mergingEvents[0]._id);
		}
		//only 1 merge
		else if (mergingEvents.length == 1){
			//if new event is below any existing events
			if (moment(start).format('YYYY-MM-DD HH:mm') == moment(mergingEvents[0].end).format('YYYY-MM-DD HH:mm'))
			{
				start = mergingEvents[0].start;
			}
			//if new event is above any existing events
			else if (moment(end).format('YYYY-MM-DD HH:mm') == moment(mergingEvents[0].start).format('YYYY-MM-DD HH:mm'))
			{
				end = mergingEvents[0].end;
			}
			$('#calendar').fullCalendar('removeEvents', mergingEvents[0]._id);
		}
		mergingEvents = [];
	}

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
	if (!eventEncompassed && mergingEvents.length == 0 && overlappingEvents.length == 0 && fullyOverlappingEvents.length == 0){
		//console.log('new event');
		var eventData = {
			start: start,
			end: end,
			newevent: true,
			color: "#3CBC8D",
			title: moneyFormat.to(eventPrice({
				start: start,
				end: end
			}).totalPrice),
		};

		var newEvent = $('#calendar').fullCalendar('renderEvent', eventData, true);

		if (removeEvents.length){

			//sort events so we can remove them properly
			removeEvents.sort(function(a, b){
				return b.start - a.start;
			});

			//if any slots need to removed because they overlap existing slots, remove them here
			for (var x = 0; x < removeEvents.length; x++){
				//remove the entire chunk of the full existing event from the newly created event
				if (removeEvents[x].full){
					console.log('full existing removed');
					removeEventTimeSlot(newEvent[0], removeEvents[x], removeEvents[x]);
				}
				//remove only the partially overlapped portion
				else {
					console.log('partial existing removed');
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
		eventPrices();
	}
}

//server side helper function to get correct price of events
function eventPrices(){
	if (listing_info.status){
		var myevents = $('#calendar').fullCalendar('clientEvents', filterMine);
		if (myevents.length){
			$("#redirect-next-button").removeClass('is-disabled');
		}
		else {
			$("#redirect-next-button").addClass('is-disabled');
		}

		//empty the preview dates
		$(".preview-dates").remove();

		//calculate the price
		var totalPrice = 0;
		var total_months = total_weeks = total_days = total_hours = 0;
		for (var x = 0; x < myevents.length; x++){
			var calculated_prices = eventPrice(myevents[x]);

			totalPrice += calculated_prices.totalPrice;
			total_months += calculated_prices.count_per_rate.total_months;
			total_weeks += calculated_prices.count_per_rate.total_weeks;
			total_days += calculated_prices.count_per_rate.total_days;
			total_hours += calculated_prices.count_per_rate.total_hours;

			//add to preview modal
			var start_date = $("<p class='preview-dates'>" + moment(myevents[x].start).format("YYYY-MM-DD hh:mmA") + "</p>");
			var end_date = $("<p class='preview-dates'>" + moment(myevents[x].end).format("YYYY-MM-DD hh:mmA") + "</p>");

			$("#preview-start-dates").append(start_date);
			$("#preview-end-dates").append(end_date);
		}

		var appendPreviewRates = function(total_units, type, price_rate){
			if (total_units > 0){
				var s_or_not = (total_units == 1) ? "" : "s";
				$("#preview-rates").append($("<p>$" + price_rate + " x " + total_units + " " + type + s_or_not + "</p>"));
			}
		}

		//update the preview and calendar price HTML
		$("#preview-rates").empty();
		appendPreviewRates(total_months, "Month", listing_info.month_price);
		appendPreviewRates(total_weeks, "Week", listing_info.week_price);
		appendPreviewRates(total_days, "Day", listing_info.day_price);
		appendPreviewRates(total_hours, "Hour", listing_info.hour_price);
		$("#price-total").text(moneyFormat.to(totalPrice));

		//animation for counting numbers
		$("#price").prop('Counter', $("#price").prop('Counter')).stop().animate({
			Counter: totalPrice
		}, {
			duration: 100,
			easing: 'swing',
			step: function (now) {
				$(this).text("$" +  + Math.floor(now));
			}
		});
	}
}

//figure out a price for a specific event
function eventPrice(event, callback){
	var tempDuration = event.end - event.start;

	//subtract any whole months
	var months = divided(tempDuration, 2419200000);
	tempDuration = (months > 0) ? tempDuration -= months*2419200000 : tempDuration;

	//subtract any whole weeks
	var weeks = divided(tempDuration, 604800000);
	tempDuration = (weeks > 0) ? tempDuration -= weeks*604800000 : tempDuration;

	//subtract any whole days
	var days = divided(tempDuration, 86400000);
	tempDuration = (days > 0) ? tempDuration -= days*86400000 : tempDuration;

	//remaining all hours
	var hours = divided(tempDuration, 3600000);
	tempDuration = (hours > 0) ? tempDuration -= hours*3600000 : tempDuration;

	//calculate price
	months_price = months * listing_info.month_price;
	weeks_price = weeks * listing_info.week_price;
	days_price = days * listing_info.day_price;
	hours_price = hours * listing_info.hour_price;

	//how many of each rate type are there
	var count_per_rate = {
		total_months : months,
		total_weeks : weeks,
		total_days : days,
		total_hours : hours,
	}

	return {
		totalPrice : months_price + weeks_price + days_price + hours_price,
		count_per_rate : count_per_rate
	}
}

//helper function to divide number
function divided(num, den){
    return Math[num > 0 ? 'floor' : 'ceil'](num / den);
}
