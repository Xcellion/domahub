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
	
	updatePage(rental_html, rental_details);
	
	$("#w3bbi_hider").click(function(e){
		toggleW3bbi(true);
	});
	
	$("#rental_preview").click(function(e){
		toggleW3bbi(false);
	});
	
	$("#edit_now").click(function(e){
		toggleEdit();
	});
	
	$("body").on("click", ".highlight", function(e){
		var new_text = prompt("Enter new text:", $(this).html());
		
		//change if different
		if (new_text != $(this).html() && new_text != null){
			$(this).html(new_text);
		}
	});
});

//toggler to hide w3bbi info
function toggleW3bbi(show){
	if (show){
		$("#w3bbi_hider").hide("slide", { direction: "left" });
		$("#w3bbi_wrapper").show("slide", { direction: "left" });
	}
	else {
		$("#w3bbi_hider").show("slide", { direction: "left" });
		$("#w3bbi_wrapper").hide("slide", { direction: "left" });
	}
}

//toggler to edit the page
function toggleEdit(){
	$(".editable").toggleClass("highlight");
	
	if ($("#edit_now_details").is(":visible")){
		$("#edit_now_details").slideUp();
	}
	else {
		$("#edit_now_details").slideDown();
	}

	if ($('#edit_now').html() == "Edit now"){
		$('#edit_now').html("Finish editing");
	}
	else {
		$('#edit_now').html("Edit now");
	}
}

//helper function to get rental details
function rentalData(){
	var rental_details = [];
	var rental_data = {
		rental_details : rental_details
	};

	//new rental
	if (new_listing_info){
		switch (parseFloat(new_listing_info.type)){
			case 0:
				if ($("#background_input").val()){
					var detail = [ "css", $("#background_input").val() ]
					rental_details.push(detail);
				}
				$(".editable").each(function(){
					var rental_pair = [];
					rental_pair.push($(this).attr("id"));
					rental_pair.push($(this).html());
					rental_details.push(rental_pair);
				});
				break;
			case 1:
				var detail = {
					rental_key: "redirect",
					rental_value: $("#url_input").val()
				}
				rental_details.push(detail);
				break;
		}
		rental_data.rental_info = new_listing_info;
	}
	//editing rental
	else {
		rental_data.rental_info = rental_info;
		if ($("#background_input").val()){
			var detail = [ "css", $("#background_input").val() ]
			rental_details.push(detail);
		}
		$(".editable").each(function(){
			var rental_pair = [];
			rental_pair.push($(this).attr("id"));
			rental_pair.push($(this).html());
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
			if (data == "Success"){
				$("#message").html(data);
				//remove cookies since it was successful
				delete_cookie("local_events");
				delete_cookie("type");
			}
			else {
				$("#message").html(data);
			}
		});
	}
	else {
		console.log('log in pls');
	}
}

//update page based on database data
function updatePage(html, data){

	//update w3bbi rental info
	for (var x = 0; x < rental_info.length; x++){
		var start = new Date(rental_info[x].start);
		start = moment(start).format('YYYY, MMMM D, h:mm:ss A');
		var end = new Date(rental_info[x].end);
		end = moment(end).format('YYYY, MMMM D, h:mm:ss A');
		
		var rented_start = '<span id="rental_start">'+start+'</span>'
		var rented_end = '<span id="rental_end">'+end+'</span>'
		var rented_dates = $('<li>' + rented_start + ' -- ' + rented_end + '</li>')
		$("#rental_wrapper").append(rented_dates);
	}

	//update rental preview
	var parsed = $.parseHTML(html);
	$("#rental_preview").append(parsed);
	if (data){
		for (var x = 0; x < data.length; x++){
			switch (data[x].text_key){
				case "css":
					var style_sheet = getStyleSheet("main_css");
					style_sheet.insertRule(data[x].text_value, 0);
					$("#background_input").val(findUrls(data[x].text_value));
					break;
				case "head":
					var tempElem = $(data[x].text_key);
					tempElem.append(data[x].text_value);
					break;
				default:
					var tempElem = $("#" + data[x].text_key);
					tempElem.append(data[x].text_value);
					break;
			}
		}
	}
}

//helper function to get CSS style sheet
function getStyleSheet(unique_title) {
	for (var i=0; i < document.styleSheets.length; i++) {
		var sheet = document.styleSheets[i];
		if ($(sheet.ownerNode).attr("class") == unique_title) {
			return sheet;
		}
	}
}

//helper function to find URLs in a text
function findUrls( text ){
    var source = (text || '').toString();
    var urlArray = [];
    var url;
    var matchArray;

    // Regular expression to find FTP, HTTP(S) and email URLs.
    var regexToken = /(((ftp|https?):\/\/)[\-\w@:%_\+.~#?,&\/\/=]+)|((mailto:)?[_.\w-]+@([\w][\w\-]+\.)+[a-zA-Z]{2,3})/g;

    // Iterate through any URLs in the text.
    while( (matchArray = regexToken.exec( source )) !== null ){
        var token = matchArray[0];
        urlArray.push( token );
    }

    return urlArray;
}

//helper function to delete a cookie
function delete_cookiedelete_cookie(name) {
	//document.cookie = [name, '=; expires=Thu, 01-Jan-1970 00:00:01 GMT; path=/; domain=.', window.location.host.toString()].join('');
	document.cookie = [name, '=; expires=Thu, 01-Jan-1970 00:00:01 GMT', '; path=/;'].join('');
}