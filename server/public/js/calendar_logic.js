$(document).ready(function() {
    setUpCalendar();
});

//----------------------------------------------------------------------------------------------------------------CALENDAR SET UP

//function to setup the calendar
function setUpCalendar(){
    $('#calendar').fullCalendar({
        scrollTime: moment().format("hh:mm:ss"),
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

        //formatting for labels
        titleFormat: {
            month: 'YYYY MMMM',
            week: "MMM DD YYYY"
        },
        timeFormat: 'hA',
        axisFormat: 'hA',

        //header buttons
        header: {left:'prev', center:'next', right:'title, today'},

        //background event to show that you cant select past dates
        events: [
            //background for all days until today
            {
                start: '1970-01-01T00:00:00',
                end:  moment().endOf("hour"),
                rendering: 'background',
                id: "background_today"
            },
            //all day background event (month view)
            {
                start: '1970-01-01T00:00:00',
                end: moment().format("YYYY-MM-DD"),
                rendering: 'background',
                allDay: true
            },
            //background for 1 year out
            {
                start: moment().add(1, "year").startOf("hour"),
                end: moment().add(2, "year"),
                rendering: 'background'
            },
            //all day background event for 1 year out (month view)
            {
                start: moment().add(1, "year"),
                end: moment().add(2, "year"),
                rendering: 'background',
                allDay: true
            },
        ],

        //prevent selecting anything before current hour, and next year
        selectConstraint: {
            start: moment().endOf("hour"),
            end: moment().add(1, "year")
        },

        //callback when view is changed
        viewRender: function(currentView){
            var minDate = moment();						//prevent calendar from going back in past
            var maxDate = moment().add(1, "year");		//prevent calendar from going further than 1 year

            //dim today or not
            if (moment().isBetween(currentView.start, currentView.end)){
                $("#today-button").addClass('is-disabled');
            }
            else {
                $("#today-button").removeClass('is-disabled');
            }

            //dim previous button
            if (currentView.start.isSameOrBefore(minDate)) {
                $(".fc-prev-button").prop('disabled', true);
                $(".fc-prev-button").addClass('fc-state-disabled');
                $(".fc-next-button").removeClass('fc-state-disabled');
                $(".fc-next-button").prop('disabled', false);
            }
            //dim next button
            else if (currentView.end.isSameOrAfter(maxDate)){
                $(".fc-next-button").prop('disabled', true);
                $(".fc-next-button").addClass('fc-state-disabled');
                $(".fc-prev-button").removeClass('fc-state-disabled');
                $(".fc-prev-button").prop('disabled', false);
            }
            //undim both
            else {
                $(".fc-prev-button, .fc-next-button").removeClass('fc-state-disabled');
                $(".fc-prev-button, .fc-next-button").prop('disabled', false);
            }

            if (currentView.name == "agendaWeek"){
                daySelectionHandlers();		//day selector event handlers
            }
            highlightCellHover(currentView.name);		//highlight cell hover
        },

        //creating new events
        select: function(start, end, jsEvent, view){
            var start = moment(start.format());
            var end = moment(end.format());
            var now = moment();
            var then = moment().add(1, "year");

            start = (start.isSameOrBefore(now)) ? now.add(1, "hour").startOf('hour') : start;  		//to select a partial day entirely (past)
            end = (end.isSameOrAfter(then)) ? then.startOf('hour') : end; 							//to select a partial day entirely (future)

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

            //event handler for event click on non-background events
            if (!$(element).hasClass("fc-bgevent")){
                eventSelectionHandlers(element);
            }

            //center title / date / time
            $(element).find(".fc-content").css({
                left: "50%",
                top: "50%",
                position: "absolute",
                transform: "translate(-50%, -50%)",
                "margin-right": "-50%"
            });
            if (view.name == "agendaWeek"){
                $(element).css("width", "100%");
                //remove event title repeat on other ppl events
                if (!$(element).hasClass('fc-start') && !event.other){
                    $(element).find('.fc-content').text("");
                }
            }
            //fatten event height in month view
            else {
                $(element).css("height", "50px");
            }

        }
    });

    //custom buttons for today
    $(".fc-today-button").hide();

    //remove all events and remember
	$("#remove_events").click(function(e){
		$('#calendar').fullCalendar('removeEvents', returnMineNotBG);
		storeCookies("local_events");
		updatePrices();
	});

    //change to month view
    $("#month_button").click(function(e){
        var view = $('#calendar').fullCalendar('getView');

        if (view.name == "agendaWeek"){
            $("#calendar").fullCalendar( 'changeView', "month");
            $(this).text("Week View");
        }
        else {
            $("#calendar").fullCalendar( 'changeView', "agendaWeek");
            $(this).text("Month View");
        }
    });
}

