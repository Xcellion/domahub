$(document).ready(function() {

    //scroll to specific part of page depending on which side link you pressed
    $(".setting-link").click(function(e){
        temp_id = $(this).attr("id");
        console.log($("#" + temp_id.substr(0, temp_id.length - 5)));
        $("html, body").stop().animate({
            scrollTop: $("#" + temp_id.substr(0, temp_id.length - 5)).offset().top - 70
        }, "fast");
    })
});
