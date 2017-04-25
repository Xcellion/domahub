$(document).ready(function() {

	//change the URL, save as cookie and allow next
	$("#address_form_input").on("change keyup paste", function(e){
		storeCookies("address");
		if ($("#address-error-message").hasClass('is-danger')){
			$("#address-error-message").removeClass('is-danger').text("The content of the URL you link below will be displayed when anyone goes to your rental domain name. You may change this URL at any time.")
		}
	});

	//press enter to go next for no user email
	$("#new_user_email").on("change keyup paste", function(e){
		if (e.keyCode == 13){
			showCardContent("checkout");
		}
	});

	//copy ownership url
	$("#rental-link-button").click(function(){
		$(this).prev("input").select();
		document.execCommand("copy");
		$(this).prev("input").blur();
		$(this).find("i").removeClass("fa-clipboard").addClass('fa-check-square-o');
	});

});


//function to create popular rental
function editPopularRental(){
	if (listing_info.rentals.length > 0){
		var popular_rental = listing_info.rentals[0];
		for (var x = 0; x < listing_info.rentals.length; x++){
			if (listing_info.rentals[x].views > popular_rental.views){
				popular_rental = listing_info.rentals[x];
			}
		}
	}
	if (popular_rental && $("#popular-rental-card").length > 0){
		$("#popular-rental-duration").text(aggregateDateDuration(popular_rental.rental_id));
		$("#popular-rental-preview").attr("href", "/listing/" + listing_info.domain_name + "/" + popular_rental.rental_id);
		$("#popular-rental-views").text(popular_rental.views + " Views");

		//async image load
		var popular_screenshot = new Image();
		popular_screenshot.onload = function(){
			$("#popular-rental-img").attr("src", this.src);
		}

		var background_image = (popular_rental.address == "") ? "https://placeholdit.imgix.net/~text?txtsize=20&txt=NO%20PREVIEW&w=800&h=400" : "/screenshot?rental_address=" + popular_rental.address;
		background_image = (popular_rental.address.match(/\.(jpeg|jpg|gif|png)$/) != null) ? popular_rental.address : background_image;
		popular_screenshot.src = background_image;
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


// //success handler
// function successHandler(data){
// 	$(".success-hide").addClass('is-hidden');
// 	$("#success-column").removeClass('is-hidden');
// 	$("#success-message").text("Your credit card was successfully charged!");
// 	//if theres a link for ownership claiming
// 	if (data.owner_hash_id){
// 		var url = "https://www.domahub.com/listing/" + listing_info.domain_name + "/" + data.rental_id + "/" + data.owner_hash_id;
// 		$("#rental-link-input").val(url);
// 		//$("#rental-link-href").prop('href', url);
//
// 		$("#rental-link-input").focus(function(){
// 			$(this).select();
// 		});
// 	}
// 	else {
// 		var url = "https://www.domahub.com/listing/" + listing_info.domain_name + "/" + data.rental_id;
// 		$("#rental-preview-button").href(url);
// 	}
// }