//helper function to highlight individual agendaweek cells
function highlightCellHover(viewname){
	$('td.fc-widget-content').mouseenter(function(){
		appendTempCell($(this), viewname);
	});

	if (viewname == "month"){
		//month hover on day row
		$(".fc-day-number").mouseenter(function(e){

			//only when not clicking
			if (e.which == 0){
				var day_index = $(this).index();
				day_cell_elem = $($(this).closest(".fc-content-skeleton").prev(".fc-bg").find(".fc-widget-content")[day_index]);
				appendTempCell(day_cell_elem, "month");
			}
		});

		//month hover on day row
		$(".fc-day-number").mouseleave(function(e){
			$(".temp-cell").remove();
		});

		$('td.fc-widget-content').mouseleave(function(){
			$(".temp-cell").remove();
		});
	}
}

//helper function to append a temp cell for hover effect
function appendTempCell(element, view){
	if (!element.html()){
		if (view == "agendaWeek"){
			$(".temp-cell").remove();
			for (i = 0; i < 7; i++){
				var temp_cell = $("<td class='temp-cell'></td>");
				temp_cell.css({
					width: element.width() / 7,
					height: element.height(),
					border: 0
				});
				element.append(temp_cell);
			}
		}
		else{
			$(".temp-cell").remove();
			var temp_cell = $("<td class='temp-cell'></td>");
			temp_cell.css({
				width: element.width() + 1,
				height: element.height() + 2,
				border: 0
			});
			element.append(temp_cell);
		}
	}
}

//helper function to highlight day cells in month view
function highlightMonthDayCell(day_index, day_cell_elem){
	var temp_height = $(day_cell_elem).height();
	if (!$(day_cell_elem).html()){
		var temp_cell = $("<td class='temp-cell'></td>");
		temp_cell.css({
			width: $(day_cell_elem).width() + 1,
			height: temp_height + 1,
			border: 0
		});
		$(day_cell_elem).append(temp_cell);
	}
}

