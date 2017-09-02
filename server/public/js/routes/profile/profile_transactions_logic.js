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

  if (stripe_charge.rental_id){
    temp_row.find(".earnings-row-type").append("<a class='is-primary' href='/listing/" + stripe_charge.domain_name + "/" + stripe_charge.rental_id + "'>Rental</a>");
  }
  else {
    temp_row.find(".earnings-row-type").text("Sale");
  }
  temp_row.find(".earnings-row-date").text(moment(stripe_charge.created * 1000).format("MMMM DD, YYYY"));
  temp_row.find(".earnings-row-domain").text(stripe_charge.domain_name);

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

    if (stripe_charge.rental_id){
      //refund button for rentals
      temp_row.find(".earnings-row-refund-button").on("click", function(){
        var refund_button = $(this);
        refund_button.off().addClass("is-loading");
        $.ajax({
          url: "/listing/" + stripe_charge.domain_name + "/" + stripe_charge.rental_id + "/refund",
          method: "POST",
          data: {
            stripe_id : stripe_charge.charge_id
          }
        }).done(function(data){
          refund_button.removeClass("is-loading");
          if (data.state == "success"){
            refundedRow(temp_row);
          }
          else {
            flashError($("#transaction-message"), data.message);
          }
        });
      });
    }
    else {
      temp_row.find(".earnings-row-refund-button").addClass('is-hidden');
    }
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
