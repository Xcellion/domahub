$(document).ready(function() {

    //slider dropdown
    $(".slider-box").on("click", function() {
        var slider_box = $(this);
        var slider_content = slider_box.find(".slider-content");
        slider_box.find(".slider-icon").toggleClass('is-active');

        $(".slider-text").finish();
        var hidden_content = slider_content.find(".slider-text:hidden");
        slider_content.find(".slider-text:visible").finish().fadeToggle(200, "linear", function(){
            hidden_content.finish().fadeToggle(200, "linear");
            slider_box.find(".slider-arrow .icon .fa").toggleClass('fa-rotate-90');
        });
    });

    //prevents stripe/faq links from triggering dropdown
    $(".slider-no-trigger").on("click", function(e){
        e.stopPropagation();
    });

    //two button scroll
    $("#have_domains_button, #learn_more_wrapper").on("click", function(){
        $('html, body').stop().animate({
            scrollTop: $("#have_domains_section").offset().top - $("#navbar").height()
        }, 500);
    });
    $("#want_domains_button").on("click", function(){
        $('html, body').stop().animate({
            scrollTop: $("#want_domains_section").offset().top - $("#navbar").height()
        }, 500);
    });

    //fade in learn more
    $('#learn_more_text').stop().animate({
        opacity: 1
    }, 3000);

    //click to chat with us
    $('#chat_with_us_button').on("click", function(){
        Intercom("show");
    });

});
