//<editor-fold>-------------------------------VARIABLES-------------------------------

var myPath;
var moneyFormat = wNumb({
  thousand: ',',
  prefix: '$',
  decimals: 0
});

//</editor-fold>

//use a set up function for the whole page so we can re-use in hub
$(document).ready(function() {
  if (listing_info){
    setupListedPage();
  }
});

//<editor-fold>-------------------------------SET UP THE PAGE-------------------------------

function setupListedPage(){

  //click to show on mobile
  $("#show-more-details").on("click", function(){
    $("#more-details-wrapper").toggleClass('is-hidden-mobile');
    $(this).text(($(this).text() == "Click for details...") ? "Hide details..." : "Click for details...");
  });

  //if listing is set to active / inactive
  if (listing_info.status == 0){
    setupListingUnlistedLogic();
  }
  else {
    setupListingListedLogic();
  }
}

function setupListingListedLogic(){

  //<editor-fold>-------------------------------LEFT HALF-------------------------------

    //<editor-fold>-------------------------------PRICE TAGS-------------------------------

    //buy now
    if (listing_info.buy_price > 0){
      var price_tag_text = "Buy now - " + moneyFormat.to(listing_info.buy_price);
    }
    //minimum price
    else if (listing_info.min_price > 0){
      var price_tag_text = "Available - " + moneyFormat.to(listing_info.min_price);
    }
    //neither min or bin
    else {
      var price_tag_text = "Now available";
    }
    $("#price-tag").text(price_tag_text);

    //rental price tag
    if (listing_info.rentable){
      $("#rent-price-tag").removeClass('is-hidden');
      $("#rent-price-text").text(moneyFormat.to(listing_info.price_rate) + " / " + listing_info.price_type);
    }
    else {
      $("#rent-price-tag").addClass('is-hidden');
    }

    //</editor-fold>

    //<editor-fold>-------------------------------DESCRIPTION-------------------------------

    $("#listing-description").text(listing_info.description);

    //</editor-fold>

    //<editor-fold>-------------------------------REGISTRAR-------------------------------

    if (!listing_info.premium || (listing_info.domain_owner == 1 && listing_info.registrar)){
      $("#listing-domain-registrar").removeClass('is-hidden').find(".listing-detail-text").text(listing_info.registrar);
    }
    else {
      $("#listing-domain-registrar").addClass('is-hidden');
    }

    //</editor-fold>

    //<editor-fold>-------------------------------DATE REGISTERED-------------------------------

    if (!listing_info.premium || (listing_info.domain_age == 1 && listing_info.date_registered)){
      $("#listing-date-registered").removeClass('is-hidden').find(".listing-detail-text").text(moment(listing_info.date_registered).format("MMMM DD, YYYY"));
    }
    else {
      $("#listing-date-registered").addClass('is-hidden');
    }

    //</editor-fold>

    //<editor-fold>-------------------------------CATEGORIES-------------------------------

    if (listing_info.categories != ""){
      $("#listing-categories").removeClass('is-hidden').find(".listing-detail-text").text(listing_info.categories.split(" ").map(function(elem){
        return categories_hash[elem]
      }).join(", "));
    }
    else {
      $("#listing-categories").addClass('is-hidden');
    }

    //</editor-fold>

    //<editor-fold>-------------------------------APPRAISAL-------------------------------

    if (!listing_info.premium || (listing_info.domain_appraisal == 1)){
      $("#listing-appraisal").removeClass('is-hidden').find(".listing-detail-text").each(function(){
        $(this).attr("href", $(this).attr("href") + listing_info.domain_name);
      });
    }
    else {
      $("#listing-appraisal").addClass('is-hidden');
    }

    //</editor-fold>

    //<editor-fold>-------------------------------SOCIAL SHARE-------------------------------

    if (!listing_info.premium || (listing_info.social_sharing == 1)){
      var link_to_domain = (listing_info.premium) ? "" : "domahub.com/listing/"
      $("#listing-social").removeClass('is-hidden').find(".listing-detail-text").each(function(){
        $(this).attr("href", $(this).attr("href") + link_to_domain + listing_info.domain_name);
      });
    }
    else {
      $("#listing-social").addClass('is-hidden');
    }

    //</editor-fold>

  //</editor-fold>

  //<editor-fold>-------------------------------RIGHT HALF-------------------------------

    //<editor-fold>-------------------------------TABS-------------------------------

    if (listing_info.premium && listing_info.traffic_module == 0){
      $("#traffic-module").remove();
      $("#traffic-tab").remove();
    }

    if (listing_info.premium && listing_info.traffic_graph == 0){
      $("#listing-traffic-chart").remove();
      $("#traffic-chart-description").remove();
    }

    if (listing_info.premium && listing_info.history_module == 0){
      $("#ticker-module").remove();
      $("#ticker-tab").remove();
    }

    if (listing_info.premium && listing_info.history_module == 0 && listing_info.traffic_module == 0 && listing_info.domain_list == 0){
      $("#contact-form-tab").remove();
    }

    //</editor-fold>

    //<editor-fold>-------------------------------BUY NOW-------------------------------

    //set up phone
    $("#contact_phone").intlTelInput({
      utilsScript: "/js/jquery/utils.js"
    });

    //get a random char phrase
    if (!listing_info.premium || (listing_info.premium && listing_info.placeholder == 1)){
      var random_char = random_characters[Math.floor(Math.random()*random_characters.length)];
      $("#contact_name").attr("placeholder", random_char.name);
      $("#contact_email").attr("placeholder", random_char.email);
      $("#contact_message").attr("placeholder", random_char.message + " Anyways, I'm interested in buying " + listing_info.domain_name + ". Let's chat.");
    }

    //placeholder + minimum on contact form
    if (listing_info.min_price > 0){
      $("#contact_offer").attr("min", listing_info.min_price).attr("placeholder", listing_info.min_price);
    }

    //need the min offer input if you're offering
    $("#send-offer-button").on('click', function(){
      $("#contact_offer").attr("required", true);
    });

    //dont need the min offer input if you're just buying now
    if (listing_info.buy_price > 0){
      $("#buy-now-button").on('click', function(){
        $("#contact_offer").removeAttr("required");
      }).find("#buy-button-text").text(price_tag_text);
    }

    //click buy tab (tutorial / focus)
    $("#contact-form-tab").on("click", function(e){
      //doing the tutorial!
      if (compare && tutorial_tour && !tutorial_tour.ended()){
        tutorial_tour.goTo(6);
      }

      //focus the contact name
      if ($("#contact_name").is(":visible")){
        $("#contact_name").focus();
      }
    });

    //submit the contact form
    $("#buy-now-form").on("submit", function(e){
      var type_of_submit = $("button[type=submit][clicked=true]").attr("name");
      e.preventDefault();

      if ($("#contact_phone").intlTelInput("isValidNumber")){
        $("button[type=submit][clicked=true]").addClass('is-loading');
        $(".notification").addClass('is-hidden').removeClass('is-active');
        $(".contact-input").attr('disabled', true);

        //comparison only, no need for AJAX
        if (compare){
          testSubmitBuyHandler();
        }
        else {
          //send an offer / or buy it now request
          $.ajax({
            url: "/listing/" + listing_info.domain_name.toLowerCase() + "/contact/" + type_of_submit,
            method: "POST",
            data: {
              contact_email: $("#contact_email").val(),
              contact_name: $("#contact_name").val(),
              contact_phone: $("#contact_phone").intlTelInput("getNumber"),
              contact_offer: $("#contact_offer").val(),
              contact_message: $("#contact_message").val()
            }
          }).done(function(data){
            $("button[type=submit][clicked=true]").removeClass('is-loading');

            if (data.state == "success"){
              if (type_of_submit == "offer"){
                clearNotification();
                successMessage("Success! Please check your email for further instructions.");
                $("#buy-now-form").off();
              }
              else {
                window.location.assign("/listing/" + listing_info.domain_name + "/checkout/buy");
              }
            }
            else {
              clearNotification();
              $(".contact-input").removeAttr('disabled');
              errorMessage(data.message);
            }
          });
        }
      }
      else {
        clearNotification();
        errorMessage("Please enter a real phone number! Did you select the correct country for your phone number?");
      }
    });

    //set the clicked attribute so we know which type of submit
    $("form button[type=submit]").on("click", function(e){
      $("form button[type=submit][clicked=true]").attr("clicked", false);
      $(this).attr('clicked', true);
    });

    //</editor-fold>

    //<editor-fold>-------------------------------OTHER DOMAINS-------------------------------

    if ((listing_info.premium && listing_info.info_module) || !listing_info.premium){
      findOtherDomains();
    }

    //</editor-fold>

    //<editor-fold>-------------------------------RENTAL-------------------------------

    if (listing_info.rentable){

      //click rent tab to get times
      $("#rental-tab").on("click", function(e) {
        //doing the tutorial!
        if (compare && tutorial_tour && !tutorial_tour.ended()){
          tutorial_tour.goTo(8);
        }

        getTimes();
      });

      //submit times (redirect to rental checkout)
      $("#checkout-button").on("click", function(){
        submitTimes($(this));
      });

      //<editor-fold>-------------------------------TYPED PATH-------------------------------

      //initiate typed JS
      $("#typed-slash").typed({
        typeSpeed: 40,
        attr: "placeholder",
        loop : true,
        shuffle : true,
        strings : (listing_info.paths == "" || !listing_info.paths) ? [
          "thing",
          "something",
          "anything"
        ] : listing_info.paths.split(",")
      });

      //focus to hide the click me message
      $("#typed-slash").on("focus", function(){
        $("#input-tooltip").addClass('is-hidden');
        $(this).addClass('is-active');

        //select all on existing path
        $("#typed-slash").select();
      }).on("focusout", function(){
        if ($("#typed-slash").val() == ""){
          $("#input-tooltip").removeClass('is-hidden');
        }
        $(this).removeClass('is-active');

        //re-add the calendar event handler if path changed
        if (myPath != undefined && myPath != $("#typed-slash").val()){
          $("#calendar-input").val("");
          $("#checkout-button").addClass('is-disabled');

          $("#calendar-input").off("click").on("click", function(){
            getTimes($(this));
          });
        }
      });

      //function for input text validation and tooltip change
      $("#typed-slash").on("keypress onkeypress", function(e) {
        var code = e.charCode || e.keyCode;
        var inp = String.fromCharCode(code);
        //regex for alphanumeric
        var validChar = /^[0-9a-zA-Z]+$/;

        //logic to check alphanumeric input value
        if (!inp.match(validChar) && code != 13 && code != 8) {
          e.preventDefault();
          $("#input-tooltip-error").removeClass("is-hidden");
        }
        else if (e.keyCode == 13){
          e.preventDefault();
          $("#input-tooltip-error").addClass("is-hidden");
        }
        else {
          $("#input-tooltip-error").addClass("is-hidden");
        }
      }).on('keyup', function(e){
        var code = e.charCode || e.keyCode;

        var validChar = /^[0-9a-zA-Z]+$/;

        //enter to see calendar
        if (code == 13 && ($(this).val().match(validChar) || $(this).val() == "")){
          e.preventDefault();
          //unfocus the typed JS
          $(this).blur();

          //get new calendar if mypath is different
          if (myPath != $(this).val()) {
            getTimes($(this));
          }

          //show if mypath is the same
          else if ($("#calendar-input").is(":visible")){
            $("#calendar-input").data('daterangepicker').show();
          }
        }
      });

      //pre-fill the path input if theres a wanted path
      if (getParameterByName("wanted")){
        $("#typed-slash").val(getParameterByName("wanted"));
      }

      //</editor-fold>

      //<editor-fold>-------------------------------RENTAL FREE TIMES-------------------------------

      //if and any free times
      if (listing_info.freetimes && listing_info.freetimes.length > 0){
        var now = moment();
        var freetime_now;
        //loop and find out when is free
        for (var x = 0; x < listing_info.freetimes.length; x++){
          if (now.isBetween(moment(listing_info.freetimes[x].date), moment(listing_info.freetimes[x].date + listing_info.freetimes[x].duration))){
            freetime_now = listing_info.freetimes[x];
            break;
          }
        }

        //free now
        if (freetime_now){
          var until_date = moment(freetime_now.date + freetime_now.duration).format("MMM, DD");
          $("#free-until").removeClass('is-hidden').text("Free until " + until_date);
          $("#rent-price-text").addClass('is-linethrough');
        }
      }

      //</editor-fold>

    }
    else {
      $("#rental-module").remove();
      $("#rental-tab").remove();
    }

    //</editor-fold>

    //</editor-fold>

  //</editor-fold>

  //<editor-fold>-------------------------------FOOTER-------------------------------

    //<editor-fold>-------------------------------FOOTER LOGO-------------------------------

    if (listing_info.premium && listing_info.logo){
      $(".page-contents #listing-footer-logo").attr("src", listing_info.logo);
    }
    else if (listing_info.premium){
      $(".page-contents #listing-footer-logo").addClass('is-hidden');
    }
    else {
      $(".page-contents #listing-footer-logo").removeClass('is-hidden').attr("src", "/images/dh-assets/circle-logo/dh-circle-logo-primary-225x225.png");
    }

    //</editor-fold>


    //<editor-fold>-------------------------------FOOTER TEXT-------------------------------

    if (listing_info.premium && listing_info.description_footer){
      $("#listing-footer").text(listing_info.description_footer)
    }

    //</editor-fold>

  //</editor-fold>

}

