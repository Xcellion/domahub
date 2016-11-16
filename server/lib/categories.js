var all_categories = [
	{
		back: "ecard",
		front: "E-Card"
	},
	{
		back: "personal",
		front: "Personal"
	},
	{
		back: "startup",
		front: "Start-Up"
	},
	{
		back: "business",
		front: "Business"
	},
	{
		back: "event",
		front: "Event"
	},
	{
		back: "promotion",
		front: "Promotion"
	},
	{
		back: "holiday",
		front: "Holiday"
	},
	{
		back: "industry",
		front: "Industry"
	}
]

module.exports = {

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
