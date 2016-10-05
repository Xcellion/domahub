$(document).ready(function() {
    $("#gs-choice-rent").click(function(e){
        $("#gs1").addClass("is-hidden");
        $("#gs2").removeClass("is-hidden");
    });

    $(".gsb").click(function() {
        $(this).toggleClass("is-active");
    });

    $(".next-button").click(function() {
        $(this).parents(".hero").addClass("is-hidden");
        $(this).parents(".hero").next(".hero").removeClass("is-hidden");
    });
});
