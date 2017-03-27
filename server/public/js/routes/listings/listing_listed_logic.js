var unlock = true;


$(document).ready(function() {
	setUpCalendar(listing_info);

	//user since text in About Owner
	$("#user-since").text(moment(new Date(listing_info.user_created)).format("MMMM, YYYY"));

	//change the URL, save as cookie and allow next
	$("#address_form_input").on("change keyup paste", function(e){
		storeCookies("address");
		if ($("#address-error-message").hasClass('is-danger')){
			$("#address-error-message").removeClass('is-danger').text("The content of the URL you link below will be displayed when anyone goes to your rental domain name. You may change this URL at any time.")
		}

		//press enter to go next
		if (e.keyCode == 13){
			if (user){
				showCardContent("checkout");
			}
			else {
				showCardContent("nouser");
			}
		}
	});

	//press enter to go next for no user email
	$("#new_user_email").on("change keyup paste", function(e){
		if (e.keyCode == 13){
			showCardContent("checkout");
		}
	});

	//---------------------------------------------------------------------------------------------------cookies

	//check if there are cookies for this domain name
	if (read_cookie("domain_name") == listing_info.domain_name){
		if (read_cookie("local_events")){
			var cookie_events = read_cookie("local_events");
			var changed = false;
			for (var x = cookie_events.length - 1; x >= 0; x--){
				var partial_days = handlePartialDays(moment(cookie_events[x].start), moment(cookie_events[x].end));
				cookie_events[x].start = partial_days.start;
				cookie_events[x].end = partial_days.end;
				//if its a new event, make sure it doesnt overlap
				if (checkIfNotOverlapped(cookie_events[x])){
					$('#calendar').fullCalendar('renderEvent', cookie_events[x], true);
				}
				else {
					changed = true;
					cookie_events.splice(x, 1);
				}
			}

			//if we removed any events, change the cookies
			if (changed){
				storeCookies("local_events");
			}
		}
		updatePrices();	//show prices

		//check if theres a cookie for the rental address
		if (read_cookie("address")){
			$("#address_form_input").val(read_cookie("address"));
			$("#checkout-next-button").removeClass('is-disabled');
		}
	}
	else {
		delete_cookies();
	}

	//---------------------------------------------------------------------------------------------------modals

	//changes the cards for calendar, address, and checkout
	$('.card-button-next').click(function() {
		showNextCard();
	});

	$('.card-button-prev').click(function() {
		showPrevCard();
	});

	//---------------------------------------------------------------------------------------------------CALENDAR

	//prevent enter to submit on new emailToRegister
	$("#new_user_email").submit(function(e){
		e.preventDefault();
	});

	//copy ownership url
	$("#rental-link-button").click(function(){
		$(this).prev("input").select();
		document.execCommand("copy");
		$(this).prev("input").blur();
		$(this).find("i").removeClass("fa-clipboard").addClass('fa-check-square-o');
	});

	//---------------------------------------------------------------------------------------------------CALENDAR

	//create existing rentals
	createExisting(listing_info.rentals);

	//---------------------------------------------------------------------------------------------------MODULES

	editRentalModule();
	findOtherDomains();
	createTrafficChart();

});

//functions to show different cards
function showCardContent(type){
	$(".checkout-card-content").addClass('is-hidden');
	$("#" + type + "-card-content").removeClass('is-hidden');
	if (type == "calendar"){
		$('#calendar').fullCalendar('render');
	}
}

function showNextCard(){
	var current_card = $(".checkout-card-content:not(.is-hidden)");
	current_card.addClass('is-hidden')
	var next_card = current_card.next(".checkout-card-content");
	next_card.removeClass('is-hidden');

	if (next_card.attr('id') == "calendar-card-content"){
		$('#calendar').fullCalendar('render');
	}
}

function showPrevCard(){
	var current_card = $(".checkout-card-content:not(.is-hidden)");
	current_card.addClass('is-hidden')
	var prev_card = current_card.prev(".checkout-card-content");
	prev_card.removeClass('is-hidden');

	if (prev_card.attr('id') == "calendar-card-content"){
		$('#calendar').fullCalendar('render');
	}
}

