var unlock = true;

$(document).ready(function() {

	//page nav next buttons
	$(".next_button").click(function(e){
		$('html, body').stop().animate({
			scrollTop: $("#calendar_wrapper").offset().top - 60
		}, 1000);
	});

	//submit to server for data
	$("#submit-button").click(function(e){

		$(this).addClass("is-loading");

		var newEvents = $('#calendar').fullCalendar('clientEvents', filterNew);
		wantedEvents = [];

		//format the events to be sent
		for (var x = 0; x < newEvents.length; x++){
			wantedEvents.push({
				start: newEvents[x].start._d.getTime(),
				end: newEvents[x].end._d.getTime(),
			});
		}

		//only if unlocked
		if (unlock){
			unlock = false;
			$.ajax({
				url: "/listing/" + listing_info.domain_name + "/timeswanted",
				type: "POST",
				data: {
					events: wantedEvents
				}
			}).done(function(data){
				$("#submit-button").removeClass("is-loading").addClass("is-success").off().text("Thank you!");

				if (data.state == "success"){
					$('#calendar').fullCalendar('removeEvents', filterMine);
					$('#calendar').fullCalendar( 'destroy' );
					$('#calendar').fullCalendar({
						scrollTime: moment(new Date()).format("hh:mm:ss"),
						defaultView: "agendaWeek",
						allDayDefault: false,
						selectable: true,
						timezone: "local",
						editable: false, //prevents editing of events
						eventOverlap: false, //prevents overlap of events
						eventStartEditable: false, //prevents moving of events
						slotDuration: '01:00:00', //how long a slot is,
						height: "auto",
						contentHeight:'auto', //auto height

						//prevent selecting anything before now
						selectConstraint: {
							start: moment(0),
							end: moment(0)
						}
					});
					setUpCalendar();
				}
			});
		}
	});

});
