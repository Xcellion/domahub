$(document).ready(function() {
    $("#beta-form-submit").click(function(e){
        $('#beta-form').submit();
    })

    $('#beta-form').submit(function(e){
        e.preventDefault();

        $('#beta-form-submit').addClass("is-loading");

        $.ajax({
            type: "POST",
            url: "/beta",
            data: {
                betaemail: $('#beta-form-email').val()
            }
        }).done(function(data){
            $('#beta-form').addClass("is-hidden");
            $('#beta-form-success').removeClass("is-hidden");
        });
    })
});
