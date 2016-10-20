$(document).ready(function() {
	//calendar logic
	 $('#calendar').fullCalendar({
		scrollTime: moment(new Date()).format("hh:mm:ss"),
		defaultView: "agendaWeek",
		allDayDefault: false,
		selectable: true,
		timezone: "local",
		editable: false, //prevents editing of events
		eventOverlap: false, //prevents overlap of events
		eventStartEditable: false, //prevents moving of events
		nowIndicator: true, //red line indicating current time
		slotDuration: '01:00:00', //how long a slot is,
		height: "auto",
		contentHeight:'auto', //auto height

		//creating new events
		select: function(start, end, jsEvent, view){
			start = moment(start.format());
			end = moment(end.format());
			if (unlock){
				createEvent(start, end);
			}
		}
    });
});

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
	var view = $('#calendar').fullCalendar('getView');

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
		$('#calendar').fullCalendar('updateEvent', calEvent);
		console.log('clipping at top');
	}
	//if clipping starts at middle of event and goes all the way
	else if (calEvent_end == mouseUp_end){
		calEvent.end = mouseDownSlot.start;
		$('#calendar').fullCalendar('updateEvent', calEvent);
		console.log('clipping at bottom');
	}
	//removing the event in month view
	else if (view.type == "month"){

	}
	//if middle of event
	else {
		console.log('middle of event');
		var tempEnd = calEvent.end;
		calEvent.end = mouseDownSlot.start;
		$('#calendar').fullCalendar('updateEvent', calEvent);
		var eventData = {
			title: calEvent.title,
			start: mouseUpSlot.end,
			end: tempEnd,
			color: calEvent.color,
			newevent: true
		};
		var newEvent = $('#calendar').fullCalendar('renderEvent', eventData, true);
	}

	//disable the submit button if there are no events
	if ($('#calendar').fullCalendar('clientEvents').length <= 0){
		$("#submit-button").addClass("is-disabled");
	}
}

//helper function to merge events
function createEvent(start, end){
	var allevents = $('#calendar').fullCalendar('clientEvents');
	var mergingEvents = [];
	var overlappingEvents = [];
	var fullyOverlappingEvents = [];
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
			$('#calendar').fullCalendar('removeEvents', fullyOverlappingEvents[x]._id);
		}
		fullyOverlappingEvents = [];
	}

	//there are some partially overlapping events
	if (overlappingEvents.length){
		for (var x = 0; x < overlappingEvents.length; x++){
			//existing event's bottom is overlapped
			if (overlappingEvents[x].end < end){
				start = overlappingEvents[x].start;
				$('#calendar').fullCalendar('removeEvents', overlappingEvents[x]._id, true);
			}
			//existing event's top is overlapped
			else {
				if (overlappingEvents[x].old){
					overlappingEvents[x].full = false;
					overlappingEvents[x].bottom = false;
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
		var eventData = {
			start: start,
			end: end,
			newevent: true,
			color: "#3CBC8D",
			title: "Desired Time"
		};

		var newEvent = $('#calendar').fullCalendar('renderEvent', eventData, true);

		//remove disabled on submit button
		if ($("#submit-button").hasClass("is-disabled")){
			$("#submit-button").removeClass("is-disabled");
		}
	}
}
