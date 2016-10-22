var can_submit = true;

$(document).ready(function() {

    //check for any existing cookies and set the data
    var existing_data = read_cookie("listing_data");
    if (existing_data){
        var basic_bool = $("#basic-box");
        for (var key in existing_data){
            //other inputs
            if (existing_data[key] != "" && key != "categories"){
                $("#" + key + "-input").val(existing_data[key]);
                if (['hour_price', 'day_price', 'week_price', 'month_price'].indexOf(key) != -1){
                    var basic_bool = $("#premium-box");;
                };
            }
            //categories
            else if (key == "categories" && existing_data[key] != ""){
                var existing_categories = existing_data[key].split(" ");
                for (var x = 0; x < existing_categories.length; x++){
                    $("#" + existing_categories[x] + "-category").prop("checked", true);
                }

                setSectionNext(existing_categories.length > 0, "category");
            }
        }

        setSectionNext($("#domain_name-input").val() && $("#description-input").val(), "info");

        //if we selected something
        if (basic_bool){
            $(".box").removeClass("is-active").addClass("low-opacity");
            basic_bool.addClass("is-active").removeClass("low-opacity");
            setSectionNext(true, "type");
            setPremium(basic_bool.data("listing-type") == "basic");  //setting up premium listing logic
            changePage("type");
        }
    }

    //section 1 - basic vs premium
    $(".box").click(function() {
        //styling the two buttons
        $(".box").removeClass("is-active").addClass("low-opacity");
        $(this).addClass("is-active").removeClass("low-opacity");

        bake_cookie("listing_data", getListingData());
        setSectionNext(true, "type");  //setting up next button logic
        setPremium($(this).data("listing-type") == "basic");  //setting up premium listing logic
    });

    //section 2 - listing info
    $(".required-input").on("change keyup paste", function(e){
        if ($("#domain_name-input").val() && $("#description-input").val()){
            //update the listing preview
            $("#preview-domain").text($("#domain_name-input").val());
            $("#preview-description").text($("#description-input").val());
        }
        bake_cookie("listing_data", getListingData());
        setSectionNext($("#domain_name-input").val() && $("#description-input").val(), "info");
    });

    //section 2 - background image
    $("#background_image-input").on("change keyup paste", function(e){
        if ($("#background_image-input").val()){
            //update the listing preview
            $("#preview-background").attr("src", $("#background_image-input").val());
        }
        bake_cookie("listing_data", getListingData());
    });

    //if theres an error in getting the image, remove the link
    $("#preview-background").error(function() {
        $(this).attr("src", "https://source.unsplash.com/category/people");
    });

    //section 3 - categories
    $(".cat-checkbox-label, .cat-checkbox").on("click", function(e){
        bake_cookie("listing_data", getListingData());
        setSectionNext($('.cat-checkbox:checkbox:checked').length > 0, "category");
    });

    //section 4 - pricing
    $(".price-input").on("change keyup paste mousewheel", function(e){
        //update listing preview
        if (parseFloat($(this).val()) > 0){
            $("#preview-" + $(this).attr("id")).find(".green_text").text("$" + $(this).val());
        }

        setSectionNext(checkPrices(), "pricing");
        bake_cookie("listing_data", getListingData());
    });

    //next/prev button for sections
    $(".next-button").click(function() {
        var next_page = $(".section").not(".is-hidden").next(".section");
        //skip next page if its pricing and we're creating a basic listing
        if (next_page.data("pageskip")){
            next_page = next_page.next('.section');
        }
        var next_page_id = next_page.attr("id").split("-")[0];
        changePage(next_page_id);
    });

    //previous button for sections
    $(".prev-button").click(function() {
        var previous_page = $(".section").not(".is-hidden").prev(".section");
        //skip next page if its pricing and we're creating a basic listing
        if (previous_page.data("pageskip")){
            previous_page = previous_page.prev('.section');
        }
        var previous_page_id = previous_page.attr("id").split("-")[0];
        changePage(previous_page_id);
    });

    //more info tooltips
    $(".fa-question-circle-o").click(function(e){
        console.log("more info pls");
    });

});

