var can_submit = true;

$(document).ready(function() {

	//to toggle between single submit and multi-submit
	$(".mult-toggle").click(function(e){
		$("#sing-form").toggleClass("is-hidden");
		$("#mult-form-wrapper").toggleClass("is-hidden");
		var mult = "Multiple listings?";
		var sing = "Single listing?";
		$(this).text($(this).text() == mult ? sing : mult);
	});

	//single submit
	$("#sing-form").submit(function(e){
		e.preventDefault();
		submitListings();
	});

	//multiple submit
	$("#mult-form").submit(function(e){
		e.preventDefault();

		if (!$('#mult-csv')[0].files[0]){
			$("#mult-message").text("You must select a file!")
		}
		else {
			submitListingsBatch();
		}
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

//function to client-side check form
function listingData(){
	var listingData = {
			domain_name : $("#sing-domain").val(),
			description : $("#sing-description").val(),
			minute_price : $("#minute-price").val(),
			hour_price : $("#hour-price").val(),
			day_price : $("#day-price").val(),
			week_price : $("#week-price").val(),
			month_price : $("#month-price").val(),
			background_image : $("#sing-background").val(),
			purchase_link : $("#sing-purchase").val()
		}

	if (!listingData.domain_name){
		$("#message").text("Invalid domain name!");
		console.log("Invalid domain name!");
	}
	else if (!listingData.description){
		$("#message").text("Invalid description!");
		console.log("Invalid description!");
	}
	else if (parseFloat(listingData.minute_price) != listingData.minute_price >>> 0){
		$("#message").text("Invalid minute price!");
		console.log("Invalid minute price!");
	}
	else if	(parseFloat(listingData.hour_price) != listingData.hour_price >>> 0){
		$("#message").text("Invalid hourly price!");
		console.log("Invalid hourly price!");
	}
	else if (parseFloat(listingData.day_price) != listingData.day_price >>> 0){
		$("#message").text("Invalid daily price!");
		console.log("Invalid daily price!");
	}
	else if (parseFloat(listingData.week_price) != listingData.week_price >>> 0){
		$("#message").text("Invalid weekly price!");
		console.log("Invalid weekly price!");
	}
	else if (parseFloat(listingData.month_price) != listingData.month_price >>> 0){
		$("#message").text("Invalid monthly price!");
		console.log("Invalid monthly price!");
	}
	else {
		return listingData;
	}
}

//function to submit listings
function submitListings(){
	var submit_data = listingData();
	if (can_submit && submit_data){
		$.ajax({
			type: "POST",
			url: "/listing/create",
			data: submit_data
		}).done(function(data){

			//reset the data to default value
			$(".input").val("");
			$(".price-input ").each(function(e){
				$(this).val($(this).prop("defaultValue"));
			});

			can_submit = true;

			if (data.state == "success"){
				$("#mult-message").text("Success!")
			}
			else if (data.state == "error"){
				$("#mult-message").html(data.message);
			}
			else {
				console.log(data);
			}
		});
	}
}

//function to sumibt listings
function submitListingsBatch(){
	if (can_submit){
		var formData = new FormData();
		formData.append('csv', $('#mult-csv')[0].files[0]);

        $.ajax({
			url: "/listing/create/batch",
            type: 'POST',
			data: formData,
            // Options to tell jQuery not to process data or worry about the content-type
            cache: false,
            contentType: false,
            processData: false
        }, 'json').done(function(data){
			if (data.state == "success"){
				can_submit = true;
				if (data.state == "success"){
					$("#mult-message").text("Success!")
				}
				else {
					$("#mult-message").text("Something is wrong with your CSV formatting!")

					//display all the reasons why the upload failed
					bad_listings = data.bad_listings;

					if (bad_listings){
						for (var x = 0; x < bad_listings.length; x++){
							bad_row = $("<div class='bad-row'>Row #" + bad_listings[x].row + "</div>");
							for (var y = 0; y < bad_listings[x].reasons.length; y++){
								reason = $("<li class='bad-reason'>" + bad_listings[x].reasons[y] + " </li>");
								bad_row.append(reason);
							}
							$("#mult-message").append(bad_row);
						}
					}
				}
			}
			else {
				can_submit = true;
				console.log(data);
				$("#mult-message").text("Something went wrong!")
			}
		});
	}
}
