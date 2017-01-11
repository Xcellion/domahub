$(document).ready(function() {
	//prevent dragging on background image
	$('#background_image').on('dragstart', function(event) { event.preventDefault(); });

	//request an unavailable domain
	$("#request_link").click(function(){

		var request_link = $(this);
		request_link.addClass('is-loading');

		//button doesnt do anything, but dont worry, loading the page already stored the info we needed
		window.setTimeout(function(){
			request_link.removeClass('is-loading').text("Request Submitted!").off();
		}, 200);
	});

	//formatting for date created metadata text
	$("#date_created").text(moment(new Date(listing_info.date_created)).format("DD MMMM YYYY"));

	//show more information on domain
	$("#more-info-button").click(function() {
		$("#description-card").toggleClass("is-hidden");
	});
});