//function to handle selection of days
function daySelectionHandlers(){
	var alldayMouseDown, alldayMouseUp, alldayMouseEnter, alldayMouseLeave, alldayMouseLeaveElem, wasActive;

	//make it unselectable to prevent highlighting, gray if its past/future
	$(".fc-day-header").each(function(){
		var this_date = moment($(this).data("date"));
		if (this_date.isBefore(moment().startOf("day"))){
			$(this).addClass("is-disabled");
		}
		else if (this_date.isAfter(moment().add(1, "year").startOf("day"))){
			$(this).addClass("is-disabled");
		}

		$(this).addClass('is-unselectable');
	});

	//create all day events
	$(".fc-day-header").mousedown(function(e){
		e.preventDefault();

		if (e.which == 1){
			alldayMouseDown = moment($(this).data('date'));
			if (alldayMouseDown >= moment().startOf("day")){
				$(this).addClass('is-active');
			}
		}
	});
	$(".fc-day-header").mouseup(function(e){
		e.preventDefault();

		if (e.which == 1 && alldayMouseDown){
			alldayMouseUp = moment($(this).data('date'));
			$(".fc-day-header").not(this).removeClass('is-active');

			//if true, you're dragging left
			var start = (alldayMouseUp < alldayMouseDown) ? alldayMouseUp : alldayMouseDown;
			var end = (alldayMouseUp < alldayMouseDown) ? moment(alldayMouseDown._d.getTime() + 86400000) : moment(alldayMouseUp._d.getTime() + 86400000);

			var now = moment();
			var then = moment().add(1, "year");
			start = (start.isSameOrBefore(now)) ? moment(now).add(1, "hour").startOf('hour') : start; 	//to select a partial day entirely (past)
			end = (end.isSameOrAfter(then)) ? then.startOf('hour') : end; 								//to select a partial day entirely (future)

			//prevent calendar from creating events in the past
			if (start <= now || end <= now){
				$('#calendar').fullCalendar('unselect');
				return false;
			}
			else {
				alldayMouseDown = null;
				alldayMouseUp = null;
				createEvent(start, end);
			}
		}
	});

	//highlight when mouse hover
	$(".fc-day-header").mouseenter(function(e){
		alldayMouseEnter = moment($(this).data('date'));
		alldayMouseEnter = (alldayMouseEnter.isSameOrBefore(alldayMouseDown)) ? alldayMouseEnter.startOf("day") : alldayMouseEnter.endOf("day");
		if (e.which == 1){

			if (alldayMouseEnter >= moment().startOf("day")){
				$(this).addClass('is-active');
			}

			//if entering from outside and no mousedown
			if (!alldayMouseDown){
				alldayMouseDown = moment($(this).data('date'));
			}

			//isbetween assumes a<b
			var start_comp = (alldayMouseEnter.isSameOrBefore(alldayMouseDown)) ? alldayMouseEnter : alldayMouseDown;
			var end_comp = (alldayMouseEnter.isSameOrBefore(alldayMouseDown)) ? alldayMouseDown : alldayMouseEnter;

			//if we're leaving a cell, remove highlight if its not in selection
			if (alldayMouseLeave && !alldayMouseLeave.isBetween(start_comp, end_comp, null, '[]')){
				alldayMouseLeaveElem.removeClass('is-active');
			}

			if (wasActive){
				wasActive.addClass('is-active');
				wasActive = null;
			}
		}
		else {
			if (alldayMouseEnter >= moment().startOf("day")){
				$(this).addClass('is-active');
			}
		}
	});

	//remove highlight if not selecting
	$(".fc-day-header").mouseleave(function(e){
		if (e.which == 1){
			alldayMouseLeave = moment($(this).data('date'));
			alldayMouseLeaveElem = $(this);
		}
		else {
			$(this).removeClass('is-active');
		}

		if (!$(e.toElement).hasClass("fc-day-header")){
			wasActive = $(".fc-day-header.is-active");
			$(".fc-day-header").removeClass('is-active');
		}
	});
}

var mouseDownJsEvent;
var mouseDownCalEvent;

//function to handle selection of events
function eventSelectionHandlers(element){
	element.on("mousedown", function(e){
		//only left click
		if (e.which == 1){
			var eventElem = $(e.target).closest(".fc-event");

			//remember the js event so we can figure out the time slot
			mouseDownCalEvent = $("#calendar").fullCalendar('clientEvents', eventElem.attr("id"))[0];
			if (!mouseDownCalEvent.old){
				mouseDownJsEvent = e;
			}
		}
	});

	element.on("mouseup", function(mouseUpJsEvent){
		//only left click
		if (mouseUpJsEvent.which == 1){
			var eventElem = $(mouseUpJsEvent.target).closest(".fc-event");
			var view = $('#calendar').fullCalendar('getView');
			var mouseUpCalEvent = $("#calendar").fullCalendar('clientEvents', eventElem.attr("id"))[0];

			//agendaweek view
			if (view.type == "agendaWeek"){
				//get the time slots of both mousedown and mouseup
				var mouseDownSlot = getTimeSlotAgenda(mouseUpCalEvent, mouseDownJsEvent);
				var mouseUpSlot = getTimeSlotAgenda(mouseUpCalEvent, mouseUpJsEvent);
			}
			//month view
			else {
				var mouseUpSlot = getTimeSlotMonth(mouseUpJsEvent);
				var mouseDownSlot = getTimeSlotMonth(mouseDownJsEvent);
			}

			//if its my event, mousedown exists and the mousedown event is the same as the mouseup event
			if (!mouseUpCalEvent.old && mouseDownJsEvent && mouseDownCalEvent._id == mouseUpCalEvent._id){
				//moved down / right or stayed the same
				if (mouseDownSlot.start.isSameOrBefore(mouseUpSlot.start)){
					//remove the time slots in between mousedown and mouseup from the event
					removeEventTimeSlot(mouseUpCalEvent, mouseDownSlot, mouseUpSlot);
				}
				//moved up / left
				else {
					//same function, but reversed the mousedown and mouseup, genius
					removeEventTimeSlot(mouseUpCalEvent, mouseUpSlot, mouseDownSlot);
				}
				mouseDownCalEvent = {};
				mouseDownJsEvent = {};
				storeCookies("local_events");
				updatePrices();
			}

		}
	});
}

