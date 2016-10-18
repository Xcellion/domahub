$(document).ready(function() {

    //section 1 - basic vs premium
    $(".box").click(function() {
        $(".box").removeClass("is-active");
        $(this).addClass("is-active");
        $("#next-button").removeClass("is-disabled");

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
            $("#next-button").removeClass("is-disabled");

            //update the listing preview
            $("#preview_domain").text($("#sing-domain").val());
            $("#preview_description").text($("#sing-description").val());
        }
        else {
            $("#next-button").addClass("is-disabled");
        }
    });

    //if theres an error in getting the image, remove the link
    $("#preview_image").error(function() {
        $(this).attr("src", "https://source.unsplash.com/category/people");
    });

    //section 3 - categories
    $(".cat-checkbox-label, .cat-checkbox").on("click", function(e){
        if ($('.cat-checkbox:checkbox:checked').length > 0){
            $("#next-button").removeClass("is-disabled");
        }
        else {
            $("#next-button").addClass("is-disabled");
        }
    });

    //next/prev button for sections
    $(".next-button").click(function() {
        var current_section = $(".current-section");
        var next_section = $(".current-section").next(".section");
        changePage(current_section, next_section, false);
    });

    //previous button for sections
    $(".prev-button").click(function() {
        var current_section = $(".current-section");
        var prev_section = $(".current-section").prev(".section");
        changePage(current_section, prev_section, true);
    });

    //submit button
    $("#submit-button").click(function(e){

    });

    //more info tooltips
    $(".fa-question-circle-o").click(function(e){
        console.log("more info pls");
    });

});

//function to change pages and add disabled to buttons
function changePage(current_page, upcoming_page, prev){
    //skip the price page if its a basic listing
    if (upcoming_page.data("pageskip") == true){
        upcoming_page = (prev) ? upcoming_page.prev(".section") : upcoming_page.next(".section");
    }

    var nextpagenum = upcoming_page.data('pagenum');

    //first page, disable previous
    if (nextpagenum == 1){
        $("#prev-button").addClass("is-disabled");
    }
    else if (nextpagenum != 4){
        $("#next-button").addClass("is-disabled");
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
