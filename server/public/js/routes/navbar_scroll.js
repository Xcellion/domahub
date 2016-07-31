// change link color to white if at index
var is_index = (window.location.pathname);
if (is_index == "/") {
  $('.nav_link').css('color', '#eeeeee');
}

// get the value of the bottom of the #main element by adding the offset of that element plus its height, set it as a variable
var offset = $('#landing').offset().top;
var landingHeight = $('#landing').height();
var landingBottom = offset + landingHeight;

$(window).on('scroll',function(){

    // we round here to reduce a little workload
    stop = Math.round($(window).scrollTop());
    if (stop > landingBottom) {
        $('#navbar').addClass('past-landing');
        $('.search_icon').addClass('past-landing');
        $("input[name='q']").css('color','#eeeeee');
    }
    else {
        $('#navbar').removeClass('past-landing');
        $('.search_icon').removeClass('past-landing');
        $("input[name='q']").css('color','#525255');
   }

});
