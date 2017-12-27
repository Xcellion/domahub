var listing_themes = [
  {
    theme_name : "DomaHub",
    primary_color : "#3CBC8D",
    secondary_color : "#FF5722",
    tertiary_color : "#777",
    font_name : "Rubik",
    font_color : "#1b2733",
    background_color : "#FFFFFF",
    background_image : ""
  },
  {
    theme_name : "Aqua",
    primary_color : "#6681CC",
    secondary_color : "#CCB166",
    tertiary_color : "#2860B5",
    font_name : "Verdana",
    font_color : "#FFFFFF",
    background_color : "#FFFFFF",
    background_image : "https://images.unsplash.com/photo-1474518665815-99456f56c531?dpr=1&auto=format&fit=crop&w=1500&h=1000&q=20"
  },
  {
    theme_name : "RGB",
    primary_color : "#0033FF",
    secondary_color : "#FF2626",
    tertiary_color : "#1CC788",
    font_name : "Rubik",
    font_color : "#222222",
    background_color : "#FFFFFF",
    background_image : ""
  },
  {
    theme_name : "Bumblebee",
    primary_color : "#E8CF61",
    secondary_color : "#FF6600",
    tertiary_color : "#898989",
    font_name : "Courier",
    font_color : "#FFFFFF",
    background_color : "#222222",
    background_image : ""
  },
  {
    theme_name : "Canyon",
    primary_color : "#5DC278",
    secondary_color : "#70C6FF",
    tertiary_color : "#d9d9d9",
    font_name : "Verdana",
    font_color : "#FFFFFF",
    background_color : "#222222",
    background_image : "https://images.unsplash.com/photo-1480498244787-3b777eae847c?dpr=1&auto=format&fit=crop&w=1500&h=1000&q=20"
  },
  {
    theme_name : "Desert",
    primary_color : "#944444",
    secondary_color : "449494",
    tertiary_color : "#d9d9d9",
    font_name : "Verdana",
    font_color : "#FFF",
    background_color : "#FFFFFF",
    background_image : "https://images.unsplash.com/photo-1492018706134-e84b8fafbc31?dpr=1&auto=format&fit=crop&w=1500&h=1000&q=20"
  },
  {
    theme_name : "Inverse",
    primary_color : "#FFFFFF",
    secondary_color : "#747A85",
    tertiary_color : "#d9d9d9",
    font_name : "Bookman",
    font_color : "#FFFFFF",
    background_color : "#000000",
    background_image : ""
  },
  {
    theme_name : "Island",
    primary_color : "#85D6FF",
    secondary_color : "#FFAE84",
    tertiary_color : "#85D6FF",
    font_name : "Rubik",
    font_color : "#FFFFFF",
    background_color : "#FFFFFF",
    background_image : "https://images.unsplash.com/photo-1500111609242-145a52dcc944?dpr=1&auto=format&fit=crop&w=1500&h=1000&q=20"
  },
  {
    theme_name : "Minimal",
    primary_color : "#222222",
    secondary_color : "#878787",
    tertiary_color : "#0645AD",
    font_name : "Rubik",
    font_color : "#222222",
    background_color : "#FFFFFF",
    background_image : ""
  },
  {
    theme_name : "Mountain",
    primary_color : "#B35A00",
    secondary_color : "#007866",
    tertiary_color : "#d9d9d9",
    font_name : "Trebuchet MS",
    font_color : "#FFFFFF",
    background_color : "#FFFFFF",
    background_image : "https://images.unsplash.com/photo-1504890231393-71b0d15a05f4?dpr=1&auto=format&fit=crop&w=1500&h=1000&q=20"
  },
  {
    theme_name : "Volcano",
    primary_color : "#D53C1B",
    secondary_color : "#211B14",
    tertiary_color : "#D53C1B",
    font_name : "Rubik",
    font_color : "#FFFFFF",
    background_color : "#FFFFFF",
    background_image : "https://images.unsplash.com/photo-1504344977555-430929e2c4ba?dpr=1&auto=format&fit=crop&w=1500&h=1000&q=20"
  }
]

//populate theme dropdown
function populateThemeDropdown(){
  $("#theme-input").empty();
  for (var x = 0; x < listing_themes.length; x++){
    var theme_name_display = (listing_themes[x].theme_name == "DomaHub") ? "DomaHub (Basic)" : listing_themes[x].theme_name;
    $("#theme-input").append($("<option value=" + listing_themes[x].theme_name + ">" + theme_name_display + "</option>"));
  }
  $("#theme-input").prepend($("<option value='Custom'>Custom</option>"));
}

//find specific theme
function findTheme(theme_name){
  //random theme that isnt domahub
  if (theme_name.toLowerCase() == "random"){
    var random_num = Math.floor(Math.random() * (listing_themes.length - 1)) + 1;
    return listing_themes[random_num];
  }

  //loop through and find a specific theme
  for (var x = 0; x < listing_themes.length; x++){
    if (theme_name.toLowerCase() == listing_themes[x].theme_name.toLowerCase()){
      return listing_themes[x];
    }
  }
}

//update theme selector
function loadThemeHandler(){
  //swtich theme selector
  $("#theme-input").on("input", function(){
    switchTheme($(this).val());
  });

  //get a unique random theme
  $("#random-theme-button").off().on("click", function(){
    var new_theme = getRandomTheme();
    while ($("#theme-input").val() == new_theme){
      new_theme = getRandomTheme();
    }
    $("#theme-input").val(new_theme);
    switchTheme(new_theme);
  });

  //get a random theme
  function getRandomTheme(){
    var themes_array = $("#theme-input option").map(function(){ if ($(this).val() != "Custom") { return $(this).val() } } ).get();
    var random_index = Math.floor(Math.random() * themes_array.length);
    return themes_array[random_index];
  }
}
