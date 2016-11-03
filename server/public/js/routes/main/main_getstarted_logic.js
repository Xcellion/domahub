$(document).ready(function() {
    $("#gs-choice-rent").click(function(e){
        $("#gs1").addClass("is-hidden");
        $("#gs2").removeClass("is-hidden");
    });

    $(".gsb").click(function() {
        $(this).toggleClass("is-active");
    });

    $(".next").click(function() {
        $(this).parents(".column").addClass("is-hidden").fadeOut("slow");
        $(this).parents(".column").next(".column").removeClass("is-hidden").fadeIn("slow");
    });
});
