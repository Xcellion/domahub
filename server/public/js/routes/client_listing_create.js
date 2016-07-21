var can_submit = true;

$(document).ready(function() {

	$("#batch_listing_show").click(function(e){
		$("#batch_form_wrapper").toggle();
	})

	$("#listing_form").submit(function(e){
		e.preventDefault();
		submitListings();
	});
});

//function to sumibt listings
function submitListings(){
	if (can_submit){
		can_submit = false;
		$.ajax({
			type: "POST",
			url: "/listing/create",
			data: {
				domain_name: $("#listing_form_domain_name").val(),
				description: $("#listing_form_description").val()
			}
		}).done(function(data){
			can_submit = true;
			if (data.state == "success"){
				$("#message").html(data.message);

				//random human hash
				$("#hash_wrapper").show();
				$("#hash_code").text(data.listing_info.hash);
			}
			else if (data.state == "error"){
				$("#message").html(data.message);
			}
			else {
				console.log(data);
			}
		});
	}
}