function setupListingUnlistedLogic(){

  //<editor-fold>-------------------------------LEFT HALF-------------------------------

    //<editor-fold>-------------------------------PRICE TAGS-------------------------------

    $("#price-tag").text("Unavailable");

    //</editor-fold>

  //</editor-fold>

  //<editor-fold>-------------------------------RIGHT HALF-------------------------------

  //</editor-fold>

}

//<editor-fold>-------------------------------SUBMIT TIMES-------------------------------

//helper function to check if everything is legit
function checkTimes(){
  var startDate = $("#calendar-input").data('daterangepicker').startDate;
  var endDate = $("#calendar-input").data('daterangepicker').endDate.clone().add(1, "millisecond");

  if (!startDate.isValid() || !endDate.isValid()){
    $("#calendar-error-message").removeClass('is-hidden').addClass('is-danger').html("Invalid dates selected!");
  }
  else {
    return {
      starttime : startDate._d.getTime(),
      endtime : endDate._d.getTime()
    };
  }
}

function submitTimes(checkout_button){
  //remove event handler
  checkout_button.off();
  checkout_button.addClass('is-loading');
  var newEvent = checkTimes();

  if (newEvent.starttime && newEvent.endtime){

    //test rental submit (for compare tool)
    if (compare){
      testSubmitRentHandler(checkout_button);
    }
    else {
      //redirect to checkout page
      $.ajax({
        type: "POST",
        url: "/listing/" + listing_info.domain_name.toLowerCase() + "/checkoutrent",
        data: {
          starttime: newEvent.starttime,
          endtime: newEvent.endtime,
          path: $("#typed-slash").val()
        },
        xhrFields: { withCredentials: true }
      }).done(function(data){
        checkout_button.removeClass('is-loading');
        if (data.state == "success"){
          window.location.assign("/listing/" + listing_info.domain_name + "/checkout/rent");
        }
        else if (data.state == "error"){
          $("#calendar-regular-message").addClass('is-hidden');
          errorHandler(data.message);
          checkout_button.on('click', function(){
            submitTimes(checkout_button);
          });

          //re-add calendar event handler to fetch new events
          $("#calendar-input").off('click').on("click", function(){
            getTimes($(this));
          });
        }
      });
    }
  }
}

