var time_chart;
var countries_chart;
var channels_chart;
var popular_chart;
var refreshing_charts = false;

$(document).ready(function () {
  referralLinkCopy();

  //#region -------------------------------ANNOUNCEMENT-------------------------------

  //close announcement if already closed it
  if (readCookie("announcement")) {
    $("#announcement-modal").removeClass("is-active");
  } else {
    $("#announcement-modal").addClass("is-active");
  }

  //#endregion

  //#region -------------------------------PORTFOLIO OVERVIEW / LATEST OFFERS-------------------------------

  updatePortfolioOverviewCounters();

  //#endregion

  //#region -------------------------------TRAFFIC OVERVIEW-------------------------------

  //when analytics has finished loading
  gapi.analytics.ready(function () {
    //authorize user with google analytics and then build all charts
    googleAuthAndBuildCharts();

    //set up tutorial if step # is 12
    if (user.onboarding_step == 12) {
      setupDomaTutorial();
    }
  });

  //#endregion
});

//#region -------------------------------PORTFOLIO OVERVIEW-------------------------------

//handle referral link copy
function referralLinkCopy() {
  $("#referral-link").on("focus", function () {
    $(this).select();
  });
  $("#referral-link-copy").on("click", function () {
    $("#referral-link").select();
    document.execCommand("copy");
    $("#referral-link").blur();
    $(this).find("svg").attr("data-icon", "check");
    $("#referral-link-text").text("Copied!");
  });
}

//update the portfolio with counters
function updatePortfolioOverviewCounters() {
  //find out how many offers per domain
  var num_total_offers =
    user.listings.reduce(function (arr, listing) {
      return arr + (listing.offers_count ? listing.offers_count : 0);
    }, 0) || 0;
  $("#offers-counter").text(num_total_offers);

  //figure out sold domains
  $("#sold-counter").text(
    user.listings.reduce(function (arr, listing) {
      return arr + (listing.deposited || listing.transferred ? 1 : 0);
    }, 0)
  );

  //figure out unanswered offers
  $("#offers-counter").text(
    user.listings.reduce(function (arr, listing) {
      return arr + (listing.offers_count || 0);
    }, 0)
  );

  //figure out total unverified
  var num_total_unverified =
    user.listings.reduce(function (arr, listing) {
      return arr + (listing.verified ? 0 : 1);
    }, 0) || 0;
  $("#unverified-counter").text(num_total_unverified);
  if (num_total_unverified > 0) {
    $("#unverified-counter");
  }

  //figure out total expiring
  var num_total_expiring =
    user.listings.reduce(function (arr, listing) {
      if (moment(listing.date_expire).diff(moment(), "day") <= 30) {
        return arr + 1;
      } else {
        return arr;
      }
    }, 0) || 0;
  $("#expiring-counter").text(num_total_expiring);
  if (num_total_expiring > 0) {
    $("#expiring-counter");
  }

  // initialize totals
  var total_revenue = 0;
  var total_expenses = 0;
  var total_profit = 0;

  // iterate over transactions
  if (user.transactions) {
    for (var x = 0; x < user.transactions.length; x++) {
      var transaction = user.transactions[x];

      // set fees and transaction cost
      var doma_fees = transaction.doma_fees || 0;
      var payment_fees = transaction.payment_fees || 0;
      var transaction_cost = transaction.transaction_cost || 0;
      var transaction_cost_refunded =
        transaction.transaction_cost_refunded || 0;

      // check for non-expense transactions (revenue-generating)
      if (transaction.transaction_type !== "expense") {
        if (transaction_cost > 0 && transaction_cost_refunded <= 0) {
          total_revenue += transaction_cost; // add transaction cost to revenue
          total_expenses -= doma_fees + payment_fees; // subtract fees from expenses (negative)
          total_profit += transaction_cost - (doma_fees + payment_fees); // calculate profit per transaction
        }
      } else {
        // for expense transactions
        total_expenses -= transaction_cost; // subtract expense (negative)
        total_profit -= transaction_cost; // subtract expense from profit
      }
    }

    // final profit calculation
    total_profit = total_revenue + total_expenses; // total_expenses is negative now
  }

  $("#revenue-counter")
    .addClass("is-primary")
    .text(formatCurrency(total_revenue / 100));

  //total expense counter
  $("#expenses-counter").text(formatCurrency(total_expenses / 100));
  if (total_expenses < 0) {
    $("#expenses-counter").addClass("is-danger");
  }

  //total profit counter
  $("#profit-counter").text(formatCurrency(total_profit / 100));
  if (total_profit < 0) {
    $("#profit-counter").addClass("is-danger");
  } else if (total_profit > 0) {
    $("#profit-counter").addClass("is-primary");
  }
}

//to format a number for currency
function formatCurrency(number) {
  var default_currency_details =
    currency_codes[user.default_currency.toUpperCase()];
  var currency_details = {
    thousand: ",",
    decimals: default_currency_details.fractionSize,
  };

  //right aligned symbol
  if (default_currency_details.symbol && default_currency_details.symbol.rtl) {
    currency_details.suffix = default_currency_details.symbol.grapheme;
  } else if (
    default_currency_details.symbol &&
    !default_currency_details.symbol.rtl
  ) {
    currency_details.prefix = default_currency_details.symbol.grapheme;
  }

  return wNumb(currency_details).to(number);
}

//#endregion

//#region -------------------------------TRAFFIC OVERVIEW-------------------------------

//#region -------------------------------GOOGLE AUTH-------------------------------

