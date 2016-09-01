var totalPrice = 0;

$(document).ready(function() {
	var timeNow = new Date();

	//calendar logic
	 $('#calendar').fullCalendar({
		scrollTime: moment(timeNow).format("hh:mm:ss"),
		defaultView: "agendaWeek",
		allDayDefault: false,
		selectable: true,
		timezone: "local",
		editable: false, //prevents editing of events
		eventOverlap: false, //prevents overlap of events
		eventStartEditable: false, //prevents moving of events
		nowIndicator: true, //red line indicating current time

		//prevent calendar from going back in past
		viewRender: function(currentView){
			var minDate = moment();

			if (minDate >= currentView.start && minDate <= currentView.end) {
				$(".fc-prev-button").prop('disabled', true);
				$(".fc-prev-button").addClass('fc-state-disabled');

				//todo - add class to custom buttons to "grey out"
			}
			else {
				$(".fc-prev-button").removeClass('fc-state-disabled');
				$(".fc-prev-button").prop('disabled', false);
			}
		},

		//creating new events
		select: function(start, end, jsEvent, view){
			start = moment(start.format());
			end = moment(end.format());
			now = new moment();

			//prevent calendar from creating events in the past
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
		}
    });

	//calendar styling
	$(".fc-button").hide();
	$(".button").click(function(e){
		id = $(this).attr("id");
		$(".fc-" + id).click();
	});
	$(".fc-toolbar").prependTo("#calendar_left_wrapper");
	$('#calendar').fullCalendar('option', 'height', $("#calendar_wrapper").height() - $("#calendar_top_wrapper").height() - $("#navbar").height());

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

	$("#month_button").click(function(e){
		var view = $('#calendar').fullCalendar('getView');

		if (view.name == "agendaWeek"){
			$("#calendar").fullCalendar( 'changeView', "month");
			$(this).text("Week");
		}
		else {
			$("#calendar").fullCalendar( 'changeView', "agendaWeek");
			$(this).text("Month");
		}
	})
});

//helper function to create pre-existing rentals
function createExisting(rentals){
	for (var x = 0; x < rentals.length; x++){
		var start = new Date(rentals[x].date + " UTC");
		var end = new Date(start.getTime() + rentals[x].duration);
		var eventData = {
			start: start,
			end: end,
			old: true,
			rental_id: rentals[x].rental_id,
			account_id: rentals[x].account_id
		};

		//came from editing an existing rental, color that one orange
		if (rentals[x].rental_id == rental_info.rental_id){
			eventData.title = "Original time";
			eventData.color = "orange";
			eventData.editing = true;
		}
		else if (user.id == rentals[x].account_id){
			eventData.title = user.fullname || "Guest";
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
	mouseDownCalEvent = $("#calendar").fullCalendar('clientEvents', $(this).attr("id"))[0];
	if (!mouseDownCalEvent.old){
		mouseDownJsEvent = e;
	}
});

$(document).on("mouseup", ".fc-event", function(mouseUpJsEvent){
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
	else if (mouseUpCalEvent.account_id == user.id){
		delete_cookies();

		//click an editing event to stop editing it
		if (mouseUpCalEvent.editing){
			rental_info = false;
			editingRental();
			eventEdit(mouseUpCalEvent.rental_id, "Add more time?", "#73c8e3", false);
			$("#calendar").fullCalendar('removeEvents', filterNew); //remove all new events
		}
		//click an existing event to edit it
		else {
			rental_info = {
				rental_id: mouseUpCalEvent.rental_id
			}
			editingRental();
			$("#calendar").fullCalendar('removeEvents', filterNew); //remove all new events
		}
		//window.location = window.location.href + "/" + same_id; //todo
	}
	storeCookies("local_events");
	eventPrices();
});

//helper function to toggle edit mode
function editingRental(){
	storeCookies("rental_info");
	if (rental_info){
		eventEdit(rental_info.rental_id, "Editing", "orange", true);
		$("#message").text("Currently editing existing rental!");
	}
	else {
		$("#message").text("Welcome!");
	}
}

//to show edit confirmation for existing rentals on hover. highlights the rentals that are grouped together
var mousein = false;

$(document).on("mouseenter", ".fc-event", function(e){
	mouseEvent = $("#calendar").fullCalendar('clientEvents', $(this).attr("id"))[0];

	if (!mouseEvent.other && !mouseEvent.editing && user && mouseEvent.account_id == user.id && !mousein){
		eventEdit(mouseEvent.rental_id, "Add more time?");
		mousein = true;
		$(this).css("cursor:pointer");
	}
});

$(document).on("mouseleave", ".fc-event", function(e){
	mouseEvent = $("#calendar").fullCalendar('clientEvents', $(this).attr("id"))[0];

	if (!mouseEvent.other && !mouseEvent.editing && user && mouseEvent.account_id == user.id){
		var title = user.fullname || "Guest";
		eventEdit(mouseEvent.rental_id, title);
		mousein = false;
	}
});

//helper function to enable editing of time
function eventEdit(same_id, title, color, editing){
	sameEvents = $("#calendar").fullCalendar('clientEvents', function(e){
		return filterSame(e, same_id);
	});

	for (var x = 0; x < sameEvents.length; x++){
		sameEvents[x].editing = editing;
		sameEvents[x].title = title;
		sameEvents[x].color = color || sameEvents[x].color;
		$('#calendar').fullCalendar('updateEvent', sameEvents[x]);
	}
}

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
	var removeEnd = moment(removeStart).add(30, "minutes");

	return {
		start: removeStart,
		end: removeEnd
	}
}

