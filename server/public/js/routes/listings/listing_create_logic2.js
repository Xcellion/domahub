$(document).ready(function() {

	//submit to create the table
	$("#domain-names-submit").on("click", function(e){
		e.preventDefault();
		submitDomainNames($(this));
	});

	//enter to submit textarea
	$("#domain-names").on("keypress", function(e){
		if (e.which == 13){
			e.preventDefault();
			submitDomainNames($(this));
		}
	});

	//add row to table
	$(".add-domain-button").on("click", function(e){
		e.preventDefault();
		createTableRow("");
		calculateSummaryRows();
	});

	//submit to create listings
	$("#domains-submit").on("click", function(e){
		e.preventDefault();
		submitDomains($(this));
	});

	//go back to edit table
	$("#review-table-button").on("click", function(e){
		e.preventDefault();
		showTable();
	});

});

//helper function to show next help text
function showHelpText(help_text_id){
	$(".content-wrapper").addClass("is-hidden");
	$("#" + help_text_id + "-helptext").removeClass('is-hidden');
}

//--------------------------------------------------------------------------------TEXTAREA

//function to submit textarea domains
function submitDomainNames(submit_elem){
	var domain_names = $("#domain-names").val().replace(/\s/g,'').replace(/^[,\s]+|[,\s]+$/g, '').replace(/,[,\s]*,/g, ',').split(",");
	if (domain_names.length > 0 && $("#domain-names").val() != ""){
		submit_elem.off();		//remove handler
		submit_elem.addClass('is-loading');

		$.ajax({
			url: "/listings/create/table",
			method: "POST",
			data: {
				domain_names: domain_names
			}
		}).done(function(data){
			createTable(data.bad_listings, data.good_listings);
			submit_elem.removeClass('is-loading');
			submit_elem.on("click", function(e){
				e.preventDefault();
				submitDomainNames(submit_elem);
			});
		});
	}
}

//--------------------------------------------------------------------------------TABLE

//function to show the table
function showTable(old_submit){
	showHelpText("table");
	$("#domains-submit").removeClass('is-hidden is-disabled');
	$("#payment-column").addClass('is-hidden');
	$("#table-column").removeClass('is-hidden');
	$("#summary-column").removeClass('is-offset-2');
	$("#review-table-button").addClass('is-hidden');
}

//function to create the listing table from server info
function createTable(bad_listings, good_listings){
	$("#domain-input-form").addClass('is-hidden');
	$("#table-columns").removeClass('is-hidden');

	if (bad_listings.length > 0){
		$("#domain-error-message").removeClass("is-hidden");
		for (var x = 0; x < bad_listings.length; x++){
			createTableRow(bad_listings[x]);
		}
	}

	if (good_listings.length > 0){
		for (var y = 0; y < good_listings.length; y++){
			createTableRow(good_listings[y]);
		}
	}

	showHelpText("table");
	calculateSummaryRows();
}

//function to create table row
function createTableRow(data){
	var temp_table_row = $("#clone-row").removeClass('is-hidden').clone();		//clone row
	var num = $(".table-row").not('#clone-row').length + 1;
	var domain_name = data.domain_name;

	temp_table_row.removeAttr('id');
	temp_table_row.find(".domain-name-input").val(domain_name);
	temp_table_row.find(".cat-checkbox-label").prop("for", "id" + num);

	//click handler for premium checkbox
	temp_table_row.find(".cat-checkbox").prop("id", "id" + num).on("change", function(){
		calculateSummaryRows();
		checkPremiumRow($(this).closest(".table-row"));
	});

	//click handler for price type select
	temp_table_row.find("select").on("change", function(){
		calculateSummaryRows();
		checkPremiumRow($(this).closest(".table-row"));
	});

	//click handler for row delete
	temp_table_row.find(".delete-icon").on("click", function(){
		$(this).closest('tr').remove();
		if ($(".delete-icon").length == 1){
			createTableRow("");
		}
		handleTopAddDomainButton();
		refreshNotification();
		calculateSummaryRows();
	});

	handleTopAddDomainButton();

	//if there are more than 10 rows, add the add-domain button to the top as well
	if ($(".table-row").length > 10){
		$("#top-header-row").removeClass('is-hidden');
	}
	else {
		$("#top-header-row").addClass('is-hidden');
	}

	//reasons for why it was a bad listing
	handleReasons(data.reasons, temp_table_row);

	$("#clone-row").addClass("is-hidden");
	temp_table_row.appendTo("#domain-input-table");
}

