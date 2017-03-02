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
    $("#learn-more-button").on("click", function(){
        $('html, body').stop().animate({
            scrollTop: $("#decision-section").offset().top - $("#navbar").height()
        }, 500);
    });
    $("#want-domains-button").on("click", function(){
        $('html, body').stop().animate({
            scrollTop: $("#want-domains-section").offset().top - $("#navbar").height()
        }, 500);
    });
    $("#have-domains-tab").on("click", function(){
        $(".d-owner").removeClass("is-hidden");
        $(".d-renter").addClass("is-hidden");
        $(this).addClass("is-active");
        $("#want-domains-tab").removeClass("is-active");
    })
    $("#want-domains-tab").on("click", function(){
        $(".d-renter").removeClass("is-hidden");
        $(".d-owner").addClass("is-hidden");
        $(this).addClass("is-active");
        $("#have-domains-tab").removeClass("is-active");
    })

    //fade in learn more
    $('#learn-more-text').stop().animate({
        opacity: 1
    }, 3000);

    //click to chat with us
    $('#chat-with-us-button').on("click", function(){
        Intercom("show");
    });

});
