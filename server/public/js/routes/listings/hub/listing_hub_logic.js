//#region -------------------------------VARIABLES-------------------------------

var start_at = 0;
var listings_per_page = listing_hub_info.hub_layout_count || 10;
//hash table for categories
var categories_hash = {};
for (var x = 0 ; x < categories.length ; x++){
  categories_hash[categories[x].back] = categories[x].front;
}

//#endregion

//on back button
window.onpopstate = function(event) {
  findOtherDomainsHub(false);
};

$(document).ready(function() {

  //punycode the domain name
  $(".punycode-domain").each(function(){
    $(this).text(punycode.toUnicode($(this).text()));
  });

  //#region -------------------------------DOMAIN TABLE-------------------------------

  findOtherDomainsHub(false);

  //close ellipsis more menu
  $(document).on("click", function(event) {
    if (!$(event.target).closest(".misc-button").length && !$(event.target).closest(".misc-options").length) {
      $(".misc-options").addClass('is-hidden');
    }
  });

  //make an offer modal
  $("#make-offer-button").on("click", function() {
    $("#offer-modal").addClass('is-active');
  });

  //close modal
  $(".modal-close, .modal-background, .cancel-modal").on("click", function(){
    $(".modal").find("input, textarea, select").val("");
    $(".modal").removeClass('is-active');
  });

  //#endregion

  //#region -------------------------------DETAILED VIEW SETUP-------------------------------

  //leave detailed view
  $("#back-to-list-button, .logo-item").on("click", function(){
    showDomainListView(true);
  });

  //#endregion

  //#region -------------------------------HUB FOOTER-------------------------------

  //footer text
  if (listing_hub_info.description_footer){
    $("#listing-footer").text(listing_hub_info.description_footer);
  }
  else {
    $("#listing-footer").text("");
  }

  //descriptive footer link
  if (listing_hub_info.premium && listing_hub_info.description_footer_link){
    $("#listing-footer, #listing-footer-logo-link, #listing-hub-logo-link").attr("href", listing_hub_info.description_footer_link).addClass("is-underlined");
  }
  else if (listing_hub_info.premium){
    $("#listing-footer, #listing-footer-logo-link, #listing-hub-logo-link").removeAttr("href").removeClass("is-underlined");
  }
  else {
    $("#listing-footer, #listing-footer-logo-link, #listing-hub-logo-link").attr("href", "https://domahub.com").addClass("is-underlined");;
  }

  //#endregion

});

//#region -------------------------------PAGE SETUP-------------------------------

function showBasedOnURL(push){
  var domain_name = getParameterByName("listing");
  if (domain_name){
    showDetails(listing_hub_info.listings.filter(function(elem){
      if (elem.domain_name == domain_name){
        return true;
      }
      return false;
    })[0], push);
  }
  else {
    showDomainListView(push);
  }
}

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
    createDomainView();
  });

  //build search tld drop down
  $("#search-domain-tld").append("<option value=''>All TLDs</option>");
  listing_hub_info.listings.reduce(function(a, c, i){
    var split_domain_name = c.domain_name.split(".");
    var current_tld = split_domain_name[split_domain_name.length - 1].toLowerCase();
    if (a.indexOf(current_tld) == -1){
      a.push(current_tld);
      $("#search-domain-tld").append("<option value='." + current_tld +  "'>." + current_tld + "</option>");
    }
    return a;
  }, []);

  if ($("#search-domain-tld option").length <= 2){
    $("#search-domain-tld").closest(".select").addClass('is-hidden');
  }

  //search handler
  $("#search-domain-main, #search-domain-tld").off().on("input", function(){
    createDomainView(listing_hub_info.listings);
  });

  //set pagnination buttons values
  $("#prev-page").val(0 - listings_per_page);
  $("#next-page").val(listings_per_page);

  //pagination handler
  $(".page-button").off().on('click', function(){
    start_at += parseFloat($(this).val());
    createDomainView();
  });

  //build hash table for all categories (front v back)
  var all_categories = {};
  categories.forEach(function(category){
    for (var x in category){
      all_categories[category.back] = category.front
    }
  });

  //build categories dropdown
  var categories_array = listing_hub_info.listings.reduce(function(a, c, i){
    if (c.categories){
      return a.concat(c.categories.split(" "));
    }
    else {
      return a;
    }
  }, []);
  categories_array = arrayUnique(categories_array).sort();
  if (categories_array.length > 0){
    for (var x = 0 ; x < categories_array.length ; x++){
      $("#categories-select").append("<option value=" + categories_array[x] + ">" + all_categories[categories_array[x]] + "</option>");
    }
  }
  else {
    $("#categories-select").closest(".select").addClass('is-hidden');
  }

  //categories handler
  $("#categories-select").off().on('input', function(){
    createDomainView();
  });

  //layout handler
  $("#layout-button").off().on("click", function(){
    var this_svg = ($(this).find("svg").attr("data-icon") == "th") ? "list" : "th";
    $(this).find("svg").attr("data-icon", this_svg);
    var view_value = ($("#views-select").val() == 0) ? 1 : 0;
    $("#views-select").val(view_value);
    createDomainView();
  });

  //layout selector
  $("#views-select").val(listing_hub_info.hub_layout_type).on("change", function(){
    createDomainView();
  });

}