//helper function to check if everything is legit
function checkSubmit(){
	var newEvents = $('#calendar').fullCalendar('clientEvents', returnMineNotBG);
	var bool = true;

	if (!newEvents || newEvents.length == 0){
		bool = "Invalid dates!";
		errorHandler(bool);
	}
	else if (!$("#cc-num").val()){
		bool = "Invalid cc number!";
		$("#stripe-error-message").addClass('is-danger').html("Please provide a credit card to charge.");
	}
	else if (!$("#cc-exp").val()){
		bool = "Invalid cc exp!";
		$("#stripe-error-message").addClass('is-danger').html("Please provide your credit card expiration date.");
	}
	else if (!$("#cc-cvc").val()){
		bool = "Invalid cvc!";
		$("#stripe-error-message").addClass('is-danger').html("Please provide your credit card CVC number.");
	}
	else if (!$("#cc-zip").val()){
		bool = "Invalid zip Code!";
		$("#stripe-error-message").addClass('is-danger').html("Please provide a ZIP code.");
	}
	else if (newEvents.length > 0){
		for (var x = 0; x < newEvents.length; x++){
			if (!newEvents[x].old){
				var start = new Date(newEvents[x].start._d);
				if (isNaN(start)){
					bool = "Invalid dates!";
					errorHandler(bool);
					break;
				}
			}
		}
	}
	return bool;
}

//function to submit new rental info
function submitStripe(stripeToken){
	if (checkSubmit() == true && unlock){
		var newEvents = $('#calendar').fullCalendar('clientEvents', returnMineNotBG);
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

		//create a new rental
		$.ajax({
			type: "POST",
			url: "/listing/" + listing_info.domain_name + "/rent",
			data: {
				events: minEvents,
				new_user_email: $("#new_user_email").val(),
				address: $("#address_form_input").val(),
				stripeToken: stripeToken
			}
		}).done(function(data){
			$('#checkout-button').removeClass('is-loading');
			unlock = true;
			if (data.unavailable){
				for (var x = 0; x < data.unavailable.length; x++){
					showCardContent("calendar");
					$('#calendar').fullCalendar('removeEvents', data.unavailable[x]._id);
					$("#calendar-error-message").addClass('is-danger').html("Invalid slots have been removed from your selection! Your credit card has not been charged yet.");
				}
			}
			else if (data.state == "success"){
				delete_cookies();
				successHandler(data);
			}
			else if (data.state == "error"){
				errorHandler(data.message);
			}
		});
	}
}

//error handler from server
function errorHandler(message){
	if (message == "Invalid address!"){
		showCardContent("address");
		$("#address-error-message").addClass('is-danger').html("Invalid URL entered! Your credit card has not been charged yet.");
	}
	else if (message == "Malicious address!"){
		showCardContent("address");
		$("#address-error-message").addClass('is-danger').html("Your URL has been deemed malicious! Please enter a different URL. Your credit card has not been charged yet.");
	}
	else if (message == "Invalid dates!"){
		showCardContent("calendar");
		$("#calendar-error-message").addClass('is-danger').html("Invalid dates selected! Your credit card has not been charged yet.");
	}
	else if (message == "Invalid email!"){
		showCardContent("checkout");
		$("#new-user-email-error").addClass('is-danger').html("Invalid email address! Your credit card has not been charged yet.");
	}
	else if (message == "Invalid price!"){
		showCardContent("checkout");
		$("#stripe-error-message").addClass('is-danger').html("Payment error! Your credit card has not been charged yet.");
	}
	else if (message == "Invalid stripe user account!"){
		showCardContent("checkout");
		$("#summary-error-message").addClass('is-danger').html("Listing error! Please try again later! Your credit card has not been charged yet.");
	}
	else {
		showCardContent("checkout");
		$("#summary-error-message").addClass('is-danger').html("Rental error! Please try again later! Your credit card has not been charged yet.");
	}

}

