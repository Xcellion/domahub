var row_display = listings.slice(0);

$(document).ready(function(){
	//multiple delete listings
	$("#multi-delete").on("click", function(e){
		multiDelete($(this));
	});

	//multiple verify listings
	$("#multi-verify").on("click", function(e){
		multiVerify($(this));
	});

	//key for stripe
	if (window.location.hostname == "localhost"){
		Stripe.setPublishableKey('pk_test_kcmOEkkC3QtULG5JiRMWVODJ');
	}
	else {
		Stripe.setPublishableKey('pk_live_506Yzo8MYppeCnLZkW9GEm13');
	}
});

//<editor-fold>-------------------------------CREATE ROW-------------------------------

//function to create a listing row
function createRow(listing_info, rownum){
	// $("#row" + rownum).remove();

	//choose a row to clone
	if (listing_info.verified){
		var tempRow = $("#verified-clone-row").clone();
		updateView(tempRow, listing_info);
		updateStatus(tempRow, listing_info);
		updateBuyPrice(tempRow, listing_info);
	}
	else {
		var tempRow = $("#unverified-clone-row").clone();
		tempRow.data("verified", false);
	}

	//update row specifics and add handlers
    updateDomainName(tempRow, listing_info);
    updateIcon(tempRow, listing_info);

	tempRow.click(function(e){
		editRow($(this));
	});

	tempRow.removeClass('is-hidden clone-row').attr("id", "row" + rownum);

	tempRow.data("editing", false);
	tempRow.data("selected", false);
	tempRow.data("id", listing_info.id);

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
	tempRow.find(".td-arrow").on('click', function(e){
		e.stopPropagation();
		selectRow(tempRow);
	});
}
function updateView(tempRow, listing_info){
	tempRow.find(".view-button").attr('href', "/listing/" + listing_info.domain_name).on('click', function(e) {
		e.stopPropagation();
	});
}
function updateStatus(tempRow, listing_info){
	if (listing_info.status == 0){
		tempRow.find(".td-status").text("Inactive").addClass('is-danger');
	}
	else {
		tempRow.find(".td-status").text("Active").removeClass('is-danger');
	}
}
function updateBuyPrice(tempRow, listing_info){
	var buy_price = (listing_info.buy_price == 0) ? "No min." : moneyFormat.to(parseFloat(listing_info.buy_price));
	tempRow.find(".td-price-rate").text(buy_price);
}

//</editor-fold>

//<editor-fold>-------------------------------CREATE ROW DROP-------------------------------

//function to create dropdown row
function createRowDrop(listing_info, rownum){
	// $("#row-drop" + rownum).remove();

	//choose a row to clone
	if (listing_info.verified){
		var tempRow_drop = $("#verified-clone-row-drop").clone();
		updateTabs(tempRow_drop, listing_info);

		updateStatusDrop(tempRow_drop, listing_info);
		updateDescription(tempRow_drop, listing_info);
		updateCategories(tempRow_drop, listing_info);
		updatePaths(tempRow_drop, listing_info);

		updatePriceInputs(tempRow_drop, listing_info);

		updateColorScheme(tempRow_drop, listing_info);
		updateFontStyling(tempRow_drop, listing_info);
		updateModules(tempRow_drop, listing_info);
		updateBackgroundImage(tempRow_drop, listing_info, rownum);
		updateLogo(tempRow_drop, listing_info, rownum);
		updateDeleteMessagesX(tempRow_drop);

		updateSaveCancelButtons(tempRow_drop, listing_info);

		updatePremium(tempRow_drop, listing_info, true);
	}
	else {
		var tempRow_drop = $("#unverified-clone-row-drop").clone();
		updateRegistrarURL(tempRow_drop, listing_info.whois);
		updateExistingDNS(tempRow_drop, listing_info.a_records);
		updateVerificationButton(tempRow_drop, listing_info, function(){
			listing_info.verified = 1;

			if (user.stripe_info && user.stripe_info.charges_enabled){
				listing_info.status = 1;
			}
			//recreate the rows
			tempRow_drop.prev(".row-disp").replaceWith(createRow(listing_info, rownum));
			tempRow_drop.replaceWith(createRowDrop(listing_info, rownum));
			refreshSubmitbindings();
		});
	}

	tempRow_drop.removeClass('is-hidden clone-row').attr("id", "row-drop" + rownum);
    return tempRow_drop;
}

