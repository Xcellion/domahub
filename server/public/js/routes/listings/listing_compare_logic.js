var tutorial_tour;
var listing_description_tour = false;

$(document).ready(function() {

  //#region ---------------------------------COMPARE TOOL SETUP--------------------------------------------------

  //hide bottom right notification button
  $("#compare-msg .delete").on("click", function(e){
    $("#compare-msg").appendTo('#compare-content').removeClass("is-hidden").addClass("is-footer");
  });

  //hide compare msg automatically if mobile
  if (window.mobilecheck()){
    $("#compare-msg").appendTo('#compare-content').removeClass("is-hidden").addClass("is-footer");
  }

  //change compare tabs
  $(".compare-tab").on("click", function(){
    $(".compare-tab").removeClass('is-active');
    $(this).addClass('is-active');

    var box_id = $(this).attr('id').split("-")[0];
    $(".compare-box").addClass('is-hidden');
    $("#" + box_id + "-box").removeClass('is-hidden');

    //design tab
    if (box_id == "design" && tutorial_tour && !tutorial_tour.ended() && tutorial_tour.getCurrentStep() == 4){
      tutorial_tour.goTo(5);
    }
  });

  //populate all themes
  populateThemeDropdown();

  var current_theme = getParameterByName("theme") || $("#theme-input").val();
  switchTheme(current_theme);

  //INFO TAB
  updateDescription();
  updatePricing();
  updateBIN();

  //DESIGN TAB
  loadThemeHandler();
  loadBackgroundHandlers();
  loadColorSchemeHandlers();
  loadFontStyleHandlers();
  loadFooterStylingHandlers();
  updateModules();

  loadPremiumAndBasicHandler();
  menuButtonHandlers();

  //#endregion

  //#region ---------------------------------TUTORIAL--------------------------------------------------

  if (getParameterByName("tutorial") != "false"){
    tutorial_tour = new Tour({
    storage: false,
    orphan: true,
    backdrop: true,
    name: "tutorial",
    template: "<div class='popover tour'> \
                <div class='popover-content margin-top-0 content'></div> \
                <div class='popover-navigation'> \
                  <button class='button is-stylish is-small' data-role='prev'> \
                    <span class='icon is-small'> \
                      <i class='fal fa-angle-double-left'></i> \
                    </span> \
                    <span>Prev</span> \
                  </button> \
                  <button class='button is-stylish is-small is-primary' data-role='next'> \
                    <span>Next</span> \
                    <span class='icon is-small'> \
                      <i class='fal fa-angle-double-right'></i> \
                    </span> \
                  </button> \
                  <button class='button is-stylish is-small' data-role='end'> \
                    <span class='icon is-small'> \
                      <i class='fal fa-sign-out'></i> \
                    </span> \
                    <span>End Tutorial</span> \
                  </button> \
                </div> \
              </div>",
    steps: [

      //main welcome step - 0
      {
        onShow: function(){
          toggleMenu(false);
        },
        template: "<div class='popover tour'> \
        <h3 class='popover-title'></h3> \
        <div class='popover-content content'></div> \
        <div> \
        <div class='is-grouped control'> \
          <div class='control is-expanded'> \
            <button class='button is-fullwidth is-stylish is-small is-primary' data-role='next'> \
              <span class='icon is-small'> \
                <i class='fal fa-thumbs-up'></i> \
              </span> \
              <span>Yes! Show me how it works.</span> \
            </button> \
          </div> \
          <div class='control is-expanded'> \
            <button class='button is-fullwidth is-stylish is-small is-danger is-outlined' data-role='end'> \
              <span class='icon is-small'> \
                <i class='fal fa-frown'></i> \
              </span> \
              <span>No, I'll figure it out.</span> \
            </button> \
          </div> \
          </div> \
        </div> \
        </div>",
        title: "Welcome to the DomaHub listing page demo",
        content: "This demo will guide you through a DomaHub landing page and all of its features.",
      },

      //show menu button step - 1
      {
        element: "#show-menu-button",
        container: "#show-menu-wrapper",
        backdropContainer: "#show-menu-wrapper",
        placement: "bottom",
        onShow : function(){
          toggleMenu(false);
          $("#show-menu-button").addClass('is-primary');
        },
        onHide: function(){
          $("#show-menu-button").removeClass('is-primary');
        },
        template: "<div class='popover tour'> \
                    <div class='popover-content margin-top-0 content'></div> \
                    <div class='popover-navigation'> \
                      <div> \
                        <button class='button is-stylish is-small' data-role='prev'> \
                          <span class='icon is-small'> \
                            <i class='fal fa-angle-double-left'></i> \
                          </span> \
                          <span>Prev</span> \
                        </button> \
                        <button class='button is-stylish is-small' data-role='end'> \
                          <span class='icon is-small'> \
                            <i class='fal fa-sign-out'></i> \
                          </span> \
                          <span>End Tutorial</span> \
                        </button> \
                      </div> \
                    </div> \
                  </div>",
        content: "Click this button to bring up the settings menu for this page.",
      },

      //explain menu step - 2
      {
        element: "#compare-menu",
        container: "#compare-menu",
        placement: "right",
        onShow: function(){
          toggleMenu(true);
        },
        template: "<div class='popover tour'> \
                    <div class='popover-content margin-top-0 content'></div> \
                    <div class='popover-navigation'> \
                      <button class='button is-stylish is-small' data-role='prev'> \
                        <span class='icon is-small'> \
                          <i class='fal fa-angle-double-left'></i> \
                        </span> \
                        <span>Prev</span> \
                      </button> \
                      <button class='button is-stylish is-small is-primary' data-role='next'> \
                        <span>Next</span> \
                        <span class='icon is-small'> \
                          <i class='fal fa-angle-double-right'></i> \
                        </span> \
                      </button> \
                      <button class='button is-stylish is-small' data-role='end'> \
                        <span class='icon is-small'> \
                          <i class='fal fa-sign-out'></i> \
                        </span> \
                        <span>End Tutorial</span> \
                      </button> \
                    </div> \
                  </div>",
        backdropContainer: ".page-contents",
        content: "You can use this menu to quickly test the look and feel of your DomaHub domain listing.",
      },

      //try editing description - 3
      {
        element: "#compare-description-control",
        container: "#compare-menu",
        backdropContainer: "#compare-menu",
        backdropPadding: 15,
        placement: "bottom",
        onShow: function(){
          toggleMenu(true);
          $("#info-edit-tab").click();
          $(".page-contents").append("<div class='tour-backdrop'></div>");
        },
        onHide: function(){
          if (listing_description_tour && !listing_description_tour.ended()){
            listing_description_tour.end();
          }
          $(".page-contents").find(".tour-backdrop").remove();
        },
        template: "<div class='popover tour'> \
                    <div class='popover-content margin-top-0 content'></div> \
                    <div class='popover-navigation'> \
                      <button class='button is-stylish is-small' data-role='prev'> \
                        <span class='icon is-small'> \
                          <i class='fal fa-angle-double-left'></i> \
                        </span> \
                        <span>Prev</span> \
                      </button> \
                      <button class='button is-stylish is-small is-primary' data-role='next'> \
                        <span>Next</span> \
                        <span class='icon is-small'> \
                          <i class='fal fa-angle-double-right'></i> \
                        </span> \
                      </button> \
                      <button class='button is-stylish is-small' data-role='end'> \
                        <span class='icon is-small'> \
                          <i class='fal fa-sign-out'></i> \
                        </span> \
                        <span>End Tutorial</span> \
                      </button> \
                    </div> \
                  </div>",
        content: "You can edit the listing description here! Remember, this is just a testing tool. Nothing is saved."
      },

      //design tab - 4
      {
        element: "#design-tab",
        container: "#compare-menu",
        backdropContainer: "#compare-menu",
        backdropPadding: 15,
        placement: "bottom",
        onShow: function(){
          toggleMenu(true);
          $(".page-contents").append("<div class='tour-backdrop'></div>");
        },
        onHide: function(){
          $(".page-contents").find(".tour-backdrop").remove();
        },
        template: "<div class='popover tour'> \
                    <div class='popover-content margin-top-0 content'></div> \
                    <div class='popover-navigation'> \
                      <button class='button is-stylish is-small' data-role='prev'> \
                        <span class='icon is-small'> \
                          <i class='fal fa-angle-double-left'></i> \
                        </span> \
                        <span>Prev</span> \
                      </button> \
                      <button class='button is-stylish is-small' data-role='end'> \
                        <span class='icon is-small'> \
                          <i class='fal fa-sign-out'></i> \
                        </span> \
                        <span>End Tutorial</span> \
                      </button> \
                    </div> \
                  </div>",
        content: "You can also change the look and feel of your DomaHub listing."
      },

      //try theme - 5
      {
        element: "#theme-control",
        container: "#compare-menu",
        backdropContainer: "#compare-menu",
        backdropPadding: 15,
        placement: "bottom",
        onShow: function(){
          toggleMenu(true);
          $(".page-contents").append("<div class='tour-backdrop'></div>");
        },
        onHide: function(){
          $(".page-contents").find(".tour-backdrop").remove();
        },
        template: "<div class='popover tour'> \
                    <div class='popover-content margin-top-0 content'></div> \
                    <div class='popover-navigation'> \
                      <button class='button is-stylish is-small' data-role='prev'> \
                        <span class='icon is-small'> \
                          <i class='fal fa-angle-double-left'></i> \
                        </span> \
                        <span>Prev</span> \
                      </button> \
                      <button class='button is-stylish is-small is-primary' data-role='next'> \
                        <span>Next</span> \
                        <span class='icon is-small'> \
                          <i class='fal fa-angle-double-right'></i> \
                        </span> \
                      </button> \
                      <button class='button is-stylish is-small' data-role='end'> \
                        <span class='icon is-small'> \
                          <i class='fal fa-sign-out'></i> \
                        </span> \
                        <span>End Tutorial</span> \
                      </button> \
                    </div> \
                  </div>",
        content: "Click here to edit the listing theme! If none of them fit your needs, you can always create a custom theme for your DomaHub listing."
      },

      //contact offer form - 6
      {
        element: "#buy-module",
        backdropContainer: ".page-contents",
        placement: (window.mobilecheck()) ? "top" : "right",
        onShow: function(){
          toggleMenu(false);
          showBuyStuff($("#buy-now-button"));
        },
        content: 'Potential customers can use this form to contact you. All contact information is verified before you are notified of any new offers.'
      },

      //click rentable tab - 7
      {
        element: "#calendar-tab",
        backdropContainer: ".page-contents",
        placement: "bottom",
        onShow: function(){
          showBuyStuff($("#buy-now-button"));
          $("#compare-menu").append("<div class='tour-backdrop'></div>");
        },
        onHide: function(){
          $("#compare-menu").find(".tour-backdrop").remove();
        },
        template: "<div class='popover tour'> \
                    <div class='popover-content margin-top-0 content'></div> \
                    <div class='popover-navigation'> \
                      <button class='button is-stylish is-small' data-role='prev'> \
                        <span class='icon is-small'> \
                          <i class='fal fa-angle-double-left'></i> \
                        </span> \
                        <span>Prev</span> \
                      </button> \
                      <button class='button is-stylish is-small' data-role='end'> \
                        <span class='icon is-small'> \
                          <i class='fal fa-sign-out'></i> \
                        </span> \
                        <span>End Tutorial</span> \
                      </button> \
                    </div> \
                  </div>",
        content: "At DomaHub, you can also choose to rent out your domains as a new source of revenue."
      },

      //rental tab - 8
      {
        element: "#calendar-module",
        backdropContainer: ".page-contents",
        placement: (window.mobilecheck()) ? "top" : "right",
        onShow: function(){
          $("#compare-menu").append("<div class='tour-backdrop'></div>");
          showRentalStuff($("#rent-now-button"));
        },
        onHide: function(){
          $("#compare-menu").find(".tour-backdrop").remove();
        },
        content: 'Customers use this calendar to rent the domain for variable lengths of time and forward the domain to their desired URL. All rentals are cross-checked against the <a href="https://developers.google.com/safe-browsing/" class="is-primary is-underlined">Google Safe Browsing API.</a>'
      },

      //click traffic tab - 9
      {
        element: "#traffic-tab",
        backdropContainer: ".page-contents",
        placement: "bottom",
        onShow: function(){
          $("#compare-menu").append("<div class='tour-backdrop'></div>");
        },
        onHide: function(){
          $("#compare-menu").find(".tour-backdrop").remove();
        },
        template: "<div class='popover tour'> \
                    <div class='popover-content margin-top-0 content'></div> \
                    <div class='popover-navigation'> \
                      <button class='button is-stylish is-small' data-role='prev'> \
                        <span class='icon is-small'> \
                          <i class='fal fa-angle-double-left'></i> \
                        </span> \
                        <span>Prev</span> \
                      </button> \
                      <button class='button is-stylish is-small' data-role='end'> \
                        <span class='icon is-small'> \
                          <i class='fal fa-sign-out'></i> \
                        </span> \
                        <span>End Tutorial</span> \
                      </button> \
                    </div> \
                  </div>",
        content: "We also provide traffic information about your domain in this tab."
      },

      //traffic module - 10
      {
        element: "#traffic-module",
        backdropContainer: ".page-contents",
        placement: "top",
        onShow: function(){
          $("#compare-menu").append("<div class='tour-backdrop'></div>");
        },
        onHide: function(){
          $("#compare-menu").find(".tour-backdrop").remove();
        },
        content: 'This tab shows traffic information about your domain including number of visits, and Alexa rankings.'
      },

      //final step - 11
      {
        autoScroll: true,
        title: "Thats the end of the DomaHub demo!",
        content: "If you have any further questions, please do not hesitate to <a href='/contact' class='is-primary is-underlined'>contact us</a>.",
        onShow: function(){
          toggleMenu(false);
        },
        template: "<div class='popover tour'> \
          <h3 class='popover-title'></h3> \
          <div class='popover-content content'></div> \
          <div> \
            <div class='control is-grouped'> \
              <div class='control is-expanded'> \
                <a href='/signup' class='button is-fullwidth is-stylish is-small is-primary'> \
                  <span class='icon is-small'> \
                    <i class='fal fa-thumbs-up'></i> \
                  </span> \
                  <span>That was awesome! Sign me up.</span> \
                </a> \
              </div> \
              <div class='control is-expanded'> \
                <button class='button is-fullwidth is-stylish is-small is-danger is-outlined' data-role='end'> \
                  <span class='icon is-small'> \
                    <i class='fal fa-sign-out'></i> \
                  </span> \
                  <span>I still want to explore.</span> \
                </button> \
              </div> \
            </div> \
          </div> \
        </div>"
      },

    ]
  });
    tutorial_tour.init();
    tutorial_tour.start();
  }
  else {
    $("#show-menu-wrapper, #compare-msg").addClass('is-hidden');
  }

  //restart the tutorial (where you left off)
  $(".restart-tutorial-button").on('click', function(){
    if (tutorial_tour){
      var cur_step = tutorial_tour.getCurrentStep();
      if (cur_step == 10){
        tutorial_tour.restart();
      }
      else {
        tutorial_tour.start(true);
      }
    }
  });

  //click backdrop to end tour
  $(".tour-backdrop").on("click", function(){
    tutorial_tour.end();
  });

  //#endregion

});

