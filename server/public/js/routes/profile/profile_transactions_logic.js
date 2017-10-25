$(document).ready(function(){
  createEarningsRows();

  //transfer to bank button
  $("#transfer-button").on('click', function(){
    $("#transfer-button").addClass('is-loading').off();
    $.ajax({
      url: "/profile/transfer",
      method: "POST"
    }).done(function(data){
      $("#transfer-button").removeClass('is-loading');
      console.log(data);

      if (data.state == "success"){
        $("#transfer-button").addClass("is-disabled");
        successMessage("Successfully transferred " + number_format.to(total_available) + " to your bank account!");
      }
      else {
        switch (data.message){
          case ("Invalid charges!"):
          errorMessage("Something went wrong with the transfer! Please refresh the page and try again.");
          break;
          case ("No bank account to charge"):
          errorMessage("You need to add a valid bank account to your DomaHub account to be able to withdraw money!");
          break;
          default:
          errorMessage(data.message);
          break;
        }
      }
    });
  });

});

//<editor-fold>--------------------------------------------------HISTORY--------------------------------------

var number_format = wNumb({
  thousand: ',',
  prefix: '$',
  decimals: 2,
  postfix: " " + (user.stripe_info) ? user.stripe_info.currency.toUpperCase() : " "
});
var total_profit = 0;
var total_fees = 0;
var total_earnings = 0;

//withdrawal
var total_pending = 0;
var total_unavailable = 0;
var total_available = 0;

//function to create all earnings rows
function createEarningsRows(){
  if (user.stripe_charges.length > 0){
    $("#no-earnings-row").addClass('is-hidden');
    for (var x = 0; x < user.stripe_charges.length; x++){
      $(".earnings-table").append(createEarningsRow(user.stripe_charges[x]));
    }

    calculateTotals();
  }
}

//function to create a single earnings row
function createEarningsRow(stripe_charge){
  var temp_row = $("#earnings-row-clone").clone();
  temp_row.removeAttr('id').removeClass('is-hidden');

  //rental row
  if (stripe_charge.rental_id){
    temp_row.find(".earnings-row-type").append("<a class='is-primary' target='_blank' href='/listing/" + stripe_charge.domain_name + "/" + stripe_charge.rental_id + "'><span>Domain Rental</span>\
    <span class='icon is-small is-tooltip v-align-bottom' data-balloon-length='medium' data-balloon='Click to preview this rental.' data-balloon-pos='up'> \
    <i class='fa fa-eye'></i> \
    </span></a>");
  }
  //domain sales row
  else {
    temp_row.find(".earnings-row-type").text("Domain Sale");
  }

  //all other row info
  temp_row.find(".earnings-row-date").text(moment(stripe_charge.created * 1000).format("MMM DD, YYYY"));
  temp_row.find(".earnings-row-available").text(moment(stripe_charge.available_on * 1000).format("MMM DD, YYYY"));
  temp_row.find(".earnings-row-domain").text(stripe_charge.domain_name);

  //was refunded completely
  if (stripe_charge.amount == stripe_charge.amount_refunded){
    refundedRow(temp_row);
  }
  else {
    //calculate fees and profit
    var doma_fees = (stripe_charge.doma_fees) ? parseFloat(stripe_charge.doma_fees) : Math.round(stripe_charge.amount * 0.10);
    var stripe_fees = (stripe_charge.stripe_fees) ? parseFloat(stripe_charge.stripe_fees) : Math.round(stripe_charge.amount * 0.029) + 30;
    var profit = stripe_charge.amount - doma_fees - stripe_fees;

    //still needs to transfer the domain before you can withdraw the money
    if (stripe_charge.pending_transfer){
      total_unavailable += profit;
    }
    //balance available for withdrawal now
    else if (stripe_charge.available_on * 1000 < new Date().getTime()){
      total_available += profit;
    }
    //balance not yet available
    else if (stripe_charge.available_on * 1000 > new Date().getTime()){
      total_pending += profit
    }

    total_profit += profit;
    total_fees += doma_fees + stripe_fees;
    total_earnings += stripe_charge.amount;

    //money related columns
    temp_row.find(".earnings-row-amount").text(number_format.to(stripe_charge.amount / 100));
    temp_row.find(".earnings-row-fees").text(number_format.to((doma_fees + stripe_fees) / 100));
    temp_row.find(".earnings-row-profit").text(number_format.to(profit / 100));

    //refund button for rentals
    if (stripe_charge.rental_id){
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
            refundedRow(temp_row, true, profit, doma_fees, stripe_fees, stripe_charge.amount, stripe_charge.available_on)
            calculateTotals();
          }
          else {
            errorMessage(data.message);
          }
        });
      });
    }
    //check if domain was transferred
    else {
      temp_row.find(".earnings-row-refund-button").addClass('is-hidden');
      temp_row.find(".earnings-row-buttons").html("<span class='is-danger'>Pending Transfer</span>\
      <span class='icon is-small is-tooltip v-align-bottom' data-balloon-length='large' data-balloon='You must first manually transfer the ownership of this domain before you can access these funds.' data-balloon-pos='up'> \
      <i class='fa fa-question-circle'></i> \
      </span>");
    }
  }

  return temp_row;
}

//function when a charge is refunded
function refundedRow(row, subtract, profit, doma_fees, stripe_fees, amount, available_on){
  row.find(".earnings-row-amount").text("Refunded");
  row.find(".earnings-row-profit").text("Refunded");
  row.find(".earnings-row-fees").text("Refunded");
  row.find(".earnings-row-refund-button").remove();

  //subtract from totals
  if (subtract){
    total_profit -= profit;
    total_fees -= doma_fees + stripe_fees;
    total_earnings -= amount;
    if (available_on * 1000 < new Date().getTime()){
      total_available -= profit;
    }
    else {
      total_pending -= profit
    }
  }

}

//function to re-calculate totals
function calculateTotals(){
  //totals
  $("#total-earnings").text(number_format.to(total_earnings / 100));
  $("#total-profit").text(number_format.to(total_profit / 100));
  $("#total-fees").text(number_format.to(total_fees / 100));

  //withdrawals
  $(".withdrawal-available").text(number_format.to(total_available / 100));
  $("#withdrawal-pending").text(number_format.to(total_pending / 100));
  $("#withdrawal-unavailable").text(number_format.to(total_unavailable / 100));

  //if there are funds available and a bank to withdraw to
  if (total_available > 0 && user.stripe_account && user.stripe_info){
    $("#transfer-button").removeClass('is-disabled');
  }
  else {
    $("#transfer-button").addClass('is-disabled');
  }
}

//</editor-fold>