//authorize user with google analytics and then build all charts
function googleAuthAndBuildCharts() {
  // gapi.analytics.auth.authorize({
  //   'serverAuth': {
  //     'access_token': user.ga_access_token
  //   }
  // });

  //filter out only user listings
  var listing_filters = user.listings
    .map(function (listing) {
      return listing.domain_name.toLowerCase();
    })
    .join("|");
  var listing_regex =
    user.listings.length > 0
      ? new RegExp("^(" + listing_filters + ")")
      : new RegExp("(?!)");

  buildCharts(listing_regex);

  //change date range
  $("#last-days-select")
    .off()
    .on("change", function () {
      buildCharts(listing_regex);
    });

  //change stats on time chart (only if different from current)
  $(".stat-wrapper")
    .off()
    .on("click", function () {
      if (!$(this).hasClass("is-active")) {
        $(".stat-wrapper").removeClass("is-active");
        $(this).addClass("is-active");
        var now = moment();
        buildTimeChart(listing_regex, now, "time-chart");
      }
    });

  //refresh charts
  $("#refresh-tables-button")
    .off()
    .on("click", function () {
      buildCharts(listing_regex);
    });
}

//extend google embed api "gapi.analytics.report.Data" and wrap it in a promise
function gaQuery(params) {
  return new Promise(function (resolve, reject) {
    var data = new gapi.analytics.report.Data({ query: params });
    data
      .once("success", function (response) {
        resolve(response);
      })
      .once("error", function (response) {
        reject(response);
      })
      .execute();
  });
}

//error handler for google
var gaErrorHandler = (function () {
  var executed = false;
  return function () {
    if (!executed) {
      executed = true;
      $.ajax({
        url: "/profile/refreshGoogleAPI",
        method: "POST",
      }).done(function (data) {
        location.reload();
      });
    }
  };
})();

//#endregion

//#region -------------------------------TIME CHART-------------------------------

