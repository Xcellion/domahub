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
            var beta_submit = $(".beta-submit");
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
});
