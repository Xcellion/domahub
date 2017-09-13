var tutorial_tour;
var listing_description_tour = false;

$(document).ready(function() {
  if (compare){

    //delete notifications button
    $("#compare-msg .delete").on("click", function(e){
      $("#compare-msg").addClass('is-hidden');
      $("#compare-footer").removeClass('is-hidden').fadeIn(300);
    });

    //<editor-fold>---------------------------------COMPARE TOOL SETUP--------------------------------------------------

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
    updateRentable();

    //DESIGN TAB
    loadThemeHandler();
    loadBackgroundHandlers();
    loadColorSchemeHandlers();
    loadFontStyleHandlers();
    updateModules();

    //change to custom theme if anything is changed
    $(".theme-changeable-input").on("change", function(){
      $("#theme-input").val("Custom");
      $("#dh-footer").addClass('is-hidden');
      $("#navbar").addClass('is-hidden');
      updateQueryStringParam("theme", "Custom");
    });

    menuButtonHandlers();

    //</editor-fold>

    //<editor-fold>---------------------------------TUTORIAL--------------------------------------------------

    tutorial_tour = new Tour({
      storage: false,
      orphan: true,
      backdrop: true,
      name: "tutorial",
      template: "<div class='popover tour arrow-top'> \
                  <div class='popover-content margin-top-0 content'></div> \
                  <div class='popover-navigation'> \
                    <button class='button is-small' data-role='prev'> \
                      <span class='icon is-small'> \
                        <i class='fa fa-angle-double-left'></i> \
                      </span> \
                      <span>Prev</span> \
                    </button> \
                    <button class='button is-small is-primary' data-role='next'> \
                      <span>Next</span> \
                      <span class='icon is-small'> \
                        <i class='fa fa-angle-double-right'></i> \
                      </span> \
                    </button> \
                    <button class='button is-small' data-role='end'> \
                      <span class='icon is-small'> \
                        <i class='fa fa-sign-out'></i> \
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
          <div class='button-wrapper'> \
            <button class='button is-small is-primary' data-role='next'> \
              <span class='icon is-small'> \
                <i class='fa fa-thumbs-up'></i> \
              </span> \
              <span>Yes! Teach me how it works.</span> \
            </button> \
            <button class='button is-small is-danger is-outlined' data-role='end'> \
              <span class='icon is-small'> \
                <i class='fa fa-frown-o'></i> \
              </span> \
              <span>Nah, I'll figure it out myself.</span> \
            </button> \
            </div> \
          </div> \
          </div>",
          title: "Welcome to the DomaHub demo!",
          content: "This tutorial will guide you on how your domains can look as a DomaHub listing.",
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
          template: "<div class='popover tour arrow-top'> \
                      <div class='popover-content margin-top-0 content'></div> \
                      <div class='popover-navigation'> \
                        <div class='button-wrapper'> \
                          <button class='button is-small' data-role='prev'> \
                            <span class='icon is-small'> \
                              <i class='fa fa-angle-double-left'></i> \
                            </span> \
                            <span>Prev</span> \
                          </button> \
                          <button class='button is-small' data-role='end'> \
                            <span class='icon is-small'> \
                              <i class='fa fa-sign-out'></i> \
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
          template: "<div class='popover tour arrow-left'> \
                      <div class='popover-content margin-top-0 content'></div> \
                      <div class='popover-navigation'> \
                        <button class='button is-small' data-role='prev'> \
                          <span class='icon is-small'> \
                            <i class='fa fa-angle-double-left'></i> \
                          </span> \
                          <span>Prev</span> \
                        </button> \
                        <button class='button is-small is-primary' data-role='next'> \
                          <span>Next</span> \
                          <span class='icon is-small'> \
                            <i class='fa fa-angle-double-right'></i> \
                          </span> \
                        </button> \
                        <button class='button is-small' data-role='end'> \
                          <span class='icon is-small'> \
                            <i class='fa fa-sign-out'></i> \
                          </span> \
                          <span>End Tutorial</span> \
                        </button> \
                      </div> \
                    </div>",
          backdropContainer: "#compare-preview",
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
            $("#compare-preview").append("<div class='tour-backdrop'></div>");
          },
          onHide: function(){
            if (listing_description_tour && !listing_description_tour.ended()){
              listing_description_tour.end();
            }
            $("#compare-preview").find(".tour-backdrop").remove();
          },
          content: "Try editing the listing description! Remember, this is just a testing tool. Nothing is saved."
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
            $("#compare-preview").append("<div class='tour-backdrop'></div>");
          },
          onHide: function(){
            $("#compare-preview").find(".tour-backdrop").remove();
          },
          template: "<div class='popover tour arrow-top'> \
                      <div class='popover-content margin-top-0 content'></div> \
                      <div class='popover-navigation'> \
                        <button class='button is-small' data-role='prev'> \
                          <span class='icon is-small'> \
                            <i class='fa fa-angle-double-left'></i> \
                          </span> \
                          <span>Prev</span> \
                        </button> \
                        <button class='button is-small' data-role='end'> \
                          <span class='icon is-small'> \
                            <i class='fa fa-sign-out'></i> \
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
            $("#compare-preview").append("<div class='tour-backdrop'></div>");
          },
          onHide: function(){
            $("#compare-preview").find(".tour-backdrop").remove();
          },
          content: "Try editing the listing theme! If none of them fit your needs, you can always create a custom theme for your DomaHub listing."
        },

        //contact offer form - 6
        {
          element: "#buy-rent-column",
          backdropContainer: "#compare-preview",
          placement: (window.mobilecheck()) ? "top" : "left",
          onShow: function(){
            toggleMenu(false);
            showBuyStuff($("#buy-now-button"));
          },
          template: "<div class='popover tour arrow-right'> \
                      <div class='popover-content margin-top-0 content'></div> \
                      <div class='popover-navigation'> \
                        <button class='button is-small' data-role='prev'> \
                          <span class='icon is-small'> \
                            <i class='fa fa-angle-double-left'></i> \
                          </span> \
                          <span>Prev</span> \
                        </button> \
                        <button class='button is-small is-primary' data-role='next'> \
                          <span>Next</span> \
                          <span class='icon is-small'> \
                            <i class='fa fa-angle-double-right'></i> \
                          </span> \
                        </button> \
                        <button class='button is-small' data-role='end'> \
                          <span class='icon is-small'> \
                            <i class='fa fa-sign-out'></i> \
                          </span> \
                          <span>End Tutorial</span> \
                        </button> \
                      </div> \
                    </div>",
          content: 'Potential customers can use this form to contact you. All contact information is verified before you are notified of any new offers.'
        },

        //click rentable tab - 7
        {
          element: "#rent-now-button",
          backdropContainer: "#compare-preview",
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
                        <button class='button is-small' data-role='prev'> \
                          <span class='icon is-small'> \
                            <i class='fa fa-angle-double-left'></i> \
                          </span> \
                          <span>Prev</span> \
                        </button> \
                        <button class='button is-small' data-role='end'> \
                          <span class='icon is-small'> \
                            <i class='fa fa-sign-out'></i> \
                          </span> \
                          <span>End Tutorial</span> \
                        </button> \
                      </div> \
                    </div>",
          content: "At DomaHub, you can also choose to rent out your domains as a new source of revenue."
        },

        //rental tab - 8
        {
          element: "#buy-rent-column",
          backdropContainer: "#compare-preview",
          placement: (window.mobilecheck()) ? "top" : "left",
          onShow: function(){
            $("#compare-menu").append("<div class='tour-backdrop'></div>");
            showRentalStuff($("#rent-now-button"));
          },
          onHide: function(){
            $("#compare-menu").find(".tour-backdrop").remove();
          },
          template: "<div class='popover tour arrow-right'> \
                      <div class='popover-content margin-top-0 content'></div> \
                      <div class='popover-navigation'> \
                        <button class='button is-small' data-role='prev'> \
                          <span class='icon is-small'> \
                            <i class='fa fa-angle-double-left'></i> \
                          </span> \
                          <span>Prev</span> \
                        </button> \
                        <button class='button is-small is-primary' data-role='next'> \
                          <span>Next</span> \
                          <span class='icon is-small'> \
                            <i class='fa fa-angle-double-right'></i> \
                          </span> \
                        </button> \
                        <button class='button is-small' data-role='end'> \
                          <span class='icon is-small'> \
                            <i class='fa fa-sign-out'></i> \
                          </span> \
                          <span>End Tutorial</span> \
                        </button> \
                      </div> \
                    </div>",
          content: 'Customers use this calendar to rent the domain for variable lengths of time and forward the domain to their desired URL. All rentals are cross-checked against the <a href="https://developers.google.com/safe-browsing/" class="is-primary">Google Safe Browsing API.</a>'
        },

        //modules - 9
        {
          element: "#modules-wrapper",
          backdropContainer: "#compare-preview",
          placement: "top",
          onShow: function(){
            $("#compare-menu").append("<div class='tour-backdrop'></div>");
          },
          onHide: function(){
            $("#compare-menu").find(".tour-backdrop").remove();
          },
          template: "<div class='popover tour arrow-bottom'> \
                      <div class='popover-content margin-top-0 content'></div> \
                      <div class='popover-navigation'> \
                        <button class='button is-small' data-role='prev'> \
                          <span class='icon is-small'> \
                            <i class='fa fa-angle-double-left'></i> \
                          </span> \
                          <span>Prev</span> \
                        </button> \
                        <button class='button is-small is-primary' data-role='next'> \
                          <span>Next</span> \
                          <span class='icon is-small'> \
                            <i class='fa fa-angle-double-right'></i> \
                          </span> \
                        </button> \
                        <button class='button is-small' data-role='end'> \
                          <span class='icon is-small'> \
                            <i class='fa fa-sign-out'></i> \
                          </span> \
                          <span>End Tutorial</span> \
                        </button> \
                      </div> \
                    </div>",
          content: 'Additional information is displayed here--including links to other listings, domain traffic, and recent events.'
        },

        //final step - 10
        {
          autoScroll: true,
          title: "Thats the end of the DomaHub demo!",
          content: "If you have any further questions, please do not hesitate to <a href='/contact' class='is-accent'>contact us</a>.",
          onShow: function(){
            toggleMenu(false);
          },
          template: "<div class='popover tour'> \
            <h3 class='popover-title'></h3> \
            <div class='popover-content content'></div> \
            <div> \
              <div class='button-wrapper'> \
                <a href='/signup' class='button is-small is-primary'> \
                  <span class='icon is-small'> \
                    <i class='fa fa-thumbs-up'></i> \
                  </span> \
                  <span>That was awesome! Sign me up.</span> \
                </a> \
                <button class='button is-small is-danger is-outlined' data-role='end'> \
                  <span class='icon is-small'> \
                    <i class='fa fa-sign-out'></i> \
                  </span> \
                  <span>I still want to explore.</span> \
                </button> \
              </div> \
            </div> \
          </div>"
        },

      ]
    });

    tutorial_tour.init();
    tutorial_tour.start();

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

    //</editor-fold>

  }
});

