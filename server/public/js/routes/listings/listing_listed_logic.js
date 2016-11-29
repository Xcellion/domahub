var unlock = true;
var moneyFormat = wNumb({
	thousand: ',',
	prefix: '$'
});

stripeResponseHandler = function(status, response){
	console.log(response);
	if (response.error){
		$("#stripe-error-message").text(response.error.message).addClass('is-danger');
	}

	//all good!
	else {
	}
}

$(document).ready(function() {

	//user since text in about Owner
	$("#user-since").text(moment(new Date(listing_info.user_created)).format("MMMM, YYYY"));

	//key for stripe
	Stripe.setPublishableKey('pk_test_kcmOEkkC3QtULG5JiRMWVODJ');

	//format all stripe inputs
	$('#cc-num').payment('formatCardNumber');
	$('#cc-exp').payment('formatCardExpiry');
	$('#cc-cvc').payment('formatCardCVC');
	$('#cc-zip').payment('restrictNumeric');

	$("#stripe-form").submit(function(){
		//request a token from Stripe:
    	Stripe.card.createToken($(this), stripeResponseHandler);
	    return false;
	})

	$(".stripe-input").change(function(){
		if ($("#stripe-error-message").hasClass('is-danger')){
			$("#stripe-error-message").text("Please enter your payment information.").removeClass('is-danger');
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
			submitRentals(token.id);
		}
	});

	//---------------------------------------------------------------------------------------------------cookies

	//check if there are cookies for this domain name
	if (read_cookie("domain_name") == listing_info.domain_name){
		if (read_cookie("local_events")){
			var existing_events = read_cookie("local_events");
			var changed = false;

			for (var x = existing_events.length - 1; x >= 0; x--){
				//if its a new event, make sure it's past current time
				if (new Date().getTime() < new Date(existing_events[x].start).getTime()){
					$('#calendar').fullCalendar('renderEvent', existing_events[x], true);
				}
				else {
					changed = true;
					existing_events.splice(x, 1);
				}
			}

			//if we removed any events, change the cookies
			if (changed){
				storeCookies("local_events");
			}
		}
		eventPrices();	//show prices

		//check if theres a cookie for the rental address
		if (read_cookie("address")){
			$("#address_form_input").val(read_cookie("address"));
		}

		if (!rental_info){
			//check if theres a cookie for editing an event
			if (read_cookie("rental_info")){
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

	//save the URL
	$("#address_form_input").on("change", function(){
		storeCookies("address");
	});

	//---------------------------------------------------------------------------------------------------modals

	// Modal for calendar, url, and preview
	$('#listing-modal-button').click(function() {
		$('#listing-modal').addClass('is-active');
	});

	// various ways to close calendar modal
	$('.modal-close, .modal-background').click(function() {
	  	$('#listing-modal').removeClass('is-active');
	});

	//esc key to close modal
	$(document).keyup(function(e) {
		if (e.which == 27) {
			$('#listing-modal').removeClass('is-active');
		}
	});

	//---------------------------------------------------------------------------------------------------buttons

	//checkout button
	$('#checkout-button').click(function(e){
		e.preventDefault();
		var bool = checkSubmit();

		if (bool == true && unlock){
			// handler.open({
			// 	amount: totalPrice * 100,
			// 	description: 'Renting ' + listing_info.domain_name
			// });

			$("#stripe-form").submit();
		}
		else {
			$("#listing_message").html(bool);
			console.log(bool);
		}
	});

	//continue as guest button
	$('#guest-button').click(function() {
		$('#calendar-modal-content').removeClass('is-hidden');
		$('#login-modal-content').addClass('is-hidden');
	});

	//go back to login modal
	$("#calendar-back-button").click(function(){
		$('#calendar-modal-content').addClass('is-hidden');
		$('#login-modal-content').removeClass('is-hidden');
	});

	//buttons for cycling through calendar, redirect, and checkout modal views
	$('#redirect-next-button, #redirect-back-button').click(function() {
		$('#calendar-modal-content').toggleClass('is-hidden');
		$('#redirect-modal-content').toggleClass('is-hidden');
	});

	//preview button
	$('#preview-next-button, #preview-back-button').click(function() {
		$('#redirect-modal-content').toggleClass('is-hidden');
		$('#preview-modal-content').toggleClass('is-hidden');

		//set the src of the preview iframe
		$("#preview-iframe").attr("src", $("#address_form_input").val());
	});

	//edit dates button
	$("#edit-dates-button").click(function(){
		$('#calendar-modal-content').toggleClass('is-hidden');
		$('#redirect-modal-content').addClass('is-hidden');
		$('#preview-modal-content').addClass('is-hidden');
	});

	//fix weird issue with modal and fullcalendar not appearing
	$("#calendar").appendTo("#calendar-modal-content");

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

	if (!rental_info && (!newEvents || newEvents.length == 0)){
		bool = "Invalid dates!";
	}
	else if (!$("#address_form_input").val()){
		bool = "Invalid URL!";
	}
	else if (newEvents.length > 0){
		for (var x = 0; x < newEvents.length; x++){
			if (!newEvents[x].old){
				var start = new Date(newEvents[x].start._d);
				if (isNaN(start)){
					bool = "Invalid dates selected!";
					break;
				}
			}
		}
	}
	return bool;
}

//function to submit new rental info
function submitRentals(stripeToken){
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
				rental_id: rental_info.rental_id || false,
				address: $("#address_form_input").val(),
				stripeToken: stripeToken
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
				if (data.owner_hash_id){
					window.location = window.location.origin + "/listing/" + listing_info.domain_name + "/" + data.rental_id + "/" + data.owner_hash_id;
				}
				else {
					window.location = window.location.origin + "/listing/" + listing_info.domain_name + "/" + data.rental_id;
				}
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

//function to change modal page using hash and history
function changeModal(modal){
	if (modal == "calendar"){

	}
	else if (modal == "address"){

	}
	else {

	}
}
