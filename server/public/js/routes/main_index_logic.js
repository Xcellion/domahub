$(document).ready(function() {
    // $('.index-link').hover(function() {
    //     $(this).next().find('.right-arrow').toggleClass('active');
    // });

    //right and left ticker arrows
    // $(".carousel-icon").click(function(e){
    //     if ($(this).hasClass("left")){
    //         $('.carousel-wrapper').slick('slickPrev');
    //     }
    //     else {
    //         $('.carousel-wrapper').slick('slickNext');
    //     }
    // });

    //slick carousel
    $('.carousel-wrapper').slick({
        dots: true,
        arrows: false,
        autoplay: true,
        autoplaySpeed: 4000,
        pauseOnFocus: false
    });

});