//build the time chart
function buildTimeChart(listing_regex, now, canvas_id) {
  //#region old code for when Google Analytics was used

  // //variables for this chart
  // var days_to_go_back = $("#last-days-select").val();
  // var stat_to_get = $(".stat-wrapper.is-active").data("stat") || "ga:users";
  // var stat_to_get_desc = $(".stat-wrapper.is-active").data("stat-desc") || "Unique Users";
  // var average = !$(".stat-wrapper.is-active").data("additive");
  // var tooltip_type = $(".stat-wrapper.is-active").data("tooltip-type");

  // //show loading if chart already exists (for changing date range)
  // if (time_chart){
  //   $("#current-stat-name-loading").text(stat_to_get_desc.toLowerCase());
  //   showLoadingOrNone(canvas_id, true);
  // }

  // //start and end times for the two queries
  // var start_time_1 = moment(now).day(7).subtract(days_to_go_back, 'day').day(0);
  // var end_time_1 = moment(now);
  // var start_time_2 = moment(now).day(0).subtract(days_to_go_back * 2, 'day').day(0);
  // var end_time_2 = moment(now).day(6).subtract(days_to_go_back, 'day').day(-1);

  // //build the query promises
  // var currentRange = gaQuery({
  //   'ids': 'ga:141565191',
  //   'dimensions': 'ga:pagePathLevel2,ga:date',
  //   'metrics': stat_to_get,
  //   'start-date': start_time_1.format('YYYY-MM-DD'),
  //   'end-date': end_time_1.format('YYYY-MM-DD'),
  //   "max-results": 100000
  // });
  // var lastRange = gaQuery({
  //   'ids': 'ga:141565191',
  //   'dimensions': 'ga:pagePathLevel2,ga:date',
  //   'metrics': stat_to_get,
  //   'start-date': start_time_2.format('YYYY-MM-DD'),
  //   'end-date': end_time_2.format('YYYY-MM-DD'),
  //   "max-results": 100000
  // });

  // showLoadingOrNone(canvas_id, false);

  // //wait for all promises to finish
  // Promise.all([currentRange, lastRange]).then(function(results) {
  //
  //   //analyze data, remove non-owned domains, add 0 count days
  //   var parsed_data_1 = removeUnownedAddZeroCounts(start_time_1, end_time_1, results[0].rows, listing_regex, average);
  //   var parsed_data_2 = removeUnownedAddZeroCounts(start_time_2, end_time_2, results[1].rows, listing_regex, average);
  //
  //   //no matching data
  //   if (parsed_data_1.length + parsed_data_2.length == 0){
  //     showLoadingOrNone(canvas_id, false);
  //   }
  //   else {
  //     //split data into weekly sets (if necessary)
  //     var chart_data1 = splitDataToWeekly(days_to_go_back, parsed_data_1, average);
  //     var chart_data2 = splitDataToWeekly(days_to_go_back, parsed_data_2, average);
  //     var chart_labels = createChartLabels(days_to_go_back, parsed_data_1);
  //
  //     //declare some global font styling
  //     Chart.defaults.global.defaultFontFamily = "'Nunito Sans', 'Helvetica', sans-serif";
  //     Chart.defaults.global.defaultFontSize = 14;
  //
  //     //make chart
  //     var chartOptions = {
  //       type : "line",
  //       options: {
  //         maintainAspectRatio: false,
  //         layout: {
  //           padding: {
  //             top: 20,
  //             bottom: 20,
  //             left: 0,
  //             right: 0
  //           }
  //         },
  //         legend: {
  //           display: false
  //         },
  //         tooltips: {
  //           mode: 'x-axis',
  //           backgroundColor: 'rgba(17, 17, 17, 0.9)',
  //           xPadding: 12,
  //           yPadding: 12,
  //           bodySpacing: 10,
  //           titleMarginBottom: 10,
  //           callbacks : {
  //             title : function(tooltipItem, data){
  //               return data.labels[tooltipItem[0].index]
  //             },
  //             label : function(tooltipItem, data){
  //               switch (tooltip_type){
  //                 case ("time"):
  //                   var now_rounded = Math.round(tooltipItem.yLabel);
  //                   return data.datasets[0].label + " : " + Math.floor(now_rounded/60) + "m " + now_rounded%60 + "s";
  //                   break;
  //                 case ("percent"):
  //                   return data.datasets[0].label + " : " + parseFloat(tooltipItem.yLabel).toFixed(2) + "%";
  //                   break;
  //                 case ("sessionsPerUser"):
  //                   return data.datasets[0].label + " : " + parseFloat(tooltipItem.yLabel).toFixed(2);
  //                   break;
  //                 default:
  //                   return data.datasets[0].label + " : " + tooltipItem.yLabel;
  //                   break;
  //               }
  //             },
  //             footer : function(tooltipItem, data){
  //               var prev_range = (tooltipItem[1]) ? tooltipItem[1].yLabel : 0;
  //               var cur_range = (tooltipItem[0]) ? tooltipItem[0].yLabel : 0;
  //               var percent_change = Math.round((((cur_range - prev_range) / prev_range) * 100) * 10) / 10;
  //               var increase_or_decrease = (percent_change == 0) ? "No change" : ((percent_change > 0) ? "An increase of" : "A decrease of") + " " + Math.abs(percent_change).toFixed(2) + "%";
  //               return (!isFinite(percent_change) || isNaN(percent_change)) ? "" : (increase_or_decrease);
  //             }
  //           }
  //         },
  //         scales: {
  //           xAxes: [{
  //             gridLines : {
  //                 display : false,
  //             },
  //             ticks: {
  //               fontStyle: 400,
  //               fontColor: 'rgba(0,0,0,0.66)',
  //               padding: 10,
  //               // only return month axis ticks
  //               callback: function(value, index, values){
  //                 return (value.split(" - ")[0]);
  //               }
  //             }
  //           }],
  //           yAxes: [{
  //             gridLines : {
  //               color: '#f6f9fc',
  //               lineWidth: 2,
  //               drawBorder: false,
  //               drawTicks: false
  //             },
  //             ticks: {
  //               fontStyle: 400,
  //               fontColor: 'rgba(0,0,0,0.66)',
  //               padding: 20,
  //               suggestedMax: 5,
  //               beginAtZero: true,   // minimum value will be 0.
  //               callback: function(value, index, values){
  //                 if (Math.floor(value) === value) {
  //                     return value;
  //                 }
  //               }
  //             }
  //           }]
  //         }
  //       },
  //       data : {
  //         labels : chart_labels,
  //         datasets : [
  //           {
  //             label: stat_to_get_desc,
  //             backgroundColor : 'rgba(60,188,141,0.2)',
  //             borderColor : 'rgba(60,188,141,1)',
  //             borderWidth: 4,
  //             pointBackgroundColor: '#fff',
  //             pointBorderColor: 'rgba(60,188,141,1)',
  //             pointBorderWidth: 4,
  //             pointHoverRadius: 6,
  //             pointHoverBorderWidth: 3,
  //             pointHoverBackgroundColor: "#fff",
  //             pointRadius: 5,
  //             data : chart_data1
  //           },
  //           {
  //             label: stat_to_get_desc,
  //             backgroundColor: 'rgba(210,210,210,0.1)',
  //             borderColor : 'rgba(0,0,0,0.4)',
  //             borderWidth: 2,
  //             borderDash: [5,5],
  //             pointBackgroundColor: '#fff',
  //             pointBorderColor: 'rgba(0,0,0,0.4)',
  //             pointBorderWidth: 4,
  //             pointHoverRadius: 6,
  //             pointHoverBorderWidth: 3,
  //             pointHoverBackgroundColor: "#fff",
  //             pointRadius: 5,
  //             data : chart_data2
  //           }
  //         ]
  //       }
  //     };
  //
  //     //remove loading
  //     $("#" + canvas_id + "-overlay").addClass('is-hidden');
  //
  //     var ctx = document.getElementById(canvas_id).getContext('2d');
  //     if (time_chart){
  //       time_chart.destroy();
  //     }
  //     time_chart = new Chart(ctx, chartOptions);
  //
  //     //display current stat name
  //     $("#current-stat-name").text(stat_to_get_desc);
  //   }
  // }).catch(function(err){
  //   gaErrorHandler(err);
  // });

  // #endregion

  //variables for this chart
  var days_to_go_back = $("#last-days-select").val();
  var stat_to_get_desc =
    $(".stat-wrapper.is-active").data("stat-desc") || "Unique Users";
  var average = !$(".stat-wrapper.is-active").data("additive");
  var tooltip_type = $(".stat-wrapper.is-active").data("tooltip-type");

  //show loading if chart already exists (for changing date range)
  if (time_chart) {
    $("#current-stat-name-loading").text(stat_to_get_desc.toLowerCase());
    showLoadingOrNone(canvas_id, true);
  }

  //generate random dummy data for two ranges
  function generateDummyData(days) {
    return Array.from({ length: days }, () => Math.floor(Math.random() * 100));
  }

  var chart_data1 = generateDummyData(days_to_go_back);
  var chart_data2 = generateDummyData(days_to_go_back);
  var chart_labels = Array.from(
    { length: days_to_go_back },
    (v, i) => `Day ${i + 1}`
  );

  //declare some global font styling
  Chart.defaults.global.defaultFontFamily =
    "'Nunito Sans', 'Helvetica', sans-serif";
  Chart.defaults.global.defaultFontSize = 14;

  //make chart
  var chartOptions = {
    type: "line",
    options: {
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 20,
          bottom: 20,
          left: 0,
          right: 0,
        },
      },
      legend: {
        display: false,
      },
      tooltips: {
        mode: "x-axis",
        backgroundColor: "rgba(17, 17, 17, 0.9)",
        xPadding: 12,
        yPadding: 12,
        bodySpacing: 10,
        titleMarginBottom: 10,
        callbacks: {
          title: function (tooltipItem, data) {
            return data.labels[tooltipItem[0].index];
          },
          label: function (tooltipItem, data) {
            return data.datasets[0].label + " : " + tooltipItem.yLabel;
          },
        },
      },
      scales: {
        xAxes: [
          {
            gridLines: {
              display: false,
            },
            ticks: {
              fontStyle: 400,
              fontColor: "rgba(0,0,0,0.66)",
              padding: 10,
            },
          },
        ],
        yAxes: [
          {
            gridLines: {
              color: "#f6f9fc",
              lineWidth: 2,
              drawBorder: false,
              drawTicks: false,
            },
            ticks: {
              fontStyle: 400,
              fontColor: "rgba(0,0,0,0.66)",
              padding: 20,
              suggestedMax: 100,
              beginAtZero: true,
            },
          },
        ],
      },
    },
    data: {
      labels: chart_labels,
      datasets: [
        {
          label: stat_to_get_desc,
          backgroundColor: "rgba(60,188,141,0.2)",
          borderColor: "rgba(60,188,141,1)",
          borderWidth: 4,
          pointBackgroundColor: "#fff",
          pointBorderColor: "rgba(60,188,141,1)",
          pointBorderWidth: 4,
          pointHoverRadius: 6,
          pointHoverBorderWidth: 3,
          pointHoverBackgroundColor: "#fff",
          pointRadius: 5,
          data: chart_data1,
        },
        {
          label: stat_to_get_desc,
          backgroundColor: "rgba(210,210,210,0.1)",
          borderColor: "rgba(0,0,0,0.4)",
          borderWidth: 2,
          borderDash: [5, 5],
          pointBackgroundColor: "#fff",
          pointBorderColor: "rgba(0,0,0,0.4)",
          pointBorderWidth: 4,
          pointHoverRadius: 6,
          pointHoverBorderWidth: 3,
          pointHoverBackgroundColor: "#fff",
          pointRadius: 5,
          data: chart_data2,
        },
      ],
    },
  };

  //remove loading
  $("#" + canvas_id + "-overlay").addClass("is-hidden");

  var ctx = document.getElementById(canvas_id).getContext("2d");
  if (time_chart) {
    time_chart.destroy();
  }
  time_chart = new Chart(ctx, chartOptions);

  //display current stat name
  $("#current-stat-name").text(stat_to_get_desc);
}

