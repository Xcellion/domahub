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
	for (var x = 0; x < listing_info.rentals.length; x++){
		var start = new Date(listing_info.rentals[x].date + " UTC");
		var end = new Date(start.getTime() + listing_info.rentals[x].duration);
		var eventData = {
			title: "Rented!",
			start: start,
			end: end,
			color: "red",
			other: true
		};
		$('#calendar').fullCalendar('renderEvent', eventData, true);
	}
	
	//if rental has yet to be submitted
	if (new_listing_info){
		for (var y = 0; y < new_listing_info.rental_info.length; y++){
			var eventData = {
				title: listing_info.fullname,
				start: new_listing_info.rental_info[y].start,
				end: new_listing_info.rental_info[y].end
			};
			$('#calendar').fullCalendar('renderEvent', eventData, true);
		}
	}
	
	//check if theres a cookie for local events
	if (document.cookie.match(new RegExp('local_events=([^;]+)')) && $('#calendar').fullCalendar('clientEvents', filterMine).length == 0){
		var existing_events = read_cookie("local_events");
		
		for (var x = 0; x < existing_events.length; x++){
			$('#calendar').fullCalendar('renderEvent', existing_events[x], true);
		}
	}
	
	//check if theres a cookie for the rental type
	if (document.cookie.match(new RegExp('type=([^;]+)'))){
		var type = read_cookie("type");
		$("#radio_"+type+"_input").prop("checked", true);
	}
	
	$("#listing_form").submit(function(e){
		e.preventDefault();
		submitRentals();
	});
	
	$("#remove_events").click(function(e){
		$('#calendar').fullCalendar('removeEvents', filterMine);
		storeCookies("local_events");
	});
	
	$("input[type='radio'][name='type']").click(function(e){
		storeCookies("type");
	});
});

//helper function to check if everything is legit
function checkSubmit(allevents){
	var bool = "success";
	
	if (!user){ bool = "Log in!"; }
	else if (!$("input[type='radio'][name='type']:checked").val()) { bool = "Please select a rental type!"; }
	else {
		for (var x = 0; x < allevents.length; x++){
			if (!allevents[x].other){
				var start = new Date(allevents[x].start._d);
				if (isNaN(start)){
					bool = "Invalid dates selected!";
					break;
				}
			}
		}
	}
	
	return bool;
}

//function to submit new rental info
function submitRentals(){
	var allevents = $('#calendar').fullCalendar('clientEvents');
	var checks = checkSubmit(allevents);
	
	//check if everything is legit
	if (checks == "success"){
	
		minEvents = [];
		for (var x = 0; x < allevents.length; x++){
			if (!allevents[x].other){
				var start = new Date(allevents[x].start._d);
				var offset = start.getTimezoneOffset();
				minEvents.push({
					start: allevents[x].start._d,
					end: allevents[x].end._d,
					offset: offset,
					_id: allevents[x]._id
				});
			}
		}
		$.ajax({
			type: "POST",
			url: "/listing/" + listing_info.domain_name + "/rent",
			data: {events: minEvents, type: $("input[type='radio'][name='type']:checked").val()}
		}).done(function(data){
			if (data.unavailable){
				for (var x = 0; x < data.unavailable.length; x++){
					console.log("That time slot is unavailable");
					$('#calendar').fullCalendar('removeEvents', data.unavailable[x].id);
				}
			}
			else if (data.redirect){
				window.location = data.redirect;
			}
			else {
				$("#message").html(data);
			}
		});
	}
	else {
		$("#message").html(checks);
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
	storeCookies("local_events");
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
				end: tempEnd
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
			if (!eventitem.other && !eventEncompassed && (moment(start).format('YYYY-MM-DD HH:mm') == moment(eventitem.end).format('YYYY-MM-DD HH:mm')
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
	}
}

//helper function to store local events as a cookie
function storeCookies(type){
	if (type == "local_events"){
		local_events = $('#calendar').fullCalendar('clientEvents', filterMine);
		cookie = [];
		for (var x = 0; x < local_events.length; x++){
			temp_event = {
				title: local_events[x].title,
				start: local_events[x].start,
				end: local_events[x].end
			}
			cookie.push(temp_event);
		}
	}
	else if (type == "type"){
		cookie = $("input[type='radio'][name='type']:checked").val();
	}
	
	if (read_cookie(type)){
		delete_cookie(type);
	}
	bake_cookie(type, cookie);
}

//helper function to filter out events that aren't mine
function filterMine(event) {
    return !event.hasOwnProperty("other");
}

//helper function to make cookie
function bake_cookie(name, value) {
	//var cookie = [name, '=', JSON.stringify(value), '; domain=.', window.location.host.toString(), '; path=/;'].join('');
	var cookie = [name, '=', JSON.stringify(value)].join('');
	document.cookie = cookie;
}

//helper function to read a cookie
function read_cookie(name) {
	var result = document.cookie.match(new RegExp(name + '=([^;]+)'));
	result && (result = JSON.parse(result[1]));
	return result;
}

//helper function to delete a cookie
function delete_cookie(name) {
	//document.cookie = [name, '=; expires=Thu, 01-Jan-1970 00:00:01 GMT; path=/; domain=.', window.location.host.toString()].join('');
	document.cookie = [name, '=; expires=Thu, 01-Jan-1970 00:00:01 GMT'].join('');
}