//function to handle bad reasons
function handleReasons(reasons, row){
	if (reasons){

		//refresh the row
		row.find("small").remove();
		row.find('.is-danger').removeClass("is-danger");

		//append latest one
		for (var x = 0; x < reasons.length; x++){
			var explanation = $("<small class='is-danger is-pulled-right'>" + reasons[x] + "</small>")
			if (reasons[x] == "Invalid domain name!" || reasons[x] == "Duplicate domain name!" || reasons[x] == "This domain name already exists!"){
				var reason_input = ".domain-name-input";
			}
			else if (reasons[x] == "Invalid type!"){
				var reason_input = ".price-type-input";
			}
			else if (reasons[x] == "Invalid rate!"){
				var reason_input = ".price-rate-input";
			}

			//handler to clear reasons and append the reason
			row.find(reason_input).addClass('is-danger').on("input change", function(){
				$(this).removeClass('is-danger');
				$(this).closest("td").find("small").remove();
				refreshNotification();
			}).closest('td').append(explanation);
		}
	}
}

//if there are more than 10 rows, add the add-domain button to the top as well
function handleTopAddDomainButton(){
	if ($(".table-row").length > 10){
		$("#top-header-row").removeClass('is-hidden');
	}
	else {
		$("#top-header-row").addClass('is-hidden');
	}
}

//function to delete empty table rows
function deleteEmptyTableRows(){
	var empty_domain_inputs = $(".domain-name-input").filter(function() { return $(this).val() == ""; });
	empty_domain_inputs.closest("tr").not("#clone-row").remove();
	if ($(".table-row").length == 1){
		createTableRow("");
	}
}

//function to calculate the summary rows
function calculateSummaryRows(){
	var total_rows = $(".domain-name-input").not(".is-disabled").length - 1;
	var premium_domains = $("td .cat-checkbox:checked").not("#clone-row .cat-checkbox").length;
	var basic_domains = total_rows - premium_domains;

	$("#basic-count-total").text(basic_domains);
	$("#premium-count-total").text(premium_domains);

	//plural or not
	var basic_plural = (basic_domains > 1) ? "s" : "";
	$("#basic-count-plural").text(basic_plural);
	var premium_plural = (premium_domains > 1) ? "s" : "";
	$("#premium-count-plural").text(premium_plural);

	if (premium_domains){
		$("#premium-summary-row").removeClass('is-hidden');
	}
	else {
		$("#premium-summary-row").addClass('is-hidden');
	}

	if (basic_domains){
		$("#basic-summary-row").removeClass('is-hidden');
	}
	else {
		$("#basic-summary-row").addClass('is-hidden');
	}

	var total_price = (premium_domains > 0) ? "$" + (premium_domains * 5) : "FREE";
	$("#summary-total-price").text(total_price);
}

//function to check the table row is legit premium
function checkPremiumRow(row_elem){
	var price_input = row_elem.find(".price-rate-input");
	var price_select = row_elem.find("select");
	var price_checkbox = row_elem.find(".cat-checkbox");
	refreshNotification();

	if (price_checkbox.prop('checked')){
		price_select.find(".day-type").removeProp('disabled');
		price_select.find(".hour-type").removeProp('disabled');
		price_input.removeClass('is-disabled');
	}
	else {
		if (price_select.val() == "week"){
			price_input.attr("value", 10);
			price_input.val(10);
		}
		else {
			price_select.val("month");
			price_input.attr("value", 25);
			price_input.val(25);
		}
		price_select.find(".day-type").prop('disabled', true);
		price_select.find(".hour-type").prop('disabled', true);
		price_input.addClass('is-disabled');
	}
}

//function to refresh error messages on rows
function refreshNotification(){
	if ($(".is-danger").length == 1){
		$("#domain-error-message").addClass("is-hidden");		//hide error notification
		$("td small").remove();
		$("td .is-danger").removeClass("is-danger");
	}
}

//function to refresh rows on ajax return
function refreshRows(bad_listings, good_listings){
	refreshNotification();

	if (bad_listings && bad_listings.length > 0){
		showTable();
		badTableRows(bad_listings);
	}

	if (good_listings && good_listings.length > 0){
		showTable();
		goodTableRows(good_listings);

		//all successful!
		if (!bad_listings || bad_listings.length == 0){
			showHelpText("success");
			$("#success-total").text(good_listings.length);
		}
	}
}

//label the incorrect table rows
function badTableRows(bad_listings){
	$("#domain-error-message").removeClass("is-hidden");
	for (var x = 0; x < bad_listings.length; x++){
		var table_row = $($(".table-row").not("#clone-row")[bad_listings[x].index]);
		handleReasons(bad_listings[x].reasons, table_row);
	}
}

