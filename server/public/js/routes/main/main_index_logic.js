$(document).ready(function() {

    //slider dropdown
    $(".slider-item").on("click", function() {
        //remove all active from other slider-items
        $(".slider-item").not(this).removeClass('is-active');

        //give only clicked on slider-item active class
        $(this).toggleClass('is-active');

        //toggle the slide for clicked on slide-dropdown
        $(this).next(".slider-item-dropdown").stop().slideToggle(300, function(){
            $(this).addClass('is-active');
        }).siblings(".slider-item-dropdown").stop().slideUp(300, function(){
            $(this).removeClass('is-active');
        });
    });

    //notification pop-up delay
    $("#welcome").addClass("is-active").delay(4000).queue(function(){
        $(this).removeClass("is-active");
    });

});