//handler for various error messages
function errorHandler(message){
  $("#calendar-regular-message").addClass('is-hidden');

  switch (message){
    case "Dates are unavailable!":
    $("#calendar-error-message").removeClass('is-hidden').text("Bummer! Someone just took that slot. Please select a different time.");
    break;
    case "Invalid dates!":
    case "Invalid dates! No times posted!":
    case "Invalid dates! Not valid dates!":
    case "Not divisible by hour blocks!":
    case "Start time in the past!":
    case "Invalid end time!":
    case "Invalid start time!":
    $("#calendar-error-message").removeClass('is-hidden').text("You have selected an invalid time! Please refresh the page and try again.");
    break;
    default:
    $("#calendar-error-message").removeClass('is-hidden').text("Oh no, something went wrong! Please refresh the page and try again.");
    break;
  }
}

//</editor-fold>

//<editor-fold>-------------------------------CALENDAR SET UP-------------------------------

//get times from the server
function getTimes(calendar_elem){
  //now loading messages
  $("#calendar-input").addClass('is-disabled');
  $("#calendar-regular-message").addClass('is-hidden');
  $("#calendar-error-message").addClass('is-hidden');

  //loading dates message
  if (calendar_elem){
    calendar_elem.off("click");
  }

  //comparison only, no need for AJAX
  if (compare){
    testCalendarHandler();
  }
  else {
    $.ajax({
      url: "/listing/" + listing_info.domain_name.toLowerCase() + "/times",
      method: "POST",
      data: {
        path: $("#typed-slash").val()
      }
    }).done(function(data){
      $("#calendar-input").removeClass('is-disabled');
      $("#calendar-regular-message").removeClass('is-hidden');

      //got the future events, go ahead and create the calendar
      if (data.state == "success" && data.times){
        listing_info.rental_moments = [];
        for (var x = 0; x < data.times.length; x++){
          listing_info.rental_moments.push({
            start : moment(data.times[x].date),
            end : moment(data.times[x].date + data.times[x].duration),
          });
        }

        //only show new calendar if path changed
        if (myPath != $("#typed-slash").val() || !$("#calendar-input").data('daterangepicker')){
          myPath = $("#typed-slash").val();
          setUpCalendar(listing_info);
        }
        else if ($("#calendar-input").is(":visible")){
          $("#calendar-input").focus().data('daterangepicker').show();
        }
      }
      else {
        errorHandler("");
      }
    });
  }
}

