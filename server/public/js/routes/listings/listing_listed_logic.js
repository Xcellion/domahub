var myChart;
var myPath;

$(document).ready(function() {

	//---------------------------------------------------------------------------------------------------TYPED PATH

	//focus to hide the click me message
	$("#typed-slash").on("focus", function(){
		//remove the disabled on check availability button
		$("#check-avail").removeClass('is-disabled');
		$("#input-tooltip").addClass('is-hidden');

		//select all on existing path
		$("#typed-slash").select();
	}).on("focusout", function(){
		if ($("#typed-slash").val() == ""){
			$("#input-tooltip").removeClass('is-hidden');
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
		if (!inp.match(validChar)) {
			e.preventDefault();
			$("#input-tooltip-error").removeClass("is-hidden");
		} else {
			$("#input-tooltip-error").addClass("is-hidden");
		}
	}).on('keyup', function(e){
		var validChar = /^[0-9a-zA-Z]+$/;
		if ($("#typed-slash").val().match(validChar)){
			$("#input-tooltip-error").addClass("is-hidden");
		}

		//changed path, so change calendar
		if (myPath != $(this).val()){
			//remove any existing date range pickers
			if ($("#calendar").data('daterangepicker')){
				$("#calendar").data('daterangepicker').remove();
			}
			$("#calendar").val("");
			$("#checkout-button").addClass('is-disabled');
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
			getExistingEvents($(this));
		}
	});

	//submit times (redirect to checkout)
	$("#checkout-button").on("click", function(){
		submitTimes($(this));
	});

	//initiate calendar based on current path value, prevent typing
	$("#calendar").on("click", function(){
        getExistingEvents($(this));
    }).on("keydown", function(e){
		e.preventDefault();
	});
});

//show error
function showAlphaError(){
	var validChar = /^[0-9a-zA-Z]+$/;
	if ($("#typed-slash").val().match(validChar)){

	}
	$("#input-tooltip-error").removeClass("is-hidden");
	$("#input-tooltip").addClass("is-hidden");
}

//hide error
function hideAlphaError(){
	$("#input-tooltip-error").addClass("is-hidden");
	$("#input-tooltip").addClass("is-hidden");
}

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

//function to submit new rental info
function submitTimes(checkout_button){
	//remove event handler
	checkout_button.off();
	checkout_button.addClass('is-loading');
	var newEvent = checkTimes();

	if (newEvent.starttime && newEvent.endtime){
		//redirect to checkout page
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
			}
		});
	}
}

//handler for various error messages
function errorHandler(message){
	switch (message){
		case "Invalid dates!":
		case "Invalid dates! No times posted!":
		case "Invalid dates! Not valid dates!":
            $("#calendar-error-message").removeClass('is-hidden').text("The selected times are not available! Please edit your selected rental dates.");
			break;
		case "Dates are unavailable!":
		case "Not divisible by hour blocks!":
		case "Start time in the past!":
		case "Invalid end time!":
		case "Invalid start time!":
            $("#calendar-error-message").removeClass('is-hidden').text("You have selected an invalid time! Please refresh the page and try again.");
			break;
		default:
            $("#calendar-error-message").removeClass('is-hidden').text("Something went wrong! Please refresh the page and try again.");
            break;
    }
}
