// get the value of the bottom of the #main element by adding the offset of that element plus its height, set it as a variable
var landingBottom = $('#landing').offset().top + $('#landing').height();

// on scroll,
$(window).on('scroll',function(){

    // we round here to reduce a little workload
    stop = Math.round($(window).scrollTop());
    if (stop > landingBottom) {
        $('#navbar').addClass('past-landing');
        $('.search_icon').addClass('past-landing');
        $(':input').css('color','#eeeeee');
    } else {
        $('#navbar').removeClass('past-landing');
        $('.search_icon').removeClass('past-landing');
        $(':input').css('color','#525255');
   }

});