//setup the calendar
function setUpCalendar(listing_info){
  //create a new range picker based on new path rental availability
  var start_date = moment();
  var end_date = moment().endOf(listing_info.price_type).add(1, "millisecond");

  $("#calendar-input").daterangepicker({
    opens: "center",
    alwaysShowCalendars: true,
    autoApply: true,
    keepOpen : true,
    autoUpdateInput: false,
    locale: {
      format: 'MM/DD/YYYY'
    },
    // timePicker: true,
    // timePickerIncrement: 60,

    minDate: moment().endOf("hour").add(1, "millisecond").add(1, "hour"),
    maxDate: moment().endOf("hour").add(1, "millisecond").add(1, "year"),

    isInvalidDate: function(curDate){
      if (curDate.isAfter(moment())){
        var bool = checkIfNotOverlapped(curDate);
        return bool;
      }
      else {
        return true;
      }
    },

    //free times on calendar
    isCustomDate: function(curDate){
      if (curDate.isAfter(moment())){
        if (checkIfFree(curDate)){
          return "free-times";
        }
      }
    }
  });

  //update when applying new dates
  $("#calendar-input").on('apply.daterangepicker', function(ev, picker) {
    //picked today to start
    if (picker.startDate.startOf("day").isSame(moment().startOf("day"))){
      picker.startDate = moment().startOf("hour");
    }

    if (picker.startDate.isValid() && picker.endDate.isValid()){
      updatePrices();
      $(this).val(picker.startDate.format('MMM D, YYYY') + ' - ' + picker.endDate.format('MMM D, YYYY'));
      $("#checkout-button").removeClass('is-disabled');
    }
    else {
      $(this).val("");
      $("#checkout-button").addClass('is-disabled');
    }
  });

  //to figure out what events are already existing in given view
  $("#calendar-input").data('daterangepicker').hide = function () {};

  //only show if the calendar input is visible
  if ($("#calendar-input").is(":visible")){
    $("#calendar-input").data('daterangepicker').show();
    $(".daterangepicker").appendTo("#calendar");
    $("#calendar-input").addClass('is-hidden');
  }

}

