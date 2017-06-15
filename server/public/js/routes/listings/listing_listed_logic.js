var myPath;
//to format a number for $$$$
var moneyFormat = wNumb({
	thousand: ',',
	prefix: '$',
	decimals: 0
});

$(document).ready(function() {
	$("#date_created").text(moment(listing_info.date_created).format("MMMM DD, YYYY"));

	//<editor-fold>-----------------------------------------------------------------------------------BUY NOW

	//buy now price tag
	if (listing_info.buy_price > 0){
		$("#buy-price").text("For sale - " + moneyFormat.to(listing_info.buy_price));
		$("#min-price").text(" (Minimum " + moneyFormat.to(listing_info.buy_price) + ")");
		$("#buy-price-tag").removeClass('is-hidden');
		$("#buy-button").removeClass('is-hidden');
	}

	showBuyStuff($("#buy-now-button"));
	$("#contact_phone").intlTelInput({
		utilsScript: "/js/jquery/utils.js"
	});

	//click buy now button or unavailable description
	$("#buy-now-button").on("click", function(e){
		showBuyStuff($(this));
	});

	$("#buy-now-form").on("submit", function(e){
		var type_of_submit = $("button[type=submit][clicked=true]").attr("name");
		e.preventDefault();

		// if (checkPhone()){
		if (true){
			$("button[type=submit][clicked=true]").addClass('is-loading');
			$(".notification").addClass('is-hidden');

			//send an offer / or buy it now request
			$.ajax({
				url: "/listing/" + listing_info.domain_name + "/contact/" + type_of_submit,
				method: "POST",
				data: {
					contact_email: $("#contact_email").val(),
					contact_name: $("#contact_name").val(),
					contact_phone: $("#contact_phone").intlTelInput("getNumber"),
					contact_offer: $("#contact_offer").val(),
					contact_message: $("#contact_message").val()
				}
			}).done(function(data){
				$("#buy-now-submit").removeClass('is-loading');

				if (data.state == "success"){
					if (type_of_submit == "offer"){
						$(".contact-input").addClass('is-disabled');
						$("#contact-success").removeClass('is-hidden');
						$("#buy-now-submit").addClass('is-hidden');
						$("#buy-now-form").off();
					}
					else {
						window.location.assign(window.location.origin + "/listing/" + listing_info.domain_name + "/checkout/buy");
					}
				}
				else {
					$("#contact-error").removeClass('is-hidden');
					$("#contact-error-message").text(data.message);
				}
			});

		}

	});

	//set the clicked attribute so we know which type of submit
	$("form button[type=submit]").on("click", function(e){
		$("form button[type=submit][clicked=true]").attr("clicked", false);
		$(this).attr('clicked', true);
	});

	//</editor-fold>

	if (listing_info.rentable){

		//click rent now or unavailable description
		$("#rent-now-button").on("click", function(e) {
			showRentalStuff($(this));
		});

		//<editor-fold>-----------------------------------------------------------------------------------TYPED PATH

		//focus to hide the click me message
		$("#typed-slash").on("focus", function(){
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

		//function for input text validation and tooltip change
		$("#typed-slash").on("keypress onkeypress", function(e) {
			var code = e.charCode || e.keyCode;
			var inp = String.fromCharCode(code);
			//regex for alphanumeric
			var validChar = /^[0-9a-zA-Z]+$/;

			//logic to check alphanumeric input value
			if (!inp.match(validChar) && code != 13 && code != 8) {
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
			var code = e.charCode || e.keyCode;

			var validChar = /^[0-9a-zA-Z]+$/;

			//enter to see calendar
			if (code == 13 && ($(this).val().match(validChar) || $(this).val() == "")){
				e.preventDefault();
				//unfocus the typed JS
				$(this).blur();

				//get new calendar if mypath is different
				if (myPath != $(this).val()) {
					getTimes($(this));
				}

				//show if mypath is the same
				else {
					$("#calendar").data('daterangepicker').show();
				}
			}
		});

		//pre-fill the path input
		if (getParameterByName("wanted")){
			$("#typed-slash").val(getParameterByName("wanted"));
		}

	//</editor-fold>

	//<editor-fold>-----------------------------------------------------------------------------------CALENDAR AND TIMES

		//if and any free times
		if (listing_info.freetimes && listing_info.freetimes.length > 0){
			var now = moment();
			var freetime_now;
			//loop and find out when is free
			for (var x = 0; x < listing_info.freetimes.length; x++){
				if (now.isBetween(moment(listing_info.freetimes[x].date), moment(listing_info.freetimes[x].date + listing_info.freetimes[x].duration))){
					freetime_now = listing_info.freetimes[x];
					break;
				}
			}

			//free now
			if (freetime_now){
				var until_date = moment(freetime_now.date + freetime_now.duration).format("MMM, DD");
				$("#free-until").removeClass('is-hidden').text("Free until " + until_date);
				$("#price").addClass('is-linethrough');
			}
		}

		//submit times (redirect to checkout)
		$("#checkout-button").on("click", function(){
			submitTimes($(this));
		});

		//prevent typing on calendar
		$("#calendar").on("keydown", function(e){
			e.preventDefault();
		});
	}

	//</editor-fold>

});

//<editor-fold>-------------------------------BUY NOW-------------------------------

//function to show buy now module
function showBuyStuff(buy_now_button){

	//hide the slash input
	$("#path-input").addClass("is-hidden");

	if (listing_info.status == 1){
		$("#unavailable-module").addClass('is-hidden');

		//fade out buy button, remove handler
		buy_now_button.off().addClass('is-disabled is-active');

		//re-attach rent now handler
		$("#rent-now-button").removeClass('is-disabled  is-active').off().on("click", function(){
			showRentalStuff($(this));
		});

		//show buy related stuff
		$(".post-buy-module").removeClass('is-hidden');
		$(".post-rent-module").addClass('is-hidden');
		$("#contact_name").focus();

		//get a random char phrase
		var random_char = random_characters[Math.floor(Math.random()*random_characters.length)];
		$("#contact_name").attr("placeholder", random_char.name);
		$("#contact_email").attr("placeholder", random_char.email);
		$("#contact_message").attr("placeholder", random_char.message + " Anyways, I'm interested in buying " + listing_info.domain_name + ". Let's chat.");

		//add a / to end of domain
		$("#domain-title").text(listing_info.domain_name);
	}
	else {
		$("#unavailable-module").removeClass('is-hidden');
	}

}

//function to show rental module
function showRentalStuff(rent_now_button){

	//fade out rent button, remove handler
	rent_now_button.off().addClass('is-disabled is-active');

	//re-attach rent now handler
	$("#buy-now-button").removeClass('is-disabled  is-active').off().on("click", function(){
		showBuyStuff($(this));
	});

	//show rental related stuff
	$(".post-rent-module").removeClass('is-hidden');
	$(".post-buy-module").addClass('is-hidden');

	//only if rentable
	if (listing_info.rentable){
		$("#unavailable-module").addClass('is-hidden');
		$("#path-input").removeClass("is-hidden");

		//get calendar times
		if (listing_info.status == 1){
			getTimes();
		}

		//add a / to end of domain
		$("#domain-title").text(listing_info.domain_name + "/");

		//tooltip appears too fast, fade it in
		$("#input-tooltip").fadeIn('slow');
		$("#typed-slash").attr("placeholder", "");

		//initiate typed JS
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
	}
	else {
		$("#unavailable-module").removeClass('is-hidden');
	}

}

//function to check phone number
function checkPhone(){
	if ($("#contact_phone").intlTelInput("isValidNumber")){
		return true;
	}
	else {
		$("#contact-error-message").text("That is not a valid phone number!");
		$("#contact-error").removeClass('is-hidden');
	}
}

//</editor-fold>

//<editor-fold>-------------------------------SUBMIT TIMES-------------------------------

//helper function to check if everything is legit
function checkTimes(){
	var startDate = $("#calendar").data('daterangepicker').startDate;
	var endDate = $("#calendar").data('daterangepicker').endDate.clone().add(1, "millisecond");

	if (!startDate.isValid() || !endDate.isValid()){
		$("#calendar-error-message").removeClass('is-hidden').addClass('is-danger').html("Invalid dates selected!");
	}
	else {
		return {
			starttime : startDate._d.getTime(),
			endtime : endDate._d.getTime()
		};
	}
}

function submitTimes(checkout_button){
	//remove event handler
	checkout_button.off();
	checkout_button.addClass('is-loading');
	var newEvent = checkTimes();

	if (newEvent.starttime && newEvent.endtime){
		//redirect to checkout page
		$.ajax({
			type: "POST",
			url: "/listing/" + listing_info.domain_name + "/checkoutrent",
			data: {
				starttime: newEvent.starttime,
				endtime: newEvent.endtime,
				path: $("#typed-slash").val()
			}
		}).done(function(data){
			checkout_button.removeClass('is-loading');
			if (data.state == "success"){
				window.location.assign(window.location.origin + "/listing/" + listing_info.domain_name + "/checkout/rent");
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
	$("#calendar-regular-message").addClass('is-hidden');

	switch (message){
		case "Dates are unavailable!":
			//remove any existing date range pickers
			if ($("#calendar").data('daterangepicker')){
				$("#calendar").data('daterangepicker').remove();
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
	//now loading messages
	$("#calendar").addClass('is-disabled');
	$("#calendar-loading-message").removeClass('is-hidden');
	loadingDots($("#calendar-loading-message"));
	$("#calendar-regular-message").addClass('is-hidden');
	$("#calendar-error-message").addClass('is-hidden');

	//loading dates message
	if (calendar_elem){
		calendar_elem.off("click");
	}

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
		alwaysShowCalendars: true,
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
        },

		//free times on calendar
		isCustomDate: function(curDate){
			if (curDate.isAfter(moment())){
				if (checkIfFree(curDate)){
					return "free-times";
				}
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
		$("#calendar-module").css("margin-bottom", $(".daterangepicker").height());
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

//helper function to check if overlaps a free period
function checkIfFree(event){
	var overlap = 0;
	for (var x = 0; x < listing_info.freetimes.length; x++){
		var freetime_start = moment(listing_info.freetimes[x].date);
		var freetime_end = moment(listing_info.freetimes[x].date + listing_info.freetimes[x].duration);

		//include start, exclude end
		if (event.isBetween(freetime_start, freetime_end, "day", "[)")){
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

		//any overlapped time with free times
		var overlappedTime = anyFreeDayOverlap(startDate, endDate);

		if (overlappedTime > 0){
			var origPrice = calculatePrice(totalPrice);
			var actual_price = totalPrice.subtract(overlappedTime, "milliseconds");
			var totalPrice = calculatePrice(actual_price);
		}
		else {
			var totalPrice = calculatePrice(totalPrice);
		}

        //price or price per day
        if (totalPrice == 0 && listing_info.price_rate != 0 && overlappedTime == 0){
			$("#total-price").addClass("is-hidden");
            $("#checkout-button").addClass('is-disabled');
            $("#actual-price").text("$" + listing_info.price_rate + " Per " + listing_info.price_type.capitalizeFirstLetter());
        }
        else {
			$("#total-price").removeClass("is-hidden");
            $("#checkout-button").removeClass('is-disabled');

			if (origPrice){
				$("#orig-price").removeClass('is-hidden');
				countPrice($("#orig-price"), origPrice);
			}
			else {
				$("#orig-price").addClass('is-hidden');
			}

			countPrice($("#actual-price"), totalPrice);
        }
	}
}

//function to count number for price
function countPrice(elem, price){
	elem.prop('Counter', $("#price").prop('Counter')).stop().animate({
		Counter: price
	}, {
		duration: 100,
		easing: 'swing',
		step: function (now) {
			if (now == 0){
				$(this).text("Free");
			}
			else {
				$(this).text(" $" + Number(Math.round(now+'e2')+'e-2').toFixed(2));
			}
		}
	});
}

//figure out price from milliseconds
function calculatePrice(totalduration){
	if (listing_info.price_type == "month"){
		totalduration = totalduration.asDays() / 30;
	}
	else {
		totalduration = totalduration.as(listing_info.price_type);
		totalduration = Number(Math.round(totalduration+'e2')+'e-2');
	}
	return totalduration * listing_info.price_rate;
}

//figure out if the start and end dates overlap any free periods
function anyFreeDayOverlap(starttime, endtime){
	if (listing_info.freetimes && listing_info.freetimes.length > 0){
		var overlap_time = 0;
		for (var x = 0; x < listing_info.freetimes.length; x++){
			var freetime_start = moment(listing_info.freetimes[x].date);
			var freetime_end = moment(listing_info.freetimes[x].date + listing_info.freetimes[x].duration);

			//there is overlap
			if (starttime.isBefore(freetime_end) && endtime.isAfter(freetime_start)){
				//completely covered by free time
				if (starttime.isSameOrAfter(freetime_start) && endtime.isSameOrBefore(freetime_end)){
					overlap_time += endtime.diff(starttime);
				}
				//completely covers free time
				else if (freetime_start.isSameOrAfter(starttime) && freetime_end.isSameOrBefore(endtime)){
					overlap_time += freetime_end.diff(freetime_start);
				}
				//overlap partially in the end of wanted time
				else if (starttime.isSameOrBefore(freetime_start) && endtime.isSameOrBefore(freetime_end)){
					overlap_time += endtime.diff(freetime_start);
				}
				//overlap partially at the beginning of wanted time
				else {
					overlap_time += freetime_end.diff(starttime);
				}
			}
		}
		return overlap_time;
	}
	else {
		return 0;
	}
}

//</editor-fold>
