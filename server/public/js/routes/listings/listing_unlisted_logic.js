var myChart;
var myPath;

$(document).ready(function() {

	//---------------------------------------------------------------------------------------------------MODULES AND TABS

	editTickerModule();
	editTrafficModule();
	moreInfoModule();
});

//---------------------------------------------------------------------------------------------------RENTAL TICKER MODULE

//function to create popular rentals module
function editTickerModule(){
	if (listing_info.rentals && listing_info.rentals.length > 0){
		var total_to_show = listing_info.rentals.length;
		var already_shown = [];
		var x = 0;
		var now = moment();
		while (already_shown.length < total_to_show){
			var start_moment = moment(listing_info.rentals[x].date);

			// rental is not already showing / is not in the future
			if (already_shown.indexOf(listing_info.rentals[x].rental_id) == -1 && now.isAfter(start_moment)){
				var end_moment = moment(listing_info.rentals[x].date + listing_info.rentals[x].duration);
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
				else {
					ticker_pre_tense = "has been "
					ticker_verb_tense = "ing";
					var ticker_time = " for the past <span>" + moment.duration(now.diff(start_moment)).humanize() + "</span>";
					ticker_views_plural = ticker_views_plural.replace("in ", "");
					ticker_reach = "--reaching <span class='is-primary'>" + ticker_views_format + "</span>" + ticker_views_plural;

					//where have they been sending traffic??
					var rental_preview = "http://" + listing_info.domain_name;
				}

				//update time / reach
				ticker_clone.find(".ticker-time").html(ticker_time);
				ticker_clone.find(".ticker-reach").html(ticker_reach);

				var ticker_icon_color = ticker_clone.find(".ticker-icon-color");
				var ticker_icon = ticker_clone.find(".ticker-icon");

				//redirect content to display on that domain
				if (listing_info.rentals[x].type == 0){

					//showing an image
					if (listing_info.rentals[x].address.match(/\.(jpeg|jpg|png|bmp)$/) != null){
						var ticker_type = ticker_pre_tense + "display" + ticker_verb_tense + " <a href=" + rental_preview + " class='is-accent is-underlined'>an image</a> on this website";
						ticker_icon_color.addClass('is-purple');
						ticker_icon.addClass('fa-camera-retro');
					}

					//showing a GIF
					else if (listing_info.rentals[x].address.match(/\.(gif)$/) != null){
						var ticker_type = ticker_pre_tense + "display" + ticker_verb_tense + " <a href=" + rental_preview + " class='is-accent is-underlined'>a GIF</a> on this website";
						ticker_icon_color.addClass('is-info');
						ticker_icon.addClass('fa-smile-o');
					}

					//showing a PDF
					else if (listing_info.rentals[x].address.match(/\.(pdf)$/) != null){
						var ticker_type = ticker_pre_tense + "display" + ticker_verb_tense + " <a href=" + rental_preview + " class='is-accent is-underlined'>a PDF</a> on this website";
						ticker_icon_color.addClass('is-danger');
						ticker_icon.addClass('fa-pdf-o');
					}

					//showing a website
					else if (listing_info.rentals[x].address){
						var ticker_address = getHost(listing_info.rentals[x].address);
						var ticker_type = ticker_pre_tense + "display" + ticker_verb_tense + " content from <a href=" + rental_preview + " class='is-accent is-underlined'>" + ticker_address + "</a>";
						ticker_icon_color.addClass('is-primary');
						ticker_icon.addClass('fa-external-link');
					}

					//showing nothing
					else {
						var ticker_type = ticker_pre_tense + "display" + ticker_verb_tense + " nothing on this website";
						ticker_icon_color.addClass('is-black');
						ticker_icon.addClass('fa-times-circle-o');
					}
				}
				//forward the domain
				else {
					var ticker_address = getHost(listing_info.rentals[x].address);
					var ticker_type = ticker_pre_tense + "forward" + ticker_verb_tense + " this website to <a href=" + listing_info.rentals[x].address + " class='is-accent is-underlined'>" + ticker_address + "</a>";
					ticker_icon_color.addClass('is-accent');
					ticker_icon.addClass('fa-share-square');
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
	}
	else {
		$("#ticker-empty").removeClass('is-hidden');
	}
}

//function to create popular rental
function editPopularRental(){
	if (listing_info.rentals.length > 0){
		var popular_rental = listing_info.rentals[0];
		for (var x = 0; x < listing_info.rentals.length; x++){
			if (listing_info.rentals[x].views > popular_rental.views){
				popular_rental = listing_info.rentals[x];
			}
		}
	}
	if (popular_rental && $("#popular-rental-card").length > 0){
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

//---------------------------------------------------------------------------------------------------TRAFFIC MODULE

//function to create the traffic chart module
function editTrafficModule(){
	// //how many people in the past month
	// $("#views-total").text(wNumb({
	// 	thousand: ','
	// }).to(traffic_data[0].y));
}

//function to initiate chart only if uninitiated
function createTrafficChart(){
	if (!myChart && listing_info.traffic){
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
			label: "Website Views",
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
					   format: 'rgb',
					   hue: "green",
					   luminosity: "dark"
				   }).replace(")", ",0.5)").replace("rgb", "rgba");
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
		myChart = new Chart($("#traffic-chart"), {
			type: 'line',
			data: {
				labels: monthly_labels,
				datasets: all_datasets
			},
			options: {
				animation : false,
				legend: {
					display:false
				},
				responsive: true,
				maintainAspectRatio: true,
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

//---------------------------------------------------------------------------------------------------MORE INFORMATION MODULE

//function for the more information module
function moreInfoModule(){
	findOtherDomains();

	//user since date in about owner
	$("#user-since").text(moment(new Date(listing_info.user_created)).format("MMMM, YYYY"));
}

//other domains by same owner
function findOtherDomains(){
	if ($("#otherowner-domains").length > 0){
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
				$("#otherowner-domains-title").text("More From This Owner");
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
		});
	}
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