//update the clone row drop with row drop specifics
function updateTabs(tempRow_drop, listing_info){
	tempRow_drop.find(".tab").off().on("click", function(e){
		var clicked_tab = $(this);

		//cancel any changes being made
		cancelListingChanges(tempRow_drop.prev(".row-disp"), tempRow_drop, tempRow_drop.find(".cancel-changes-button"), listing_info);

		//hide other tab selectors
		tempRow_drop.find(".tab").removeClass('is-active');
		clicked_tab.addClass('is-active');

		//hide any notifications
		$(".notification").addClass('is-hidden');

		//hide other tabs
		tempRow_drop.find(".drop-tab").addClass('is-hidden');
		tempRow_drop.find("." + clicked_tab.data("tab-id") + "-tab").removeClass('is-hidden');

		//clicked on the upgrade tab
		if (clicked_tab.data('tab-id') == "upgrade"){
			tempRow_drop.find(".save-changes-button").addClass('is-hidden');
		}
		else {
			tempRow_drop.find(".save-changes-button").removeClass('is-hidden');
		}

		//get stripe subscription info if we dont already have it
		if (!clicked_tab.data("got_stripe_sub") && clicked_tab.data('tab-id') == "upgrade" && listing_info.stripe_subscription_id && (listing_info.exp_date == undefined || !listing_info.expiring == undefined || user.stripe_info.premium_cc_last4  == undefined || user.stripe_info.premium_cc_brand  == undefined)){
			$.ajax({
				url: "/listing/" + listing_info.domain_name + "/stripeinfo",
				method: "GET"
			}).done(function(data){
				listings = data.listings;
				user = data.user;
				clicked_tab.data("got_stripe_sub", true);
				updatePremium(tempRow_drop, getUserListingObj(listings, listing_info.domain_name));
			});
		}
	});
}

function updateStatusDrop(tempRow_drop, listing_info){
	tempRow_drop.find(".status-input").val(listing_info.status);
}
function updateDescription(tempRow_drop, listing_info){
	tempRow_drop.find(".description-input").val(listing_info.description);
	tempRow_drop.find(".description-hook-input").val(listing_info.description_hook);
}
function updateCategories(tempRow_drop, listing_info){
	//color existing categories
	var listing_categories = (listing_info.categories) ? listing_info.categories.split(" ") : [];
	tempRow_drop.find(".category-selector").removeClass('is-dark');
	for (var x = 0; x < listing_categories.length; x++){
		var temp_category = tempRow_drop.find("." + listing_categories[x] + "-category").addClass('is-dark');
	}

	var category_input = tempRow_drop.find(".categories-input");
	updateHiddenCategoryInput(tempRow_drop, category_input);

	//click to add this category
	tempRow_drop.find(".category-selector").off().on("click", function(e){
		$(this).toggleClass('is-dark');
		updateHiddenCategoryInput(tempRow_drop, category_input);
		changedValue(category_input, listing_info);
	});
}
function updateHiddenCategoryInput(tempRow_drop, input){
	var joined_categories = tempRow_drop.find(".category-selector.is-dark").map(function() {
		return $(this).data("category");
	}).toArray().sort().join(" ");
	joined_categories = (joined_categories == "") ? null : joined_categories;
	input.val(joined_categories);
}
function updatePaths(tempRow_drop, listing_info){
	//if created tags before
	if (tempRow_drop.find(".paths-input").data('tags') == true){
		tempRow_drop.find(".paths-input").tagit("destroy");
	}
	else {
		tempRow_drop.find(".paths-input").data("tags", true);
	}

	tempRow_drop.find(".paths-input").val(listing_info.paths).tagit({
		animate: false,
		afterTagAdded : function(event, ui){
			changedValue(tempRow_drop.find(".paths-input"), listing_info);
		},
		afterTagRemoved : function(event, ui){
			changedValue(tempRow_drop.find(".paths-input"), listing_info);
		}
	});
}

function updatePriceInputs(tempRow_drop, listing_info){
	tempRow_drop.find(".price-rate-input").val(listing_info.price_rate);
	tempRow_drop.find(".price-type-input").val(listing_info.price_type);
	tempRow_drop.find(".buy-price-input").val(listing_info.buy_price);
}

