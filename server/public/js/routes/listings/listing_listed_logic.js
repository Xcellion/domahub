$(document).ready(function() {
	setUpCalendar(listing_info);

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
	}
	else {
		delete_cookies();
	}

	//user since date in About Owner
	$("#user-since").text(moment(new Date(listing_info.user_created)).format("MMMM, YYYY"));

	//submit times (redirect to checkout)
	$("#checkout-button").on("click", function(){
		submitTimes($(this));
	});

	//check rental times (for mobile only)
	$("#start-card-button").on('click', function(){
		$("#start-card-content").addClass('is-hidden');
		$("#calendar-card-content").removeClass('is-hidden-mobile');
	});

	//---------------------------------------------------------------------------------------------------MODULES
	findOtherDomains();
	editRentalModule();
	createTrafficChart();
});

//helper function to check if everything is legit
function checkTimes(){
	var startDate = $("#calendar").data('daterangepicker').startDate;
	var endDate = $("#calendar").data('daterangepicker').endDate.clone().add(1, "millisecond");

	if (!startDate.isValid() || !endDate.isValid()){
		$("#calendar-error-message").removeClass('is-hidden').addClass('is-danger').html("Invalid dates selected!");
	}
	else {
		return [{
			start : startDate._d.getTime(),
			end : endDate._d.getTime()
		}];
	}
}

//function to submit new rental info
function submitTimes(checkout_button){
	//remove event handler
	checkout_button.off();
	checkout_button.addClass('is-loading');
	var newEvents = checkTimes();

	if (newEvents){
		console.log(newEvents);
		//redirect to checkout page
		$.ajax({
			type: "POST",
			url: "/listing/" + listing_info.domain_name + "/checkout",
			data: {
				events: newEvents
			}
		}).done(function(data){
			checkout_button.removeClass('is-loading');
			unlock = true;
			if (data.unavailable){
				for (var x = 0; x < data.unavailable.length; x++){
					$('#calendar').fullCalendar('removeEvents', data.unavailable[x]._id);
					$("#calendar-error-message").removeClass('is-hidden').addClass('is-danger').html("Invalid slots have been removed from your selection!");
				}
				checkout_button.on('click', function(){
					submitTimes(checkout_button);
				});
			}
			else if (data.state == "success"){
				window.location.assign(window.location.origin + "/listing/" + listing_info.domain_name + "/checkout");
			}
			else if (data.state == "error"){
				$("#calendar-error-message").removeClass('is-hidden').addClass('is-danger').html("Something went wrong with the rental! Please try again.");
				checkout_button.on('click', function(){
					submitTimes(checkout_button);
				});
			}
		});
	}
}


//---------------------------------------------------------------------------------------------------LISTING MODULES

