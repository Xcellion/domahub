var current_listing = (listings) ? listings[0] : {};

$(document).ready(function(){

	//<editor-fold>-------------------------------FILTERS-------------------------------

	$("#sort-select").on("change", function(){
		var sort_by = $(this).val();

		//sort by date created
		if (sort_by == "date"){
			listings.sort(function(a,b){
				return sortBy("id", true, a, b);
			});
		}
		//sort A to Z
		else if (sort_by == "az"){
			listings.sort(function(a,b){
				return sortBy("domain_name", true, a, b);
			});
		}
		//sort Z to A
		else if (sort_by == "za") {
			listings.sort(function(a,b){
				return sortBy("domain_name", false, a, b);
			});
		}
		//buy_price ascending
		else if (sort_by == "price_asc"){
			listings.sort(function(a,b){
				return sortBy("buy_price", true, a, b);
			});
		}
		//buy_price ascending
		else if (sort_by == "price_asc"){
			listings.sort(function(a,b){
				return sortBy("buy_price", false, a, b);
			});
		}

		createRows();
	});

	$("#domain-search").on("input keyup", function(){
		$(".table-row:not(.clone-row)").addClass('is-hidden');

		var search_term = $(this).val();

		$(".table-row:not(.clone-row)").filter(function(){
			if ($(this).data('domain_name').indexOf(search_term) != -1){
				return true;
			}
		}).removeClass('is-hidden');
	});

	//</editor-fold>

	//<editor-fold>-------------------------------DOMAIN LIST-------------------------------

	createRows();

	//multiple delete listings
	$("#multi-delete").on("click", function(e){
		multiDelete($(this));
	});

	//multiple verify listings
	$("#multi-verify").on("click", function(e){
		multiVerify($(this));
	});

	//select all domains
	$("#select-all").on("click", function(e){
		selectAllRows($(this), $(this).data('selected'));
	});

	//</editor-fold>

	//<editor-fold>-------------------------------REGULAR TABS-------------------------------

	//click to move to upgrade tab
	$("#other-tab-upgrade-button").on('click', function(e){
		$("#upgrade-tab").click();
	});

	//change tabs
	$(".tab").on("click", function(e){
		//clear any existing messages
	    errorMessage(false);
	    successMessage(false);

		//hide other tab selectors
		$(".tab").removeClass('is-active');
		$(this).addClass('is-active');

		//show specific tab
		$(".drop-tab").addClass('is-hidden');
		$("#" + $(this).attr("id") + "-drop").removeClass('is-hidden');

		//clicked on the upgrade tab
		if ($(this).attr("id") == "upgrade-tab"){
			//hide save/cancel changes buttons, show checkout button
			$("#save-changes-button").addClass('is-hidden');
			$("#cancel-changes-button").addClass('is-hidden');
		}

		//clicked on a not upgrade tab
		else {
			//show save/cancel changes buttons, hide checkout button
			$("#save-changes-button").removeClass('is-hidden');
			$("#cancel-changes-button").removeClass('is-hidden');
			$("#checkout-button").addClass('is-hidden');
		}

		cancelListingChanges();

	});

	//delete background image X button
	$("#background-delete-img").on("click", function(e){
		deleteBackgroundImg($(this), "https://placeholdit.imgix.net/~text?txtsize=40&txt=RANDOM%20PHOTO&w=200&h=200");
	});

	//to submit form changes
	$("#save-changes-button").on("click", function(e){
		submitListingChanges();
	});

	//to cancel form changes
	$("#cancel-changes-button").on("click", function(e){
		cancelListingChanges();
	});


	//</editor-fold>

	//<editor-fold>-------------------------------PAYMENT TAB-------------------------------

	//key for stripe
	if (window.location.hostname == "localhost"){
		Stripe.setPublishableKey('pk_test_kcmOEkkC3QtULG5JiRMWVODJ');
	}
	else {
		Stripe.setPublishableKey('pk_live_506Yzo8MYppeCnLZkW9GEm13');
	}

	//format all stripe inputs
	$('#cc-num').val("").payment('formatCardNumber');
	$('#cc-exp').val("").payment('formatCardExpiry');
	$('#cc-cvc').val("").payment('formatCardCVC');
	$('#cc-zip').val("").payment('restrictNumeric');

	//format stripe cc icons
	$(".stripe-input").on("change keyup paste", function(){
		errorMessage(false);

		//as long as it's not empty
		if ($(".stripe-input").filter(function(){ if ($(this).val()) { return true } }).length != 0){
			$("#checkout-button").removeClass('is-disabled');
		}
		else {
			$("#checkout-button").addClass('is-disabled');
		}

		var card_type = $.payment.cardType($("#cc-num").val());
		if (card_type == "dinersclub") { card_type = "diners-club"}
		if (["maestro", "unionpay", "forbrugsforeningen", "dankort"].indexOf(card_type) != -1){ card_type = null}

		//show appropriate card icon
		if ($(".fa-cc-" + card_type) && card_type){
			$("#cc-icon").removeClass().addClass("fa fa-cc-" + card_type);
		}
		//or show default
		else {
			$("#cc-icon").removeClass().addClass("fa fa-credit-card");
		}
	});

	//click checkout button to submit and get stripe token
	$("#checkout-button").on("click", function(e){
		e.preventDefault();
		if (checkCC()){
			$(this).addClass('is-loading');
			$("#stripe-form").submit();
		}
	});

	//click to show CC form if they want to change card
	$("#change-card-button").on("click", function(){
		$(this).addClass('is-hidden');
		$("#checkout-button").removeClass('is-hidden');
		$("#stripe-form").removeClass('is-hidden');
		$('#cc-num').focus();
	});

	//get stripe token
	$("#stripe-form").on("submit", function(e){
		e.preventDefault();
		Stripe.card.createToken($(this), function(status, response){
			if (response.error){
				errorMessage("Something went wrong with the payment! Please refresh the page and try again.");
			}
			else {
				//all good, submit stripetoken and listing id to dh server
				submitPremium(current_listing, response.id, $("#checkout-button"));
			}
		});
	});

	//</editor-fold>
});