function updateColorScheme(tempRow_drop, listing_info){
	var minicolor_options = {
		letterCase: "uppercase",
		swatches: ["#3cbc8d", "#FF5722", "#2196F3"]
	}
	tempRow_drop.find(".primary-color-input").val(listing_info.primary_color).minicolors("destroy").minicolors(minicolor_options);
	tempRow_drop.find(".secondary-color-input").val(listing_info.secondary_color).minicolors("destroy").minicolors(minicolor_options);
	tempRow_drop.find(".tertiary-color-input").val(listing_info.tertiary_color).minicolors("destroy").minicolors(minicolor_options);
}
function updateFontStyling(tempRow_drop, listing_info){
	var minicolor_options = {
		letterCase: "uppercase",
		swatches: ["#000", "#222", "#D3D3D3", "#FFF"]
	}
	tempRow_drop.find(".font-color-input").val(listing_info.font_color).minicolors("destroy").minicolors(minicolor_options);

	//if created tags before
	if (tempRow_drop.find(".font-name-input").data('tags') == true){
		tempRow_drop.find(".font-name-input").tagit("destroy");
	}
	else {
		tempRow_drop.find(".font-name-input").data("tags", true);
	}
	tempRow_drop.find(".font-name-input").val(listing_info.font_name).tagit({
		animate: false,
		afterTagAdded : function(event, ui){
			changedValue(tempRow_drop.find(".font-name-input"), listing_info);
		},
		afterTagRemoved : function(event, ui){
			changedValue(tempRow_drop.find(".font-name-input"), listing_info);
		}
	});
}
function updateModules(tempRow_drop, listing_info){
	tempRow_drop.find(".history-module-input").val(listing_info.history_module);
	tempRow_drop.find(".traffic-module-input").val(listing_info.traffic_module);
}
function updateBackgroundImage(tempRow_drop, listing_info, rownum){
	var background_image = (listing_info.background_image == null || listing_info.background_image == undefined || listing_info.background_image == "") ? "https://placeholdit.imgix.net/~text?txtsize=40&txt=RANDOM%20PHOTO&w=200&h=200" : listing_info.background_image;
	tempRow_drop.find(".background_image").attr('src', background_image).off().on("error", function() {
        $(this).attr("src", "https://placeholdit.imgix.net/~text?txtsize=40&txt=LOADING...%20&w=200&h=200");
    });

	//unique id for label
	if (rownum >= 0){
		tempRow_drop.find(".background-file").attr('id', "background" + rownum).data("default_text", "Background Image");
		tempRow_drop.find(".background-label").attr('for', "background" + rownum);
	}

	tempRow_drop.find(".background-delete-img").off().on("click", function(e){
		deleteBackgroundImg($(this), listing_info, "https://placeholdit.imgix.net/~text?txtsize=40&txt=RANDOM%20PHOTO&w=200&h=200");
	});
}
function deleteBackgroundImg(temp_x, listing_info, default_img){
	var temp_img = temp_x.next('img');
	var temp_input = temp_x.closest(".card-image").next('.card-footer').find(".input-file");
	var temp_form = temp_x.closest(".card-image").next('.card-footer').find(".drop-form-file");

	if (temp_img.attr("src") != default_img){
		var old_src = temp_img.attr("src");
		temp_img.data("old_src", old_src);
		temp_img.attr("src", default_img);
		temp_input.data("deleted", true);
		temp_input.val("");
		temp_form.find(".file-label").text("Background Image");
	}
	changedValue(temp_input, listing_info);
}
function updateDeleteMessagesX(tempRow_drop){
	tempRow_drop.find(".notification").find(".delete").off().on("click", function(){
		$(this).closest(".notification").addClass('is-hidden');
	});
}
function updateLogo(tempRow_drop, listing_info, rownum){
	var logo = (listing_info.logo == null || listing_info.logo == undefined || listing_info.logo == "") ? "/images/dh-assets/flat-logo/dh-flat-logo-primary.png" : listing_info.logo;
	tempRow_drop.find(".listing-logo-img").attr('src', logo).off().on("error", function() {
        $(this).attr("src", "/images/dh-assets/flat-logo/dh-flat-logo-primary.png");
    });

	//unique id for label for
	if (rownum >= 0){
		tempRow_drop.find(".logo-file").attr('id', "logo" + rownum).data("default_text", "Logo");
		tempRow_drop.find(".logo-label").attr('for', "logo" + rownum);
	}

	tempRow_drop.find(".logo-delete-img").off().on("click", function(e){
		deleteBackgroundImg($(this), listing_info, "https://placeholdit.imgix.net/~text?txtsize=20&txt=NO%20LOGO&w=200&h=50");
	});
}


		//hide any notifications
		// $(".notification").addClass('is-hidden');

		//hide other tabs
		// tempRow_drop.find(".drop-tab").fadeOut(100).addClass('is-hidden');
		// tempRow_drop.find("." + clicked_tab.data("tab-id") + "-tab").fadeIn(100).removeClass('is-hidden');

		//clicked on the upgrade tab
		// if (clicked_tab.data('tab-id') == "upgrade"){
			// tempRow_drop.find(".save-changes-button").addClass('is-hidden');
		// }
		// else {
			// tempRow_drop.find(".save-changes-button").removeClass('is-hidden');
		// }