//success handler
function successHandler(data){
	$(".success-hide").addClass('is-hidden');
	$("#success-column").removeClass('is-hidden');
	$("#success-message").text("Your credit card was successfully charged!");
	//if theres a link for ownership claiming
	if (data.owner_hash_id){
		var url = "https://www.domahub.com/listing/" + listing_info.domain_name + "/" + data.rental_id + "/" + data.owner_hash_id;
		$("#rental-link-input").val(url);
		//$("#rental-link-href").prop('href', url);

		$("#rental-link-input").focus(function(){
			$(this).select();
		});
	}
	else {
		var url = "https://www.domahub.com/listing/" + listing_info.domain_name + "/" + data.rental_id;
		$("#rental-preview-button").href(url);
	}
}

//---------------------------------------------------------------------------------------------------LISTING MODULES

//function to create the traffic chart
function createTrafficChart(){
	if (listing_info.traffic){

		Chart.plugins.register({
		  beforeRender: function (chart) {
		    if (chart.config.options.showAllTooltips) {
		        // create an array of tooltips
		        // we can't use the chart tooltip because there is only one tooltip per chart
		        chart.pluginTooltips = [];
		        chart.config.data.datasets.forEach(function (dataset, i) {
		            chart.getDatasetMeta(i).data.forEach(function (sector, j) {
		                chart.pluginTooltips.push(new Chart.Tooltip({
		                    _chart: chart.chart,
		                    _chartInstance: chart,
		                    _data: chart.data,
		                    _options: chart.options.tooltips,
		                    _active: [sector]
		                }, chart));
		            });
		        });

		        // turn off normal tooltips
		        chart.options.tooltips.enabled = false;
		    }
		},
		  afterDraw: function (chart, easing) {
		    if (chart.config.options.showAllTooltips) {
		        // we don't want the permanent tooltips to animate, so don't do anything till the animation runs atleast once
		        if (!chart.allTooltipsOnce) {
		            if (easing !== 1)
		                return;
		            chart.allTooltipsOnce = true;
		        }

		        // turn on tooltips
		        chart.options.tooltips.enabled = true;
		        Chart.helpers.each(chart.pluginTooltips, function (tooltip) {
		            tooltip.initialize();
		            tooltip.update();
		            // we don't actually need this since we are not animating tooltips
		            tooltip.pivot();
		            tooltip.transition(easing).draw();
		        });
		        chart.options.tooltips.enabled = false;
		    }
		  }
		});

		//past six months only
		var traffic_data = [
			{
				x: moment().endOf("month").subtract(5, "month").valueOf(),
				y: 0
			},
			{
				x: moment().endOf("month").subtract(4, "month").valueOf(),
				y: 0
			},
			{
				x: moment().endOf("month").subtract(3, "month").valueOf(),
				y: 0
			},
			{
				x: moment().endOf("month").subtract(2, "month").valueOf(),
				y: 0
			},
			{
				x: moment().endOf("month").subtract(1, "month").valueOf(),
				y: 0
			},
			{
				x: moment().endOf("month").valueOf(),
				y: 0
			},
		];


		//split traffic into six months
		for (var x = 0; x < listing_info.traffic.length; x++){
			for (var y = 0; y < traffic_data.length; y++){
				if (listing_info.traffic[x].timestamp < traffic_data[y].x){
					traffic_data[y].y++;
					break;
				}
			}
		}

		var date_created = moment(listing_info.date_created);
		var last_deleted = 0;
		var start_month_views = 0;
		for (var y = 0; y < traffic_data.length; y++){
			console.log(listing_info.date_created, traffic_data[y].x, listing_info.date_created > traffic_data[y].x);
			if (listing_info.date_created > traffic_data[y].x){
				delete traffic_data[y].y;
				last_deleted = y;
			}
		}

		//only if the start month doesnt have 0 views
		if (traffic_data[last_deleted + 1].y != 0){
			traffic_data[last_deleted].y = 0;
		}

		//traffic dataset
		var traffic_dataset = {
			label: "Listing Views",
			xAxisID : "traffic-x",
			yAxisID : "traffic-y",
			borderColor: "#3CBC8D",
			backgroundColor: "#3CBC8D",
			fill: false,
			data: traffic_data
		}

		//create the super dataset containing traffic data and rentals data
		var all_datasets = [traffic_dataset];

		//create the labels array
		var monthly_labels = [];
		for (var y = 0; y < 6; y++){
			var temp_month = moment().subtract(y, "month").format("MMMM");
			monthly_labels.unshift(temp_month);
		}

		var last_rental_id;

		//loop through all rentals
		for (var y = 0; y < listing_info.rentals.length; y++){

			//add to existing dataset
			if (listing_info.rentals[y].rental_id == last_rental_id){
				var start_date = listing_info.rentals[y].date;
				var end_date = start_date + listing_info.rentals[y].duration;
				all_datasets[all_datasets.length - 1].data[1].x = end_date;
			}
			//create new dataset
			else {
				var temp_data = [];
				var start_date = listing_info.rentals[y].date;
				var end_date = start_date + listing_info.rentals[y].duration;

				//if the end date is after 6 months ago
				//if the start date is before now
				if (moment(new Date(end_date)).isAfter(moment().endOf("month").subtract(5, "month").startOf("month"))
					&& moment(new Date(start_date)).isBefore(moment())
			){
					var random_rental_color = randomColor({
					   format: 'rgba',
					   hue: "orange",
					   luminosity: "dark"
					});
					var temp_dataset = {
						label: "Rental #" + listing_info.rentals[y].rental_id,
						xAxisID : "rentals-x",
						yAxisID : "traffic-y",
						pointBackgroundColor: random_rental_color,
						pointHoverBackgroundColor: random_rental_color,
						backgroundColor: random_rental_color,
						data: [
							{
								x: start_date,
								y: listing_info.rentals[y].views
							},
							{
								x: end_date,
								y: listing_info.rentals[y].views
							}
						]
					}
					all_datasets.push(temp_dataset);
					last_rental_id = listing_info.rentals[y].rental_id;
				}
			}
		}

		//create the chart
		var myChart = new Chart($("#traffic-chart")[0], {
			type: 'line',
			data: {
				labels: monthly_labels,
				datasets: all_datasets
			},
			options: {
				legend: {
					display:false
				},
				responsive: true,
				// showAllTooltips: true,
				hover: {
					mode: "index"
				},
				tooltips: {
					titleSpacing: 0,
					callbacks: {
						label: function(tooltipItems, data) {
							if (tooltipItems.datasetIndex == 0 && tooltipItems.yLabel == 0){
								return "Listing created";
							}
							else if (monthly_labels.indexOf(tooltipItems.xLabel) != -1){
								return tooltipItems.xLabel
							}
							else {
								return moment(tooltipItems.xLabel).format("MMM DD");
							}
						},
						title: function(tooltipItems, data){
							if (tooltipItems[0].datasetIndex == 0 && tooltipItems[0].yLabel == 0){
								return false;
							}
							else if (monthly_labels.indexOf(tooltipItems[0].xLabel) != -1){
								return "Listing Traffic";
							}
							else {
								return (tooltipItems[0].index == 0) ? "Rental Start" : "Rental End";
							}
						},
						footer: function(tooltipItems, data){
							if (tooltipItems[0].datasetIndex == 0 && tooltipItems[0].yLabel == 0){
								return false;
							}
							else {
								var views_plural = (tooltipItems[0].yLabel == 1) ? " view" : " views"
								return tooltipItems[0].yLabel + views_plural;
							}
						}
					}
				},
				scales: {
					xAxes: [{
						id: "rentals-x",
						display: false,
						type: "time"
					}, {
						id: "traffic-x",
						type: "category"
					}],
					yAxes: [{
						id: "traffic-y",
						display: true,
						type: 'linear',
						ticks: {
							beginAtZero: true   // minimum value will be 0.
						}
					}]
				}
			 }
		});

	}
}

