// get the value of the bottom of the #main element by adding the offset of that element plus its height, set it as a variable
var landingBottom = $('#landing').offset().top + $('#landing').height();
var landingMiddle = $('#landing').offset().top + $(window).height() - ($('#landing').height() / 2);
// on scroll,
$(window).on('scroll',function(){

    // we round here to reduce a little workload
    stop = Math.round($(window).scrollTop());
    if (stop > landingBottom) {
        $('#navbar').addClass('past-landing');
        $('.search_icon').addClass('past-landing');
        $('#navbar').removeClass('past-middle');
        $('.search_icon').removeClass('past-middle');
        $(':input').css('color','#eeeeee');
    } else if (stop > landingMiddle && stop < landingBottom) {
        $('#navbar').addClass('past-middle');
        $('.search_icon').addClass('past-middle');
        $(':input').css('color','#eeeeee');
    }
    else {
        $('#navbar').removeClass('past-landing');
        $('.search_icon').removeClass('past-landing');
        $('#navbar').removeClass('past-middle');
        $('.search_icon').removeClass('past-middle');
        $(':input').css('color','#525255');
   }

});