//<editor-fold>-------------------------------CREATE ROW VERIFIED DOMAIN-------------------------------

//function to create all rows
function createRows(){

	//empty the tabl
	$("#table_body").find(".table-row:not(.clone-row)").remove();

	for (var x = 0; x < listings.length; x++){
		$("#table_body").append(createRow(listings[x], x));
	}

	//show the first child
	if (listings.length > 0){
		current_listing = listings[0];

		if (listings[0].verified){
			editRowVerified(listings[0]);
		}
		else {
			editRowUnverified(listings[0]);
		}
		$("#table_body").find(".table-row:not(.clone-row)").eq(0).addClass('is-active').css('background-color', "red");
	}
}

//function to create a listing row
function createRow(listing_info, rownum){
	//choose a row to clone
	if (listing_info.verified){
		var tempRow = $("#verified-clone-row").clone();
	}
	else {
		var tempRow = $("#unverified-clone-row").clone();
		tempRow.data("verified", false);
	}

	//update row specifics and add handlers
    updateDomainName(tempRow, listing_info);
    updateIcon(tempRow, listing_info);

	//change domains
	tempRow.on("click", function(e){
		changeRow($(this), listing_info);
	});

	tempRow.removeClass('is-hidden clone-row').attr("id", "row-listing_id" + listing_info.id);
	tempRow.data("editing", false);
	tempRow.data("selected", false);
	tempRow.data("id", listing_info.id);
	tempRow.data("domain_name", listing_info.domain_name);

	//already got the dns and a records for unverified domain
	if (listing_info.a_records != undefined && listing_info.whois != undefined){
		tempRow.data("record_got", true);
	}

    return tempRow;
}

//update the clone row with row specifics
function updateDomainName(tempRow, listing_info){
	tempRow.find(".td-domain").text(listing_info.domain_name);
}
function updateIcon(tempRow, listing_info){
	tempRow.find(".select-button").on('click', function(e){
		e.stopPropagation();
		selectRow(tempRow);
	});
}

//function to change domain
function changeRow(row, listing_info, bool){

	//only if actually changing
	if (current_listing != listing_info || bool){
		refreshSubmitButtons();
		$(".changeable-input").off();

		//highlight selected row on table
		$(".table-row").removeClass('is-active').removeAttr("style");
		row.addClass('is-active').css("background-color", "red");

		//clear any existing messages
	    errorMessage(false);
	    successMessage(false);

		current_listing = listing_info;

		//update inputs
		if (listing_info.verified){
			editRowVerified(listing_info);
		}
		else {
			editRowUnverified(listing_info);
		}
	}
}

//</editor-fold>

//<editor-fold>-------------------------------UPDATE ROW VERIFIED-------------------------------

