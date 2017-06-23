var current_theme = "DomaHub";

$(document).ready(function() {
	if (compare){

		//change compare tabs
		$(".compare-tab").on("click", function(){
			$(".compare-tab").removeClass('is-active');
			$(this).addClass('is-active');

			var box_id = $(this).attr('id').split("-")[0];
			$(".compare-box").addClass('is-hidden');
			$("#" + box_id + "-box").removeClass('is-hidden');
		});

		//INFO TAB
		updateDescription();
		updatePricing();
		updateBIN();
		updateRentable();

		//DESIGN TAB
		updateThemes();
		loadBackgroundHandlers();
		loadColorSchemeHandlers();
		loadFontStyleHandlers();
		updateModules();
		switchTheme($("#theme-input").val());

		//change to custom theme if anything is changed
		$(".theme-changeable-input").on("change", function(){
			current_theme = "Custom";
			$("#theme-input").val(current_theme);
		});

		toggleMenu();
	}
});

//function to hide and show menu
function toggleMenu() {
	var hideMenuButton = $("#hide-menu-button");
	var showMenuWrapper = $("#show-menu-wrapper");
	var menu = $("#compare-menu");
	var preview = $("#compare-preview");

	hideMenuButton.on("click", function() {
		menu.toggleClass("is-active");
		preview.toggleClass("is-active");
		showMenuWrapper.toggleClass("is-hidden", function(){
			console.log("finished showing new");
		});
	});

	showMenuWrapper.on("click",function() {
		$(this).toggleClass("is-hidden");
		menu.toggleClass("is-active");
		preview.toggleClass("is-active");
	});
}

//<editor-fold>-----------------------------------------------------------------------------------THEMES

//update theme selector
function updateThemes(){
	//swtich theme selector
	$("#theme-input").off().on("input", function(){
		switchTheme($(this).val());
	});

	//get a unique random theme
	$("#random-theme-button").off().on("click", function(){
		var new_theme = getRandomTheme();
		while (current_theme == new_theme){
			new_theme = getRandomTheme();
		}
		current_theme = new_theme;
		switchTheme(new_theme);
	});

	//get a random theme
	function getRandomTheme(){
		var themes_array = $("#theme-input option").map(function(){ if ($(this).val() != "Custom") { return $(this).val() } } ).get();
		var random_index = Math.floor(Math.random() * themes_array.length);
		return themes_array[random_index];
	}
}

//function to switch theme
function switchTheme(theme_name){
	var theme_to_load = findTheme(theme_name);

	for (var x in theme_to_load){
		listing_info[x] = theme_to_load[x];
	}

	updateBackgroundImage(listing_info.background_image);
	updateFontName(listing_info.font_name);
	$("#background-color-input").minicolors("value", listing_info.background_color);
	$("#primary-color-input").minicolors("value", listing_info.primary_color);
	$("#secondary-color-input").minicolors("value", listing_info.secondary_color);
	$("#tertiary-color-input").minicolors("value", listing_info.tertiary_color);
	$("#font-color-input").minicolors("value", listing_info.font_color);

	current_theme = theme_name;
	$("#theme-input").val(theme_name);
}

//</editor-fold>

//<editor-fold>-----------------------------------------------------------------------------------INFO TAB

//function to update the description
function updateDescription(){
	$("#description").val(listing_info.description).on("input", function(){
		$("#description-text").text($(this).val());
	});
}

//function to update pricing
function updatePricing(){
	$("#buy-price-input").val(listing_info.buy_price).on("input", function(){
		if ($(this).val() > 0){
			$("#buy-price-tag").removeClass('is-hidden');
			$("#buy-price").text("For sale - " + moneyFormat.to(parseFloat($(this).val())));
			$("#min-price").removeClass('is-hidden').text(" (Minimum " + moneyFormat.to(parseFloat($(this).val())) + ")");
			$("#contact_offer").attr("placeholder", $(this).val());
		}
		else {
			$("#buy-price-tag").addClass('is-hidden');
			$("#min-price").addClass('is-hidden');
			$("#contact_offer").attr("placeholder", "");
		}
		listing_info.buy_price = $(this).val();
	});
	$("#price-rate-input").val(listing_info.price_rate).on("input", function(){
		listing_info.price_rate = $(this).val();
		$("#actual-price").text("For rent - " + moneyFormat.to(parseFloat($(this).val())) + " / " + $("#price-type-input").val());
	});
	$("#price-type-input").val(listing_info.price_type).on("input", function(){
		listing_info.price_type = $(this).val();
		$("#actual-price").text("For rent - " + moneyFormat.to(parseFloat($("#price-rate-input").val())) + " / " + $("#price-type-input").val());
	});
}

