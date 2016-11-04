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
		var filename = (!file) ? "Upload CSV" : (file.name.length > 10) ? file.name.substr(0, 8) + "..." : file.name;
		$(".label-text").text(filename);
	});

});

//function to sumibt listings
function submitListingsBatch(){
	if (can_submit){
		$("#submit-button").addClass('is-loading');
		var formData = new FormData();
		formData.append('csv', $('#mult-csv')[0].files[0]);

        $.ajax({
			url: "/listings/create/batch",
            type: 'POST',
			data: formData,
            // Options to tell jQuery not to process data or worry about the content-type
            cache: false,
            contentType: false,
            processData: false
        }, 'json').done(function(data){
			$("#submit-button").removeClass('is-loading');
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
