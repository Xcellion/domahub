$(document).ready(function() {
  calcOffers();
  calcSold();

  //referral link
  $("#referral-link").on("focus", function(){
    $(this).select();
  });

  $("#referral-link-copy").on("click", function(){
    $("#referral-link").select();
    document.execCommand("copy");
    $("#referral-link").blur();
    $(this).find("svg").replaceWith("<i class='far fa-check'></i>");
    $("#referral-link-text").text("Copied!");
  });

});

//find out how many offers per domain
function calcOffers(){
  var num_total_offers = user.listings.reduce(function(arr, listing) {
    return arr + ((listing.offers_count) ? listing.offers_count : 0);
  }, 0) || 0;
  $("#offers-counter").text(num_total_offers);
}

//function to figure out sold domains
function calcSold(){
  $("#sold-counter").text(user.listings.filter(function(listing) {
    return listing.deposited || listing.transferred;
  }).length);
}
