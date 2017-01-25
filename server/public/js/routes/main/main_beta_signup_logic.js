$(document).ready(function() {
    $(".beta-submit").click(function(e){
        e.preventDefault();
        $(this).closest(".beta-form").submit();
    });

    $('.beta-form').submit(function(e){
        e.preventDefault();

        var beta_email = $(this).find(".input").val();
        var beta_form = $(this);
        if (beta_email){
            var beta_submit = $(this).find(".beta-submit");
            beta_submit.addClass("is-loading");
            $.ajax({
                type: "POST",
                url: "/beta",
                data: {
                    betaemail: beta_email
                }
            }).done(function(data){
                beta_submit.removeClass("is-loading");
                if (data.state == "success"){
                    beta_form.addClass("is-hidden");
                    beta_form.next().removeClass("is-hidden");
                }
            });
        }
    });

    //slider dropdown
    $(".slider-item").on("click", function() {
        //remove all active from other slider-items
        $(".slider-item").not(this).removeClass('is-active');

        //give only clicked on slider-item active class
        $(this).toggleClass('is-active');

        //toggle the slide for clicked on slide-dropdown
        $(this).next(".slider-item-dropdown").stop().slideToggle(300, function(){
            $(this).addClass('is-active');
        }).siblings(".slider-item-dropdown").stop().slideUp(300, function(){
            $(this).removeClass('is-active');
        });
    });

});
