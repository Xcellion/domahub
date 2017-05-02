$(document).ready(function(){
    createEarningsRows();
});

var number_format = wNumb({
    thousand: ',',
    prefix: '$',
    decimals: 2,
    postfix: " " + user.stripe_info.currency.toUpperCase()
});
var total_earnings = 0;

//function to create all earnings rows
function createEarningsRows(){
    if (user.stripe_charges.length > 0){
        $("#no-earnings-row").addClass('is-hidden');
        for (var x = 0; x < user.stripe_charges.length; x++){
            $(".earnings-table").append(createEarningsRow(user.stripe_charges[x]));
        }
        $("#total-earnings").text(number_format.to(total_earnings / 100));
    }
}

//function to create a single earnings row
function createEarningsRow(stripe_charge){
    var temp_row = $("#earnings-row-clone").clone();
    temp_row.removeAttr('id').removeClass('is-hidden');

    temp_row.find(".earnings-row-date").text(moment(stripe_charge.created * 1000).format("MMMM DD, YYYY"));
    temp_row.find(".earnings-row-domain").text(stripe_charge.domain_name);
    temp_row.find(".earnings-row-preview-button").attr("href", "/listing/" + stripe_charge.domain_name + "/" + stripe_charge.rental_id);

    var doma_fees = Math.round(stripe_charge.amount * 0.18);
    var stripe_fees = Math.round(stripe_charge.amount * 0.029) + 30;
    var earnings = stripe_charge.amount - doma_fees - stripe_fees;
    total_earnings += earnings;

    //was refunded completely
    if (stripe_charge.amount == stripe_charge.amount_refunded){
        refundedRow(temp_row);
    }
    else {
        temp_row.find(".earnings-row-amount").text(number_format.to(stripe_charge.amount / 100));
        temp_row.find(".earnings-row-fees").text(number_format.to((doma_fees + stripe_fees) / 100));
        temp_row.find(".earnings-row-profit").text(number_format.to(earnings / 100));

        //refund button
        temp_row.find(".earnings-row-refund-button").on("click", function(){
            $(this).off();
            $(this).addClass("is-loading");
            $.ajax({
                url: "/listing/" + stripe_charge.domain_name + "/" + stripe_charge.rental_id + "/refund",
                method: "POST",
                data: {
                    stripe_id : stripe_charge.id
                }
            }).done(function(data){
                if (data.state == "success"){
                    refundedRow(temp_row);
                    $(this).removeClass("is-loading");
                }
                else {
                    flashError($("#transaction-message"), data.message);
                    $(this).removeClass("is-loading");
                }
            });
        });
    }


    return temp_row;
}

//function when a charge is refunded
function refundedRow(row){
    row.find(".earnings-row-amount").text("Refunded");
    row.find(".earnings-row-profit").text("Refunded");
    row.find(".earnings-row-fees").text("Refunded");
    row.find(".earnings-row-refund-button").remove();
}
