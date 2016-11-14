var can_submit = true;

$(document).ready(function() {
	//multiple submit
	$("#submit-button").click(function(e){
		e.preventDefault();

		if (!$('#mult-csv')[0].files[0]){
			$("#mult-message").text("You must select a file!")
		}
		else {
			submitListingsBatch();
		}
	});

	//filename label, file size and type verification
	$(':file').change(function(){
		can_submit = true;
		$("#submit-button").removeClass('is-disabled');

	    var file = this.files[0];
		var allowedMimeTypes = [
			"text/csv",
			"application/csv",
			"application/excel",
			"application/vnd.ms-excel",
			"application/vnd.msexcel",
			"text/comma-separated-values"
		];

		if (file){
			if (allowedMimeTypes.indexOf(file.type) <= -1) {
				$("#message").html('Wrong file type!');
				$(':file').val("");
			}
			else if (file.size > 50000){
				$("#message").html("File is too large!");
				$(':file').val("");
			}
		}

		//change upload button text label
		var filename = (!file) ? "Upload CSV" : (file.name.length > 10) ? file.name.substr(0, 10) + "..." : file.name;
		$(".label-text").text(filename);
	});

});

//function to sumibt listings
function submitListingsBatch(){
	if (can_submit){
		can_submit = false;
		$("#submit-button").addClass('is-loading');
		var formData = new FormData();
		formData.append('csv', $('#mult-csv')[0].files[0]);

        $.ajax({
			url: "/listings/create/multiple",
            type: 'POST',
			data: formData,
            // Options to tell jQuery not to process data or worry about the content-type
            cache: false,
            contentType: false,
            processData: false
        }, 'json').done(function(data){

			//reset the form
			$("#table-e").addClass('is-hidden');
			$(':file')[0].value = "";
			$(".label-text").text("Upload CSV");
			$("#submit-button").removeClass('is-loading').addClass('is-disabled');

			//handle any results
			goodListingHandler(data.good_listings);
			badListingHandler(data.bad_listings);

			if (data.state != "success"){
				console.log(data);
			}
		});
	}
}

//function to handle any good listings
function goodListingHandler(good_listings){
	if (good_listings.length > 0){
		$("#table-body-g").empty();
		$("#table-g").removeClass('is-hidden');

		for (var x = 0; x < good_listings.length; x++){
			var temp_tr = $("<tr></tr>");
			var temp_td_domain = $("<td>" + good_listings[x][0] + "</td>");
			var temp_td_description = $("<td>" + good_listings[x][1] + "</td>");

			temp_tr.append(temp_td_domain, temp_td_description);
			$("#table-body-g").append(temp_tr);
		}
	}
	else {
		$("#table-g").addClass('is-hidden');
	}
}

//function to handle any returned bad listings
function badListingHandler(bad_listings){
	if (bad_listings.length > 0){
		$("#table-body-b").empty();
		$("#table-b").removeClass('is-hidden');

		for (var x = 0; x < bad_listings.length; x++){
			var temp_tr = $("<tr></tr>");
			var temp_td_domain = $("<td>" + bad_listings[x].data[0] + "</td>");
			var temp_td_description = $("<td>" + bad_listings[x].data[1] + "</td>");
			var temp_td_reasons = $("<td></td>");

			//append all the reasons
			for (var y = 0; y < bad_listings[x].reasons.length; y++){
				var temp_reason = "<li>" + bad_listings[x].reasons[y] + "</li>";
				temp_td_reasons.append(temp_reason);
			}
			temp_tr.append(temp_td_domain, temp_td_description, temp_td_reasons);

			$("#table-body-b").append(temp_tr);
		}
	}
	else {
		$("#table-b").addClass('is-hidden');
	}
}