//function to update BIN
function updateBIN(){
	checkBox(listing_info.buyable, $("#buyable-input"));

	$("#buyable-input").on("change", function(){
		if ($(this).prop("checked")){
			listing_info.buyable = 1;
			$("#buy-button").removeClass('is-hidden');
		}
		else {
			listing_info.buyable = 0;
			$("#buy-button").addClass('is-hidden');
		}
	});
}

//function to update rentable
function updateRentable(){
	checkBox(listing_info.rentable, $("#rentable-input"));

	$("#rentable-input").on("change", function(){
		//allow rent
		if ($(this).prop("checked")){
			listing_info.rentable = 1;
			$("#rent-price-tag").removeClass('is-hidden');
			$("#buy-rent-tabs").removeClass('is-hidden');
		}

		//dont allow rent
		else {
			listing_info.rentable = 0;
			$("#rent-price-tag").addClass('is-hidden');
			$("#buy-rent-tabs").addClass('is-hidden');
		}
	});
}

//</editor-fold>

//<editor-fold>-----------------------------------------------------------------------------------DESIGN TAB

//function to load background handlers
function loadBackgroundHandlers(){
	//load background image handler
	$("#background-image-input").off().on("input", function(){
		updateBackgroundImage($(this).val(), false);
	});

	//load background color handler
	$("#background-color-input").minicolors({
		letterCase: "uppercase",
		swatches: ["#FFFFFF", "#E5E5E5", "#B2B2B2", "#7F7F7F", "#666666", "#222222", "#000000"]
	}).off().on("input", function(){
		updateBackgroundColor($(this).val());
	});
}

//input to update background and the page
function updateBackgroundImage(background_image){
	listing_info.background_image = background_image;
	$("#background-image-input").val(background_image);
	if (background_image == ""){
		$("#compare-preview").css("background", "");
	}
	else {
		$("#compare-preview").css("background", "url(" + background_image + ") center/cover no-repeat");
	}
}

//input to update background color and the page
function updateBackgroundColor(background_color){
	listing_info.background_color = background_color;
	$("#background-color-input").val(background_color);
	$("#compare-preview").css("background-color", background_color);
}

//load color scheme handlers
function loadColorSchemeHandlers(){
	var minicolor_options = {
		letterCase: "uppercase",
		swatches: ["#3cbc8d", "#FF5722", "#2196F3"]
	}
	$("#primary-color-input").minicolors(minicolor_options).off().on("change", function(){
		updateColorScheme($(this).val(), false, false);
	});
	$("#secondary-color-input").minicolors(minicolor_options).off().on("change", function(){
		updateColorScheme(false, $(this).val(), false);
	});
	$("#tertiary-color-input").minicolors(minicolor_options).off().on("change", function(){
		updateColorScheme(false, false, $(this).val());
	});
}

//inputs to update color scheme
function updateColorScheme(primary_color, secondary_color, tertiary_color){
	if (primary_color != false){
		listing_info.primary_color = primary_color;
		$("#primary-color-input").val(primary_color);
		stylize(primary_color, ".daterangepicker td.active, .daterangepicker td.active:hover", "background-color");
		stylize(primary_color, "#compare-preview .is-primary", "color");
		stylize(primary_color, "#compare-preview .is-primary.button", "background-color");
		stylize(primary_color, ".tag", "background-color");

		if (myChart){
			myChart.data.datasets[0].borderColor = primary_color;
			myChart.data.datasets[0].backgroundColor = primary_color;
			myChart.update();
		}
	}
	if (secondary_color != false){
		listing_info.secondary_color = secondary_color;
		$("#secondary-color-input").val(secondary_color);
		stylize(secondary_color, "#compare-preview .is-accent", "color");
		stylize(secondary_color, "#compare-preview .is-accent.button", "background-color");
	}
	if (tertiary_color != false){
		listing_info.tertiary_color = tertiary_color;
		$("#tertiary-color-input").val(tertiary_color);
		stylize(tertiary_color, "#compare-preview .is-info", "color");
	}
}

