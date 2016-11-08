var unlock = true;

$(document).ready(function() {

	//user since text
	$("#user-since").text(moment(new Date(listing_info.user_created)).format("MMMM, YYYY"));

	Chart.defaults.global.legend.display = false;

	//create the price chart
	var myChart = new Chart($("#myChart")[0], {
		type: 'bar',
		data: {
			labels: ["Hourly", "Daily", "Weekly", "Monthly"],
			datasets: [
		        {
		            label: [],
		            backgroundColor: [
		                "#ff9a7a", "#ff9a7a", "#ff9a7a", "#ff9a7a"
		            ],
		            borderColor: [
		                "#FF5722", "#FF5722", "#FF5722", "#FF5722"
		            ],
		            borderWidth: 1,
		            data: [listing_info.hour_price, listing_info.day_price, listing_info.week_price, listing_info.month_price],
		        }
		    ]
		},
		options: {
			responsive: true,
			tooltips: {
				enabled: false
			},
			hover: {animationDuration: 0},
			animation: {
				duration: 500,
	            easing: "easeOutQuart",
				onComplete: function () {
				    // render the value of the chart above the bar
				    var ctx = this.chart.ctx;
				    ctx.font = Chart.helpers.fontString(15, 'normal', Chart.defaults.global.defaultFontFamily);
				    ctx.fillStyle = this.chart.config.options.defaultFontColor;
				    ctx.textAlign = 'center';
				    ctx.textBaseline = 'bottom';
					this.data.datasets.forEach(function (dataset) {
	                    for (var i = 0; i < dataset.data.length; i++) {
	                        var model = dataset._meta[Object.keys(dataset._meta)[0]].data[i]._model,
	                            scale_max = dataset._meta[Object.keys(dataset._meta)[0]].data[i]._yScale.maxHeight;
	                        ctx.fillStyle = '#444';
	                        var y_pos = model.y - 5;
	                        // Make sure data value does not get overflown and hidden
	                        // when the bar's value is too close to max value of scale
	                        // Note: The y value is reverse, it counts from top down
	                        if ((scale_max - model.y) / scale_max >= 0.93)
	                            y_pos = model.y + 20;
	                        ctx.fillText("$" + dataset.data[i], model.x, y_pos);
	                    }
	                });
				}
			},
			//tooltip to display all values at a specific X-axis
			scales: {
				xAxes: [{
					gridLines : {
	                    display : false
	                }
			   	}],
				yAxes: [{
					display: false
				}]
			}
		 }
	});


	//stripe configuration
	handler = StripeCheckout.configure({
		key: 'pk_test_kcmOEkkC3QtULG5JiRMWVODJ',
		name: 'DomaHub Domain Rental',
		image: '/images/d-logo.PNG',
		panelLabel: 'Pay',
		zipCode : true,
		locale: 'auto',
		token: function(token) {
			// You can access the token ID with `token.id`.
			// Get the token ID to your server-side code for use.
			var $id = $('<input id="stripeToken" type=hidden name=stripeToken />').val(token.id);
			$('#listing_form').append($id);
			submitRentals();
		}
	});

	//--------------------------------------------------------------------buttons

	//page nav next buttons
	$("#top_next").data("can_next", true);
	$(".next_button").click(function(e){
		if ($(this).data("can_next") == true){
			var scroll_elems = ["#top_wrapper", "#calendar_wrapper", "#address_wrapper", "#pay_wrapper"];
			var index = scroll_elems.indexOf("#" + $(this).attr("id").split("_").shift().toString() + "_wrapper") + 1;
			index = index >= scroll_elems.length ? 0 : index;
			$('html, body').stop().animate({
				scrollTop: $(scroll_elems[index]).offset().top - 60
			}, 1000);
		}
	})

	$("#address_next").click(function(e){
		storeCookies("address");
	})

	//stripe buttons
	$('#stripe-button').click(function(e){
		e.preventDefault();

		if (checkSubmit() == true && unlock){
			handler.open({
				amount: totalPrice * 100,
				description: 'Renting at ' + listing_info.domain_name
			});

			$("#submitButton").css("background", "black");
		}
	});

	$("#address_form_input").keyup(function(e){
		addressNextChange();
	});

	//--------------------------------------------------------------------cookies

	//check if there are cookies for this domain name
	if (read_cookie("domain_name") == listing_info.domain_name){
		if (read_cookie("local_events")){
			var existing_events = read_cookie("local_events");

			for (var x = 0; x < existing_events.length; x++){
				$('#calendar').fullCalendar('renderEvent', existing_events[x], true);
				eventPrices();	//show prices
			}
		}

		//check if theres a cookie for the rental type
		if (read_cookie("address")){
			$("#address_form_input").val(read_cookie("address"));
			addressNextChange();
		}

		if (!rental_info){
			//check if theres a cookie for editing an event
			if (document.cookie.match(new RegExp('rental_info=([^;]+)'))){
				var cookie = read_cookie("rental_info");
				rental_info = cookie;
				editingRental();
			}
		}
	}
	else {
		delete_cookies();
	}

	//if rental_info exists, change some stuff around
	if (rental_info){
		displayRental();
	}
	else {
		displayDefault();
	}
});

