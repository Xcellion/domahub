//<editor-fold>-----------------------------------------------------------------------------------VARIABLES

var moneyFormat = wNumb({
  thousand: ',',
  prefix: '$'
});
var start_at = 0;
var listings_per_page = 10;

//</editor-fold>

$(document).ready(function() {

  //<editor-fold>-----------------------------------------------------------------------------------DOMAIN TABLE

  findOtherDomains();

  //close ellipsis more menu
  $(document).on("click", function(event) {
    if (!$(event.target).closest(".misc-button").length && !$(event.target).closest(".misc-options").length) {
      $(".misc-options").addClass('is-hidden');
    }
  });

  //</editor-fold>

});

//<editor-fold>-----------------------------------------------------------------------------------PAGE SETUP

//search, sort, pagination, category, change layout handlers
function setupHandlers(){

  //sort handler
  $(".sort-header").off().on("click", function(){

    //reset others
    $(".sort-header").not($(this)).data('sort-direction', true);
    $(".sort-header").removeClass('is-active');
    $(".sort-header").find(".icon").removeClass('is-primary');
    $(".sort-header").find("svg").attr("data-icon", "sort");

    //show specific sort
    $(this).addClass('is-active');
    $(this).find(".icon").addClass('is-primary');
    $(this).data('sort-direction', !$(this).data('sort-direction'));
    if ($(this).data('sort-direction')){
      $(this).find("svg").attr("data-icon", "sort-up");
    }
    else {
      $(this).find("svg").attr("data-icon", "sort-down");
    }
    createDomaintable(listing_info.listings);
  });

  //search handler
  $("#search-domain-main, #search-domain-tld").off().on("input", function(){
    createDomaintable(listing_info.listings);
  });

  //set pagnination buttons values
  $("#prev-page").val(0 - listings_per_page);
  $("#next-page").val(listings_per_page);

  //pagination handler
  $(".page-button").off().on('click', function(){
    start_at += parseFloat($(this).val());
    createDomaintable();
  });

  //build hash table for all categories (front v back)
  var all_categories = {};
  categories.forEach(function(category){
    for (var x in category){
      all_categories[category.back] = category.front
    }
  });

  //build categories dropdown
  var categories_array = listing_info.listings.reduce(function(a, c, i){
    if (c.categories){
      return a.concat(c.categories.split(" "));
    }
    else {
      return a;
    }
  }, []);
  categories_array = arrayUnique(categories_array).sort();
  for (var x = 0 ; x < categories_array.length ; x++){
    $("#categories-select").append("<option value=" + categories_array[x] + ">" + all_categories[categories_array[x]] + "</option>");
  }

  //categories handler
  $("#categories-select").off().on('input', function(){
    createDomaintable();
  });

  //layout handler
  $("#layout-button").off().on("click", function(){
    var this_svg = ($(this).find("svg").attr("data-icon") == "th") ? "list" : "th";
    $(this).find("svg").attr("data-icon", this_svg);
  });

}

//other domains by same owner
function findOtherDomains(){
  if (!listing_info.listings){
    $.ajax({
      url: "/listing/otherowner",
      method: "POST",
      data: {
        owner_id: listing_info.owner_id,
        domain_name_exclude: listing_info.domain_name,
        sort_by : "id",
        total : listings_per_page,
        starting_id : false
      }
    }).done(function(data){
      if (data.state == "success"){
        listing_info.listings = data.listings;
      }
      else {
        listing_info.listings = [];
      }

      setupHandlers();
      createDomaintable();
    });
  }
  else {
    createDomaintable();
  }
}

//</editor-fold>

//<editor-fold>-----------------------------------------------------------------------------------TABLE SETUP