//function to intiate edit mode
function editRowVerified(listing_info){

	//show the verification tab, hide others
	$(".verified-elem").removeClass('is-hidden');
	$(".unverified-elem").addClass('is-hidden');

	updateStatus(listing_info);
	updateDescription(listing_info);
	updateCategories(listing_info);
	updatePaths(listing_info);

	updatePriceInputs(listing_info);

	updateColorScheme(listing_info);
	updateFontStyling(listing_info);
	updateModules(listing_info);
	updateBackgroundImage(listing_info);
 	updateModules(listing_info);
	updateLogo(listing_info);

	updatePremium(listing_info, true);

	updateBindings(listing_info);
}

	//<editor-fold>-------------------------------INFORMATION TAB EDITS-------------------------------

	//update the information tab
	function updateStatus(listing_info){
		$("#status-input").val(listing_info.status);

		if (listing_info.status == 1){
			$("#status-text").text("Active");
			$("#status-color").addClass("is-primary").removeClass('is-danger');
			$("#status-icon").addClass("fa-toggle-on").removeClass('fa-toggle-off');
		}
		else {
			$("#status-text").text("Inactive");
			$("#status-color").addClass('is-danger').removeClass("is-primary");
			$("#status-icon").addClass('fa-toggle-off').removeClass("fa-toggle-on");
		}
	}
	function updateDescription(listing_info){
		$("#description").val(listing_info.description);
		$("#short-desc").val(listing_info.description_hook);
	}
	function updateCategories(listing_info){
		var listing_categories = (listing_info.categories) ? listing_info.categories.split(" ") : [];
		$(".category-selector").removeClass('is-dark');
		for (var x = 0; x < listing_info.categories.split(" ").length; x++){
			//color existing categories
			var temp_category = $("." + listing_categories[x] + "-category").addClass('is-dark');
		}
		updateHiddenCategoryInput();
	}
	function updateHiddenCategoryInput(){
		var joined_categories = $(".category-selector.is-dark").map(function() {
			return $(this).data("category");
		}).toArray().sort().join(" ");
		joined_categories = (joined_categories == "") ? null : joined_categories;
		$("#categories-input").val(joined_categories);
	}
	function updatePaths(listing_info){
		var listing_paths = (listing_info.paths) ? listing_info.paths.split(",") : [];

		//if created tags before
		if ($("#paths-input").data('tags') == true){
			$("#paths-input").tagit("destroy");
		}
		else {
			$("#paths-input").data("tags", true);
		}

		$("#paths-input").val(listing_info.paths).tagit({
			animate: false,
			afterTagAdded : function(event, ui){
				changedValue($("#paths-input"), listing_info);
			},
			afterTagRemoved : function(event, ui){
				changedValue($("#paths-input"), listing_info);
			}
		});
	}

	//</editor-fold>

	//<editor-fold>-------------------------------PRICE TAB EDITS-------------------------------

	//update the pricing tab
	function updatePriceInputs(listing_info){
		$("#price-rate-input").val(listing_info.price_rate);
		$("#price-type-input").val(listing_info.price_type);
		$("#buy-price-input").val(listing_info.buy_price);
	}

	//</editor-fold>

	//<editor-fold>-------------------------------DESIGN TAB EDITS-------------------------------

	//update the design tab
	function updateColorScheme(listing_info){
		var minicolor_options = {
			letterCase: "uppercase",
			swatches: ["#3cbc8d", "#FF5722", "#2196F3"]
		}
		$("#primary-color-input").val(listing_info.primary_color).minicolors("destroy").minicolors(minicolor_options);
		$("#secondary-color-input").val(listing_info.secondary_color).minicolors("destroy").minicolors(minicolor_options);
		$("#tertiary-color-input").val(listing_info.tertiary_color).minicolors("destroy").minicolors(minicolor_options);
	}
	function updateFontStyling(listing_info){
		var minicolor_options = {
			letterCase: "uppercase",
			swatches: ["#000", "#222", "#D3D3D3", "#FFF"]
		}
		$("#font-color-input").val(listing_info.font_color).minicolors("destroy").minicolors(minicolor_options);

		//if created tags before
		if ($("#font-name-input").data('tags') == true){
			$("#font-name-input").tagit("destroy");
		}
		else {
			$("#font-name-input").data("tags", true);
		}

		//create new tags
		$("#font-name-input").val(listing_info.font_name).tagit({
			animate : false,
			allowSpaces : true,
			afterTagAdded : function(event, ui){
				changedValue($("#font-name-input"), listing_info);
			},
			afterTagRemoved : function(event, ui){
				changedValue($("#font-name-input"), listing_info);
			}
		});
	}
	function updateModules(listing_info){
		$("#history-module-input").val(listing_info.history_module);
		$("#traffic-module-input").val(listing_info.traffic_module);
	}
	function updateBackgroundImage(listing_info){
		var background_image = (listing_info.background_image == null || listing_info.background_image == undefined || listing_info.background_image == "") ? "https://placeholdit.imgix.net/~text?txtsize=40&txt=RANDOM%20PHOTO&w=200&h=200" : listing_info.background_image;
		$("#background-image").attr('src', background_image).off().on("error", function() {
	        $(this).attr("src", "https://placeholdit.imgix.net/~text?txtsize=40&txt=LOADING...%20&w=200&h=200");
	    });
	}
	function updateLogo(listing_info){
		var logo = (listing_info.logo == null || listing_info.logo == undefined || listing_info.logo == "") ? "/images/dh-assets/flat-logo/dh-flat-logo-primary.png" : listing_info.logo;
		$("#logo-image").attr('src', logo).off().on("error", function() {
	        $(this).attr("src", "/images/dh-assets/flat-logo/dh-flat-logo-primary.png");
	    });
	}
	function updateModules(listing_info){
		checkModuleBox(listing_info.history_module, $("#history-module-input"))
		checkModuleBox(listing_info.traffic_module, $("#traffic-module-input"))
		checkModuleBox(listing_info.info_module, $("#info-module-input"))
	}
	function checkModuleBox(module_value, elem){
		if (module_value){
			elem.val(module_value).prop("checked", true);
		}
		else {
			elem.val(module_value).prop("checked", false);
		}
	}

	//</editor-fold>

	//<editor-fold>-------------------------------UPGRADE TAB EDITS-------------------------------

	function updatePremium(listing_info){

		//remove all CC info
		$('#cc-num').val("");
		$('#cc-exp').val("");
		$('#cc-cvc').val("");
		$('#cc-zip').val("");

		//if user has a CC already on file, change the text
		if (user.stripe_info.premium_cc_last4){
			$("#change-card-button").removeClass('is-hidden').text("Change Payment Method");

			//last 4 digits
			var premium_cc_last4 = (user.stripe_info.premium_cc_last4) ? user.stripe_info.premium_cc_last4 : "****";
			var premium_cc_brand = (user.stripe_info.premium_cc_brand) ? user.stripe_info.premium_cc_brand : "Credit"
			$("#existing-cc").text(premium_cc_brand + " card ending in " + premium_cc_last4);
		}
		else {
			$("#change-card-button").removeClass('is-hidden').text("Add Payment Method");
		}

		//is not premium
		if (!listing_info.stripe_subscription_id){
			$("#renew-status").text("Please click the button below to upgrade this listing to a premium listing for $1 / year!");

			$("#checkout-button").text("Confirm & Pay").attr("title", "Confirm and Pay");

			//tab title
			$("#upgrade-tab-text").text("Upgrade to Premium");

			//add disabled to premium inputs if not premium
			$(".premium-input").addClass('is-disabled');
			$("#font-name-input").data("ui-tagit").tagList.addClass("is-disabled");

			//hide/show elements needed for upgrade
			$(".basic-elem").removeClass('is-hidden');
			$(".premium-elem").addClass('is-hidden');
		}
		//is premium
		else {
			//hide upgrade button
			$("#upgrade-button").addClass('is-hidden');

			//hide cc form, show change card button
			$("#stripe-form").addClass('is-hidden');
			$("#change-card-button").removeClass('is-hidden');

			//hide checkout button
			$("#checkout-button").addClass("is-hidden");

			//tab title
			$("#upgrade-tab-text").text("Premium Status");

			//remove disabled to premium inputs
			$(".premium-input").removeClass('is-disabled');
			$("#font-name-input").data("ui-tagit").tagList.removeClass("is-disabled");

			//show/hide elements needed for upgrade
			$(".basic-elem").addClass('is-hidden');
			$(".premium-elem").removeClass('is-hidden');

			//expiring
			if (listing_info.expiring == true){
				if (listing_info.exp_date){
					$("#renew-status").text("Premium is active, but set to expire on " + moment(listing_info.exp_date * 1000).format("MMM DD, YYYY") + ". You will not be charged further for this listing.");
				}

				//hide the checkout button until you click to change payment method
				$("#checkout-button").text("Confirm Payment Method").attr("title", "Confirm Payment Method").addClass('is-hidden');

				//not renewing, so hide the cancel button
				$("#cancel-premium-button").addClass("is-hidden");

				//show button click to renew subscription
				$("#renew-premium-button").removeClass("is-hidden");
			}

			//not expiring, show cancel button
			else if (listing_info.expiring == false){

				if (listing_info.exp_date){
					$("#renew-status").text("Premium is active and set to renew on " + moment(listing_info.exp_date * 1000).format("MMM DD, YYYY") + ". You will be charged $1 at renewal.");
				}

				//renewing, so hide the renew button
				$("#renew-premium-button").addClass("is-hidden").removeClass('is-loading');

				//show button to cancel subscription
				$("#cancel-premium-button").removeClass("is-hidden");
			}
		}
	}

	//update change bindings (category, changeable-input, status)
	function updateBindings(listing_info){

		//click to add this category
		$(".category-selector").off().on("click", function(e){
			$(this).toggleClass('is-dark');
			updateHiddenCategoryInput();
			changedValue($("#categories-input"), listing_info);
		});

		//bind new handlers for any changeable inputs
		$(".changeable-input").off().on("change input", function(e){
			changedValue($(this), listing_info);
		});

		//update status binding
		$("#status-color").off().on("click", function(e){
			var new_status = ($("#status-input").val() == "1") ? 0 : 1;
			updateStatus({ status : new_status });
			changedValue($("#status-input"), listing_info);
		});

		//module checkbox handlers
		$(".module-checkbox").off().on("click", function(){
			var new_checkbox_val = ($(this).val() == "1") ? 0 : 1;
			$(this).val(new_checkbox_val);
			changedValue($(this), listing_info);
		});

		//delete images
		$(".delete-image").off().on("click", function(){
			var image_id = $(this).attr('id');
			var temp_img = $("#" + image_id + "-image");
			var temp_input = $("#" + image_id + "-image-input");
			var temp_label = $("#" + image_id + "-image-label");

			if (temp_img.attr("src") != temp_img.data("default-img")){
				var old_src = temp_img.attr("src");
				temp_img.data("old_src", old_src);
				temp_img.attr("src", temp_img.data("default-img"));
				temp_input.data("deleted", true);
				temp_input.val("");
				temp_label.text(temp_label.data("default-name"));
			}
			changedValue(temp_input, listing_info);
		});

		//premium bindings
		if (listing_info.stripe_subscription_id){

			//button to renew subscription
			$("#renew-premium-button").off().on("click", function(){
				//no stripe token because we're just renewing with existing CC on file
				submitPremium(listing_info, false, $(this));
			});

			//button to cancel subscription
			$("#cancel-premium-button").off().on("click", function(){
				submitCancelPremium(listing_info, $(this));
			});

			//get stripe info for this listing if we haven't yet
			if (listing_info.exp_date == undefined || listing_info.expiring == undefined){
				$.ajax({
					url: "/listing/" + listing_info.domain_name + "/stripeinfo",
					method: "GET"
				}).done(function(data){
					updatePremiumPostAjax(data.listings);
				});
			}
		}

		//basic listing, remove premium handlers and add upgrade handler
		else {
			$("#cancel-premium-button").off();
			$("#renew-premium-button").off();

			//upgrade a basic listing
			$("#upgrade-button").off().on("click", function(){
				if (user.stripe_info.premium_cc_last4){
					//just upgrade to premium with existing card
					submitPremium(listing_info, false, $(this));
				}
				else {
					$("#change-card-button").click();
				}
			});
		}
	}

	//</editor-fold>

