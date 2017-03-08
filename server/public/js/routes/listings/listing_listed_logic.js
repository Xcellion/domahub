var unlock = true;

//check for mobile
window.mobilecheck = function() {
	var check = false;
	(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
	return check;
};

$(document).ready(function() {
	if (listing_info.traffic){
		createTrafficChart();
		var traffic_day = 0,
		 	traffic_week = 0,
			traffic_month = 0;

		var day_ago = moment().subtract(1, "day").valueOf();
		var week_ago = moment().subtract(1, "week").valueOf();
		var month_ago = moment().subtract(1, "month").valueOf();

		//traffic info
		for (var x = 0; x  < listing_info.traffic.length; x++){
			if (listing_info.traffic[x].timestamp > day_ago){
				traffic_day++;
			}
			else if (listing_info.traffic[x].timestamp > week_ago){
				traffic_week++;
			}
			else if (listing_info.traffic[x].timestamp > month_ago){
				traffic_month++;
			}
		}

		if (traffic_day > traffic_week && traffic_day > traffic_month){
			var timespan = "day";
		}
		else if (traffic_week > traffic_month && traffic_week > traffic_day){
			var timespan = "week";
		}
		else {
			var timespan = "month";
		}

		$("#traffic-views").text(Math.max(traffic_day, traffic_week, traffic_month));
		$("#traffic-timespan").text(timespan);
	}


	setUpCalendar(listing_info);

	if (window.mobilecheck()){
		$("#description-card").addClass('is-hidden').removeClass('is-hidden-mobile');
	}

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
			if (user){
				showCardContent("checkout");
			}
			else {
				showCardContent("nouser");
			}
		}
	});

	//press enter to go next for no user email
	$("#new_user_email").on("change keyup paste", function(e){
		e.preventDefault();
		if (e.keyCode == 13){
			showCardContent("checkout");
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
	}
	else {
		delete_cookies();
	}

	//---------------------------------------------------------------------------------------------------modals

	//changes the cards for calendar, address, and checkout
	$('.card-button-next').click(function() {
		showNextCard();
	});

	$('.card-button-prev').click(function() {
		showPrevCard();
	});

	//---------------------------------------------------------------------------------------------------CALENDAR

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

	//---------------------------------------------------------------------------------------------------MODULES

	editPopularRentalModule();
	editPreviousRentalModule();

});

//function to create the traffic chart
function createTrafficChart(){
	//past six months
	var dataset = [0,0,0,0,0,0];
	var months_away = [moment().subtract(5, "month").valueOf(),
					   moment().subtract(4, "month").valueOf(),
					   moment().subtract(3, "month").valueOf(),
					   moment().subtract(2, "month").valueOf(),
					   moment().subtract(1, "month").valueOf(),
					   moment().valueOf()]
	for (var x = 0; x < listing_info.traffic.length; x++){
		for (var y = 0; y < 6; y++){
			if (listing_info.traffic[x].timestamp < months_away[y]){
				dataset[y]++;
				break;
			}
		}
	}

	//create the labels array
	var monthly_labels = [];
	for (var y = 0; y < 6; y++){
		var temp_month = moment().subtract(y, "month").format("MMM");
		monthly_labels.unshift(temp_month);
	}

	//create the chart
	var myChart = new Chart($("#traffic-chart")[0], {
		type: 'line',
		data: {
			labels: monthly_labels,
			datasets: [{
				borderColor: "#3CBC8D",
				backgroundColor: "#3CBC8D",
				fill: false,
				data: dataset
			}]
		},
		options: {
			legend: {
				display: false
			},
			responsive: true,
			//tooltip to display all values at a specific X-axis
			tooltips: {
				mode: 'x-axis',
				callbacks: {
					label: function(tooltipItems, data) {
						var views_plural = (tooltipItems.yLabel == 1) ? " view" : " views"
						return tooltipItems.yLabel + views_plural;
					}
				}
			},
			scales: {
				yAxes: [{
					display: true,
					ticks: {
						suggestedMax: 100,
						beginAtZero: true   // minimum value will be 0.
					}
				}]
			}
		 }
	});
}

//functions to show different cards
function showCardContent(type){
	$(".checkout-card-content").addClass('is-hidden');
	$("#" + type + "-card-content").removeClass('is-hidden');
	if (type == "calendar"){
		$('#calendar').fullCalendar('render');
	}
}

function showNextCard(){
	var current_card = $(".checkout-card-content:not(.is-hidden)");
	current_card.addClass('is-hidden')
	var next_card = current_card.next(".checkout-card-content");
	next_card.removeClass('is-hidden');

	if (next_card.attr('id') == "calendar-card-content"){
		$('#calendar').fullCalendar('render');
	}
}

function showPrevCard(){
	var current_card = $(".checkout-card-content:not(.is-hidden)");
	current_card.addClass('is-hidden')
	var prev_card = current_card.prev(".checkout-card-content");
	prev_card.removeClass('is-hidden');

	if (prev_card.attr('id') == "calendar-card-content"){
		$('#calendar').fullCalendar('render');
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
					showCardContent("calendar");
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
		showCardContent("address");
		$("#address-error-message").addClass('is-danger').html("Invalid URL entered! Your credit card has not been charged yet.");
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
		$("#rental-preview-button").href(url);
	}
}

//---------------------------------------------------------------------------------------------------RENTAL EXAMPLES MODULE

//function to create popular rentals module
function editPopularRentalModule(){
	var popular_rental_id = $("#popular-rental-module").data("rental_id");
	if (popular_rental_id){
		$("#popular-rental-duration").text(aggregateDateDuration(popular_rental_id));
	}
}

//function to create previous rentals module
function editPreviousRentalModule(){
	if ($("#previous-listings-table")){
		$(".previous-rental-duration").each(function(){
			$(this).text(aggregateDateDuration($(this).data("rental_id")));
		});
	}
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
	return Math.ceil(moment.duration(totalDuration).as(listing_info.price_type)) + " " + listing_info.price_type.capitalizeFirstLetter() + " Rental";
}

//to cap the first letter
String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}
