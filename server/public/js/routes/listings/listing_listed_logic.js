<<<<<<< HEAD
var unlock = true;
=======
var myPath;
>>>>>>> development

$(document).ready(function() {

	//---------------------------------------------------------------------------------------------------TYPED PATH

	//focus to hide the click me message
	$("#typed-slash").on("focus", function(){
		//remove the disabled on check availability button
		$("#check-avail").removeClass('is-disabled');
		$("#input-tooltip").addClass('is-hidden');
		$(this).addClass('is-active');

		//select all on existing path
		$("#typed-slash").select();
	}).on("focusout", function(){
		if ($("#typed-slash").val() == ""){
			$("#input-tooltip").removeClass('is-hidden');
		}
		$(this).removeClass('is-active');

		//re-add the calendar event handler if path changed
		if (myPath != undefined && myPath != $("#typed-slash").val()){
			//remove any existing date range pickers
			if ($("#calendar").data('daterangepicker')){
				$("#calendar").data('daterangepicker').remove();
			}

			$("#calendar").val("");
			$("#checkout-button").addClass('is-disabled');

			$("#calendar").off("click").on("click", function(){
				getTimes($(this));
			});
		}
	});

	//tooltip appears too fast, hide until the above handler is in place.
	$("#input-tooltip").fadeIn('slow');

	//function for input text validation and tooltip change
	$("#typed-slash").on("keypress", function(e) {
		var inp = String.fromCharCode(event.keyCode);
		//regex for alphanumeric
		var validChar = /^[0-9a-zA-Z]+$/;

		//logic to check alphanumeric input value
		if (!inp.match(validChar) && e.keyCode != 13) {
			e.preventDefault();
			$("#input-tooltip-error").removeClass("is-hidden");
		}
		else if (e.keyCode == 13){
			e.preventDefault();
			$("#input-tooltip-error").addClass("is-hidden");
		}
		else {
			$("#input-tooltip-error").addClass("is-hidden");
		}
	}).on('keyup', function(e){
		var validChar = /^[0-9a-zA-Z]+$/;

		//enter to see calendar
		if (e.keyCode == 13 && ($(this).val().match(validChar) || $(this).val() == "")){
			e.preventDefault();
			//unfocus the typed JS
			$(this).blur();

			//first time getting calendar
			if ($("#check-avail").is(":visible")){
				$("#check-avail").click();
			}

			//get new calendar if mypath is different
			else if (myPath != $(this).val()) {
				getTimes($(this));
			}

			//show if mypath is the same
			else {
				$("#calendar").data('daterangepicker').show();
			}
		}
	});

	//typed JS
	$(function(){
		var typed_options = {
			typeSpeed: 40,
			attr: "placeholder"
		};
		if (listing_info.paths == "" || !listing_info.paths){
			typed_options.strings = [
				"thing",
				"something",
				"ANYTHING"
			]
		}
		else {
			typed_options.strings = listing_info.paths.split(",");
			typed_options.loop = true;
			typed_options.shuffle = true;
		}
		$("#typed-slash").typed(typed_options);
	});

	//---------------------------------------------------------------------------------------------------CALENDAR AND TIMES

	//show calendar or unavailable description
	$("#check-avail").on("click", function(e) {
		e.preventDefault();
		$("#desc-avail-module").addClass('is-hidden');
		$(".post-description-module").removeClass('is-hidden');

		if (listing_info.status == 1){
			//show calendar
			getTimes($(this));
		}
	});

	//submit times (redirect to checkout)
	$("#checkout-button").on("click", function(){
		submitTimes($(this));
	});

	//prevent typing on calendar
	$("#calendar").on("keydown", function(e){
		e.preventDefault();
	});
});

//<editor-fold>-------------------------------SUBMIT TIMES-------------------------------