//analyze data, remove non-owned domains, add 0 count days
function removeUnownedAddZeroCounts(
  start_time,
  end_time,
  rows,
  listing_regex,
  average
) {
  //create empty hash tables with 0 count for all days for past X days
  var empty_daily_hash_table = {};
  for (var x = 0; x <= end_time.diff(start_time, "days"); x++) {
    if (average) {
      empty_daily_hash_table[
        moment(start_time).add(x, "day").format("YYYYMMDD")
      ] = {
        value: 0,
        count: 0,
      };
    } else {
      empty_daily_hash_table[
        moment(start_time).add(x, "day").format("YYYYMMDD")
      ] = 0;
    }
  }

  //filter out not owned domains and add counts to above hashtable
  rows
    .map(function (row) {
      row[0] = row[0].replace(/\//g, "").split("?")[0].toLowerCase();
      return row;
    })
    .filter(function (row) {
      return listing_regex.test(row[0]);
    })
    .forEach(function (row) {
      if (average) {
        empty_daily_hash_table[row[1]].value += parseFloat(row[2]);
        empty_daily_hash_table[row[1]].count += parseFloat(row[3]);
      } else {
        empty_daily_hash_table[row[1]] += parseFloat(row[2]);
      }
    });

  //rebuild array from hash
  var parsed_array = [];
  for (var x in empty_daily_hash_table) {
    if (average) {
      parsed_array.push([
        x,
        empty_daily_hash_table[x].value,
        empty_daily_hash_table[x].count,
      ]);
    } else {
      parsed_array.push([x, empty_daily_hash_table[x]]);
    }
  }
  return parsed_array;
}

//splits GA results array into weekly if past last week
function splitDataToWeekly(days_to_go_back, rows, average) {
  //past week, no need for split into weekly
  if (days_to_go_back <= 7) {
    return rows.map(function (row) {
      return +row[1];
    });
  }
  //greater than past week (30, 90, 180 days), split to weekly
  else {
    var average_counter = 0;
    var seen = {};
    var average_counter = {};
    rows.forEach(function (row) {
      //if changing weeks
      if (moment(row[0]).day() == 0) {
        seen[row[0]] = seen[row[0]]
          ? (seen[row[0]] += parseFloat(row[1]))
          : parseFloat(row[1]);
        if (average && parseFloat(row[1]) != 0) {
          average_counter[row[0]] = parseFloat(row[2]);
        }
      }
      //otherwise add/avg value
      else {
        var beginning_of_week = moment(row[0]).day(0).format("YYYYMMDD");
        seen[beginning_of_week] += parseFloat(row[1]);
        if (average && parseFloat(row[1]) != 0) {
          average_counter[beginning_of_week] = average_counter[
            beginning_of_week
          ]
            ? (average_counter[beginning_of_week] += parseFloat(row[2]))
            : parseFloat(row[2]);
        }
      }
    });

    var hits_split = [];
    for (var x in seen) {
      if (average) {
        hits_split.push(
          seen[x] / (average_counter[x] ? average_counter[x] : 1)
        );
      } else {
        hits_split.push(seen[x]);
      }
    }
    return hits_split;
  }
}

//splits GA results array into monthly labels
function createChartLabels(days_to_go_back, rows) {
  //past week, no need for split into weekly
  if (days_to_go_back <= 7) {
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  }
  //greater than past week (30, 90, 180 days), split to weekly
  else {
    return rows.reduce(function (p, c, i, a) {
      //if changing week
      if (moment(c[0]).days() == 0) {
        //format prettily via twix
        var start_this_week = moment(c[0]).day(0);
        var end_this_week = moment(c[0]).day(6);
        var this_week = start_this_week
          .twix(end_this_week, { allDay: true })
          .format();
        var start_prev_week = moment(c[0])
          .day(0)
          .subtract(days_to_go_back, "days")
          .day(0);
        var end_prev_week = moment(c[0])
          .day(6)
          .subtract(days_to_go_back, "days")
          .day(-1);
        var prev_week = start_prev_week
          .twix(end_prev_week, { allDay: true })
          .format();
        p.push(this_week + " vs " + prev_week);
      }
      return p;
    }, []);
  }
}

//#endregion

//#region -------------------------------STATS-------------------------------

//get the 4 numbers for the stats portion
function buildStats(listing_regex, now) {
  // #region old code for when Google Analytics was used

  //build the query
  gaQuery({
    ids: "ga:141565191",
    dimensions: "ga:pagePathLevel2",
    metrics:
      "ga:users,ga:sessions,ga:bounceRate,ga:avgSessionDuration,ga:newUsers,ga:pageviews",
    "start-date": moment(now)
      .day(7)
      .subtract($("#last-days-select").val(), "day")
      .day(0)
      .format("YYYY-MM-DD"),
    "end-date": moment(now).format("YYYY-MM-DD"),
  })
    .then(function (results) {
      //sort the results by listing name and filter out not owner domains and sort by domain name
      var listings_data_sorted = results.rows
        .map(function (row) {
          row[0] = row[0].replace(/\//g, "").split("?")[0].toLowerCase();
          return row;
        })
        .filter(function (row) {
          return listing_regex.test(row[0]);
        })
        .sort(function (a, b) {
          return a[0] > b[0] ? -1 : a[0] == b[0] ? 0 : 1;
        });

      var stats_holder = {};
      listings_data_sorted.forEach(function (row) {
        stats_holder.users = stats_holder.users
          ? (stats_holder.users += parseFloat(row[1]))
          : parseFloat(row[1]);
        stats_holder.sessions = stats_holder.sessions
          ? (stats_holder.sessions += parseFloat(row[2]))
          : parseFloat(row[2]);
        stats_holder.bounce_rate = stats_holder.bounce_rate
          ? (stats_holder.bounce_rate +=
              parseFloat(row[3]) * parseFloat(row[2]))
          : parseFloat(row[3]) * parseFloat(row[2]);
        stats_holder.session_duration = stats_holder.session_duration
          ? (stats_holder.session_duration +=
              parseFloat(row[4]) * parseFloat(row[2]))
          : parseFloat(row[4]) * parseFloat(row[2]);
        stats_holder.new_users = stats_holder.new_users
          ? (stats_holder.new_users += parseFloat(row[5]))
          : parseFloat(row[5]);
        stats_holder.pageviews = stats_holder.pageviews
          ? (stats_holder.pageviews += parseFloat(row[6]))
          : parseFloat(row[6]);
      });

      //averages
      stats_holder.bounce_rate =
        stats_holder.bounce_rate / stats_holder.sessions;
      stats_holder.session_duration =
        stats_holder.session_duration / stats_holder.sessions;
      stats_holder.new_sessions = (
        (stats_holder.new_users / stats_holder.sessions) *
        100
      ).toFixed(2);
      stats_holder.sessions_per_user =
        stats_holder.sessions / stats_holder.users;

      //if missing data
      for (var x in stats_holder) {
        if (
          !stats_holder[x] ||
          typeof stats_holder[x] == "undefined" ||
          isNaN(stats_holder[x])
        ) {
          stats_holder[x] = 0;
        }
      }

      //animate the various counters
      numberCountAnimation($("#users-counter"), stats_holder.users || 0, {
        thousand: ",",
        decimals: 0,
      });
      numberCountAnimation($("#sessions-counter"), stats_holder.sessions || 0, {
        thousand: ",",
        decimals: 0,
      });
      numberCountAnimation(
        $("#bounce-rate-counter"),
        stats_holder.bounce_rate || 0,
        {
          postfix: "%",
          decimals: 1,
        }
      );
      timeCountAnimation(
        $("#session-duration-counter"),
        stats_holder.session_duration || 0
      );
      numberCountAnimation(
        $("#new-users-counter"),
        stats_holder.new_users || 0,
        {
          thousand: ",",
          decimals: 0,
        }
      );
      numberCountAnimation(
        $("#new-sessions-counter"),
        stats_holder.new_sessions || 0,
        {
          postfix: "%",
          decimals: 1,
        }
      );
      numberCountAnimation(
        $("#sessions-per-user-counter"),
        stats_holder.sessions_per_user || 0,
        {
          thousand: ",",
          decimals: 2,
        }
      );
      numberCountAnimation(
        $("#pageviews-counter"),
        stats_holder.pageviews || 0,
        {
          thousand: ",",
          decimals: 0,
        }
      );
    })
    .catch(function (err) {
      gaErrorHandler(err);
    });

  // #endregion

  //generate random dummy data
  var stats_holder = {
    users: Math.floor(Math.random() * 1000),
    sessions: Math.floor(Math.random() * 2000),
    bounce_rate: Math.random() * 100,
    session_duration: Math.random() * 300, // duration in seconds
    new_users: Math.floor(Math.random() * 800),
    pageviews: Math.floor(Math.random() * 5000),
  };

  //calculate additional stats
  stats_holder.new_sessions = (
    (stats_holder.new_users / stats_holder.sessions) *
    100
  ).toFixed(2);
  stats_holder.sessions_per_user = stats_holder.sessions / stats_holder.users;

  //animate the various counters
  numberCountAnimation($("#users-counter"), stats_holder.users || 0, {
    thousand: ",",
    decimals: 0,
  });
  numberCountAnimation($("#sessions-counter"), stats_holder.sessions || 0, {
    thousand: ",",
    decimals: 0,
  });
  numberCountAnimation(
    $("#bounce-rate-counter"),
    stats_holder.bounce_rate || 0,
    {
      postfix: "%",
      decimals: 1,
    }
  );
  timeCountAnimation(
    $("#session-duration-counter"),
    stats_holder.session_duration || 0
  );
  numberCountAnimation($("#new-users-counter"), stats_holder.new_users || 0, {
    thousand: ",",
    decimals: 0,
  });
  numberCountAnimation(
    $("#new-sessions-counter"),
    stats_holder.new_sessions || 0,
    {
      postfix: "%",
      decimals: 1,
    }
  );
  numberCountAnimation(
    $("#sessions-per-user-counter"),
    stats_holder.sessions_per_user || 0,
    {
      thousand: ",",
      decimals: 2,
    }
  );
  numberCountAnimation($("#pageviews-counter"), stats_holder.pageviews || 0, {
    thousand: ",",
    decimals: 0,
  });
}

//count number animation
function numberCountAnimation(elem, number, wNumb_options) {
  elem
    .prop("Counter", 0)
    .stop()
    .animate(
      {
        Counter: number,
      },
      {
        duration: 500,
        easing: "swing",
        step: function (now) {
          $(this).text(wNumb(wNumb_options).to(parseFloat(now)));
        },
      }
    );
}

//count time animation
function timeCountAnimation(elem, number) {
  elem
    .prop("Counter", 0)
    .stop()
    .animate(
      {
        Counter: number,
      },
      {
        duration: 500,
        easing: "swing",
        step: function (now) {
          var now_rounded = Math.round(now);
          $(this).text(
            Math.floor(now_rounded / 60) + "m " + (now_rounded % 60) + "s"
          );
        },
      }
    );
}

//#endregion

//#region -------------------------------CHANNELS CHART-------------------------------

//build the channels chart
function buildChannelsChart(listing_regex, now, canvas_id) {
  //show loading if chart already exists (for changing date range)
  if (channels_chart) {
    showLoadingOrNone(canvas_id, true);
  }

  showLoadingOrNone(canvas_id, false);

  // #region old code for when Google Analytics was used

  // gaQuery({
  //   'ids': 'ga:141565191',
  //   'metrics': 'ga:users',
  //   'dimensions': 'ga:pagePathLevel2,ga:channelGrouping',
  //   'sort': '-ga:users',
  //   'start-date': moment(now).day(7).subtract($("#last-days-select").val(), 'day').day(0).format('YYYY-MM-DD'),
  //   'end-date': moment(now).format('YYYY-MM-DD'),
  //   'include-empty-rows': false,
  //   'max-results': 100000
  // }).then(function(results) {
  //   //no matching data
  //   if (results.totalResults == 0){
  //     showLoadingOrNone(canvas_id, false);
  //     if (channels_chart){
  //       channels_chart.destroy();
  //     }
  //   }
  //   else {
  //     //extract data
  //     var data = [];
  //     var labels = [];
  //     var backgroundColors = [
  //       "#00bfa5",
  //       "#F38181",
  //       "#FCE38A",
  //       "#3F4B83",
  //       "#95E1D3"
  //     ];
  //
  //     //sort the results by listing name and filter out not owner domains and sort by country name
  //     var listings_data_sorted = results.rows.map(function(row){
  //       var domain_name = row[0].replace(/\//g, "").split("?")[0].toLowerCase();
  //       return [domain_name, row[1], row[2]];
  //     }).filter(function(row){
  //       return listing_regex.test(row[0]);
  //     }).sort(function(a, b){
  //       return ((a[1] > b[1]) ? -1 : ((a[1] == b[1]) ? 0 : 1));
  //     });
  //
  //     //if nothing exists
  //     if (listings_data_sorted.length == 0){
  //       showLoadingOrNone(canvas_id, false);
  //       if (countries_chart){
  //         countries_chart.destroy();
  //       }
  //     }
  //     else {
  //
  //       //collapse by country and sort
  //       var seen = {};
  //       listings_data_sorted.forEach(function(row) {
  //         if (seen.hasOwnProperty(row[1])){
  //           seen[row[1]] += parseFloat(row[2]);
  //         }
  //         else {
  //           seen[row[1]] = parseFloat(row[2]);
  //         }
  //       });
  //       listings_data_sorted = [];
  //       for (var x in seen){
  //         listings_data_sorted.push([x, seen[x]]);
  //       }
  //
  //       //sort by user count and get top 5
  //       listings_data_sorted.sort(function(a,b){
  //         return ((a[1] > b[1]) ? -1 : ((a[1] == b[1]) ? 0 : 1));
  //       }).slice(0,5).forEach(function(row){
  //         labels.push(row[0]);
  //         data.push(row[1]);
  //       });
  //
  //       //make chart
  //       var chartOptions = {
  //         type : "doughnut",
  //         options : {
  //           responsive : true,
  //           maintainAspectRatio : false,
  //           legend : {
  //             position: "left"
  //           },
  //           tooltips: {
  //             backgroundColor: 'rgba(17, 17, 17, 0.9)',
  //             xPadding: 10,
  //             yPadding: 10
  //           }
  //         },
  //         data : {
  //           labels : labels,
  //           datasets : [
  //             {
  //               data : data,
  //               backgroundColor : backgroundColors,
  //               borderWidth: 3
  //             }
  //           ]
  //         }
  //       };
  //
  //       //remove loading overlay
  //       $("#" + canvas_id + "-overlay").addClass('is-hidden');
  //       if (channels_chart){
  //         channels_chart.destroy();
  //       }
  //       var ctx = document.getElementById(canvas_id).getContext('2d');
  //       channels_chart = new Chart(ctx, chartOptions);
  //
  //     }
  //   }
  // }).catch(function(err){
  //   gaErrorHandler(err);
  // });

  //build the channels chart

  //generate random dummy data
  var labels = [
    "Direct",
    "Organic Search",
    "Social",
    "Referral",
    "Paid Search",
  ];
  var data = Array.from({ length: 5 }, () => Math.floor(Math.random() * 1000));
  var backgroundColors = [
    "#00bfa5",
    "#F38181",
    "#FCE38A",
    "#3F4B83",
    "#95E1D3",
  ];

  //make chart
  var chartOptions = {
    type: "doughnut",
    options: {
      responsive: true,
      maintainAspectRatio: false,
      legend: {
        position: "left",
      },
      tooltips: {
        backgroundColor: "rgba(17, 17, 17, 0.9)",
        xPadding: 10,
        yPadding: 10,
      },
    },
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: backgroundColors,
          borderWidth: 3,
        },
      ],
    },
  };

  //remove loading overlay
  $("#" + canvas_id + "-overlay").addClass("is-hidden");
  if (channels_chart) {
    channels_chart.destroy();
  }
  var ctx = document.getElementById(canvas_id).getContext("2d");
  channels_chart = new Chart(ctx, chartOptions);
}