//helper function to make sure theres nothing overlapping this event
function checkIfNotOverlapped(event){
  var overlap = 0;
  if (listing_info.rental_moments){
    for (var x = 0; x < listing_info.rental_moments.length; x++){
      var rental_start = listing_info.rental_moments[x].start;
      var rental_end = listing_info.rental_moments[x].end;

      //include start, exclude end
      if (event.isBetween(rental_start, rental_end, "day", "[)")){
        overlap++;
      }
    }
  }
  return overlap != 0;
}

//helper function to check if overlaps a free period
function checkIfFree(event){
  var overlap = 0;
  if (listing_info.freetimes){
    for (var x = 0; x < listing_info.freetimes.length; x++){
      var freetime_start = moment(listing_info.freetimes[x].date);
      var freetime_end = moment(listing_info.freetimes[x].date + listing_info.freetimes[x].duration);

      //include start, exclude end
      if (event.isBetween(freetime_start, freetime_end, "day", "[)")){
        overlap++;
      }
    }
  }
  return overlap != 0;
}

//helper function to get correct price of events
function updatePrices(){
  if (listing_info.status){
    var startDate = $("#calendar-input").data('daterangepicker').startDate;
    var endDate = $("#calendar-input").data('daterangepicker').endDate.clone().add(1, "millisecond");

    //calculate the price
    var totalPrice = moment.duration(endDate.diff(startDate));

    //any overlapped time with free times
    var overlappedTime = anyFreeDayOverlap(startDate, endDate);

    if (overlappedTime > 0){
      var origPrice = calculatePrice(totalPrice);
      var actual_price = totalPrice.subtract(overlappedTime, "milliseconds");
      var totalPrice = calculatePrice(actual_price);
    }
    else {
      var totalPrice = calculatePrice(totalPrice);
    }

    //price or price per day
    if (totalPrice == 0 && listing_info.price_rate != 0 && overlappedTime == 0){
      $(".total-price").addClass("is-hidden");
      $("#checkout-button").addClass('is-disabled');
      $(".actual-price").text("$" + listing_info.price_rate + " Per " + listing_info.price_type.capitalizeFirstLetter());
    }
    else {
      $(".total-price").removeClass("is-hidden");
      $("#checkout-button").removeClass('is-disabled');

      if (origPrice){
        $("#orig-price").removeClass('is-hidden');
        countPrice($("#orig-price"), origPrice);
      }
      else {
        $("#orig-price").addClass('is-hidden');
      }

      countPrice($(".actual-price"), totalPrice);
    }
  }
}

