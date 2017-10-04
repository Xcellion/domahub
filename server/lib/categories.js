//alphabetical please
var all_categories = [
  {
    back: "adult",
    front: "Adult"
  },
  {
    back: "art",
    front: "Art"
  },
  {
    back: "automotive",
    front: "Automotive"
  },
  {
    back: "brandable",
    front: "Brandable"
  },
  {
    back: "business",
    front: "Business"
  },
  {
    back: "currency",
    front: "Currency"
  },
  {
    back: "dating",
    front: "Dating"
  },
  {
    back: "ecard",
    front: "E-Card"
  },
  {
    back: "education",
    front: "Education"
  },
  {
    back: "event",
    front: "Event"
  },
  {
    back: "family",
    front: "Family"
  },
  {
    back: "financial",
    front: "Financial"
  },
  {
    back: "food",
    front: "Food"
  },
  {
    back: "gaming",
    front: "Gaming"
  },
  {
    back: "health",
    front: "Health"
  },
  {
    back: "hightraffic",
    front: "High-Traffic"
  },
  {
    back: "holiday",
    front: "Holiday"
  },
  {
    back: "home",
    front: "Home"
  },
  {
    back: "industry",
    front: "Industry"
  },
  {
    back: "information",
    front: "Information"
  },
  {
    back: "insurance",
    front: "Insurance"
  },
  {
    back: "keywords",
    front: "Key-words"
  },
  {
    back: "legal",
    front: "Legal"
  },
  {
    back: "niche",
    front: "Niche",
  },
  {
    back: "marketing",
    front: "Marketing"
  },
  {
    back: "music",
    front: "Music"
  },
  {
    back: "other",
    front: "Other"
  },
  {
    back: "personal",
    front: "Personal"
  },
  {
    back: "politics",
    front: "Politics"
  },
  {
    back: "promotion",
    front: "Promotion"
  },
  {
    back: "realestate",
    front: "Real Estate"
  },
  {
    back: "religion",
    front: "Religion"
  },
  {
    back: "science",
    front: "Science"
  },
  {
    back: "shopping",
    front: "Shopping"
  },
  {
    back: "short",
    front: "Short"
  },
  {
    back: "sports",
    front: "Sports"
  },
  {
    back: "startup",
    front: "Start-Up"
  },
  {
    back: "technology",
    front: "Technology"
  },
  {
    back: "travel",
    front: "Travel"
  },
  {
    back: "vr",
    front: "VR"
  }
]

module.exports = {

  //return all possible categories
  all : function(){
    return all_categories;
  },

  //return all possible categories as a string
  allFrontAsString : function(){
    return all_categories.map(function(a) {
      return a["front"];
    }).join(" ");
  },

  //return random 5-10 categories as a string
  randomFrontAsString : function(){
    return getUnique(Math.round(Math.random(5) + 5)).map(function(a) {
      return a["front"];
    }).join(" ");
  },

  //categories that are formatted for the back-end
  back : function(){
    var back_array = [];
    all_categories.map(function(v){
      back_array.push(v.back);
    });
    return back_array;
  },

  //categories that are formatted for the back-end
  front : function(){
    var front_array = [];
    all_categories.map(function(v){
      front_array.push(v.front);
    });
    return front_array;
  },

  //if the posted category exists
  existsBack : function(category){
    for (var x = 0; x < all_categories.length; x++){
      if (all_categories[x].back.toLowerCase() == category){
        return true;
      }
    }
    return false;
  }

}

function getUnique(count) {
  // Make a copy of the array
  var tmp = all_categories.slice(all_categories);
  var ret = [];

  for (var i = 0; i < count; i++) {
    var index = Math.floor(Math.random() * tmp.length);
    var removed = tmp.splice(index, 1);
    // Since we are only removing one element
    ret.push(removed[0]);
  }
  return ret;
}
