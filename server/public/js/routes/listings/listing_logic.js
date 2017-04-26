var myChart;

$(document).ready(function() {

	//---------------------------------------------------------------------------------------------------TABS

	//switch tabs
	$(".tab").on("click", function(){
		var which_tab = $(this).attr("id").replace("-tab", "");

		//show the tab
		$(".tab").removeClass('is-active');
		$(this).addClass('is-active');

		//show the module
		$(".module").addClass('is-hidden');
		$("#" + which_tab + "-module").removeClass('is-hidden');
	});

	//---------------------------------------------------------------------------------------------------MODULES

	//initialize chart only if its not loaded yet
	$("#traffic-tab").bind("click.traffic", function(){
		createTrafficChart();
		getAlexaData();
		$(this).unbind("click.traffic");
	})

	//initialize info only if its not loaded yet
	$("#info-tab").bind("click.info", function(){
		findOtherDomains();
		$(this).unbind("click.info");
	})

	//initialize modules
	getTrafficData();
	getTickerData();

});

// //related domains
// function findRelatedDomains(){
// 	if ($("#similar-domains").length > 0){
// 		if (listing_info.categories){
// 			var categories_to_post = listing_info.categories;
// 			$("#similar-domains-title").text('Similar Websites');
// 		}
// 		else {
// 			var categories_to_post = "";
// 			$("#similar-domains-title").text('Other Websites');
// 		}
//
// 		$.ajax({
// 			url: "/listing/related",
// 			method: "POST",
// 			data: {
// 				categories: categories_to_post,
// 				domain_name_exclude: listing_info.domain_name
// 			}
// 		}).done(function(data){
// 			if (data.state == "success"){
// 				$("#similar-domains").removeClass('is-hidden');
// 				for (var x = 0; x < data.listings.length; x++){
// 					var cloned_similar_listing = $("#similar-domain-clone").clone();
// 					cloned_similar_listing.removeAttr("id").removeClass('is-hidden');
//
// 					//edit it based on new listing info
// 					cloned_similar_listing.find(".similar-domain-price").text("$" + data.listings[x].price_rate + " / " + data.listings[x].price_type);
// 					// var random_sig = Math.floor(Math.random()*1000);
// 					// var background_image = data.listings[x].background_image || "https://source.unsplash.com/category/nature/250x200?sig=" + random_sig;
// 					// cloned_similar_listing.find(".similar-domain-img").attr("src", background_image);
// 					cloned_similar_listing.find(".similar-domain-name").text(data.listings[x].domain_name).attr("href", "/listing/" + data.listings[x].domain_name);
// 					$("#similar-domain-table").append(cloned_similar_listing);
// 				}
// 			}
// 		});
// 	}
// }

//---------------------------------------------------------------------------------------------------RENTAL TICKER MODULE

//ajax call to get ticker information
function getTickerData(loadmore){

	//unlisted so no rentals exist
	if (listing_info.unlisted){
		listing_info.rentals = [];
		$("#ticker-loading").addClass('is-hidden');
		$("#ticker-empty").removeClass('is-hidden').appendTo("#ticker-wrapper");
	}
	else {
		//remove click handler for load more
		if (loadmore){
			$("#ticker-loading").removeClass('is-hidden').appendTo("#ticker-wrapper");
			loadmore.addClass('is-hidden').off();
		}

		//how many to load at a time;
		var max_count = 5;
		loadingDots($("#ticker-loading"));

		$.ajax({
			url: "/listing/" + listing_info.domain_name + "/ticker",
			method: "POST",
			data: {
				//how many to get
				max_count: max_count,
				//the oldest displayed rental on the ticker
				oldest_rental_date: (listing_info.rentals) ? listing_info.rentals[listing_info.rentals.length - 1].date : new Date().getTime()
			}
		}).done(function(data){
			//remove the loading message
			$("#ticker-loading").addClass('is-hidden');
			clearLoadingDots($("#ticker-loading"));

			if (data.state == "success"){
				//add to the session listing_info
				if (listing_info.rentals){
					listing_info.rentals = listing_info.rentals.concat(data.loaded_rentals);
				}
				else {
					listing_info.rentals = data.loaded_rentals;
				}
				editTickerModule(data.loaded_rentals, max_count);
				if (listing_info.rentals && listing_info.traffic){
					pastViewsTickerRow();
				}
			}
			else {
				$("#ticker-empty").removeClass('is-hidden');
			}
		});
	}
}

