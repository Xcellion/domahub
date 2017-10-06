var traffic_chart = false;

$(document).ready(function() {

  //add active to the first appearing tab (maybe some tabs are disabled)
  $(".tab").eq(0).addClass('is-active');
  $(".module").eq(0).removeClass('is-hidden');

  //date registered for info module
  if (listing_info.date_registered){
    $("#date_registered").text(moment(listing_info.date_registered).format("MMMM DD, YYYY"));
  }

  //<editor-fold>-----------------------------------------------------------------------------------TABS

  //switch tabs
  $(".tab").not(".top-tab").on("click", function(){
    var which_tab = $(this).attr("id").replace("-tab", "");

    //show the tab
    $(".tab").not(".top-tab").removeClass('is-active');
    $(this).addClass('is-active');

    //show the module
    $(".module").not(".top-module").addClass('is-hidden');
    $("#" + which_tab + "-module").removeClass('is-hidden');
  });

  //</editor-fold>

  //<editor-fold>-----------------------------------------------------------------------------------MODULES

  //initialize modules
  if ((listing_info.premium && listing_info.traffic_module) || !listing_info.premium){
    getAlexaData();
  }
  if ((listing_info.premium && listing_info.history_module) || !listing_info.premium){
    getTickerData();
  }
  if ((listing_info.premium && listing_info.info_module) || !listing_info.premium){
    findOtherDomains();
  }

  //only get traffic if it's visible due to chartjs responsive endless loop
  if ((listing_info.premium && listing_info.traffic_graph) || !listing_info.premium){
    if ($(".module").eq(0).attr("id") == "traffic-module"){
      getTrafficData();
    }
    else {
      $("#traffic-tab").on("click", function(){
        getTrafficData();
      });
    }
  }

  //</editor-fold>

});

//<editor-fold>-----------------------------------------------------------------------------------RENTAL TICKER MODULE

//ajax call to get ticker information
function getTickerData(loadmore){
  //unlisted so no rentals exist
  if (listing_info.unlisted && !compare){

    //create the X views in past X time
    listing_info.rentals = [];
    if (listing_info.rentals){
      pastViewsTickerRow();
    }
    $("#ticker-loading").addClass('is-hidden');
    editTickerDates();
  }
  else if (compare && listing_info.unlisted) {
    $("#ticker-loading").addClass('is-hidden');
    createTestRentals();
    editTickerModule(listing_info.rentals, 10);
    pastViewsTickerRow();
    editTickerDates();
  }
  else {
    //remove click handler for load more
    if (loadmore){
      $("#ticker-loading").removeClass('is-hidden').appendTo("#ticker-wrapper");
      loadmore.addClass('is-hidden').off();
    }

    //how many to load at a time;
    var max_count = 10;

    $.ajax({
      url: "/listing/" + listing_info.domain_name + "/ticker",
      method: "POST",
      data: {
        //how many to get
        max_count: max_count,
        //the oldest displayed rental on the ticker
        oldest_rental_date: (listing_info.rentals) ? listing_info.rentals[listing_info.rentals.length - 1].date : new Date().getTime()
      }
    }).done(function(data){
      //remove the loading message
      $("#ticker-loading").addClass('is-hidden');

      if (data.state == "success"){
        //add to the session listing_info
        if (listing_info.rentals){
          listing_info.rentals = listing_info.rentals.concat(data.loaded_rentals);
        }
        else if (data.loaded_rentals) {
          listing_info.rentals = data.loaded_rentals;
        }
        else {
          listing_info.rentals = [];
        }

        editTickerModule(data.loaded_rentals, max_count);
      }
      else {
        listing_info.rentals = [];
        editTickerDates();
      }

      if (listing_info.rentals){
        pastViewsTickerRow();
      }
    });
  }
}