//#region ---------------------------------MENU--------------------------------------------------

//hide and show menu
function menuButtonHandlers() {
  //click to hide the compare tool
  $("#hide-menu-button").on("click", function() {
    toggleMenu(false);

    //clicked the button during tutorial
    if (!tutorial_tour.ended()){
      tutorial_tour.prev();
    }
  });

  //click to show the compare tool
  $("#show-menu-button").on("click",function() {
    toggleMenu(true);

    //clicked the button during tutorial
    if (!tutorial_tour.ended()){
      tutorial_tour.next();
    }
  });
}

//show or hide menu
function toggleMenu(show){
  if (show){
    $("#compare-menu").addClass("is-active");
    $(".page-contents").addClass("is-active");
    $("#modules-wrapper").addClass("is-active");
    $("#dh-footer").addClass("is-active");
    $("#show-menu-button").fadeIn(100).removeAttr("style").addClass("is-hidden");
  }
  else {
    $("#compare-menu").removeClass("is-active");
    $(".page-contents").removeClass("is-active");
    $("#modules-wrapper").removeClass("is-active");
    $("#dh-footer").removeClass("is-active");
    $("#show-menu-button").fadeIn(100).removeAttr("style").removeClass("is-hidden");
  }
}

//#endregion

//#region ---------------------------------THEMES--------------------------------------------------

