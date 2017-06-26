var default_descriptions = [
  "The greatest domain name ever!",
  "This is the perfect domain for your next venture or company.",
  "This is the greatest domain name to have ever existed--trust me.",
  '"WOW! I cannot believe that this domain is available" -- Everyone',
  "Best value domain name. Period."
];

module.exports = {

  //return a random description
  random : function(){
    return default_descriptions[Math.floor(Math.random() * default_descriptions.length)];
  }

}
