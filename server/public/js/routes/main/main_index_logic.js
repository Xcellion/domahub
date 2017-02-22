$(document).ready(function() {

    //slider dropdown
    $(".slider-icon, .slider-learn, .slider-arrow").on("click", function() {
        var slider_content = $(this).closest(".slider-content");
        var slider_box = $(this).closest(".slider-box");

        // if ($(this) == ".slider-icon") {
        //   $(this).toggleClass('is-active');
        // }

        $(".slider-text").finish();
        var hidden_content = slider_content.find(".slider-text:hidden");
        slider_content.find(".slider-text:visible").finish().fadeToggle(200, "linear", function(){
            hidden_content.finish().fadeToggle(200, "linear");
            slider_box.find(".slider-arrow .icon .fa").toggleClass('fa-rotate-90');
        });
    });

    //two button scroll
    $("#have_domains_button").on("click", function(){
        $('html, body').stop().animate({
            scrollTop: $("#have_domains_section").offset().top
        }, 500);
    });
    $("#want_domains_button").on("click", function(){
        $('html, body').stop().animate({
            scrollTop: $("#want_domains_section").offset().top
        }, 500);
    });

    //fade in learn more
    $('#learn_more_text').stop().animate({
        opacity: 1
    }, 3000);

});
