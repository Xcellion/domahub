$(document).ready(function() {
	 $('#calendar').fullCalendar({
		defaultView: "agendaWeek",
		allDayDefault: false,
		selectable: true,
		editable: true,
		timezone: "local",
		eventOverlap: false,
		
		select: function (start, end, jsEvent, view) 
		{
			var allevents = $('#calendar').fullCalendar('clientEvents');
			var mergingEvents = [];
			var overlap = false;
			$.each(allevents, function( index, eventitem )
			{
				if (eventitem !== null && typeof eventitem != 'undefined')
				{
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
					
					//overlaps something, cancel creation
					if (checkSchedule(start._d, end - start, eventitem.start._d, eventitem.end - eventitem.end)){
						overlap = true;
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
						end: end,
						editable: true,
						overlap: false,
						eventDurationEditable: false
					};
					$('#calendar').fullCalendar('renderEvent', eventData, true);
				};
			}
			$('#calendar').fullCalendar('unselect');
		}
    })
});

//helper function to check if dates overlap
function checkSchedule(dateX, durationX, dateY, durationY){
	return (dateX.getTime() <= dateY.getTime() + durationY) && (dateY.getTime() < dateX.getTime() + durationX);
}