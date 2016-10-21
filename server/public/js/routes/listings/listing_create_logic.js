var can_submit = true;

$(document).ready(function() {

    //section 1 - basic vs premium
    $(".box").click(function() {
        //styling the two buttons
        $(".box").removeClass("is-active").addClass("low-opacity");
        $(this).addClass("is-active").removeClass("low-opacity");

        //setting up next button logic
        setSectionNext(true);

        //to skip the pricing section or not depending on the listing type
        if ($(this).data("listing-type") == "basic"){
            $("#pricing-section").data('pageskip', true);
        }
        else {
            $("#pricing-section").data('pageskip', false);
        }
    });

    //section 2 - listing info
    $(".required-input").on("keydown, keyup", function(e){
        e.preventDefault();
        if ($("#sing-domain").val() && $("#sing-description").val()){
            //can go next when the value exists
            setSectionNext(true);

            //update the listing preview
            $("#preview_domain").text($("#sing-domain").val());
            $("#preview_description").text($("#sing-description").val());
        }
        else {
            setSectionNext(false);
        }
    });

    //section 3 - categories
    $(".cat-checkbox-label, .cat-checkbox").on("click", function(e){
        if ($('.cat-checkbox:checkbox:checked').length > 0){
            setSectionNext(true);
        }
        else {
            setSectionNext(false);
        }
    });

    //if theres an error in getting the image, remove the link
    $("#preview_image").error(function() {
        $(this).attr("src", "https://source.unsplash.com/category/people");
    });

    //section 3 - categories
    $(".price-input").on("keydown, keyup", function(e){
        var price_okay = true;
        //loop through to check
        $(".price-input").each(function(e){
            if (parseFloat($(this).val()) <= 0 || !($(this).val())){
                price_okay = false;
            }
        });

        //check prices are all there
        if (price_okay){
            setSectionNext(true);
        }
        else {
            setSectionNext(false);
        }
    });


    //next/prev button for sections
    $(".next-button").click(function() {
        var next_page = $(".section").not(".is-hidden").next(".section").attr("id").split("-")[0];
        changePage(next_page);
    });

    //previous button for sections
    $(".prev-button").click(function() {
        var previous_page = $(".section").not(".is-hidden").prev(".section").attr("id").split("-")[0];
        changePage(previous_page);
    });

    //submit button
    $("#submit-button").click(function(e){
		e.preventDefault();
		submitListings($(this));
	});

    //more info tooltips
    $(".fa-question-circle-o").click(function(e){
        console.log("more info pls");
    });

});

//function to set the current section as able to go next
function setSectionNext(bool){
    $(".section").not(".is-hidden").data("can-next", bool)
    if (bool){
        $("#next-button").removeClass("is-disabled");
    }
    else {
        $("#next-button").addClass("is-disabled");
    }
}

//function to go to a specific page
function changePage(section_id){
    $(".section").not("#buttons-section").addClass("is-hidden");  //hide all sections except bottom buttons
    var section_to_change_to = $("#" + section_id + "-section");
    section_to_change_to.removeClass('is-hidden');  //show correct one

    //first, disable prev
    if (section_id == "type"){
        $("#prev-button").addClass('is-disabled');
    }
    else {
        $("#prev-button").removeClass('is-disabled');
    }

    //last, hide next, show submit
    if (section_id == "preview"){
        $("#next-button").addClass('is-hidden');
        $("#submit-button").removeClass('is-hidden');
    }
    else {
        $("#next-button").removeClass('is-hidden');
        $("#submit-button").addClass('is-hidden');
    }

    //disabled if there isn't any data
    if (!section_to_change_to.data("can-next")){
        $("#next-button").addClass("is-disabled");
    }
    else {
        $("#next-button").removeClass("is-disabled");
    }
}

//--------------------------------------------------------------------------------------------------------SUBMISSION

//function to client-side check form
function listingData(){
	var listingData = {
		domain_name : $("#sing-domain").val(),
		description : $("#sing-description").val(),
		background_image : $("#sing-background").val(),
		purchase_link : $("#sing-purchase").val(),
        categories: ""
	}

    //categories string
    $(".cat-checkbox").each(function(e){
        if ($(this).prop("checked")){
            listingData.categories += $(this).val() + " ";
        }
    });

    var is_premium = $("#premium-box").hasClass("is-active");
    if (is_premium){
        //listingData.minute_price = $("#minute-price").val();
        listingData.hour_price = $("#hour-price").val();
        listingData.day_price = $("#day-price").val();
        listingData.week_price = $("#week-price").val();
        listingData.month_price = $("#month-price").val();
    }

    //checks
	if (!listingData.domain_name){
		 errorHandler("Invalid domain name!");
	}
	else if (!listingData.description){
		errorHandler("Invalid description!");
	}
    else if (listingData.categories.length <= 0){
        errorHandler("Invalid categories!");
    }
	// else if (parseFloat(listingData.minute_price) != listingData.minute_price >>> 0){
	// 	console.log("Invalid minute price!");
	// }
	else if	(is_premium && parseFloat(listingData.hour_price) != listingData.hour_price >>> 0){
		errorHandler("Invalid hourly price!");
	}
	else if (is_premium && parseFloat(listingData.day_price) != listingData.day_price >>> 0){
		errorHandler("Invalid daily price!");
	}
	else if (is_premium && parseFloat(listingData.week_price) != listingData.week_price >>> 0){
		errorHandler("Invalid weekly price!");
	}
	else if (is_premium && parseFloat(listingData.month_price) != listingData.month_price >>> 0){
		errorHandler("Invalid monthly price!");
	}
	else {
		return listingData;
	}
}

//function to submit listings
function submitListings(submit_button){
	var submit_data = listingData();
	if (can_submit && submit_data){

        submit_button.addClass('is-loading');
        can_submit = false;

		$.ajax({
			type: "POST",
			url: "/listing/create",
			data: submit_data
		}).done(function(data){
			can_submit = true;
            submit_button.removeClass('is-loading').addClass('is-hidden');

			if (data.state == "success"){
                //reset the datas to default value
                $(".box").removeClass("is-active low-opacity");
                $(".input").val("");
                $(".cat-checkbox").prop('checked', false);
                $(".price-input").each(function(e){
                    $(this).val($(this).prop("defaultValue"));
                });

                //change to first page
                changePage("type");
			}
			else if (data.state == "error"){
				console.log(data);
                errorHandler(data.message);
			}
		});
	}
}

//handling of various errors sent from the server
function errorHandler(error_selector){
    var error_codes = ["description", "domain", "background", "buy", "category", "minute","hour", "day", "week", "month"];

    if (error_codes.indexOf(error_selector) != -1){
        //hide all sections
        $(".section").not("#buttons-section").addClass("is-hidden");

        //show the right section and highlight which one is wrong
        var error_msg_elem = $("#" + error_selector + "-error-message");
        error_msg_elem.closest(".section").removeClass('is-hidden');
        error_msg_elem.text("Invalid " + error_selector + "!").addClass("is-danger");
    }
}
