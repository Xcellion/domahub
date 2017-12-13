var time_chart;
var countries_chart;
var popular_chart;
var channels_chart;

$(document).ready(function() {

  //<editor-fold>-------------------------------PORTFOLIO OVERVIEW / LATEST OFFERS-------------------------------

  updatePortfolioOverviewCounters();
  updateLatestOffers();

  //</editor-fold>

  //<editor-fold>-------------------------------REFERRAL LINK-------------------------------

  $("#referral-link").on("focus", function(){
    $(this).select();
  });

  $("#referral-link-copy").on("click", function(){
    $("#referral-link").select();
    document.execCommand("copy");
    $("#referral-link").blur();
    $(this).find("svg").attr("data-icon", "check");
    $("#referral-link-text").text("Copied!");
  });

  //</editor-fold>

  //<editor-fold>-------------------------------TRAFFIC OVERVIEW-------------------------------

  //when analytics has finished loading
  gapi.analytics.ready(function() {

    //autorize user with google analytics
    gapi.analytics.auth.authorize({
      'serverAuth': {
        'access_token': user.ga_access_token
      }
    });

    //filter out only user listings
    var listing_filters = user.listings.map(function(listing){
      return listing.domain_name;
    }).join("|");
    var listing_regex = new RegExp("^(" + listing_filters + ")");

    buildCharts(listing_regex);

    //change date range
    $("#last-days-select").on("change", function(){
      buildCharts(listing_regex);
    });

    //change stats on time chart (only if different from current)
    $(".stat-wrapper").on("click", function(){
      if (!$(this).hasClass("is-active")){
        $(".stat-wrapper").removeClass("is-active");
        $(this).addClass("is-active");
        var now = moment();
        buildTimeChart(listing_regex, now, "time-chart");
      }
    });

    //refresh charts
    $("#refresh-tables-button").on("click", function(){
      buildCharts(listing_regex);
    });

  });

  //</editor-fold>

});

//<editor-fold>-------------------------------PORTFOLIO OVERVIEW-------------------------------

//update the portfolio with counters
function updatePortfolioOverviewCounters(){

  //find out how many offers per domain
  var num_total_offers = user.listings.reduce(function(arr, listing) {
    return arr + ((listing.offers_count) ? listing.offers_count : 0);
  }, 0) || 0;
  $("#offers-counter").text(num_total_offers);

  //figure out sold domains
  $("#sold-counter").text(user.listings.reduce(function(arr, listing) {
    return (listing.deposited || listing.transferred) ? 1 : 0;
  }, 0));

  //figure out unanswered offers
  $("#offers-counter").text(user.listings.reduce(function(arr, listing) {
    return listing.offers_count || 0;
  }, 0));

  //figure out total unverified
  var num_total_unverified = user.listings.reduce(function(arr, listing) {
    return arr + ((listing.verified) ? 0 : 1);
  }, 0) || 0;
  $("#unverified-counter").text(num_total_unverified);
  if (num_total_unverified > 0){
    $("#unverified-counter").prev(".heading").addClass('is-danger');
  }
}

//update latest offers card
function updateLatestOffers(){
  for (var x = 0 ; x < user.listings.length ; x++){

    //unanswered offers exist!
    if (user.listings.offers_count > 0){
      var offers_clone = $("#offers-clone").clone().removeAttr("id").removeClass('is-hidden');
      offers_clone.find(".offers-domain-name").text(user.listings[x].domain_name);
      var offers_count = user.listings[x].offers_count;
      offers_clone.find(".offers-count").text(user.listings[x].offers_count + ((offers_count == 1) ? " offer" : " offers"));
    }
  }

  //no offers!
  if ($(".offers:not(#offers-clone)").length == 0){
    $("#no-offers").removeClass('is-hidden');
  }
}

//</editor-fold>

