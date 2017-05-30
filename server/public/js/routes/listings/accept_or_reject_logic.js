$(document).ready(function() {

	$("#main_button").on("click", function(e){
		acceptOrRejectOffer(false, $(this));
	});

	$("#secondary_button").on("click", function(e){
		acceptOrRejectOffer(true, $(this));
	});
});

//function to submit ajax for accept or reject
function acceptOrRejectOffer(negate, button_elem){
	button_elem.addClass('is-loading');
	$(".button").off();

	var accept_url = (negate == accepted) ? "/reject" : "/accept";

	$.ajax({
		url: "/listing/" + listing_info.domain_name + "/contact/" + offer_info.verification_code + accept_url,
		method: "POST"
	}).done(function(data){
		button_elem.removeClass('is-loading');
		$(".button").addClass('is-hidden');
		console.log(data);

		if (data.state == "success"){
			successHandler(negate);
		}
		else {
			errorHandler();
		}
	});
}

//function to run when accept or reject was successful
function successHandler(negate){
	$("#success-message").removeClass('is-hidden');
	var accept_text = (negate == accepted) ? "rejected" : "accepted";
	$("#success-message-text").text("Successfully " + accept_text + " this offer! Now redirecting you back to your profile.");
	redirectDelay("/profile");
}

//redirect after a short delay
function redirectDelay(path){
	var seconds = 3;

	//add a period every second
	window.setInterval(function(){
		seconds--;
		$("#success-message-text").text($("#success-message-text").text().trim() + ".");

		//redirect after 3 seconds
		if (seconds == 0){
			window.location.href = path;
		}
	}, 1000);
}

//function to run when accept or reject was NOT successful
function errorHandler(){
	$("#error-message").removeClass('is-hidden');
}
