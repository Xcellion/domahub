var unlock = true;

$(document).ready(function() {

	$('#background_image').on('dragstart', function(event) { event.preventDefault(); });

	//fix 100vh jumping on mobile
	if ( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
		var h = $('.height-fix').height();
		$('.height-fix').height(h);
	}

	//stripe configuration
	handler = StripeCheckout.configure({
		key: 'pk_test_kcmOEkkC3QtULG5JiRMWVODJ',
		name: 'domahub Domain Rental',
		image: '/images/d-logo.PNG',
		panelLabel: 'Pay',
		zipCode : true,
		locale: 'auto',
		token: function(token) {
			// You can access the token ID with `token.id`.
			// Get the token ID to your server-side code for use.
			var $id = $('<input id="stripeToken" type=hidden name=stripeToken />').val(token.id);
			$('#listing_form').append($id);
			submitRentals();
		}
	});

	//--------------------------------------------------------------------buttons

	//page nav next buttons
	$("#top_next").data("can_next", true);
	$(".next_button").click(function(e){
		if ($(this).data("can_next") == true){
			var scroll_elems = ["#top_wrapper", "#calendar_wrapper", "#ip_wrapper", "#pay_wrapper"];
			var index = scroll_elems.indexOf("#" + $(this).attr("id").split("_").shift().toString() + "_wrapper") + 1;
			index = index >= scroll_elems.length ? 0 : index;
			$('html, body').stop().animate({
				scrollTop: $(scroll_elems[index]).offset().top
			}, 1000);
		}
	})

	$("#ip_next").click(function(e){
		storeCookies("ip");
	})

	//stripe buttons
	$('#stripe-button').click(function(e){
		e.preventDefault();

		if (checkSubmit() == true && unlock){
			handler.open({
				amount: totalPrice * 100,
				description: 'Renting at ' + listing_info.domain_name
			});

			$("#submitButton").css("background", "black");
		}
	});

	//prevent all key code except numbers and . and :
	$("#ip_form_input").keydown(function(e){
		if ((e.which < 48 || e.which > 57) && e.which != 190 && e.which != 186 && e.which != 8){
	        e.preventDefault();
	    }
	});

	$("#ip_form_input").keyup(function(e){
		ipNextChange();
	});

	if (user){
		$("#login_modal").removeAttr("style");
	}

	//--------------------------------------------------------------------cookies

	//check if there are cookies for this domain name
	if (read_cookie("domain_name") == listing_info.domain_name){
		if (read_cookie("local_events")){
			var existing_events = read_cookie("local_events");

			for (var x = 0; x < existing_events.length; x++){
				$('#calendar').fullCalendar('renderEvent', existing_events[x], true);
				eventPrices();	//show prices
			}
		}

		//check if theres a cookie for the rental type
		if (read_cookie("ip")){
			$("#ip_form_input").val(read_cookie("ip"));
			ipNextChange();
		}

		if (!rental_info){
			//check if theres a cookie for editing an event
			if (document.cookie.match(new RegExp('rental_info=([^;]+)'))){
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
});

// Close Checkout on page navigation
$(window).on('popstate', function () {
    handler.close();
});

//function to show rental specific stuff
function displayRental(){
	delete_cookies();

	//populate ip form with rental info ip
	$("#ip_form_input").val(rental_info.ip);
	ipNextChange();

	//go to rental start date
	$("#calendar").fullCalendar("gotoDate", rental_info.times[0].date);

	//rental top buttons
	$("#top_next_rental").data("can_next", true);
	$("#calendar_next_rental").data("can_next", true);

	for (var x = 0; x < rental_info.times.length; x++){

		start = moment(new Date(rental_info.times[x].date + "Z"));
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
function ipNextChange(){
	if (ValidateIPaddress($(ip_form_input).val())){
		$("#ip_next").addClass("is-primary");
		$("#ip_next").data("can_next", true);
	}
	else {
		$("#ip_next").removeClass("is-primary");
		$("#ip_next").data("can_next", false);
	}
}

//helper function to check if everything is legit
function checkSubmit(){
	var newEvents = $('#calendar').fullCalendar('clientEvents', filterNew);
	var bool = true;

	if (!user){
		bool = "Please log in!";
		$("#login-modal").css({
			"border-color": "red",
			"color": "red"
		});
		$("#login-modal").addClass("shake").one('webkitAnimationEnd oanimationend msAnimationEnd animationend',
        function (e) {
            $("#login-modal").removeClass('shake');
        });
	}
	else if (!rental_info && (!newEvents || newEvents.length == 0)){
		bool = "Invalid dates!";
		$('html, body').stop().animate({
			scrollTop: $("#calendar_wrapper").offset().top
		}, 1000);
	}
	else if (!ValidateIPaddress($("#ip_form_input").val())){
		bool = "Invalid IP address!";
		$('html, body').stop().animate({
			scrollTop: $("#ip_wrapper").offset().top
		}, 1000);
	}
	else if (newEvents.length > 0){
		for (var x = 0; x < newEvents.length; x++){
			if (!newEvents[x].old){
				var start = new Date(newEvents[x].start._d);
				if (isNaN(start)){
					bool = "Invalid dates selected!";
					$('html, body').stop().animate({
						scrollTop: $("#calendar_wrapper").offset().top
					}, 1000);
					break;
				}
			}
		}
	}

	$("#listing_message").html(bool);
	return bool;
}

//function to submit new rental info
function submitRentals(){
	if (checkSubmit() == true && unlock){
		var newEvents = $('#calendar').fullCalendar('clientEvents', filterNew);
		unlock = false;
		minEvents = [];

		//format the events to be sent
		for (var x = 0; x < newEvents.length; x++){
			var start = new Date(newEvents[x].start._d);
			var offset = start.getTimezoneOffset();
			minEvents.push({
				start: newEvents[x].start._d,
				end: newEvents[x].end._d,
				offset: offset,
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
				rental_id: rental_info.rental_id,
				ip: $("#ip_form_input").val(),
				stripeToken: $("#stripeToken").val()
			}
		}).done(function(data){
			delete_cookies();
			unlock = true;
			if (data.unavailable){
				for (var x = 0; x < data.unavailable.length; x++){
					$("#listing_message").text("Some time slots were unavailable! They have been removed.");
					$('#calendar').fullCalendar('removeEvents', data.unavailable[x]._id);
				}
				// $.ajax({
				// 	type: "GET",
				// 	url: "/listing/" + listing_info.domain_name,
				// 	headers: {
				// 		"page-or-data" : "data"
				// 	}
				// }).done(function(data){
				// 	createExisting(data.rentals);
				// });
			}
			else if (data.state == "success"){
				window.location = window.location.origin + "/listing/" + listing_info.domain_name + "/" + data.rental_id;
			}
			else if (data.state == "error"){
				$("#listing_message").html(data.message);
			}
			else {
				console.log(data);
			}
		});
	}
}

function ValidateIPaddress(ipaddress){
	return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress)
}