//edit listing created date / updated date etc.
function editTickerDates(){
  if (listing_info.date_updated){
    $("#ticker-updated").removeClass('is-hidden').appendTo("#ticker-wrapper");
    $("#ticker-updated-date").text("This domain was last updated on " + moment(listing_info.date_updated).format("MMMM DD, YYYY") + ".");
  }

  if (listing_info.date_created){
    $("#ticker-created").removeClass('is-hidden').appendTo("#ticker-wrapper");
    $("#ticker-created-date").removeClass('is-hidden').text("This website was created on " + moment(listing_info.date_created).format("MMMM DD, YYYY") + ".");
  }
  else {
    $("#ticker-created").removeClass('is-hidden').appendTo("#ticker-wrapper");
    $("#ticker-created-date").removeClass('is-hidden').text("This website was created on " + moment(1467345600000).format("MMMM DD, YYYY") + ".");
  }

  if (listing_info.date_registered){
    $("#ticker-registered").removeClass('is-hidden').appendTo("#ticker-wrapper");
    $("#ticker-registered-date").text("This domain was first registered on " + moment(listing_info.date_registered).format("MMMM DD, YYYY") + ".");
  }
}

//edit ticker module with AJAX data
function editTickerModule(loaded_rentals, max_count){
  //if something was loaded
  if (loaded_rentals && loaded_rentals.length > 0){
    var now = moment();
    for (var x = 0; x < loaded_rentals.length; x++){
      createTickerRow(loaded_rentals[x], now);
    }

    //change colors if premium
    if (listing_info.premium){
      setupCustomColors();
    }

    //show load more only if max count returned
    if (loaded_rentals.length == max_count){
      $("#ticker-loadmore").removeClass('is-hidden').appendTo("#ticker-wrapper").on("click", function(){
        getTickerData($(this));
      });
    }
  }

  //nothing more to load if less than max_count returned
  if (!loaded_rentals || loaded_rentals.length < max_count){
    editTickerDates();
  }
}