//</editor-fold>

//<editor-fold>-------------------------------UPGRADE TO PREMIUM-------------------------------

//check the CC info
function checkCC(){
    if (!$("#cc-num").val()){
    	errorMessage("Please provide a credit card to charge.");
    }
    else if (!$("#cc-exp").val()){
    	errorMessage("Please provide your credit card expiration date.");
    }
    else if (!$("#cc-cvc").val()){
    	errorMessage("Please provide your credit card CVC number.");
    }
    else if (!$("#cc-zip").val()){
    	errorMessage("Please provide a ZIP code.");
    }
    else {
        return true;
    }
}

//function to submit a new premium or to renew the premium again
function submitPremium(listing_info, stripeToken, button_elem){
	//new premium listing or renewing
	var data = {};
	if (stripeToken){
		data.stripeToken = stripeToken;
	}

	button_elem.addClass('is-loading');
	$.ajax({
		url: "/listing/" + listing_info.domain_name + "/upgrade",
		method: "POST",
		data: data
	}).done(function(data){
		console.log(data);

		//update cc last 4 and brand
		if (data.user){
			user = data.user;
		}

		button_elem.removeClass('is-loading');
		if (data.state == "success"){
			if (listing_info.stripe_subscription_id){
				successMessage("Successfully renewed Premium! Welcome back!");
			}
			else {
				successMessage("Successfully upgraded to Premium!");
			}
			updatePremiumPostAjax(data.listings);
		}
		else {
			var error_msg = data.message || "Something went wrong with the renewal! Please refresh the page and try again.";
			errorMessage(error_msg);
		}
	});
}