//count number for price
function countPrice(elem, price){
  elem.prop('Counter', $("#price").prop('Counter')).stop().animate({
    Counter: price
  }, {
    duration: 100,
    easing: 'swing',
    step: function (now) {
      if (now == 0){
        $(this).text("Free");
      }
      else {
        $(this).text(" $" + Number(Math.round(now+'e2')+'e-2').toFixed(2));
      }
    }
  });
}

//figure out price from milliseconds
function calculatePrice(totalduration){
  if (listing_info.price_type == "month"){
    totalduration = totalduration.asDays() / 30;
  }
  else {
    totalduration = totalduration.as(listing_info.price_type);
    totalduration = Number(Math.round(totalduration+'e2')+'e-2');
  }
  return totalduration * listing_info.price_rate;
}

//figure out if the start and end dates overlap any free periods
function anyFreeDayOverlap(starttime, endtime){
  if (listing_info.freetimes && listing_info.freetimes.length > 0){
    var overlap_time = 0;
    for (var x = 0; x < listing_info.freetimes.length; x++){
      var freetime_start = moment(listing_info.freetimes[x].date);
      var freetime_end = moment(listing_info.freetimes[x].date + listing_info.freetimes[x].duration);

      //there is overlap
      if (starttime.isBefore(freetime_end) && endtime.isAfter(freetime_start)){
        //completely covered by free time
        if (starttime.isSameOrAfter(freetime_start) && endtime.isSameOrBefore(freetime_end)){
          overlap_time += endtime.diff(starttime);
        }
        //completely covers free time
        else if (freetime_start.isSameOrAfter(starttime) && freetime_end.isSameOrBefore(endtime)){
          overlap_time += freetime_end.diff(freetime_start);
        }
        //overlap partially in the end of wanted time
        else if (starttime.isSameOrBefore(freetime_start) && endtime.isSameOrBefore(freetime_end)){
          overlap_time += endtime.diff(freetime_start);
        }
        //overlap partially at the beginning of wanted time
        else {
          overlap_time += freetime_end.diff(starttime);
        }
      }
    }
    return overlap_time;
  }
  else {
    return 0;
  }
}