//function to create ticker row
function createTickerRow(rental, now){
  var start_moment = moment(rental.date);
  var end_moment = moment(rental.date + rental.duration);
  var ticker_clone = $("#ticker-clone").clone().removeAttr('id').removeClass('is-hidden');

  //user name or anonymous
  var ticker_user = (rental.username) ? rental.username : "An anonymous user";
  ticker_clone.find(".ticker-user").text(ticker_user + " ");

  //views / reach
  var ticker_time = "<span>" + moment.duration(rental.duration, "milliseconds").humanize() + "</span>";
  var ticker_reach = "";

  if (rental.views > 0){
    var ticker_views_plural = (rental.views == 1) ? " person in " : " people in ";
    var ticker_views_format = wNumb({
      thousand: ','
    }).to(rental.views);
    var ticker_reach = "--reaching <span class='is-primary'>" + ticker_views_format + "</span>" + ticker_views_plural;
  }
  else {
    ticker_time = " for " + ticker_time;
  }

  //word tense
  var ticker_pre_tense = "";
  var ticker_verb_tense = "ed";

  //where have they been sending traffic??
  var rental_path = (rental.path) ? "/" + rental.path : "";
  var rental_preview = "http://" + listing_info.domain_name + rental_path;

  //rental is in the past
  if (end_moment.isBefore(now)){
    ticker_verb_tense = "ed";

    //where have they sent traffic??
    var rental_preview = "/listing/" + listing_info.domain_name + "/" + rental.rental_id;
    var path = (rental.path == "" || !rental.path) ? "this website" : listing_info.domain_name + "<a class='is-accent'>" + "/" + rental.path + '</a>';
  }
  //rental ends in the future but started in the past
  else {
    ticker_pre_tense = "has been "
    ticker_verb_tense = "ing";
    var path = (rental.path == "" || !rental.path) ? "<a href='" + rental_preview + "' class='is-accent'>this website</a>" : listing_info.domain_name + "<a href='" + rental_preview + "' class='is-accent'>" + "/" + rental.path + '</a>';

    if (rental.views > 0){
      var ticker_time = " in <span>" + moment.duration(start_moment.diff(now)).humanize() + "</span>";
      var ticker_views_plural = ticker_views_plural.replace("in ", "");
      ticker_reach = "--reaching <span class='is-primary'>" + ticker_views_format + "</span>" + ticker_views_plural;
    }
    else {
      var ticker_time = " for <span>" + moment.duration(start_moment.diff(now)).humanize() + "</span>";
    }
  }

  //update time / reach
  ticker_clone.find(".ticker-time").html(ticker_time);
  ticker_clone.find(".ticker-reach").html(ticker_reach);

  var ticker_icon_color = ticker_clone.find(".ticker-icon-color");
  var ticker_icon = ticker_clone.find(".ticker-icon");

  //redirect content to display on that domain
  if (rental.type == 0){

    //showing an image
    if (rental.address.match(/\.(jpeg|jpg|png|bmp)$/) != null){
      var ticker_type = ticker_pre_tense + " us" + ticker_verb_tense + " " + path + " to display <a target='_blank' href=" + rental.address + " class='is-info is-underlined'>an image</a>";
      ticker_icon_color.addClass('is-info');
      ticker_icon.addClass('fa-camera-retro');
    }

    //showing a GIF
    else if (rental.address.match(/\.(gif)$/) != null){
      var ticker_type = ticker_pre_tense + " us" + ticker_verb_tense + " " + path + " to display <a target='_blank' href=" + rental.address + " class='is-info is-underlined'>a GIF</a>";
      ticker_icon_color.addClass('is-dark');
      ticker_icon.addClass('fa-smile-o');
    }

    //showing a PDF
    else if (rental.address.match(/\.(pdf)$/) != null){
      var ticker_type = ticker_pre_tense + " us" + ticker_verb_tense + " " + path + " to display <a target='_blank' href=" + rental.address + " class='is-info is-underlined'>a PDF</a>";
      ticker_icon_color.addClass('is-danger');
      ticker_icon.addClass('fa-file-pdf-o');
    }

    //showing a website
    else if (rental.address){
      var ticker_address = getHost(rental.address);
      var ticker_type = ticker_pre_tense + " us" + ticker_verb_tense + " " + path + " to display content from <a target='_blank' href=" + rental.address + " class='is-info is-underlined'>" + ticker_address + "</a>";
      ticker_icon_color.addClass('is-primary');
      ticker_icon.addClass('fa-external-link');
    }

    //showing nothing
    else {
      var ticker_type = ticker_pre_tense + " us" + ticker_verb_tense + " " + path + " to display nothing";
      ticker_icon_color.addClass('is-black');
      ticker_icon.addClass('fa-times-circle-o');
    }
  }
  //forward the domain
  else {
    var ticker_address = getHost(rental.address);
    var ticker_type = ticker_pre_tense + "forward" + ticker_verb_tense + " " + path + " to <a target='_blank' href='" + rental.address + "' class='is-info is-underlined'>" + ticker_address + "</a>";
    ticker_icon_color.addClass('is-accent');
    ticker_icon.addClass('fa-share-square');
  }
  ticker_clone.find(".ticker-type").html(ticker_type);

  //add the cloned ticker event
  $("#ticker-wrapper").append(ticker_clone);
}

//callback function to create past views ticker row
function pastViewsTickerRow(){
  if (listing_info.rentals && listing_info.rentals.length > 0){
    var last_month_views = 0;
    var ticker_latest_date_human = "month";
    if (listing_info.rentals.length > 0){
      last_month_views = listing_info.rentals.reduce(function(a,b){
        return {views: a.views + b.views};
      }).views;
      var ticker_latest_date = moment.duration(moment(listing_info.rentals[listing_info.rentals.length - 1].date).diff(moment()), "milliseconds");
      ticker_latest_date_human = ticker_latest_date.humanize().replace("a ", "").replace("an ", "");
    }

    //how many people in the past month
    $("#views-total").text(wNumb({
      thousand: ','
    }).to(last_month_views));
    $("#views-plural").text((last_month_views == 1) ? " person has " : " people have ");
    $("#views-time").text(ticker_latest_date_human);
    $("#ticker-views").removeClass('is-hidden');
  }
}

