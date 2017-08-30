var listing_themes = [
  {
    theme_name : "DomaHub",
    primary_color : "#3CBC8D",
    secondary_color : "#FF5722",
    tertiary_color : "#2196F3",
    font_name : "Lato",
    font_color : "#000000",
    background_color : "#FFFFFF",
    background_image : "",
  },
  {
    theme_name : "Aqua",
    primary_color : "#6681CC",
    secondary_color : "#1F79FF",
    tertiary_color : "#2860B5",
    font_name : "Verdana",
    font_color : "#FFFFFF",
    background_color : "#FFFFFF",
    background_image : "https://images.unsplash.com/photo-1474518665815-99456f56c531?dpr=1&w=1500&h=844&q=80",
  },
  {
    theme_name : "Bumblebee",
    primary_color : "#E8CF61",
    secondary_color : "#540000",
    tertiary_color : "#6B6B6B",
    font_name : "Courier",
    font_color : "#FFFFFF",
    background_color : "#222222",
    background_image : "",
  },
  {
    theme_name : "Desert",
    primary_color : "#000000",
    secondary_color : "#FF8800",
    tertiary_color : "#944444",
    font_name : "Verdana",
    font_color : "#FFFFFF",
    background_color : "#FFFFFF",
    background_image : "https://images.unsplash.com/photo-1492018706134-e84b8fafbc31?dpr=1&auto=format&fit=crop&w=1500&h=1000",
  },
  {
    theme_name : "Volcano",
    primary_color : "#E08E57",
    secondary_color : "#211B14",
    tertiary_color : "#944444",
    font_name : "Lato",
    font_color : "#FFFFFF",
    background_color : "#FFFFFF",
    background_image : "https://images.unsplash.com/photo-1497002961800-ea7dbfe18696?dpr=1&auto=format&fit=crop&w=1500&h=997&q=80",
  },
  {
    theme_name : "Minimal",
    primary_color : "#222222",
    secondary_color : "#878787",
    tertiary_color : "#0645AD",
    font_name : "Times New Roman",
    font_color : "#000000",
    background_color : "#FFFFFF",
    background_image : "",
  },
  {
    theme_name : "Inverse",
    primary_color : "#FFFFFF",
    secondary_color : "#878787",
    tertiary_color : "#0645AD",
    font_name : "Times New Roman",
    font_color : "#FFFFFF",
    background_color : "#000000",
    background_image : "",
  },
]

//function to populate theme dropdown
function populateThemeDropdown(){
  for (var x = 0; x < listing_themes.length; x++){
    var theme_name_display = (listing_themes[x].theme_name == "DomaHub") ? "DomaHub (Basic)" : listing_themes[x].theme_name;
    $("#theme-input").append($("<option value=" + listing_themes[x].theme_name + ">" + theme_name_display + "</option>"));
  }
  $("#theme-input").prepend($("<option value='Custom'>Custom</option>"));
}

//function to find specific theme
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