//function to cancel renewal of premium
function submitCancelPremium(listing_info, button_elem){
	button_elem.addClass('is-loading');
	$.ajax({
		url: "/listing/" + listing_info.domain_name + "/downgrade",
		method: "POST"
	}).done(function(data){
		console.log(data);

		button_elem.removeClass('is-loading');
		if (data.state == "success"){
			successMessage("Successfully cancelled Premium! Sorry to see you go!");
			updatePremiumPostAjax(data.listings);
		}
		else {
			var error_msg = data.message || "Something went wrong with the cancellation! Please refresh the page and try again.";
			errorMessage(error_msg);
		}
	});
}

//function to update premium details after a successful cancel or renew or new premium
function updatePremiumPostAjax(new_listings){
	updateCurrentListing(new_listings);
	(function(listing_info){
		//update the change row handler
		$("#row-listing_id" + current_listing.id).off().on("click", function(e){
			changeRow($(this), listing_info, true);
		});

		updateBindings(listing_info);
		updatePremium(listing_info);
	})(current_listing);
}

//</editor-fold>

//<editor-fold>-------------------------------SUBMIT LISTING UPDATES-------------------------------

//helper function to bind to inputs to listen for any changes from existing listing info
function changedValue(input_elem, listing_info){
    var name_of_attr = input_elem.data("name");

	//clear any existing messages
	errorMessage(false);
	successMessage(false);

    var save_button = $("#save-changes-button");
    var cancel_button = $("#cancel-changes-button");

    //only change if the value changed from existing or if image exists
    if ((name_of_attr != "background_image" && name_of_attr != "logo" && input_elem.val() != listing_info[name_of_attr])
    || ((name_of_attr == "background_image" || name_of_attr == "logo") && input_elem.val())
    || ((name_of_attr == "background_image" || name_of_attr == "logo") && input_elem.data("deleted"))){
        input_elem.data('changed', true);
		save_button.removeClass("is-disabled");
		cancel_button.removeClass("is-hidden");
    }
    //hide the cancel, disable the save
    else {
        input_elem.data('changed', false);
        save_button.addClass("is-disabled");
        cancel_button.addClass("is-hidden");
    }
}

