$(document).ready(function() {
    if (listing_info.premium){
        console.log("Premium");

        setupCustomColors();

        colorize(listing_info.secondary_color, "#typed-slash", "color");

        if (listing_info.background_image){
            $("#background-image").css("background", "url(" + listing_info.background_image + ") center/cover no-repeat").on("error", function(){
                console.log("Error loading background image!");
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

    //add active to the first appearing tab (maybe some tabs are disabled)
    $(".tab").eq(0).addClass('is-active');
    $(".module").eq(0).removeClass('is-hidden');
});

var primaryColor = "#3CBC8D";
var secondaryColor = "0f0";
var tertiaryColor = "00f";
var whiteText = "#fff";
var blackText = "#222";

function calculateLuminance(hex) {
    // parse hexcode and convert into decimal values
    var arrBuff = new ArrayBuffer(4);
    var vw = new DataView(arrBuff);
    vw.setUint32(0,parseInt(hex, 16),false);
    var arrByte = new Uint8Array(arrBuff);

    // variables for storing decimal values and others
    var red = arrByte[1];
    var green = arrByte[2];
    var blue = arrByte[3]
    var luminance = 0;
    var arrByteNew = [];

    // calculate the luminance value of each r g b
    arrByte.forEach(function(col) {
        col = col / 255.0;

        if (col <= 0.03928) {
            col = col / 12.92;
        }
        else {
            col = ((col + 0.055) / 1.055) ^ 2.4
        }

        arrByteNew.push(col);
    })

    // calculate the overall luminance of the color
    luminance = 0.2126 * arrByteNew[1] + 0.7152 * arrByteNew[2] + 0.0722 * arrByteNew[3];

    // return white or black text based on luminance
    if (luminance > 0.179) {
        return "#000";
    }
    else {
        return "#fff";
    }
}

function colorize(color, element, style) {
    $(element).css(style, color);
    if (style == "background-color") {
        $(element).css("color", calculateLuminance(color));
    }
}

//function to setup any custom premium colors
function setupCustomColors(){
    colorize(listing_info.primary_color, ".is-primary", "color");
    colorize(listing_info.primary_color, ".daterangepicker td.active, .daterangepicker td.active:hover", "background-color");
    colorize(listing_info.primary_color, ".button", "background-color");
    colorize(listing_info.primary_color, ".tag", "background-color");
    colorize(listing_info.font_color, ".regular-font", "color");
    colorize(listing_info.primary_color, "h1,h2,h3", "color");
    colorize(listing_info.tertiary_color, ".is-info", "color");
    colorize(listing_info.secondary_color, ".is-accent", "color");
    colorize(listing_info.secondary_color, ".is-accent.button", "background-color");
}

//set up default DH colors
function setupDefaultColors(){
    colorize(primaryColor, ".tag", "background-color");
}