//other domains by same owner
function findOtherDomains(){
	$.ajax({
		url: "/listing/otherowner",
		method: "POST",
		data: {
			owner_id: listing_info.owner_id,
			domain_name_exclude: listing_info.domain_name
		}
	}).done(function(data){
		if (data.state == "success"){
			$("#otherowner-domains").removeClass('is-hidden');
			$("#otherowner-domains-title").text("Other Domains By " + listing_info.username);
			for (var x = 0; x < data.listings.length; x++){
				var cloned_similar_listing = $("#otherowner-domain-clone").clone();
				cloned_similar_listing.removeAttr("id").removeClass('is-hidden');

				//edit it based on new listing info
				if (data.listings[x].domain_name.length + 4 + data.listings[x].price_rate.toString().length + data.listings[x].price_type.length > 30){
					var sliced_domain = data.listings[x].domain_name.slice(0,15) + "...";
				}
				else {
					var sliced_domain = data.listings[x].domain_name;
				}

				cloned_similar_listing.find(".otherowner-domain-price").text("$" + data.listings[x].price_rate + " / " + data.listings[x].price_type);
				cloned_similar_listing.find(".otherowner-domain-name").text(sliced_domain).attr("href", "/listing/" + data.listings[x].domain_name);
				$("#otherowner-domain-table").append(cloned_similar_listing);
			}
		}
	})
}