//function to visually reset submit/cancel buttons
function refreshSubmitButtons(){
	$("#cancel-changes-button").addClass("is-hidden");
    $("#save-changes-button").removeClass("is-loading").addClass('is-disabled');
}

//function to cancel the listing submit
function cancelListingChanges(){
	refreshSubmitButtons();

	//revert all inputs
	editRowVerified(current_listing);

    errorMessage(false);
    successMessage(false);
}

//function to submit any changes to a listing
function submitListingChanges(){

    //clear any existing messages
    errorMessage(false);
    successMessage(false);

    //only add changed inputs
	var formData = new FormData();
    $(".changeable-input").each(function(e){
        var input_name = $(this).data("name");
        var input_val = (input_name == "background_image" || input_name == "logo") ? $(this)[0].files[0] : $(this).val();

        //if background image is being deleted
        if (input_name == "background_image" && $(this).data("deleted")){
            var input_val = "";
			$(this).data('deleted', false);
        }

        //if logo is being deleted
        if (input_name == "logo" && $(this).data("deleted")){
            var input_val = "";
			$(this).data('deleted', false);
        }

        //if null or undefined
        current_listing[input_name] = (current_listing[input_name] == null || current_listing[input_name] == undefined) ? "" : current_listing[input_name];
        if (input_val != current_listing[input_name]){
            formData.append(input_name, input_val);
        }
    });

    $("#save-changes-button").addClass("is-loading");

    $.ajax({
        url: "/listing/" + current_listing.domain_name + "/update",
        type: "POST",
        data: formData,
        // Options to tell jQuery not to process data or worry about the content-type
        cache: false,
        contentType: false,
        processData: false
    }, 'json').done(function(data){
        $("#save-changes-button").removeClass("is-loading");

        if (data.state == "success"){
            successMessage("Successfully updated this listing!");
			updateCurrentListing(data.listings);

			//update images if necessary
			if (data.new_background_image){
				updateBackgroundImage({ background_image : data.new_background_image});
			}
			if (data.new_logo){
				updateBackgroundImage({ logo : data.new_logo});
			}

            refreshSubmitButtons();

			(function(listing_info){
				//update the change row handler
				$("#row-listing_id" + current_listing.id).off().on("click", function(e){
					changeRow($(this), listing_info, true);
				});

				updateBindings(listing_info);
			})(current_listing);
        }
        else {
            errorMessage(data.message);
        }
    });
}

//helper function to display/hide error messages per listing
function errorMessage(message){
    if (message && message != "nothing-changed"){
		$("#listing-msg-error").removeClass('is-hidden');
		$("#listing-msg-error").find("p").empty();

        //connect stripe first!
        if (message == "stripe-connect-error"){
            $("#listing-msg-error").append("<p class='is-white'>You must <a class='is-underlined' href='/profile/settings#payout-address'>enter your payment information</a> before your listing can go live!</p>");
        }
        else {
            $("#listing-msg-error").append("<p class='is-white'>" + message + "</p>");
        }
    }
    else {
        $("#listing-msg-error").addClass('is-hidden');
    }
}

//helper function to display success messages per listing
function successMessage(message){
    if (message){
		$("#listing-msg-success").removeClass('is-hidden');
        $("#listing-msg-success-text").text(message);
    }
    else {
        $("#listing-msg-success").addClass('is-hidden');
    }
}

//</editor-fold>

//<editor-fold>-------------------------------UPDATE ROW UNVERIFIED-------------------------------