function updateSaveCancelButtons(tempRow_drop, listing_info){
	//to submit form changes
	tempRow_drop.find(".save-changes-button").click(function(e){
		submitListingChanges(tempRow_drop.prev(".row-disp"), tempRow_drop, $(this), listing_info);
	});

	//to cancel form changes
	tempRow_drop.find(".cancel-changes-button").click(function(e){
		cancelListingChanges(tempRow_drop.prev(".row-disp"), tempRow_drop, $(this), listing_info);
	});
}

function updatePremium(tempRow_drop, listing_info, firstload){
	//first time loading
	if (firstload){
		//format stripe cc icons
		tempRow_drop.find(".stripe-input").off().on("change keyup paste", function(){
			tempRow_drop.find(".listing-msg-error").addClass('is-hidden');

			var card_type = $.payment.cardType(tempRow_drop.find(".cc-num").val());
			if (card_type == "dinersclub") { card_type = "diners-club"}
			if (["maestro", "unionpay", "forbrugsforeningen", "dankort"].indexOf(card_type) != -1){ card_type = null}

			//show appropriate card icon
			if ($(".fa-cc-" + card_type) && card_type){
				tempRow_drop.find(".cc-icon").removeClass().addClass("cc-icon fa fa-cc-" + card_type);
			}
			//or show default
			else {
				tempRow_drop.find(".cc-icon").removeClass().addClass("cc-icon fa fa-credit-card");
			}
		});

		//format all stripe inputs
		tempRow_drop.find('.cc-num').val("").payment('formatCardNumber');
		tempRow_drop.find('.cc-exp').val("").payment('formatCardExpiry');
		tempRow_drop.find('.cc-cvc').val("").payment('formatCardCVC');
		tempRow_drop.find('.cc-zip').val("").payment('restrictNumeric');

		//click checkout button to submit and get stripe token
		tempRow_drop.find(".checkout-button").off().on("click", function(e){
			e.preventDefault();
			if (checkCC(tempRow_drop)){
				$(this).addClass('is-loading');
				tempRow_drop.find(".stripe-form").submit();
			}
		});

		//get stripe token
		tempRow_drop.find(".stripe-form").off().on("submit", function(e){
			e.preventDefault();
			Stripe.card.createToken($(this), function(status, response){
				if (response.error){
					errorMessage(tempRow_drop.find(".listing-msg-error"), "Something went wrong with the payment! Please refresh the page and try again.");
				}
				else {
					//all good, submit stripe token and listing id to dh server
					submitPremium(listing_info, tempRow_drop, response.id, $(tempRow_drop).find(".checkout-button"), firstload);
				}
			});
		});
	}

	//is not premium
	if (!listing_info.stripe_subscription_id){
		//tab title
		tempRow_drop.find(".upgrade-tab-text").text("Upgrade to Premium");

		//add disabled to premium inputs if not premium
		tempRow_drop.find(".premium-input").addClass('is-disabled');

		//hide/show elements needed for upgrade
		tempRow_drop.find(".basic-elem").removeClass('is-hidden');
		tempRow_drop.find(".premium-elem").addClass('is-hidden');

		//show cc form
		tempRow_drop.find(".stripe-form").removeClass('is-hidden');
		tempRow_drop.find(".checkout-button").text("Confirm & Pay").attr("title", "Confirm and Pay");
	}
	//is premium
	else {

		//hide cc form, show change card button
		tempRow_drop.find(".stripe-form").addClass('is-hidden');
		tempRow_drop.find(".change-card-button").removeClass('is-hidden');
		tempRow_drop.find(".checkout-button").text("Confirm Payment Method").attr("title", "Confirm Payment Method");

		//tab title
		tempRow_drop.find(".upgrade-tab-text").text("Premium Status");

		//remove disabled to premium inputs
		tempRow_drop.find(".premium-input").removeClass('is-disabled');

		//show/hide elements needed for upgrade
		tempRow_drop.find(".basic-elem").addClass('is-hidden');
		tempRow_drop.find(".premium-elem").removeClass('is-hidden');

		//show the CC form if they want to change card
		tempRow_drop.find(".change-card-button").off().on("click", function(){
			$(this).addClass('is-hidden');
			tempRow_drop.find(".stripe-form").removeClass('is-hidden');
			tempRow_drop.find('.cc-num').focus();
		});

		//last 4 digits
		var premium_cc_last4 = (user.stripe_info.premium_cc_last4) ? user.stripe_info.premium_cc_last4 : "****";
		var premium_cc_brand = (user.stripe_info.premium_cc_brand) ? user.stripe_info.premium_cc_brand : "Credit"
		tempRow_drop.find(".existing-cc").text(premium_cc_brand + " card ending in " + premium_cc_last4);

		//expiring
		if (listing_info.expiring == true){
			if (listing_info.exp_date){
				tempRow_drop.find(".renew-status").text("Active, but expiring on " + moment(listing_info.exp_date * 1000).format("MMM DD, YYYY") + ".");
			}
			tempRow_drop.find(".cancel-premium-button").addClass("is-hidden");

			//click to renew subscription
			tempRow_drop.find(".renew-premium-button").removeClass("is-hidden").off().on("click", function(){
				$(this).addClass('is-loading');
				submitPremium(listing_info, tempRow_drop, "", $(this));
			});
		}

		//not expiring, show cancel button
		else if (listing_info.expiring == false){
			if (listing_info.exp_date){
				tempRow_drop.find(".renew-status").text("Active and renewing on " + moment(listing_info.exp_date * 1000).format("MMM DD, YYYY") + ".");
			}
			tempRow_drop.find(".renew-premium-button").addClass("is-hidden").removeClass('is-loading');

			//cancel subscription
			tempRow_drop.find(".cancel-premium-button").removeClass("is-hidden").off().on("click", function(){
				var cancel_button = $(this);
				cancel_button.addClass('is-loading');
				$.ajax({
					url: "/listing/" + listing_info.domain_name + "/downgrade",
					method: "POST"
				}).done(function(data){
					cancel_button.removeClass('is-loading');
					if (data.state == "success"){
						premiumSuccessHandler(listing_info, data.listings, tempRow_drop);
					}
					else {
						var error_msg = data.message || "Something went wrong with the cancellation! Please refresh the page and try again.";
						errorMessage(tempRow_drop.find(".listing-msg-error"), error_msg);
					}
				});
			});
		}
	}
}