//other domains by same owner
function findOtherDomainsHub(push){
  $.ajax({
    url: "/listing/otherowner",
    method: "POST",
    data: {
      owner_id: listing_hub_info.owner_id,
      exclude_id: listing_hub_info.id,
      hub_id: listing_hub_info.id,
      sort_by : "rank",
      starting_id : false
    }
  }).done(function(data){
    if (data.state == "success"){
      listing_hub_info.listings = data.listings;
    }
    else {
      listing_hub_info.listings = [];
    }

    setupHandlers();
    createDomainView();
    showBasedOnURL(push);
  });
}

//#endregion

//#region -------------------------------TABLE SETUP-------------------------------

//create the table of domains owned (depending on sort and search)
function createDomainView(){

  //sort the listings by sort_by
  var sort_by = $(".sort-header.is-active").data('sort-by');
  var sort_direction = $(".sort-header.is-active").data('sort-direction');
  if (typeof sort_by != "undefined" && typeof sort_direction != "undefined"){
    var listings_to_show = listing_hub_info.listings.sort(function(a, b){
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
    var listings_to_show = listing_hub_info.listings
  }

  //filter by search
  listings_to_show = listings_to_show.filter(function(listing){
    var domain_name_split = listing.domain_name.split(".");
    var domain_name_ok = listing.domain_name.toLowerCase().indexOf($("#search-domain-main").val().toLowerCase()) != -1;
    var tld_ok = ("." + domain_name_split[domain_name_split.length - 1].toLowerCase() == $("#search-domain-tld").val().toLowerCase()) || $("#search-domain-tld").val() == "";
    return domain_name_ok && tld_ok;
  });

  //filter by categories
  listings_to_show = listings_to_show.filter(function(listing){
    if (listing.categories && listing.categories.indexOf($("#categories-select").val()) != -1){
      return true;
    }
    else if (listing.categories == "" || listing.categories == null){
      return true;
    }
  });

  //double check pagination
  if (start_at > listings_to_show.length){
    start_at = 0;
  }

  //create table
  if (listings_to_show.length > 0){
    if ($("#views-select").val() == 0){
      $(".sort-header").removeClass("has-text-center");
      $(".price-header").addClass("has-text-right");
      $(".header-hide").removeClass("is-hidden");
      createDomainTable(listings_to_show, start_at, listings_per_page);
    }
    else {
      $(".price-header").removeClass("has-text-right");
      $(".sort-header").addClass("has-text-center");
      $(".header-hide").addClass("is-hidden");
      createDomainTiles(listings_to_show, start_at, listings_per_page);
    }

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
    $("#domains-grid").addClass('is-hidden');
    $(".domains-table").addClass('is-hidden');
    $("#no-domains-table").removeClass('is-hidden');
    $("#total-domain-count").text("");
  }
}

//create table view of domains owned
function createDomainTable(listings_to_show, start_at, listings_per_page){
  $("#domains-grid").addClass('is-hidden');
  $(".table-row:not(#clone-row)").remove();

  for (var x = 0; x < listings_to_show.slice(start_at, start_at + listings_per_page).length; x++){
    var clone_row = $("#clone-row").clone().removeAttr("id");
    clone_row.data("listing_info", listings_to_show[start_at + x]);
    if (listings_to_show[start_at + x].logo){
      clone_row.find(".domain-row-logo").attr("src", listings_to_show[start_at + x].logo);
    }
    else {
      var background_color = (listing_hub_info.background_color) ? listing_hub_info.background_color.replace("#", "") : "";
      var primary_color = (listing_hub_info.primary_color) ? listing_hub_info.primary_color.replace("#", "") : "";
      clone_row.find(".domain-row-logo").attr("src", "https://placeholdit.imgix.net/~text?txtsize=22&w=48&h=48&txt=" + punycode.toUnicode(listings_to_show[start_at + x].domain_name).substr(0, 1).toUpperCase() + "&bg=" + background_color + "&txtclr=" + primary_color);
    }
    clone_row.find(".domain-row-domain").text(punycode.toUnicode(listings_to_show[start_at + x].domain_name));

    if (listings_to_show[start_at + x].buy_price){
      clone_row.find(".domain-row-bin").text(formatCurrency(listings_to_show[start_at + x].buy_price, listings_to_show[start_at + x].default_currency));
    }
    else {
      clone_row.find(".bin-col .control-item").addClass('is-hidden');
    }
    if (listings_to_show[start_at + x].min_price){
      clone_row.find(".domain-row-min").text(formatCurrency(listings_to_show[start_at + x].min_price, listings_to_show[start_at + x].default_currency));
    }
    else {
      clone_row.find(".min-col .control-item").addClass('is-hidden');
    }

    if (listings_to_show[start_at + x].price_rate && listings_to_show[start_at + x].price_type && listings_to_show[start_at + x].rentable){
      clone_row.find(".domain-row-rent").text(formatCurrency(listings_to_show[start_at + x].price_rate, listings_to_show[start_at + x].default_currency) + " / " + listings_to_show[start_at + x].price_type);
    }
    else {
      clone_row.find(".rent-col .control-item").addClass('is-hidden');
    }

    clone_row.find(".misc-button").on("click", function(e){
      $(".misc-options").addClass('is-hidden');
      $(this).next(".misc-options").toggleClass("is-hidden");
    });

    //click to see details
    clone_row.on("click", function(){
      showDetails($(this).data("listing_info"), true);
    });

    $("#domain-table-body").append(clone_row);
  }

  //show table
  $(".domains-table").addClass('is-hidden');
  $("#domains-table, .table-row:not(#clone-row)").removeClass('is-hidden');
  $("#domain-table-body").removeClass('is-hidden');
}

//create tiled view of domains owned
function createDomainTiles(listings_to_show, start_at, listings_per_page){
  $(".domains-table, #domain-table-body").addClass("is-hidden");
  $("#domains-grid").removeClass('is-hidden');

  //remove any existing tiles
  $(".domain-tile-cols").remove();

  var cols_per_row = 4;
  var cur_col = 0;
  var cols_to_append_to = $("#domains-grid-clone-cols").clone().removeAttr("id").removeClass('is-hidden').addClass("domain-tile-cols");
  for (var x = 0; x < listings_to_show.slice(start_at, start_at + listings_per_page).length; x++){

    //create new clone columns to append column to
    if (cur_col >= cols_per_row){
      $("#domains-grid").append(cols_to_append_to);
      cols_to_append_to = $("#domains-grid-clone-cols").clone().removeAttr("id").removeClass('is-hidden').addClass("domain-tile-cols");
      cur_col = 1;
    }
    else {
      cur_col++;
    }

    //clone column
    var clone_col = $("#domains-grid-clone-col").clone().removeAttr("id").removeClass('is-hidden').addClass("is-" + Math.round(12 / cols_per_row)).addClass("domain-tile-col");
    clone_col.data("listing_info", listings_to_show[start_at + x]);

    if (listings_to_show[start_at + x].logo){
      clone_col.find(".logo-image").attr("src", listings_to_show[start_at + x].logo);
    }
    else {
      var background_color = (listing_hub_info.background_color) ? listing_hub_info.background_color.replace("#", "") : "";
      var primary_color = (listing_hub_info.primary_color) ? listing_hub_info.primary_color.replace("#", "") : "";
      clone_col.find(".logo-image").attr("src", "https://placeholdit.imgix.net/~text?txtsize=25&txtclip=end,ellipsis&w=255&h=128&txtfit=max&txt=" + punycode.toUnicode(listings_to_show[start_at + x].domain_name) + "&bg=" + background_color + "&txtclr=" + primary_color);
    }

    //domain name
    clone_col.find(".domain-name").text(punycode.toUnicode(listings_to_show[start_at + x].domain_name));

    //price tag
    var price_tag = "";
    if (listings_to_show[start_at + x].buy_price){
      var price_tag = "Buy now - " + formatCurrency(listings_to_show[start_at + x].buy_price, listings_to_show[start_at + x].default_currency);
    }
    else if (listings_to_show[start_at + x].min_price){
      var price_tag = "Make offer - " + formatCurrency(listings_to_show[start_at + x].min_price, listings_to_show[start_at + x].default_currency);
    }

    //available now (no min, bin, or rent)
    if (typeof price_tag_rent == "undefined" && price_tag == ""){
      var price_tag = "Available now!"
    }

    //also view rental tags
    if (listings_to_show[start_at + x].price_rate && listings_to_show[start_at + x].rentable){
      price_tag += "</br>Rent now - " + formatCurrency(listings_to_show[start_at + x].price_rate, listings_to_show[start_at + x].default_currency) + " / " + listings_to_show[start_at + x].price_type;
      clone_col.find(".price-tag").addClass("rent-visible");
    }

    clone_col.find(".price-text").html(price_tag);

    //click to see details
    clone_col.on("click", function(){
      showDetails($(this).data("listing_info"), true);
    });

    cols_to_append_to.append(clone_col);
  }

  //append last if necessary
  if (cur_col <= cols_per_row){
    $("#domains-grid").append(cols_to_append_to);
  }
}

//#endregion

//#region -------------------------------DETAIL VIEW SETUP-------------------------------

//show the detailed view
function showDetails(listing_info_local, push){
  $("#detailed-view-section").removeClass("is-hidden");
  $("#domain-list-section, #domain-search-section").addClass("is-hidden");

  listing_info = listing_info_local;
  listing_info.premium = true;

  //make the detailed listing look like hub styling
  listing_info.primary_color = listing_hub_info.primary_color;
  listing_info.secondary_color = listing_hub_info.secondary_color;
  listing_info.tertiary_color = listing_hub_info.tertiary_color;
  listing_info.font_color = listing_hub_info.font_color;
  listing_info.font_name = listing_hub_info.font_name;
  delete listing_info.background_image;
  listing_info.background_color = listing_hub_info.background_color;
  listing_info.footer_color = listing_hub_info.footer_color;
  listing_info.footer_background_color = listing_hub_info.footer_background_color;

  setupListedPage();
  setupTheming();

  //add to history object
  updateQueryStringParam("listing", listing_info.domain_name, push);

  //remove stuff that doesnt work from a hub perspective
  $("#domainlist-tab").remove();
  $("#domainlist-module").remove();
  stylize(listing_info.font_color, "#back-to-list-button", "color");
  $("#back-to-list-button").prependTo(".page-contents .listing-left");
}

//show domain list
function showDomainListView(push){
  $("#detailed-view-section").addClass("is-hidden");
  $("#domain-list-section, #domain-search-section").removeClass("is-hidden");

  //remove disabled from contact form if we submitted an offer
  $(".contact-input").removeAttr('disabled');

  removeURLParameter("listing", push);
}

//#endregion

//#region -------------------------------HELPERS-------------------------------

//encode and decode ROT13
function rot13(s) {
  return s.replace(/[A-Za-z]/g, function (c) {
    return "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".charAt(
    "NOPQRSTUVWXYZABCDEFGHIJKLMnopqrstuvwxyzabcdefghijklm".indexOf(c)
    );
  } );
}

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

//#endregion
