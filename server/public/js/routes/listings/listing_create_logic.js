var can_submit = true;

//on back button
window.onpopstate = function(event) {
    changePage(window.location.hash.split("?")[0].replace("#", ""));
};

//function to update the page string query params
function updateQueryStringParam(key, value) {
    var uri = window.location.pathname + window.location.hash;
    var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
    var separator = uri.indexOf('?') !== -1 ? "&" : "?";
    if (value){
        if (uri.match(re)) {
            history.replaceState({}, "", uri.replace(re, '$1' + key + "=" + value + '$2'));
        }
        else {
            history.replaceState({}, "", uri + separator + key + "=" + value);
        }
    }
    else {
        // remove key-value pair if value is empty
        uri = uri.replace(new RegExp("([?&]?)" + key + "=[^&]*", "i"), '');
        if (uri.slice(-1) === '?') {
          uri = uri.slice(0, -1);
        }
        // replace first occurrence of & by ? if no ? is present
        if (uri.indexOf('?') === -1) uri = uri.replace(/&/, '?');
        history.replaceState({}, "", uri);
    }
}

//function to add all prices or remove them
function addRemovePricesQueryString(bool){
    //add
    if (bool){
        updateQueryStringParam("hour_price", $("#hour_price-input").val());
        updateQueryStringParam("day_price", $("#day_price-input").val());
        updateQueryStringParam("week_price", $("#week_price-input").val());
        updateQueryStringParam("month_price", $("#month_price-input").val());
    }
    //remove
    else {
        updateQueryStringParam("hour_price");
        updateQueryStringParam("day_price");
        updateQueryStringParam("week_price");
        updateQueryStringParam("month_price");
    }
}

$(document).ready(function() {

    //if no hash, go to the first page
    if (window.location.hash == ""){
        window.location.hash = "type";
    }
    else {
        changePage(window.location.hash.split("?")[0].replace("#", ""));
    }

    //section 1 - basic vs premium
    $(".box").click(function() {
        //styling the two buttons
        $(".box").removeClass("is-active").addClass("low-opacity");
        $(this).addClass("is-active").removeClass("low-opacity");

        setSectionNext(true, "type");  //setting up next button logic
        updateQueryStringParam("type", $(this).data("listing-type"));
        setPremium($(this).data("listing-type") == "basic");  //setting up premium listing logic
    });

    //section 2 - listing info
    $(".required-input").on("change keyup paste", function(e){
        if ($("#domain_name-input").val() && $("#description-input").val()){
            //update the listing preview
            $("#preview-domain").text($("#domain_name-input").val());
            $("#preview-description").text($("#description-input").val());
        }
        setSectionNext($("#domain_name-input").val() && $("#description-input").val(), "info");
        updateQueryStringParam("domain_name", $("#domain_name-input").val());
        updateQueryStringParam("description", $("#description-input").val());
    });

    //section 3 - categories
    $(".cat-checkbox-label, .cat-checkbox").on("click", function(e){
        setSectionNext($('.cat-checkbox:checkbox:checked').length > 0, "category");
        var category_val = "";
        $('.cat-checkbox:checkbox:checked').each(function(){
            category_val += $(this).val() + ",";
        });
        updateQueryStringParam("categories", category_val);
    });

    //section 4 - pricing
    $(".price-input").on("change keyup paste mousewheel", function(e){
        //update listing preview
        if (parseFloat($(this).val()) > 0){
            $("#preview-" + $(this).attr("id")).find(".green_text").text("$" + $(this).val());
        }
        setSectionNext(checkPrices(), "pricing");
        updateQueryStringParam($(this).attr("id").replace("-input", ""), $(this).val());
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

//function to set up premium payment
function setPremium(basic_bool){
    //if basic, so skip the pricing
    $("#pricing-section").data('pageskip', basic_bool);

    //basic
    if (basic_bool){
        $("#submit-button-text").text("Submit");

        //update query strings for all prices
        addRemovePricesQueryString(false);

        //submit button basic event binder
        $("#submit-button").off().on("click", function(e){
            e.preventDefault();
            submitListing($(this), checkListingData(), "basic", null);
        });
    }
    //premium
    else {
        $("#submit-button-text").text("Pay Now");

        //update query strings for all prices
        addRemovePricesQueryString(true);

        //submit button premium event binder
        $("#submit-button").off().on("click", function(e){
            e.preventDefault();
            submitListingsPremium($(this), checkListingData());
        });
    }
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

//function to go to a specific page
function changePage(section_id, page_refresh_bool){
    $(".section").not("#buttons-section").addClass("is-hidden");  //hide all sections except bottom buttons
    var section_to_change_to = $("#" + section_id + "-section");
    section_to_change_to.removeClass('is-hidden');  //show correct one

    //wasnt a page refresh
    if (!page_refresh_bool){
        var queries = (window.location.hash.split("?")[1] != undefined) ? "?" + window.location.hash.split("?")[1] : ""
        history.pushState({}, "", "/listings/create/single#" + section_id + queries);
    }

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
    var is_premium = $("#premium-box").hasClass("is-active");

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
			url: "/listings/create/single/" + url,
			data: submit_data
		}).done(function(data){
			can_submit = true;
            submit_button.removeClass('is-loading').addClass('is-hidden');

			if (data.state == "success"){
                //reset the datas to default value
                delete_cookie("listing_data");
                $(".box").removeClass("is-active low-opacity");
                $(".input").val("");
                $(".cat-checkbox").prop('checked', false);
                $(".price-input").each(function(e){
                    $(this).val($(this).prop("defaultValue"));
                });

                changePage("type");
			}
			else if (data.state == "error"){
                console.log(data);
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
            name: 'DomaHub Domain Rentals',
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
