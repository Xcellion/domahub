var profile_demo_tour;

$(document).ready(function(){

  //set up immediately if demo
  if (user.username == "DomaHubDemo"){
    setupDomaTutorial();
  }

  //restart tour
  $("#restart-tour-button").on("click", function(){
    restartTutorial();
  });
});

function setupDomaTutorial(){
  console.log("Initializing DomaHub Demo...");

  profile_demo_tour = new Tour({
    // debug : true,
    backdrop : true,
    smartPlacement : true,
    name : "profile_demo",
    template : "<div class='popover tour'> \
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
    steps : [

      //main welcome step - 0
      {
        template: "<div class='popover tour'> \
                    <h3 class='popover-title'></h3> \
                    <div class='popover-content content'></div> \
                    <div> \
                      <div class='control is-grouped'> \
                        <div class='control is-expanded'> \
                          <button class='button is-stylish is-fullwidth is-small is-primary' data-role='next'> \
                            <span class='icon is-small'> \
                              <i class='fal fa-thumbs-up'></i> \
                            </span> \
                            <span>Yes! Show me how it works.</span> \
                          </button> \
                        </div> \
                        <div class='control is-expanded'> \
                          <button class='button is-stylish is-fullwidth is-small is-danger is-outlined' data-role='end'> \
                            <span class='icon is-small'> \
                              <i class='fal fa-frown'></i> \
                            </span> \
                            <span>No, I'll figure it out.</span> \
                          </button> \
                        </div> \
                      </div> \
                    </div>",
        title: "Welcome to the DomaHub demo!",
        content: "This demo will guide you through the various tools available to DomaHub users.",
        path : "/profile/dashboard",
        orphan: true,
      },

      //dashboard traffic - 1
      {
        element : "#dashboard-traffic-card",
        content: "This is your DomaHub dashboard. Here you can see relevant statistics and charts about the traffic on your domain names.",
        path : "/profile/dashboard",
      },

      //dashboard portfolio overview - 2
      {
        element : "#dashboard-portfolio-card",
        content : "This is your portfolio overview. Here you can see relevant information about your domain names at a glance.",
        placement : $(".left-menu").is(":visible") ? "left" : "auto",
        next : $(".left-menu").is(":visible") ? 3 : 4,
        path : "/profile/dashboard",
      },

      //dashboard left menu - 3
      {
        element : ".left-menu",
        content : 'This is the navigation menu. Click Next to go to the <span class="is-bold">My Listings</span> page.',
        placement : "right",
        path : "/profile/dashboard",
        next : 5,
      },

      //dashboard left menu (mobile) - 4
      {
        element : ".nav-right",
        content : 'This is the navigation menu. Click Next to go to the <span class="is-bold">My Listings</span> page.',
        placement : "bottom",
        path : "/profile/dashboard",
        prev : 2,
      },

      //mylistings - 5
      {
        orphan : true,
        content : 'This is the <span class="is-bold">My Listings</span> page--where you can edit related details or view offers for all of your existing domain name listings.',
        path : "/profile/mylistings",
        prev : $(".left-menu").is(":visible") ? 3 : 4,
      },

      //mylistings domain name table - 6
      {
        element : "#listings-table",
        content : "Try selecting a few listings using the checkboxes to the left of the domain names.",
        placement : "top",
        onShow : function(){
          //select verified domains if none are selected
          if (window.location.pathname == "/profile/mylistings"){
            showSelector();
          }
        }
      },

      //mylistings buttons - 7
      {
        element : "#domain-selector-toolbox",
        content : "Use these buttons to edit, view offers for, verify ownership of, or delete, your listings. Let's try editing some active listings by pressing on <span class='is-bold'>Edit Details</span>.",
        placement : "bottom",
        onShow : function(){
          //select verified domains if none are selected
          if (window.location.pathname == "/profile/mylistings"){
            showSelector();
            selectSpecificRows("editable", true);
          }
        }
      },

      //mylistings edit listings - 8
      {
        content : "This is the <span class='is-bold'>listings editing page</span>. Where you can change the information, design, and related details of your listings.",
        element : "#info-tab-drop",
        placement : "top",
        onShow : function(){
          //show editor
          if (window.location.pathname == "/profile/mylistings"){
            viewDomainDetails();
          }
        }
      },

      //mylistings edit design listings - 9
      {
        element : "#design-tab-drop",
        content : "This is the <span class='is-bold'>design tab</span> where you can change the look and feel of your listing pages.",
        placement : "top",
        onShow : function(){
          //show design tab
          if (window.location.pathname == "/profile/mylistings"){
            viewDomainDetails("design");
          }
        }
      },

      //mylistings offer view - 10
      {
        element : "#offers-table",
        content : "This is the <span class='is-bold'>offers tab</span> where you can view the various offers made for your domain names.",
        placement : "top",
        path : "/profile/mylistings",
        redirect : false,
        onShow : function(){
          //show design tab
          if (window.location.pathname == "/profile/mylistings"){
            viewDomainOffers()
          }
        }
      },

      //create listings - 11
      {
        orphan : true,
        content : "This is the <span class='is-bold'>Create Listings</span> page where you can manually or automatically create new listings for your domain names.",
        path : "/listings/create",
        prev : 10,
      },

      //create listings manual card - 11
      {
        element : "#manual-create-card",
        path : "/listings/create",
        content : "Enter your domain names here to create your listings manually.",
      },

      //create listings connect a registrar - 11
      {
        element : "#connect-registrar-card",
        content : "Or connect your registrar to create listings automatically.",
        placement : "left",
        path : "/listings/create",
      },

      //create listings connect a registrar - 11
      {
        orphan : true,
        content : "This is the <span class='is-bold'>Profile Settings</span> page. Here, you can edit your profile information, payment details, or view your total account earnings.",
        path : "/profile/settings",
      },

      //finished tutorial
      {
        orphan: true,
        template: "<div class='popover tour'> \
                    <h3 class='popover-title'></h3> \
                    <div class='popover-content content'></div> \
                    <div> \
                      <div class='control is-grouped'> \
                        <div class='control is-expanded'> \
                          <a href='/login' class='button is-stylish is-fullwidth is-small is-primary' " + ((user.username != "DomaHubDemo") ? "data-role='end'" : "") + "> \
                            <span class='icon is-small'> \
                              <i class='fal fa-thumbs-up'></i> \
                            </span> \
                            <span>" + ((user.username != "DomaHubDemo") ? "That was awesome! Thanks." : "That was awesome! Sign me up.") + "</span> \
                          </a> \
                        </div> \
                        <div class='control is-expanded'> \
                          <button id='tour-end-button' class='button is-stylish is-fullwidth is-small is-danger is-outlined' " + ((user.username != "DomaHubDemo") ? "data-role='restart'" : "data-role='end'") + "> \
                            <span class='icon is-small'> \
                              <i class='fal fa-sign-out'></i> \
                            </span> \
                            <span>" + ((user.username != "DomaHubDemo") ? "Replay demo." : "I still want to explore.") + "</span> \
                          </button> \
                        </div> \
                      </div> \
                    </div>",
        title: "That's the end of the DomaHub demo!",
        content: "If you have any further questions, please do not hesitate to <a href='/contact' class='is-primary is-underlined'>contact us</a>.",
        path : "/profile/dashboard",
      },

    ]
  });

  profile_demo_tour.init();
  profile_demo_tour.start();

  //restart button if not domademo
  if (user.username != "DomaHubDemo"){
    $("#tour-end-button").on("click", function(){
      profile_demo_tour.goTo(0);
    });
  }

  //click backdrop to end tour
  $(".tour-backdrop").off().on("click", function(){
    profile_demo_tour.end();
  });
}

function restartTutorial(){
  if (window.location.pathname != "/profile/dashboard"){
    window.location = "/profile/dashboard";
  }
  if (profile_demo_tour){
    profile_demo_tour.restart();
    profile_demo_tour.init();
    profile_demo_tour.start();
  }
  else {
    setupDomaTutorial();
  }
}
