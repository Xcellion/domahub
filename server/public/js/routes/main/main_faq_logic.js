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
    });

    //if you came direct to url with a hash
    if (["#about", "#renting", "#selling", "#payments", "#communicating", "#contracts"].indexOf(window.location.hash) != -1){
        $(window.location.hash + "-menu").click();
    }

});