//</editor-fold>

//<editor-fold>-----------------------------------------------------------------------------------TRAFFIC MODULE

//function to get traffic data if we havent yet
function getTrafficData(){
  if (compare && listing_info.unlisted){
    createTestChart();
  }
  else if (!listing_info.traffic) {

    //create empty chart while we get traffic data via AJAX
    createEmptyChart();

    $.ajax({
      url: "/listing/" + listing_info.domain_name.toLowerCase() + "/traffic",
      method: "POST"
    }).done(function(data){
      //hide the loading overlay
      $("#traffic-overlay-load").addClass('is-hidden');

      if (data.traffic){
        listing_info.traffic = data.traffic;
        createCharts(data.traffic);
      }
    });
  }
}

//create empty or full chart
function createCharts(traffic){
  //create a chart with the traffic data
  if (traffic && traffic.length > 0){
    createTrafficChart();
  }
  else {
    createEmptyChart();

    //not enough data overlay
    $("#traffic-overlay-text").removeClass('is-hidden');

    //hide the loading overlay
    $("#traffic-overlay-load").addClass('is-hidden');
  }
}

//function to create an empty chart
function createEmptyChart(){

  //create the monthly x-axis labels array
  var monthly_labels = [];
  var months_to_go_back = 12;
  for (var y = 0; y < months_to_go_back; y++){
    var temp_month = moment().subtract(y, "month").format("MMM");
    monthly_labels.unshift(temp_month);
  }

  //create the chart
  myChart = new Chart($("#traffic-chart"), {
    type: 'line',
    data: {
      labels: monthly_labels,
      datasets: []
    },
    options: {
      legend: {
        display:false
      },
      scales: {
        xAxes: [{
          type: "category"
        }],
        yAxes: [{
          display: true,
          type: 'linear',
          ticks: {
            beginAtZero: true   // minimum value will be 0.
          }
        }]
      }
    }
  });

  //unhide the overlay
  $("#traffic-overlay").css({
    "height" : $("#traffic-chart").height(),
    "width" : $("#traffic-chart").width()
  }).removeClass('is-hidden');
}

//function to format the stats to the required format
function formatDataset(stats) {

  //compare tool (not listed)
  if (compare && listing_info.unlisted){
    var num_months_since = Math.floor(Math.random() * 6) + 6;   //random between 6 and 12
  }
  else {
    //traffic dataset
    var earliest_date = stats[stats.length - 1].timestamp;
    var num_months_since = Math.min(Math.ceil(moment.duration(new Date().getTime() - earliest_date).as("month") + 1), 12);    //12 months or less
  }

  var months_since = [];
  for (var x = 0 ; x < num_months_since ; x++){
    var temp_month = moment().startOf("month").subtract(x, "month");
    months_since.push({
      label : temp_month.format("MMM"),
      timestamp : temp_month._d.getTime(),
      views : (compare && listing_info.unlisted) ? Math.round(Math.random() * 5000) + 2500 : 0   //fake traffic numbers if using compare tool
    });
  }

  var views_per_month = [];

  //get real traffic numbers
  if (stats && stats.length > 0){
    var cur_month_needle = 0;
    var referer_dataset = stats.reduce(function (rv, cur) {
      //sort into groups divided by months
      if (cur_month_needle < num_months_since){
        if (cur.timestamp > months_since[cur_month_needle].timestamp){
          months_since[cur_month_needle].views++;
        }
        else {
          cur_month_needle++;
          if (cur_month_needle < num_months_since){
            months_since[cur_month_needle].views++;
          }
        }
      }
    }, []);
  }

  //to add for views for ticker tab
  listing_info.months_since = months_since;

  //reverse the dates
  months_since.reverse();

  var traffic_views = [];
  var traffic_labels = [];
  for (var x = 0; x < months_since.length; x++){
    traffic_views.push(months_since[x].views);
    traffic_labels.push(months_since[x].label);
  }

  return {
    traffic_views : traffic_views,
    traffic_labels : traffic_labels
  }
}

