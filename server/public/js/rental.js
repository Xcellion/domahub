$(document).ready(function() {

	//if rental has yet to be submitted
	if (new_listing_info){
		for (var y = 0; y < new_listing_info.rental_info.length; y++){
			
		}
	}
	
	$("#listing_form").submit(function(e){
		e.preventDefault();
		submitRentals();
	});
});

//helper function to get rental details
function rentalData(){
	var rental_details = [];
	var rental_data = {
		rental_details : rental_details
	};

	//new rental
	if (new_listing_info){
		rental_data.rental_info = new_listing_info;
		switch (parseFloat(new_listing_info.type)){
			case 0:
				break;
			case 1:
				var detail = {
					rental_key: "redirect",
					rental_value: $("#url_input").val()
				}
				rental_details.push(detail);
				break;
		}
	}
	//editing rental
	else {
		rental_data.rental_info = rental_info;
		$(".rental_pair").each(function(){
			var rental_pair = [];
			$(this).children(".rental_value").each(function(){
				rental_pair.push($(this).html());
			});
			rental_details.push(rental_pair);
		});
	}
	
	return rental_data;
}

//function to submit new rental info
function submitRentals(){
	//client side check if authenticated
	 if (user){
		var rental_data = rentalData();

		$.ajax({
			type: "POST",	
			url: window.location.pathname,
			data: {
				rental_info: rental_data.rental_info,
				rental_details: rental_data.rental_details
			}
		}).done(function(data){
			console.log(data);
		});
	}
	else {
		console.log('log in pls');
	}
}