//<editor-fold>-----------------------------------------------------------------------------------MENU

//function to hide and show menu
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

//function to show or hide menu
function toggleMenu(show){
  if (show){
    $("#compare-menu").addClass("is-active");
    $("#compare-preview").addClass("is-active");
    $("#show-menu-button").fadeIn(100).addClass("is-hidden");
  }
  else {
    $("#compare-menu").removeClass("is-active");
    $("#compare-preview").removeClass("is-active");
    $("#show-menu-button").fadeIn(100).removeClass("is-hidden");
  }
}

//</editor-fold>

//<editor-fold>-----------------------------------------------------------------------------------THEMES

//function to switch theme
function switchTheme(theme_name){
  console.log("Switching theme...");
  var theme_to_load = findTheme(theme_name);

  //changing theme during tutorial
  $("#compare-preview").find(".tour-backdrop").remove();

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

  //hide footer/navbar if it's not a basic theme
  if (theme_to_load.theme_name != "DomaHub"){
    $("#dh-footer").addClass('is-hidden');
    $("#navbar").addClass('is-hidden');
  }
  else {
    $("#dh-footer").removeClass('is-hidden');
    $("#navbar").removeClass('is-hidden');
  }

  updateBackgroundImage(listing_info.background_image);
  updateBackgroundColor(listing_info.background_color);
  updateFontName(listing_info.font_name);
  updateColorScheme(listing_info.primary_color, listing_info.secondary_color, listing_info.tertiary_color);
  updateFontColor(listing_info.font_color);
  updateFontName(listing_info.font_name);

  $("#theme-input").val(theme_to_load.theme_name);
  updateQueryStringParam("theme", theme_to_load.theme_name);
}