//#endregion

//#region -------------------------------COUNTRIES CHART-------------------------------

//build the countries chart
function buildCountriesChart(listing_regex, now, canvas_id) {
  //show loading if chart already exists (for changing date range)
  if (channels_chart) {
    showLoadingOrNone(canvas_id, true);
  }

  showLoadingOrNone(canvas_id, false);

  // #region old code for when Google Analytics was used

  // //build the query
  // gaQuery({
  //   'ids': 'ga:141565191',
  //   'metrics': 'ga:users',
  //   'dimensions': 'ga:pagePathLevel2,ga:country',
  //   'sort': '-ga:country',
  //   'start-date': moment(now).day(7).subtract($("#last-days-select").val(), 'day').day(0).format('YYYY-MM-DD'),
  //   'end-date': moment(now).format('YYYY-MM-DD'),
  //   'include-empty-rows': false,
  //   'max-results' : 100000,
  // }).then(function(results) {
  //   //no matching data
  //   if (results.totalResults == 0){
  //     showLoadingOrNone(canvas_id, false);
  //     if (countries_chart){
  //       countries_chart.destroy();
  //     }
  //   }
  //   else {
  //     //extract data
  //     var data = [];
  //     var labels = [];
  //     var backgroundColors = [
  //       "#00bfa5",
  //       "#F38181",
  //       "#FCE38A",
  //       "#3F4B83",
  //       "#95E1D3"
  //     ];
  //
  //     //sort the results by listing name and filter out not owner domains and sort by country name
  //     var listings_data_sorted = results.rows.map(function(row){
  //       var domain_name = row[0].replace(/\//g, "").split("?")[0].toLowerCase();
  //       return [domain_name, row[1], row[2]];
  //     }).filter(function(row){
  //       return listing_regex.test(row[0]) && row[1] != "(not set)";
  //     }).sort(function(a, b){
  //       return ((a[1] > b[1]) ? -1 : ((a[1] == b[1]) ? 0 : 1));
  //     });
  //
  //     //if nothing exists
  //     if (listings_data_sorted.length == 0){
  //       showLoadingOrNone(canvas_id, false);
  //       if (countries_chart){
  //         countries_chart.destroy();
  //       }
  //     }
  //     else {
  //
  //       //collapse by country and sort
  //       var seen = {};
  //       listings_data_sorted.forEach(function(row) {
  //         if (seen.hasOwnProperty(row[1])){
  //           seen[row[1]] += parseFloat(row[2]);
  //         }
  //         else {
  //           seen[row[1]] = parseFloat(row[2]);
  //         }
  //       });
  //       listings_data_sorted = [];
  //       for (var x in seen){
  //         listings_data_sorted.push([x, seen[x]]);
  //       }
  //
  //       //sort by user count and get top 5
  //       listings_data_sorted.sort(function(a,b){
  //         return ((a[1] > b[1]) ? -1 : ((a[1] == b[1]) ? 0 : 1));
  //       }).slice(0,5).forEach(function(row){
  //         labels.push(row[0]);
  //         data.push(row[1]);
  //       });
  //
  //       //make chart
  //       var chartOptions = {
  //         type : "pie",
  //         options : {
  //           responsive : true,
  //           maintainAspectRatio : false,
  //           legend : {
  //             position: "left"
  //           },
  //           tooltips: {
  //             backgroundColor: 'rgba(17, 17, 17, 0.9)',
  //             xPadding: 10,
  //             yPadding: 10
  //           }
  //         },
  //         data : {
  //           labels : labels,
  //           datasets : [
  //             {
  //               data : data,
  //               backgroundColor : backgroundColors,
  //               borderWidth: 3
  //             }
  //           ]
  //         }
  //       };
  //
  //       //remove loading overlay
  //       $("#" + canvas_id + "-overlay").addClass('is-hidden');
  //       if (countries_chart){
  //         countries_chart.destroy();
  //       }
  //       var ctx = document.getElementById(canvas_id).getContext('2d');
  //       countries_chart = new Chart(ctx, chartOptions);
  //     }
  //   }
  // }).catch(function(err){
  //   gaErrorHandler(err);
  // });

  // #endregion

  //generate random dummy data
  var labels = ["USA", "Canada", "UK", "Germany", "Australia"];
  var data = Array.from({ length: 5 }, () => Math.floor(Math.random() * 1000));
  var backgroundColors = [
    "#00bfa5",
    "#F38181",
    "#FCE38A",
    "#3F4B83",
    "#95E1D3",
  ];

  //make chart
  var chartOptions = {
    type: "pie",
    options: {
      responsive: true,
      maintainAspectRatio: false,
      legend: {
        position: "left",
      },
      tooltips: {
        backgroundColor: "rgba(17, 17, 17, 0.9)",
        xPadding: 10,
        yPadding: 10,
      },
    },
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: backgroundColors,
          borderWidth: 3,
        },
      ],
    },
  };

  //remove loading overlay
  $("#" + canvas_id + "-overlay").addClass("is-hidden");
  if (countries_chart) {
    countries_chart.destroy();
  }
  var ctx = document.getElementById(canvas_id).getContext("2d");
  countries_chart = new Chart(ctx, chartOptions);
}

