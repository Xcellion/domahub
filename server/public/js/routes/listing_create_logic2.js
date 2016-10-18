$(document).ready(function() {

    //section 1 - basic vs premium
    $(".box").click(function() {
        $(".box").removeClass("is-active");

        //set the data of the section so we can go next
        $(this).closest('.current-section').data("can-next", true);

        if ($(this).hasClass("is-active")) {
            $(this).removeClass("is-active");
        } else {
            $(this).addClass("is-active");
        }
    });

    //next/prev button for sections
    $(".next-button").click(function() {
        var current_section = $(".current-section");
        var next_section = $(".current-section").next(".section");
        changePage(current_section, next_section);
    });

    //previous button for sections
    $(".prev-button").click(function() {
        var current_section = $(".current-section");
        var prev_section = $(".current-section").prev(".section");
        changePage(current_section, prev_section, true);
    });

    //more info tooltips
    $(".fa-question-circle-o").hover(function(e){
        console.log("more info pls");
    });

});

//function to change pages and add disabled to buttons
function changePage(current_page, upcoming_page, bool){
    if (canNext(current_page) == true || bool){
        if (upcoming_page.data('num') == "1"){
            $("#prev-button").addClass("is-disabled");
        }
        else if (upcoming_page.data('num') == "5"){
            $("#next-button").addClass("is-disabled");
        }
        else {
            $("#prev-button, #next-button").removeClass("is-disabled");
        }

        current_page.addClass("is-hidden").removeClass("current-section");
        upcoming_page.addClass("current-section").removeClass("is-hidden");
    }
}

//function to check if we can go next
function canNext(current_page){
    var bool = true;
    switch (current_page.data('pagenum')){
        case 1:
            if (current_page.data("can-next") != true){
                bool = false;
                current_page.find(".error-heading").text("You must select a listing type!").addClass('is-danger');
            }
            else {
                current_page.find(".error-heading").text("Please select one of the options below").removeClass('is-danger');
            }
            break;
        case 2:
            if ($("#sing-domain").val() == ""){
                bool = false;
                $("#domain-error-message").text("You must enter a domain name!").addClass("is-danger");
                $("#description-error-message").text("Description").removeClass("is-danger");
            }
            else if ($("#sing-description").val() == ""){
                bool = false;
                $("#domain-error-message").text("Domain Name").removeClass("is-danger");
                $("#description-error-message").text("You must enter a description!").addClass("is-danger");
            }
            else {
                $("#domain-error-message").text("Domain Name").removeClass("is-danger");
                $("#description-error-message").text("Description").removeClass("is-danger");
            }
            break;
        case 3:
            break;
        case 4:
            break;
        case 5:
            break;
    }
    return bool;
}
