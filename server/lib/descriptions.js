var default_descriptions = [
  "The greatest domain name ever!",
  "This is the perfect domain for your next venture or company.",
  "The perfect domain for your next venture or company.",
  "The greatest domain for your next project.",
  "This is the greatest domain name to have ever existed--trust me.",
  '"WOW! I cannot believe that this domain is available" -- Everyone',
  "Best value domain name. Period.",
  "A great venture starts with a great domain name. Buy yours today!",
  "The greatest domain at the greatest price.",
  "Buy this domain today and start your next adventure!"
];

module.exports = {

  //return a random description
  random : function(){
    return default_descriptions[Math.floor(Math.random() * default_descriptions.length)];
  }

}
