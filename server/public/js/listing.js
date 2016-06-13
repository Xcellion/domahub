$(document).click(function(event){
	console.log("Mouse is at:", event.pageY);
});

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
			mergeEvents(start, end);
			$('#calendar').fullCalendar('unselect');
		},
		
		//clicking on existing events
		eventClick: function(calEvent, jsEvent, view) {
			var datetime = "";
			var rows = $(jsEvent.delegateTarget).find("[data-time]");
			var days = $(jsEvent.delegateTarget).find("[data-date]");

			for (var y = 0; y < days.length; y++){
 				if (jsEvent.pageX >= $(days[y]).offset().left && jsEvent.pageX <= $(days[y]).offset().left + $(days[y]).width()){
					datetime += $(days[y]).data("date");
					break;
				}
			}
			datetime+= " ";
			for (var x = 0; x < rows.length; x++){
				console.log(Math.round($(rows[x]).offset().top), $(rows[x]).data("time"));
				if (jsEvent.pageY >= Math.round($(rows[x]).offset().top) && jsEvent.pageY == Math.round($(rows[x]).offset().top) + $(rows[x]).height()){
					//bullshit bug in fullcalendar
					tempDate = datetime + $(rows[x]).data("time");
					if (moment(calEvent.start._d).format('YYYY-MM-DD HH:mm') == moment(tempDate).format('YYYY-MM-DD HH:mm')){
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
			var datetime = new Date(datetime);
			var removeStart = moment(datetime);
			var removeEnd = moment(removeStart).add(30, "minutes");

			//event is equal to remove slot
			if (moment(calEvent.start).format('YYYY-MM-DD HH:mm') == moment(removeStart).format('YYYY-MM-DD HH:mm') 
				&& moment(calEvent.end).format('YYYY-MM-DD HH:mm') == moment(removeEnd).format('YYYY-MM-DD HH:mm')){
				$('#calendar').fullCalendar('removeEvents', calEvent._id);
			}
			//if clipping start of event
			else if (moment(calEvent.start).format('YYYY-MM-DD HH:mm') == moment(removeStart).format('YYYY-MM-DD HH:mm')){
				calEvent.start = removeEnd;
			}
			//if clipping end of event
			else if (moment(calEvent.end).format('YYYY-MM-DD HH:mm') == moment(removeEnd).format('YYYY-MM-DD HH:mm')){
				calEvent.end = removeStart;
			}
			//if middle of event
			else {
				var eventData = {
					title: calEvent.title,
					start: removeEnd,
					end: calEvent.end
				};
				$('#calendar').fullCalendar('renderEvent', eventData, true);
				calEvent.end = removeStart;
			}
			$('#calendar').fullCalendar('updateEvent', calEvent);
		}
    })
});

//helper function to check if dates overlap
function checkSchedule(dateX, durationX, dateY, durationY){
	return (dateX.getTime() < dateY.getTime() + durationY) && (dateY.getTime() < dateX.getTime() + durationX);
}

//helper function to merge events
function mergeEvents(start, end){
	var allevents = $('#calendar').fullCalendar('clientEvents');
	var mergingEvents = [];
	var overlap = false;
	$.each(allevents, function( index, eventitem )
	{
		if (eventitem !== null && typeof eventitem != 'undefined')
		{
			//overlaps something, cancel creation
			if (checkSchedule(start._d, end - start, eventitem.start._d, eventitem.end - eventitem.start)){
				overlap = true;
				return false;
			}
			
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
	
	//both merge
	if (!overlap){
		if (mergingEvents.length == 2){
			//if the first merge event is above second merge event
			if (mergingEvents[0].start < mergingEvents[1].start){
				mergingEvents[0].end = mergingEvents[1].end;
				$('#calendar').fullCalendar('removeEvents', mergingEvents[1]._id);
				$('#calendar').fullCalendar('updateEvent', mergingEvents[0]);
			}
			else {
				mergingEvents[1].end = mergingEvents[0].end;
				$('#calendar').fullCalendar('removeEvents', mergingEvents[0]._id);
				$('#calendar').fullCalendar('updateEvent', mergingEvents[1]);
			}
		}
		//only 1 merge
		else if (mergingEvents.length == 1){
			//if start time of new event (2nd slot) is end time of existing event (1st slot)
			//i.e. if new event is below any existing events
			if (moment(start).format('YYYY-MM-DD HH:mm') == moment(mergingEvents[0].end).format('YYYY-MM-DD HH:mm'))
			{
				mergingEvents[0].end = end;
			}
			//if end time of new event (1st slot) is start time of existing event (2nd slot)
			//i.e. if new event is above any existing events
			else if (moment(end).format('YYYY-MM-DD HH:mm') == moment(mergingEvents[0].start).format('YYYY-MM-DD HH:mm'))
			{
				mergingEvents[0].start = start;
			}
			$('#calendar').fullCalendar('updateEvent', mergingEvents[0]);
		}
		else{
			title = user.fullname || "Guest";
			var eventData = {
				title: title,
				start: start,
				end: end
			};
			$('#calendar').fullCalendar('renderEvent', eventData, true);
		};
	}
}