//---------------------------------------------------------------------------------------------------RENTAL EXAMPLES MODULE

//function to create popular rentals module
function editRentalModule(){
	var popular_rental;
	for (var x = 0; x < listing_info.rentals.length; x++){
		var max_views = 0;
		if (listing_info.rentals[x].views > max_views){
			popular_rental = listing_info.rentals[x];
		}
	}
	if (popular_rental){
		$("#popular-rental-duration").text(aggregateDateDuration(popular_rental.rental_id));
		$("#popular-rental-views").text(popular_rental.views + " Views");

		//async image load
		var popular_screenshot = new Image();
		popular_screenshot.onload = function(){
			$("#popular-rental-img").attr("src", this.src);
		}

		var background_image = (popular_rental.address == "") ? "https://placeholdit.imgix.net/~text?txtsize=20&txt=NO%20PREVIEW&w=800&h=400" : "/screenshot?rental_address=" + popular_rental.address;
		background_image = (popular_rental.address.match(/\.(jpeg|jpg|gif|png)$/) != null) ? popular_rental.address : background_image;
		popular_screenshot.src = background_image;
	}

	editPreviousRentalModule(popular_rental);
}

//function to create previous rentals module
function editPreviousRentalModule(popular_rental){
	if (listing_info.rentals.length){
		var total_to_show = Math.min(5, listing_info.rentals.length);
		var already_shown = [];
		var x = 0;
		var now = moment();
		while (already_shown.length < total_to_show){
			var end_moment = moment(listing_info.rentals[x].date + listing_info.rentals[x].duration);

			//rental is in the past, rental is not the trending rental, rental is not already showing
			if (end_moment.isBefore(now) && listing_info.rentals[x].rental_id != popular_rental.rental_id && already_shown.indexOf(listing_info.rentals[x].rental_id) == -1){
				var previous_clone = $("#previous-rentals-clone").clone().removeAttr('id').removeClass('is-hidden');

				//update clone specific data
				previous_clone.attr("href", "/listing/" + listing_info.domain_name + "/" + listing_info.rentals[x].rental_id);
				previous_clone.find(".previous-rental-duration").text(aggregateDateDuration(listing_info.rentals[x].rental_id));
				var plural_or_single = (listing_info.rentals[x].views == 1) ? " view" : " views";
				previous_clone.find(".previous-rental-views").text(listing_info.rentals[x].views + plural_or_single);

				$("#previous-rentals-table").append(previous_clone);
				already_shown.push(listing_info.rentals[x].rental_id);
			}
			x++;

			//if we've looped through all rentals and still cant show any of them
			if (x == listing_info.rentals.length){
				break;
			}
		}

		//if nothing is showing, then hide the module
		if (already_shown.length == 0){
			$("#previous-rentals-module").addClass('is-hidden');
		}
	}
}

//function to find start time, end time, and total duration of a rental
function aggregateDateDuration(rental_id){
	var startDate = 0;
	var totalDuration = 0;
	for (var x = 0; x < listing_info.rentals.length; x++){
		if (listing_info.rentals[x].rental_id == rental_id){
			startDate = (startDate == 0 || listing_info.rentals[x].date < startDate) ? listing_info.rentals[x].date : startDate;
			totalDuration += listing_info.rentals[x].duration;
		}
	}
	return Math.ceil(moment.duration(totalDuration).as(listing_info.price_type)) + " " + listing_info.price_type.capitalizeFirstLetter() + " Rental";
}

//to cap the first letter
String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}
