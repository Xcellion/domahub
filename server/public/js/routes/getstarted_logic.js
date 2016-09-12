$(document).ready(function() {
    $(".selection").click(function(e){
        $(this).parents(".section").addClass("is-hidden");
        $(this).parents(".section").next(".section").removeClass("is-hidden");
    })

});