//switch theme
function switchTheme(theme_name){
  var theme_to_load = findTheme(theme_name);

  //changing theme during tutorial
  $(".page-contents").find(".tour-backdrop").remove();

  //if there wasnt a theme, load domahub theme
  if (!theme_to_load && theme_name != "Custom"){
    var theme_to_load = findTheme("DomaHub");
  }
  else if (theme_name == "Custom"){
    var theme_to_load = {
      theme_name : "Custom"
    }
  }

  for (var x in theme_to_load){
    listing_info[x] = theme_to_load[x];
  }

  //edit footer if it's not a basic theme
  if (theme_to_load.theme_name != "DomaHub"){
    updateFooter(true);
  }
  else {
    updateFooter(false);
  }

  updateBackgroundImage(listing_info.background_image);
  updateBackgroundColor(listing_info.background_color);
  updateFontName(listing_info.font_name);
  updateColorScheme(listing_info.primary_color, listing_info.secondary_color, listing_info.tertiary_color);
  updateFontColor(listing_info.font_color);
  updateFontName(listing_info.font_name);

  loadBackgroundHandlers();
  loadColorSchemeHandlers();
  loadFontStyleHandlers();
  loadPremiumAndBasicHandler();
  loadFooterStylingHandlers();

  $("#theme-input").val(theme_to_load.theme_name);
  updateQueryStringParam("theme", theme_to_load.theme_name);
}

