$(document).ready(function() {
	//prevent dragging on background image
	$('#background_image').on('dragstart', function(event) { event.preventDefault(); });

	//request an unavailable domain
	$("#request_link").click(function(){

		var request_link = $(this);
		request_link.addClass('is-loading');

		//button doesnt do anything, but dont worry, loading the page already stored the info we needed
		window.setTimeout(function(){
			request_link.addClass('is-success').removeClass('is-loading').text("Thank you!").off();
		}, 200);
	});

	//formatting for date created metadata text
	$("#date_created").text(moment(new Date(listing_info.date_created)).format("DD MMMM YYYY"));
});
