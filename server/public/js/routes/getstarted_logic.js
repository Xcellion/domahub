$(document).ready(function() {
    $(".box").click(function(e){
        $(this).parents(".section").addClass("is-hidden");
        $(this).parents(".section").next(".section").removeClass("is-hidden");
    })

});
