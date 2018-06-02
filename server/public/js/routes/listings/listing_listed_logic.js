//<editor-fold>-------------------------------VARIABLES-------------------------------

var myPath;
var traffic_chart = false;
var random_char = random_characters[Math.floor(Math.random()*random_characters.length)];

//hash table for categories
var categories_hash = {};
for (var x = 0 ; x < categories.length ; x++){
  categories_hash[categories[x].back] = categories[x].front;
}

//</editor-fold>

//use a set up function for the whole page so we can re-use in hub
$(document).ready(function() {
  if (listing_info){
    setupListedPage();
  }
});

//<editor-fold>-------------------------------SET UP THE PAGE-------------------------------

function setupListedPage(){

  //reset myPath
  myPath = null;

  //click to show on mobile
  $("#show-more-details").off().on("click", function(){
    $("#more-details-wrapper").toggleClass('is-hidden-mobile');
    $(this).text(($(this).text() == "Click for details...") ? "Hide details..." : "Click for details...");
  });

  setupLeftHalf();
  setupRightHalf();
  setupFooter();
}

//</editor-fold>

//<editor-fold>-------------------------------LEFT HALF-------------------------------

function setupLeftHalf(){
  //domain name
  $(".domain-title").text(listing_info.domain_name);

  setupPriceTags();
  setupDescription();
  setupRegistrar();
  setupDateRegistered();
  setupCategories();
  setupAppraisal();
  setupSocial();
}

//<editor-fold>-------------------------------PRICE TAGS-------------------------------

function setupPriceTags(){
  //buy now
  if (listing_info.status == 0) {
    var price_tag_text = "Unavailable";
  }
  else if (listing_info.buy_price > 0 && listing_info.rented != 1){
    var price_tag_text = "Buy now - " + formatCurrency(listing_info.buy_price, listing_info.default_currency);
  }
  else if (listing_info.min_price > 0){
    var price_tag_text = "Available - " + formatCurrency(listing_info.min_price, listing_info.default_currency);
  }
  else {
    var price_tag_text = "Now available";
  }
  $("#price-tag").text(price_tag_text);

  if (listing_info.buy_price > 0 && listing_info.rented != 1){
    //dont need to require the offer/message part when buying now
    $("#buy-now-button").removeClass("is-hidden").off().on('click', function(){
      $("#contact_message").removeAttr("required");
      $("#contact_offer").removeAttr("required");

      //create a fake input button
      var temp_hidden_submit_button = $("<button type='submit' class='is-hidden'></button>");
      $("#buy-now-form").data('type_of_submit', "buy").append(temp_hidden_submit_button)
      temp_hidden_submit_button.click();
      temp_hidden_submit_button.remove();
    }).find("#buy-button-text").text(price_tag_text);
  }
  else {
    $("#buy-now-button").closest(".control").remove();
  }

  //need the min offer input if you're offering
  $("#send-offer-button").off().on('click', function(){
    $("#contact_offer").attr("required", true);
    $("#contact_message").attr("required", true);

    //create a fake input button
    var temp_hidden_submit_button = $("<button type='submit' class='is-hidden'></button>");
    $("#buy-now-form").data('type_of_submit', "offer").append(temp_hidden_submit_button);
    temp_hidden_submit_button.click();
    temp_hidden_submit_button.remove();
  });

  //rental price tag
  if (listing_info.rentable && listing_info.status == 1){
    $("#rent-price-tag").removeClass('is-hidden');

    //free rental
    if (listing_info.price_rate == 0){
      $("#rent-price-text").text("");
      $(".actual-price").text("Free!");
    }
    else {
      $("#rent-price-text").text(" - " + formatCurrency(listing_info.price_rate, listing_info.default_currency) + " / " + listing_info.price_type);
      $(".actual-price").text(formatCurrency(0, listing_info.default_currency, true));
    }
  }
  else {
    $("#rent-price-tag").addClass('is-hidden');
  }
}