//#endregion

//#region ---------------------------------INFO TAB--------------------------------------------------

//update the description / description footer
function updateDescription(){
  $("#description").val(listing_info.description).on("input", function(){
    listing_info.description = $(this).val();
    setupDescription();

    if (!!window.mobilecheck()){
      //tutorial tour is still going on!
      if (!tutorial_tour.ended()){
        if (!listing_description_tour && !window.mobilecheck()){
          listing_description_tour = new Tour({
            storage: false,
            animation: false,
            name: "description",
            template: "<div class='popover tour'> \
            <h3 class='popover-title'></h3> \
            <div class='popover-content margin-top-0'></div> \
            </div>",
            onStart: function(){
              $(".page-contents").find(".tour-backdrop").remove();
            },
            steps: [
              //description is edited! - 4
              {
                element: "#description-text",
                placement: "right",
                backdrop: true,
                animation: false,
                backdropContainer: ".page-contents",
                backdropPadding: 15,
                content: "The listing description will update automatically as you type. </br> </br> A well-written description can help your audience understand the full potential of your domain name!",
              },
            ]
          });

          listing_description_tour.init();
          listing_description_tour.start();

        }
        else if (listing_description_tour.ended() && tutorial_tour.getCurrentStep() == 3){
          listing_description_tour.restart();
        }
        else {
          listing_description_tour.goTo(0);
        }
      }

    }
  });
  $("#description-footer").val(listing_info.description_footer).on("input", function(e){
    if ($(this).val().length < 100){
      listing_info.description_footer = $(this).val();
      setupFooter();
    }
  });
}