//function to initiate chart only if uninitiated
function createTrafficChart(compare){
  formatted_dataset = formatDataset(listing_info.traffic);

  //hide any overlay
  $("#traffic-overlay").addClass('is-hidden');

  if (traffic_chart){
    traffic_chart.destroy();
  }

  traffic_chart = new Chart($("#traffic-chart"), {
    type: 'line',
    data: {
      labels: formatted_dataset.traffic_labels,
      datasets: [{
        label: "Website Views",
        borderColor: ((listing_info.traffic && listing_info.premium && listing_info.primary_color) || compare) ? listing_info.primary_color : "#3CBC8D",
        backgroundColor: ((listing_info.traffic && listing_info.premium && listing_info.primary_color) || compare) ? hexToRgbA(listing_info.primary_color).replace(",1)", ",.65)") : "rgba(60, 188, 141, 0.65)",
        data: formatted_dataset.traffic_views
      }]
    },
    options: {
      legend: {
        display:false
      },
      hover: {
        mode: "index"
      },
      tooltips: {
        titleSpacing: 0,
        callbacks: {
          label: function(tooltipItems, data) {
            if (formatted_dataset.traffic_labels.indexOf(tooltipItems.xLabel) != -1){
              return tooltipItems.xLabel
            }
            else {
              return moment(tooltipItems.xLabel).format("MMM DD");
            }
          },
          title: function(tooltipItems, data){
            if (tooltipItems[0].datasetIndex == 0 && tooltipItems[0].yLabel == 0){
              return false;
            }
            else if (formatted_dataset.traffic_labels.indexOf(tooltipItems[0].xLabel) != -1){
              return false;
            }
            else {
              return (tooltipItems[0].index == 0) ? "Rental Start" : "Rental End";
            }
          },
          footer: function(tooltipItems, data){
            if (tooltipItems[0].datasetIndex == 0 && tooltipItems[0].yLabel == 0){
              return false;
            }
            else {
              var views_plural = (tooltipItems[0].yLabel == 1) ? " view" : " views";
              var views_formatted = wNumb({
                thousand: ','
              }).to(tooltipItems[0].yLabel);
              return views_formatted + views_plural;
            }
          }
        }
      },
      scales: {
        xAxes: [{
          type: "category"
        }],
        yAxes: [{
          display: true,
          type: 'linear',
          ticks: {
            beginAtZero: true   // minimum value will be 0.
          }
        }]
      }
    }
  });
}

//</editor-fold>

//<editor-fold>-----------------------------------------------------------------------------------ALEXA MODULE

//function to get alexa data
function getAlexaData(){
  $.ajax({
    url: "/listing/" + listing_info.domain_name.toLowerCase() + "/alexa",
    method: "POST"
  }).done(function(data){
    createAlexa(data.alexa);
  });
}

//function to edit alexa information
function createAlexa(alexa){
  if (alexa){
    listing_info.alexa = alexa;

    var globalrank = (alexa.globalRank == "-") ? "Not enough data!" : alexa.globalRank;
    $("#alexa-globalrank").text(globalrank);

    var bouncerate = (alexa.engagement && alexa.engagement.bounceRate == "-") ? "Not enough data!" : alexa.engagement.bounceRate;
    $("#alexa-bouncerate").text(bouncerate);

    var timeonsite = (alexa.engagement && alexa.engagement.dailyTimeOnSite == "-") ? "Not enough data!" : alexa.engagement.dailyTimeOnSite;
    $("#alexa-timeonsite").text(timeonsite);

    var pageviews = (alexa.engagement && alexa.engagement.dailyPageViewPerVisitor == "-") ? "Not enough data!" : alexa.engagement.dailyPageViewPerVisitor;
    $("#alexa-pageviews").text(pageviews);
  }
}

