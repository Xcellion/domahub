$(document).ready(function() {

    calculateEarnings();

    $(".earnings-input").on('change keyup paste mousewheel',function(e){
        calculateEarnings();
    });

});

//function to calculate the earnings potential
function calculateEarnings(){

    var totalPrice = $("#num-domains-value").val() * $("#time-value").val() * $("#price-value").val();
    var commas = totalPrice

    //animation for counting numbers
    $("#earnings-potential").prop('Counter', $("#earnings-potential").prop('Counter')).stop().animate({
        Counter: totalPrice
    }, {
        duration: 100,
        easing: 'swing',
        step: function (now) {
            commas = Math.floor(now).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            $(this).text("$" + commas);
        }
    });
}
