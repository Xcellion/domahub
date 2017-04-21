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
