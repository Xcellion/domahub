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
			createEvent(start, end);
			$('#calendar').fullCalendar('unselect');
		},
		
		//tag id to HTML DOM for easy access
		eventAfterRender: function(event, element, view ) { 
			$(element).attr("id", event._id);
		}
    })
});

var mouseDownJsEvent;
var mouseDownCalEvent;

$(document).on("mousedown", ".fc-event", function(e){
	mouseDownCalEvent = $("#calendar").fullCalendar('clientEvents', $(this).attr("id"))[0];
	mouseDownJsEvent = e;
});

$(document).on("mouseup", ".fc-event", function(mouseUpJsEvent){
	var mouseUpCalEvent = $("#calendar").fullCalendar('clientEvents', $(this).attr("id"))[0];
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
	var mouseDown_end = moment(mouseDownSlot.end).format('YYYY-MM-DD HH:mm');
	
	var mouseUp_start = moment(mouseUpSlot.start).format('YYYY-MM-DD HH:mm');
	var mouseUp_end = moment(mouseUpSlot.end).format('YYYY-MM-DD HH:mm');

	//event is equal to slot
	if (calEvent_start == mouseDown_start 
		&& calEvent_end == mouseUp_end){
			$('#calendar').fullCalendar('removeEvents', calEvent._id);
	}
	//if clipping starts at top of event
	else if (calEvent_start == mouseDown_start){
		calEvent.start = mouseUpSlot.end;
	}
	//if clipping starts at middle of event and goes all the way
	else if (calEvent_end == mouseUp_end){
		calEvent.end = mouseDownSlot.start;
	}
	//if middle of event
	else {
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
	
	//check for overlapping events or mergeable events
	$.each(allevents, function( index, eventitem )
	{
		if (eventitem !== null && typeof eventitem != 'undefined')
		{
			//check if existing event is fully overlapped by event being created
			if (checkFullOverlap(eventitem.start._d, eventitem.end - eventitem.start, start._d, end - start)){
				fullyOverlappingEvents.push(eventitem);
				console.log('f');
			}
			//overlaps something, just not completely
			else if (checkOverlap(start._d, end - start, eventitem.start._d, eventitem.end - eventitem.start)){
				overlappingEvents.push(eventitem);
				console.log('p');
			}
			
			//no overlaps, check for merges
			if (moment(start).format('YYYY-MM-DD HH:mm') == moment(eventitem.end).format('YYYY-MM-DD HH:mm')
				|| moment(end).format('YYYY-MM-DD HH:mm') == moment(eventitem.start).format('YYYY-MM-DD HH:mm')){
				console.log('m');
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
		//TO-DO if overlapping events are mine

		if (mergingEvents.length == 2){
			//if the first merge event is above second merge event
			if (mergingEvents[0].start < mergingEvents[1].start){
				start = mergingEvents[0].start;
				end = mergingEvents[1].end;

			}
			else {
				mergingEvents[1].start = mergingEvents[0].start;
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
		
		//TO-DO else it belongs to someone else, create events around it
	}
	
	//there are fully overlapping events
	if (fullyOverlappingEvents.length){
		//TO-DO if overlapping events are mine
		for (var x = 0; x < fullyOverlappingEvents.length; x++){
			$('#calendar').fullCalendar('removeEvents', fullyOverlappingEvents[x]._id);
			
		}
		fullyOverlappingEvents = [];
		
		//TO-DO else it belongs to someone else, create events around it
	}
	
	//there are some partially overlapping events
	if (overlappingEvents.length){

		//TO-DO if overlapping events are mine
		for (var x = 0; x < overlappingEvents.length; x++){
			//existing event's bottom is overlapped
			if (overlappingEvents[x].end < end){
				start = overlappingEvents[x].start;
			}
			//existing event's top is overlapped
			else {
				end = overlappingEvents[x].end;
			}
			$('#calendar').fullCalendar('removeEvents', overlappingEvents[x]._id, true);
		}
		overlappingEvents = [];
		
		//TO-DO else it belongs to someone else, create events around it
	}
	
	console.log(mergingEvents.length, overlappingEvents.length, fullyOverlappingEvents.length);
	if (mergingEvents.length == 0 && overlappingEvents.length == 0 && fullyOverlappingEvents.length == 0){
		console.log('n');
		title = user.fullname || "Guest";
		var eventData = {
			title: title,
			start: start,
			end: end
		};
		$('#calendar').fullCalendar('renderEvent', eventData, true);
	}
}