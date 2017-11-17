var moneyFormat = wNumb({
  thousand: ',',
  prefix: '$'
});
var listings = [];
var search_term = "";

$(document).ready(function() {

  //get the first 10 listings
    getListings();

  $("#load-button").on("click", function(){
    getListings($(this), "click");
  });

  $("#domain-name-search").on("submit", function(e){
    e.preventDefault();
    getListings($(this), "submit");
  });

  $("#order-value").on("change", function(e){
    e.preventDefault();
    refreshListings();
  });

});

//------------------------------------------------------------------------------------------- GET LISTINGS

//get 10 more listings
function getListings(load_more_elem, type){
  if (load_more_elem){
    load_more_elem.off();
  }

  //concatenate array or new array of listings
  if (search_term != $("#domain-name-input").val()){
    listings = [];
  }

  $.ajax({
    url: "/listings",
    method: "POST",
    data: {
      listing_count : (listings.length > 0) ? listings.length : 0,
      search_term : $("#domain-name-input").val()
    }
  }).done(function(data){
    if (load_more_elem){
      //add back event handler
      load_more_elem.on(type, function(e){
        e.preventDefault();
        getListings(load_more_elem, type);
      });
    }

    if (data.state == "success" && data.listings.length > 0){

      //concatenate array or new array of listings
      if (search_term != data.search_term){
        search_term = data.search_term
        listings = data.listings;
      }
      else {
        listings = listings.concat(data.listings);
      }

      refreshListings();

      $("#total-domains-num").text("Total Domains: " + listings.length);

      if (data.listings.length != 10){
        $("#load-button").off().addClass('is-hidden');
      }
      else {
        $("#load-button").off().removeClass('is-hidden').on("click", function(){
          getListings($("#load-button"), "click");
        });
      }
    }
    else if ((data.listings && data.listings.length == 0) || data.state == "error") {
      $("#load-button").off().addClass('is-hidden');
      $("#none-listing-row").removeClass('is-hidden');
    }
  });
}

//add new rows after search
function createListingRow(listing){
  var temp_clone = $("#clone-listing-row").clone().removeClass('is-hidden').attr("id", "");

  temp_clone.attr("href", "/listing/" + listing.domain_name).data("domain_name", listing.domain_name);
  temp_clone.find(".domain-name").text(listing.domain_name);
  if (listing.price_rate != 0){
    temp_clone.find(".domain-price-rate").text(moneyFormat.to(listing.price_rate) + " / ");
    temp_clone.find(".domain-price-type").text(listing.price_type);
  }
  else {
    temp_clone.find(".domain-price-rate").text("Free!");
  }
  $("#domain-table").append(temp_clone);
}

//------------------------------------------------------------------------------------------- SEARCH

function sortListings(){
  var price_multipliers = {
    hour : 720,
    week : 4,
    day : 30,
    month : 1
  }

  listings.sort(function(a,b){
    if ($("#order-value").val() == "za"){
      if (b.domain_name > a.domain_name){
        return 1
      }
      if (b.domain_name < a.domain_name){
        return -1
      }
      return 0;
    }
    else if ($("#order-value").val() == "hl"){
      if (b.price_rate * price_multipliers[b.price_type] > a.price_rate * price_multipliers[a.price_type]){
        return 1
      }
      if (b.price_rate * price_multipliers[b.price_type] < a.price_rate * price_multipliers[a.price_type]){
        return -1
      }
      return 0;
    }
    else if ($("#order-value").val() == "lh"){
      if (b.price_rate * price_multipliers[b.price_type] > a.price_rate * price_multipliers[a.price_type]){
        return -1
      }
      if (b.price_rate * price_multipliers[b.price_type] < a.price_rate * price_multipliers[a.price_type]){
        return 1
      }
      return 0;
    }
    else {
      if (b.domain_name > a.domain_name){
        return -1
      }
      if (b.domain_name < a.domain_name){
        return 1
      }
      return 0;
    }
  });
}

//search for domains
function refreshListings(){
  $("#domain-table").find(".domain-listing").not('#clone-listing-row').not("#none-listing-row").remove();
  sortListings();
  $("#none-listing-row").addClass('is-hidden');
  for (var x = 0; x < listings.length; x++){
    createListingRow(listings[x]);
  }
}