//#endregion

//#region -------------------------------POPULAR CHART-------------------------------

//build the popular chart
function buildPopularChart(listing_regex, now, canvas_id) {
  //show loading if chart already exists (for changing date range)
  if (popular_chart) {
    showLoadingOrNone(canvas_id, true);
  }

  showLoadingOrNone(canvas_id, false);

  // #region old code for when Google Analytics was used

  // //build the query
  // gaQuery({
  //   'ids': 'ga:141565191',
  //   'metrics': 'ga:users',
  //   'dimensions': 'ga:pagePathLevel2',
  //   'sort': '-ga:pagePathLevel2',
  //   'start-date': moment(now).day(7).subtract($("#last-days-select").val(), 'day').day(0).format('YYYY-MM-DD'),
  //   'end-date': moment(now).format('YYYY-MM-DD'),
  //   'include-empty-rows': false,
  // }).then(function(results) {
  //   //no matching data
  //   if (results.totalResults == 0){
  //     showLoadingOrNone(canvas_id, false);
  //     if (popular_chart){
  //       popular_chart.destroy();
  //     }
  //   }
  //   else {
  //
  //     //set colors
  //     var data = [];
  //     var labels = [];
  //     var backgroundColors = [
  //       "#00bfa5",
  //       "#F38181",
  //       "#FCE38A",
  //       "#3F4B83",
  //       "#95E1D3"
  //     ];
  //
  //     //sort the results by listing name and filter out not owner domains
  //     var listings_data_sorted = results.rows.map(function(row){
  //       var domain_name = punycode.toUnicode(row[0].replace(/\//g, "").split("?")[0].toLowerCase());
  //       return [domain_name, row[1]];
  //     }).filter(function(row){
  //       return listing_regex.test(row[0]);
  //     }).sort(function(a, b){
  //       return ((a[0] > b[0]) ? -1 : ((a[0] == b[0]) ? 0 : 1));
  //     });
  //
  //     //if nothing exists
  //     if (listings_data_sorted.length == 0){
  //       showLoadingOrNone(canvas_id, false);
  //       if (popular_chart){
  //         popular_chart.destroy();
  //       }
  //     }
  //     else {
  //       //collapse data by domain name and sort
  //       var seen = {};
  //       listings_data_sorted.forEach(function(row) {
  //         if (seen.hasOwnProperty(row[0])){
  //           seen[row[0]] += parseFloat(row[1]);
  //         }
  //         else {
  //           seen[row[0]] = parseFloat(row[1]);
  //         }
  //       });
  //       listings_data_sorted = [];
  //       for (var x in seen){
  //         listings_data_sorted.push([x, seen[x]]);
  //       }
  //
  //       //sort by users and get top 5
  //       listings_data_sorted.sort(function(a, b){
  //         return ((a[1] > b[1]) ? -1 : ((a[1] == b[1]) ? 0 : 1));
  //       }).slice(0, 5).forEach(function(row){
  //         labels.push(row[0]);
  //         data.push(row[1]);
  //       });
  //
  //       //make chart
  //       var chartOptions = {
  //         type : "horizontalBar",
  //         options : {
  //           responsive : true,
  //           maintainAspectRatio : false,
  //           legend : {
  //             display: false
  //           },
  //           tooltips: {
  //             backgroundColor: 'rgba(17, 17, 17, 0.9)',
  //             xPadding: 10,
  //             yPadding: 10,
  //             titleMarginBottom: 10
  //           },
  //           scales: {
  //             xAxes: [{
  //               ticks: {
  //                 suggestedMax: 5,
  //                 beginAtZero: true,   // minimum value will be 0.
  //                 callback: function(value, index, values){
  //                   if (Math.floor(value) === value) {
  //                     return value;
  //                   }
  //                 }
  //               }
  //             }]
  //           }
  //         },
  //         data : {
  //           labels : labels,
  //           datasets : [
  //             {
  //               data : data,
  //               backgroundColor : backgroundColors,
  //             }
  //           ]
  //         }
  //       };
  //
  //       //remove loading overlay
  //       $("#" + canvas_id + "-overlay").addClass('is-hidden');
  //
  //       var ctx = document.getElementById(canvas_id).getContext('2d');
  //       if (popular_chart){
  //         popular_chart.destroy();
  //       }
  //       popular_chart = new Chart(ctx, chartOptions);
  //     }
  //   }
  // }).catch(function(err){
  //   gaErrorHandler(err);
  // });

  // #endregion

  //generate random dummy data
  var labels = ["Page A", "Page B", "Page C", "Page D", "Page E"];
  var data = Array.from({ length: 5 }, () => Math.floor(Math.random() * 1000));
  var backgroundColors = [
    "#00bfa5",
    "#F38181",
    "#FCE38A",
    "#3F4B83",
    "#95E1D3",
  ];

  //make chart
  var chartOptions = {
    type: "horizontalBar",
    options: {
      responsive: true,
      maintainAspectRatio: false,
      legend: {
        display: false,
      },
      tooltips: {
        backgroundColor: "rgba(17, 17, 17, 0.9)",
        xPadding: 10,
        yPadding: 10,
        titleMarginBottom: 10,
      },
      scales: {
        xAxes: [
          {
            ticks: {
              suggestedMax: 5,
              beginAtZero: true, // minimum value will be 0.
              callback: function (value, index, values) {
                if (Math.floor(value) === value) {
                  return value;
                }
              },
            },
          },
        ],
      },
    },
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: backgroundColors,
        },
      ],
    },
  };

  //remove loading overlay
  $("#" + canvas_id + "-overlay").addClass("is-hidden");

  var ctx = document.getElementById(canvas_id).getContext("2d");
  if (popular_chart) {
    popular_chart.destroy();
  }
  popular_chart = new Chart(ctx, chartOptions);
}

