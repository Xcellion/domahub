var unlock = true

$(document).ready(function() {

	//--------------------------------------x-editable configuration

	$.fn.editable.defaults.mode = 'inline';		//inline-mode for editing editable elements

	$(".editable-detail").editable({
		mode: "popup",
		placement: "right",
		showbuttons: "bottom",
		highlight: "transparent",
		validate: validateNewVal,
		emptytext: "This will be blank!"
	}).on('shown', function(ev, editable) {
	    setTimeout(function() {
	        editable.input.$input.select();
	    },0);
	});

	$(".editable-info").editable({
		showbuttons: false,
		onblur: "submit",
		highlight: "transparent",
		validate: validateNewVal,
		emptytext: "Default value"
	}).on('shown', function(ev, editable) {
	    setTimeout(function() {
	        editable.input.$input.select();
	    },0);
	});
	$('.x-editable').editable('toggleDisabled');

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
			$('#edit_details_pay').append($id).submit();
		}
	});

	//--------------------------------------form submission clicks

	$('#stripe-button').click(function(e){
		e.preventDefault();
		if ($("#edit_now_details").is(":visible")){
			$("#message").text("Please finish editing first!");
		}
		else {
			var amount = new_rental_info.price * 100;

			handler.open({
				amount: amount,
				description: 'Renting at ' + new_rental_info.listing_info.domain_name
			});

			return false;
		}
	});

	$(".edit_details_form").submit(function(e){
		e.preventDefault();
		if ($("#edit_now_details").is(":visible")){
			$("#message").text("Please finish editing first!");
		}
		else {
			submitRentals($(this).attr("id"));
		}
	});

	if (rental_info){
		appendRentals(rental_info.times, false);
	}
	if (new_rental_info){
		//update pricing for stripe
		$("#stripe-button").data("amount", new_rental_info.price);
		$("#stripe-button").data("description", new_rental_info.listing_info.domain_name);
		appendRentals(new_rental_info.times, true);
	}

	$("#w3bbi_hider").click(function(e){ toggleW3bbi(true);});
	$("#rental_preview").click(function(e){ toggleW3bbi(false);});
	$("#edit_now").click(function(e){ toggleEdit();});

});

//-----------------------------------------------------------------------------------VISUAL

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
	//finished editing
	if ($("#edit_now_details").is(":visible")){
		$('#edit_now').text("Edit page");
		$("#edit_now_details").stop().slideUp(function(event){
			$('.x-editable').editable('toggleDisabled');
			$("#message").text("Saved edits!");
		});
	}
	//editing
	else {
		$('.x-editable').editable('toggleDisabled');
		$("#message").text("Currently editing!");
		$("#edit_now_details").stop().slideDown();
		$('#edit_now').html("Save edits");
	}
}

//helper function to append rental dates once changed to local instead of UTC
function appendRentals(rentals, new_rental){
	for (var x = 0; x < rentals.length; x++){
		if (new_rental){
			start = moment(rentals[x].start).format('YYYY, MMMM D, hh:mm A');
			end = moment(rentals[x].end).format('YYYY, MMMM D, hh:mm A');
		}
		else {
			start = moment(rentals[x].date).local()._d.getTime();
			end = moment(start + rentals[x].duration).format('YYYY, MMMM D, hh:mm A');
			start = moment(start).format('YYYY, MMMM D, hh:mm A');
		}

		var rented_start = '<span id="rental_start">'+start+'</span>';
		var rented_end = '<span id="rental_end">'+end+'</span>';
		var rented_dates = $('<li>' + rented_start + ' -- ' + rented_end + '</li>');

		var wrapper = new_rental ? "#new_rental_wrapper" : "#rental_wrapper";
		$(wrapper).append(rented_dates);
	}
}

//-----------------------------------------------------------------------------------

//function to validate client values for a new rental
function validateNewVal(value){
	id = $(this).attr("id")
	switch (id){
		case ("background_image_input"):
			//change the background in real time
			image = ($.trim(value) == "") ? def_rental_info[id.substr(0, id.length - 6)] : value;
			$("#background_image").attr("src", sanitizeHtml(image));
		case ("favicon_input"):
		case ("title_input"):
			if (value && (value != def_rental_info[id.substr(0, id.length - 6)])){
				$(this).data("changed", true);
				$(this).data("value", value);
				return {newValue: sanitizeHtml(value)};
			}
			break;
		case ("main_text"):
		case ("middle_text"):
		case ("main_font"):
		case ("middle_font"):
		case ("main_color"):
		case ("middle_color"):
		case ("location"):
			if (value != def_rental_info.details[0][id]){
				$(this).data("changed", true);
				return {newValue: sanitizeHtml(value)};
			}
	}
}

//helper function to get rental details
function rentalData(){
	var rental_details = [];
	var temp_info = {
		rental_details : rental_details
	};

	//create rental details
	$(".text_wrapper").each(function(wrapper){
		tempDetail = {};
		$(this).find(".editable-detail").each(function(editable){
			id = $(this).attr("id");
			tempDetail[id] = $(this).data("changed") ? $(this).text() : null;		//text
			tempDetail[id.split("_")[0] + "_color"] = $(this).data("changed") ? $(this).data("color") : null;		//color
			tempDetail[id.split("_")[0] + "_font"] = $(this).data("changed") ? $(this).data("font") : null;		//font
		});
		tempDetail.location = "";		//todo
		rental_details.push(tempDetail);
	})

	//create rental info
	$(".editable-info").each(function(editable){
		id = $(this).attr("id");
		temp_info[id.substr(0, id.length - 6)] = $(this).data("changed") ? $(this).data("value") : null;
	});

	if (rental_info){
		temp_info.type = rental_info.type;
		temp_info.times = rental_info.times;
		temp_info.price = rental_info.price;
	}

	return temp_info;
}

//function to submit new rental info
function submitRentals(id){
	//client side check if authenticated
	if (!user){
		$("#message").html("Log in please!");
	}
	else {
		if (!unlock){
			$("#message").text("Please wait!");
		}
		else {
			unlock = false;		//lock the ajax
			var rental_data = rentalData();
			rental_data.stripeToken = $("#stripeToken").val()
			var url = id == "edit_details" ? "/" + rental_info.rental_id : "/pay";		//pay or not

			$.ajax({
				type: "POST",
				url: RemoveLastDirectoryPartOf(window.location.pathname) + url,
				data: rental_data
			}).done(function(data){
				unlock = true;
				delete_cookies();
				if (data.message == "success"){
					$("#message").html("Success!");

					//if creating a new rental, redirect the URL to the new rental id
					if (data.rental_id){
						//replace the URL in the window
						history.replaceState(0, "", data.rental_id)
						window.location = window.location.pathname.replace(/\/[^\/]*$/, '/'+data.rental_id);
					}
				}
				else if (data.message){
					$("#message").text(data.message);
					console.log(data);
				}
				else {
					$("#message").html("Something went wrong!");
					console.log(data);
				}
			});
		}
	}
}

//helper function to remove last part of URL
function RemoveLastDirectoryPartOf(the_url){
    var the_arr = the_url.split('/');
    the_arr.pop();
    return( the_arr.join('/') );
}

//Function to convert hex format to a rgb color
function rgb2hex(rgb){
	rgb = rgb.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i);
	return (rgb && rgb.length === 4) ?
	("0" + parseInt(rgb[1],10).toString(16)).slice(-2) +
	("0" + parseInt(rgb[2],10).toString(16)).slice(-2) +
	("0" + parseInt(rgb[3],10).toString(16)).slice(-2) : '';
}
