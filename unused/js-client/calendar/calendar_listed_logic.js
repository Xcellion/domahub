
//----------------------------------------------------------------------------------------------------------------PRICE CALCULATION

//helper function to get correct price of events
function eventPrices(){
	if (listing_info.status){
		var myevents = $('#calendar').fullCalendar('clientEvents', filterMine);
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
