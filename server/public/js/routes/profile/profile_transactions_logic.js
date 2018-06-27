//resize marquee
$(window).resize(function(){
  updateMarqueeHandlers($(".transactions-row-domain.sort-by-domain_name"));
});

$(document).ready(function() {

  //<editor-fold>-------------------------------SET UP TRANSACTIONS-------------------------------

  //get transactions if we dont have it already
  if (!user.transactions || !user.transactions_remote){
    getTransactions();
  }
  else {
    createTransactionsTable();
  }

  //show withdrawal modal
  $("#transfer-button").on("click", function(){
    setupWithdrawModal();
  });

  //withdrawal to account
  $("#withdrawal-modal-form").on("submit", function(e){
    e.preventDefault();
    withdrawMoney();
  });

  //refresh transactions
  $("#refresh-transactions-button").on("click", function(){
    getTransactions();
  });

  //show free transactions
  $("#show-free-transactions").data("toggled", false).on("click", function(){
    toggleFreeTransactionsButton(!$("#show-free-transactions").data("toggled"));
    showTransactionRows();
  });

  //show specific transactions only (search)
  $("#transactions-search").on("input", function(){
    showTransactionRows();
  });

  //show specific transactions only (filter)
  $("#transactions-filter-select").on("change", function(){
    if ($(this).val() == "free"){
      toggleFreeTransactionsButton(true);
    }
    else {
      toggleFreeTransactionsButton(false);
    }
    showTransactionRows();
  });

  //sort transactions
  $(".transaction-header-sort").on("click", function(){
    var sort_value = $(this).data("value");
    var sort_direction = ($(".transaction-header-sort").find(".icon").data("sort_direction")) ? true : false;

    $(".transaction-header-sort").find(".icon").removeClass("is-primary");
    $(".listing-header-sort").find("svg").attr("data-icon", "sort");

    //add sort to this column
    $(this).find(".icon").addClass('is-primary');
    $(".transaction-header-sort").find(".icon").data("sort_direction", !sort_direction).find(".fa").addClass()
    if (sort_direction){
      $(this).find("svg").attr("data-icon", "sort-up");
    }
    else {
      $(this).find("svg").attr("data-icon", "sort-down");
    }
    showTransactionRows();
  });

  //</editor-fold>

});

