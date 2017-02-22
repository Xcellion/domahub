$(document).ready(function() {

    //slider dropdown
    $(".slider-icon, .slider-learn").on("click", function() {
        var slider_item = $(this).closest(".slider-item");
        $(".slider-text").finish();
        var hidden_content = slider_item.find(".slider-text:hidden");
        slider_item.find(".slider-text:visible").finish().fadeToggle(200, "linear", function(){
            hidden_content.finish().fadeToggle(200, "linear");
            slider_item.find(".slider-icon .icon .fa").toggleClass('fa-rotate-90');
        });
    });

    //two button scroll
    $("#have_domains_button").on("click", function(){
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
