var unlock = true;

$(document).ready(function() {
	//stripe configuration
	handler = StripeCheckout.configure({
		key: 'pk_test_kcmOEkkC3QtULG5JiRMWVODJ',
		name: 'w3bbi Domain Rental',
		image: '/images/www.jpg',
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
	$(".next_button").click(function(e){
		if ($(this).hasClass("is-primary")){
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


	$("#ip_form_input").keyup(function(e){
		ipNextChange();
	});

	if (user){
		$("#login_modal").removeAttr("style");
	}

	//--------------------------------------------------------------------cookies

	//check if there are cookies for this domain name
	if (read_cookie("domain_name") == listing_info.domain_name){
		var existing_events = read_cookie("local_events");

		for (var x = 0; x < existing_events.length; x++){
			$('#calendar').fullCalendar('renderEvent', existing_events[x], true);
			eventPrices();	//show prices
		}

		//check if theres a cookie for the rental type
		if (read_cookie("ip")){
			$("#ip_form_input").val(read_cookie("ip"));
			ipNextChange();
		}

		//check if theres a cookie for editing an event
		if (document.cookie.match(new RegExp('rental_info=([^;]+)'))){
			var cookie = read_cookie("rental_info");
			rental_info = cookie;
			editingRental();
		}
	}
	else {
		delete_cookies();
	}

	//delete all new cookies if theres a rental being edited
	if (rental_info){
		delete_cookies();
		$("#ip_form_input").val(rental_info.ip);
		$("#calendar").fullCalendar("gotoDate", rental_info.times[0].date)
	}
});

// Close Checkout on page navigation
$(window).on('popstate', function () {
    handler.close();
});

//helper function to change next icon to primary color
function ipNextChange(){
	if (ValidateIPaddress($(ip_form_input).val())){
		$("#ip_next").addClass("is-primary");
	}
	else {
		$("#ip_next").removeClass("is-primary");
	}
}

//helper function to check if everything is legit
function checkSubmit(){
	var newEvents = $('#calendar').fullCalendar('clientEvents', filterNew);
	var bool = true;

	if (!user){
		bool = "Please log in!";
		$("#login_modal").css("background-color", "red");
		$("#login_modal").addClass("shake").one('webkitAnimationEnd oanimationend msAnimationEnd animationend',
        function (e) {
            $("#login_modal").removeClass('shake');
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
			else if (data.redirect){
				window.location = data.redirect;
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
