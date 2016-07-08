var handler;
var unlock = true;

$(document).ready(function() {
	//--------------------------------------stripe configuration
	
	handler = StripeCheckout.configure({
		key: 'pk_test_kcmOEkkC3QtULG5JiRMWVODJ',
		name: 'w3bbi Domain Rental',
		image: '/images/www.jpg',
		panelLabel: 'Pay',
		zipCode : true,
		locale: 'auto',
		token: function(token) {
			// You can access the token ID with `token.id`.
			// Get the token ID to your server-side code for use.
			var $id = $('<input id="stripeToken" type=hidden name=stripeToken />').val(token.id);
			$('#listing_form_pay').append($id).submit();
		}
	});
	
	//--------------------------------------form submission clicks
	
	$('#stripe-button').click(function(){
		var amount = new_rental_info.price * 100;

		handler.open({
			amount: amount,
			description: 'Renting at ' + new_rental_info.listing_info.domain_name
		});

		return false;
	});

	$(".listing_form").submit(function(e){
		e.preventDefault();
		submitRentals($(this).attr("id"));
	});
	
	//--------------------------------------page update
		
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
			$(this).html(sanitizeHtml(new_text));
		}
	});

});


// Close Checkout on page navigation:
$(window).on('popstate', function() {
	handler.close();
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
		
		//change the background in real time
		var backgroundUrl = sanitizeHtml($("#background_input").val());
		if (backgroundUrl){
			var w3bbi_main_css = getStyleSheet("w3bbi_main_css");
			var official_css = getStyleSheet("official");
			w3bbi_main_css.insertRule("body {background:url(" + backgroundUrl + ") no-repeat center center", 0);
			official_css.disabled = 1;
			$("#background_input").val(sanitizeHtml($("#background_input").val()));
		}
	}
}

//helper function to get rental details
function rentalData(){
	var rental_details = [];
	var rental_data = {
		rental_details : rental_details
	};

	//new rental
	if (new_rental_info){
		switch (parseFloat(new_rental_info.type)){
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
		rental_data.rental_info = new_rental_info;
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
function submitRentals(id){
	//client side check if authenticated
	if (user){
		if (unlock){
			var rental_data = rentalData();
			var url = id == "listing_form_edit" ? "/"+rental_info.rental_id : "/pay";

			//lock the ajax
			unlock = false;
			
			$.ajax({
				type: "POST",	
				url: RemoveLastDirectoryPartOf(window.location.pathname) + url,
				data: {
					rental_info: rental_data.rental_info,
					rental_details: rental_data.rental_details,
					stripeToken: $("#stripeToken").val()
				}
			}).done(function(data){
				if (data.message == "success"){
					$("#message").html("Success!");
					
					//unlock on success
					unlock = true;
					
					//remove cookies since it was successful
					delete_cookie("local_events");
					delete_cookie("type");
					
					//if creating a new rental, redirect the URL to the new rental id
					if (data.rental_id){
						//replace the URL in the window
						history.replaceState(0, "", data.rental_id)
						window.location = window.location.pathname.replace(/\/[^\/]*$/, '/'+data.rental_id);
					}
				}
				else {
					$("#message").html("Something went wrong!");
					console.log(data);
				}
			});
		}
		else {
			$("#message").html("Please wait!");
		}
	}
	else {
		$("#message").html("Log in please!");
	}
}

//update page based on database data
function updatePage(html, data){

	//update w3bbi rental info for new rentals
	if (new_rental_info){
		//update pricing for stripe
		$("#stripe-button").data("amount", new_rental_info.price);
		$("#stripe-button").data("description", new_rental_info.listing_info.domain_name);
	
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
	}
	//update w3bbi rental info for editing rentals
	else {
		//update UTC time to local time
		rental_info.date = moment(new Date(rental_info.date + " UTC")).format('YYYY-MM-DD HH:mm:mm');
	
		for (var x = 0; x < rental_info.rentals.length; x++){
			var start = new Date(rental_info.rentals[x].date + " UTC");
			var end = new Date(start.getTime() + rental_info.rentals[x].duration);
			start = moment(start).format('YYYY, MMMM D, h:mm:ss A');
			end = moment(end).format('YYYY, MMMM D, h:mm:ss A');
			
			var rented_start = '<span id="rental_start">'+start+'</span>'
			var rented_end = '<span id="rental_end">'+end+'</span>'
			var rented_dates = $('<li>' + rented_start + ' -- ' + rented_end + '</li>')
			$("#rental_wrapper").append(rented_dates);
		}
	}

	//update rental preview
	var parsed = $.parseHTML(html);
	$("#rental_preview").append(parsed);
	document.body.addEventListener('transitionend', function(){
		if (data){
			for (var x = 0; x < data.length; x++){
				switch (data[x].text_key){
					case "css":
						var style_sheet = getStyleSheet("rental_main_css");
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
	}, false);
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

    //regular expression to find FTP, HTTP(S) and email URLs.
    var regexToken = /(((ftp|https?):\/\/)[\-\w@:%_\+.~#?,&\/\/=]+)|((mailto:)?[_.\w-]+@([\w][\w\-]+\.)+[a-zA-Z]{2,3})/g;

    //iterate through any URLs in the text.
    while( (matchArray = regexToken.exec( source )) !== null ){
        var token = matchArray[0];
        urlArray.push( token );
    }

    return urlArray;
}

//helper function to delete a cookie
function delete_cookie(name) {
	//document.cookie = [name, '=; expires=Thu, 01-Jan-1970 00:00:01 GMT; path=/; domain=.', window.location.host.toString()].join('');
	document.cookie = [name, '=; expires=Thu, 01-Jan-1970 00:00:01 GMT', '; path=/;'].join('');
}

//helper function to remove last part of URL
function RemoveLastDirectoryPartOf(the_url){
    var the_arr = the_url.split('/');
    the_arr.pop();
    return( the_arr.join('/') );
}