//</editor-fold>

//<editor-fold>-------------------------------UPGRADE TO PREMIUM-------------------------------

//check the CC info
function checkCC(tempRow_drop){
	var listing_error_elem = tempRow_drop.find(".listing-msg-error");
    listing_error_elem.addClass('is-hidden');
    if (!tempRow_drop.find(".cc-num").val()){
    	listing_error_elem.removeClass('is-hidden').addClass('is-danger').html("Please provide a credit card to charge.");
    }
    else if (!tempRow_drop.find(".cc-exp").val()){
    	listing_error_elem.removeClass('is-hidden').addClass('is-danger').html("Please provide your credit card expiration date.");
    }
    else if (!tempRow_drop.find(".cc-cvc").val()){
    	listing_error_elem.removeClass('is-hidden').addClass('is-danger').html("Please provide your credit card CVC number.");
    }
    else if (!tempRow_drop.find(".cc-zip").val()){
    	listing_error_elem.removeClass('is-hidden').addClass('is-danger').html("Please provide a ZIP code.");
    }
    else {
        return true;
    }
}

function submitPremium(listing_info, tempRow_drop, stripeToken, button_elem, firstload){
	$.ajax({
		url: "/listing/" + listing_info.domain_name + "/upgrade",
		method: "POST",
		data: {
			stripeToken: stripeToken
		}
	}).done(function(data){
		console.log(data);

		//update cc last 4 and brand
		if (data.user){
			user = data.user;
		}

		button_elem.removeClass('is-loading');

		if (data.state == "success"){
			premiumSuccessHandler(listing_info, data.listings, tempRow_drop, firstload);
		}
		else {
			var error_msg = data.message || "Something went wrong with the cancellation! Please refresh the page and try again.";
			errorMessage(tempRow_drop.find(".listing-msg-error"), error_msg);
		}
	});
}