//function to initiate edit mode for unverified
function editRowUnverified(listing_info){
	//get who is an A record data if we haven't yet
	if (listing_info.a_records == undefined || listing_info.whois == undefined){
		getDNSRecordAndWhois(listing_info.domain_name);
	}
	else {
		updateRegistrarURL(listing_info.whois);
		updateExistingDNS(listing_info.a_records);
	}

	//show the verification tab, hide others
	$("#verify-tab").addClass('is-active');
	$(".verified-elem").addClass('is-hidden');
	$(".unverified-elem").removeClass('is-hidden');

	//function to run after successful verification
	updateVerificationButton(listing_info, function(){
		listing_info.verified = 1;

		//if connected to stripe, auto enable
		if (user.stripe_info && user.stripe_info.charges_enabled){
			listing_info.status = 1;
		}

		//recreate the rows
		createRows();
		editRowVerified(listing_info);
		successMessage("Successfully verified this domain! You may now edit the listing details.");
	});
}

//function to get A Record and Whois info for unverified domain
function getDNSRecordAndWhois(domain_name){
	$.ajax({
		url: "/listing/" + domain_name + "/unverifiedInfo",
		method: "POST"
	}).done(function(data){
		var unverified_domain = getUserListingObj(listings, domain_name);
		unverified_domain.a_records = data.listing.a_records;
		unverified_domain.whois = data.listing.whois;

		//update the unverified domain table
		updateRegistrarURL(data.listing.whois);
		updateExistingDNS(data.listing.a_records);
	});
}

//update the registrar URL if there is one
function updateRegistrarURL(whois){
	if (whois && (whois.Registrar || whois["Sponsoring Registrar"])){
		var reg_name = whois.Registrar || whois["Sponsoring Registrar"];
		var reg_url = whois["Registrar URL"] || whois["Registrar URL (registration services)"];
		var regex_url = /^((http|https):\/\/)/;
		if (!regex_url.test(reg_url)) { reg_url = "http://" + reg_url; }
		$("#registrar_url").replaceWith("<p id='registrar_url'>Please <a class='is-accent' href='" + reg_url + "'>log in to your domain provider</a> (" + reg_name + ") to create these entries.");
	}
}

//update the table with any existing DNS records
function updateExistingDNS(a_records){
	if (a_records){
		var temp_a_records = a_records.slice(0);
		if (temp_a_records.indexOf("208.68.37.82") != -1){
			temp_a_records.splice(temp_a_records.indexOf("208.68.37.82"), 1);
			$("#existing_a_record_clone").removeClass('is-hidden').find(".existing_data").text("208.68.37.82").removeClass("is-danger").addClass('is-success');
		}

		//clear table first
		$("#dns_table_body").find(".clone-dns-row:not(#existing_a_record_clone)").remove();

		for (var x = 0; x < temp_a_records.length; x++){
			var temp_dns_row = $("#existing_a_record_clone").clone().removeAttr('id').removeClass('is-hidden');
			temp_dns_row.find(".existing_data").text(a_records[x]).addClass('is-danger');
			temp_dns_row.find(".required_data").text("You must delete this!").addClass('is-danger');
			$("#dns_table_body").append(temp_dns_row);
		}
	}
	else {
		//clear table first
		$("#dns_table_body").find(".clone-dns-row:not(#existing_a_record_clone)").remove();

		$("#existing_a_record_clone").removeClass('is-hidden').find(".existing_data").text("Not found!").addClass('is-danger');
	}
}

//update the verify button
function updateVerificationButton(listing_info, cb_when_verified){
	var verify_button = $("#verify-button");

	//ajax to make sure it's all done, then display a regular row if verified
	verify_button.off().on("click", function(e){
		e.preventDefault();

		verify_button.addClass('is-loading');
		$.ajax({
			url: "/listing/" + listing_info.domain_name + "/verify",
			method: "POST"
		}).done(function(data){
			verify_button.removeClass('is-loading is-danger');
			if (data.state == "success"){
				cb_when_verified();
			}
			else {
				errorMessage("Failed to verify! Please check your DNS details and try again.");
			}
		});
	});
}

//</editor-fold>

//<editor-fold>-------------------------------SELECT ROW-------------------------------

//function to select a row
function selectRow(row){
    var selected = (row.data("selected") == false) ? true : false;
    var verified = row.data("verified");
    row.data("selected", selected);

    var icon_i = row.find(".select-button i");
    var icon_span = row.find(".select-button .icon");

    row.toggleClass('is-active');
    icon_span.toggleClass('is-primary');
    if (selected){
		icon_span.removeClass('is-danger');
        icon_i.removeClass("fa-exclamation-triangle").removeClass('fa-square-o').addClass("fa-check-square-o box-checked");
    }
    else {
        icon_i.addClass('fa-square-o');
        icon_i.removeClass("fa-check-square-o box-checked");
    }

    multiSelectButtons();
}