//update pricing
function updatePricing(){
  var buy_price = getParameterByName("buy_price") || listing_info.buy_price;
  $("#buy-price-input").val(buy_price / 100).on("input", function(){
    listing_info.buy_price = parseFloat($(this).val()) * 100;
    if (listing_info.buy_price > 0){
      $("#buy-now-button").closest(".control").removeClass("is-hidden").appendTo($("#send-offer-button").closest(".control.is-grouped"));
      $("#buy-now-button, #price-tag").text("Buy now: " + formatCurrency(listing_info.buy_price, listing_info.default_currency));
    }
    else {
      //there is a min price set
      if (listing_info.min_price > 0){
        $("#price-tag").text("Minimum offer: " + formatCurrency(listing_info.min_price, listing_info.default_currency));
      }
      else {
        $("#price-tag").text("Now available");
      }

      $("#buy-now-button").closest(".control").addClass("is-hidden").appendTo($("body"));
    }
  });
  var min_price = getParameterByName("min_price") || listing_info.min_price;
  $("#min-price-input").val(min_price / 100).on("input", function(){
    listing_info.min_price = parseFloat($(this).val()) * 100;
    if (listing_info.min_price > 0){
      if (!listing_info.buy_price){
        $("#price-tag").text("Minimum offer: " + formatCurrency(listing_info.min_price, listing_info.default_currency));
      }
      $("#contact_offer").attr("placeholder", "Minimum " + formatCurrency(listing_info.min_price, listing_info.default_currency));
    }
    else {
      if (!listing_info.buy_price){
        $("#price-tag").text("Now available");
      }
      $("#contact_offer").attr("placeholder", "");
    }
  });
  var price_rate = getParameterByName("price_rate") || listing_info.price_rate;
  $("#price-rate-input").val(Math.round(price_rate / 100)).on("input", function(){
    listing_info.price_rate = parseFloat($(this).val()) * 100;
    if (listing_info.price_rate == 0){
      $("#rent-price-text").text(": Free");
    }
    else {
      $("#rent-price-text").text(": " + formatCurrency(listing_info.price_rate, listing_info.default_currency) + " / " + $("#price-type-input").val());
    }
  });
  var price_type = getParameterByName("price_type") || listing_info.price_type;
  $("#price-type-input").val(price_type).on("input", function(){
    listing_info.price_type = $(this).val();
    if (listing_info.price_rate == 0){
      $("#rent-price-text").text(": Free");
    }
    else {
      $("#rent-price-text").text(": " + formatCurrency(listing_info.price_rate, listing_info.default_currency) + " / " + $("#price-type-input").val());
    }
  });
}

//update BIN
function updateBIN(){
  checkBox(listing_info.buyable, $("#buyable-input"));

  $("#buyable-input").on("change", function(){
    if ($(this).prop("checked")){
      listing_info.buyable = 1;
      $("#buy-button").removeClass('is-hidden');
    }
    else {
      listing_info.buyable = 0;
      $("#buy-button").addClass('is-hidden');
    }
  });
}

//#endregion

//#region ---------------------------------DESIGN TAB--------------------------------------------------

//change URL to custom for premium v basic
function loadPremiumAndBasicHandler(){
  //change to custom theme if anything is changed
  $(".theme-changeable-input").on("change", function(){
    $("#theme-input").val("Custom");
    updateFooter(true);
    updateQueryStringParam("theme", "Custom");
  });
}