//function to set premium-related info / tab
function premiumSuccessHandler(old_listing_info, new_listings, tempRow_drop, firstload){
	listings = new_listings;

	//show all premium stuff
	updatePremium(tempRow_drop, getUserListingObj(listings, old_listing_info.domain_name), firstload);
}

//</editor-fold>

//<editor-fold>-------------------------------UPDATE ROW UNVERIFIED-------------------------------

//functions to update row drop unverified
function updateRegistrarURL(tempRow, whois){
	if (whois && (whois.Registrar || whois["Sponsoring Registrar"])){
		var reg_name = whois.Registrar || whois["Sponsoring Registrar"];
		var reg_url = whois["Registrar URL"] || whois["Registrar URL (registration services)"];
		var regex_url = /^((http|https):\/\/)/;
		if (!regex_url.test(reg_url)) { reg_url = "http://" + reg_url; }
		tempRow.find(".registrar_url").replaceWith("<a class='registrar_url is-accent' href='" + reg_url + "'>log in to your domain provider</a> (" + reg_name + ") ");
	}
}
function updateExistingDNS(tempRow, a_records){
	if (a_records){
		var temp_a_records = a_records.slice(0);
		if (temp_a_records.indexOf("208.68.37.82") != -1){
			temp_a_records.splice(temp_a_records.indexOf("208.68.37.82"), 1);
			tempRow.find("#existing_a_record_clone").removeClass('is-hidden').find(".existing_data").text("208.68.37.82").removeClass("is-danger").addClass('is-success');
		}
		for (var x = 0; x < temp_a_records.length; x++){
			var temp_dns_row = tempRow.find("#existing_a_record_clone").clone().removeAttr('id').removeClass('is-hidden');
			temp_dns_row.find(".existing_data").text(a_records[x]).addClass('is-danger');
			temp_dns_row.find(".required_data").text("You must delete this!").addClass('is-danger');
			tempRow.find("#dns_table_body").append(temp_dns_row);
		}
	}
	else {
		tempRow.find("#existing_a_record_clone").removeClass('is-hidden').find(".existing_data").text("Not found!").addClass('is-danger');
	}
}
function updateVerificationButton(tempRow, listing_info, cb_when_verified){
	var verify_button = tempRow.find(".verify-button");

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
				verify_button.addClass('is-danger');
				verify_button.text("Failed to verify! Check info and click to try again.");
			}
		});
	});
}

//</editor-fold>

//<editor-fold>-------------------------------EDIT ROW-------------------------------

//function to initiate edit mode
function editRow(row){
    //all others are not editing
    $(".row-disp").each(function(e){
        if ($(this).data('editing') == true && $(this).attr("id") != row.attr("id")){
            $(this).data("editing", false);
            $(this).removeClass("is-active");
            dropRow($(this), false);
			editVerifyButton($(this), false);
            $(this).next(".row-drop").find(".cancel-changes-button").click();
        }
    });

    //are we editing or saving?
    var editing = (row.data("editing") == false) ? true : false;
    row.data("editing", editing);

	//highlight to show which one we're editing
	if (editing){
		row.addClass('is-active');
	}
	else {
		row.removeClass('is-active');
	}

    dropRow(row, editing);
	editVerifyButton(row, editing);

	//get the current who is and A record if unverified row
	if (row.data('verified') == false && editing && !row.data('record_got')){
		getDNSRecordAndWhois(row.find(".td-domain").text(), row);
	}

    //cancel any changes if we collapse the row
    if (!editing){
        row.next(".row-drop").find(".cancel-changes-button").click();
    }
}

//function to get A Record and Whois info for unverified domain
function getDNSRecordAndWhois(domain_name, row){
	$.ajax({
		url: "/listing/" + domain_name + "/unverifiedInfo",
		method: "POST"
	}).done(function(data){
		$(row).data("record_got", true);

		//to do, update the table
		var unverified_domain = getUserListingObj(listings, domain_name);
		unverified_domain.a_records = data.listing.a_records;
		unverified_domain.whois = data.listing.whois;

		updateRegistrarURL(row.next(".row-drop"), data.listing.whois);
		updateExistingDNS(row.next(".row-drop"), data.listing.a_records);
	});
}

