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
function rentalDetails(){
	var rental_details = [];
	var detail = {
		rental_key: "",
		rental_value: ""
	}
	
	switch (parseFloat(new_listing_info.type)){
		case 0:
			break;
		case 1:
			detail.rental_key = "redirect";
			detail.rental_value = $("#url_input").val();
			break;
	}
	rental_details.push(detail);
	
	return rental_details;
}

//function to submit new rental info
function submitRentals(){
	//client side check if authenticated
	if (user){
		var rental_details = rentalDetails();
		var rental_data = {
			type: new_listing_info.type,
			rental_details: rental_details
		};
		
		$.ajax({
			type: "POST",
			url: "/listing/" + listing_info.domain_name + "/new",
			data: {
				events: rental_info,
				rental_data: rental_data
			}
		}).done(function(data){
			console.log(data);
		});
	}
	else {
		console.log('log in pls');
	}
}