//----------------------------------------------------------------------------------------------------------------CALENDAR FUNCTIONS

//helper function to determine the time slot of a mouse event
function getTimeSlotAgenda(calEvent, jsEvent){
	var datetime = "";
	var rows = $(document).find("[data-time]");
	var days = $(document).find("[data-date]");

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
	var removeStart = moment(new Date(datetime));
	var removeEnd = moment(removeStart).add(1, "hour"); //clone the moment before adding an hour

	return {
		start: removeStart,
		end: removeEnd
	}
}

//helper function to determine the time slot of a mouse event (for month view)
function getTimeSlotMonth(jsEvent){
	//figure out the index of the <td> within the parent <tr> then we can use that number to figure out which day was picked
	var event_element = $(jsEvent.target).closest("td");

	//figure out which day was clicked (taking into account other events)
	var nth_day = 0;
	var siblings = event_element.prevAll("td");
	for (var y = 0; y < siblings.length; y++){
		nth_day += $(siblings[y]).prop('colspan');
	}
	var num_days = event_element.prop("colspan");

	//if the event is longer than a day
	if (num_days){
		var width_of_event = event_element.outerWidth();
		var width_of_cell = Math.floor(event_element.outerWidth() / num_days);

		//if clicked on the event
		if ($(jsEvent.target).hasClass("fc-event")){
			var offsetX = jsEvent.offsetX;
		}
		//if clicked on event time/title
		else {
			var offsetX = (width_of_event / 2) - ($(jsEvent.target).closest(".fc-content").outerWidth() / 2) + jsEvent.offsetX;
		}

		//figure out which day-cell was clicked
		for (var x = 0; x < num_days ; x++){
			if (width_of_cell * x <= offsetX && width_of_cell * (x+1) > offsetX){
				nth_day += x;
				break;
			}
		}
	}
	var day_elem = $($(jsEvent.target).closest(".fc-week").find(".fc-day")[nth_day]).data('date');
	return {
		start : moment(day_elem),
		end : moment(day_elem).add(1, "day")
	}
}