//create the table of domains owned (depending on sort and search)
function createDomaintable(){

  //sort the listings by sort_by
  var sort_by = $(".sort-header.is-active").data('sort-by');
  var sort_direction = $(".sort-header.is-active").data('sort-direction');
  if (typeof sort_by != "undefined" && typeof sort_direction != "undefined"){
    var listings_to_show = listing_info.listings.sort(function(a, b){
      if (sort_by == "price_rate"){
        var a_sort = a[sort_by];
        var b_sort = b[sort_by];
      }
      else {
        var a_sort = a[sort_by];
        var b_sort = b[sort_by];
      }
      if (sort_direction){
        return (a_sort > b_sort) ? 1 : (a_sort < b_sort) ? -1 : 0;
      }
      else {
        return (a_sort > b_sort) ? -1 : (a_sort < b_sort) ? 1 : 0;
      }
    });
  }
  else {
    var listings_to_show = listing_info.listings
  }

  //filter by search
  listings_to_show = listings_to_show.filter(function(listing){
    var domain_name_split = listing.domain_name.split(".");
    if (listing.domain_name.toLowerCase().indexOf($("#search-domain-main").val().toLowerCase()) != -1 && "." + domain_name_split[domain_name_split.length - 1].toLowerCase() == $("#search-domain-tld").val().toLowerCase()){
      return true;
    }
  });

  //filter by categories
  listings_to_show = listings_to_show.filter(function(listing){
    if (listing.categories.indexOf($("#categories-select").val()) != -1){
      return true;
    }
  });

  //double check pagination
  if (start_at > listings_to_show.length){
    start_at = 0;
  }

  //create table
  if (listings_to_show.length > 0){

    $(".table-row:not(#clone-row)").remove();

    for (var x = 0; x < listings_to_show.slice(start_at, start_at + listings_per_page).length; x++){
      var clone_row = $("#clone-row").clone().removeAttr("id");
      if (listings_to_show[start_at + x].logo){
        clone_row.find(".domain-row-logo").attr("src", listings_to_show[start_at + x].logo);
      }
      else {
        clone_row.find(".domain-row-logo").remove();
      }
      clone_row.find(".domain-row-domain").text(listings_to_show[start_at + x].domain_name);

      if (listings_to_show[start_at + x].buy_price){
        clone_row.find(".domain-row-bin").text(moneyFormat.to(listings_to_show[start_at + x].buy_price));
      }
      else {
        clone_row.find(".bin-col .control-item").addClass('is-hidden');
      }
      if (listings_to_show[start_at + x].min_price){
        clone_row.find(".domain-row-min").text(moneyFormat.to(listings_to_show[start_at + x].min_price));
      }
      else {
        clone_row.find(".min-col .control-item").addClass('is-hidden');
      }

      if (listings_to_show[start_at + x].price_rate && listings_to_show[start_at + x].price_type && listings_to_show[start_at + x].rentable){
        clone_row.find(".domain-row-rent").text(moneyFormat.to(listings_to_show[start_at + x].price_rate) + " / " + listings_to_show[start_at + x].price_type);
      }
      else {
        clone_row.find(".rent-col .control-item").addClass('is-hidden');
      }

      clone_row.find(".misc-button").on("click", function(){
        $(".misc-options").addClass('is-hidden');
        $(this).next(".misc-options").toggleClass("is-hidden");
      });

      $("#domain-table-body").append(clone_row);
    }

    //show table
    $(".domains-table").addClass('is-hidden');
    $("#domains-table, .table-row:not(#clone-row)").removeClass('is-hidden');

    //how many domains text
    $("#total-domain-count").text("Showing " + (start_at + 1) + " - " + (start_at + listings_to_show.slice(start_at, start_at + listings_per_page).length) + " of " + listings_to_show.length + " domains");

    //show prev
    $(".page-button").addClass('is-disabled');
    if (start_at > 0){
      $("#prev-page").removeClass('is-disabled');
    }

    //show next
    if (start_at + listings_per_page < listings_to_show.length) {
      $("#next-page").removeClass('is-disabled');
    }
  }

  //no matching domains!
  else {
    $(".domains-table").addClass('is-hidden');
    $("#no-domains-table").removeClass('is-hidden');
    $("#total-domain-count").text("");
  }
}

//</editor-fold>

//<editor-fold>-----------------------------------------------------------------------------------HELPERS

//makes an array unique
function arrayUnique(array) {
    var a = array.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }
    return a;
}

//</editor-fold>
