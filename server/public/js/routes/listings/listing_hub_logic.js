var moneyFormat = wNumb({
	thousand: ',',
	prefix: '$'
});
var listings = [];

$(document).ready(function() {

	//get the first 10 listings
    getListings();

	$("#domain-name-input").on("keyup", function(e){
		searchListings($("#domain-name-input").val());
		if (e.keyCode == 13){
			e.preventDefault();
		}
	});

	$("#load-button").on("click", function(){
		getListings($(this));
	});

});

//------------------------------------------------------------------------------------------- GET LISTINGS

//get 10 more listings
function getListings(load_more_elem){
	if (load_more_elem){
		load_more_elem.off();
	}

	$.ajax({
		url: "/listings",
		method: "POST",
		data: {
			last_date : (listings.length > 0) ? listings[listings.length - 1].id : 0
		}
	}).done(function(data){

		if (load_more_elem){
			//add back event handler
			load_more_elem.on("click", function(){
				getListings(load_more_elem)
			});
		}

		if (data.state == "success" && data.listings.length > 0){
			listings = listings.concat(data.listings);
			for (var x = 0; x < data.listings.length; x++){
				createListingRow(data.listings[x]);
			}

			if (data.listings.length != 10){
				$("#load-button").off().addClass('is-hidden');
			}
		}
		else if (data.listings.length == 0 || data.state == "error") {
			$("#load-button").off().addClass('is-hidden');
		}
	});
}

//function to add new rows after search
function createListingRow(listing){
	var temp_clone = $("#clone-listing-row").clone().removeClass('is-hidden').attr("id", "");

	temp_clone.attr("href", "/listing/" + listing.domain_name).data("domain_name", listing.domain_name);
	temp_clone.find(".domain-name").text(listing.domain_name);
	temp_clone.find(".domain-price-rate").text(moneyFormat.to(listing.price_rate));
	temp_clone.find(".domain-price-type").text(listing.price_type);
	$("#domain-table").append(temp_clone);
}

//------------------------------------------------------------------------------------------- SEARCH

//function to search for domains
function searchListings(val){
	$(".domain-listing").not("#clone-listing-row").not("#none-listing-row").each(function(){
		if ($(this).data("domain_name").indexOf(val) == -1){
			$(this).addClass('is-hidden');
		}
		else if (!val){
			$(this).removeClass('is-hidden');
		}
		else {
			$(this).removeClass('is-hidden');
		}
	});

	if ($('.domain-listing').is(":visible")){
		$("#none-listing-row").addClass('is-hidden');
	}
	else {
		$("#none-listing-row").removeClass('is-hidden');
	}

	if (val){
		$("#load-button").addClass('is-hidden');
	}
	else {
		$("#load-button").removeClass('is-hidden');
	}
}
