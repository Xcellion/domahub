$(document).ready(function(){
  createEarningsRows();
});

var number_format = wNumb({
  thousand: ',',
  prefix: '$',
  decimals: 2,
  postfix: " " + user.stripe_info.currency.toUpperCase()
});
var total_profit = 0;
var total_fees = 0;
var total_earnings = 0;

//function to create all earnings rows
function createEarningsRows(){
  if (user.stripe_charges.length > 0){
    $("#no-earnings-row").addClass('is-hidden');
    for (var x = 0; x < user.stripe_charges.length; x++){
      $(".earnings-table").append(createEarningsRow(user.stripe_charges[x]));
    }

    //totals
    $("#total-earnings").text(number_format.to(total_earnings / 100));
    $("#total-profit").text(number_format.to(total_profit / 100));
    $("#total-fees").text(number_format.to(total_fees / 100));
  }
}

//function to create a single earnings row
function createEarningsRow(stripe_charge){
  var temp_row = $("#earnings-row-clone").clone();
  temp_row.removeAttr('id').removeClass('is-hidden');

  if (stripe_charge.rental_id){
    temp_row.find(".earnings-row-type").append("<a class='is-primary' target='_blank' href='/listing/" + stripe_charge.domain_name + "/" + stripe_charge.rental_id + "'><span>Rental</span>\
    <span class='icon is-small is-tooltip v-align-bottom' data-balloon-length='medium' data-balloon='Click to preview this rental.' data-balloon-pos='up'> \
      <i class='fa fa-eye'></i> \
    </span></a>");
  }
  else {
    temp_row.find(".earnings-row-type").text("Sale");
  }
  temp_row.find(".earnings-row-date").text(moment(stripe_charge.created * 1000).format("MMMM DD, YYYY"));
  temp_row.find(".earnings-row-domain").text(stripe_charge.domain_name);

  //calculate fees and profit
  var doma_fees = (stripe_charge.doma_fees) ? parseFloat(stripe_charge.doma_fees) : Math.round(stripe_charge.amount * 0.10);
  var stripe_fees = (stripe_charge.stripe_fees) ? parseFloat(stripe_charge.stripe_fees) : Math.round(stripe_charge.amount * 0.029) + 30;
  var profit = stripe_charge.amount - doma_fees - stripe_fees;

  //was refunded completely
  if (stripe_charge.amount == stripe_charge.amount_refunded){
    refundedRow(temp_row);
  }
  else {
    total_profit += profit;
    total_fees += doma_fees + stripe_fees;
    total_earnings += stripe_charge.amount;

    temp_row.find(".earnings-row-amount").text(number_format.to(stripe_charge.amount / 100));
    temp_row.find(".earnings-row-fees").text(number_format.to((doma_fees + stripe_fees) / 100));
    temp_row.find(".earnings-row-profit").text(number_format.to(profit / 100));

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