//load background handlers
function loadBackgroundHandlers(){

  //highlight refresh button
  $("#background-image-input").off().on("input change", function(){
    if ($(this).val() != listing_info.background_image){
      $("#background-image-refresh").addClass('is-primary').removeClass('is-disabled');
    }
    else {
      $("#background-image-refresh").removeClass('is-primary').addClass('is-disabled');
    }
  });

  //load background image handler
  $("#background-image-refresh").off().on("click", function(){
    $("#background-image-refresh").removeClass('is-primary').addClass('is-disabled');
    updateBackgroundImage($("#background-image-input").val(), false);
  });

  //highlight refresh button
  $("#logo-image-input").off().on("input change", function(){
    if ($(this).val() != listing_info.logo){
      $("#logo-image-refresh").addClass('is-primary').removeClass('is-disabled');
    }
    else {
      $("#logo-image-refresh").removeClass('is-primary').addClass('is-disabled');
    }
  });

  //load background image handler
  $("#logo-image-refresh").off().on("click", function(){
    $("#logo-image-refresh").removeClass('is-primary').addClass('is-disabled');
    updateLogoImage($("#logo-image-input").val(), false);
  });

  //load background color handler
  $("#background-color-input").val(listing_info.background_color);
  $("#background-color-input").minicolors("destroy").minicolors({
    letterCase: "uppercase",
    swatches: ["#FFFFFF", "#E5E5E5", "#B2B2B2", "#7F7F7F", "#666666", "#222222", "#000000"]
  }).off().on("input", function(){
    updateBackgroundColor($(this).val());
  });
}

//input to update background and the page
function updateBackgroundImage(background_image){
  listing_info.background_image = background_image;
  $("#background-image-input").val(background_image);
  if (background_image == ""){
    $(".page-contents").css("background", "");
  }
  else {
    $(".page-contents").css("background", "url(" + background_image + ") center/cover no-repeat");
  }
}

//input to update logo and the page
function updateLogoImage(logo){
  listing_info.logo = logo;
  $("#logo-image-input").val(logo);
  updateFooter(true);
}

//update the footer if it's premium
function updateFooter(premium){
  if (premium){

    //change logo if it exists
    if (listing_info.logo == ""){
      $(".logo-item").addClass("is-hidden");
    }
    else {
      $(".logo-item").attr('src', listing_info.logo).removeClass('is-hidden').css("background", "url(" + listing_info.logo + ") center/cover no-repeat").removeAttr("href");
    }

    //change text
    $("#dh-footer-right-text").replaceWith("<p id='dh-footer-right-text' class='footer-item'>" + listing_info.domain_name + "</p>");
    $("#dh-footer-right-smile").addClass("is-hidden");
    $("#doma_logo").replaceWith("<p id='doma_logo'>" + listing_info.description_footer + "</p>");
  }
  //revert to basic
  else {
    $("#dh-footer-right-text").replaceWith("<p id='dh-footer-right-text' class='footer-item'>Simple, clean sales pages for your domains.</p>");
    $("#dh-footer-right-smile").removeClass("is-hidden");
    $("#doma_logo").replaceWith('<a id="doma_logo" href="https://domahub.com"><i class="fal fa-copyright v-align-bottom"></i> DomaHub, Inc.</a>');
    $(".logo-item").attr("src", "/images/dh-assets/circle-logo/dh-circle-logo-primary-225x225.png").removeClass('is-hidden').removeAttr("style").attr("href", "/");
  }
}

function loadFooterStylingHandlers(){
  var minicolor_options = {
    letterCase: "uppercase",
    swatches: ["#000", "#222", "#D3D3D3", "#FFF"]
  }

  $("#footer-background-color-input").val(listing_info.footer_background_color);
  $("#footer-background-color-input").minicolors("destroy").minicolors(minicolor_options).off().on("change", function(){
    listing_info.footer_background_color = $(this).val();
    setupCustomColorsListing();
  });

  $("#footer-color-input").val(listing_info.footer_color);
  $("#footer-color-input").minicolors("destroy").minicolors(minicolor_options).off().on("change", function(){
    listing_info.footer_color = $(this).val();
    setupCustomColorsListing();
  });
}

//input to update background color and the page
function updateBackgroundColor(background_color){
  listing_info.background_color = background_color;
  $("#background-color-input").val(background_color);
  $(".page-contents").css("background-color", background_color);
}

//load color scheme handlers
function loadColorSchemeHandlers(destroy){
  var minicolor_options = {
    letterCase: "uppercase",
    swatches: ["#3cbc8d", "#FF5722", "#2196F3"]
  }

  $("#primary-color-input").val(listing_info.primary_color)
  $("#primary-color-input").minicolors("destroy").minicolors(minicolor_options).off().on("change", function(){
    updateColorScheme($(this).val(), false, false);
  });
  $("#secondary-color-input").val(listing_info.secondary_color)
  $("#secondary-color-input").minicolors("destroy").minicolors(minicolor_options).off().on("change", function(){
    updateColorScheme(false, $(this).val(), false);
  });
  $("#tertiary-color-input").val(listing_info.tertiary_color)
  $("#tertiary-color-input").minicolors("destroy").minicolors(minicolor_options).off().on("change", function(){
    updateColorScheme(false, false, $(this).val());
  });
}

