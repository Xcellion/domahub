$(document).ready(function() {

    $(".beta-submit").on("click", function(e){
        e.preventDefault();
        $(this).closest(".beta-form").submit();
    });

    //hide error
    $(".betaemail").on("keypress", function(e){
        $(".beta-normal-message").removeClass('is-hidden');
        $(".beta-error-message").addClass('is-hidden');
    });

    //submit the beta email
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
                    beta_form.next(".beta-form-success").removeClass("is-hidden");
                    $(".beta-success-message").removeClass("is-hidden");
                    $(".beta-normal-message").addClass('is-hidden');
                }
                else {
                    $(".beta-error-message").removeClass('is-hidden');
                    $(".beta-normal-message").addClass('is-hidden');
                }
            });
        }
    });
});
