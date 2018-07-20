//alphabetical please
var all_categories = [
  {
    back: "2letters",
    front: "2 Letters"
  },
  {
    back: "3letters",
    front: "3 Letters"
  },
  {
    back: "4letters",
    front: "4 Letters"
  },
  {
    back: "5letters",
    front: "5 Letters"
  },
  {
    back: "adult",
    front: "Adult"
  },
  {
    back: "animals",
    front: "Animals"
  },
  {
    back: "apps",
    front: "Apps"
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
    back: "beauty",
    front: "Beauty"
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
    back: "career",
    front: "Career"
  },
  {
    back: "currency",
    front: "Currency"
  },
  {
    back: "crypto",
    front: "Crypto"
  },
  {
    back: "dating",
    front: "Dating"
  },
  {
    back: "design",
    front: "Design"
  },
  {
    back: "drones",
    front: "Drones"
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
    back: "electronics",
    front: "Electronics"
  },
  {
    back: "emoji",
    front: "Emoji"
  },
  {
    back: "entertainment",
    front: "Entertainment"
  },
  {
    back: "environment",
    front: "Environment"
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
    back: "fashion",
    front: "Fashion"
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
    back: "fun",
    front: "Fun"
  },
  {
    back: "gaming",
    front: "Gaming"
  },
  {
    back: "gambling",
    front: "Gambling"
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
    back: "idn",
    front: "IDN"
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
    back: "international",
    front: "International"
  },
  {
    back: "internet",
    front: "Internet"
  },
  {
    back: "kids",
    front: "Kids"
  },
  {
    back: "keywords",
    front: "Key-words"
  },
  {
    back: "lifestyle",
    front: "Lifestyle"
  },
  {
    back: "legal",
    front: "Legal"
  },
  {
    back: "logistics",
    front: "Logistics"
  },
  {
    back: "love",
    front: "Love"
  },
  {
    back: "luxury",
    front: "Luxury"
  },
  {
    back: "news",
    front: "News",
  },
  {
    back: "niche",
    front: "Niche",
  },
  {
    back: "marijuana",
    front: "Marijuana"
  },
  {
    back: "marketing",
    front: "Marketing"
  },
  {
    back: "media",
    front: "Media"
  },
  {
    back: "medicine",
    front: "Medicine"
  },
  {
    back: "mine",
    front: "Mine"
  },
  {
    back: "mining",
    front: "Mining"
  },
  {
    back: "mobile",
    front: "Mobile"
  },
  {
    back: "movies",
    front: "Movies"
  },
  {
    back: "music",
    front: "Music"
  },
  {
    back: "new",
    front: "New"
  },
  {
    back: "nonprofit",
    front: "Non-Profit"
  },
  {
    back: "numbers",
    front: "Numbers"
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
    back: "robot",
    front: "Robot"
  },
  {
    back: "sales",
    front: "Sales"
  },
  {
    back: "science",
    front: "Science"
  },
  {
    back: "security",
    front: "Security"
  },
  {
    back: "services",
    front: "Services"
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
    back: "social",
    front: "Social"
  },
  {
    back: "software",
    front: "Software"
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
    back: "telecommunication",
    front: "Telecommunication"
  },
  {
    back: "toys",
    front: "Toys"
  },
  {
    back: "travel",
    front: "Travel"
  },
  {
    back: "transportation",
    front: "Transportation"
  },
  {
    back: "video",
    front: "Video"
  },
  {
    back: "vr",
    front: "VR"
  },
  {
    back: "wellness",
    front: "Wellness"
  },
  {
    back: "yours",
    front: "Yours"
  },
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
  randomBackAsString : function(){
    return getUnique(Math.round(Math.random(5) + 5)).map(function(a) {
      return a["back"];
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

  //categories that are formatted for the front-end
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
