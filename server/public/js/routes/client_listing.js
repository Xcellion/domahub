$(document).ready(function() {
	$("#listing_form").submit(function(e){
		e.preventDefault();
		submitRentals();
	});

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
			$('#edit_details_pay').append($id).submit();
		}
	});

	$('#stripe-button').click(function(e){
		e.preventDefault();

		handler.open({
			amount: totalPrice * 100,
			description: 'Renting at ' + listing_info.domain_name
		});

		return false;
	});
});

//helper function to check if everything is legit
function checkSubmit(){
	var newEvents = $('#calendar').fullCalendar('clientEvents', filterNew);
	var bool = "Please wait!";

	if (!user){ bool = "Please log in!"; }
	else if (!rental_info && (!newEvents || newEvents.length == 0)){
		bool = "Invalid dates!";
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
	else if (!ValidateIPaddress($("#ip_form_input").val())){
		bool = "Invalid IP address!";
	}

	return bool;
}

//function to submit new rental info
function submitRentals(){
	var checks = checkSubmit();	//check if everything is legit
	$("#message").text(checks);

	if (checks == "Please wait!" && unlock){
		unlock = false;
		minEvents = [];

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

		//post to ajax
		$.ajax({
			type: "POST",
			url: "/listing/" + listing_info.domain_name + "/rent",
			data: {
				events: minEvents,
				rental_id: rental_info.rental_id,
				ip_address: $("#ip_form_input").val()
			}
		}).done(function(data){
			unlock = true;
			if (data.unavailable){
				for (var x = 0; x < data.unavailable.length; x++){
					$("#message").text("Some time slots were unavailable! They have been removed.");
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
				$("#message").html(data.message);
			}
			else {
				console.log(data);
			}
		});
	}
}

function ValidateIPaddress(ipaddress){
	if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress))
	{
		return (true)
	}
	return (false)
}