//helper function to remove time slots from an event
function removeEventTimeSlot(calEvent, mouseDownSlot, mouseUpSlot){
	var calEvent_start = moment(calEvent.start).format('YYYY-MM-DD HH:mm');
	var calEvent_end = moment(calEvent.end).format('YYYY-MM-DD HH:mm');

	var mouseDown_start = moment(mouseDownSlot.start).format('YYYY-MM-DD HH:mm');

	var mouseUp_end = moment(mouseUpSlot.end).format('YYYY-MM-DD HH:mm');

	//event is equal to slot
	if (calEvent_start == mouseDown_start
		&& calEvent_end == mouseUp_end){
			$('#calendar').fullCalendar('removeEvents', calEvent._id);
			$('#calendar').fullCalendar('updateEvent', calEvent);
			//console.log('event equal to slot');
	}
	//if clipping starts at top of event
	else if (calEvent_start == mouseDown_start){
		calEvent.start = mouseUpSlot.end;
		$('#calendar').fullCalendar('updateEvent', calEvent);
		//console.log('clipping at top');
	}
	//if clipping starts at middle of event and goes all the way
	else if (calEvent_end == mouseUp_end){
		calEvent.end = mouseDownSlot.start;
		$('#calendar').fullCalendar('updateEvent', calEvent);
		//console.log('clipping at bottom');
	}
	//if middle of event
	else {
		//console.log('middle of event');
		var tempEnd = calEvent.end;
		calEvent.end = mouseDownSlot.start;
		$('#calendar').fullCalendar('updateEvent', calEvent);
		//overlaps something, cancel creation
		if (!checkEventOverlap(mouseUpSlot.end, tempEnd)){
			var eventData = {
				title: calEvent.title,
				start: mouseUpSlot.end,
				end: tempEnd,
				color: calEvent.color,
				newevent: true
			};
			console.log(calEvent);
			var newEvent = $('#calendar').fullCalendar('renderEvent', eventData, true);
		}
		else {
			calEvent.end = tempEnd;
		}
	}
}

//helper function to check if new event overlaps any existing event
function checkEventOverlap(start, end){
	var allevents = $('#calendar').fullCalendar('clientEvents');
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

//helper function to check if date X overlaps any part with date Y
function checkOverlap(dateX, durationX, dateY, durationY){
	return (dateX.getTime() < dateY.getTime() + durationY) && (dateY.getTime() < dateX.getTime() + durationX);
}

//helper function to check if date X is fully covered by date Y
function checkFullOverlap(dateX, durationX, dateY, durationY){
	return (dateY.getTime() <= dateX.getTime()) && (dateX.getTime() + durationX <= dateY.getTime() + durationY);
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
		//console.log('n');
		var eventData = {
			start: start,
			end: end,
			newevent: true
		};

		//orange if adding more time
		eventData.color = (parseFloat(rental_info.rental_id) === rental_info.rental_id >>> 0) ? "orange" : "#3CBC8D";
		eventData.title = (parseFloat(rental_info.rental_id) === rental_info.rental_id >>> 0) ? "Added time" : "New rental";

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

		//store local events as cookie so we dont lose it
		storeCookies("local_events");

		//update the total price of current events
		eventPrices();
	}
}

//server side helper function to get correct price of events
function eventPrices(){
	if (listing_info.price_type){
		var myevents = $('#calendar').fullCalendar('clientEvents', filterMine);
		if (myevents.length){
			$("#calendar_next").addClass("is-primary");
			$("#calendar_next").data("can_next", true);
			$("#remove_events").addClass("activeButton");
		}
		else {
			$("#calendar_next").removeClass("is-primary");
			$("#calendar_next").data("can_next", false);
			$("#remove_events").removeClass("activeButton");
		}
		var weeks_price = days_price = hours_price = half_hours_price = 0;

		for (var x = 0; x < myevents.length; x++){
			var tempDuration = myevents[x].end - myevents[x].start;

			var weeks = divided(tempDuration, 604800000);
			tempDuration = (weeks > 0) ? tempDuration -= weeks*604800000 : tempDuration;

			var days = divided(tempDuration, 86400000);
			tempDuration = (days > 0) ? tempDuration -= days*86400000 : tempDuration;

			var hours = divided(tempDuration, 3600000);
			tempDuration = (hours > 0) ? tempDuration -= hours*3600000 : tempDuration;

			var half_hours = divided(tempDuration, 1800000);
			tempDuration = (half_hours > 0) ? tempDuration -= half_hours*1800000 : tempDuration;

			weeks_price += weeks * listing_info.week_price;
			days_price += days * listing_info.day_price;
			hours_price += hours * listing_info.hour_price;
			half_hours_price += half_hours * listing_info.hour_price;
		}

		totalPrice = weeks_price + days_price + hours_price + half_hours_price;

		//animation for counting numbers
		$("#price").prop('Counter', $("#price").prop('Counter')).stop().animate({
			Counter: totalPrice
		}, {
			duration: 100,
			easing: 'swing',
			step: function (now) {
				$(this).text("$" + Math.floor(now));
			}
		});
	}
}

//helper function to divide number
function divided(num, den){
    return Math[num > 0 ? 'floor' : 'ceil'](num / den);
}

//helper function to filter out events that aren't mine
function filterMine(event) {
    return !event.hasOwnProperty("old");
}

//helper function to filter out existing rental for editing
function filterSame(event, id){
	return event.rental_id == id;
}

//helper function to find all newly added time
function filterNew(event){
	return event.newevent;
}
