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
			showModalContent("checkout");
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

		//display modal if theres a cookie
		if (read_cookie("modal-active")){
			showModalContent(read_cookie("modal"));
		}
	}
	else {
		delete_cookies();
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
	$('#existing-login-button, #redirect-next-button, #checkout-back-button').click(function() {
		showModalContent("redirect");
	});

	//show checkout modal content
	$('#checkout-next-button').click(function() {
		showModalContent("checkout");
	});

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

	//---------------------------------------------------------------------------------------------------DISPLAY RENTALS

	//function to create 2 random rentals for example
	createExampleRentals();

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
			$('#calendar').fullCalendar('render');

			if (listing_info.price_type != "hour"){
				var cal_height = $(".modal-container-calendar").height() - $("#calendar-modal-top").height() - 90;
				$('#calendar').fullCalendar('option', 'contentHeight', cal_height);
			}
		}
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
	else if (!$("#agree-to-terms").prop('checked')){
		bool = "Invalid terms!";
		$("#stripe-error-message").addClass('is-danger').html("You must agree to the terms and conditions.");
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
					showModalContent("calendar");
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
		showModalContent("redirect");
		$("#address-error-message").addClass('is-danger').html("Invalid URL entered! Your credit card has not been charged yet.");
	}
	else if (message == "Invalid dates!"){
		showModalContent("calendar");
		$("#calendar-error-message").addClass('is-danger').html("Invalid dates selected! Your credit card has not been charged yet.");
	}
	else if (message == "Invalid email!"){
		showModalContent("checkout");
		$("#new-user-email-error").addClass('is-danger').html("Invalid email address! Your credit card has not been charged yet.");
	}
	else if (message == "Invalid price!"){
		showModalContent("checkout");
		$("#stripe-error-message").addClass('is-danger').html("Payment error! Your credit card has not been charged yet.");
	}
	else if (message == "Invalid stripe user account!"){
		showModalContent("checkout");
		$("#summary-error-message").addClass('is-danger').html("Listing error! Please try again later! Your credit card has not been charged yet.");
	}
}

//success handler
function successHandler(data){
	$("#payment-column, .success-hide").addClass('is-hidden');
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
}

//---------------------------------------------------------------------------------------------------RENTAL EXAMPLES MODULE

//function to create multiple random rentals for example
function createExampleRentalsModule(){
	if (listing_info.rentals.length){
		$("#rental-example-module").removeClass('is-hidden');
		var rentals_index_arr = [];
		var rentals_id_arr = [];

		//2 random rentals or minimun amount of existing rentals
		var num_examples = Math.min(2, listing_info.rentals.length);

		while(rentals_id_arr.length < num_examples){
			var randomnumber = Math.ceil(Math.random() * (listing_info.rentals.length - 1))
			if (rentals_id_arr.indexOf(randomnumber) > -1) continue;
			else if (rentals_index_arr.indexOf(listing_info.rentals[randomnumber].rental_id) > -1) continue;
			rentals_id_arr.push(randomnumber);
			rentals_index_arr.push(listing_info.rentals[randomnumber].rental_id);
		}

		//create the rental examples
		for (var x = 0; x < num_examples; x++){
			createExampleRental(rentals_id_arr[x], x);
		}
	}
}

//function to create a single random example rental
function createExampleRental(index_rental, index){
	var example_rental = listing_info.rentals[index_rental];
	var time_info = aggregateDateDuration(example_rental.rental_id);
	var temp_example = $("#rental-example").clone().removeClass('is-hidden');

	//duration
	temp_example.find(".rental-example-duration").text("For " + moment.duration(time_info.totalDuration).humanize());

	//views
	temp_example.find(".rental-example-views").text(example_rental.views + " since " + moment(time_info.startDate).format("MMMM DD, YYYY"));

	//address
	temp_example.find(".rental-example-address").text(example_rental.address || "Nothing!");
	temp_example.find(".rental-example-preview").attr("href", "/listing/" + listing_info.domain_name + "/" + example_rental.rental_id);

	//screenshot
	temp_example.find(".rental-example-screenshot").attr('src', "/screenshot?rental_address=" + example_rental.address).error(function() {
        $(this).attr("src", "");
    });

	$("#rental-example-module").append(temp_example);
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
	return {
		startDate: startDate,
		totalDuration: totalDuration
	}
}