//inputs to update color scheme
function updateColorScheme(primary_color, secondary_color, tertiary_color){
  if (primary_color != false){
    listing_info.primary_color = primary_color;
    setupCustomColorsListing();

    if (traffic_chart){
      traffic_chart.data.datasets[0].borderColor = hexToRgbA(listing_info.primary_color, 1, true);
      traffic_chart.data.datasets[0].backgroundColor = hexToRgbA(listing_info.primary_color, 0.65, true);
      traffic_chart.update();
    }
  }
  if (secondary_color != false){
    listing_info.secondary_color = secondary_color;
    setupCustomColorsListing();
  }
  if (tertiary_color != false){
    listing_info.tertiary_color = tertiary_color;
    setupCustomColorsListing();
  }
}

//load the font styling handlers
function loadFontStyleHandlers(){
  //font color
  $("#font-color-input").val(listing_info.font_color)
  $("#font-color-input").minicolors("destroy").minicolors({
    letterCase: "uppercase",
    swatches: ["#000", "#222", "#D3D3D3", "#FFF"]
  }).on("change", function(){
    updateFontColor($(this).val());
  });

  //font name
  $("#font-name-input").off().on("change", function(){
    updateFontName($(this).val());
  });
}

//update font color
function updateFontColor(font_color){
  listing_info.font_color = font_color;
  $("#font-color-input").val(font_color);
  setupCustomColorsListing();
}

//update font name
function updateFontName(font_name){
  listing_info.font_name = font_name;
  $("#font-name-input").val(font_name)
  setupCustomColorsListing();
}

//update modules
function updateModules(){
  checkBox(listing_info.rentable, $("#rentable-input"));

  //left
  checkBox(listing_info.show_registrar, $("#show-registrar-input"));
  checkBox(listing_info.show_registration_date, $("#show-registration-date-input"));
  checkBox(listing_info.show_categories, $("#show-categories-input"));
  checkBox(listing_info.show_social_sharing, $("#show-social-sharing-input"));

  //appraisals
  checkBox(listing_info.show_godaddy_appraisal, $("#show-godaddy-appraisal-input"));
  checkBox(listing_info.show_domainindex_appraisal, $("#show-domainindex-appraisal-input"));
  checkBox(listing_info.show_freevaluator_appraisal, $("#show-freevaluator-appraisal-input"));
  checkBox(listing_info.show_estibot_appraisal, $("#show-estibot-appraisal-input"));

  //right
  checkBox(listing_info.show_placeholder, $("#placeholder-input"));
  checkBox(listing_info.show_alexa_stats, $("#alexa-stats-input"));
  checkBox(listing_info.show_traffic_graph, $("#traffic-graph-input"));
  checkBox(listing_info.show_history_ticker, $("#show-history-ticker-input"));
  checkBox(listing_info.show_domain_list, $("#domain-list-input"));

  //toggleable things (domain age, appraisal sites, social media)
  $(".checkbox-input").on("change", function(){
    listing_info[$(this).data("name")] = (listing_info[$(this).data("name")] == 1) ? 0 : 1;
    setupLeftHalf();
    setupRightHalf();
  });
}

//check the module boxes according to value
function checkBox(module_value, elem){
  if (module_value == 1){
    elem.val(1).prop("checked", true);
  }
  else {
    elem.val(0).prop("checked", false);
  }
}

//#endregion

//#region ---------------------------------MODULES--------------------------------------------------

//create a test chart
function createTestChart(){

  if (traffic_chart){
    traffic_chart.destroy();
  }

  listing_info.traffic = [];
  createTrafficChart(true);   //compare module so use custom color
}

