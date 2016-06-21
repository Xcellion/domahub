//calendar logic

$(document).ready(function() {
	 $('#calendar').fullCalendar({
		defaultView: "agendaWeek",
		allDayDefault: false,
		selectable: true,
		timezone: "local",
		editable: false, //prevents editing of events
		eventOverlap: false, //prevents overlap of events
		eventStartEditable: false, //prevents moving of events
		
		//creating new events
		select: function(start, end, jsEvent, view){
			start = moment(start.format());
			end = moment(end.format());
			createEvent(start, end);
			$('#calendar').fullCalendar('unselect');
		},
		
		//tag id to HTML DOM for easy access
		eventAfterRender: function(event, element, view ) { 
			$(element).attr("id", event._id);
		}
    })
	
	//create pre-existing rentals
	for (var x = 0; x < info.rentals.length; x++){
		var start = new Date(info.rentals[0].date + " UTC");
		var eventData = {
			title: info.rentals[x].account_id,
			start: start,
			end: new Date(start.getTime() + 86400000),
			color: "red",
			other: true
		};
		$('#calendar').fullCalendar('renderEvent', eventData, true);
	}
	
	$("#listing_form").submit(function(e){
		e.preventDefault();
		submitRentals();
	});
});

//function to submit new rental info
function submitRentals(){
	var allevents = $('#calendar').fullCalendar('clientEvents');
	minEvents = [];
	for (var x = 0; x < allevents.length; x++){
		if (!allevents[x].other){
			minEvents.push({
				start: allevents[x].start._d,
				end: allevents[x].end._d,
				_id: allevents[x]._id
			});
		}
	}
	
	//client side check if authenticated
	if (user){
		$.ajax({
			type: "POST",
			url: "/listing/" + info.id + "/rent",
			data: {events: minEvents, type: $("input[type='radio'][name='type']:checked").val()}
		}).done(function(data){
			console.log(data);
		});
	}
	else {
		console.log('log in pls');
	}
}

var mouseDownJsEvent;
var mouseDownCalEvent;

$(document).on("mousedown", ".fc-event", function(e){
	mouseDownCalEvent = $("#calendar").fullCalendar('clientEvents', $(this).attr("id"))[0];
	if (!mouseDownCalEvent.other){
		mouseDownJsEvent = e;
	}
});

$(document).on("mouseup", ".fc-event", function(mouseUpJsEvent){
	var mouseUpCalEvent = $("#calendar").fullCalendar('clientEvents', $(this).attr("id"))[0];
	if (!mouseUpCalEvent.other){
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
			//console.log('event equal to slot');
	}
	//if clipping starts at top of event
	else if (calEvent_start == mouseDown_start){
		calEvent.start = mouseUpSlot.end;
		//console.log('clipping at top');
	}
	//if clipping starts at middle of event and goes all the way
	else if (calEvent_end == mouseUp_end){
		calEvent.end = mouseDownSlot.start;
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
				end: tempEnd
			};
			$('#calendar').fullCalendar('renderEvent', eventData, true);
		}
		else {
			calEvent.end = tempEnd;
		}
	}
	$('#calendar').fullCalendar('updateEvent', calEvent);
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
			if (checkFullOverlap(start._d, end - start, eventitem.start._d, eventitem.end - eventitem.start)){
				//console.log('new event is not needed');
				eventEncompassed = true;
				//check if new event is in multiples of days (i.e. pressed the all-day button)
				if ((start - end) % 86400000 === 0){
					removeEventTimeSlot(eventitem, {start: start, end: end}, {start: start, end: end});
				}
			}
			//check if existing event is fully overlapped by event being created
			else if (checkFullOverlap(eventitem.start._d, eventitem.end - eventitem.start, start._d, end - start)){
				//console.log('full overlap');
				fullyOverlappingEvents.push(eventitem);
			}
			//overlaps something, just not completely
			else if (checkOverlap(start._d, end - start, eventitem.start._d, eventitem.end - eventitem.start)){
				//console.log('partial overlap');
				overlappingEvents.push(eventitem);
			}
			
			//no overlaps, check for merges
			if (!eventitem.other && !eventEncompassed && (moment(start).format('YYYY-MM-DD HH:mm') == moment(eventitem.end).format('YYYY-MM-DD HH:mm')
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
			if (fullyOverlappingEvents[x].other){
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
				if (overlappingEvents[x].other){
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
				if (overlappingEvents[x].other){
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
		title = user.fullname || "Guest";
		var eventData = {
			title: title,
			start: start,
			end: end
		};
		var newEvent = $('#calendar').fullCalendar('renderEvent', eventData, true);

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
}