//</editor-fold>

//<editor-fold>-------------------------------OTHER DOMAINS-------------------------------

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
        exclude_id: listing_info.id,
        sort_by : "random",
        total : 10,
        starting_id : false
      }
    }).done(function(data){
      if (data.state == "success"){
        createOtherDomains(data.listings);
      }
      else {
        $("#domainlist-tab").addClass('is-hidden');

        //every other tab is gone
        if (listing_info.premium && listing_info.history_module == 0 && listing_info.traffic_module == 0){
          $("#contact-form-tab").remove();
        }
      }
    });
  }
}

//create the other domain
function createOtherDomains(other_listings){
  $("#otherowner-domains").removeClass('is-hidden');
  for (var x = 0; x < other_listings.length; x++){
    var cloned_similar_listing = $("#otherowner-domain-clone").clone();
    cloned_similar_listing.removeAttr("id").removeClass('is-hidden');

    //edit it based on new listing info
    var sliced_domain = other_listings[x].domain_name;

    //available to buy now
    if (other_listings[x].buy_price > 0){
      var buy_price = moneyFormat.to(parseFloat(other_listings[x].buy_price));
      cloned_similar_listing.find(".otherowner-domain-price").text("Buy Now: " + buy_price);
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
      cloned_similar_listing.find(".otherowner-domain-name").text(sliced_domain);
      cloned_similar_listing.attr("href", "/listing/" + other_listings[x].domain_name + "?compare=true&theme=Random");
    }
    else {
      //premium or basic link
      if (listing_info.premium){
        var link_to_domain = "https://" + other_listings[x].domain_name;
      }
      else {
        var link_to_domain = "https://domahub.com/listing/" + other_listings[x].domain_name;
      }
      cloned_similar_listing.find(".otherowner-domain-name").text(sliced_domain);
      cloned_similar_listing.attr("href", link_to_domain);
    }
    $("#otherowner-domain-table").append(cloned_similar_listing);
  }
}

//</editor-fold>
