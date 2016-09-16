$(document).ready(function() {
    $('.index-link').hover(function() {
        $(this).next().toggleClass('active');
    });

    //right and left ticker arrows
    $(".ticker-icon").click(function(e){
        if ($(this).attr("id") == "ticker-left"){
            $('.ticker-wrapper').slick('slickPrev');
        }
        else {
            $('.ticker-wrapper').slick('slickNext');
        }
    });

    $('.ticker-wrapper').slick({
        dots: true,
        arrows: false,
        autoplay: true,
        autoplaySpeed: 4000
    });

});
