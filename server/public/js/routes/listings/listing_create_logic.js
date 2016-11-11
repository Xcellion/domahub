var can_submit = true;

//on back button
window.onpopstate = function(event) {
    fillExistingData();
    changeViewByHash();
};

$(document).ready(function() {
    fillExistingData();
    changeViewByHash();

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
        setSectionNext($(".cat-checkbox:checked").length > 0, "category");
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

//--------------------------------------------------------------------------------------------------------PAGE HASH

//function to check the hash and switch to appropriate view
function changeViewByHash(){
    var search_queries_exist = window.location.hash.split("?").length > 1;
    var search_queries = window.location.hash.split("?")[1];
    var hash_category = (window.location.hash) ? window.location.hash.split("?")[0] : false;

    //if no hash replace the history state and go to first page
    if (window.location.hash == "" || !search_queries_exist || ["#type", "#info", "#pricing", "#category"].indexOf(hash_category) == -1){
        $("title").html("Create Single Listing - Type - DomaHub");
        history.replaceState({}, "", "/listings/create/single#type");
    }
    //else search through the search queries and find the appropriate page to change to
    else if (search_queries_exist){
        //determine which view we switch to
        var section_id = "type";
        $(".section").each(function(){
            if ($(this).data("can-next") && !$(this).data("pageskip")){
                section_id = $(this).attr("id").replace("-section", "");
            }
        });

        //switch to the appropriate view, replace title
        $("title").html("Create Single Listing - " + section_id.charAt(0).toUpperCase() + section_id.slice(1) + " - DomaHub");
        var queries = (window.location.hash.split("?")[1] != undefined) ? "?" + window.location.hash.split("?")[1] : ""
        history.replaceState({}, "", "/listings/create/single#" + section_id + queries);
        changePage(section_id, true);
    }
}

//function to check for existing data
function fillExistingData(){
    //create all pre-existing values based on query strings
    if (window.location.hash.split("?").length > 1){
        var search_queries = window.location.hash.split("?")[1];
        var kv_pairs = search_queries.split("&");
        for (var x = 0; x < kv_pairs.length; x++){
            var key = kv_pairs[x].split("=")[0];
            var value = kv_pairs[x].split("=")[1];

            //basic v premium
            if (key == "type" && (value == "basic" || value == "premium")){
                var is_basic = (value == "basic");
                var bp_elem = (is_basic) ? $("#basic-box") : $("#premium-box");
                $(".box").removeClass("is-active").addClass("low-opacity");
                bp_elem.addClass("is-active").removeClass("low-opacity");
                setSectionNext(true, "type");
                setPremium(is_basic);
            }
            //categories
            else if (key == "categories" && value != ""){
                var existing_categories = value.split(",").filter(function(el) {return el.length != 0});
                for (var y = existing_categories.length - 1; y >= 0; y--){
                    if ($("#" + existing_categories[y] + "-category").length > 0){
                        $("#" + existing_categories[y] + "-category").prop("checked", true);
                    }
                    else {
                        existing_categories.splice(y, 1);
                    }
                }

                updateQueryStringParam(key, existing_categories.join(","));
                setSectionNext($(".cat-checkbox:checked").length > 0, "category");
            }
            //pricing
            else if ((key == "hour_price" || key == "day_price" || key == "month_price" || key == "week_price") &&
                     parseFloat(value) == value >>> 0){
                $("#" + key + "-input").val(value);
            }
            //info
            else if ((key == "domain_name" || key == "description") && value != ""){
                $("#" + key + "-input").val(value);
                setSectionNext($("#domain_name-input").val().length > 0 && $("#description-input").val().length > 0, "info");
            }
            else {
                updateQueryStringParam(key);
            }
        }
    }
}

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

//--------------------------------------------------------------------------------------------------------

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

//function to change the top banner text
function changeBannerText(section_id){
    switch (section_id){
        case ("type"):
            $('#banner-title').text("Please select one of the options below.");
            $("#banner-subtitle").empty();
            var temp_link = $('<a href="/faq#basicvspremium" target="_blank" style="target-new: tab;" class="is-white is-underlined-hover">What is Basic vs. Premium?</a>');
            var temp_icon = $('<i class="fa fa-question-circle-o"></i>');
            $("#banner-subtitle").append(temp_link, temp_icon);
            break;
        case ("info"):
            $('#banner-title').text("Enter basic domain information.");
            $("#banner-subtitle").text('Descriptions help your listing stand out!');
            break;
        case ("category"):
            $('#banner-title').text("Choose at least one Category.");
            $("#banner-subtitle").text('These will help potential users search for and find your listing.');
            break;
        case ("pricing"):
            $('#banner-title').text("Decide pricing for your domain.");
            $("#banner-subtitle").text('These prices can be customized again after creation');
            break;
        case ("preview"):
            $('#banner-title').text("Preview your listing.");
            $("#banner-subtitle").text('This is how users will see your new listing on DomaHub.');
            break;
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

    //change title of page
    $("title").html("Create Single Listing - " + section_id.charAt(0).toUpperCase() + section_id.slice(1) + " - DomaHub");

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
    $('.progress').stop().animate({
        value: section_to_change_to.data("progress-percent")
    }, {
        step: function(current_number){
            $(this).val(current_number);
        }
    });

    //change the text on the top banner
    changeBannerText(section_id);

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
