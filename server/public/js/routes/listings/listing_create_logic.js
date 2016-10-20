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

    //next/prev button for sections
    $(".next-button").click(function() {
        changePage(false);
    });

    //previous button for sections
    $(".prev-button").click(function() {
        changePage(true);
    });

    //submit button
    $("#submit-button").click(function(e){
		e.preventDefault();
		submitListings();
	});

    //more info tooltips
    $(".fa-question-circle-o").click(function(e){
        console.log("more info pls");
    });

});

//function to set the current section as able to go next
function setSectionNext(bool){
    $(".current-section").data("can-next", bool)
    if (bool){
        $("#next-button").removeClass("is-disabled");
    }
    else {
        $("#next-button").addClass("is-disabled");
    }
}

//function to change pages and add disabled to buttons
function changePage(prev){
    var current_page = $(".current-section");
    if (prev){
        var upcoming_page = $(".current-section").prev(".section");
    }
    else {
        var upcoming_page = $(".current-section").next(".section");
    }

    //skip the price page if its a basic listing
    if (upcoming_page.data("pageskip") == true){
        upcoming_page = (prev) ? upcoming_page.prev(".section") : upcoming_page.next(".section");
    }

    var nextpagenum = upcoming_page.data('pagenum');

    //first page, disable previous
    if (nextpagenum == 1){
        $("#prev-button").addClass("is-disabled");
    }
    else if (nextpagenum != 4 && upcoming_page.data("can-next") != true){
        $("#next-button").addClass("is-disabled");
        $("#prev-button").removeClass("is-disabled");
    }
    else {
        $("#prev-button").removeClass("is-disabled");
    }

    //remove next disable if we went back
    if (prev){
        $("#next-button").removeClass("is-disabled");
    }

    //last page, hide buttons
    if (nextpagenum == 5){
        $("#next-button, #prev-button").addClass('is-hidden');
        $("#submit-button").removeClass('is-hidden');
    }
    else {
        $("#next-button, #prev-button").removeClass('is-hidden');
        $("#submit-button").addClass('is-hidden');
    }

    current_page.addClass("is-hidden").removeClass("current-section");
    upcoming_page.addClass("current-section").removeClass("is-hidden");
}

//--------------------------------------------------------------------------------------------------------SUBMISSION

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
		console.log("Invalid domain name!");
	}
	else if (!listingData.description){
		console.log("Invalid description!");
	}
	else if (parseFloat(listingData.minute_price) != listingData.minute_price >>> 0){
		console.log("Invalid minute price!");
	}
	else if	(parseFloat(listingData.hour_price) != listingData.hour_price >>> 0){
		console.log("Invalid hourly price!");
	}
	else if (parseFloat(listingData.day_price) != listingData.day_price >>> 0){
		console.log("Invalid daily price!");
	}
	else if (parseFloat(listingData.week_price) != listingData.week_price >>> 0){
		console.log("Invalid weekly price!");
	}
	else if (parseFloat(listingData.month_price) != listingData.month_price >>> 0){
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