// Close Checkout on page navigation
$(window).on('popstate', function () {
    handler.close();
});

//function to show rental specific stuff
function displayRental(){
	delete_cookies();

	//populate address form with rental info address
	$("#address_form_input").val(rental_info.address);
	addressNextChange();

	//go to rental start date
	$("#calendar").fullCalendar("gotoDate", rental_info.times[0].date);

	//rental top buttons
	$("#top_next_rental").data("can_next", true);
	$("#calendar_next_rental").data("can_next", true);

	for (var x = 0; x < rental_info.times.length; x++){

		start = moment(new Date(rental_info.times[x].date));
		disp_end = moment(new Date(start._d.getTime() + rental_info.times[x].duration)).format('YYYY/MM/D, h:mmA');
		disp_start = start.format('YYYY/MM/D, h:mmA');

		$("#rental_times").append("<li class='rental_time'>" + disp_start + " - " + disp_end + "</li>")
	}

	$(".rental_hide").show();
	$(".default_hide").hide();
}

//function to reverse display of rental
function displayDefault(){
	$(".default_hide").show();
	$(".rental_hide").hide();
}

//helper function to change next icon to primary color
function addressNextChange(){
	if ($(address_form_input).val()){
		$("#address_next").addClass("is-primary");
		$("#address_next").data("can_next", true);
	}
	else {
		$("#address_next").removeClass("is-primary");
		$("#address_next").data("can_next", false);
	}
}

//helper function to check if everything is legit
function checkSubmit(){
	var newEvents = $('#calendar').fullCalendar('clientEvents', filterNew);
	var bool = true;

	if (!user){
		bool = "Invalid user!";
		$('#login-modal').click();
	}
	else if (!rental_info && (!newEvents || newEvents.length == 0)){
		bool = "Invalid dates!";
		$('html, body').stop().animate({
			scrollTop: $("#calendar_wrapper").offset().top
		}, 1000);
	}
	else if (newEvents.length > 0){
		for (var x = 0; x < newEvents.length; x++){
			if (!newEvents[x].old){
				var start = new Date(newEvents[x].start._d);
				if (isNaN(start)){
					bool = "Invalid dates selected!";
					$('html, body').stop().animate({
						scrollTop: $("#calendar_wrapper").offset().top
					}, 1000);
					break;
				}
			}
		}
	}

	$("#listing_message").html(bool);
	return bool;
}

//function to submit new rental info
function submitRentals(){
	if (checkSubmit() == true && unlock){
		var newEvents = $('#calendar').fullCalendar('clientEvents', filterNew);
		unlock = false;
		minEvents = [];

		//format the events to be sent
		for (var x = 0; x < newEvents.length; x++){
			var start = new Date(newEvents[x].start._d);
			var offset = start.getTimezoneOffset();
			minEvents.push({
				start: newEvents[x].start._d.getTime(),
				end: newEvents[x].end._d.getTime(),
				_id: newEvents[x]._id
			});
		}

		//to edit or create a new rental
		var url = rental_info ? rental_info.rental_id : "rent"
		$.ajax({
			type: "POST",
			url: "/listing/" + listing_info.domain_name + "/" + url,
			data: {
				events: minEvents,
				rental_id: rental_info.rental_id,
				address: $("#address_form_input").val(),
				stripeToken: $("#stripeToken").val()
			}
		}).done(function(data){
			delete_cookies();
			unlock = true;
			if (data.unavailable){
				for (var x = 0; x < data.unavailable.length; x++){
					$("#listing_message").text("Some time slots were unavailable! They have been removed.");
					$('#calendar').fullCalendar('removeEvents', data.unavailable[x]._id);
				}
			}
			else if (data.state == "success"){
				window.location = window.location.origin + "/listing/" + listing_info.domain_name + "/" + data.rental_id;
			}
			else if (data.state == "error"){
				console.log(data);
				$("#listing_message").html(data.message);
			}
			else {
				console.log(data);
			}
		});
	}
}
