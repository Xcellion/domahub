$(document).ready(function() {
	 $('#calendar').fullCalendar({
        // put your options and callbacks here
		defaultView: "agendaWeek",
		allDayDefault: false,
		selectable: true,
		selectHelper: true,
		editable: true,
		timezone: "local",
		
		select: function(start, end) {
			console.log(start._d.getTime() - end._d.getTime());
			$('#calendar').fullCalendar('renderEvent',
			{
				title: listing_info.domain_name,
				start: start,
				end: end,
				allDay: false
				},
				true // stick the event
			);
			$('#calendar').fullCalendar('unselect');
		}
    })
});