//function to hide verification button in row
function editVerifyButton(row, editing){
	if (editing){
		row.find(".verify-button").addClass('is-hidden');
	}
	else {
		row.find(".verify-button").removeClass('is-hidden');
	}
}

//function to refresh listing_info on cancel, submit, input event listeners after AJAX success
function refreshSubmitbindings(bool_for_status_td){
    for (var x = 0; x < $(".row-disp").length; x++){
        for (var y = 0; y < listings.length; y++){
            if (listings[y].id == $($(".row-disp")[x]).data("id")){
                (function(info, row){
                    var row_drop = row.next('.row-drop');
                    var both_rows = row.add(row_drop);
                    var cancel_button = row_drop.find(".cancel-changes-button");
                    var success_button = row_drop.find(".save-changes-button");

                    cancel_button.off().on("click", function(e){
                        cancelListingChanges(row, row_drop, $(this), info);
                    });

                    success_button.off().on("click", function(e){
                        submitListingChanges(row, row_drop, $(this), info);
                    });

                    //refresh category click handlers and paths
					updateCategories(row_drop, info);
					row_drop.find(".categories-input").val(info.categories);

					updatePaths(row_drop, info);
					updateBuyPrice(row, info);
					updateStatus(row, info);

					changedValueHandlers(both_rows, info);

					//revert all inputs
					updateBackgroundImage(row_drop, info);
					updateLogo(row_drop, info);
                }(listings[y], $($(".row-disp")[x])));
                break;
            }
        }
    }
}

//</editor-fold>

//<editor-fold>-------------------------------SELECT ROW-------------------------------