//function to select all rows
function selectAllRows(select_all_button, select_or_deselect){

	//select all
	if (!select_or_deselect){
		select_all_button.data('selected', true);
		select_all_button.find(".icon").addClass('is-primary');
		select_all_button.find("i").removeClass("fa-square-o").addClass('fa-check-square-o box-checked');

		$(".table-row:not(.clone-row)").addClass('is-active').data('selected', true);
		$(".table-row .select-button .icon").addClass('is-primary');
		$(".table-row .select-button i").removeClass("fa-square-o").addClass('fa-check-square-o box-checked');
	}
	//deselect all
	else {
		select_all_button.data('selected', false);
		select_all_button.find(".icon").removeClass('is-primary');
		select_all_button.find("i").addClass("fa-square-o").removeClass('fa-check-square-o box-checked');

		$(".table-row:not(.clone-row)").removeClass('is-active').data('selected', false);
		$(".table-row .select-button .icon").removeClass('is-primary');
		$(".table-row .select-button i").addClass("fa-square-o").removeClass('fa-check-square-o box-checked');
	}

	multiSelectButtons();
}

//helper function to handle multi-select action buttons
function multiSelectButtons(){
    var selected_rows = $(".table-row:not(.clone-row)").filter(function(){ return $(this).data("selected") == true });
    var verified_selected_rows = selected_rows.filter(function(){ return $(this).data("verified") == false});

    if (selected_rows.length > 0){
        $("#multi-delete").removeClass("is-disabled");
    }
    else {
        $("#multi-delete").addClass("is-disabled");
    }

    if (verified_selected_rows.length > 0){
        $("#multi-verify").removeClass("is-disabled");
    }
    else {
        $("#multi-verify").addClass("is-disabled");
    }
}

//function to multi-verify listings
function multiVerify(verify_button){
    verify_button.off();

	var ids = [];
	var selected_rows = $(".table-row").filter(function(){
		if ($(this).data('selected') == true){
			ids.push($(this).data('id'));
			return true;
		}
	});

	$.ajax({
		url: "/profile/mylistings/verify",
		method: "POST",
		data: {
			ids: ids
		}
	}).done(function(data){
		console.log(data);

		verify_button.on("click", function(){
			multiVerify(verify_button);
		});

		//deselect all rows
		selectAllRows($("#select-all"), true);

		//unverified listings error
		if (data.unverified_listings){
			//add danger to failed rows
			for (var x = 0; x < data.unverified_listings.length; x++){
				$(".row-disp").each(function(){
					if ($(this).data('id') == data.unverified_listings[x]){
						$(this).find(".td-edit>.button").addClass('is-danger');
						$(this).find(".td-arrow>.icon").addClass('is-danger');
						$(this).find(".td-arrow .fa").removeClass('fa-square-o').addClass('fa-exclamation-triangle');
					}
				});
			}
		}

		//success rows
		if (data.state == "success"){
            verificationHandler(data);
		}
	});
}

//function to handle post-verification of multi listings
function verificationHandler(data){
	listings = data.listings;
	createRows();
}

//function to delete multiple rows
function multiDelete(delete_button){
    delete_button.off();

	var deletion_ids = [];
	var selected_rows = $(".table-row").filter(function(){
		if ($(this).data('selected') == true){
			deletion_ids.push($(this).data('id'));
			return true;
		}
	});

	$.ajax({
		url: "/profile/mylistings/delete",
		method: "POST",
		data: {
			ids: deletion_ids
		}
	}).done(function(data){
		delete_button.on("click", function(){
			multiDelete(delete_button);
		});

		//deselect all rows
		selectAllRows($("#select-all"), true);

		if (data.state == "success"){
            deletionHandler(data.rows, selected_rows);
		}
        else {
            console.log(data);
        }
	});
}

//function to handle post-deletion of multi listings
function deletionHandler(rows, selected_rows){
	listings = rows;
	for (var x = 0; x < selected_rows.length; x++){
		$(selected_rows[x]).remove();
	}
}

//</editor-fold>

//<editor-fold>-------------------------------HELPER FUNCTIONS--------------------------------

//function to sort
function sortBy(property_name, asc, a, b){
	if (asc){
		if (a[property_name] < b[property_name]){
			return -1;
		}
		if (a[property_name] > b[property_name]) {
			return 1;
		}
		return 0;
	}
	else {
		if (a[property_name] > b[property_name]){
			return -1;
		}
		if (a[property_name] < b[property_name]) {
			return 1;
		}
		return 0;
	}
}

function toUpperCase(string){
    return string.charAt(0).toUpperCase() + string.substr(1);
}

//update the current_listing object based on
function updateCurrentListing(new_listings){
	listings = new_listings;

	//update current listing info
	for (var x = 0; x < listings.length; x++){
		if (listings[x].id == current_listing.id){
			current_listing = listings[x];
			break;
		}
	}
}

//helper function to get the user listings object for a specific domain
function getUserListingObj(listings, domain_name){
	for (var x = 0; x < listings.length; x++){
		if (listings[x].domain_name.toLowerCase() == domain_name.toLowerCase()){
			return listings[x];
		}
	}
}

//to format a number for $$$$
var moneyFormat = wNumb({
	thousand: ',',
	prefix: '$',
	decimals: 0
});

//</editor-fold>