//function to create the traffic chart
function createTrafficChart(){
	if (listing_info.traffic){

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
			var temp_month = moment().subtract(y, "month").format("MMM");
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
				hover: {
					mode: "index"
				},
				tooltips: {
					titleSpacing: 0,
					callbacks: {
						label: function(tooltipItems, data) {
							if (tooltipItems.datasetIndex == 0 && tooltipItems.yLabel == 0){
								return "Created";
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
								return false;
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
			$("#otherowner-domains-title").text("Other Websites By " + listing_info.username);
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
	if (listing_info.rentals.length > 0){
		var popular_rental = listing_info.rentals[0];
		for (var x = 0; x < listing_info.rentals.length; x++){
			if (listing_info.rentals[x].views > popular_rental.views){
				popular_rental = listing_info.rentals[x];
			}
		}
	}
	if (popular_rental){
		$("#popular-rental-duration").text(aggregateDateDuration(popular_rental.rental_id));
		$("#popular-rental-preview").attr("href", "/listing/" + listing_info.domain_name + "/" + popular_rental.rental_id);
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

	editExampleRentalModule(popular_rental);
}

//function to create previous rentals module
function editExampleRentalModule(popular_rental){
	if (listing_info.rentals.length){
		var total_to_show = Math.min(5, listing_info.rentals.length);
		var already_shown = [];
		var x = 0;
		var now = moment();
		while (already_shown.length < total_to_show){

			// rental is not already showing
			if (already_shown.indexOf(listing_info.rentals[x].rental_id) == -1){
				var end_moment = moment(listing_info.rentals[x].date + listing_info.rentals[x].duration);
				var start_moment = moment(listing_info.rentals[x].date);
				var ticker_clone = $("#ticker-clone").clone().removeAttr('id').removeClass('is-hidden');

				//user name or anonymous
				var ticker_user = (listing_info.rentals[x].username) ? listing_info.rentals[x].username : "An anonymous user";
				ticker_clone.find(".ticker-user").text(ticker_user + " ");

				//views / reach
				var ticker_time = "<span>" + moment.duration(listing_info.rentals[x].duration, "milliseconds").humanize() + "</span>";
				var ticker_reach = "";

				if (listing_info.rentals[x].views > 0){
					var ticker_views_plural = (listing_info.rentals[x].views == 1) ? " person in " : " people in ";
					var ticker_views_format = wNumb({
						thousand: ','
					}).to(listing_info.rentals[x].views);
					var ticker_reach = "--reaching <span class='is-primary'>" + ticker_views_format + "</span>" + ticker_views_plural;
				}
				else {
					ticker_time = " for " + ticker_time;
				}

				//word tense
				var ticker_pre_tense = "";
				var ticker_verb_tense = "";

				//rental is in the past
				if (end_moment.isBefore(now)){
					ticker_verb_tense = "ed";

					//where have they sent traffic??
					var rental_preview = "/listing/" + listing_info.domain_name + "/" + listing_info.rentals[x].rental_id;
				}
				//rental ends in the future but started in the past
				else if (now.isAfter(start_moment)){
					ticker_pre_tense = "has been "
					ticker_verb_tense = "ing";
					var ticker_time = " for the past <span class='is-bold'>" + moment.duration(now.diff(start_moment)).humanize() + "</span>";
					ticker_views_plural = ticker_views_plural.replace("in ", "");
					ticker_reach = "--reaching <span class='is-primary'>" + ticker_views_format + "</span>" + ticker_views_plural;

					//where have they been sending traffic??
					var rental_preview = "http://" + listing_info.domain_name;
				}

				//update time / reach
				ticker_clone.find(".ticker-time").html(ticker_time);
				ticker_clone.find(".ticker-reach").html(ticker_reach);

				//redirect content to display on that domain
				if (listing_info.rentals[x].type == 0){
					if (listing_info.rentals[x].address.match(/\.(jpeg|jpg|png|bmp)$/) != null){
						var ticker_type = ticker_pre_tense + "display" + ticker_verb_tense + " <a href=" + rental_preview + " class='is-accent is-underlined'>an image</a> on this domain";
					}
					else if (listing_info.rentals[x].address.match(/\.(gif)$/) != null){
						var ticker_type = ticker_pre_tense + "display" + ticker_verb_tense + " <a href=" + rental_preview + " class='is-accent is-underlined'>a GIF</a> on this domain";
					}
					else if (listing_info.rentals[x].address){
						var ticker_address = getHost(listing_info.rentals[x].address);
						var ticker_type = ticker_pre_tense + "redirect" + ticker_verb_tense + " this domain to <a href=" + rental_preview + " class='is-accent is-underlined'>" + ticker_address + "</a>";
					}
					else {
						var ticker_type = ticker_pre_tense + "display" + ticker_verb_tense + " nothing on this domain";
					}
				}
				//forward the domain
				else {
					var rental_preview = getHost(listing_info.rentals[x].address);
					var ticker_type = ticker_pre_tense + "forward" + ticker_verb_tense + " this domain to <a href=" + rental_preview + " class='is-accent is-underlined'>" + ticker_address + "</a>";
				}
				ticker_clone.find(".ticker-type").html(ticker_type);

				//add the cloned ticker event
				$("#ticker-wrapper").prepend(ticker_clone);
				already_shown.push(listing_info.rentals[x].rental_id);
			}
			x++;

			//if we've looped through all rentals and still cant show any of them
			if (x == listing_info.rentals.length){
				break;
			}
		}

		//if something is showing, then un-hide the module
		if (already_shown.length > 0){
			$("#example-rentals-module").removeClass('is-hidden');
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

//get the hostname of a URL
function getHost(href) {
    var l = document.createElement("a");
    l.href = href;
    return l.hostname.replace("www.", "");
};