//</editor-fold>

//<editor-fold>-----------------------------------------------------------------------------------INFO MODULE

//other domains by same owner
function findOtherDomains(){
  if (compare && listing_info.unlisted){
    createTestOtherDomains();
  }
  else if ($("#otherowner-domains").length > 0 && !listing_info.unlisted){
    $.ajax({
      url: "/listing/otherowner",
      method: "POST",
      data: {
        owner_id: listing_info.owner_id,
        domain_name_exclude: listing_info.domain_name
      }
    }).done(function(data){
      if (data.state == "success"){
        createOtherDomains(data.listings);
      }
    });
  }
}

//function to create the other domain
function createOtherDomains(other_listings){
  $("#otherowner-domains").removeClass('is-hidden');
  $("#otherowner-domains-title").text("More From This Owner");
  for (var x = 0; x < other_listings.length; x++){
    var cloned_similar_listing = $("#otherowner-domain-clone").clone();
    cloned_similar_listing.removeAttr("id").removeClass('is-hidden');

    //edit it based on new listing info
    if (other_listings[x].domain_name.length > 23){
      var sliced_domain = other_listings[x].domain_name.slice(0,20) + "...";
    }
    else {
      var sliced_domain = other_listings[x].domain_name;
    }

    //available to buy now
    if (other_listings[x].buy_price > 0){
      var buy_price = moneyFormat.to(parseFloat(other_listings[x].buy_price));
      cloned_similar_listing.find(".otherowner-domain-price").text("Buy now - " + buy_price);
    }
    //available to buy at a specific minimum price
    else if (other_listings[x].min_price > 0){
      var min_price = moneyFormat.to(parseFloat(other_listings[x].min_price));
      cloned_similar_listing.find(".otherowner-domain-price").text("For sale - " + min_price);
    }
    //else available for rent
    else if (other_listings[x].rentable && other_listings[x].price_rate > 0){
      cloned_similar_listing.find(".otherowner-domain-price").text("For rent - $" + other_listings[x].price_rate + " / " + other_listings[x].price_type);
    }
    //else available for rent
    else if (other_listings[x].rentable && other_listings[x].price_rate <= 0){
      cloned_similar_listing.find(".otherowner-domain-price").text("For rent - Free");
    }
    //just available (no minimum price, no BIN)
    else if (other_listings[x].status > 0){
      cloned_similar_listing.find(".otherowner-domain-price").text("Now available!");
    }

    //if compare tool
    if (other_listings[x].compare && listing_info.unlisted){
      cloned_similar_listing.find(".otherowner-domain-name").text(sliced_domain).attr("href", "/listing/" + other_listings[x].domain_name + "?compare=true&theme=Random");
    }
    else {
      //premium or basic link
      if (listing_info.premium){
        var link_to_domain = "https://" + other_listings[x].domain_name;
      }
      else {
        var link_to_domain = "https://domahub.com/listing/" + other_listings[x].domain_name;
      }
      cloned_similar_listing.find(".otherowner-domain-name").text(sliced_domain).attr("href", link_to_domain);
    }
    $("#otherowner-domain-table").append(cloned_similar_listing);
  }
}

//</editor-fold>

//<editor-fold>-----------------------------------------------------------------------------------HELPERS

//to cap the first letter
String.prototype.capitalizeFirstLetter = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
}

//get the hostname of a URL
function getHost(href) {
  var l = document.createElement("a");
  l.href = href;
  return l.hostname.replace("www.", "");
};

//function to get query string
function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
  results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function hexToRgbA(hex){
    var c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+',1)';
    }
    throw new Error('Bad Hex');
}

//</editor-fold>