//</editor-fold>

//<editor-fold>-------------------------------DESCRIPTION-------------------------------

function setupDescription(){
  $("#listing-description").text((listing_info.description) ? listing_info.description : "");
}

//</editor-fold>

//<editor-fold>-------------------------------REGISTRAR-------------------------------

function setupRegistrar(){
  if ((!listing_info.premium || (listing_info.show_registrar == 1 && listing_info.registrar)) && listing_info.registrar){
    $("#listing-domain-registrar").removeClass('is-hidden').find(".listing-detail-text").text(listing_info.registrar);
  }
  else {
    $("#listing-domain-registrar").addClass('is-hidden');
  }
}

//</editor-fold>

//<editor-fold>-------------------------------DATE REGISTERED-------------------------------

function setupDateRegistered(){
  if ((!listing_info.premium || (listing_info.show_registration_date == 1 && listing_info.date_registered)) && listing_info.date_registered){
    $("#listing-date-registered").removeClass('is-hidden').find(".listing-detail-text").text(moment(listing_info.date_registered).format("MMMM DD, YYYY"));
  }
  else {
    $("#listing-date-registered").addClass('is-hidden');
  }
}

//</editor-fold>

//<editor-fold>-------------------------------CATEGORIES-------------------------------

function setupCategories(){
  if (!listing_info.categories || listing_info.categories == "" || (listing_info.premium && listing_info.show_categories == 0)){
    $("#listing-categories").addClass('is-hidden');
  }
  else {
    $("#listing-categories").removeClass('is-hidden').find(".listing-detail-text").text(listing_info.categories.split(" ").map(function(elem){
      return categories_hash[elem]
    }).join(", "));
  }
}

//</editor-fold>

//<editor-fold>-------------------------------APPRAISAL-------------------------------

function setupAppraisal(){

  //premium and all are empty
  if (listing_info.premium && (
    !listing_info.show_godaddy_appraisal &&
    !listing_info.show_domainindex_appraisal &&
    !listing_info.show_freevaluator_appraisal &&
    !listing_info.show_estibot_appraisal
  )){
    $("#listing-appraisal").addClass('is-hidden');
  }
  else {
    $("#listing-appraisal").removeClass('is-hidden');
  }

  //show specific appraisal links
  if (!listing_info.premium || (listing_info.show_godaddy_appraisal == 1)){
    $("#godaddy-appraisal-link").removeClass('is-hidden').attr("href", "https://www.godaddy.com/domain-value-appraisal/appraisal/?checkAvail=1&tmskey=&domainToCheck=" + listing_info.domain_name);
  }
  else {
    $("#godaddy-appraisal-link").addClass("is-hidden");
  }

  if (!listing_info.premium || (listing_info.show_domainindex_appraisal == 1)){
    $("#domainindex-appraisal-link").removeClass('is-hidden').attr("href", "http://domainindex.com/domains/" + listing_info.domain_name);
  }
  else {
    $("#domainindex-appraisal-link").addClass("is-hidden");
  }

  if (!listing_info.premium || (listing_info.show_freevaluator_appraisal == 1)){
    $("#freevaluator-appraisal-link").removeClass('is-hidden').attr("href", "http://www.freevaluator.com/?domain=" + listing_info.domain_name);
  }
  else {
    $("#freevaluator-appraisal-link").addClass("is-hidden");
  }

  if (!listing_info.premium || (listing_info.show_estibot_appraisal == 1)){
    $("#estibot-appraisal-link").removeClass('is-hidden').attr("href", "https://www.estibot.com/verify.php?type=normal&data=" + listing_info.domain_name);
  }
  else {
    $("#estibot-appraisal-link").addClass("is-hidden");
  }
}

//</editor-fold>

//<editor-fold>-------------------------------SOCIAL SHARE-------------------------------