//load the font styling handlers
function loadFontStyleHandlers(){
	//font color
	$("#font-color-input").minicolors({
		letterCase: "uppercase",
		swatches: ["#000", "#222", "#D3D3D3", "#FFF"]
	}).on("change", function(){
		updateFontColor($(this).val());
	});

	//font name
	$("#font-name-input").off().on("change", function(){
		updateFontName($(this).val());
	});
}

//function to update font color
function updateFontColor(font_color){
	listing_info.font_color = font_color;
	$("#font-color-input").val(font_color);
	stylize(font_color, ".regular-font", "color");
}

//function to update font name
function updateFontName(font_name){
	listing_info.font_name = font_name;
	$("#font-name-input").val(font_name)
	stylize(font_name, "#domain-title", "font-family");
}

//function to update modules
function updateModules(){
	checkBox(listing_info.traffic_module, $("#traffic-module-input"));
	checkBox(listing_info.info_module, $("#info-module-input"));
	checkBox(listing_info.history_module, $("#ticker-module-input"));

	$(".module-input").on("change", function(){
		var which_module = $(this).attr("id").split("-")[0];
		var selected_position = $("#" + which_module + "-tab").data('position');
		var current_position = $(".module-tab.is-active").data('position');

		//selected position is current position
		if (selected_position == current_position || current_position == undefined){
			$(".module").addClass('is-active');
			$(".module-tab").removeClass('is-active is-disabled');
			hideShowModules(which_module, $(this).prop("checked"), false);

			//show next one if nothing is showing
			var next_visible = $(".module-tab:not(.is-hidden)").first();
			if (next_visible.attr("id")){
				var next_visible_id = next_visible.attr("id").split("-")[0];
				$("#" + next_visible_id + "-module").removeClass('is-hidden');
				next_visible.addClass('is-active is-disabled');
			}
		}
		else {
			hideShowModules(which_module, $(this).prop("checked"), true);
		}
	});
}

//function to handle showing modules
function hideShowModules(which_module, checked, tabOnly){
	if (checked){
		if (!tabOnly){
			$("#" + which_module + "-module").removeClass('is-hidden');
		}
		$("#" + which_module + "-tab").removeClass('is-hidden');
	}
	else {
		if (!tabOnly){
			$("#" + which_module + "-module").addClass('is-hidden');
		}
		$("#" + which_module + "-tab").addClass('is-hidden');
	}
}

//function to check the module boxes according to value
function checkBox(module_value, elem){
	if (module_value){
		elem.val(module_value).prop("checked", true);
	}
	else {
		elem.val(module_value).prop("checked", false);
	}
}

//</editor-fold>

//<editor-fold>-----------------------------------------------------------------------------------MODULES

//function to create a test chart
function createTestChart(){

	if (myChart){
		myChart.destroy();
	}

	listing_info.traffic = [{
		views : Math.floor(Math.random() * 10000)
	}];

	//create the monthly x-axis labels array
	var monthly_labels = [];
	var traffic_data = [];
	var months_to_go_back = 6;
	for (var y = 0; y < months_to_go_back; y++){
		var temp_month = moment().subtract(y, "month").format("MMM");
		monthly_labels.unshift(temp_month);
		traffic_data.unshift({
			x: temp_month,
			y: Math.round(Math.random() * 10000)
		});
	}

	//traffic dataset
	var traffic_dataset = {
		label: "Website Views",
		xAxisID : "traffic-x",
		yAxisID : "traffic-y",
		borderColor: (listing_info.primary_color) ? listing_info.primary_color : "#3CBC8D",
		backgroundColor: (listing_info.primary_color) ? listing_info.primary_color : "#3CBC8D",
		fill: false,
		data: traffic_data
	}

	//create the super dataset containing traffic data and rentals data
	var all_datasets = [traffic_dataset];

	//create the chart
	createValidChart(monthly_labels, all_datasets);
}

