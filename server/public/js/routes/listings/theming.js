$(document).ready(function() {

    //remove class to prevent screen flash DH green
    $("#compare-preview").removeClass('is-hidden');

    if (listing_info.premium){
        setupCustomColors();

        stylize(listing_info.secondary_color, "#typed-slash", "color");

        if (listing_info.background_image){
            $("#compare-preview").css("background", "url(" + listing_info.background_image + ") center/cover no-repeat").on("error", function(){
                $(this).css({
                    background: "",
                    "background-color": "#FFF"
                });
            });
        }

        if (listing_info.logo){
            //hide dh logo
            $("#powered-by").html('&nbsp;');
            $("#dh_logo").addClass('is-hidden');

            //show custom logo
            $("#custom_logo").attr("src", listing_info.logo).on("error", function(){
                console.log("Error loading logo!");
            });
        }
        else {
            $(".footer").addClass('is-hidden');
        }
    }
    else {
        setupDefaultColors();
    }
});

var primaryColor = "#3CBC8D";
var secondaryColor = "0f0";
var tertiaryColor = "00f";
var whiteText = "#fff";
var blackText = "#222";

//return white or black text based on luminance
function calculateLuminance(rgb) {
	var hexValue = rgb.replace(/[^0-9A-Fa-f]/, '');
	var r,g,b;
	if (hexValue.length === 3) {
		hexValue = hexValue[0] + hexValue[0] + hexValue[1] + hexValue[1] + hexValue[2] + hexValue[2];
	}
	if (hexValue.length !== 6) {
		return 0;
	}
    r = parseInt(hexValue.substring(0,2), 16) / 255;
  	g = parseInt(hexValue.substring(2,4), 16) / 255;
  	b = parseInt(hexValue.substring(4,6), 16) / 255;

    // calculate the overall luminance of the color
    var luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    if (luminance > 0.8) {
        return "#222";
    }
    else {
        return "#fff";
    }
}

function stylize(color, element, style) {
    if (color){
        $(element).css(style, color);
        if (style == "background-color") {
            $(element).css("color", calculateLuminance(color));
        }
    }
}

//function to setup any custom premium colors
function setupCustomColors(){
    stylize(listing_info.primary_color, ".is-primary", "color");
    stylize(listing_info.primary_color, ".daterangepicker td.active, .daterangepicker td.active:hover", "background-color");
    stylize(listing_info.primary_color, ".button", "background-color");
    stylize(listing_info.primary_color, ".tag", "background-color");
    stylize(listing_info.font_color, ".regular-font", "color");
    stylize(listing_info.primary_color, "h1,h2,h3", "color");
    stylize(listing_info.tertiary_color, ".is-info", "color");
    stylize(listing_info.secondary_color, ".is-accent", "color");
    stylize(listing_info.secondary_color, ".is-accent.button", "background-color");
    stylize(listing_info.background_color, "#compare-preview", "background-color");
    stylize(listing_info.font_name, "#domain-title", "font-family");
    stylize(listing_info.font_name, "#typed-slash", "font-family");
}

//set up default DH colors
function setupDefaultColors(){
    stylize(primaryColor, ".tag", "background-color");
}