//helper function to remove time slots from an event
function removeEventTimeSlot(calEvent, mouseDownSlot, mouseUpSlot){
	//event is equal to slot
	if (calEvent.start.isSameOrAfter(mouseDownSlot.start)
	&& calEvent.end.isSameOrBefore(mouseUpSlot.end)){
		$('#calendar').fullCalendar('removeEvents', calEvent._id);
		$('#calendar').fullCalendar('updateEvent', calEvent);
		//console.log('event equal to slot');
	}
	//if clipping starts at top of event
	else if (calEvent.start.isSame(mouseDownSlot.start)){
		calEvent.start = mouseUpSlot.end;
		calEvent.title = moneyFormat.to(eventPrice({
			start: calEvent.start,
			end: calEvent.end
		}).totalPrice);
		$('#calendar').fullCalendar('updateEvent', calEvent);
		//console.log('clipping at top');
	}
	//if clipping starts at middle of event and goes all the way
	else if (calEvent.end.isSame(mouseUpSlot.end)){
		calEvent.end = mouseDownSlot.start;
		calEvent.title = moneyFormat.to(eventPrice({
			start: calEvent.start,
			end: calEvent.end
		}).totalPrice);
		$('#calendar').fullCalendar('updateEvent', calEvent);
		//console.log('clipping at bottom');
	}
	//if middle of event, split event into two
	else {
		//console.log('middle of event');

		//update existing
		var tempEnd = calEvent.end;
		calEvent.end = mouseDownSlot.start;
		calEvent.title = moneyFormat.to(eventPrice({
			start: calEvent.start,
			end: calEvent.end
		}).totalPrice);
		$('#calendar').fullCalendar('updateEvent', calEvent);

		//update splitting off
		if (checkOverlapEvent({start: mouseUpSlot.end, end: tempEnd})){
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

	//remove highlighting
	$("#calendar").fullCalendar('unselect');
}

//helper function to make sure theres nothing overlapping this event
function checkOverlapEvent(event){
    var start = new Date(event.start);
    var end = new Date(event.end);

    var overlap = $('#calendar').fullCalendar('clientEvents', function(ev) {
        //dont compare with itself
        if (ev == event){
            return false;
        }
        //dont compare with background events
        if (ev.rendering == "background"){
            return false;
        }
        var estart = new Date(ev.start);
        var eend = new Date(ev.end);

        return (Math.round(estart)/1000 < Math.round(end)/1000 && Math.round(eend) > Math.round(start));
    });

    return overlap.length == 0;
}

//helper function to create pre-existing rentals
function createExisting(rentals){
    console.log('s')
	if (rentals){
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

			//if its your own rental
			if (user && user.id == rentals[x].account_id){
				eventData.title = user.username;
				eventData.color = "#73c8e3";
			}
			//someone else rented it
			else {
				eventData.title = "Rented!";
				eventData.color = "#ff6b40";
				eventData.other = true;
			}
			$('#calendar').fullCalendar('renderEvent', eventData, true);
		}
	}
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
		if (eventitem !== null && typeof eventitem != 'undefined' && !eventitem.old && eventitem.rendering != "background")
		{
			//event being created is fully overlapped by existing event, so dont create anything new
			if (checkFullOverlap(start._d, end - start, eventitem.start._d, eventitem.end - eventitem.start)){
				//console.log('new event is not needed');
				eventEncompassed = true;
				removeEventTimeSlot(eventitem, {start: start, end: end}, {start: start, end: end});
				updatePrices();
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

		//make sure it doesnt overlap
		if (checkOverlapEvent(eventData)){
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
			$("#calendar-error-message").removeClass('is-danger').text("Click a cell on the calendar to reserve that time slot. You may select whole days by clicking on the date.	Use the buttons at the top to remove all selected cells or change calendar views.")
		}
	}
}

//----------------------------------------------------------------------------------------------------------------PRICE CALCULATION

//helper function to get correct price of events
function updatePrices(){
	if (listing_info.status){
		var myevents = $('#calendar').fullCalendar('clientEvents', returnMineNotBG);
		if (myevents.length){
			$("#redirect-next-button, #remove_events").removeClass('is-disabled');
		}
		else {
			$("#redirect-next-button, #remove_events").addClass('is-disabled');
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
			var start_date = $("<p class='preview-dates'>" + moment(myevents[x].start).format("MMM DD, YYYY hh:mmA") + "</p>");
			var end_date = $("<p class='preview-dates'>" + moment(myevents[x].end).format("MMM DD, YYYY hh:mmA") + "</p>");

			$("#preview-start-dates").append(start_date);
			$("#preview-end-dates").append(end_date);
		}

		var appendPreviewRates = function(total_units, type, price_rate){
			if (total_units > 0){
				var s_or_not = (total_units == 1) ? "" : "s";
				$("#preview-rates").append($("<h3>$" + price_rate + " x " + total_units + " " + type + s_or_not + "</h3>"));
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

//function to figure out a price for a specific event
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

//----------------------------------------------------------------------------------------------------------------HELPERS

var moneyFormat = wNumb({
	thousand: ',',
	prefix: '$',
	postfix: " USD",
	decimals: 2
});

//helper function to check if date X overlaps any part with date Y
function checkOverlap(dateX, durationX, dateY, durationY){
	return (dateX.getTime() < dateY.getTime() + durationY) && (dateY.getTime() < dateX.getTime() + durationX);
}

//helper function to check if date X is fully covered by date Y
function checkFullOverlap(dateX, durationX, dateY, durationY){
	return (dateY.getTime() <= dateX.getTime()) && (dateX.getTime() + durationX <= dateY.getTime() + durationY);
}

//helper function to filter out events that aren't mine
function returnMineNotBG(event) {
    return !event.hasOwnProperty("old") && event.rendering != 'background';
}

//helper function to find all non BG events
function returnNotMineOrBG(event){
    return event.hasOwnProperty("old") || event.rendering != 'background';
}