//function to create test domains
function createTestOtherDomains(){
	var test_listings = [];
	var test_domain_names = [
		"knotonmywatch.com",
		"treescompany.com",
		"domains.rocks",
		"excellent.design",
		"creativedoma.in",
		"great.bargains",
		"greatdomains.cheap",
		"ilove.coffee",
		"thiswebsiteis.cool",
		"goingon.holiday",
		"illtakeyour.photo",
		"cleanoutyour.plumbing",
		"myboyfriendis.sexy",
		"mygirlfriendis.sexy",
		"whereareallthe.singles",
		"ilove.nyc",
		"abc.xyz",
		"idrink.beer",
	];
	var test_price_types = [
		"day",
		"week",
		"month"
	];
	var max_listings = Math.floor(Math.random()*(2) + 8);

	//create a random amount of test listings
	for (var x = 0; x < max_listings; x++){
		var random_domain_index = Math.floor(Math.random()*test_domain_names.length);
		var test_listing = {
			domain_name : test_domain_names[random_domain_index],
			price_rate : Math.round(Math.random() * 250),
			price_type : test_price_types[Math.floor(Math.random()*test_price_types.length)],
			compare : true
		}

		var domain_price_type_random = Math.random();
		if (domain_price_type_random > 0.6){
			test_listing.buy_price = Math.round(Math.random() * 10000);
		}
		else if (domain_price_type_random > 0.4){
			test_listing.rentable = 1;
		}
		else if (domain_price_type_random > 0.3){
			test_listing.rentable = 1;
			test_listing.price_rate = 0;
		}
		else {
			test_listing.status = 1;
		}

		test_listings.push(test_listing);
		test_domain_names.splice(random_domain_index, 1);
	}

	//create the test domains
	createOtherDomains(test_listings);
}

//function to create test rentals
function createTestRentals(){
	var temp_rentals = [];
	var one_year_ago = moment().subtract(1, "year")._d.getTime();
	var time_since_one_year = new Date().getTime() - one_year_ago;

	var max_rentals_count = Math.floor(Math.random()*(5) + 20);
	for (var x = 0; x < max_rentals_count; x++){

		var temp_rental = {
			date : Math.floor(Math.random()*(time_since_one_year) + one_year_ago),
			duration : Math.random() * 604800000,
			views : Math.floor(Math.random() * 100000),
		}

		//80% of the time it's a random char, 20% anonymous
		if (Math.random() > 0.2){
			var random_char_index = Math.floor(Math.random() * random_characters.length);
			var random_char = random_characters[random_char_index];
			random_characters.splice(random_char_index, 1);

			temp_rental.username = random_char.name;
			temp_rental.path = random_char.email.split("@")[0];
			temp_rental.address = "http://www." + random_char.email.split("@")[1];
		}
		else {
			temp_rental.address = "https://domahub.com";
		}

		//showing content
		if (Math.random() > 0.1){
			temp_rental.type = 0
			var content_random = Math.random();

			if (content_random > 0.8){
				temp_rental.address = temp_rental.address + "/cool.jpg";
			}
			else if (content_random > 0.6){
				temp_rental.address = temp_rental.address + "/funny.gif";
			}
			else if (content_random > 0.4){
				temp_rental.address = temp_rental.address + "/document.pdf";
			}
			else if (content_random > 0.3){
				temp_rental.address = "";
			}
		}

		temp_rentals.push(temp_rental);
	}

	temp_rentals.sort(function(a, b){
		if (a["date"] < b["date"]){
			return -1;
		}
		if (a["date"] > b["date"]) {
			return 1;
		}
		return 0;
	});

	listing_info.rentals = temp_rentals;
}

//</editor-fold>

//<editor-fold>-----------------------------------------------------------------------------------UPDATE HANDLERS

//function to do submit buy handler
function testSubmitBuyHandler(){
	setTimeout(function(){
		$("button[type=submit][clicked=true]").removeClass('is-loading');
		$("#contact-success-compare").removeClass('is-hidden');
	}, 500);
}

//function to handle submit calendar handler
function testCalendarHandler(){
	setTimeout(function(){
		$("#calendar").removeClass('is-disabled');
		$("#calendar-loading-message").addClass('is-hidden');
		clearLoadingDots($("#calendar-loading-message"));
		$("#calendar-regular-message").removeClass('is-hidden');

		listing_info.rental_moments = [];
		var random_rentals_count = 24;
		for (var x = 0; x < random_rentals_count; x++){
			var start_of_month = moment().add(x, "months").startOf("month")._d.getTime();
			var end_of_month = moment().add(x, "months").endOf("month")._d.getTime();

			var random_start = randomIntFromInterval(start_of_month, end_of_month);
			var random_duration = 86400000 * randomIntFromInterval(5, 7);

			var temp_rental = {
				start : moment(random_start),
				end : moment(random_start + random_duration)
			}
			listing_info.rental_moments.push(temp_rental);
		}

		setUpCalendar(listing_info);
	}, 500);
}

//</editor-fold>

function randomIntFromInterval(min,max){
    return Math.floor(Math.random()*(max-min+1)+min);
}
