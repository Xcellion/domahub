var default_descriptions = [
	"The perfect domain name to rent out!",
	"Rent me and you won't regret it!",
	"This is the greatest domain name to have ever existed--trust me.",
	'"WOW! I can&#8217;t believe that this domain is available for rent" -- Everyone',
	"Best value domain name. Period."
];

module.exports = {

	//return a random description
	random : function(){
		return default_descriptions[Math.floor(Math.random() * default_descriptions.length)];
	}

}