//function to check if all prices are good
function checkPrices(){
    var price_okay = true;
    //loop through to check
    $(".price-input").each(function(e){
        if (parseFloat($(this).val()) <= 0 || !$(this).val()){
            price_okay = false;
        }
    });
    return price_okay;
}

//function to set the current section as able to go next
function setSectionNext(bool, section_selector){
    $("#" + section_selector + "-section").data("can-next", bool);
    if (bool){
        $("#next-button").removeClass("is-disabled");
    }
    else {
        $("#next-button").addClass("is-disabled");
    }
}

//function to set up premium payment
function setPremium(basic_bool){
    //if basic, so skip the pricing
    $("#pricing-section").data('pageskip', basic_bool);

    if (basic_bool){
        $("#submit-button-text").text("Submit");

        //submit button basic event binder
        $("#submit-button").off().on("click", function(e){
            e.preventDefault();
            submitListing($(this), checkListingData(), "basic", null);
        });
    }
    else {
        $("#submit-button-text").text("Pay Now");

        //submit button premium event binder
        $("#submit-button").off().on("click", function(e){
            e.preventDefault();
            submitListingsPremium($(this), checkListingData());
        });
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

    //animate the progress bar
    $('.progress').animate({
        value: section_to_change_to.data("progress-percent")
    }, {
        step: function(current_number){
            $(this).val(current_number);
        }
    });

}

//--------------------------------------------------------------------------------------------------------SUBMISSION

//function to get the current listing data
function getListingData(){
    var listingData = {
		domain_name : $("#domain_name-input").val(),
		description : $("#description-input").val(),
		background_image : $("#background_image-input").val(),
		purchase_link : $("#purchase_link-input").val(),
        categories: ""
	}

    //categories string
    $(".cat-checkbox").each(function(e){
        if ($(this).prop("checked")){
            listingData.categories += $(this).val() + " ";
        }
    });

    //premium prices
    var is_premium = $("#premium-box").hasClass("is-active");
    if (is_premium){
        //listingData.minute_price = $("#minute_price-input").val();
        //listingData.year_price = $("#year_price-input").val();
        listingData.hour_price = $("#hour_price-input").val();
        listingData.day_price = $("#day_price-input").val();
        listingData.week_price = $("#week_price-input").val();
        listingData.month_price = $("#month_price-input").val();
    }

    return listingData;
}

//function to client-side check form
function checkListingData(){
	var listingData = getListingData();

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
function submitListing(submit_button, submit_data, url){
    $("#submit-button").addClass('is-loading');

	if (can_submit && submit_data){
        can_submit = false;

		$.ajax({
			type: "POST",
			url: "/listing/create/" + url,
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
                //display error message if there is one
                if (data.message){
                    errorHandler(data.message);
                }
                //redirect if told to
                else if (data.redirect){
                    window.location = window.location.origin + data.redirect;
                }
			}
		});
	}
}

//function to handler stripe stuff
function submitListingsPremium(submit_button, submit_data){
	if (can_submit && submit_data){

        //stripe configuration
        var handler = StripeCheckout.configure({
            key: 'pk_test_kcmOEkkC3QtULG5JiRMWVODJ',
            name: 'Domahub Domain Rentals',
            image: '/images/d-logo.PNG',
            panelLabel: 'Pay Monthly',
            zipCode : true,
            locale: 'auto',
            email: user.email,
            token: function(token) {
                if (token.email != user.email){
                    submit_button.removeClass("is-loading");
                }
                else {
                    submit_data.stripeToken = token.id;
                    submitListing(submit_button, submit_data, "premium");
                }
            }
        });

        handler.open({
            amount: 500,
            description: "Creating a Premium listing."
        });

        //close Checkout on page navigation
        window.addEventListener('popstate', function() {
            handler.close();
            submit_button.removeClass("is-loading");
        });

	}
}

//handling of various errors sent from the server
function errorHandler(error_selector){
    var error_codes = ["description", "domain", "background", "buy", "category", "minute","hour", "day", "week", "month"];

    if (error_codes.indexOf(error_selector) != -1){
        var error_msg_elem = $("#" + error_selector + "-error-message");
        changePage(error_msg_elem.closest(".section").attr("id").split("-")[0]);
        error_msg_elem.text("Invalid " + error_selector + "!").addClass("is-danger");
    }
    //stripe or something else
    else {

    }
}
