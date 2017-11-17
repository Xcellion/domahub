$(document).ready(function() {
    $("#gs-choice-rent").click(function(e){
        $("#gs1").addClass("is-hidden");
        $("#gs2").removeClass("is-hidden");
    });

    $(".gsb").click(function() {
        $(this).toggleClass("is-active");
    });

    $(".next").click(function() {
        var current_section = $(".current-section");
        $(".content-section").addClass("is-hidden").fadeOut("slow");
        current_section.next(".content-section").removeClass("is-hidden").addClass("current-section").fadeIn("slow");
        current_section.removeClass('current-section');
    });
});