//function to select a row
function selectRow(row){
    var selected = (row.data("selected") == false) ? true : false;
    var verified = row.data("verified");
    row.data("selected", selected);

    var icon_i = row.find(".td-arrow i");
    var icon_span = row.find(".td-arrow .icon");

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
function selectAllRows(){
	$(".row-disp").addClass('is-active').data('selected', true);
	$(".row-disp>.td-arrow .icon, #select-all>span").addClass('is-primary');
	$(".row-disp>.td-arrow i, #select-all>span>i").removeClass("fa-square-o").addClass('fa-check-square-o box-checked');

	var unverified_icon = $(".row-disp>.td-arrow i.fa-exclamation-triangle");
	var unverified_span = $(".row-disp>.td-arrow .icon.is-danger");
	unverified_icon.removeClass('fa-exclamation-triangle').addClass('unverified-icon');
	unverified_span.removeClass('is-danger').addClass('unverified-span');

	multiSelectButtons();
}

//function to deselect all rows
function deselectAllRows(){
	$(".row-disp").removeClass('is-active').data('selected', false);
	$(".row-disp>.td-arrow .icon, #select-all>span").removeClass('is-primary');
	$(".row-disp>.td-arrow i, #select-all>span>i").addClass("fa-square-o").removeClass('fa-check-square-o box-checked');

	$(".unverified-icon").addClass("fa-exclamation-triangle").removeClass('fa-square-o');
	$(".unverified-span").addClass("is-danger");

	multiSelectButtons();
}

//function to multi-verify listings
function multiVerify(verify_button){
    verify_button.off();

	var ids = [];
	var selected_rows = $(".row-disp").filter(function(){
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
		verify_button.on("click", function(){
			multiVerify(verify_button);
		});

		deselectAllRows();
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
	row_display = listings.slice(0);

	//verified listings change
	if (data.verified_listings){
		for (var x = 0; x < data.verified_listings.length; x++){
			for (var y = 0; y < listings.length; y++){
				if (data.verified_listings[x] == listings[y].id){
					$(".row-disp").each(function(){
						if ($(this).data('id') == data.verified_listings[x]){
							//recreate the rows
							var row_drop = $(this).next(".row-drop");
							$(this).replaceWith(createRow(listings[y], $(this).attr('id').replace("row", "")));
							row_drop.replaceWith(createRowDrop(listings[y], $(this).attr('id').replace("row", "")));
							return false;
						}
					});
				}
			}
		}
	}
	refreshSubmitbindings();
}

//function to handle post-deletion of multi listings
function deletionHandler(rows, selected_rows){
	listings = rows;
	row_display = listings.slice(0);
	for (var x = 0; x < selected_rows.length; x++){
		$(selected_rows[x]).next(".row-drop").remove();
		$(selected_rows[x]).remove();
	}
	deselectAllRows();
	emptyRows();
}

//</editor-fold>

//<editor-fold>-------------------------------SUBMIT LISTING UPDATES-------------------------------

//function to cancel the listing submit
function cancelListingChanges(row, row_drop, cancel_button, listing_info){
    cancel_button.addClass("is-hidden");
    success_button = cancel_button.prev(".save-changes-button");
    success_button.removeClass("is-loading is-success is-danger").addClass('is-disabled').text("Save Changes");

    var listing_msg = row_drop.find(".listing-msg");
    listing_msg.addClass('is-hidden');

	//revert all inputs
	updatePaths(row_drop, listing_info);
	updateCategories(row_drop, listing_info);
	updateColorScheme(row_drop, listing_info);
	updateStatusDrop(row_drop, listing_info);
	updatePriceInputs(row_drop, listing_info);
	updateDescription(row_drop, listing_info);
	updateBackgroundImage(row_drop, listing_info);
	updateLogo(row_drop, listing_info);
	updateDeleteMessagesX(row_drop);

    errorMessage(row_drop.find(".listing-msg-error"));
    successMessage(row_drop.find(".listing-msg-success"));
}

//function to submit any changes to a listing
function submitListingChanges(row, row_drop, success_button, listing_info){
    var cancel_button = success_button.next(".cancel-changes-button");

    //clear any existing messages
    var listing_msg_error = row_drop.find(".listing-msg-error");
    var listing_msg_success = row_drop.find(".listing-msg-success");
    errorMessage(listing_msg_error);
    successMessage(listing_msg_error);

    var domain_name = listing_info.domain_name;
    var formData = new FormData();

    //only add changed inputs
    row.add(row_drop).find(".changeable-input").each(function(e){
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
        listing_info[input_name] = (listing_info[input_name] == null || listing_info[input_name] == undefined) ? "" : listing_info[input_name];
        if (input_val != listing_info[input_name]){
            formData.append(input_name, input_val);
        }
    });

    success_button.addClass("is-loading");
    $.ajax({
        url: "/listing/" + domain_name + "/update",
        type: "POST",
        data: formData,
        // Options to tell jQuery not to process data or worry about the content-type
        cache: false,
        contentType: false,
        processData: false
    }, 'json').done(function(data){
        success_button.removeClass("is-loading");
        if (data.state == "success"){
            successMessage(listing_msg_success, true);
            listings = data.listings;
            row_display = listings.slice(0);

            success_button.addClass("is-disabled");
            cancel_button.addClass('is-hidden');
            refreshSubmitbindings();

            //change background image if its changed
            if (data.new_background_image){
                row_drop.find("img.is-listing").attr("src", data.new_background_image);
                row_drop.find(".file-label").text("Background Image");
                row_drop.find(".picture-file").val("");
            }
        }
        else {
            errorMessage(listing_msg_error, data.message);
        }
    });
}

//helper function to display/hide error messages per listing
function errorMessage(msg_elem, message){
	$(".notification").addClass('is-hidden');

    if (message && message != "nothing-changed"){
		msg_elem.removeClass('is-hidden');
		msg_elem.find("p").empty();

        //connect stripe first!
        if (message == "stripe-connect-error"){
            msg_elem.append("<p class='is-white'>You must <a class='is-underlined' href='/profile/settings#payout-address'>enter your payment information</a> before your listing can go live!</p>");
        }
        else {
            msg_elem.append("<p class='is-white'>" + message + "</p>");
        }
    }
    else {
        msg_elem.addClass('is-hidden');
    }
}

//helper function to display success messages per listing
function successMessage(msg_elem, message){
    msg_elem.removeClass('is-hidden');
    $(".notification p").empty();
    if (message){
        msg_elem.append("<p class='is-white'>Successfully updated this listing!</p>");
    }
    else {
        msg_elem.addClass('is-hidden');
    }
}

//</editor-fold>

//<editor-fold>-------------------------------HELPER FUNCTIONS--------------------------------

function toUpperCase(string){
    return string.charAt(0).toUpperCase() + string.substr(1);
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