//<editor-fold>-------------------------------TRAFFIC OVERVIEW-------------------------------

  //<editor-fold>-------------------------------GOOGLE AUTH-------------------------------

  //extend google embed api "gapi.analytics.report.Data" and wrap it in a promise
  function gaQuery(params) {
    return new Promise(function(resolve, reject) {
      var data = new gapi.analytics.report.Data({query: params});
      data.once('success', function(response) { resolve(response); })
      .once('error', function(response) { reject(response); })
      .execute();
    });
  }

  //</editor-fold>

  //<editor-fold>-------------------------------TIME CHART-------------------------------

  //build the time chart
  function buildTimeChart(listing_regex, now, canvas_id){

    //variables for this chart
    var days_to_go_back = $("#last-days-select").val();
    var stat_to_get = $(".stat-wrapper.is-active").data("stat") || "ga:users";
    var stat_to_get_desc = $(".stat-wrapper.is-active").data("stat-desc") || "Unique Users";
    var average_or_cumulative = $(".stat-wrapper.is-active").data("cumulative");
    var tooltip_type = $(".stat-wrapper.is-active").data("tooltip-type");

    //show loading if chart already exists (for changing date range)
    if (time_chart){
      $("#current-stat-name-loading").text(stat_to_get_desc.toLowerCase());
      showLoadingOrNone(canvas_id, true);
    }

    //build the query promises
    var currentRange = gaQuery({
      'ids': 'ga:141565191',
      'dimensions': 'ga:date',
      'metrics': stat_to_get,
      'start-date': moment(now).day(7).subtract(days_to_go_back, 'day').day(0).format('YYYY-MM-DD'),
      'end-date': moment(now).format('YYYY-MM-DD')
    });
    var lastRange = gaQuery({
      'ids': 'ga:141565191',
      'dimensions': 'ga:date',
      'metrics': stat_to_get,
      'start-date': moment(now).day(0).subtract(days_to_go_back * 2, 'day').day(0).format('YYYY-MM-DD'),
      'end-date': moment(now).day(6).subtract(days_to_go_back, 'day').day(-1).format('YYYY-MM-DD')
    });

    //wait for all promises to finish
    Promise.all([currentRange, lastRange]).then(function(results) {

      //no matching data
      if (results[0].rows.length + results[1].rows.length == 0){
        showLoadingOrNone(canvas_id, false);
      }
      else {

        //extract data
        var data1 = splitTimeHits(results[0].rows, average_or_cumulative);
        var data2 = splitTimeHits(results[1].rows, average_or_cumulative);
        var labels = splitTimeLabels(days_to_go_back, results[0].rows);

        //make chart
        var chartOptions = {
          type : "line",
          options: {
            legend: {
              display: false
            },
            tooltips: {
              mode: 'x-axis',
              callbacks : {
                title : function(tooltipItem, data){
                  return data.labels[tooltipItem[0].index]
                },
                label : function(tooltipItem, data){
                  switch (tooltip_type){
                    case ("time"):
                      var now_rounded = Math.round(tooltipItem.yLabel);
                      return data.datasets[0].label + " : " + Math.floor(now_rounded/60) + "m " + now_rounded%60 + "s";
                      break;
                    case ("percent"):
                      return data.datasets[0].label + " : " + tooltipItem.yLabel + "%";
                      break;
                    default:
                      return data.datasets[0].label + " : " + tooltipItem.yLabel;
                      break;
                  }
                },
                footer : function(tooltipItem, data){
                  var prev_range = (tooltipItem[1]) ? tooltipItem[1].yLabel : 0;
                  var cur_range = (tooltipItem[0]) ? tooltipItem[0].yLabel : 0;
                  var percent_change = Math.round((((cur_range - prev_range) / prev_range) * 100) * 10) / 10;
                  var increase_or_decrease = (percent_change == 0) ? "No change" : ((percent_change > 0) ? "An increase of" : "A decrease of") + " " + Math.abs(percent_change) + "%";
                  return (!isFinite(percent_change) || isNaN(percent_change)) ? "" : (increase_or_decrease);
                }
              }
            },
            scales: {
              xAxes: [{
                ticks: {
                  // only return month axis ticks
                  callback: function(value, index, values){
                    return (value.split(" - ")[0]);
                  }
                }
              }],
              yAxes: [{
                ticks: {
                  suggestedMax: 10,
                  beginAtZero: true,   // minimum value will be 0.
                  callback: function(value, index, values){
                    if (Math.floor(value) === value) {
                        return value;
                    }
                  }
                }
              }]
            }
          },
          data : {
            labels : labels,
            datasets : [
              {
                label: stat_to_get_desc,
                lineTension: 0,
                backgroundColor : 'rgba(60,188,141,0.65)',
                borderColor : 'rgba(60,188,141,1)',
                data : data1
              },
              {
                label: stat_to_get_desc,
                lineTension: 0,
                backgroundColor : 'rgba(220,220,220,0.65)',
                borderColor : 'rgba(220,220,220,1)',
                borderDash : [5],
                data : data2
              }
            ]
          }
        };

        //remove loading
        $("#" + canvas_id + "-overlay").addClass('is-hidden');

        var ctx = document.getElementById(canvas_id).getContext('2d');
        if (time_chart){
          time_chart.destroy();
        }
        time_chart = new Chart(ctx, chartOptions);

        //display current stat name
        $("#current-stat-name").text(stat_to_get_desc);
      }
    });
  }

  //splits GA results array into weekly if past last week
  function splitTimeHits(rows, cumulative, time){
    //past week, no need for split into weekly
    if (rows.length <= 7){
      return rows.map(function(row) { return +row[1]; } );
    }
    //greater than past week (30, 90, 180 days), split to weekly
    else {
      var last_hits = 0;
      return rows.reduce(function(p, c){
        var cur_value = parseFloat(c[1]);
        //if changing weeks
        if (moment(c[0]).day() == 0){
          p.push(last_hits);
          last_hits = cur_value;
        }
        //otherwise add/avg value
        else {
          if (cumulative){
            last_hits += cur_value;
          }
          else if (cur_value != 0){
            last_hits = (last_hits != 0) ? (last_hits + cur_value) / 2 : cur_value;
          }
        }
        return p;
      }, []);
    }
  }

  //splits GA results array into monthly labels
  function splitTimeLabels(days_to_go_back, rows){
    //past week, no need for split into weekly
    if (rows.length <= 7){
      return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    }
    //greater than past week (30, 90, 180 days), split to weekly
    else {
      return rows.reduce(function(p, c, i, a){
        //if changing week
        if (moment(c[0]).days() == 0){
          //format prettily via twix
          var start_this_week = moment(c[0]).day(0)
          var end_this_week = moment(c[0]).day(6)
          var this_week = start_this_week.twix(end_this_week, {allDay: true}).format();
          var start_prev_week = moment(c[0]).day(0).subtract(days_to_go_back, "days").day(0);
          var end_prev_week = moment(c[0]).day(6).subtract(days_to_go_back, "days").day(-1);
          var prev_week = start_prev_week.twix(end_prev_week, {allDay: true}).format();
          p.push(this_week + " vs " + prev_week);
        }
        return p;
      }, []);
    }
  }

  //</editor-fold>

  //<editor-fold>-------------------------------STATS-------------------------------

  //get the 4 numbers for the stats portion
  function buildStats(listing_regex, now){

    //build the query
    gaQuery({
      'ids': 'ga:141565191',
      'dimensions': 'ga:pagePathLevel2',
      'metrics': 'ga:users,ga:sessions,ga:bounceRate,ga:avgSessionDuration,ga:newUsers,ga:percentNewSessions,ga:sessionsPerUser,ga:pageviews',
      'start-date': moment(now).day(7).subtract($("#last-days-select").val(), 'day').day(0).format('YYYY-MM-DD'),
      'end-date': moment(now).format('YYYY-MM-DD')
    }).then(function(results) {

      //sort the results by listing name and filter out not owner domains and sort by domain name
      var listings_data_sorted = results.rows.map(function(row){
        row[0] = row[0].replace(/\//g, "").split("?")[0].toLowerCase();
        return row;
      }).filter(function(row){
        return listing_regex.test(row[0]);
      }).sort(function(a, b){
        return ((a[0] > b[0]) ? -1 : ((a[0] == b[0]) ? 0 : 1));
      });

      var stats_holder = {}
      listings_data_sorted.forEach(function(row){
        stats_holder.users = (stats_holder.users) ? stats_holder.users += parseFloat(row[1]) : parseFloat(row[1]);
        stats_holder.sessions = (stats_holder.sessions) ? stats_holder.sessions += parseFloat(row[2]) : parseFloat(row[2]);
        stats_holder.bounce_rate = (stats_holder.bounce_rate) ? stats_holder.bounce_rate += parseFloat(row[3]) : parseFloat(row[3]);
        stats_holder.session_duration = (stats_holder.session_duration) ? stats_holder.session_duration += parseFloat(row[4]) : parseFloat(row[4]);
        stats_holder.new_users = (stats_holder.new_users) ? stats_holder.new_users += parseFloat(row[5]) : parseFloat(row[5]);
        stats_holder.new_sessions = (stats_holder.new_sessions) ? stats_holder.new_sessions += parseFloat(row[6]) : parseFloat(row[6]);
        stats_holder.sessions_per_user = (stats_holder.sessions_per_user) ? stats_holder.sessions_per_user += parseFloat(row[7]) : parseFloat(row[7]);
        stats_holder.pageviews = (stats_holder.pageviews) ? stats_holder.pageviews += parseFloat(row[8]) : parseFloat(row[8]);
      });

      //averages
      stats_holder.bounce_rate = stats_holder.bounce_rate / listings_data_sorted.length;
      stats_holder.session_duration = stats_holder.session_duration / listings_data_sorted.length;
      stats_holder.new_sessions = stats_holder.new_sessions / listings_data_sorted.length;
      stats_holder.sessions_per_user = stats_holder.sessions_per_user / listings_data_sorted.length;

      //animate the various counters
      numberCountAnimation($("#users-counter"), stats_holder.users, {
        thousand : ",",
        decimals : 0
      });
      numberCountAnimation($("#sessions-counter"), stats_holder.sessions, {
        thousand : ",",
        decimals : 0
      });
      numberCountAnimation($("#bounce-rate-counter"), stats_holder.bounce_rate, {
        postfix : "%",
        decimals : 1
      });
      timeCountAnimation($("#session-duration-counter"), stats_holder.session_duration);
      numberCountAnimation($("#new-users-counter"), stats_holder.new_users, {
        thousand : ",",
        decimals : 0
      });
      numberCountAnimation($("#new-sessions-counter"), stats_holder.new_sessions, {
        postfix : "%",
        decimals : 1
      });
      numberCountAnimation($("#sessions-per-user-counter"), stats_holder.sessions_per_user, {
        thousand : ",",
        decimals : 2
      });
      numberCountAnimation($("#pageviews-counter"), stats_holder.pageviews, {
        thousand : ",",
        decimals : 0
      });
    });
  }

  //count number animation
  function numberCountAnimation(elem, number, wNumb_options){
    elem.prop('Counter', 0).stop().animate({
      Counter: number
    }, {
      duration : 500,
      easing: 'swing',
      step: function (now) {
        $(this).text(wNumb(wNumb_options).to(parseFloat(now)));
      }
    });
  }

  //count time animation
  function timeCountAnimation(elem, number){
    elem.prop('Counter', 0).stop().animate({
      Counter: number
    }, {
      duration : 500,
      easing: 'swing',
      step: function (now) {
        var now_rounded = Math.round(now);
        $(this).text(Math.floor(now_rounded/60) + "m " + now_rounded%60 + "s");
      }
    });
  }

  //</editor-fold>

  //<editor-fold>-------------------------------CHANNELS CHART-------------------------------

  //build the channels chart
  function buildChannelsChart(listing_regex, now, canvas_id){

    //show loading if chart already exists (for changing date range)
    if (channels_chart){
      showLoadingOrNone(canvas_id, true);
    }

    //build the query
    gaQuery({
      'ids': 'ga:141565191',
      'metrics': 'ga:users',
      'dimensions': 'ga:pagePathLevel2,ga:channelGrouping',
      'sort': '-ga:users',
      'start-date': moment(now).day(7).subtract($("#last-days-select").val(), 'day').day(0).format('YYYY-MM-DD'),
      'end-date': moment(now).format('YYYY-MM-DD'),
      'include-empty-rows': false,
      'max-results': 100000
    }).then(function(results) {
      //no matching data
      if (results.totalResults == 0){
        showLoadingOrNone(canvas_id, false);
        if (channels_chart){
          channels_chart.destroy();
        }
      }
      else {
        //extract data
        var data = [];
        var labels = [];
        var backgroundColors = [
          "rgba(60,188,141,0.65)",       //primary
          "rgba(255,87,34,0.65)",        //accent
          "rgba(33,150,243,0.65)",       //info
          "rgba(255,235,59,0.65)",       //yellow
          "rgba(229,57,53,0.65)"         //red
        ];
        var borderColors = [
          "rgba(60,188,141,1)",       //primary
          "rgba(255,87,34,1)",        //accent
          "rgba(33,150,243,1)",       //info
          "rgba(255,235,59,1)",       //yellow
          "rgba(229,57,53,1)"         //red
        ];

        //sort the results by listing name and filter out not owner domains and sort by country name
        var listings_data_sorted = results.rows.map(function(row){
          var domain_name = row[0].replace(/\//g, "").split("?")[0].toLowerCase();
          return [domain_name, row[1], row[2]];
        }).filter(function(row){
          return listing_regex.test(row[0]);
        }).sort(function(a, b){
          return ((a[1] > b[1]) ? -1 : ((a[1] == b[1]) ? 0 : 1));
        });

        //if nothing exists
        if (listings_data_sorted.length == 0){
          showLoadingOrNone(canvas_id, false);
          if (countries_chart){
            countries_chart.destroy();
          }
        }
        else {

          //collapse by country and sort
          var seen = {};
          listings_data_sorted.forEach(function(row) {
            if (seen.hasOwnProperty(row[1])){
              seen[row[1]] += parseFloat(row[2]);
            }
            else {
              seen[row[1]] = parseFloat(row[2]);
            }
          });
          listings_data_sorted = [];
          for (var x in seen){
            listings_data_sorted.push([x, seen[x]]);
          }

          //sort by user count and get top 5
          listings_data_sorted.sort(function(a,b){
            return ((a[1] > b[1]) ? -1 : ((a[1] == b[1]) ? 0 : 1));
          }).slice(0,5).forEach(function(row){
            labels.push(row[0]);
            data.push(row[1]);
          });

          //make chart
          var chartOptions = {
            type : "doughnut",
            options : {
              responsive : true,
              maintainAspectRatio : false,
              legend : {
                position: "bottom"
              }
            },
            data : {
              labels : labels,
              datasets : [
                {
                  data : data,
                  backgroundColor : backgroundColors,
                  borderColor : borderColors
                }
              ]
            }
          };

          //remove loading overlay
          $("#" + canvas_id + "-overlay").addClass('is-hidden');
          if (channels_chart){
            channels_chart.destroy();
          }
          var ctx = document.getElementById(canvas_id).getContext('2d');
          channels_chart = new Chart(ctx, chartOptions);

        }
      }
    });
  }

  //</editor-fold>

  //<editor-fold>-------------------------------COUNTRIES CHART-------------------------------

  //build the countries chart
  function buildCountriesChart(listing_regex, now, canvas_id){

    //show loading if chart already exists (for changing date range)
    if (channels_chart){
      showLoadingOrNone(canvas_id, true);
    }

    //build the query
    gaQuery({
      'ids': 'ga:141565191',
      'metrics': 'ga:users',
      'dimensions': 'ga:pagePathLevel2,ga:country',
      'sort': '-ga:country',
      'start-date': moment(now).day(7).subtract($("#last-days-select").val(), 'day').day(0).format('YYYY-MM-DD'),
      'end-date': moment(now).format('YYYY-MM-DD'),
      'include-empty-rows': false,
      'max-results' : 100000,
    }).then(function(results) {
      //no matching data
      if (results.totalResults == 0){
        showLoadingOrNone(canvas_id, false);
        if (countries_chart){
          countries_chart.destroy();
        }
      }
      else {
        //extract data
        var data = [];
        var labels = [];
        var backgroundColors = [
          "rgba(60,188,141,0.65)",       //primary
          "rgba(255,87,34,0.65)",        //accent
          "rgba(33,150,243,0.65)",       //info
          "rgba(255,235,59,0.65)",       //yellow
          "rgba(229,57,53,0.65)"         //red
        ];
        var borderColors = [
          "rgba(60,188,141,1)",       //primary
          "rgba(255,87,34,1)",        //accent
          "rgba(33,150,243,1)",       //info
          "rgba(255,235,59,1)",       //yellow
          "rgba(229,57,53,1)"         //red
        ];

        //sort the results by listing name and filter out not owner domains and sort by country name
        var listings_data_sorted = results.rows.map(function(row){
          var domain_name = row[0].replace(/\//g, "").split("?")[0].toLowerCase();
          return [domain_name, row[1], row[2]];
        }).filter(function(row){
          return listing_regex.test(row[0]);
        }).sort(function(a, b){
          return ((a[1] > b[1]) ? -1 : ((a[1] == b[1]) ? 0 : 1));
        });

        //if nothing exists
        if (listings_data_sorted.length == 0){
          showLoadingOrNone(canvas_id, false);
          if (countries_chart){
            countries_chart.destroy();
          }
        }
        else {

          //collapse by country and sort
          var seen = {};
          listings_data_sorted.forEach(function(row) {
            if (seen.hasOwnProperty(row[1])){
              seen[row[1]] += parseFloat(row[2]);
            }
            else {
              seen[row[1]] = parseFloat(row[2]);
            }
          });
          listings_data_sorted = [];
          for (var x in seen){
            listings_data_sorted.push([x, seen[x]]);
          }

          //sort by user count and get top 5
          listings_data_sorted.sort(function(a,b){
            return ((a[1] > b[1]) ? -1 : ((a[1] == b[1]) ? 0 : 1));
          }).slice(0,5).forEach(function(row){
            labels.push(row[0]);
            data.push(row[1]);
          });

          //make chart
          var chartOptions = {
            type : "pie",
            options : {
              responsive : true,
              maintainAspectRatio : false,
              legend : {
                position: "bottom"
              }
            },
            data : {
              labels : labels,
              datasets : [
                {
                  data : data,
                  backgroundColor : backgroundColors,
                  borderColor : borderColors
                }
              ]
            }
          };

          //remove loading overlay
          $("#" + canvas_id + "-overlay").addClass('is-hidden');
          if (countries_chart){
            countries_chart.destroy();
          }
          var ctx = document.getElementById(canvas_id).getContext('2d');
          countries_chart = new Chart(ctx, chartOptions);
        }
      }
    });
  }

  //</editor-fold>

  //<editor-fold>-------------------------------POPULAR CHART-------------------------------

  //build the popular chart
  function buildPopularChart(listing_regex, now, canvas_id){

    //show loading if chart already exists (for changing date range)
    if (popular_chart){
      showLoadingOrNone(canvas_id, true);
    }

    //build the query
    gaQuery({
      'ids': 'ga:141565191',
      'metrics': 'ga:users',
      'dimensions': 'ga:pagePathLevel2',
      'sort': '-ga:pagePathLevel2',
      'start-date': moment(now).day(7).subtract($("#last-days-select").val(), 'day').day(0).format('YYYY-MM-DD'),
      'end-date': moment(now).format('YYYY-MM-DD'),
      'include-empty-rows': false,
    }).then(function(results) {
      //no matching data
      if (results.totalResults == 0){
        showLoadingOrNone(canvas_id, false);
        if (popular_chart){
          popular_chart.destroy();
        }
      }
      else {

        //set colors
        var data = [];
        var labels = [];
        var backgroundColors = [
          "rgba(60,188,141,0.65)",       //primary
          "rgba(255,87,34,0.65)",        //accent
          "rgba(33,150,243,0.65)",       //info
          "rgba(255,235,59,0.65)",       //yellow
          "rgba(229,57,53,0.65)"         //red
        ];
        var borderColors = [
          "rgba(60,188,141,1)",       //primary
          "rgba(255,87,34,1)",        //accent
          "rgba(33,150,243,1)",       //info
          "rgba(255,235,59,1)",       //yellow
          "rgba(229,57,53,1)"         //red
        ];

        //sort the results by listing name and filter out not owner domains
        var listings_data_sorted = results.rows.map(function(row){
          var domain_name = row[0].replace(/\//g, "").split("?")[0].toLowerCase();
          return [domain_name, row[1]];
        }).filter(function(row){
          return listing_regex.test(row[0]);
        }).sort(function(a, b){
          return ((a[0] > b[0]) ? -1 : ((a[0] == b[0]) ? 0 : 1));
        });

        //if nothing exists
        if (listings_data_sorted.length == 0){
          showLoadingOrNone(canvas_id, false);
          if (popular_chart){
            popular_chart.destroy();
          }
        }
        else {
          //collapse data by domain name and sort
          var seen = {};
          listings_data_sorted.forEach(function(row) {
            if (seen.hasOwnProperty(row[0])){
              seen[row[0]] += parseFloat(row[1]);
            }
            else {
              seen[row[0]] = parseFloat(row[1]);
            }
          });
          listings_data_sorted = [];
          for (var x in seen){
            listings_data_sorted.push([x, seen[x]]);
          }

          //sort by users and get top 5
          listings_data_sorted.sort(function(a, b){
            return ((a[1] > b[1]) ? -1 : ((a[1] == b[1]) ? 0 : 1));
          }).slice(0, 5).forEach(function(row){
            labels.push(row[0]);
            data.push(row[1]);
          });

          //make chart
          var chartOptions = {
            type : "horizontalBar",
            options : {
              responsive : true,
              maintainAspectRatio : false,
              legend : {
                display: false
              },
              scales: {
                xAxes: [{
                  ticks: {
                    suggestedMax: 5,
                    beginAtZero: true,   // minimum value will be 0.
                    callback: function(value, index, values){
                      if (Math.floor(value) === value) {
                          return value;
                      }
                    }
                  }
                }]
              }
            },
            data : {
              labels : labels,
              datasets : [
                {
                  data : data,
                  backgroundColor : backgroundColors,
                  borderColor : borderColors
                }
              ]
            }
          };

          //remove loading overlay
          $("#" + canvas_id + "-overlay").addClass('is-hidden');

          var ctx = document.getElementById(canvas_id).getContext('2d');
          if (popular_chart){
            popular_chart.destroy();
          }
          popular_chart = new Chart(ctx, chartOptions);
        }
      }
    });
  }

  //</editor-fold>

  //<editor-fold>-------------------------------CHART HELPERS-------------------------------

  //build all charts
  function buildCharts(listing_regex){
    var now = moment();
    buildTimeChart(listing_regex, now, "time-chart");
    buildChannelsChart(listing_regex, now, "channels-chart");
    buildCountriesChart(listing_regex, now, "countries-chart");
    buildPopularChart(listing_regex, now, "popular-chart");
    buildStats(listing_regex, now);
  }

  //show loading message or no data message per chart
  function showLoadingOrNone(canvas_id, loading){
    $("#" + canvas_id + "-overlay").removeClass('is-hidden');

    //show loading
    if (loading){
      $("#" + canvas_id + "-overlay-none").addClass('is-hidden');
      $("#" + canvas_id + "-overlay-load").removeClass('is-hidden');
    }
    //show no data
    else {
      $("#" + canvas_id + "-overlay-none").removeClass('is-hidden');
      $("#" + canvas_id + "-overlay-load").addClass('is-hidden');
    }
  }

  //</editor-fold>

//</editor-fold>
