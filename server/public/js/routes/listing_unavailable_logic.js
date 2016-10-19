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

		var newEvents = $('#calendar').fullCalendar('clientEvents', filterNew);
		unlock = false;
		wantedEvents = [];

		//format the events to be sent
		for (var x = 0; x < newEvents.length; x++){
			wantedEvents.push({
				start: newEvents[x].start._d.getTime(),
				end: newEvents[x].end._d.getTime(),
			});
		}

		$.ajax({
			url: "/listing/" + listing_info.domain_name + "/timeswanted",
			type: "POST",
			data: {
				events: wantedEvents
			}
		}).done(function(data){
			console.log(data);

		})
	});

});
