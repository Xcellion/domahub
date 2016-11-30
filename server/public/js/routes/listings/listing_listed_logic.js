var unlock = true;

$(document).ready(function() {

	//user since text in About Owner
	$("#user-since").text(moment(new Date(listing_info.user_created)).format("MMMM, YYYY"));

	//change the URL, save as cookie and allow next
	$("#address_form_input").on("change keyup paste", function(){
		storeCookies("address");
		if ($("#address-error-message").hasClass('is-danger')){
			$("#address-error-message").removeClass('is-danger').text("The content of the URL you link below will be displayed when anyone goes to your rental domain name. You may change this URL at any time.")
		}
		if ($(this).val() == ""){
			$("#preview-next-button").addClass('is-disabled');
		}
		else {
			$("#preview-next-button").removeClass('is-disabled');
		}
	});

	//---------------------------------------------------------------------------------------------------stripe

	//key for stripe
	Stripe.setPublishableKey('pk_test_kcmOEkkC3QtULG5JiRMWVODJ');

	//format all stripe inputs
	$('#cc-num').payment('formatCardNumber');
	$('#cc-exp').payment('formatCardExpiry');
	$('#cc-cvc').payment('formatCardCVC');
	$('#cc-zip').payment('restrictNumeric');

	//request a token from stripe
	$("#stripe-form").submit(function(){
    	Stripe.card.createToken($(this), function(status, response){
			unlock = true;
			if (response.error){
				$('#checkout-button').removeClass('is-loading');
				$("#stripe-error-message").text(response.error.message).addClass('is-danger');
			}
			//all good!
			else {
				submitRentals(response.id);
			}
		});
	    return false;
	})

	//to remove any stripe error messages
	$(".stripe-input").change(function(){
		if ($("#stripe-error-message").hasClass('is-danger')){
			$("#stripe-error-message").text("Please enter your payment information.").removeClass('is-danger');
		}
	});

	//checkout button
	$('#checkout-button').click(function(e){
		$(this).addClass('is-loading');
		e.preventDefault();
		var bool = checkSubmit();
		if (bool == true && unlock){
			unlock = false;
			$("#stripe-form").submit();
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
			$("#preview-next-button").removeClass('is-disabled');
		}

		if (!rental_info){
			//check if theres a cookie for editing an event
			if (read_cookie("rental_info")){
				var cookie = read_cookie("rental_info");
				rental_info = cookie;
				editingRental();
			}
		}

		//display modal if theres a cookie
		if (read_cookie("modal-active")){
			showModalContent(read_cookie("modal"));
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

	//---------------------------------------------------------------------------------------------------modals

	//open the modal view and switch to appropriate content depending on cookie
	$('#listing-modal-button').click(function() {
		var modal_to_show = (read_cookie("modal")) ? read_cookie("modal") : (user) ? "calendar" : "login";
		showModalContent(modal_to_show);
	});

	//various ways to close calendar modal
	$('.modal-close, .modal-background').click(function() {
	  	$('#listing-modal').removeClass('is-active');
		delete_cookie("modal-active");
	});

	//esc key to close modal
	$(document).keyup(function(e) {
		if (e.which == 27) {
			$('#listing-modal').removeClass('is-active');
			delete_cookie("modal-active");
		}
	});

	//show login modal content
	$("#calendar-back-button").click(function() {
		showModalContent("login");
	});

	//show calendar modal content
	$('#guest-button, #redirect-back-button, #edit-dates-button').click(function(){
		showModalContent("calendar");
	});

	//show redirect modal content
	$('#redirect-next-button, #preview-back-button').click(function() {
		showModalContent("redirect");
	});

	//show preview modal content
	$('#preview-next-button').click(function() {
		showModalContent("preview");
	});

	//fix weird issue with modal and fullcalendar not appearing
	$("#calendar").appendTo("#calendar-modal-bottom");
	var cal_height = $("#calendar-modal-content").height() - $("#calendar-modal-top").height() - 100;
	$('#calendar').fullCalendar('option', 'contentHeight', cal_height);
});

//function to show a specific modal content
function showModalContent(type){
	if (type){
		$('#listing-modal').addClass('is-active');
		$('#listing-modal-button').text("Resume Transaction");

		$(".listing-modal-content").addClass('is-hidden');
		$("#" + type + "-modal-content").removeClass('is-hidden');
		storeCookies("modal");
		storeCookies("modal-active");

		if (type == "calendar"){
			var cal_height = $("#calendar-modal-content").height() - $("#calendar-modal-top").height() - 100;
			$('#calendar').fullCalendar('option', 'contentHeight', cal_height);
		}
	}
}

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

//helper function to check if everything is legit
function checkSubmit(){
	var newEvents = $('#calendar').fullCalendar('clientEvents', filterNew);
	var bool = true;

	if (!rental_info && (!newEvents || newEvents.length == 0)){
		bool = "Invalid dates!";
		errorHandler(bool);
	}
	else if (!$("#address_form_input").val()){
		bool = "Invalid URL!";
		errorHandler(bool);
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
			$('#checkout-button').removeClass('is-loading');
			unlock = true;
			if (data.unavailable){
				for (var x = 0; x < data.unavailable.length; x++){
					$('#calendar').fullCalendar('removeEvents', data.unavailable[x]._id);
					showModalContent("calendar");
					$("#address-error-message").addClass('is-danger').html("Some dates were unavailable! They have been removed from your selection.<br />Your credit card has not been charged yet.");
				}
			}
			else if (data.state == "success"){
				delete_cookies();
				if (data.owner_hash_id){
					window.location = window.location.origin + "/listing/" + listing_info.domain_name + "/" + data.rental_id + "/" + data.owner_hash_id;
				}
				else {
					window.location = window.location.origin + "/listing/" + listing_info.domain_name + "/" + data.rental_id;
				}
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
		showModalContent("redirect");
		$("#address-error-message").addClass('is-danger').html("There was something wrong with the URL you entered!<br />Your credit card has not been charged yet.");
	}
	else if (message == "Invalid dates!"){
		showModalContent("calendar");
		$("#calendar-error-message").addClass('is-danger').html("There was something wrong with the dates you selected!<br />Your credit card has not been charged yet.");
	}
	else if (message == "Invalid price!"){
		showModalContent("preview");
		$("#stripe-error-message").addClass('is-danger').html("There was something wrong with your credit card!<br />Your credit card has not been charged yet.");
	}
}
