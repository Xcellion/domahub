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
	$("#date_created").text(moment(new Date(listing_info.date_created)).format("MMMM DD, YYYY"));

	//show more information on domain
	$("#more-info-button, #less-info-button").click(function() {
		$("#more-info-button, #less-info-button").toggleClass("is-hidden");
		$("#description-card").toggleClass("is-hidden");
	});

	//related domains module
	findRelatedDomains();

});

//related domains
function findRelatedDomains(){
	if (listing_info.categories){
		var categories_to_post = listing_info.categories;
		$("#similar-domains-title").text('Similar Listings');
	}
	else {
		var categories_to_post = "";
		$("#similar-domains-title").text('Other Listings');
	}

	$.ajax({
		url: "/listing/related",
		method: "POST",
		data: {
			categories: categories_to_post,
			domain_name_exclude: listing_info.domain_name
		}
	}).done(function(data){
		if (data.state == "success"){
			$("#similar-domains").removeClass('is-hidden');
			for (var x = 0; x < data.listings.length; x++){
				var cloned_similar_listing = $("#similar-domain-clone").clone();
				cloned_similar_listing.removeAttr("id").removeClass('is-hidden');

				//edit it based on new listing info
				cloned_similar_listing.find(".similar-domain-price").text("$" + data.listings[x].price_rate + " / " + data.listings[x].price_type);
				// var random_sig = Math.floor(Math.random()*1000);
				// var background_image = data.listings[x].background_image || "https://source.unsplash.com/category/nature/250x200?sig=" + random_sig;
				// cloned_similar_listing.find(".similar-domain-img").attr("src", background_image);
				cloned_similar_listing.find(".similar-domain-name").text(data.listings[x].domain_name).attr("href", "/listing/" + data.listings[x].domain_name);
				$("#similar-domain-table").append(cloned_similar_listing);
			}
		}
	})
}