//create test domains
function createTestOtherDomains(){
  var test_listings = [];
  var test_domain_names = [
    "knotonmywatch.com",
    "treescompany.com",
    "domains.rocks",
    "excellent.design",
    "creativedoma.in",
    "great.bargains",
    "greatdomains.cheap",
    "ilove.coffee",
    "thiswebsiteis.cool",
    "goingon.holiday",
    "illtakeyour.photo",
    "cleanoutyour.plumbing",
    "myboyfriendis.cool",
    "mygirlfriendis.smart",
    "whereareallthe.singles",
    "ilove.nyc",
    "abc.xyz",
    "idrink.beer",
  ];
  var test_price_types = [
    "day",
    "week",
    "month"
  ];
  var max_listings = Math.round(Math.random()*(5) + 5);

  //create a random amount of test listings
  for (var x = 0; x < max_listings; x++){
    var random_domain_index = Math.floor(Math.random()*test_domain_names.length);
    var test_listing = {
      domain_name : test_domain_names[random_domain_index],
      price_rate : Math.round(Math.random() * 25000),
      price_type : test_price_types[Math.floor(Math.random()*test_price_types.length)],
      compare : true
    }

    var domain_price_type_random = Math.random();
    if (domain_price_type_random > 0.8){
      test_listing.min_price = Math.ceil(Math.round(Math.random() * 10000)/1000)*100000;
    }
    else if (domain_price_type_random > 0.6){
      test_listing.buy_price = Math.ceil(Math.round(Math.random() * 10000)/1000)*200000;
    }
    else if (domain_price_type_random > 0.4){
      test_listing.rentable = 1;
    }
    else if (domain_price_type_random > 0.3){
      test_listing.rentable = 1;
      test_listing.price_rate = 0;
    }
    else {
      test_listing.status = 1;
    }

    test_listings.push(test_listing);
    test_domain_names.splice(random_domain_index, 1);
  }

  //create the test domains
  createOtherDomains(test_listings);
}

//create test rentals
function createTestRentals(){
  var temp_rentals = [];
  var one_year_ago = moment().subtract(1, "year")._d.getTime();
  var time_since_one_year = new Date().getTime() - one_year_ago;

  var max_rentals_count = Math.floor(Math.random()*(5) + 20);
  for (var x = 0; x < max_rentals_count; x++){

    var temp_rental = {
      date : Math.floor(Math.random()*(time_since_one_year) + one_year_ago),
      duration : Math.random() * 604800000,
      views : Math.floor(Math.random() * 100000),
    }

    //80% of the time it's a random char, 20% anonymous
    if (Math.random() > 0.2){
      var random_char_index = Math.floor(Math.random() * random_characters.length);
      var random_char_from = random_characters[random_char_index];
      temp_rental.username = random_char_from.name;
      temp_rental.path = random_char_from.email.split("@")[0];
      temp_rental.address = "http://www." + random_char_from.email.split("@")[1];
    }
    else {
      temp_rental.address = "https://domahub.com";
    }

    //showing content
    if (Math.random() > 0.1){
      temp_rental.type = 0
      var content_random = Math.random();

      if (content_random > 0.8){
        temp_rental.address = temp_rental.address + "/cool.jpg";
      }
      else if (content_random > 0.6){
        temp_rental.address = temp_rental.address + "/funny.gif";
      }
      else if (content_random > 0.4){
        temp_rental.address = temp_rental.address + "/document.pdf";
      }
      else if (content_random > 0.3){
        temp_rental.address = "";
      }
    }

    temp_rentals.push(temp_rental);
  }

  temp_rentals.sort(function(a, b){
    if (a["date"] < b["date"]){
      return -1;
    }
    if (a["date"] > b["date"]) {
      return 1;
    }
    return 0;
  });

  listing_info.rentals = temp_rentals;
}

//#endregion

//#region ---------------------------------UPDATE HANDLERS--------------------------------------------------

//do submit buy handler
function testSubmitBuyHandler(button_id){
  setTimeout(function(){
    $("#" + button_id).removeClass('is-loading');
    successMessage("Success! If this were your real domain, you would receive a notification with the details of this new offer once it has been verified.");
  }, 500);
}

//do submit rent handler
function testSubmitRentHandler(){
  setTimeout(function(){
    successMessage("Success! If this were your real domain, the user would be redirected to a checkout page where they can edit the details of their domain rental.");
  }, 500);
}

//handle submit calendar handler
function testCalendarHandler(){
  $("#calendar-regular-message").removeClass('is-hidden');
  if (!listing_info.rental_moments){
    listing_info.rental_moments = [];
    var random_rentals_count = 24;
    for (var x = 0; x < random_rentals_count; x++){
      var start_of_month = moment().add(x, "months").startOf("month")._d.getTime();
      var end_of_month = moment().add(x, "months").endOf("month")._d.getTime();

      var random_start = randomIntFromInterval(start_of_month, end_of_month);
      var random_duration = 86400000 * randomIntFromInterval(5, 7);

      var temp_rental = {
        start : moment(random_start),
        end : moment(random_start + random_duration)
      }
      listing_info.rental_moments.push(temp_rental);
    }
    setUpCalendar(listing_info);
  }
  else {
    setUpCalendar(listing_info);
  }
}

//#endregion

//#region ---------------------------------HELPER FUNCTIONS--------------------------------------------------

function randomIntFromInterval(min,max){
  return Math.floor(Math.random()*(max-min+1)+min);
}

window.mobilecheck = function() {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};

function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
  results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function updateQueryStringParam(key, value) {

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
  window.history.replaceState({}, "", baseUrl + params);
};

//#endregion