//</editor-fold>

//<editor-fold>-----------------------------------------------------------------------------------INFO TAB

//function to update the description
function updateDescription(){
  var listing_description = getParameterByName("description") || listing_info.description;
  $("#description").val(listing_description).on("input", function(){
    $("#description-text").text($(this).val());
    listing_info.description = $(this).val();

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
            $("#compare-preview").find(".tour-backdrop").remove();
          },
          steps: [
            //description is edited! - 4
            {
              element: "#description-text",
              placement: "right",
              backdrop: true,
              animation: false,
              backdropContainer: "#compare-preview",
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
  });
}

//function to update pricing
function updatePricing(){
  var buy_price = getParameterByName("buy_price") || listing_info.buy_price;
  $("#buy-price-input").val(buy_price).on("input", function(){
    listing_info.buy_price = $(this).val();
    $("#buy-button").text("Buy now - " + moneyFormat.to(parseFloat(listing_info.buy_price)));
  });
  var min_price = getParameterByName("min_price") || listing_info.min_price;
  $("#min-price-input").val(min_price).on("input", function(){
    if ($(this).val() > 0){
      $("#min-price-tag").removeClass('is-hidden');
      $("#min-price-tag").text("For sale - " + moneyFormat.to(parseFloat($(this).val())));
      $("#min-price").removeClass('is-hidden').text(" (Minimum " + moneyFormat.to(parseFloat($(this).val())) + ")");
      $("#contact_offer").attr("placeholder", $(this).val());
    }
    else {
      $("#min-price-tag").addClass('is-hidden');
      $("#min-price").addClass('is-hidden');
      $("#contact_offer").attr("placeholder", "");
    }
    listing_info.min_price = $(this).val();
  });
  var price_rate = getParameterByName("price_rate") || listing_info.price_rate;
  $("#price-rate-input").val(price_rate).on("input", function(){
    listing_info.price_rate = $(this).val();
    // updateQueryStringParam("price_rate", $(this).val());
    var current_price = parseFloat($(this).val()) || 0;
    if (current_price == 0){
      $("#rent-price-tag").text("For rent - Free");
    }
    else {
      $("#rent-price-tag").text("For rent - " + moneyFormat.to(current_price) + " / " + $("#price-type-input").val());
    }
  });
  var price_type = getParameterByName("price_type") || listing_info.price_type;
  $("#price-type-input").val(price_type).on("input", function(){
    listing_info.price_type = $(this).val();
    // updateQueryStringParam("price_type", $(this).val());
    var current_price = parseFloat($("#price-rate-input").val()) || 0;
    if (current_price == 0){
      $("#rent-price-tag").text("For rent - Free");
    }
    else {
      $("#rent-price-tag").text("For rent - " + moneyFormat.to(current_price) + " / " + $("#price-type-input").val());
    }
  });
}

//function to update BIN
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

//function to update rentable
function updateRentable(){
  checkBox(listing_info.rentable, $("#rentable-input"));

  $("#rentable-input").on("change", function(){
    //switch to buy tab if on rent tab
    showBuyStuff($("#buy-now-button"));

    //allow rent
    if ($(this).prop("checked")){
      listing_info.rentable = 1;
      $("#rent-price-tag").removeClass('is-hidden');
      $("#buy-rent-tabs").removeClass('is-hidden');
    }

    //dont allow rent
    else {
      listing_info.rentable = 0;
      $("#rent-price-tag").addClass('is-hidden');
      $("#buy-rent-tabs").addClass('is-hidden');
    }
  });
}

//</editor-fold>

//<editor-fold>-----------------------------------------------------------------------------------DESIGN TAB

//function to load background handlers
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

  //load background color handler
  $("#background-color-input").minicolors({
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
    $("#compare-preview").css("background", "");
  }
  else {
    $("#compare-preview").css("background", "url(" + background_image + ") center/cover no-repeat");
  }
}

//input to update background color and the page
function updateBackgroundColor(background_color){
  listing_info.background_color = background_color;
  $("#background-color-input").val(background_color);
  $("#compare-preview").css("background-color", background_color);
}

//load color scheme handlers
function loadColorSchemeHandlers(){
  var minicolor_options = {
    letterCase: "uppercase",
    swatches: ["#3cbc8d", "#FF5722", "#2196F3"]
  }
  $("#primary-color-input").minicolors(minicolor_options).off().on("change", function(){
    updateColorScheme($(this).val(), false, false);
  });
  $("#secondary-color-input").minicolors(minicolor_options).off().on("change", function(){
    updateColorScheme(false, $(this).val(), false);
  });
  $("#tertiary-color-input").minicolors(minicolor_options).off().on("change", function(){
    updateColorScheme(false, false, $(this).val());
  });
}

//inputs to update color scheme
function updateColorScheme(primary_color, secondary_color, tertiary_color){
  if (primary_color != false){
    listing_info.primary_color = primary_color;
    $("#primary-color-input").val(primary_color);
    setupCustomColors();

    if (traffic_chart){
      traffic_chart.data.datasets[0].backgroundColor = ColorLuminance(primary_color, 0.2);
      traffic_chart.data.datasets[0].borderColor = primary_color;
      traffic_chart.update();
    }
  }
  if (secondary_color != false){
    listing_info.secondary_color = secondary_color;
    $("#secondary-color-input").val(secondary_color);
    setupCustomColors();
  }
  if (tertiary_color != false){
    listing_info.tertiary_color = tertiary_color;
    $("#tertiary-color-input").val(tertiary_color);
    setupCustomColors();
  }
}

//load the font styling handlers
function loadFontStyleHandlers(){
  //font color
  $("#font-color-input").minicolors({
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

//function to update font color
function updateFontColor(font_color){
  listing_info.font_color = font_color;
  $("#font-color-input").val(font_color);
  setupCustomColors();
}

//function to update font name
function updateFontName(font_name){
  listing_info.font_name = font_name;
  $("#font-name-input").val(font_name)
  setupCustomColors();
}

//function to update modules
function updateModules(){
  checkBox(listing_info.traffic_module, $("#traffic-module-input"));
  checkBox(listing_info.info_module, $("#info-module-input"));
  checkBox(listing_info.history_module, $("#ticker-module-input"));

  $(".module-input").on("change", function(){
    var which_module = $(this).attr("id").split("-")[0];
    var selected_position = $("#" + which_module + "-tab").data('position');
    var current_position = $(".module-tab.is-active").data('position');

    //selected position is current position
    if (selected_position == current_position || current_position == undefined){
      $(".module").addClass('is-active');
      $(".module-tab").removeClass('is-active');
      hideShowModules(which_module, $(this).prop("checked"), false);

      //show next one if nothing is showing
      var next_visible = $(".module-tab:not(.is-hidden)").first();
      if (next_visible.attr("id")){
        var next_visible_id = next_visible.attr("id").split("-")[0];
        $("#" + next_visible_id + "-module").removeClass('is-hidden');
        next_visible.addClass('is-active');
      }
    }
    else {
      hideShowModules(which_module, $(this).prop("checked"), true);
    }
  });
}

//function to handle showing modules
function hideShowModules(which_module, checked, tabOnly){
  if (checked){
    if (!tabOnly){
      $("#" + which_module + "-module").removeClass('is-hidden');
    }
    $("#" + which_module + "-tab").removeClass('is-hidden');
  }
  else {
    if (!tabOnly){
      $("#" + which_module + "-module").addClass('is-hidden');
    }
    $("#" + which_module + "-tab").addClass('is-hidden');
  }
}

//function to check the module boxes according to value
function checkBox(module_value, elem){
  if (module_value){
    elem.val(module_value).prop("checked", true);
  }
  else {
    elem.val(module_value).prop("checked", false);
  }
}

//</editor-fold>

//<editor-fold>-----------------------------------------------------------------------------------MODULES

//function to create a test chart
function createTestChart(){

  if (traffic_chart){
    traffic_chart.destroy();
  }

  listing_info.traffic = [];
  createTrafficChart();
}

//function to create test domains
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
  var max_listings = Math.round(Math.random()*(5) + 8);

  //create a random amount of test listings
  for (var x = 0; x < max_listings; x++){
    var random_domain_index = Math.floor(Math.random()*test_domain_names.length);
    var test_listing = {
      domain_name : test_domain_names[random_domain_index],
      price_rate : Math.round(Math.random() * 250),
      price_type : test_price_types[Math.floor(Math.random()*test_price_types.length)],
      compare : true
    }

    var domain_price_type_random = Math.random();
    if (domain_price_type_random > 0.8){
      test_listing.min_price = Math.ceil(Math.round(Math.random() * 10000)/1000)*1000;
    }
    else if (domain_price_type_random > 0.6){
      test_listing.buy_price = Math.ceil(Math.round(Math.random() * 10000)/1000)*2000;
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

//function to create test rentals
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
      var random_char = random_characters[random_char_index];
      random_characters.splice(random_char_index, 1);

      temp_rental.username = random_char.name;
      temp_rental.path = random_char.email.split("@")[0];
      temp_rental.address = "http://www." + random_char.email.split("@")[1];
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

//</editor-fold>

//<editor-fold>-----------------------------------------------------------------------------------UPDATE HANDLERS

//function to do submit buy handler
function testSubmitBuyHandler(){
  setTimeout(function(){
    $("button[type=submit][clicked=true]").removeClass('is-loading');
    $("#contact-success-compare").removeClass('is-hidden').addClass('is-active');
  }, 500);
}

//function to do submit rent handler
function testSubmitRentHandler(checkout_button){
  setTimeout(function(){
    checkout_button.removeClass('is-loading').addClass('is-disabled').on('click', function(){
      submitTimes(checkout_button);
    });
    $("#rental-success-compare").removeClass('is-hidden').addClass('is-active');
  }, 500);
}

//function to handle submit calendar handler
function testCalendarHandler(){
  setTimeout(function(){
    $("#calendar").removeClass('is-disabled');
    $("#calendar-loading-message").addClass('is-hidden');
    $("#calendar-regular-message").removeClass('is-hidden');

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
  }, 500);
}

//</editor-fold>

//<editor-fold>-----------------------------------------------------------------------------------HELPER FUNCTIONS

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

//</editor-fold>