//helper function to check if everything is legit
function checkTimes(){
	var startDate = $("#calendar").data('daterangepicker').startDate;
	var endDate = $("#calendar").data('daterangepicker').endDate.clone().add(1, "millisecond");
	console.log(startDate.format("MMM,DD,HH:mm"), endDate.format("MMM,DD,HH:mm"));
	if (!startDate.isValid() || !endDate.isValid()){
		$("#calendar-error-message").removeClass('is-hidden').addClass('is-danger').html("Invalid dates selected!");
	}
<<<<<<< HEAD
	else if (!$("#cc-num").val() && listing_info.price_rate != 0){
		bool = "Invalid cc number!";
		$("#stripe-error-message").addClass('is-danger').html("Please provide a credit card to charge.");
	}
	else if (!$("#cc-exp").val() && listing_info.price_rate != 0){
		bool = "Invalid cc exp!";
		$("#stripe-error-message").addClass('is-danger').html("Please provide your credit card expiration date.");
	}
	else if (!$("#cc-cvc").val() && listing_info.price_rate != 0){
		bool = "Invalid cvc!";
		$("#stripe-error-message").addClass('is-danger').html("Please provide your credit card CVC number.");
	}
	else if (!$("#cc-zip").val() && listing_info.price_rate != 0){
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
=======
	else {
		return {
			starttime : startDate._d.getTime(),
			endtime : endDate._d.getTime()
		};
>>>>>>> development
	}
}

//function to submit new rental info
<<<<<<< HEAD
function submitNewRental(stripeToken){
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
=======
function submitTimes(checkout_button){
	//remove event handler
	checkout_button.off();
	checkout_button.addClass('is-loading');
	var newEvent = checkTimes();

	if (newEvent.starttime && newEvent.endtime){
		//redirect to checkout page
>>>>>>> development
		$.ajax({
			type: "POST",
			url: "/listing/" + listing_info.domain_name + "/checkout",
			data: {
				starttime: newEvent.starttime,
				endtime: newEvent.endtime,
				path: $("#typed-slash").val()
			}
		}).done(function(data){
			checkout_button.removeClass('is-loading');
			if (data.state == "success"){
				window.location.assign(window.location.origin + "/listing/" + listing_info.domain_name + "/checkout");
			}
			else if (data.state == "error"){
				$("#calendar-regular-message").addClass('is-hidden');
				errorHandler(data.message);
				checkout_button.on('click', function(){
					submitTimes(checkout_button);
				});

				//re-add calendar event handler to fetch new events
				$("#calendar").off('click').on("click", function(){
					getTimes($(this));
				});
			}
		});
	}
}

//handler for various error messages
function errorHandler(message){
<<<<<<< HEAD
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
		$("#rental-preview-button").attr("href", url);
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
=======
	switch (message){
		case "Dates are unavailable!":
			//remove any existing date range pickers
			if ($("#calendar").data('daterangepicker')){
				$("#calendar").data('daterangepicker').remove();
>>>>>>> development
			}
			$("#calendar-error-message").removeClass('is-hidden').text("Bummer! Someone just took that slot. Please select a different time.");
			break;
		case "Invalid dates!":
		case "Invalid dates! No times posted!":
		case "Invalid dates! Not valid dates!":
		case "Not divisible by hour blocks!":
		case "Start time in the past!":
		case "Invalid end time!":
		case "Invalid start time!":
            $("#calendar-error-message").removeClass('is-hidden').text("You have selected an invalid time! Please refresh the page and try again.");
			break;
		default:
            $("#calendar-error-message").removeClass('is-hidden').text("Oh no, something went wrong! Please refresh the page and try again.");
            break;
    }
}

//</editor-fold>

//<editor-fold>-------------------------------CALENDAR SET UP>-------------------------------

//function to get times from the server
function getTimes(calendar_elem){
	//renting top level, hide tooltip
	if ($("#typed-slash").val() == ""){
		$("#input-tooltip").addClass('is-hidden');
		$("#typed-slash").addClass('is-active');
	}

	//now loading messages
	$("#calendar").addClass('is-disabled');
	$("#calendar-loading-message").removeClass('is-hidden');
	loadingDots($("#calendar-loading-message"));
	$("#calendar-regular-message").addClass('is-hidden');

	//loading dates message
	calendar_elem.off("click");

	$.ajax({
		url: "/listing/" + listing_info.domain_name + "/times",
		method: "POST",
		data: {
			path: $("#typed-slash").val()
		}
	}).done(function(data){
		$("#calendar").removeClass('is-disabled');
		$("#calendar-loading-message").addClass('is-hidden');
		clearLoadingDots($("#calendar-loading-message"));
		$("#calendar-regular-message").removeClass('is-hidden');

		//got the future events, go ahead and create the calendar
		if (data.state == "success" && data.times){
			listing_info.rental_moments = [];
			for (var x = 0; x < data.times.length; x++){
				listing_info.rental_moments.push({
					start : moment(data.times[x].date),
					end : moment(data.times[x].date + data.times[x].duration),
				});
			}

			//only show new calendar if path changed
			if (myPath != $("#typed-slash").val() || !$("#calendar").data('daterangepicker')){
				myPath = $("#typed-slash").val();
				setUpCalendar(listing_info);
			}
			else {
				$("#calendar").focus().data('daterangepicker').show();
			}
		}
		else {
			errorHandler("");
		}

	});
}

//function to setup the calendar
function setUpCalendar(listing_info){
    //create a new range picker based on new path rental availability
    var start_date = moment();
    var end_date = moment().endOf(listing_info.price_type).add(1, "millisecond");

    $('#calendar').daterangepicker({
        opens: "center",
        autoApply: true,
        autoUpdateInput: false,
        locale: {
            // format: 'MM/DD/YYYY h:mmA'
            format: 'MM/DD/YYYY'
        },
        // timePicker: true,
        // timePickerIncrement: 60,

        minDate: moment().endOf("hour").add(1, "millisecond").add(1, "hour"),
        maxDate: moment().endOf("hour").add(1, "millisecond").add(1, "year"),

        isInvalidDate: function(curDate){
            if (curDate.isAfter(moment())){
                var bool = checkIfNotOverlapped(curDate);
                return bool;
            }
            else {
                return true;
            }
        }
    });

    //update when applying new dates
    $('#calendar').on('apply.daterangepicker', function(ev, picker) {
		//picked today to start
		if (picker.startDate.startOf("day").isSame(moment().startOf("day"))){
			picker.startDate = moment().startOf("hour");
		}

        if (picker.startDate.isValid() && picker.endDate.isValid()){
            updatePrices();
            $(this).val(picker.startDate.format('MMM D, YYYY') + ' - ' + picker.endDate.format('MMM D, YYYY'));
            $("#checkout-button").removeClass('is-disabled');
        }
        else {
            $(this).val("");
            $("#checkout-button").addClass('is-disabled');
        }
    });

    //to figure out what events are already existing in given view
    $('#calendar').on('show.daterangepicker', function(ev, picker) {
        //remove any error messages
        $("#calendar-regular-message").removeClass('is-hidden');
        $("#calendar-error-message").addClass('is-hidden');

		//renting top level, hide tooltip
		if ($("#typed-slash").val() == ""){
			$("#input-tooltip").addClass('is-hidden');
			$("#typed-slash").addClass('is-active');
		}
    });

    $("#calendar").data('daterangepicker').show();
}

//helper function to make sure theres nothing overlapping this event
function checkIfNotOverlapped(event){
    var overlap = 0;
    for (var x = 0; x < listing_info.rental_moments.length; x++){
        var rental_start = listing_info.rental_moments[x].start;
        var rental_end = listing_info.rental_moments[x].end;

        //include start, exclude end
        if (event.isBetween(rental_start, rental_end, listing_info.price_type, "[)")){
            overlap++;
        }
    }
    return overlap != 0;
}

//helper function to get correct price of events
function updatePrices(){
	if (listing_info.status){
        var startDate = $("#calendar").data('daterangepicker').startDate;
    	var endDate = $("#calendar").data('daterangepicker').endDate.clone().add(1, "millisecond");

		//calculate the price
        var totalPrice = moment.duration(endDate.diff(startDate));
        if (listing_info.price_type == "month"){
            totalPrice = totalPrice.asDays() / 30;
        }
        else {
            totalPrice = totalPrice.as(listing_info.price_type);
            totalPrice = Number(Math.round(totalPrice+'e2')+'e-2');
        }
        totalPrice = totalPrice * listing_info.price_rate;

        //price or price per day
        if (totalPrice == 0 && listing_info.price_rate != 0){
            $("#checkout-button").addClass('is-disabled');
            $("#price").text("$" + listing_info.price_rate + " Per " + listing_info.price_type.capitalizeFirstLetter());
        }
        else {
            $("#checkout-button").removeClass('is-disabled');

            //animation for counting numbers
            $("#price").prop('Counter', $("#price").prop('Counter')).stop().animate({
                Counter: totalPrice
            }, {
                duration: 100,
                easing: 'swing',
                step: function (now) {
                    if (listing_info.price_rate != 0){
                        $(this).text("Total: $" + Number(Math.round(now+'e2')+'e-2').toFixed(2));
                    }
                }
            });
        }
	}
}

//</editor-fold>