function setupSocial(){
  if (!listing_info.premium || (listing_info.show_social_sharing == 1)){
    var link_to_domain = (listing_info.premium) ? "" : "domahub.com/listing/"
    $("#listing-social").removeClass('is-hidden').find(".listing-detail-text").each(function(){
      $(this).attr("href", $(this).attr("href") + link_to_domain + listing_info.domain_name);
    });
  }
  else {
    $("#listing-social").addClass('is-hidden');
  }
}

//</editor-fold>

//</editor-fold>

//<editor-fold>-------------------------------RIGHT HALF-------------------------------

function setupRightHalf(){
  setupContactTab();
  setupRentalTab();
  setupOtherDomainsTab();
  setupTrafficTab();
  setUpTabs();
}

  //<editor-fold>-------------------------------TABS-------------------------------

  function setUpTabs(){

    //<editor-fold>-------------------------------TABS LOGIC-------------------------------

    //switch tabs
    $(".tab").off().on("click", function(){
      var which_tab = $(this).attr("id").replace("-tab", "");

      //show the tab
      $(".tab").removeClass('is-active');
      $(this).addClass('is-active');

      //show the module
      $(".module").addClass('is-hidden');
      $("#" + which_tab + "-module").removeClass('is-hidden');

      //stylize if premium or compare
      if (listing_info.premium || compare){
        stylize(listing_info.font_color, ".page-contents .module-tab:not(.is-active) a", "color");
        stylize(listing_info.primary_color, ".page-contents .module-tab.is-active a", "color");
      }

      if (which_tab == "traffic"){
        //if tutorial, go to the traffic module step
        if (compare && tutorial_tour && !tutorial_tour.ended()){
          tutorial_tour.goTo(10);
        }
        getTrafficData();
      }
      else if (which_tab == "rental"){
        //doing the tutorial!
        if (compare && tutorial_tour && !tutorial_tour.ended()){
          tutorial_tour.goTo(8);
        }

        getTimes();
      }

    });

    //reset active tab
    $(".module-tab").removeClass("is-active");
    $(".module").addClass("is-hidden");

    //if the active is hidden
    if ($(".module-tab.is-active").hasClass("is-hidden")){
      $(".module-tab.is-active").removeClass("is-active");
    }

    //</editor-fold>

    //<editor-fold>-------------------------------SPECIFIC TAB LOGIC-------------------------------

    //hide or show rental tab
    if (!listing_info.rentable || listing_info.status == 0){
      $("#rental-tab").addClass("is-hidden");
      $("#rental-module").addClass("is-hidden");
    }
    else {
      $("#rental-tab").removeClass("is-hidden");
      if ($("#rental-tab").hasClass('is-active')){
        $("#rental-module").removeClass("is-hidden");
      }
    }

    //hide or show traffic tab
    if (listing_info.premium && listing_info.show_traffic_graph == 0 && listing_info.show_alexa_stats == 0){
      $("#traffic-module").addClass("is-hidden");
      $("#traffic-tab").addClass("is-hidden");
    }
    else {
      $("#traffic-tab").removeClass("is-hidden");
      if ($("#traffic-tab").hasClass('is-active')){
        $("#traffic-module").removeClass("is-hidden");
      }
    }

    //hide or show ticker history tab
    if (listing_info.premium && listing_info.show_history_ticker == 0){
      $("#ticker-module").addClass("is-hidden");
      $("#ticker-tab").addClass("is-hidden");
    }
    else {
      $("#ticker-tab").removeClass("is-hidden");
      if ($("#ticker-tab").hasClass('is-active')){
        $("#ticker-module").removeClass("is-hidden");
      }
    }

    //hide or show ticker history tab
    if (listing_info.premium && listing_info.show_domain_list == 0){
      $("#domainlist-tab").addClass("is-hidden");
      $("#domainlist-module").addClass("is-hidden");
    }
    else {
      $("#domainlist-tab").removeClass("is-hidden");
      if ($("#domainlist-tab").hasClass('is-active')){
        $("#domainlist-module").removeClass("is-hidden");
      }
    }

    //add active to the first appearing tab (if some tabs are disabled)
    if ($(".module-tab.is-active:not(.is-hidden)").length == 0){
      $(".tab:not(.is-hidden)").eq(0).addClass('is-active');
      var tab_id = $(".tab:not(.is-hidden)").eq(0).attr("id");
      $("#" + tab_id.replace("tab", "module")).removeClass('is-hidden');

      if (tab_id == "traffic-tab"){
        getTrafficData();
      }
      else if (tab_id = "ticker-tab"){
        getTickerData();
      }
    }

    //hide all tabs if only 1 left
    if ($(".module-tab:not(.is-hidden)").length == 1){
      $(".module-tab").addClass('is-hidden');
    }

    //</editor-fold>
  }

  //</editor-fold>

  //<editor-fold>-------------------------------CONTACT FORM-------------------------------

  function setupContactTab(){
    if (listing_info.status == 1){
      //set up phone
      $("#contact_phone").intlTelInput({
        utilsScript: "/js/jquery/utils.js"
      });

      //get a random char phrase
      if (!listing_info.premium || (listing_info.premium && listing_info.show_placeholder == 1)){
        $("#contact_name").attr("placeholder", random_char.name);
        $("#contact_email").attr("placeholder", random_char.email);
        $("#contact_message").attr("placeholder", random_char.message + " Anyways, I'm interested in buying " + listing_info.domain_name + ". Let's chat.");
      }
      else {
        $("#contact_name").attr("placeholder", "John Smith");
        $("#contact_email").attr("placeholder", "john@smith.com");
        $("#contact_message").attr("placeholder", "Hey! I'm interested in buying " + listing_info.domain_name + ". Let's chat.");
      }

      //placeholder + minimum on contact form
      if (listing_info.min_price > 0){
        $("#contact_offer").attr("min", listing_info.min_price / getCurrencyMultiplier(listing_info.default_currency)).attr("placeholder", "Minimum " + formatCurrency(listing_info.min_price,  listing_info.default_currency));
      }

      //offer currency
      $("#offer-currency").text("Offer in " + listing_info.default_currency + " (" + currency_codes[listing_info.default_currency.toUpperCase()].name + ")");

      //click buy tab (tutorial / focus)
      $("#contact-form-tab").off().on("click", function(e){
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
      $("#buy-now-form").off().on("submit", function(e){
        var type_of_submit = $(this).data('type_of_submit');
        e.preventDefault();

        if ($("#contact_phone").intlTelInput("isValidNumber")){

          //visual feedback of form submission
          var button_id = (type_of_submit == "buy") ? "buy-now-button" : "send-offer-button";
          $("#" + button_id).addClass('is-loading');
          $(".contact-input").attr('disabled', true);
          $(".notification").addClass('is-hidden').removeClass('is-active');

          //comparison only, no need for AJAX
          if (compare){
            testSubmitBuyHandler(button_id);
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

              if (data.state == "success"){
                if (type_of_submit == "offer"){
                  clearNotification();
                  successMessage("Success! Please check your email for further instructions.");
                  $("#buy-now-form").off();
                  $("#" + button_id).removeClass('is-loading');
                }
                else {
                  window.location.assign("/listing/" + listing_info.domain_name + "/checkout/buy");
                }
              }
              else {
                $("#" + button_id).removeClass('is-loading');
                $(".contact-input").removeAttr('disabled');
                clearNotification();
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
    }
    else {
      $("#contact-form-tab").addClass("is-hidden");
      $("#contact-form-module").addClass("is-hidden");
    }
  }

  //</editor-fold>

  //<editor-fold>-------------------------------RENTAL-------------------------------

  function setupRentalTab(){
    if (listing_info.rentable && listing_info.status == 1){

      //submit times (redirect to rental checkout)
      $("#checkout-button").off().on("click", function(){
        submitTimes();
      });

      //refresh calendar times
      $("#refresh-calendar-button").off().on("click", function(){
        getTimes();
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
      $("#typed-slash").off().on("focus", function(){
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

          getTimes();
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
            getTimes();
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

      //rental input domain title (middle ellipsis crop)
      var rental_domain_title = (listing_info.domain_name.length > 20) ? listing_info.domain_name.substr(0,12) + "..." + listing_info.domain_name.substr(-8) : listing_info.domain_name;
      $("#rental-domain-title").text(rental_domain_title);

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
  }

    //<editor-fold>-------------------------------SUBMIT TIMES-------------------------------

    //check if everything is legit
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

    //submit times for rental
    function submitTimes(){
      $("#checkout-button").addClass('is-loading');

      var newEvent = checkTimes();
      if (newEvent.starttime && newEvent.endtime){

        //test rental submit (for compare tool)
        if (compare){
          testSubmitRentHandler();
        }
        else {
          //submit the desired rental times
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
            //redirect to checkout page
            if (data.state == "success"){
              window.location.assign("/listing/" + listing_info.domain_name + "/checkout/rent");
            }
            else if (data.state == "error"){
              $("#checkout-button").removeClass('is-loading');
              errorHandler(data.message);
              getTimes();
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
  function getTimes(){
    //now loading times
    $("#calendar-input").addClass('is-hidden');
    $("#calendar-regular-message").addClass('is-hidden');
    $("#calendar-error-message").addClass('is-hidden');
    $("#calendar-loading-message").removeClass('is-hidden');

    //remove if calendar already exists
    if ($("#calendar-input").data('daterangepicker')){
      $("#calendar-input").data('daterangepicker').remove();
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
        $("#calendar-input").removeClass('is-hidden');
        $("#calendar-loading-message").addClass('is-hidden');
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

          //set up new calendar
          myPath = $("#typed-slash").val();
          setUpCalendar(listing_info);
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
    $("#calendar-loading-message").addClass('is-hidden');

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
    $("#calendar-input").off().on('apply.daterangepicker', function(ev, picker) {
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
    $(".daterangepicker").appendTo("#calendar");

    //only show if the calendar input is visible
    $("#calendar-input").data('daterangepicker').show();
    $("#calendar-input").addClass('is-hidden');

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

      //total price text
      if (totalPrice > 0){
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
      else {
        $(".actual-price").text("Free!");
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
          $(this).text(formatCurrency(now, listing_info.default_currency, true));
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

  //</editor-fold>

  //<editor-fold>-------------------------------TRAFFIC-------------------------------

  function setupTrafficTab(){

    //show alexa data
    if (!listing_info.alexa && (listing_info.premium && listing_info.show_alexa_stats) || !listing_info.premium){
      getAlexaData();
    }
    else if (listing_info.premium && !listing_info.show_alexa_stats){
      $("#alexa-stats-wrapper").addClass("is-hidden");
    }
    else {
      $("#alexa-stats-wrapper").removeClass("is-hidden");
    }

    //show traffic chart
    if ((listing_info.premium && listing_info.show_traffic_graph) || !listing_info.premium){
      $("#traffic-chart-wrapper").removeClass("is-hidden");
      getTickerData();
    }
    else {
      $("#traffic-chart-wrapper").addClass("is-hidden");
    }

    //only get traffic if it's visible due to chartjs responsive endless loop
    if ((listing_info.premium && listing_info.show_traffic_graph) || !listing_info.premium){
      if ($(".module").eq(0).attr("id") == "traffic-module"){
        $(".listing-wrapper").addClass("is-active");
        getTrafficData();
      }
    }
  }

    //<editor-fold>-------------------------------TRAFFIC CHART-------------------------------

    //get traffic data if we havent yet
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

    //create an empty chart
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
          layout: {
            padding: {
              top: 20,
              bottom: 20,
              left: 0,
              right: 0
            }
          },
          maintainAspectRatio: false,
          legend: {
            display: false
          },
          scales: {
            xAxes: [{
              type: "category",
              gridLines : {
                  display : false
              },
              ticks: {
                fontStyle: 700,
                fontColor: 'rgba(0,0,0,0.66)',
                padding: 10,
              }
            }],
            yAxes: [{
              gridLines : {
                drawBorder: false,
                drawTicks: false
              },
              ticks: {
                userCallback: function(label, index, labels) {
                  // when the floored value is the same as the value we have a whole number
                  if (Math.floor(label) === label) {
                    return label;
                  }
                },
                fontStyle: 700,
                fontColor: 'rgba(0,0,0,0.66)',
                padding: 20,
                suggestedMax: 5,
                beginAtZero: true,   // minimum value will be 0.
              }
            }]
          }

        }
      });
    }

    //format the stats to the required format
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

    //initiate chart only if uninitiated
    function createTrafficChart(compare){
      var formatted_dataset = formatDataset(listing_info.traffic);

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
            data: formatted_dataset.traffic_views,
            pointBorderWidth: 4,
            pointHoverRadius: 4,
            pointHoverBorderWidth: 2,
            pointRadius: 4,
            hitRadius: 4,
            pointBackgroundColor: '#fff',
            backgroundColor: ((listing_info.traffic && listing_info.premium && listing_info.primary_color) || compare) ? hexToRgbA(listing_info.primary_color, 0.65, true) : "rgba(60, 188, 141, 0.65)",
            borderWidth: 2,
            borderColor: ((listing_info.traffic && listing_info.premium && listing_info.primary_color) || compare) ? hexToRgbA(listing_info.primary_color, 1, true) : "#3CBC8D",
          }]
        },
        options: {
          layout: {
            padding: {
              top: 20,
              bottom: 20,
              left: 0,
              right: 0
            }
          },
          maintainAspectRatio: false,
          legend: {
            display: false
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
                  var views_plural = (tooltipItems[0].yLabel == 1) ? " request" : " requests";
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
              type: "category",
              gridLines : {
                  display : false
              },
              ticks: {
                fontStyle: 700,
                fontColor: 'rgba(0,0,0,0.66)',
                padding: 10,
              }
            }],
            yAxes: [{
              gridLines : {
                drawBorder: false,
                drawTicks: false
              },
              ticks: {
                userCallback: function(label, index, labels) {
                  // when the floored value is the same as the value we have a whole number
                  if (Math.floor(label) === label) {
                    return label;
                  }
                },
                fontStyle: 700,
                fontColor: 'rgba(0,0,0,0.66)',
                padding: 20,
                suggestedMax: 5,
                beginAtZero: true,   // minimum value will be 0.
              }
            }]
          }
        }
      });
    }

    //</editor-fold>

    //<editor-fold>-------------------------------ALEXA STATS-------------------------------

    //get alexa data
    function getAlexaData(){
      $.ajax({
        url: "/listing/" + listing_info.domain_name.toLowerCase() + "/alexa",
        method: "POST"
      }).done(function(data){
        createAlexa(data.alexa);
      });
    }

    //edit alexa information
    function createAlexa(alexa){
      if (alexa){
        listing_info.alexa = alexa;

        var globalrank = (alexa.globalRank == "-") ? "No data!" : alexa.globalRank;
        $("#alexa-globalrank").text(globalrank);

        var bouncerate = (alexa.engagement && alexa.engagement.bounceRate == "-") ? "No data!" : alexa.engagement.bounceRate;
        $("#alexa-bouncerate").text(bouncerate);

        var timeonsite = (alexa.engagement && alexa.engagement.dailyTimeOnSite == "-") ? "No data!" : alexa.engagement.dailyTimeOnSite;
        $("#alexa-timeonsite").text(timeonsite);

        var pageviews = (alexa.engagement && alexa.engagement.dailyPageViewPerVisitor == "-") ? "No data!" : alexa.engagement.dailyPageViewPerVisitor;
        $("#alexa-pageviews").text(pageviews);
      }
    }

    //</editor-fold>

  //</editor-fold>

  //<editor-fold>-------------------------------HISTORY TICKER-------------------------------

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
          oldest_rental_date: (listing_info.rentals && listing_info.rentals.length > 0) ? listing_info.rentals[listing_info.rentals.length - 1].date : new Date().getTime()
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
        setupCustomColorsListing();
      }

      //show load more only if max count returned
      if (loaded_rentals.length == max_count){
        $("#ticker-loadmore").removeClass('is-hidden').appendTo("#ticker-wrapper").off().on("click", function(){
          getTickerData($(this));
        });
      }
    }

    //nothing more to load if less than max_count returned
    if (!loaded_rentals || loaded_rentals.length < max_count){
      editTickerDates();
    }
  }

  //create ticker row
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
        ticker_icon.replaceWith("<i class='fal fa-camera-retro'></i>");
      }

      //showing a GIF
      else if (rental.address.match(/\.(gif)$/) != null){
        var ticker_type = ticker_pre_tense + " us" + ticker_verb_tense + " " + path + " to display <a target='_blank' href=" + rental.address + " class='is-info is-underlined'>a GIF</a>";
        ticker_icon_color.addClass('is-dark');
        ticker_icon.replaceWith("<i class='fal fa-video'></i>");
      }

      //showing a PDF
      else if (rental.address.match(/\.(pdf)$/) != null){
        var ticker_type = ticker_pre_tense + " us" + ticker_verb_tense + " " + path + " to display <a target='_blank' href=" + rental.address + " class='is-info is-underlined'>a PDF</a>";
        ticker_icon_color.addClass('is-dark');
        ticker_icon.replaceWith("<i class='fal fa-file-pdf'></i>");
      }

      //showing a website
      else if (rental.address){
        var ticker_address = getHost(rental.address);
        var ticker_type = ticker_pre_tense + " us" + ticker_verb_tense + " " + path + " to display content from <a target='_blank' href=" + rental.address + " class='is-info is-underlined'>" + ticker_address + "</a>";
        ticker_icon_color.addClass('is-primary');
        ticker_icon.replaceWith("<i class='fal fa-desktop'></i>");
      }

      //showing nothing
      else {
        var ticker_type = ticker_pre_tense + " us" + ticker_verb_tense + " " + path + " to display nothing";
        ticker_icon_color.addClass('is-black');
        ticker_icon.replaceWith("<i class='fal fa-eye-slash'></i>");
      }
    }
    //forward the domain
    else {
      var ticker_address = getHost(rental.address);
      var ticker_type = ticker_pre_tense + "forward" + ticker_verb_tense + " " + path + " to <a target='_blank' href='" + rental.address + "' class='is-info is-underlined'>" + ticker_address + "</a>";
      ticker_icon_color.addClass('is-accent');
      ticker_icon.replaceWith("<i class='fal fa-share'></i>");
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

  //<editor-fold>-------------------------------OTHER DOMAINS-------------------------------

  function setupOtherDomainsTab(){
    if ((listing_info.premium && listing_info.show_domain_list) || !listing_info.premium){
      findOtherDomainsListing();
    }
  }

  //<editor-fold>-------------------------------OTHER DOMAINS-------------------------------

  //other domains by same owner
  function findOtherDomainsListing(){
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
        if (data.state == "success" && data.listings.length > 0){
          listing_info.other_listings = data.listings;
          createOtherDomains(data.listings);
        }
        else {
          listing_info.other_listings = [];
          $("#domainlist-tab").addClass('is-hidden');
          $("#domainlist-module").addClass("is-hidden");
        }
      });
    }
  }

  //create the other domain
  function createOtherDomains(other_listings){
    $("#otherowner-domains").removeClass('is-hidden');
    $(".other-domain:not(#otherowner-domain-clone)").remove();
    for (var x = 0; x < other_listings.length; x++){
      var cloned_similar_listing = $("#otherowner-domain-clone").clone();
      cloned_similar_listing.removeAttr("id").removeClass('is-hidden');

      //edit it based on new listing info
      var sliced_domain = other_listings[x].domain_name;

      //available to buy now
      if (other_listings[x].buy_price > 0){
        var buy_price = formatCurrency(parseFloat(other_listings[x].buy_price), listing_info.default_currency);
        cloned_similar_listing.find(".otherowner-domain-price").text("Buy Now: " + buy_price);
      }
      //available to buy at a specific minimum price
      else if (other_listings[x].min_price > 0){
        var min_price = formatCurrency(parseFloat(other_listings[x].min_price), listing_info.default_currency);
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

  //</editor-fold>

//</editor-fold>

//<editor-fold>-------------------------------HELPERS-------------------------------

//get the hostname of a URL
function getHost(href) {
  var l = document.createElement("a");
  l.href = href;
  return l.hostname.replace("www.", "");
};

//get query string
function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
  results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function updateQueryStringParam(key, value, push) {
  var baseUrl = [location.protocol, '//', location.host, location.pathname].join(''),
  urlQueryString = document.location.search,
  newParam = key + '=' + value,
  params = '?' + newParam;
  // If the "search" string exists, then build params from it
  if (urlQueryString) {
    updateRegex = new RegExp('([\?&])' + key + '[^&]*');
    removeRegex = new RegExp('([\?&])' + key + '=[^&;]+[&;]?');
    if( typeof value == 'undefined' || value == null || value == '' ) { // Remove param if value is empty
      params = urlQueryString.replace(removeRegex, "$1");
      params = params.replace( /[&;]$/, "" );
    } else if (urlQueryString.match(updateRegex) !== null) { // If param exists already, update it
      params = urlQueryString.replace(updateRegex, "$1" + newParam);
    } else { // Otherwise, add it to end of query string
      params = urlQueryString + '&' + newParam;
    }
  }
  params = (params == "?") ? "" : params;
  if (push){
    window.history.pushState({}, "", baseUrl + params);
  }
  else {
    window.history.replaceState({}, "", baseUrl + params);
  }
};

function removeURLParameter(parameter, push) {
  var url = [location.protocol, '//', location.host, location.pathname].join('');
  var urlparts= window.location.href.split('?');
  if (urlparts.length>=2) {
    var prefix= encodeURIComponent(parameter)+'=';
    var pars= urlparts[1].split(/[&;]/g);
    //reverse iteration as may be destructive
    for (var i= pars.length; i-- > 0;) {
      //idiom for string.startsWith
      if (pars[i].lastIndexOf(prefix, 0) !== -1) {
        pars.splice(i, 1);
      }
    }
    url= urlparts[0] + (pars.length > 0 ? '?' + pars.join('&') : "");
    if (push){
      window.history.pushState({}, "", url);
    }
    else {
      window.history.replaceState({}, "", url);
    }
  } else {
    if (push){
      window.history.pushState({}, "", url);
    }
    else {
      window.history.replaceState({}, "", url);
    }
  }
}

//to format a number for currency
function formatCurrency(number, currency_code, decimals){
  var default_currency_details = (currency_code) ? currency_codes[currency_code.toUpperCase()] : currency_codes["USD"];
  var currency_details = {
    thousand: ',',
    decimals: 0,
  }

  //show decimals
  if (decimals){
    currency_details.decimals = default_currency_details.fractionSize;
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

//get multiplier of a currency
function getCurrencyMultiplier(currency_code){
  var default_currency_details = (currency_code) ? currency_codes[currency_code.toUpperCase()] : currency_codes["USD"];
  return Math.pow(10, default_currency_details.fractionSize);
}

//</editor-fold>
