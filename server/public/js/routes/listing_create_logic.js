var can_submit = true;

$(document).ready(function() {

	//to toggle between single submit and multi-submit
	$("#mult_toggle").click(function(e){
		$(".form_wrapper").toggle();
		var mult = "Multiple listings?";
		var sing = "Single listing?";
		$(this).text($(this).text() == mult ? sing : mult);
	});

	//single submit
	$("#sing_form").submit(function(e){
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

//function to client-side check form
function listingData(){
	var listingData = {
			domain_name : $("#sing_domain").val(),
			description : $("#sing_description").val(),
			minute_price : $("#minute_price").val(),
			hour_price : $("#hour_price").val(),
			day_price : $("#day_price").val(),
			week_price : $("#week_price").val(),
			month_price : $("#month_price").val(),
			background_image : $("#background_image").val(),
			buy_link : $("#buy_link").val()
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

//function to sumibt listings
function submitListings(){
	var submit_data = listingData();
	if (can_submit && submit_data){
		$.ajax({
			type: "POST",
			url: "/listing/create",
			data: submit_data
		}).done(function(data){
			alert('w')
			//reset the data
			$(".input").val("");
			can_submit = true;

			if (data.state == "success"){
				$("#message").html(data.message);
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