//<editor-fold>-------------------------------TRANSACTIONS TAB-------------------------------

  //<editor-fold>-------------------------------CREATE ROWS-------------------------------

  //get transactions
  function getTransactions(){

    //show loading stuff
    $("#loading-transactions-table, #loading-transactions-card").removeClass('is-hidden');
    $("#no-transactions-table, #transactions-table").addClass('is-hidden');
    $(".total-loading").removeClass("is-danger").text("Loading...");
    $("span.withdrawal-available").text("");
    $("#refresh-transactions-button").addClass("is-loading");
    $("#transactions-toolbar").addClass("is-hidden");
    $("#card-image-text").text("Now loading...")

    $.ajax({
      url: "/profile/gettransactions",
      method: "POST"
    }).done(function(data){

      //remove loading stuff
      $("#transactions-toolbar").removeClass("is-hidden");
      $("#refresh-transactions-button").removeClass("is-loading");

      if (data.state == "success"){
        if (data.user){
          user = data.user;
        }
      }
      else {
        errorMessage(data.message);
      }
      createTransactionsTable();
    });
  }

  //create all transactions rows
  function createTransactionsTable(){

    //hide modal
    $("#transactions-details-modal").removeClass('is-active');
    $("#loading-transactions-table, #loading-transactions-card").addClass('is-hidden');
    $("#transactions-toolbar").removeClass('is-hidden');
    $("#card-image-text").text("Click a transaction for more details!")

    $(".transactions-row:not(#transactions-row-clone)").remove();

    //transactions rows
    if (user.transactions){
      for (var x = 0; x < user.transactions.length; x++){
        $("#transactions-table-body").append(createTransactionsRow(user.transactions[x], x));
      }

      //show transactions table and total transactions
      calculateTotals();
      showTransactionRows();

      //if any visible
      if ($(".transactions-row:not(.is-hidden)").length > 0){
        $("#transactions-table").removeClass("is-hidden");
        $("#no-transactions-table").addClass("is-hidden");
      }
      else {
        $("#transactions-table").addClass("is-hidden");
        $("#no-transactions-table").removeClass("is-hidden");
      }

      $(document).ready(function () {
        updateMarqueeHandlers($(".transactions-row-domain.sort-by-domain_name"));
      });

    }
    else {
      $("#transactions-table").addClass("is-hidden");
      $("#no-transactions-table").removeClass("is-hidden");
    }
  }

  //create a single transactions row
  function createTransactionsRow(transaction, rownum){
    var temp_row = $("#transactions-row-clone").clone();
    temp_row.removeAttr('id').removeClass('is-hidden');

    //transactions details modal
    temp_row.on("click", function(){
      setupTransactionsModal(temp_row, transaction);
    });

    //temp row data for search and filter
    temp_row.data("transaction_obj", transaction);
    temp_row.data("domain_name", transaction.domain_name);
    temp_row.data("sale", transaction.transaction_type == "sale");
    temp_row.data("rental", transaction.transaction_type == "rental");
    temp_row.data("expense", transaction.transaction_type == "expense");
    temp_row.data("renewal", transaction.transaction_type == "renewal");
    temp_row.data("exists", true);
    temp_row.data("currency", transaction.transaction_cost_currency);

    //date created, no date if it's a renewal cost but has no registration date
    var date_created_moment = moment(new Date(transaction.date_created));
    if (date_created_moment.isValid()){
      temp_row.find(".transactions-row-date").text(date_created_moment.format("YYYY-MM-DD")).attr("title", date_created_moment.format("YYYY-MM-DD HH:mm"));
    }
    else {
      temp_row.find(".transactions-row-date").text("No date").attr("title", "Please enter a valid registration date for this domain.");
    }

    //all other row info
    temp_row.find(".transactions-row-type").text(transaction.transaction_type.substr(0,1).toUpperCase() + transaction.transaction_type.substr(1));
    var listing_href = (user.stripe_subscription_id) ? "https://" + transaction.domain_name.toLowerCase() : "/listing/" + transaction.domain_name.toLowerCase();
    temp_row.find(".transactions-row-domain").html("<a target='_blank' class='is-underlined' href='" + listing_href + "'>" + punycode.toUnicode(transaction.domain_name) + "</a>");

    //payment type
    if (transaction.payment_type == "paypal"){
      var payment_type_text = "PayPal";
    }
    else if (transaction.payment_type == "stripe"){
      var payment_type_text = "Credit Card";
    }
    else {
      var payment_type_text = "-";
    }
    temp_row.find(".transactions-row-payment").text(payment_type_text);

    //free rental
    if (!transaction.transaction_cost || transaction.transaction_cost == null){
      temp_row.find(".transactions-row-available").text("Free " + transaction.transaction_type.substr(0, 1).toUpperCase() + transaction.transaction_type.substr(1));
      temp_row.find(".transactions-row-amount").text("-");
      temp_row.data("total_revenue", 0);
      temp_row.data("total_fees", 0);
      temp_row.data("total_profit", 0);

      //for filters
      temp_row.data("free", true);
      temp_row.data("available", false);
    }
    //has a price
    else {
      temp_row.data("free", false);

      //profit + fees in money format
      var doma_fees = (transaction.doma_fees) ? transaction.doma_fees : 0;
      var payment_fees = (transaction.payment_fees) ? transaction.payment_fees : 0;

      //totals for prices
      var total_fees = (doma_fees + payment_fees);
      var total_profit = (transaction.transaction_cost) ? ((transaction.transaction_cost - doma_fees - payment_fees)) : 0;
      var total_revenue = (transaction.transaction_cost) ? (transaction.transaction_cost) : 0;

      //refunded
      if (transaction.transaction_cost_refunded > 0){
        temp_row.data("refunded", true);
        temp_row.data("available", false);
        temp_row.find(".transactions-row-available").text("Refunded");

        //price strikethrough (only for stripe)
        if (transaction.payment_type == "stripe"){
          temp_row.find(".transactions-row-amount").text(formatCurrency(total_profit, transaction.transaction_cost_currency)).addClass("text-line-through");
        }
        else if (transaction.payment_type == "paypal"){
          temp_row.find(".transactions-row-amount").text(formatCurrency(transaction.paypal_fee, user.default_currency)).addClass('is-danger');
        }

        //for calculating totals later
        temp_row.data("total_revenue", 0);
        temp_row.data("total_fees", ((transaction.payment_type == "paypal") ? transaction.paypal_fee : 0));   //paypal doesnt refund flat fee
      }
      //not refunded
      else {

        //expenses or renewal
        if (transaction.transaction_type == "expense" || transaction.transaction_type == "renewal"){
          if (transaction.transaction_type == "expense"){
            temp_row.find(".transactions-row-available").text("Expense Recorded");
          }
          else {
            temp_row.find(".transactions-row-available").text("Domain Renewal");
          }
          temp_row.find(".transactions-row-amount").text(formatCurrency(-total_profit, transaction.transaction_cost_currency)).addClass('is-danger');
          temp_row.data("total_revenue", -total_revenue);
          temp_row.data("total_fees", 0);
        }
        else {

          //for calculating totals later
          temp_row.data("total_revenue", total_revenue);
          temp_row.data("total_fees", total_fees);

          //total earned tooltip hover
          temp_row.find(".transactions-row-amount").text(formatCurrency(total_profit, transaction.transaction_cost_currency)).addClass('is-primary');

          //if we can withdraw from bank
          var payment_available_on = moment(new Date(transaction.payment_available_on));

          //withdrawn already
          //sales or rental made outside of domahub
          if (transaction.listing_status == 4){
            var sale_or_rental_text = transaction.transaction_type.substr(0,1).toUpperCase() + transaction.transaction_type.substr(1);
            temp_row.find(".transactions-row-available").text("Recorded Outside DomaHub").append('<div style="margin-left:3px;" class="bubble-tooltip icon is-small is-tooltip" data-balloon-length="medium" data-balloon="This transaction was recorded for a domain not currently listed with DomaHub." data-balloon-pos="up"><i class="fal fa-question-circle"></i></div>');
            temp_row.find(".transactions-row-amount").removeClass("is-primary");
            temp_row.data("withdrawn", true);
          }
          else if (transaction.withdrawn_on){
            temp_row.find(".transactions-row-available").text("Withdrawn").append('<div class="bubble-tooltip icon is-small is-tooltip" data-balloon-length="medium" data-balloon="Funds withdrawn on ' + moment(new Date(transaction.withdrawn_on)).format("YYYY-MM-DD") + '" data-balloon-pos="up"><i class="fal fa-question-circle"></i></div>');
            temp_row.find(".transactions-row-amount").removeClass("is-primary");
            temp_row.data("withdrawn", true);
          }
          //needs to transfer
          else if (!transaction.available && transaction.transaction_type == "sale"){
            temp_row.find(".transactions-row-available").text("Requires Action").append('<div class="bubble-tooltip icon is-small is-danger" data-balloon-length="medium" data-balloon="Please transfer domain ownership to access these funds!" data-balloon-pos="up"><i class="fal fa-exclamation-circle"></i></div>');
            temp_row.data("notavailable", true);
            temp_row.data("actionable", true);
          }
          //if has a set available date
          else if (payment_available_on.isValid() && payment_available_on.valueOf() > new Date().getTime()){
            temp_row.find(".transactions-row-available").text("Not yet available").append('<div class="bubble-tooltip icon is-small is-danger" data-balloon-length="medium" data-balloon="Available for withdrawal on ' + payment_available_on.format("YYYY-MM-DD") + '!" data-balloon-pos="up"><i class="fal fa-exclamation-circle"></i></div>');
            temp_row.data("notavailable", true);
          }
          //if okay from payment details ('approved' for paypal, 'available' for stripe)
          else if (["approved", "available"].indexOf(transaction.payment_status) != -1) {
            temp_row.find(".transactions-row-available").text("Available");
            temp_row.data("available", true);
          }
          //not available
          else {
            temp_row.data("notavailable", true);
            temp_row.find(".transactions-row-available").text("Not yet available");
          }
        }
      }

      //original currency tooltip
      if (transaction.transaction_cost_original && transaction.transaction_cost_original_currency){
        temp_row.find(".transactions-row-amount").prepend("<div class='bubble-tooltip icon is-small is-tooltip' data-balloon-length='medium' data-balloon='Converted at " + formatCurrency(1 * multiplier(user.default_currency), transaction.transaction_cost_original_currency, 0) + " " + transaction.transaction_cost_original_currency.toUpperCase() + " to ~" + formatCurrency(transaction.transaction_cost_exchange_rate, user.default_currency) + " " + user.default_currency.toUpperCase() + "' data-balloon-pos='up'><i class='fal fa-question-circle'></i></div>");
      }
    }

    return temp_row;
  }

  //calculate totals of all transactions
  function calculateTotals(){
    var total_revenue = 0;
    var total_fees = 0;
    var total_available = 0;
    var total_unavailable = 0;
    var total_withdrawn = 0;
    var total_expenses = 0;

    //loop through and figure it out
    $(".transactions-row:not(#transactions-row-clone)").each(function(){

      //only if default currency and this transaction currency are the same
      if ($(this).data("currency") == user.default_currency){
        total_fees -= $(this).data("total_fees");

        //count towards revenue if its not an expense
        if (!$(this).data("expense") && !$(this).data('renewal')){
          total_revenue += $(this).data("total_revenue");
        }
        else {
          total_expenses += $(this).data("total_revenue");
        }

        //available to withdraw
        if ($(this).data("available")){
          total_available += ($(this).data("total_revenue") - $(this).data("total_fees"));
        }
        if ($(this).data("notavailable")){
          total_unavailable += ($(this).data("total_revenue") - $(this).data("total_fees"));
        }

        //count withdrawn
        if ($(this).data("withdrawn")){
          total_withdrawn += ($(this).data("total_revenue") - $(this).data("total_fees"));
        }
      }
    });

    var total_profit = total_revenue - Math.abs(total_expenses) - Math.abs(total_fees);

    //totals
    moneyCountAnimation($("#total-revenue"), total_revenue);
    moneyCountAnimation($("#total-expense"), total_expenses);
    moneyCountAnimation($("#total-fees"), total_fees);
    moneyCountAnimation($("#total-profit"), total_profit);
    moneyCountAnimation($("#total-withdrawn"), total_withdrawn);
    moneyCountAnimation($("#total-not-withdrawn"), total_unavailable);
    moneyCountAnimation($(".withdrawal-available"), total_available);
    $(".withdrawal-available").data("total_available", total_available);

    //if there are funds available and a bank to withdraw to
    if (total_available > 0 && (user.stripe_account && user.stripe_bank || user.paypal_email)){
      $("#transfer-button").removeClass('is-hidden').prev(".control").removeClass("remove-margin-bottom-content");
    }
    else {
      $("#transfer-button").addClass('is-hidden').prev(".control").addClass("remove-margin-bottom-content");
    }
  }

  //</editor-fold>

  //<editor-fold>-------------------------------EDIT ROWS-------------------------------

  //sets the toggle free transactions button on or off
  function toggleFreeTransactionsButton(toggled){
    $("#show-free-transactions").data("toggled", toggled);
    if (toggled){
      $("#show-free-transactions").addClass("is-primary");
      $("#show-free-transactions").find("svg").attr("data-icon", "toggle-on");
    }
    else {
      $("#show-free-transactions").removeClass("is-primary");
      $("#show-free-transactions").find("svg").attr("data-icon", "toggle-off");
    }
  }

  //filter / sort / search and show matching transactions
  function showTransactionRows(){
    $(".transactions-row:not(#transactions-row-clone)").addClass('is-hidden');

    var filter_val = $("#transactions-filter-select").val();
    var search_term = $("#transactions-search").val().toLowerCase();
    var sort_by = $(".transaction-header-sort .icon.is-primary").attr("data-sort-by") || "date_created";
    var sort_direction = (typeof $(".transaction-header-sort .icon.is-primary").data("sort_direction") != "undefined") ? $(".transaction-header-sort .icon.is-primary").data("sort_direction") : true;

    //filter / search / free toggle
    $(".transactions-row:not(#transactions-row-clone)").filter(function(){
      if ($(this).data(filter_val) &&
      $(this).data('domain_name').toLowerCase().indexOf(search_term) != -1
    ){
      if ($(this).data('free') && $("#show-free-transactions").data('toggled')){
        return true
      }
      else if (!$(this).data('free')){
        return true;
      }
    }}).removeClass('is-hidden').sort(function(a,b){
      if (sort_by){
        if (sort_by == "transaction_cost"){
          var a_sort = parseFloat($(a).data("total_revenue")) - parseFloat($(a).data("total_fees")) || 0;
          var b_sort = parseFloat($(b).data("total_revenue")) - parseFloat($(b).data("total_fees")) || 0;
        }
        else if (sort_by == "status" || sort_by == "domain_name"){
          var a_sort = $(a).find(".sort-by-" + sort_by).text().toLowerCase();
          var b_sort = $(b).find(".sort-by-" + sort_by).text().toLowerCase();
        }
        else {
          var a_sort = $(a).data("transaction_obj")[sort_by] || "";
          var b_sort = $(b).data("transaction_obj")[sort_by] || "";
        }

        if (!sort_direction){
          return (a_sort > b_sort) ? 1 : (a_sort < b_sort) ? -1 : 0;
        }
        else {
          return (a_sort > b_sort) ? -1 : (a_sort < b_sort) ? 1 : 0;
        }
      }
    }).appendTo('#transactions-table-body');

    //change tooltip direction for first visible 4
    if ($(".transactions-row:not(#transactions-row-clone):not(.is-hidden)").length < 4){
      $(".transactions-row:not(#transactions-row-clone):not(.is-hidden)").find(".bubble-tooltip").attr('data-balloon-pos', "left").attr('data-balloon-length', "large");
    }
    else {
      $(".transactions-row:not(#transactions-row-clone):not(.is-hidden)").find(".bubble-tooltip").attr('data-balloon-pos', "up").attr('data-balloon-length', "medium");
      for (var x = 0 ; x < 3; x++){
        $(".transactions-row:not(#transactions-row-clone):not(.is-hidden)").eq(x).find(".bubble-tooltip").attr('data-balloon-pos', "down");
      }
    }

    if (user.transactions){
      $("#no-transactions-table").addClass('is-hidden');
      //something matches
      if ($(".transactions-row:not(#transactions-row-clone):not(.is-hidden)").length > 0){
        $("#no-transactions-table").addClass('is-hidden');
        $("#transactions-table").removeClass('is-hidden');
      }
      //nothing matches
      else {
        $("#no-transactions-table").removeClass('is-hidden');
        $("#transactions-table").addClass('is-hidden');
      }
    }
  }

  //</editor-fold>

  //<editor-fold>-------------------------------TRANSACTION MODAL-------------------------------

  //set up the transactions modal
  function setupTransactionsModal(temp_row, transaction){
    $("#transactions-details-modal").addClass('is-active');

    //format the modal
    var payment_method_text = (transaction.payment_type == "paypal") ? "PayPal" : "credit card";

    var modal_timestamp_text = ""

    var date_created_moment = moment(new Date(transaction.date_created));
    if (date_created_moment.isValid()){
      if (transaction.transaction_type == "expense"){
        modal_timestamp_text = "Recorded on " + date_created_moment.format("YYYY-MM-DD");
      }
      else if (transaction.transaction_type == "renewal"){
        modal_timestamp_text = "Renewal paid on " + date_created_moment.format("YYYY-MM-DD");
      }
      else if (transaction.transaction_type == "rental" && transaction.transaction_cost == null){
        modal_timestamp_text = "Created on " + date_created_moment.format("YYYY-MM-DD");
      }
      else if (transaction.listing_status != 4) {
        modal_timestamp_text = "Received on " + date_created_moment.format("YYYY-MM-DD") + " via " + payment_method_text;
      }
      $("#transactions-modal-timestamp").attr('title', date_created_moment.format("YYYY-MM-DD HH:mm"));
    }
    else {
      modal_timestamp_text = "No registration date associated with this domain";
      $("#transactions-modal-timestamp").attr('title', "Please enter a valid registration date for this domain.");
    }

    $("#transactions-modal-timestamp").text(modal_timestamp_text)
    $("#transactions-modal-domain").text("Domain " + transaction.transaction_type + " for " + punycode.toUnicode(transaction.domain_name));

    //calculate fees and profit
    var doma_fees = (transaction.doma_fees) ? transaction.doma_fees : 0;
    var payment_fees = (transaction.payment_fees) ? transaction.payment_fees : 0;
    $("#transactions-modal-price").html(formatCurrency((transaction.transaction_cost - doma_fees - payment_fees), transaction.transaction_cost_currency) + " " + transaction.transaction_cost_currency.toUpperCase());

    //transaction was exchanged
    if (transaction.transaction_cost_original){

      //transaction cost
      $("#transactions-modal-price").attr("data-balloon-length", "medium").attr("data-balloon-pos", "up").attr("data-balloon", 'Original price: ' + formatCurrency(transaction.transaction_cost_original - transaction.doma_fees_original - transaction.payment_fees_original, transaction.transaction_cost_original_currency) + " " + transaction.transaction_cost_original_currency.toUpperCase());

      //doma fees
      if (transaction.doma_fees_original){
        $("#transactions-modal-domafees").attr("data-balloon-length", "medium").attr("data-balloon-pos", "up").attr("data-balloon", 'Original price: ' + formatCurrency(transaction.doma_fees_original, transaction.transaction_cost_original_currency) + " " + transaction.transaction_cost_original_currency.toUpperCase());
      }
    }
    else {
      $("#transactions-modal-price, #transactions-modal-domafees").removeAttr("data-balloon-length").removeAttr("data-balloon-pos").removeAttr("data-balloon");
    }

    //refunded!
    if (temp_row.data("refunded")){

      //price strikethrough
      $("#transactions-modal-price").addClass("text-line-through");

      //refunded date text
      var refunded_text = (moment(new Date(transaction.date_refunded)).isValid()) ? "Refunded on " + moment(new Date(transaction.date_refunded)).format("YYYY-MM-DD") : "Refunded";
      $("#transactions-modal-available").text(refunded_text);

      //hide premium commission promo message
      $("#commission-promo-message").addClass("is-hidden");
      $("#transaction-modal-rental-buttons-wrapper").addClass("remove-margin-bottom-content");

      //hide refund button
      $("#refund-rental-submit").off().closest(".control").addClass('is-hidden');

      //hide fees
      $("#transactions-modal-domafees").closest("li").addClass("is-hidden");

      //paypal doesnt refund flat fee
      if (transaction.payment_type == "paypal"){
        $("#transactions-modal-processfees").text(formatCurrency(transaction.paypal_fee, user.default_currency) + " paid in payments processing fees");
        $("#payment-fees-wrapper").removeClass("is-hidden");
        $("#paypal-refund-notice").removeClass('is-hidden');

        //payment fees
        if (transaction.paypal_fee_original){
          $("#transactions-modal-processfees").attr("data-balloon-length", "medium").attr("data-balloon-pos", "up").attr("data-balloon", 'Original price: ' + formatCurrency(transaction.paypal_fee_original, transaction.transaction_cost_original_currency) + " " + transaction.transaction_cost_original_currency.toUpperCase());
        }
        else {
          $("#transactions-modal-processfees").removeAttr("data-balloon-length").removeAttr("data-balloon-pos").removeAttr("data-balloon");
        }

      }
      else {
        $("#payment-fees-wrapper").addClass("is-hidden");
        $("#paypal-refund-notice").addClass('is-hidden');
      }
    }
    else {

      //payment fees
      if (transaction.payment_fees_original){
        $("#transactions-modal-processfees").attr("data-balloon-length", "medium").attr("data-balloon-pos", "up").attr("data-balloon", 'Original price: ' + formatCurrency(transaction.payment_fees_original, transaction.transaction_cost_original_currency) + " " + transaction.transaction_cost_original_currency.toUpperCase());
      }
      else {
        $("#transactions-modal-processfees").removeAttr("data-balloon-length").removeAttr("data-balloon-pos").removeAttr("data-balloon");
      }

      //remove strikethrough from refunded
      $("#transactions-modal-price").removeClass("text-line-through")

      //available for withdrawal
      if (temp_row.data("available")){
        $("#transactions-modal-available").text("Available for withdrawal!");
      }
      else if (temp_row.data("withdrawn")){
        $("#transactions-modal-available").text("Funds withdrawn on " + moment(new Date(transaction.withdrawn_on)).format("YYYY-MM-DD"));
      }
      else {
        var not_available_text = (moment(new Date(transaction.payment_available_on)).isValid()) ? "Available for withdrawal on " + moment(new Date(transaction.payment_available_on)).format("YYYY-MM-DD") : "Not yet available for withdrawal";
        $("#transactions-modal-available").text(not_available_text);
      }

      //show premium commission promo message
      $("#commission-promo-message").removeClass("is-hidden");
      $("#transaction-modal-rental-buttons-wrapper").removeClass("remove-margin-bottom-content");
      if (user.stripe_subscription){
        $(".premium-hidden").addClass('is-hidden');
        $(".basic-hidden").removeClass('is-hidden');
      }
      else {
        $(".basic-hidden").addClass('is-hidden');
        $(".premium-hidden").removeClass('is-hidden');
      }

      //fees and profit text
      $("#transactions-modal-domafees").text(formatCurrency(doma_fees, transaction.transaction_cost_currency) + " paid in DomaHub fees*").closest("li").removeClass("is-hidden");
      $("#transactions-modal-processfees").text(formatCurrency(payment_fees, transaction.transaction_cost_currency) + " paid in payments processing fees").closest("li").removeClass("is-hidden");

      //hide paypal notice tooltip
      $("#paypal-refund-notice").addClass('is-hidden');
    }

    //recorded outside of domahub
    if (transaction.listing_status == 4){
      $("#transactions-modal-domafees").text(formatCurrency((transaction.transaction_cost), transaction.transaction_cost_currency) + " recorded outside of DomaHub");

      $("#commission-promo-message, #pending-transfer-wrapper, #available-on-wrapper, #payment-fees-wrapper").addClass("is-hidden");

      //button for edit / delete
      $("#transaction-modal-rental-buttons-wrapper").addClass("is-hidden");
      $("#transaction-modal-expense-buttons-wrapper").removeClass("is-hidden");
      $("#edit-domain-expense-button").attr("href", "/profile/mylistings?listings=" + transaction.listing_id + "&tab=domain-info");
    }
    //domain rental related stuff
    else if (transaction.transaction_type == "rental"){
      //preview rental
      $("#view-rental-button").attr('href', "/listing/" + transaction.domain_name.toLowerCase() + "/" + transaction.id);

      //buttons
      $("#transaction-modal-rental-buttons-wrapper").removeClass("is-hidden");
      $("#transaction-modal-expense-buttons-wrapper").addClass("is-hidden");

      //hide sales stuff
      $("#pending-transfer-wrapper").addClass('is-hidden');
      $("#available-on-wrapper").removeClass('is-hidden');

      //free rental
      if (temp_row.data("free")){

        $("#transactions-modal-available").text("This was a free rental!");
        $("#transaction-modal-rental-buttons-wrapper").addClass("remove-margin-bottom-content");

        //hide fees
        $("#transactions-modal-domafees").closest("li").addClass("is-hidden");
        $("#payment-fees-wrapper").addClass("is-hidden");

        //hide promo message
        $(".premium-hidden").addClass('is-hidden');
        $(".basic-hidden").addClass('is-hidden');

        //hide refund button
        $("#refund-rental-submit").off().closest(".control").addClass('is-hidden');
      }
      else {
        //submit for refund
        if (transaction.transaction_id && !temp_row.data("refunded")){
          $("#refund-rental-submit").off().on("click", function(){
            submitRefundRental(temp_row, transaction);
          }).closest(".control").removeClass('is-hidden');
        }
      }
    }
    //domain sales related stuff
    else if (transaction.transaction_type == "sale") {

      //hide buttons
      $("#transaction-modal-rental-buttons-wrapper, #transaction-modal-expense-buttons-wrapper").addClass("is-hidden");
      $("#refund-rental-submit").off().closest(".control").addClass('is-hidden');
      $("#payment-fees-wrapper").removeClass("is-hidden");

      //show pending transfer warning
      if (transaction.available != 1){
        $("#pending-transfer-wrapper").removeClass('is-hidden');
        $("#available-on-wrapper").addClass('is-hidden');

        //transfer ownership link
        $("#transfer-ownership-href").attr("href", "/profile/mylistings?listings=" + transaction.listing_id + "&tab=offers");
      }
      else {
        $("#pending-transfer-wrapper").addClass('is-hidden');
        $("#available-on-wrapper").removeClass('is-hidden');
      }
    }
    //domain expense related stuff
    else {
      if (transaction.transaction_type == "expense"){
        $("#transactions-modal-domafees").text(formatCurrency((transaction.transaction_cost), transaction.transaction_cost_currency) + " paid" + ((transaction.transaction_details) ? ' for "' + transaction.transaction_details + '"': ""));
      }
      else {
        $("#transactions-modal-domafees").text(formatCurrency((transaction.transaction_cost), transaction.transaction_cost_currency) + " paid for annual domain renewal");
      }
      $("#commission-promo-message, #pending-transfer-wrapper, #available-on-wrapper, #payment-fees-wrapper").addClass("is-hidden");

      //button for edit / delete
      $("#transaction-modal-rental-buttons-wrapper").addClass("is-hidden");
      $("#transaction-modal-expense-buttons-wrapper").removeClass("is-hidden");
      $("#edit-domain-expense-button").attr("href", "/profile/mylistings?listings=" + transaction.listing_id + "&tab=domain-info");
    }

    //original currency stuff
    if (transaction.transaction_cost_original && transaction.transaction_cost_original_currency){
      $("#original-currency-wrapper").removeClass("is-hidden");
      $("#transactions-original-cost").text("Prices converted at " + formatCurrency(1 * multiplier(user.default_currency), transaction.transaction_cost_original_currency, 0) + " " + transaction.transaction_cost_original_currency.toUpperCase() + " to " + formatCurrency(transaction.transaction_cost_exchange_rate, user.default_currency, 4) + " " + user.default_currency.toUpperCase());
    }
    else {
      $("#original-currency-wrapper").addClass("is-hidden");
    }
  }

  //to submit a refund
  function submitRefundRental(temp_row, transaction){
    $("#refund-rental-submit").addClass("is-loading");
    $.ajax({
      url: "/listing/" + transaction.domain_name.toLowerCase() + "/" + transaction.id + "/refund",
      method: "POST",
      data : {
        transaction_id : (transaction.payment_type == "paypal") ? transaction.sales_id : transaction.transaction_id
      }
    }).done(function(data){
      $("#refund-rental-submit").removeClass("is-loading");
      if (data.state == "success"){
        getTransactions();
      }
      else {
        errorMessage(data.message);
      }
    });
  }

  //</editor-fold>

  //<editor-fold>-------------------------------WITHDRAWAL-------------------------------

  //for withdrawal selection
  function setupWithdrawModal(){
    $("#withdrawal-modal").addClass('is-active');

    //stripe bank account
    if (user.stripe_bank){
      $("#withdrawal-bank-option").text("Bank account - " + user.stripe_bank.bank_name + " " + user.stripe_bank.last4);
    }
    else {
      $("#withdrawal-bank-option").addClass('is-hidden');
    }

    //paypal
    if (user.paypal_email){
      $("#withdrawal-paypal-option").text("PayPal account - " + user.paypal_email);
    }
    else {
      $("#withdrawal-paypal-option").addClass('is-hidden');
    }

    //bitcoin
    if (user.bitcoin_address){
      $("#withdrawal-bitcoin-option").text("PayPal account - " + user.bitcoin_address);
    }
    else {
      $("#withdrawal-bitcoin-option").addClass('is-hidden');
    }

    //payoneer
    if (user.payoneer_email){
      $("#withdrawal-payoneer-option").text("PayPal account - " + user.payoneer_email);
    }
    else {
      $("#withdrawal-payoneer-option").addClass('is-hidden');
    }
  }

  //withdraw money
  function withdrawMoney(){
    $("#withdrawal-modal-submit-button").addClass('is-loading');

    //for success message
    if ($("#withdrawal-destination-input").val() == "bank"){
      var destination_account_text = "bank account";
    }
    else if ($("#withdrawal-destination-input").val() == "paypal"){
      var destination_account_text = "PayPal account";
    }

    $.ajax({
      url : "/profile/transfer",
      method : "POST",
      data : {
        destination_account : $("#withdrawal-destination-input").val()
      }
    }).done(function(data){
      $("#withdrawal-modal-submit-button").removeClass('is-loading');
      if (data.state == "success"){
        var total_available = $(".withdrawal-available").data("total_available");
        successMessage("Successfully submitted a withdrawal request for " + formatCurrency(total_available) + " to your " + destination_account_text + "!</br></br>Please look out for a follow-up email within the next few business days.");
        $(".modal").removeClass("is-active");
        if (data.user){
          user = data.user;
        }
        createTransactionsTable();
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
  }

  //</editor-fold>

//</editor-fold>

//<editor-fold>-------------------------------HELPERS-------------------------------

//get the multiplier of a currency
function multiplier(code){
  return (code && currency_codes[code.toUpperCase()]) ? Math.pow(10, currency_codes[code.toUpperCase()].fractionSize) : 1;
}

//to format a number for currency
function formatCurrency(number, currency_code, decimals){
  var default_currency_details = (currency_code) ? currency_codes[currency_code.toUpperCase()] : currency_codes[user.default_currency.toUpperCase()];
  var currency_details = {
    thousand: ',',
    decimals: default_currency_details.fractionSize,
  }

  //override currency decimals
  if (decimals != undefined){
    currency_details.decimals = decimals;
  }

  //right aligned symbol
  if (default_currency_details.symbol && default_currency_details.symbol.rtl){
    currency_details.suffix = default_currency_details.symbol.grapheme;
  }
  else if (default_currency_details.symbol && !default_currency_details.symbol.rtl){
    currency_details.prefix = default_currency_details.symbol.grapheme;
  }

  return wNumb(currency_details).to(number / Math.pow(10, default_currency_details.fractionSize));
}

//count money animation
function moneyCountAnimation(elem, number){
  elem.prop('Counter', 0).stop().animate({
    Counter: number
  }, {
    duration : 500,
    easing: 'swing',
    step: function (now) {
      if (now < 0){
        elem.addClass("is-danger");
      }
      $(this).text(formatCurrency(parseFloat(now)));
    }
  });
}

//make marquees move if necessary (function needed for resize)
function updateMarqueeHandlers(elem){
  elem.marquee("destroy").each(function(){
    if (this.offsetWidth < this.scrollWidth){
      updateMarqueeHandler($(this));
    }
  });
}

//start a marquee on an element (handle destroy when mouseleave)
function updateMarqueeHandler(elem){
  elem.marquee("destroy").marquee({
    startVisible : true,
    delayBeforeStart : 0,
    speed : 100
  }).marquee("pause").on("mouseenter", function(){
    $(this).marquee("resume");
  }).on("mouseleave", function(){
    updateMarqueeHandler(elem);
  });
}

//</editor-fold>
