$(document).ready(function() {

    //toggle X
    $(".faq-header").click(function() {
        $(this).toggleClass("is-active");
        $(this).siblings(".qa-wrapper").toggleClass("is-hidden");
    });

    //toggle is-active on left panel
    $(".menu-link").click(function(){
        $(".menu-link").removeClass("is-active");
        $(this).addClass("is-active");
        var faq_id = $(this).attr("id").split("-")[0];
        $("#" + faq_id).find(".faq-header").removeClass("is-active");
        $("#" + faq_id).find(".qa-wrapper").removeClass("is-hidden");
    });

    //if you came direct to url with a hash
    if (["#about", "#renting", "#selling", "#payments", "#communicating", "#contracts"].indexOf(window.location.hash) != -1){
        $(window.location.hash + "-menu").click();
    }

});