//edit ticker module with AJAX data
function editTickerModule(loaded_rentals, max_count){
	//if something was loaded
	if (loaded_rentals && loaded_rentals.length > 0){
		var now = moment();
		for (var x = 0; x < loaded_rentals.length; x++){
			createTickerRow(loaded_rentals[x], now);
		}

		//show load more only if max count returned
		if (loaded_rentals.length == max_count){
			$("#ticker-loadmore").removeClass('is-hidden').appendTo("#ticker-wrapper").on("click", function(){
				getTickerData($(this));
			});
		}
	}

	//nothing more to load if less than max_count returned
	if (!loaded_rentals || loaded_rentals.length < max_count){
		$("#ticker-empty").removeClass('is-hidden').appendTo("#ticker-wrapper");
	}
}

//function to create ticker row
function createTickerRow(rental, now){
	var start_moment = moment(rental.date);
	var end_moment = moment(rental.date + rental.duration);
	var ticker_clone = $("#ticker-clone").clone().removeAttr('id').removeClass('is-hidden');

	//user name or anonymous
	var ticker_user = (rental.username) ? rental.username : "An anonymous user";
	ticker_clone.find(".ticker-user").text(ticker_user + " ");

	//views / reach
	var ticker_time = "<span>" + moment.duration(rental.duration, "milliseconds").humanize() + "</span>";
	var ticker_reach = "";

	if (rental.views > 0){
		var ticker_views_plural = (rental.views == 1) ? " person in " : " people in ";
		var ticker_views_format = wNumb({
			thousand: ','
		}).to(rental.views);
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
		var rental_preview = "/listing/" + listing_info.domain_name + "/" + rental.rental_id;
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
	if (rental.type == 0){

		//showing an image
		if (rental.address.match(/\.(jpeg|jpg|png|bmp)$/) != null){
			var ticker_type = ticker_pre_tense + "display" + ticker_verb_tense + " <a href=" + rental_preview + " class='is-accent is-underlined'>an image</a> on this website";
			ticker_icon_color.addClass('is-info');
			ticker_icon.addClass('fa-camera-retro');
		}

		//showing a GIF
		else if (rental.address.match(/\.(gif)$/) != null){
			var ticker_type = ticker_pre_tense + "display" + ticker_verb_tense + " <a href=" + rental_preview + " class='is-accent is-underlined'>a GIF</a> on this website";
			ticker_icon_color.addClass('is-dark');
			ticker_icon.addClass('fa-smile-o');
		}

		//showing a PDF
		else if (rental.address.match(/\.(pdf)$/) != null){
			var ticker_type = ticker_pre_tense + "display" + ticker_verb_tense + " <a href=" + rental_preview + " class='is-accent is-underlined'>a PDF</a> on this website";
			ticker_icon_color.addClass('is-danger');
			ticker_icon.addClass('fa-pdf-o');
		}

		//showing a website
		else if (rental.address){
			var ticker_address = getHost(rental.address);
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
		var ticker_address = getHost(rental.address);
		var ticker_type = ticker_pre_tense + "forward" + ticker_verb_tense + " this website to <a href=" + rental.address + " class='is-accent is-underlined'>" + ticker_address + "</a>";
		ticker_icon_color.addClass('is-accent');
		ticker_icon.addClass('fa-share-square');
	}
	ticker_clone.find(".ticker-type").html(ticker_type);

	//add the cloned ticker event
	$("#ticker-wrapper").append(ticker_clone);
}

//callback function to create past views ticker row
function pastViewsTickerRow(){
	if (listing_info.rentals.length > 0 && listing_info.traffic){
		var last_month_views = listing_info.rentals.reduce(function(a,b){
			return {views: a.views + b.views};
		}).views + listing_info.traffic[0].views;
		var ticker_latest_date = moment.duration(moment().diff(moment(listing_info.rentals[listing_info.rentals.length - 1].date)), "milliseconds").humanize();
	}
	else {
		var last_month_views = listing_info.traffic[0].views;
		ticker_latest_date = "month";
	}

	//how many people in the past month
	$("#views-total").text(wNumb({
		thousand: ','
	}).to(last_month_views));

	$("#views-time").text(ticker_latest_date);
	$("#ticker-views").removeClass('is-hidden');
}

//---------------------------------------------------------------------------------------------------TRAFFIC MODULE

//function to get traffic data
function getTrafficData(){
	$.ajax({
		url: "/listing/" + listing_info.domain_name + "/traffic",
		method: "POST"
	}).done(function(data){
		//remove the loading message
		$("#traffic-loading").addClass('is-hidden');

		if (data.traffic){
			listing_info.traffic = data.traffic;
			createCharts(data.traffic);
		}
	});
}

//create empty or full chart
function createCharts(traffic){
	//create a chart with the traffic data
	if (traffic && traffic.length > 0){
		//destroy any old charts we've had
		if (myChart){
			myChart.destroy();
		}

		//X people viewed this in the past X
		if (listing_info.rentals && listing_info.traffic){
			pastViewsTickerRow();
		}
	}
	else {
		//hide the loading overlay
		$("#traffic-overlay-load").addClass('is-hidden');

		createEmptyChart();

		//not enough data overlay
		$("#traffic-overlay-text").removeClass('is-hidden');
	}
}

//function to create an empty chart
function createEmptyChart(){
	//create the monthly x-axis labels array
	var monthly_labels = [];
	var months_to_go_back = 6;
	for (var y = 0; y < months_to_go_back; y++){
		var temp_month = moment().subtract(y, "month").format("MMM");
		monthly_labels.unshift(temp_month);
	}

	//create the chart
	myChart = new Chart($("#traffic-chart"), {
		type: 'line',
		data: {
			labels: monthly_labels,
			datasets: []
		},
		options: {
			animation : false,
			legend: {
				display:false
			},
			responsive: true,
			onResize: function(controller, object){
				$("#traffic-overlay").css({
					"height" : object.height,
					"width" : object.width
				})
			},
			maintainAspectRatio: true,
			scales: {
				xAxes: [{
					type: "category"
				}],
				yAxes: [{
					display: true,
					type: 'linear',
					ticks: {
						beginAtZero: true   // minimum value will be 0.
					}
				}]
			}
		}
	});

	//unhide the overlay
	$("#traffic-overlay").css({
		"height" : $("#traffic-chart").height(),
		"width" : $("#traffic-chart").width()
	}).removeClass('is-hidden');
}

//function to initiate chart only if uninitiated
function createTrafficChart(){
	traffic = listing_info.traffic;

	//create the monthly x-axis labels array
	var monthly_labels = [];
	var months_to_go_back = traffic.length + 1 || 6;
	for (var y = 0; y < months_to_go_back; y++){
		var temp_month = moment().subtract(y, "month").format("MMM");
		monthly_labels.unshift(temp_month);
	}

	//create the base object for counting monthly traffic
	var traffic_data = [];
	for (var x = 0; x < traffic.length; x++){
		traffic_data.unshift({
			x: moment().endOf("month").subtract(x, "month").valueOf(),
			y: traffic[x].views
		});
	}
	traffic_data.unshift({
		x: moment().endOf("month").subtract(traffic.length, "month").valueOf(),
		y: 0
	});
	
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

	var last_rental_id;

	//loop through any rentals
	if (listing_info.rentals){
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
}

//create the chart
myChart = new Chart($("#traffic-chart"), {
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
		maintainAspectRatio: true,
		hover: {
			mode: "index"
		},
		tooltips: {
			titleSpacing: 0,
			callbacks: {
				label: function(tooltipItems, data) {
					if (monthly_labels.indexOf(tooltipItems.xLabel) != -1){
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
				type: "time",
				time: {
					format: 'MM/DD/YYYY HH:mm:SS'
				},
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

//---------------------------------------------------------------------------------------------------ALEXA MODULE

//function to get alexa data
function getAlexaData(){
	$.ajax({
		url: "/listing/" + listing_info.domain_name + "/alexa",
		method: "POST"
	}).done(function(data){
		createAlexa(data.alexa);
	});
}

//function to edit alexa information
function createAlexa(alexa){
	if (alexa){
		var globalrank = (alexa.globalRank == "-") ? "Not enough data!" : alexa.globalRank;
		$("#alexa-globalrank").text(globalrank);

		var bouncerate = (alexa.engagement && alexa.engagement.bounceRate == "-") ? "Not enough data!" : alexa.engagement.bouncerate;
		$("#alexa-bouncerate").text(bouncerate);

		var timeonsite = (alexa.engagement && alexa.engagement.dailyTimeOnSite == "-") ? "Not enough data!" : alexa.engagement.dailyTimeOnSite;
		$("#alexa-timeonsite").text(timeonsite);

		var pageviews = (alexa.engagement && alexa.engagement.dailyPageViewPerVisitor == "-") ? "Not enough data!" : alexa.engagement.dailyPageViewPerVisitor;
		$("#alexa-pageviews").text(pageviews);
	}
}

//---------------------------------------------------------------------------------------------------MORE INFORMATION MODULE

//other domains by same owner
function findOtherDomains(){
	if ($("#otherowner-domains").length > 0 && !listing_info.unlisted){
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

//keep appending dots to loading message
function loadingDots(elem){
	var max_dots = 5;
	var cur_dots = 0;
	var original_text = elem.text();

	elem.data("interval", window.setInterval(function(){
		elem.data("original_text", original_text);
		cur_dots++;
		elem.text(elem.text() + ".");

		if (cur_dots >= max_dots){
			cur_dots = 0;
			elem.text(original_text);
		}
	}, 100));
}

//function to stop the loading message interval
function clearLoadingDots(elem){
	clearInterval(elem.data("interval"));
	elem.text(elem.data("original_text"));
}