//label the correct table rows
function goodTableRows(good_listings){
	for (var x = 0; x < good_listings.length; x++){
		var table_row = $($(".table-row").not("#clone-row")[good_listings[x].index]);
		var explanation = $("<small class='is-success is-pulled-right'>Successfully added!</small>")
		table_row.find(".domain-name-input").addClass('is-success').closest('td').append(explanation);
		table_row.find(".domain-name-input, .price-type-input, .price-rate-input").addClass('is-disabled');

		//revert checkbox to text
		var premium_text = (table_row.find(".cat-checkbox").prop("checked")) ? "Premium" : "Basic";
		table_row.find(".td-premium").addClass("padding-top-15").empty().html("<strong>" + premium_text + "</strong>");
	}
}

//find the row with a specified domain name
function findRowDomainName(domain_name){
	$(".table-row").not("#clone-row").each(function(){
		if ($(this).find(".domain-name-input").val() == domain_name){
			return $(this);
		}
	});
}

//--------------------------------------------------------------------------------SUBMIT

//function to submit textarea domains
function submitDomains(submit_elem){

	//only if there are no error messages currently
	if ($("#domain-error-message").hasClass("is-hidden") && $("td .is-danger").length == 0){
		deleteEmptyTableRows();
		var domains = getTableRowVals(".domain-name-input");

		if (domains.length > 0){
			submit_elem.off();		//remove handler
			submit_elem.addClass('is-loading');

			submitDomainsAjax(domains, submit_elem);
		}
	}

}

//function to send ajax to server for domain creation
function submitDomainsAjax(domains, submit_elem, stripeToken){
	$.ajax({
		url: "/listings/create",
		method: "POST",
		data: {
			domains: domains,
			stripeToken : stripeToken
		}
	}).done(function(data){
		console.log(data);

		//handle any good or bad listings
		refreshRows(data.bad_listings, data.good_listings);
		calculateSummaryRows();

		//handle payment
		if (data.premium_count){
			showCCForm(submit_elem);
		}

		if (data.state == "error"){

		}
		submit_elem.removeClass('is-loading');

		//regular submit without paying
		if (!stripeToken){
			submit_elem.on("click", function(e){
				e.preventDefault();
				submitDomains(submit_elem);
			});
		}
	});
}

//helper function to get the table row values for ajax submission
function getTableRowVals(){
	var temp_array = [];
	$(".table-row").not("#clone-row").each(function(idx, elem) {
		var temp_row = $(this);
		//if domain name is not empty and not disabled
		if (temp_row.find(".domain-name-input").val() && !temp_row.find(".domain-name-input").hasClass('is-disabled')){
			var row_obj = {
				domain_name : temp_row.find(".domain-name-input").val(),
				price_type : temp_row.find(".price-type-input").val(),
				price_rate : temp_row.find(".price-rate-input").val(),
				premium : temp_row.find(".cat-checkbox").prop("checked")
			};
			temp_array.push(row_obj);
		}
	});
	return temp_array;
}

//--------------------------------------------------------------------------------PAYMENT

//function to show the CC payment form
function showCCForm(old_submit){
	old_submit.addClass('is-hidden').removeClass('is-disabled');
	$("#payment-column").removeClass('is-hidden');
	$("#table-column").addClass('is-hidden');
	$("#summary-column").addClass('is-offset-2');
	$("#review-table-button").removeClass('is-hidden');

	showHelpText("payment");
}

//helper function to check if everything is legit on payment form
function checkSubmit(){
	var bool = true;

	if (!$("#cc-num").val()){
		bool = "Invalid cc number!";
		$("#stripe-error-message").addClass('is-danger').html("Please provide a credit card to charge.");
	}
	else if (!$("#cc-exp").val()){
		bool = "Invalid cc exp!";
		$("#stripe-error-message").addClass('is-danger').html("Please provide your credit card expiration date.");
	}
	else if (!$("#cc-cvc").val()){
		bool = "Invalid cvc!";
		$("#stripe-error-message").addClass('is-danger').html("Please provide your credit card CVC number.");
	}
	else if (!$("#cc-zip").val()){
		bool = "Invalid zip Code!";
		$("#stripe-error-message").addClass('is-danger').html("Please provide a ZIP code.");
	}
	else if (!$("#agree-to-terms").prop('checked')){
		bool = "Invalid terms!";
		$("#stripe-error-message").addClass('is-danger').html("You must agree to the terms and conditions.");
	}

	return bool;
}

function submitStripe(stripeToken){
	var domains = getTableRowVals(".domain-name-input");
	submitDomainsAjax(domains, $("#checkout-button"), stripeToken);
}
