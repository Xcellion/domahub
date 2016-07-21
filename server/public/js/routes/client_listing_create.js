var can_submit = true;

$(document).ready(function() {

	$("#batch_listing_show").click(function(e){
		$("#batch_form_wrapper").toggle();
	});

	$("#listing_form").submit(function(e){
		e.preventDefault();
		submitListings();
	});

	//file size and type verification
	$(':file').change(function(){
	    var file = this.files[0];
		var allowedMimeTypes = [
			"text/csv",
			"application/csv",
			"application/excel",
			"application/vnd.ms-excel",
			"application/vnd.msexcel",
			"text/comma-separated-values"
		];

		if (allowedMimeTypes.indexOf(file.type) <= -1) {
			$("#message").html('Wrong file type!');
			$(':file').val("");
		}
		else if (file.size > 50000){
			$("#message").html("File is too large!");
			$(':file').val("");
		}
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

			//reset the data
			$("#listing_form_domain_name").val("");
			$("#listing_form_description").val("");
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