//#endregion

//#region -------------------------------CHART HELPERS-------------------------------

//build all charts
function buildCharts(listing_regex) {
  var now = moment();
  buildTimeChart(listing_regex, now, "time-chart");
  buildChannelsChart(listing_regex, now, "channels-chart");
  buildCountriesChart(listing_regex, now, "countries-chart");
  buildPopularChart(listing_regex, now, "popular-chart");
  buildStats(listing_regex, now);
}

//show loading message or no data message per chart
function showLoadingOrNone(canvas_id, loading) {
  $("#" + canvas_id + "-overlay").removeClass("is-hidden");

  //show loading
  if (loading) {
    $("#" + canvas_id + "-overlay-none").addClass("is-hidden");
    $("#" + canvas_id + "-overlay-load").removeClass("is-hidden");
  }
  //show no data
  else {
    $("#" + canvas_id + "-overlay-none").removeClass("is-hidden");
    $("#" + canvas_id + "-overlay-load").addClass("is-hidden");
  }
}

//#endregion

//#endregion

//#region -------------------------------ANNOUNCEMENT COOKIE-------------------------------

//helper function to read a cookie
function readCookie(name) {
  var result = document.cookie.match(new RegExp(name + "=([^;]+)"));
  result && (result = JSON.parse(result[1]));
  return result;
}

//#endregion
